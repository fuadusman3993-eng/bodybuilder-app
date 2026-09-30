import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/colors';

const BG = '#0A0F1A';

function timeStr(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatRoom() {
  const router = useRouter();
  const { conversationId, otherUserUid } = useLocalSearchParams<{ conversationId: string; otherUserUid: string }>();
  const { user } = useUserStore();

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<{ name: string; avatar: string }>({ name: '...', avatar: '' });
  const flatRef = useRef<FlatList>(null);

  // Fetch other user info from Firebase
  useEffect(() => {
    if (!otherUserUid) return;
    getDoc(doc(db, 'users', otherUserUid)).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setOtherUser({
          name: d.name || d.displayName || d.username || 'User',
          avatar: d.avatar || d.photoURL || '',
        });
      }
    }).catch(() => {});
  }, [otherUserUid]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setLoading(false);
    // Mark as read
    supabase.from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_uid', user.uid)
      .then();
  }, [conversationId, user.uid]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;
    const channelId = `messages_${conversationId}_${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  // Auto scroll on load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [loading]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || !conversationId) return;
    setSending(true);
    setText('');

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_uid: user.uid,
      text: trimmed,
    });

    if (!error) {
      // Update conversation last message
      await supabase.from('conversations').update({
        last_message: trimmed,
        last_message_at: new Date().toISOString(),
      }).eq('id', conversationId);
    }

    setSending(false);
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender_uid === user.uid;
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isMe && (
          <View style={styles.avatarSmall}>
            {otherUser.avatar
              ? <Image source={{ uri: otherUser.avatar }} style={styles.avatarImg} />
              : <Text style={styles.avatarInitial}>{otherUser.name[0]?.toUpperCase()}</Text>}
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
            {item.text}
          </Text>
          <Text style={styles.timeLabel}>{timeStr(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerUser}>
          {otherUser.avatar
            ? <Image source={{ uri: otherUser.avatar }} style={styles.headerAvatar} />
            : <View style={styles.headerAvatarInitial}>
                <Text style={styles.headerInitialText}>{otherUser.name[0]?.toUpperCase()}</Text>
              </View>}
          <Text style={styles.headerName}>{otherUser.name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={60} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No messages yet. Say hi! 👋</Text>
              </View>
            }
          />

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textMuted}
              multiline
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!text.trim() || sending}
            >
              {sending
                ? <ActivityIndicator size="small" color="#000" />
                : <Ionicons name="send" size={20} color="#000" />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerUser: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 38, height: 38, borderRadius: 19 },
  headerAvatarInitial: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  headerInitialText: { color: '#000', fontWeight: '700', fontSize: 16 },
  headerName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },

  messagesList: { padding: 16, paddingBottom: 8, flexGrow: 1 },

  msgRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end' },
  msgRowRight: { justifyContent: 'flex-end' },
  msgRowLeft: { justifyContent: 'flex-start' },

  avatarSmall: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    marginRight: 8,
  },
  avatarImg: { width: 30, height: 30, borderRadius: 15 },
  avatarInitial: { color: '#000', fontWeight: '700', fontSize: 12 },

  bubble: {
    maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMe: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: 'rgba(30,41,59,0.9)', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTextMe: { color: '#000' },
  bubbleTextThem: { color: Colors.textPrimary },
  timeLabel: { fontSize: 10, color: 'rgba(0,0,0,0.4)', marginTop: 4, textAlign: 'right' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: Colors.textMuted, fontSize: 15 },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: BG,
  },
  input: {
    flex: 1, backgroundColor: 'rgba(30,41,59,0.8)',
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    color: Colors.textPrimary, fontSize: 15, maxHeight: 100,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
