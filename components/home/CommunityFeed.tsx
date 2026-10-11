import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import PostCard, { RealPost } from './PostCard';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/userStore';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Skeleton from '../ui/Skeleton';

export default function CommunityFeed() {
  const router = useRouter();
  const { user } = useUserStore();
  const [feedPosts, setFeedPosts] = useState<RealPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopPosts();
  }, [user?.uid]);

  const fetchTopPosts = async () => {
    try {
      const { data: dbPosts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;

      let likedSet = new Set<string>();
      if (user?.uid) {
        try {
          const { data: myLikes } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('uid', user.uid);
          if (myLikes) {
            likedSet = new Set(myLikes.map(l => l.post_id));
          }
        } catch (_) {}
      }

      const enriched: RealPost[] = [];
      for (const p of dbPosts || []) {
        let isCoach = false;
        let username = p.username || 'User';
        let avatar = p.avatar_url || '';
        let city = '';

        try {
          const snap = await getDoc(doc(db, 'users', p.uid));
          if (snap.exists()) {
            const d = snap.data();
            isCoach = d.role === 'coach';
            username = d.name || d.username || username;
            avatar = d.avatar || d.photoURL || avatar;
            city = d.city || '';
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
          created_at: p.created_at,
          isLiked: likedSet.has(p.id),
          isCoach,
          city,
        });
      }

      setFeedPosts(enriched);
    } catch (e) {
      console.warn('Home CommunityFeed error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!user?.uid) {
      router.push('/login');
      return;
    }

    setFeedPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const wasLiked = !!p.isLiked;
        return {
          ...p,
          isLiked: !wasLiked,
          likes_count: wasLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1,
        };
      }
      return p;
    }));

    const targetPost = feedPosts.find(p => p.id === postId);
    if (!targetPost) return;
    const willLike = !targetPost.isLiked;

    try {
      if (willLike) {
        try {
          await supabase.from('post_likes').insert({ post_id: postId, uid: user.uid });
        } catch (_) {}
        await supabase.from('posts').update({ likes_count: (targetPost.likes_count || 0) + 1 }).eq('id', postId);
      } else {
        try {
          await supabase.from('post_likes').delete().eq('post_id', postId).eq('uid', user.uid);
        } catch (_) {}
        await supabase.from('posts').update({ likes_count: Math.max(0, (targetPost.likes_count || 1) - 1) }).eq('id', postId);
      }
    } catch (e) {
      console.warn('Like toggle error:', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <TouchableOpacity
        style={styles.sectionHeaderCard}
        activeOpacity={0.85}
        onPress={() => router.push('/(tabs)/community')}
      >
        <View style={styles.sectionHeaderLeft}>
          <View style={styles.sectionIcon}>
            <Ionicons name="people" size={20} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Community Feed</Text>
            <Text style={styles.sectionSubtitle}>Workout tips, progress, and motivation.</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
      </TouchableOpacity>

      {/* Real Posts */}
      {loading ? (
        <View style={{ paddingHorizontal: 16 }}>
          <View style={styles.skeletonCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Skeleton width={36} height={36} borderRadius={18} />
              <Skeleton width={110} height={14} borderRadius={4} />
            </View>
            <Skeleton width="100%" height={200} borderRadius={12} style={{ marginVertical: 10 }} />
          </View>
        </View>
      ) : feedPosts.length === 0 ? (
        <TouchableOpacity
          style={styles.emptyCard}
          activeOpacity={0.85}
          onPress={() => router.push('/create-post')}
        >
          <Ionicons name="add-circle" size={32} color={Colors.primary} />
          <Text style={styles.emptyText}>Be the first to share a post with the community!</Text>
        </TouchableOpacity>
      ) : (
        feedPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onToggleLike={handleToggleLike}
            onPressUser={(uid) => router.push({ pathname: '/user-profile', params: { uid } })}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 22, paddingBottom: 20 },

  sectionHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(16,185,129,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  sectionSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },

  skeletonCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },

  emptyCard: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
