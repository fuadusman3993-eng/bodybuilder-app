import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/colors';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const BG = '#0A0F1A';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (user?.uid) fetchNotifications();
    }, [user?.uid])
  );

  const fetchNotifications = async () => {
    try {
      const items: any[] = [];

      // 1. If coach → fetch pending requests from coach_requests directly
      if (user.role === 'coach') {
        const { data: reqs } = await supabase
          .from('coach_requests')
          .select('*')
          .eq('coach_uid', user.uid)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (reqs && reqs.length > 0) {
          for (const req of reqs) {
            // Try to get trainee name from Firebase
            let traineeName = 'A user';
            let traineeAvatar = `https://ui-avatars.com/api/?name=User&background=10B981&color=fff`;
            try {
              const docSnap = await getDoc(doc(db, 'users', req.trainee_uid));
              if (docSnap.exists()) {
                const d = docSnap.data();
                traineeName = d.name || d.username || 'A user';
                traineeAvatar = d.avatar || `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${req.trainee_uid}.jpg`;
              }
            } catch (_) {}

            items.push({
              id: `req_${req.id}`,
              type: 'request',
              message: `${traineeName} wants you to be their coach.`,
              sender_uid: req.trainee_uid,
              sender_avatar: traineeAvatar,
              sender_name: traineeName,
              is_read: false,
              created_at: req.created_at,
              request_id: req.id,
            });
          }
        }
      }

      // 2. Fetch regular notifications (likes, follows, etc.)
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_uid', user.uid)
        .order('created_at', { ascending: false });

      if (notifs && notifs.length > 0) {
        // Mark as read in background
        const unreadIds = notifs.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length > 0) {
          supabase.from('notifications').update({ is_read: true }).in('id', unreadIds).then();
        }
        items.push(...notifs);
      }

      // Sort by date
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotifications(items);
    } catch (e) {
      console.warn(e);
    }
    setLoading(false);
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'like_story':
      case 'like_post':
        return <Ionicons name="heart" size={20} color="#EF4444" />;
      case 'follow':
        return <Ionicons name="person-add" size={20} color={Colors.primary} />;
      case 'request':
        return <Ionicons name="mail" size={20} color="#F59E0B" />;
      default:
        return <Ionicons name="notifications" size={20} color={Colors.textPrimary} />;
    }
  };

  const handlePress = (item: any) => {
    if (item.type === 'request') {
      router.push('/coach-dashboard');
    } else if (item.sender_uid) {
      router.push({ pathname: '/user-profile', params: { uid: item.sender_uid } });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={60} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                {renderIcon(item.type)}
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.messageText}>{item.message}</Text>
                <Text style={styles.timeText}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              {!item.is_read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },

  listContent: { padding: 16 },
  notificationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30,41,59,0.4)', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.02)' },
  unreadCard: { backgroundColor: 'rgba(30,41,59,0.8)', borderColor: 'rgba(16,185,129,0.3)' },

  iconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  textContainer: { flex: 1 },
  messageText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '500', lineHeight: 20 },
  timeText: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },

  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginLeft: 10 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { color: Colors.textMuted, fontSize: 15 },
});
