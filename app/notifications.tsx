import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity,
  ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/colors';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const BG = '#0A0F1A';

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

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user?.uid) fetchNotifications();
    }, [user?.uid])
  );

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const items: any[] = [];

      // 1. Coach: fetch pending requests from coach_requests
      if (user.role === 'coach') {
        const { data: reqs } = await supabase
          .from('coach_requests')
          .select('*')
          .eq('coach_uid', user.uid)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (reqs) {
          for (const req of reqs) {
            let name = 'A user';
            let avatar = `https://ui-avatars.com/api/?name=User&background=10B981&color=fff`;
            try {
              const snap = await getDoc(doc(db, 'users', req.trainee_uid));
              if (snap.exists()) {
                const d = snap.data();
                name = d.name || d.username || 'A user';
                avatar = d.avatar || `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${req.trainee_uid}.jpg`;
              }
            } catch (_) {}

            items.push({
              id: `req_${req.id}`,
              type: 'request',
              message: `wants you to be their coach.`,
              sender_uid: req.trainee_uid,
              sender_avatar: avatar,
              sender_name: name,
              is_read: false,
              created_at: req.created_at,
              request_id: req.id,
            });
          }
        }
      }

      // 2. Regular notifications (likes, follows, etc.)
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_uid', user.uid)
        .order('created_at', { ascending: false });

      if (notifs) {
        // Enrich with sender info
        for (const n of notifs) {
          let name = 'Someone';
          let avatar = `https://ui-avatars.com/api/?name=User&background=10B981&color=fff`;
          if (n.sender_uid) {
            try {
              const snap = await getDoc(doc(db, 'users', n.sender_uid));
              if (snap.exists()) {
                const d = snap.data();
                name = d.name || d.username || 'Someone';
                avatar = d.avatar || `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${n.sender_uid}.jpg`;
              }
            } catch (_) {}
          }
          items.push({ ...n, sender_name: name, sender_avatar: avatar });
        }
        // Mark as read
        const unreadIds = notifs.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length > 0) {
          supabase.from('notifications').update({ is_read: true }).in('id', unreadIds).then();
        }
      }

      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setSections(groupByDate(items));
    } catch (e) {
      console.warn(e);
    }
    setLoading(false);
  };

  const handleRequest = async (requestId: string, itemId: string, action: 'accepted' | 'rejected') => {
    setActionLoading(itemId);
    try {
      await supabase.from('coach_requests').update({ status: action }).eq('id', requestId);
      if (action === 'accepted') {
        await supabase.rpc('increment_trainees', { coach_uid_param: user.uid }).catch(() => {});
      }
      await fetchNotifications();
    } catch (e) { console.warn(e); }
    setActionLoading(null);
  };

  const getActionText = (type: string) => {
    switch (type) {
      case 'like_story': return 'liked your story.';
      case 'like_post': return 'liked your post.';
      case 'follow': return 'started following you.';
      case 'request': return 'wants you to be their coach.';
      default: return 'sent you a notification.';
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.row}>
      {/* Avatar — tappable to go to profile */}
      <TouchableOpacity
        onPress={() => item.sender_uid && router.push({ pathname: '/user-profile', params: { uid: item.sender_uid } })}
      >
        <Image
          source={{ uri: item.sender_avatar }}
          style={styles.avatar}
        />
      </TouchableOpacity>

      {/* Text */}
      <View style={styles.textWrap}>
        <Text style={styles.msgText} numberOfLines={2}>
          <Text style={styles.boldName}>{item.sender_name} </Text>
          <Text>{getActionText(item.type)} </Text>
          <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>
        </Text>
      </View>

      {/* Right side: request buttons OR unread dot */}
      {item.type === 'request' ? (
        <View style={styles.requestBtns}>
          <TouchableOpacity
            style={styles.confirmBtn}
            disabled={actionLoading === item.id}
            onPress={() => handleRequest(item.request_id, item.id, 'accepted')}
          >
            {actionLoading === item.id
              ? <ActivityIndicator size="small" color="#000" />
              : <Text style={styles.confirmText}>Confirm</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            disabled={!!actionLoading}
            onPress={() => handleRequest(item.request_id, item.id, 'rejected')}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => item.sender_uid && router.push({ pathname: '/user-profile', params: { uid: item.sender_uid } })}
        >
          {!item.is_read && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
      ) : sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
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
    backgroundColor: '#1E293B',
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
    backgroundColor: '#1E293B', paddingHorizontal: 14,
    paddingVertical: 7, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  deleteText: { color: Colors.textPrimary, fontWeight: '600', fontSize: 13 },

  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.primary },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  emptyText: { color: Colors.textMuted, fontSize: 15 },
});
