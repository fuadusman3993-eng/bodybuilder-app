import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import PostCard, { RealPost } from '../../components/home/PostCard';
import { useUserStore } from '../../store/userStore';
import { supabase } from '../../lib/supabase';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Skeleton from '../../components/ui/Skeleton';

const tabs = ['For You', 'Following', 'Recent'];

let cachedPosts: RealPost[] = [];
let cacheTimestamp = 0;
const CACHE_TTL_MS = 3 * 60 * 1000;

export default function CommunityScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState('For You');
  const [posts, setPosts] = useState<RealPost[]>(cachedPosts);
  const [loading, setLoading] = useState(cachedPosts.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [followingUids, setFollowingUids] = useState<string[]>([]);

  const fetchFollowing = async () => {
    if (!user?.uid) return;
    try {
      const { data } = await supabase
        .from('follows')
        .select('following_uid')
        .eq('follower_uid', user.uid);
      if (data) {
        setFollowingUids(data.map(f => f.following_uid));
      }
    } catch (_) {}
  };

  const fetchPosts = useCallback(async (showLoading = false) => {
    if (showLoading && cachedPosts.length === 0) setLoading(true);
    try {
      // 1. Fetch raw posts from Supabase
      const { data: dbPosts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // 2. Fetch user's likes if logged in
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

      // 3. Enrich posts with author info (role, name, avatar, city)
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

      setPosts(enriched);
      cachedPosts = enriched;
      cacheTimestamp = Date.now();
    } catch (e) {
      console.warn('Community fetch error:', e);
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchFollowing();
    const now = Date.now();
    if (cachedPosts.length > 0 && (now - cacheTimestamp) < CACHE_TTL_MS) {
      setPosts(cachedPosts);
      setLoading(false);
      if (now - cacheTimestamp > 60 * 1000) {
        fetchPosts(false);
      }
      return;
    }
    fetchPosts(true);
  }, [fetchPosts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts(false);
  };

  const handleToggleLike = async (postId: string) => {
    if (!user?.uid) {
      router.push('/login');
      return;
    }

    // Optimistic UI update
    setPosts(prev => {
      const next = prev.map(p => {
        if (p.id === postId) {
          const wasLiked = !!p.isLiked;
          return {
            ...p,
            isLiked: !wasLiked,
            likes_count: wasLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1,
          };
        }
        return p;
      });
      cachedPosts = next;
      return next;
    });

    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;
    const willLike = !targetPost.isLiked;

    try {
      if (willLike) {
        try {
          await supabase.from('post_likes').insert({ post_id: postId, uid: user.uid });
        } catch (_) {}
        await supabase.from('posts').update({ likes_count: (targetPost.likes_count || 0) + 1 }).eq('id', postId);
        if (targetPost.uid !== user.uid) {
          try {
            await supabase.from('notifications').insert({
              user_uid: targetPost.uid,
              sender_uid: user.uid,
              type: 'like_post',
              message: `${user.name || 'Someone'} liked your post.`,
            });
          } catch (_) {}
        }
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

  // Algorithmic feed filtering
  const getFilteredPosts = () => {
    if (activeTab === 'Following') {
      return posts.filter(p => followingUids.includes(p.uid));
    }
    if (activeTab === 'Recent') {
      return [...posts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    // "For You" - Algorithmic ranking (Coach priority + Likes engagement + Recency decay)
    const now = Date.now();
    return [...posts].sort((a, b) => {
      const aCoachBonus = a.isCoach ? 30 : 0;
      const bCoachBonus = b.isCoach ? 30 : 0;
      const aLikesScore = (a.likes_count || 0) * 3;
      const bLikesScore = (b.likes_count || 0) * 3;
      const aHours = Math.max(0, (now - new Date(a.created_at).getTime()) / (1000 * 60 * 60));
      const bHours = Math.max(0, (now - new Date(b.created_at).getTime()) / (1000 * 60 * 60));
      const aScore = aCoachBonus + aLikesScore - (aHours * 0.4);
      const bScore = bCoachBonus + bLikesScore - (bHours * 0.4);
      return bScore - aScore;
    });
  };

  const displayedPosts = getFilteredPosts();

  const handlePressUser = (uid: string) => {
    router.push({ pathname: '/user-profile', params: { uid } });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <TouchableOpacity
          style={styles.createBtn}
          activeOpacity={0.8}
          onPress={() => router.push('/create-post')}
        >
          <Ionicons name="add" size={20} color="#000" />
          <Text style={styles.createBtnText}>Post</Text>
        </TouchableOpacity>
      </View>

      {/* Top Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feed */}
      {loading ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          {[1, 2].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonHeader}>
                <Skeleton width={38} height={38} borderRadius={19} />
                <View style={{ gap: 6 }}>
                  <Skeleton width={120} height={14} borderRadius={4} />
                  <Skeleton width={70} height={10} borderRadius={4} />
                </View>
              </View>
              <Skeleton width="100%" height={320} borderRadius={12} style={{ marginVertical: 12 }} />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Skeleton width={50} height={20} borderRadius={4} />
                <Skeleton width={50} height={20} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      ) : displayedPosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={54} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>
            {activeTab === 'Following' ? 'No posts from people you follow' : 'No posts yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'Following'
              ? 'Follow coaches or athletes to see their updates here.'
              : 'Be the first to share your workout and inspire the community!'}
          </Text>
          <TouchableOpacity
            style={styles.emptyActionBtn}
            onPress={() => router.push('/create-post')}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={18} color="#000" />
            <Text style={styles.emptyActionBtnText}>Share a Post</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayedPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onToggleLike={handleToggleLike}
              onPressUser={handlePressUser}
            />
          )}
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
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  createBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 13,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  tab: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: '#000',
    fontWeight: '700',
  },
  feedContainer: {
    paddingBottom: 40,
  },
  skeletonCard: {
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 14,
    padding: 12,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
    marginTop: 12,
  },
  emptyActionBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
});
