import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useUserStore, UserTier } from '../../store/userStore';
import GuestBlocker from '../../components/ui/GuestBlocker';
import { Colors } from '../../constants/colors';

const BG = '#0A0F1A';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

interface ConvItem {
  id: string;
  otherUid: string;
  otherName: string;
  otherAvatar: string;
  lastMessage: string;
  lastAt: string;
  unreadCount?: number;
}

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const [conversations, setConversations] = useState<ConvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  if (user.tier === UserTier.GUEST) {
    return <GuestBlocker feature="chat" />;
  }

  const fetchConversations = async () => {
    if (!user.uid) return;
    try {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_uid.eq.${user.uid},user2_uid.eq.${user.uid}`)
        .order('last_message_at', { ascending: false });

      if (!data) { setLoading(false); return; }

      const enriched: ConvItem[] = [];
      for (const conv of data) {
        const otherUid = conv.user1_uid === user.uid ? conv.user2_uid : conv.user1_uid;
        let name = 'User';
        let avatar = '';
        try {
          const snap = await getDoc(doc(db, 'users', otherUid));
          if (snap.exists()) {
            const d = snap.data();
            name = d.name || d.displayName || d.username || 'User';
            avatar = d.avatar || d.photoURL || '';
          }
        } catch (_) {}

        // Fetch unread count
        let unreadCount = 0;
        try {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_uid', user.uid);
          unreadCount = count || 0;
        } catch (_) {}

        enriched.push({
          id: conv.id,
          otherUid,
          otherName: name,
          otherAvatar: avatar,
          lastMessage: conv.last_message || '',
          lastAt: conv.last_message_at || conv.created_at,
          unreadCount,
        });
      }

      setConversations(enriched);
    } catch (e) {
      console.warn(e);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [user.uid])
  );

  const filtered = conversations.filter(c =>
    c.otherName.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: ConvItem }) => (
    <TouchableOpacity
      style={styles.convRow}
      onPress={() => router.push({ pathname: '/chat-room', params: { conversationId: item.id, otherUserUid: item.otherUid } })}
      activeOpacity={0.7}
    >
      {item.otherAvatar
        ? <Image source={{ uri: item.otherAvatar }} style={styles.avatar} />
        : <View style={styles.avatarInitialWrap}>
            <Text style={styles.avatarInitialText}>{item.otherName[0]?.toUpperCase()}</Text>
          </View>}
      <View style={styles.convInfo}>
        <View style={styles.convTop}>
          <Text style={[styles.convName, item.unreadCount ? { color: Colors.primary } : {}]}>{item.otherName}</Text>
          <Text style={styles.convTime}>{timeAgo(item.lastAt)}</Text>
        </View>
        <Text style={[styles.convLast, item.unreadCount ? { color: Colors.textPrimary, fontWeight: '600' } : {}]} numberOfLines={1}>
          {item.lastMessage || 'Start a conversation...'}
        </Text>
      </View>
      {!!item.unreadCount && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/community')}>
          <Ionicons name="create-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyText}>
            Visit someone's profile and tap{'\n'}"Message" to start chatting
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(30,41,59,0.6)',
    marginHorizontal: 16, marginVertical: 10,
    borderRadius: 12, paddingHorizontal: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, color: Colors.textPrimary, fontSize: 15 },

  convRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarInitialWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarInitialText: { color: '#000', fontWeight: '800', fontSize: 20 },

  convInfo: { flex: 1 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convName: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  convTime: { color: Colors.textMuted, fontSize: 12 },
  convLast: { color: Colors.textMuted, fontSize: 13, marginTop: 3 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 40 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  emptyText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22 },

  unreadBadge: {
    backgroundColor: Colors.primary,
    minWidth: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: { color: '#000', fontSize: 12, fontWeight: '800' },
});
