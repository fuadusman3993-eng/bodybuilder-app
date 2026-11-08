import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/colors';
import { useTheme } from '../store/themeStore';
import { getProfilesBatch, isGenericName } from '../lib/profileService';
import Skeleton from '../components/ui/Skeleton';
import { safeBack } from '../lib/navigation';
import BackButton from '../components/ui/BackButton';
import UserAvatar, { AvatarIconStyle } from '../components/ui/UserAvatar';

const BG = Colors.background;

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w`;
  return `${Math.floor(d / 30)}mo`;
}

function groupByDate(items: any[]) {
  const now = Date.now();
  const today: any[] = [];
  const thisWeek: any[] = [];
  const older: any[] = [];

  items.forEach(item => {
    const diff = now - new Date(item.created_at).getTime();
    const hours = diff / (1000 * 60 * 60);
    if (hours < 24) today.push(item);
    else if (hours < 168) thisWeek.push(item);
    else older.push(item);
  });

  const sections = [];
  if (today.length > 0) sections.push({ title: 'Today', data: today });
  if (thisWeek.length > 0) sections.push({ title: 'This Week', data: thisWeek });
  if (older.length > 0) sections.push({ title: 'Older', data: older });
  return sections;
}

let cachedSections: any[] = [];
let cachedNotifUserUid: string | null = null;
let notifCacheTimestamp = 0;
const NOTIF_CACHE_TTL_MS = 2 * 60 * 1000;

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const { colors } = useTheme();

  const isCacheValid = !!(user?.uid && cachedNotifUserUid === user.uid && cachedSections.length > 0);
  const [sections, setSections] = useState<any[]>(isCacheValid ? cachedSections : []);
  const [loading, setLoading] = useState(!isCacheValid);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) return;
      const now = Date.now();
      if (
        cachedNotifUserUid === user.uid &&
        cachedSections.length > 0 &&
        (now - notifCacheTimestamp) < NOTIF_CACHE_TTL_MS
      ) {
        setSections(cachedSections);
        setLoading(false);
        if (now - notifCacheTimestamp > 20 * 1000) {
          fetchNotifications(false);
        }
        return;
      }
      fetchNotifications(cachedSections.length === 0 || cachedNotifUserUid !== user.uid);
    }, [user?.uid, user?.role])
  );

  const fetchNotifications = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      // 1. Fetch coach requests and regular notifications in parallel (fast!)
      const [reqsRes, notifsRes] = await Promise.all([
        user.role === 'coach'
          ? supabase
              .from('coach_requests')
              .select('*')
              .eq('coach_uid', user.uid)
              .neq('status', 'rejected')
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: null, error: null }),
        supabase
          .from('notifications')
          .select('*')
          .eq('user_uid', user.uid)
          .order('created_at', { ascending: false })
          .limit(40),
      ]);

      const reqs = reqsRes.data || [];
      let notifs = notifsRes.data || [];
      if (user.role === 'coach') {
        notifs = notifs.filter((n: any) => n.type !== 'request');
      }

      // 2. Collect all unique sender UIDs
      const allSenderUids = Array.from(
        new Set([
          ...reqs.map((r: any) => r.trainee_uid),
          ...notifs.map((n: any) => n.sender_uid),
        ])
      ).filter(Boolean);

      // 3. Single batch query to Supabase profiles (instant in-memory cache)
      const profilesMap = await getProfilesBatch(allSenderUids);

      const items: any[] = [];
      const seenTrainees = new Set<string>();

      // 4. Process Coach Requests with Real Trainee Profile
      for (const req of reqs) {
        if (seenTrainees.has(req.trainee_uid)) continue;
        seenTrainees.add(req.trainee_uid);

        const prof = profilesMap[req.trainee_uid];
        let name = prof?.name || prof?.username || req.trainee_name;
        if (isGenericName(name)) {
          name = req.trainee_name || 'Member';
        }

        const avatar = prof?.avatar_url || req.trainee_avatar || null;

        items.push({
          id: `req_${req.id}`,
          type: 'request',
          message: 'wants you to be their coach.',
          sender_uid: req.trainee_uid,
          sender_avatar: avatar,
          sender_name: name || 'Member',
          avatar_color: prof?.avatar_color,
          avatar_icon: prof?.avatar_icon,
          is_read: false,
          created_at: req.created_at,
          request_id: req.id,
          status: req.status,
        });
      }

      // 5. Process Regular Notifications with Real User Profiles
      for (const n of notifs) {
        const prof = n.sender_uid ? profilesMap[n.sender_uid] : null;
        let name = prof?.name || prof?.username;

        // Auto-extract real sender name from notification message if profile name is missing
        if (isGenericName(name) && n.message) {
          const match = n.message.replace(/\s+(liked your|started following|sent you|accepted your|wants you).*/i, '').trim();
          if (match && !isGenericName(match)) {
            name = match;
          }
        }

        if (isGenericName(name)) {
          name = 'Member';
        }

        const avatar = prof?.avatar_url || null;

        items.push({
          ...n,
          sender_name: name,
          sender_avatar: avatar,
          avatar_color: prof?.avatar_color,
          avatar_icon: prof?.avatar_icon,
        });
      }

      // 6. Mark as read in background
      const unreadIds = notifs.filter((n: any) => !n.is_read).map((n: any) => n.id);
      if (unreadIds.length > 0) {
        supabase.from('notifications').update({ is_read: true }).in('id', unreadIds).then();
      }

      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const grouped = groupByDate(items);
      setSections(grouped);
      cachedSections = grouped;
      cachedNotifUserUid = user.uid || null;
      notifCacheTimestamp = Date.now();
    } catch (e) {
      console.warn('Notifications fetch error:', e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleRequest = async (requestId: string, itemId: string, action: 'accepted' | 'rejected') => {
    if (!requestId) return;
    setActionLoading(itemId);
    try {
      const { error } = await supabase.from('coach_requests').update({ status: action }).eq('id', requestId);
      if (error) console.warn('coach_requests update error:', error);
      
      const targetItem = sections.flatMap(s => s.data).find(i => i.id === itemId);
      const traineeUid = targetItem?.sender_uid;

      if (action === 'accepted' && user?.uid && traineeUid) {
        // Increment trainee count on coach_profiles
        try {
          const { error: rpcErr } = await supabase.rpc('increment_trainees', { coach_uid_param: user.uid });
          if (rpcErr) {
            const { data: cp } = await supabase.from('coach_profiles').select('total_trainees').eq('uid', user.uid).single();
            const curr = (cp?.total_trainees || 0) + 1;
            await supabase.from('coach_profiles').update({ total_trainees: curr }).eq('uid', user.uid);
          }
        } catch (_) {}

        // Ensure conversation exists between coach and trainee
        try {
          const u1 = user.uid < traineeUid ? user.uid : traineeUid;
          const u2 = user.uid < traineeUid ? traineeUid : user.uid;
          const { data: existingConv } = await supabase
            .from('conversations')
            .select('id')
            .eq('user1_uid', u1)
            .eq('user2_uid', u2)
            .single();
            
          if (!existingConv) {
            await supabase.from('conversations').insert({ user1_uid: u1, user2_uid: u2 });
          }
        } catch (_) {}

        // Send notification to trainee
        try {
          await supabase.from('notifications').insert({
            user_uid: traineeUid,
            sender_uid: user.uid,
            type: 'request_accepted',
            message: `${user.name || 'Coach'} accepted your training request!`,
          });
        } catch (_) {}
      }
      
      // Update UI state and cache immediately
      if (action === 'rejected') {
        setSections(prev => {
          const updated = prev.map((section: any) => ({
            ...section,
            data: section.data.filter((item: any) => item.id !== itemId)
          })).filter((section: any) => section.data.length > 0);
          cachedSections = updated;
          return updated;
        });
      } else {
        setSections(prev => {
          const updated = prev.map((section: any) => ({
            ...section,
            data: section.data.map((item: any) => item.id === itemId ? { ...item, status: action } : item)
          }));
          cachedSections = updated;
          return updated;
        });
      }
      
    } catch (e) {
      console.warn('handleRequest error:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const getActionText = (type: string) => {
    switch (type) {
      case 'like_story': return 'liked your story.';
      case 'like_post': return 'liked your post.';
      case 'follow': return 'started following you.';
      case 'request': return 'wants you to be their coach.';
      case 'request_accepted': return 'accepted your training request!';
      default: return 'sent you a notification.';
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.row}>
      {/* Avatar — uses universal UserAvatar (photos or real initials, NEVER 'US') */}
      <TouchableOpacity
        onPress={() => item.sender_uid && router.push({ pathname: '/user-profile', params: { uid: item.sender_uid } })}
      >
        <UserAvatar
          uid={item.sender_uid}
          name={item.sender_name}
          avatarUrl={item.sender_avatar}
          avatarColor={item.avatar_color}
          avatarIcon={item.avatar_icon as AvatarIconStyle}
          size={44}
        />
      </TouchableOpacity>

      {/* Text */}
      <View style={styles.textWrap}>
        <Text style={[styles.msgText, { color: colors.textPrimary }]} numberOfLines={2}>
          <Text style={[styles.boldName, { color: colors.textPrimary }]}>{item.sender_name} </Text>
          <Text style={{ color: colors.textPrimary }}>{getActionText(item.type)} </Text>
          <Text style={[styles.timeText, { color: colors.textMuted }]}>{timeAgo(item.created_at)}</Text>
        </Text>
      </View>

      {/* Right side: request buttons OR unread dot */}
      {item.type === 'request' ? (
        item.status === 'accepted' ? (
          <View style={[styles.acceptedBadge, { backgroundColor: colors.primary + '1F', borderColor: colors.primary + '4D' }]}>
            <Text style={[styles.acceptedText, { color: colors.primary }]}>Accepted</Text>
          </View>
        ) : (
          <View style={styles.requestBtns}>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              disabled={actionLoading === item.id}
              onPress={() => handleRequest(item.request_id, item.id, 'accepted')}
            >
              {actionLoading === item.id
                ? <ActivityIndicator size="small" color="#000" />
                : <Text style={styles.confirmText}>Confirm</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
              disabled={!!actionLoading}
              onPress={() => handleRequest(item.request_id, item.id, 'rejected')}
            >
              <Text style={[styles.deleteText, { color: colors.textPrimary }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )
      ) : (
        <TouchableOpacity
          onPress={() => item.sender_uid && router.push({ pathname: '/user-profile', params: { uid: item.sender_uid } })}
        >
          {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <BackButton fallbackRoute="/(tabs)/profile" />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notifications</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={{ paddingTop: 16 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <View key={i} style={styles.row}>
              <Skeleton width={50} height={50} borderRadius={25} />
              <View style={styles.textWrap}>
                <Skeleton width="80%" height={15} borderRadius={4} style={{ marginBottom: 6 }} />
                <Skeleton width="40%" height={12} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No notifications yet</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>{title}</Text>
          )}
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
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },

  sectionHeader: {
    color: Colors.textPrimary, fontSize: 15, fontWeight: '700',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8,
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    gap: 12,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: Colors.surface,
  },
  textWrap: { flex: 1 },
  msgText: { color: Colors.textPrimary, fontSize: 13.5, lineHeight: 20 },
  boldName: { fontWeight: '700', color: Colors.textPrimary },
  timeText: { color: Colors.textMuted, fontSize: 12.5 },

  requestBtns: { flexDirection: 'row', gap: 8 },
  confirmBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 14,
    paddingVertical: 7, borderRadius: 8,
  },
  confirmText: { color: '#000', fontWeight: '700', fontSize: 13 },
  deleteBtn: {
    backgroundColor: Colors.surfaceLight, paddingHorizontal: 14,
    paddingVertical: 7, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  deleteText: { color: Colors.textPrimary, fontWeight: '600', fontSize: 13 },

  acceptedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptedText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 12.5,
  },

  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.primary },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  emptyText: { color: Colors.textMuted, fontSize: 15 },
});
