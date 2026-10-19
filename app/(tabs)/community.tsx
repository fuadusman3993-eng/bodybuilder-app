import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  RefreshControl, TextInput, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import PostCard, { RealPost } from '../../components/home/PostCard';
import { useUserStore, UserTier } from '../../store/userStore';
import { supabase } from '../../lib/supabase';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Skeleton from '../../components/ui/Skeleton';
import BrandLogo from '../../components/ui/BrandLogo';
import AuthRequiredModal from '../../components/auth/AuthRequiredModal';

type TabType = 'Following' | 'For You';

let cachedPosts: RealPost[] = [];
let cacheTimestamp = 0;
const CACHE_TTL_MS = 3 * 60 * 1000;

export function invalidateCommunityCache() {
  cachedPosts = [];
  cacheTimestamp = 0;
}

export default function CommunityScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const params = useLocalSearchParams<{ justPosted?: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('For You');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<RealPost[]>(cachedPosts);
  const [loading, setLoading] = useState(cachedPosts.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const followingUidsRef = useRef<Set<string>>(new Set());
  const [followingUidsArr, setFollowingUidsArr] = useState<string[]>([]);

  // ── Auth Required Prompt Modal ──
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState({ title: '', description: '' });

  const triggerAuthModal = (title?: string, description?: string) => {
    setAuthModalConfig({
      title: title || 'Join the FitPulse Community',
      description: description || 'Log in or sign up to interact with posts, athletes, and coaches.',
    });
    setShowAuthModal(true);
  };

  // ── In-App Success Toast ──
  const [showToast, setShowToast] = useState(false);
  const toastY = useRef(new Animated.Value(-60)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (params.justPosted === '1') {
      fetchPosts(false);
      setShowToast(true);
      Animated.parallel([
        Animated.timing(toastY, { toValue: 16, duration: 320, useNativeDriver: true }),
        Animated.timing(toastOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(toastY, { toValue: -60, duration: 280, useNativeDriver: true }),
          Animated.timing(toastOpacity, { toValue: 0, duration: 280, useNativeDriver: true }),
        ]).start(() => {
          setShowToast(false);
        });
      }, 2600);

      router.setParams({ justPosted: '' });
      return () => clearTimeout(timer);
    }
  }, [params.justPosted]);

  const fetchFollowing = async (): Promise<Set<string>> => {
    if (!user?.uid) return new Set();
    try {
      const { data } = await supabase
        .from('follows')
        .select('following_uid')
        .eq('follower_uid', user.uid);
      const set = new Set<string>((data || []).map((f: any) => f.following_uid));
      followingUidsRef.current = set;
      setFollowingUidsArr(Array.from(set));
      return set;
    } catch (_) {}
    return new Set();
  };

  const fetchPosts = useCallback(async (showLoading = false) => {
    if (showLoading && cachedPosts.length === 0) setLoading(true);
    try {
      // 1. Raw posts
      const { data: dbPosts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // 2. My likes
      let likedSet = new Set<string>();
      if (user?.uid) {
        try {
          const { data: myLikes } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('uid', user.uid);
          if (myLikes) likedSet = new Set(myLikes.map((l: any) => l.post_id));
        } catch (_) {}
      }

      // 3. My bookmarks
      let savedSet = new Set<string>();
      if (user?.uid) {
        try {
          const { data: mySaves } = await supabase
            .from('post_saves')
            .select('post_id')
            .eq('uid', user.uid);
          if (mySaves) savedSet = new Set(mySaves.map((s: any) => s.post_id));
        } catch (_) {}
      }

      // 4. Following set (may already be populated)
      const followingSet = followingUidsRef.current.size > 0
        ? followingUidsRef.current
        : await fetchFollowing();

      // 4.5. Comments count map from post_comments
      const commentCountMap: Record<string, number> = {};
      try {
        const { data: commentRows } = await supabase
          .from('post_comments')
          .select('post_id');
        if (commentRows) {
          for (const c of commentRows) {
            commentCountMap[c.post_id] = (commentCountMap[c.post_id] || 0) + 1;
          }
        }
      } catch (_) {}

      // 4.6. Repost count map + my reposts
      const repostCountMap: Record<string, number> = {};
      let myRepostSet = new Set<string>();
      try {
        const { data: repostRows } = await supabase
          .from('post_reposts')
          .select('post_id, uid');
        if (repostRows) {
          for (const r of repostRows) {
            repostCountMap[r.post_id] = (repostCountMap[r.post_id] || 0) + 1;
            if (r.uid === user?.uid) myRepostSet.add(r.post_id);
          }
        }
      } catch (_) {}

      // 5. Enrich posts with Firebase author info
      const enriched: RealPost[] = [];
      for (const p of dbPosts || []) {
        let isCoach = false;
        let username = p.username || 'User';
        let avatar = p.avatar_url || '';
        let city = '';
        let recentLikerName: string | undefined;

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

        // Fetch most recent liker name & avatar from Firestore (for "Liked by X" row)
        let recentLikerAvatar: string | undefined;
        if ((p.likes_count || 0) > 0) {
          try {
            const { data: likerRows } = await supabase
              .from('post_likes')
              .select('uid, created_at')
              .eq('post_id', p.id)
              .order('created_at', { ascending: false })
              .limit(5);

            if (likerRows && likerRows.length > 0) {
              const otherLiker = likerRows.find((r: any) => r.uid !== user?.uid);
              const chosenUid = otherLiker ? otherLiker.uid : likerRows[0].uid;

              if (chosenUid === user?.uid) {
                recentLikerName = 'you';
                recentLikerAvatar = user?.avatar;
              } else {
                const uSnap = await getDoc(doc(db, 'users', chosenUid));
                if (uSnap.exists()) {
                  const u = uSnap.data();
                  recentLikerName = u.name || u.displayName || u.username || 'Someone';
                  recentLikerAvatar = u.avatar || u.photoURL || undefined;
                }
              }
            }
          } catch (_) {}
        }

        enriched.push({
          id: p.id,
          uid: p.uid,
          username,
          avatar_url: avatar || `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${p.uid}.jpg`,
          image_url: p.image_url,
          caption: p.caption,
          likes_count: p.likes_count || 0,
          comments_count: commentCountMap[p.id] || p.comments_count || 0,
          created_at: p.created_at,
          isLiked: likedSet.has(p.id),
          isBookmarked: savedSet.has(p.id),
          isCoach,
          city,
          recentLikerName,
          recentLikerAvatar,
          reposts_count: repostCountMap[p.id] || 0,
          isReposted: myRepostSet.has(p.id),
          isFollowing: followingSet.has(p.uid),
          isSelf: p.uid === user?.uid,
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

  useFocusEffect(
    useCallback(() => {
      fetchFollowing().then(() => {
        const now = Date.now();
        if (cachedPosts.length > 0 && (now - cacheTimestamp) < CACHE_TTL_MS) {
          setPosts(cachedPosts);
          setLoading(false);
          if (now - cacheTimestamp > 20 * 1000) fetchPosts(false);
          return;
        }
        fetchPosts(cachedPosts.length === 0);
      });
    }, [fetchPosts])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts(false);
  };

  // ── Like Toggle ──
  const handleToggleLike = async (postId: string) => {
    if (!user?.uid || user.tier === UserTier.GUEST) {
      triggerAuthModal('Like this Workout Post', 'Log in or sign up to like posts and encourage athletes.');
      return;
    }

    setPosts(prev => {
      const next = prev.map(p => {
        if (p.id !== postId) return p;
        const wasLiked = !!p.isLiked;
        return {
          ...p,
          isLiked: !wasLiked,
          likes_count: wasLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1,
        };
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
          await supabase.from('post_likes').insert({
            post_id: postId,
            uid: user.uid,
          });
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

  // ── Bookmark Toggle ──
  const handleToggleBookmark = async (postId: string) => {
    if (!user?.uid || user.tier === UserTier.GUEST) {
      triggerAuthModal('Save to Bookmarks', 'Log in or sign up to save workouts and helpful guides.');
      return;
    }

    setPosts(prev => {
      const next = prev.map(p =>
        p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p
      );
      cachedPosts = next;
      return next;
    });

    const targetPost = posts.find(p => p.id === postId);
    const willSave = !targetPost?.isBookmarked;

    try {
      if (willSave) {
        await supabase.from('post_saves').insert({ post_id: postId, uid: user.uid });
      } else {
        await supabase.from('post_saves').delete().eq('post_id', postId).eq('uid', user.uid);
      }
    } catch (e) {
      console.warn('Bookmark toggle error:', e);
    }
  };

  // ── Post Deletion ──
  const handleDeletePost = async (postId: string) => {
    setPosts(prev => {
      const next = prev.filter(p => p.id !== postId);
      cachedPosts = next;
      return next;
    });

    try {
      await Promise.allSettled([
        supabase.from('post_likes').delete().eq('post_id', postId),
        supabase.from('post_comments').delete().eq('post_id', postId),
        supabase.from('post_saves').delete().eq('post_id', postId),
      ]);
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
    } catch (e: any) {
      console.warn('Delete post error:', e);
      fetchPosts(false);
    }
  };

  // ── Repost Toggle ──
  const handleToggleRepost = async (postId: string) => {
    if (!user?.uid || user.tier === UserTier.GUEST) {
      triggerAuthModal('Repost to Your Profile', 'Log in or sign up to share workouts with your followers.');
      return;
    }

    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;
    const willRepost = !targetPost.isReposted;

    // Optimistic update
    setPosts(prev => {
      const next = prev.map(p => {
        if (p.id !== postId) return p;
        const wasReposted = !!p.isReposted;
        return {
          ...p,
          isReposted: !wasReposted,
          reposts_count: wasReposted
            ? Math.max(0, (p.reposts_count || 0) - 1)
            : (p.reposts_count || 0) + 1,
        };
      });
      cachedPosts = next;
      return next;
    });

    try {
      if (willRepost) {
        await supabase.from('post_reposts').insert({ post_id: postId, uid: user.uid });
      } else {
        await supabase.from('post_reposts').delete()
          .eq('post_id', postId).eq('uid', user.uid);
      }
    } catch (e) {
      // Rollback on error
      setPosts(prev => {
        const rolled = prev.map(p =>
          p.id !== postId ? p : {
            ...p,
            isReposted: targetPost.isReposted,
            reposts_count: targetPost.reposts_count,
          }
        );
        cachedPosts = rolled;
        return rolled;
      });
      console.warn('Repost toggle error:', e);
    }
  };

  // ── Follow Toggle ──
  const handleFollowToggle = async (targetUid: string, isCurrentlyFollowing: boolean) => {
    if (!user?.uid || user.tier === UserTier.GUEST) {
      triggerAuthModal('Follow this Athlete', 'Log in or sign up to follow coaches and stay updated.');
      return;
    }

    // Optimistic: flip isFollowing on all posts by this user
    setPosts(prev => {
      const next = prev.map(p =>
        p.uid === targetUid ? { ...p, isFollowing: !isCurrentlyFollowing } : p
      );
      cachedPosts = next;
      return next;
    });

    // Update local set
    const newSet = new Set(followingUidsRef.current);
    if (isCurrentlyFollowing) {
      newSet.delete(targetUid);
    } else {
      newSet.add(targetUid);
    }
    followingUidsRef.current = newSet;
    setFollowingUidsArr(Array.from(newSet));

    try {
      if (isCurrentlyFollowing) {
        await supabase.from('follows')
          .delete()
          .eq('follower_uid', user.uid)
          .eq('following_uid', targetUid);
      } else {
        await supabase.from('follows').insert({
          follower_uid: user.uid,
          following_uid: targetUid,
        });
        try {
          await supabase.from('notifications').insert({
            user_uid: targetUid,
            sender_uid: user.uid,
            type: 'follow',
            message: `${user.name || 'Someone'} started following you.`,
          });
        } catch (_) {}
      }
    } catch (e) {
      console.warn('Follow toggle error:', e);
      // Revert on error
      setPosts(prev => {
        const next = prev.map(p =>
          p.uid === targetUid ? { ...p, isFollowing: isCurrentlyFollowing } : p
        );
        cachedPosts = next;
        return next;
      });
    }
  };

  // ── Feed Filtering & Sorting ──
  const getFilteredPosts = () => {
    let list = posts;

    // 1. Tab filter
    if (activeTab === 'Following') {
      list = list.filter(p => followingUidsArr.includes(p.uid) || !!p.isSelf);
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        (p.caption && p.caption.toLowerCase().includes(q)) ||
        (p.username && p.username.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q))
      );
    }

    // 3. Chronological for Following, Algorithmic for For You
    if (activeTab === 'Following') {
      return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const now = Date.now();
    return [...list].sort((a, b) => {
      const aScore = (a.isCoach ? 30 : 0) + (a.likes_count || 0) * 3
        - Math.max(0, (now - new Date(a.created_at).getTime()) / 3600000) * 0.4;
      const bScore = (b.isCoach ? 30 : 0) + (b.likes_count || 0) * 3
        - Math.max(0, (now - new Date(b.created_at).getTime()) / 3600000) * 0.4;
      return bScore - aScore;
    });
  };

  const displayedPosts = getFilteredPosts();

  const handlePressUser = (uid: string) => {
    router.push({ pathname: '/user-profile', params: { uid } });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── In-App Success Toast ── */}
      {showToast && (
        <Animated.View
          style={[
            styles.toastPill,
            {
              transform: [{ translateY: toastY }],
              opacity: toastOpacity,
            },
          ]}
        >
          <View style={styles.toastIconWrap}>
            <Ionicons name="checkmark" size={14} color="#000" />
          </View>
          <Text style={styles.toastText}>Post shared successfully!</Text>
        </Animated.View>
      )}

      {/* ── TikTok-Style Unified Top Bar ── */}
      <View style={styles.header}>
        {/* Left: FitPulse "F" Logo */}
        <View style={styles.headerLeft}>
          <BrandLogo size="small" showText={false} />
        </View>

        {/* Center: Following | For You */}
        <View style={styles.headerCenter}>
          <TouchableOpacity
            style={styles.tiktokTab}
            onPress={() => setActiveTab('Following')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tiktokTabText, activeTab === 'Following' && styles.tiktokTabTextActive]}>
              Following
            </Text>
            {activeTab === 'Following' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tiktokTab}
            onPress={() => setActiveTab('For You')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tiktokTabText, activeTab === 'For You' && styles.tiktokTabTextActive]}>
              For You
            </Text>
            {activeTab === 'For You' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Right: Search Icon */}
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => {
              setShowSearch(prev => !prev);
              if (showSearch) setSearchQuery('');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={showSearch ? 'close' : 'search'}
              size={22}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Collapsible Search Input */}
      {showSearch && (
        <View style={styles.searchBarWrap}>
          <Ionicons name="search" size={17} color={Colors.textMuted} />
          <TextInput
            style={styles.searchBarInput}
            placeholder="Search athletes, coaches or posts..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

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
            onPress={() => {
              if (!user?.uid || user.tier === UserTier.GUEST) {
                triggerAuthModal('Share a Workout Post', 'Log in or sign up to share workouts with the community.');
                return;
              }
              router.push('/create-post');
            }}
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
              onToggleBookmark={handleToggleBookmark}
              onToggleRepost={handleToggleRepost}
              onFollowToggle={handleFollowToggle}
              onPressUser={handlePressUser}
              onDeletePost={handleDeletePost}
              onRequireAuth={triggerAuthModal}
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

      {/* ── Guest Auth Required Modal ── */}
      <AuthRequiredModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title={authModalConfig.title}
        description={authModalConfig.description}
      />
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
    paddingVertical: 10,
    maxWidth: 580,
    width: '100%',
    alignSelf: 'center',
  },
  headerLeft: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  tiktokTab: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tiktokTabText: {
    fontSize: 16.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 0.2,
  },
  tiktokTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  activeTabIndicator: {
    width: 24,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.primary,
    marginTop: 4,
  },
  headerRight: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 10,
    maxWidth: 580,
    alignSelf: 'center',
    width: '92%',
  },
  searchBarInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  feedContainer: {
    paddingBottom: 40,
    paddingHorizontal: 0,
    maxWidth: 580,
    width: '100%',
    alignSelf: 'center',
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

  // ── Success Toast ──
  toastPill: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00E676',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  toastIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastText: {
    color: '#000',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
