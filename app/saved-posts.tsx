import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../constants/colors';
import { useUserStore } from '../store/userStore';
import { supabase } from '../lib/supabase';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Skeleton from '../components/ui/Skeleton';
import { safeBack } from '../lib/navigation';

const BG = Colors.background;

interface SavedPost {
  id: string;
  uid: string;
  username: string;
  avatar_url: string;
  image_url: string;
  caption?: string;
  likes_count: number;
  isCoach?: boolean;
  created_at: string;
}

function timeAgo(dateStr: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

export default function SavedPostsPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSaved = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const { data: saves, error } = await supabase
        .from('post_saves')
        .select('post_id, created_at')
        .eq('uid', user.uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!saves || saves.length === 0) {
        setPosts([]);
        return;
      }

      const postIds = saves.map((s: any) => s.post_id);
      const { data: dbPosts } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds);

      const enriched: SavedPost[] = [];
      for (const p of dbPosts || []) {
        let isCoach = false;
        let username = p.username || 'User';
        let avatar = p.avatar_url || '';
        try {
          const snap = await getDoc(doc(db, 'users', p.uid));
          if (snap.exists()) {
            const d = snap.data();
            isCoach = d.role === 'coach';
            username = d.name || d.username || username;
            avatar = d.avatar || d.photoURL || avatar;
          }
        } catch (_) {}
        enriched.push({
          id: p.id,
          uid: p.uid,
          username,
          avatar_url: avatar || `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${p.uid}.jpg`,
          image_url: p.image_url,
          caption: p.caption,
          likes_count: p.likes_count || 0,
          isCoach,
          created_at: p.created_at,
        });
      }
      // Re-order by save time (saves array order)
      const ordered = postIds
        .map((id: string) => enriched.find(p => p.id === id))
        .filter(Boolean) as SavedPost[];
      setPosts(ordered);
    } catch (e) {
      console.warn('Saved posts fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchSaved();
    }, [fetchSaved])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSaved();
  };

  const handleUnsave = async (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    try {
      await supabase.from('post_saves').delete().eq('post_id', postId).eq('uid', user.uid!);
    } catch (e) {
      console.warn('Unsave error:', e);
    }
  };

  const renderPost = ({ item }: { item: SavedPost }) => {
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.username)}&background=10B981&color=fff&size=150`;
    return (
      <View style={styles.postCard}>
        {/* Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity
            style={styles.userInfo}
            onPress={() => router.push({ pathname: '/user-profile', params: { uid: item.uid } })}
            activeOpacity={0.8}
          >
            <Image
              source={item.avatar_url || defaultAvatar}
              placeholder={defaultAvatar}
              cachePolicy="memory-disk"
              contentFit="cover"
              style={styles.avatar}
            />
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.username}>{item.username}</Text>
                {item.isCoach && (
                  <Ionicons name="checkmark-circle" size={13} color={Colors.primary} />
                )}
              </View>
              <Text style={styles.postTime}>{timeAgo(item.created_at)}</Text>
            </View>
          </TouchableOpacity>
          {/* Unsave (remove from saved) */}
          <TouchableOpacity
            onPress={() => handleUnsave(item.id)}
            style={styles.unsaveBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="bookmark" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Image */}
        {!!item.image_url && (
          <Image
            source={item.image_url}
            cachePolicy="memory-disk"
            contentFit="cover"
            style={styles.postImage}
          />
        )}

        {/* Caption */}
        {!!item.caption && (
          <View style={styles.captionWrap}>
            <Text style={styles.captionText} numberOfLines={2}>
              <Text style={styles.captionUsername}>{item.username} </Text>
              {item.caption}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.postFooter}>
          <View style={styles.footerLeft}>
            <Ionicons name="heart-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.footerCount}>{item.likes_count || 0}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack('/(tabs)/profile')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Posts</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          {[1, 2].map(i => (
            <View key={i} style={{ marginBottom: 20, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Skeleton width={38} height={38} borderRadius={19} />
                <View style={{ gap: 6 }}>
                  <Skeleton width={110} height={13} borderRadius={4} />
                  <Skeleton width={70} height={10} borderRadius={4} />
                </View>
              </View>
              <Skeleton width="100%" height={280} borderRadius={12} />
            </View>
          ))}
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={58} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Saved Posts</Text>
          <Text style={styles.emptySubtitle}>
            Posts you bookmark will appear here. Tap 🔖 on any post to save it.
          </Text>
          <TouchableOpacity
            style={styles.browsBtn}
            onPress={() => router.push('/(tabs)/community')}
            activeOpacity={0.85}
          >
            <Text style={styles.browsBtnText}>Browse Community</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.feedContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  feedContainer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingBottom: 40,
  },
  postCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
  },
  username: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  postTime: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  unsaveBtn: {
    padding: 6,
  },
  postImage: {
    width: '100%',
    height: 280,
    backgroundColor: '#070B14',
  },
  captionWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  captionText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 19,
  },
  captionUsername: {
    fontWeight: '700',
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerCount: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  browsBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 24,
    marginTop: 12,
  },
  browsBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
});
