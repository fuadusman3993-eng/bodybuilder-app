import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, Image,
  ActivityIndicator, Alert, Modal, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/colors';

// expo-av only imported on native
let Audio: any = null;
if (Platform.OS !== 'web') {
  Audio = require('expo-av').Audio;
}

const BG = '#0A0F1A';

function timeStr(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtSecs(secs: number) {
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
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
  const [showSettings, setShowSettings] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSecs, setRecordingSecs] = useState(0);
  const recordingTimerRef = useRef<any>(null);
  const recDotAnim = useRef(new Animated.Value(1)).current;

  // Native: expo-av
  const nativeRecordingRef = useRef<any>(null);
  // Web: MediaRecorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Playback
  const [playingId, setPlayingId] = useState<string | null>(null);
  const nativeSoundRef = useRef<any>(null);
  const webAudioRef = useRef<HTMLAudioElement | null>(null);

  const flatRef = useRef<FlatList>(null);

  // Fetch other user info
  useEffect(() => {
    if (!otherUserUid) return;
    getDoc(doc(db, 'users', otherUserUid)).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setOtherUser({ name: d.name || d.displayName || d.username || 'User', avatar: d.avatar || d.photoURL || '' });
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
    if (user.uid) {
      supabase.from('messages').update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_uid', user.uid).then();
    }
  }, [conversationId, user.uid]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase.channel(`messages_${conversationId}_${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
        if (payload.new.sender_uid !== user.uid) {
          supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id).then();
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [loading]);

  // Pulse animation for recording dot
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recDotAnim, { toValue: 0.2, duration: 600, useNativeDriver: true }),
          Animated.timing(recDotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      recDotAnim.stopAnimation();
      recDotAnim.setValue(1);
    }
  }, [isRecording]);

  // Send text message
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || !conversationId) return;
    setSending(true);
    setText('');
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_uid: user.uid,
      text: trimmed,
      is_read: false,
      type: 'text',
    });
    if (!error) {
      await supabase.from('conversations')
        .update({ last_message: trimmed, last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    }
    setSending(false);
  };

  // ─── Recording (Web) ───────────────────────────────
  const startRecordingWeb = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = e => audioChunksRef.current.push(e.data);
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordingSecs(0);
      recordingTimerRef.current = setInterval(() => setRecordingSecs(s => s + 1), 1000);
    } catch {
      Alert.alert('Error', 'Microphone access denied');
    }
  };

  const stopAndSendWeb = async () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    clearInterval(recordingTimerRef.current);
    const dur = recordingSecs;
    setIsRecording(false);
    setSending(true);
    mr.stop();
    mr.stream.getTracks().forEach(t => t.stop());

    mr.onstop = async () => {
      try {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const fileName = `voice_${user.uid}_${Date.now()}.webm`;
        const { error: upErr } = await supabase.storage
          .from('voice-messages')
          .upload(fileName, blob, { contentType: 'audio/webm', upsert: true });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('voice-messages').getPublicUrl(fileName);
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_uid: user.uid,
          text: '🎤 Voice message',
          audio_url: urlData.publicUrl,
          audio_duration: dur,
          is_read: false,
          type: 'audio',
        });
        await supabase.from('conversations')
          .update({ last_message: '🎤 Voice message', last_message_at: new Date().toISOString() })
          .eq('id', conversationId);
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Could not send voice message');
      }
      setSending(false);
    };
  };

  const cancelRecordingWeb = () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    clearInterval(recordingTimerRef.current);
    mr.stop();
    mr.stream.getTracks().forEach(t => t.stop());
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSecs(0);
  };

  // ─── Recording (Native) ────────────────────────────
  const startRecordingNative = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      nativeRecordingRef.current = recording;
      setIsRecording(true);
      setRecordingSecs(0);
      recordingTimerRef.current = setInterval(() => setRecordingSecs(s => s + 1), 1000);
    } catch {
      Alert.alert('Error', 'Microphone access denied');
    }
  };

  const stopAndSendNative = async () => {
    const rec = nativeRecordingRef.current;
    if (!rec) return;
    clearInterval(recordingTimerRef.current);
    const dur = recordingSecs;
    setIsRecording(false);
    setSending(true);
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      nativeRecordingRef.current = null;
      if (!uri) throw new Error('No audio URI');
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `voice_${user.uid}_${Date.now()}.m4a`;
      const { error: upErr } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, blob, { contentType: 'audio/m4a', upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('voice-messages').getPublicUrl(fileName);
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_uid: user.uid,
        text: '🎤 Voice message',
        audio_url: urlData.publicUrl,
        audio_duration: dur,
        is_read: false,
        type: 'audio',
      });
      await supabase.from('conversations')
        .update({ last_message: '🎤 Voice message', last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not send');
    }
    setSending(false);
  };

  const cancelRecordingNative = async () => {
    const rec = nativeRecordingRef.current;
    if (!rec) return;
    clearInterval(recordingTimerRef.current);
    await rec.stopAndUnloadAsync().catch(() => {});
    nativeRecordingRef.current = null;
    setIsRecording(false);
    setRecordingSecs(0);
  };

  const startRecording = Platform.OS === 'web' ? startRecordingWeb : startRecordingNative;
  const stopAndSend = Platform.OS === 'web' ? stopAndSendWeb : stopAndSendNative;
  const cancelRecording = Platform.OS === 'web' ? cancelRecordingWeb : cancelRecordingNative;

  // ─── Playback ──────────────────────────────────────
  const togglePlay = async (id: string, audioUrl: string) => {
    if (Platform.OS === 'web') {
      if (playingId === id) {
        webAudioRef.current?.pause();
        webAudioRef.current = null;
        setPlayingId(null);
        return;
      }
      webAudioRef.current?.pause();
      const audio = new window.Audio(audioUrl);
      webAudioRef.current = audio;
      setPlayingId(id);
      audio.play();
      audio.onended = () => { setPlayingId(null); webAudioRef.current = null; };
    } else {
      if (playingId === id) {
        await nativeSoundRef.current?.stopAsync();
        await nativeSoundRef.current?.unloadAsync();
        nativeSoundRef.current = null;
        setPlayingId(null);
        return;
      }
      if (nativeSoundRef.current) {
        await nativeSoundRef.current.stopAsync();
        await nativeSoundRef.current.unloadAsync();
        nativeSoundRef.current = null;
      }
      setPlayingId(id);
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl }, { shouldPlay: true });
      nativeSoundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
          sound.unloadAsync();
          nativeSoundRef.current = null;
        }
      });
    }
  };

  const handleDeleteConversation = () => {
    Alert.alert('Delete Conversation', 'Permanently delete all messages?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setShowSettings(false);
        await supabase.from('messages').delete().eq('conversation_id', conversationId);
        await supabase.from('conversations').delete().eq('id', conversationId);
        router.back();
      }},
    ]);
  };

  const lastMyMsg = [...messages].reverse().find(m => m.sender_uid === user.uid);

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender_uid === user.uid;
    const isAudio = item.type === 'audio' && item.audio_url;

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isMe && (
          <View style={styles.avatarSmall}>
            {otherUser.avatar
              ? <Image source={{ uri: otherUser.avatar }} style={styles.avatarImg} />
              : <Text style={styles.avatarInitial}>{otherUser.name[0]?.toUpperCase()}</Text>}
          </View>
        )}
        <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}>
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
            {isAudio ? (
              <TouchableOpacity style={styles.audioRow} onPress={() => togglePlay(item.id, item.audio_url)}>
                <View style={[styles.playIconWrap, { backgroundColor: isMe ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)' }]}>
                  <Ionicons name={playingId === item.id ? 'pause' : 'play'} size={18} color={isMe ? '#000' : '#fff'} />
                </View>
                <View style={styles.audioWave}>
                  {[...Array(20)].map((_, i) => (
                    <View
                      key={i}
                      style={[styles.audioBar, {
                        height: 4 + Math.abs(Math.sin(i * 0.9 + 1) * 10),
                        backgroundColor: isMe ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.35)',
                      }]}
                    />
                  ))}
                </View>
                <Text style={[styles.audioDur, { color: isMe ? '#000' : Colors.textMuted }]}>
                  {fmtSecs(item.audio_duration || 0)}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                {item.text}
              </Text>
            )}
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.timeLabel}>{timeStr(item.created_at)}</Text>
            {isMe && (
              <Text style={[styles.seenTick, item.is_read ? styles.seenRead : styles.seenSent]}>
                {item.is_read ? ' ✓✓' : ' ✓'}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerUser}
          onPress={() => router.push({ pathname: '/user-profile', params: { uid: otherUserUid } })}
          activeOpacity={0.8}
        >
          {otherUser.avatar
            ? <Image source={{ uri: otherUser.avatar }} style={styles.headerAvatar} />
            : <View style={styles.headerAvatarPlaceholder}><Text style={styles.headerInitial}>{otherUser.name[0]?.toUpperCase()}</Text></View>}
          <Text style={styles.headerName}>{otherUser.name}</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.push({ pathname: '/voice-call', params: { channelId: conversationId, otherUserUid } })}
          >
            <Ionicons name="call-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowSettings(true)}>
            <Ionicons name="ellipsis-vertical" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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

          {/* ─── Input / Recording Bar ─── */}
          {isRecording ? (
            <View style={styles.recordingBar}>
              <TouchableOpacity onPress={cancelRecording} style={styles.recCancelBtn}>
                <Ionicons name="trash-outline" size={22} color="#ef4444" />
              </TouchableOpacity>

              <View style={styles.recCenter}>
                <Animated.View style={[styles.recDot, { opacity: recDotAnim }]} />
                {/* Fake wave bars for visual */}
                {[...Array(14)].map((_, i) => (
                  <View key={i} style={[styles.recWaveBar, { height: 6 + Math.abs(Math.sin(i * 0.7) * 14) }]} />
                ))}
                <Text style={styles.recTimer}>{fmtSecs(recordingSecs)}</Text>
              </View>

              <TouchableOpacity onPress={stopAndSend} style={styles.recSendBtn}>
                {sending
                  ? <ActivityIndicator size="small" color="#000" />
                  : <Ionicons name="send" size={20} color="#000" />}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={text}
                onChangeText={setText}
                placeholder="Message..."
                placeholderTextColor={Colors.textMuted}
                multiline
              />
              {text.trim() ? (
                <TouchableOpacity
                  style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
                  onPress={handleSend}
                  disabled={sending}
                >
                  {sending
                    ? <ActivityIndicator size="small" color="#000" />
                    : <Ionicons name="send" size={20} color="#000" />}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.micBtn} onPress={startRecording}>
                  <Ionicons name="mic" size={22} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      )}

      {/* Settings Modal */}
      <Modal visible={showSettings} transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSettings(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => { setShowSettings(false); router.push({ pathname: '/user-profile', params: { uid: otherUserUid } }); }}
            >
              <Ionicons name="person-outline" size={22} color={Colors.textPrimary} />
              <Text style={styles.modalOptionText}>View Profile</Text>
            </TouchableOpacity>
            <View style={styles.modalDivider} />
            <TouchableOpacity style={styles.modalOption} onPress={handleDeleteConversation}>
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
              <Text style={[styles.modalOptionText, { color: '#ef4444' }]}>Delete Conversation</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 4, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerBtn: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center' },
  headerUser: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerAvatar: { width: 38, height: 38, borderRadius: 19 },
  headerAvatarPlaceholder: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  headerInitial: { color: '#000', fontWeight: '700', fontSize: 16 },
  headerName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  headerActions: { flexDirection: 'row' },

  messagesList: { padding: 16, paddingBottom: 8, flexGrow: 1 },

  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  msgRowRight: { justifyContent: 'flex-end' },
  msgRowLeft: { justifyContent: 'flex-start' },
  avatarSmall: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarImg: { width: 30, height: 30, borderRadius: 15 },
  avatarInitial: { color: '#000', fontWeight: '700', fontSize: 12 },

  bubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMe: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: 'rgba(30,41,59,0.9)', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTextMe: { color: '#000' },
  bubbleTextThem: { color: Colors.textPrimary },

  audioRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 170 },
  playIconWrap: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  audioWave: { flexDirection: 'row', alignItems: 'center', gap: 2, flex: 1 },
  audioBar: { width: 2.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
  audioDur: { fontSize: 12, fontWeight: '600' },

  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, paddingHorizontal: 4 },
  timeLabel: { fontSize: 10, color: Colors.textMuted },
  seenTick: { fontSize: 11, fontWeight: '700' },
  seenSent: { color: Colors.textMuted },
  seenRead: { color: Colors.primary },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: Colors.textMuted, fontSize: 15 },

  // Input
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', backgroundColor: BG,
  },
  input: {
    flex: 1, backgroundColor: 'rgba(30,41,59,0.8)', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    color: Colors.textPrimary, fontSize: 15, maxHeight: 100,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  micBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(16,185,129,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.primary },

  // Recording bar
  recordingBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', backgroundColor: BG,
    gap: 8,
  },
  recCancelBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  recCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 3 },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', marginRight: 6 },
  recWaveBar: { width: 3, borderRadius: 2, backgroundColor: Colors.primary, opacity: 0.7 },
  recTimer: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600', marginLeft: 6, minWidth: 38 },
  recSendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingBottom: 40, paddingTop: 12 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 16 },
  modalOption: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 4 },
  modalOptionText: { color: Colors.textPrimary, fontSize: 16 },
  modalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 4 },
});
