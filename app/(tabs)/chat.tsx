import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Image, ActivityIndicator, ScrollView, Alert, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useUserStore, UserTier } from '../../store/userStore';
import Skeleton from '../../components/ui/Skeleton';
import BrandLogo from '../../components/ui/BrandLogo';
import { Colors } from '../../constants/colors';

const BG = '#0a0a0a';
const PRIMARY = '#00E676';
const SURFACE = '#121212';
const TEXT = '#FFFFFF';
const MUTED = '#A0A0A0';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) {
    const d = new Date(dateStr);
    return `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
  }
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  if (d < 7) {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return days[new Date(dateStr).getDay()];
  }
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
  isGroup?: boolean;
  isCoach?: boolean;
}
import { useCachedState } from '../../lib/useCachedState';

export default function ChatScreen() {
  const router = useRouter();
  const { user, authInitialized } = useUserStore();
  const [conversations, setConversations, cacheLoaded] = useCachedState<ConvItem[]>(user?.uid ? `chats_${user.uid}` : '', []);
  const [loading, setLoading] = useState(true);
  
  // If cache is loaded and we have items, we can hide the loading spinner immediately
  // while fetchConversations updates it in the background
  if (cacheLoaded && conversations.length > 0 && loading) {
    setLoading(false);
  }

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Coaches' | 'Groups'>('All');

  // Note: Guest users view the TikTok-style login/signup state in-place without forced redirect

  // Ensure conversations are fetched when user.uid becomes ready
  useEffect(() => {
    if (user.uid && user.tier !== UserTier.GUEST) {
      fetchConversations();
    }
  }, [user.uid]);

  const fetchConversations = async () => {
    if (!user.uid || user.tier === UserTier.GUEST) return;
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
        let name = '';
        let avatar = '';
        let isCoach = false;
        let userExists = false;
        try {
          const snap = await getDoc(doc(db, 'users', otherUid));
          if (snap.exists()) {
            const d = snap.data();
            name = d.name || d.displayName || d.username || 'User';
            avatar = d.avatar || d.photoURL || '';
            isCoach = d.role === 'coach';
            userExists = true;
          }
        } catch (_) {}

        // Skip ghost/deleted/invalid user conversations so fake "User" accounts never appear
        if (!userExists) {
          continue;
        }

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
          isCoach,
          isGroup: false, // Future proofing
        });
      }
      setConversations(enriched);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [user.uid])
  );

  const handleDeleteConversation = (conv: ConvItem) => {
    const doDelete = async () => {
      // Optimistically remove from state
      setConversations((prev: ConvItem[]) => prev.filter((c: ConvItem) => c.id !== conv.id));
      try {
        await supabase.from('messages').delete().eq('conversation_id', conv.id);
        await supabase.from('conversations').delete().eq('id', conv.id);
      } catch (e) {
        console.warn('Error deleting conversation:', e);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Delete conversation with ${conv.otherName}?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete Conversation',
        `Are you sure you want to delete the conversation with ${conv.otherName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  let filtered = conversations.filter(c =>
    c.otherName.toLowerCase().includes(search.toLowerCase())
  );
  if (activeFilter === 'Coaches') filtered = filtered.filter(c => c.isCoach);
  if (activeFilter === 'Groups') filtered = filtered.filter(c => c.isGroup);

  const renderItem = ({ item }: { item: ConvItem }) => (
    <TouchableOpacity
      style={styles.convRow}
      onPress={() => router.push({ pathname: '/chat-room', params: { conversationId: item.id, otherUserUid: item.otherUid } })}
      onLongPress={() => handleDeleteConversation(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.avatarWrap, item.unreadCount ? { borderColor: PRIMARY, borderWidth: 2 } : {}]}>
        {item.otherAvatar
          ? <Image source={{ uri: item.otherAvatar }} style={styles.avatar} />
          : <View style={styles.avatarInitialWrap}>
              <Text style={styles.avatarInitialText}>{item.otherName[0]?.toUpperCase()}</Text>
            </View>}
        {item.unreadCount ? <View style={styles.onlineDot} /> : null}
      </View>
      
      <View style={styles.convInfo}>
        <View style={styles.convTop}>
          <Text style={styles.convName}>{item.otherName}</Text>
          <Text style={[styles.convTime, item.unreadCount ? { color: PRIMARY } : {}]}>{timeAgo(item.lastAt)}</Text>
        </View>
        <View style={styles.convBottom}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
            {item.lastMessage?.includes('Missed call') ? (
              <Ionicons name="call-outline" size={14} color="#EF4444" />
            ) : item.lastMessage?.includes('Voice/Video call') ? (
              <Ionicons name="call-outline" size={14} color="#00E676" />
            ) : null}
            <Text
              style={[
                styles.convLast,
                item.lastMessage?.includes('Missed call') && { color: '#EF4444', fontWeight: '500' },
                item.unreadCount ? { color: TEXT, fontWeight: '500' } : {}
              ]}
              numberOfLines={1}
            >
              {(item.lastMessage || '').replace(/[📞📵]/g, '').trim() || 'Start a conversation...'}
            </Text>
          </View>
          {!!item.unreadCount && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* App Header */}
      <View style={styles.header}>
        <View style={styles.logoWrap}>
          <BrandLogo size="small" showText={false} />
          <View>
            <Text style={styles.logoSub}>Stronger Together</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={styles.iconBtn}>
            <Ionicons name="search" size={22} color={TEXT} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/community')} style={styles.iconBtn}>
            <Ionicons name="create-outline" size={22} color={TEXT} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input (Collapsible) */}
      {showSearch && (
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={MUTED} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={MUTED}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>
      )}

      {/* ── Guest TikTok-Style State ── */}
      {(!user?.uid || user.tier === UserTier.GUEST) ? (
        <View style={styles.guestCenterWrap}>
          <View style={styles.guestIconWrap}>
            <View style={styles.guestGlowCircle} />
            <Ionicons name="chatbubbles-outline" size={54} color={Colors.primary} />
          </View>
          <View style={styles.guestBtnStack}>
            <TouchableOpacity
              style={styles.guestPrimaryBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.guestPrimaryBtnText}>Log In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestSecondaryBtn}
              activeOpacity={0.75}
              onPress={() => router.push('/role-selection')}
            >
              <Text style={styles.guestSecondaryBtnText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          {/* Filters */}
          <View style={styles.filtersWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
              {['All', 'Coaches', 'Groups'].map(filter => (
                <TouchableOpacity 
                  key={filter} 
                  style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                  onPress={() => setActiveFilter(filter as any)}
                >
                  <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {loading ? (
            <View style={{ flex: 1 }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <View key={i} style={styles.convRow}>
                  <View style={styles.avatarWrap}>
                    <Skeleton width={52} height={52} borderRadius={26} />
                  </View>
                  <View style={styles.convInfo}>
                    <View style={styles.convTop}>
                      <Skeleton width={120} height={16} />
                      <Skeleton width={40} height={12} />
                    </View>
                    <View style={styles.convBottom}>
                      <Skeleton width={200} height={14} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-ellipses-outline" size={64} color={SURFACE} />
              <Text style={styles.emptyTitle}>No messages</Text>
              <Text style={styles.emptyText}>Find coaches or groups to start chatting.</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoTitle: { color: TEXT, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  logoSub: { color: MUTED, fontSize: 11, fontWeight: '500' },
  headerActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 8 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: SURFACE,
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 20, paddingHorizontal: 14,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, color: TEXT, fontSize: 15 },

  filtersWrap: { paddingBottom: 16 },
  filtersScroll: { paddingHorizontal: 16, gap: 10 },
  filterChip: {
    paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 20, backgroundColor: SURFACE,
  },
  filterChipActive: { backgroundColor: PRIMARY },
  filterText: { color: TEXT, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#000' },

  convRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 14,
  },
  avatarWrap: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarInitialWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: SURFACE, justifyContent: 'center', alignItems: 'center',
  },
  avatarInitialText: { color: PRIMARY, fontWeight: '800', fontSize: 20 },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: PRIMARY, borderWidth: 2, borderColor: BG,
  },

  convInfo: { flex: 1, justifyContent: 'center' },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  convName: { color: TEXT, fontSize: 16, fontWeight: '700' },
  convTime: { color: MUTED, fontSize: 12, fontWeight: '500' },
  
  convBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convLast: { color: MUTED, fontSize: 14, flex: 1, paddingRight: 10 },
  
  unreadBadge: {
    backgroundColor: PRIMARY,
    minWidth: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: { color: '#000', fontSize: 11, fontWeight: '800' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyTitle: { color: TEXT, fontSize: 18, fontWeight: '700' },
  emptyText: { color: MUTED, fontSize: 14 },

  /* TikTok Guest State */
  guestCenterWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: -40,
  },
  guestIconWrap: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.2)',
  },
  guestGlowCircle: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primary,
    opacity: 0.15,
  },
  guestBtnStack: {
    width: '100%',
    maxWidth: 280,
    gap: 12,
  },
  guestPrimaryBtn: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  guestPrimaryBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  guestSecondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  guestSecondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
