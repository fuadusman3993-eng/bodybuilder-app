import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Image, RefreshControl, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useUserStore, UserTier } from '../../store/userStore';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { signOut } from '../../lib/authService';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { supabase } from '../../lib/supabase';
import { getWallet } from '../../lib/walletService';
import { getProfile } from '../../lib/profileService';
import Skeleton from '../../components/ui/Skeleton';
import BrandLogo from '../../components/ui/BrandLogo';
import ProfileMoreModal from '../../components/profile/ProfileMoreModal';
import AuthBottomSheetModal from '../../components/auth/AuthBottomSheetModal';
import { saveLastAccount } from '../../lib/savedAccountService';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 28 - 16) / 3;
const BG = Colors.background;
const CARD_BG = Colors.surface;
const BORDER = Colors.border;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser, authInitialized, setTier } = useUserStore();

  const isCoach = user.role === 'coach';
  const defaultTabs = isCoach
    ? ['Posts', 'Reposts', 'Clients', 'Saved']
    : ['Posts', 'Reposts', 'Progress', 'Saved'];

  const [activeTab, setActiveTab] = useState('Posts');
  const [profileData, setProfileData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [repostedPosts, setRepostedPosts] = useState<any[]>([]);
  const [loadingReposts, setLoadingReposts] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  // Sync pro status from Supabase wallet
  const syncProStatus = async () => {
    const uid = auth.currentUser?.uid || user.uid;
    if (!uid) return;
    try {
      const w = await getWallet(uid);
      if (w?.pro_until && new Date(w.pro_until) > new Date()) {
        setTier(UserTier.PREMIUM);
      } else {
        setTier(UserTier.FREE);
      }
    } catch (_) {}
  };

  useFocusEffect(
    useCallback(() => {
      if (user.tier !== UserTier.GUEST) loadAll();
    }, [user.uid])
  );

  const loadAll = async () => {
    await Promise.all([fetchProfile(), fetchSupabaseStats(), fetchSavedPosts(), fetchRepostedPosts(), syncProStatus()]);
  };

  const fetchProfile = async () => {
    try {
      const uid = auth.currentUser?.uid || user.uid;
      if (!uid) return;

      // Primary: read authoritative profile from Supabase
      const profile = await getProfile(uid);
      if (profile) {
        setProfileData({
          name: profile.name,
          username: profile.username || profile.name,
          avatar: profile.avatar_url,
          city: profile.city,
          country: profile.country,
          bio: profile.bio,
          role: profile.role,
        });
      } else {
        const docSnap = await getDoc(doc(db, 'users', uid)).catch(() => null);
        if (docSnap?.exists()) setProfileData(docSnap.data());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSupabaseStats = async () => {
    try {
      const uid = user.uid;
      if (!uid) return;

      // Real posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('uid', uid)
        .order('created_at', { ascending: false });
      setPosts(postsData || []);

      // Followers
      const { count: fCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_uid', uid);
      setFollowers(fCount || 0);

      // Following
      const { count: fgCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_uid', uid);
      setFollowing(fgCount || 0);
    } catch (e) {
      console.warn(e);
    }
  };

  const fetchSavedPosts = async () => {
    const uid = user.uid;
    if (!uid) return;
    setLoadingSaved(true);
    try {
      const { data: saves, error } = await supabase
        .from('post_saves')
        .select('post_id, created_at')
        .eq('uid', uid)
        .order('created_at', { ascending: false });

      if (error || !saves || saves.length === 0) {
        setSavedPosts([]);
        setLoadingSaved(false);
        return;
      }

      const postIds = saves.map((s: any) => s.post_id);
      const { data: dbPosts } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds);

      if (dbPosts) {
        const ordered = postIds
          .map((id: string) => dbPosts.find((p: any) => p.id === id))
          .filter(Boolean);
        setSavedPosts(ordered);
      }
    } catch (e) {
      console.warn('Error fetching saved posts in profile:', e);
    } finally {
      setLoadingSaved(false);
    }
  };

  const fetchRepostedPosts = async () => {
    const uid = user.uid;
    if (!uid) return;
    setLoadingReposts(true);
    try {
      const { data: reposts, error } = await supabase
        .from('post_reposts')
        .select('post_id, created_at')
        .eq('uid', uid)
        .order('created_at', { ascending: false });

      if (error || !reposts || reposts.length === 0) {
        setRepostedPosts([]);
        setLoadingReposts(false);
        return;
      }

      const postIds = reposts.map((r: any) => r.post_id);
      const { data: dbPosts } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds);

      if (dbPosts) {
        const ordered = postIds
          .map((id: string) => dbPosts.find((p: any) => p.id === id))
          .filter(Boolean);
        setRepostedPosts(ordered);
      }
    } catch (e) {
      console.warn('Error fetching reposted posts in profile:', e);
    } finally {
      setLoadingReposts(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'Saved') {
      fetchSavedPosts();
    } else if (activeTab === 'Reposts') {
      fetchRepostedPosts();
    }
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      if (user.uid) {
        await saveLastAccount({
          uid: user.uid,
          name: user.name || 'User',
          email: user.email || '',
          avatar: user.avatar,
          role: user.role,
          authProvider: 'google',
        });
      }
      await signOut();
      setUser({
        tier: UserTier.GUEST,
        uid: undefined,
        name: undefined,
        email: undefined,
        avatar: undefined,
        role: undefined,
        city: undefined,
      });
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  // ── Data ──────────────────────────────────────────────────
  const name = profileData?.name || profileData?.username || user.name || 'Athlete';
  const rawUsername = profileData?.username || (user as any).username || name.toLowerCase().replace(/\s+/g, '_');
  const username = rawUsername.replace(/^@/, '');
  const bio = profileData?.bio || (isCoach ? 'Ready to train you to the next level.' : 'Fitness is not just a goal, it\'s a lifestyle.');
  const goal = profileData?.goal || 'Build a Stronger Me';
  const city = user.city || profileData?.city || 'Addis Ababa';
  
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10B981&color=fff&size=150`;
  const avatarUri = profileData?.avatar || user.avatar || `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${user.uid}.jpg`;

  const stat1Label = 'Posts';
  const stat1Value = posts.length;
  const stat2Label = 'Followers';
  const stat2Value = followers;
  const stat3Label = 'Following';
  const stat3Value = following;

  const handleShareProfile = async () => {
    try {
      const profileUrl = `https://bodybuilder-app-phi.vercel.app/user-profile?uid=${user.uid}`;
      await Share.share({
        title: `${name}'s FitPulse Profile`,
        message: `Check out ${name} (@${username}) on FitPulse: ${profileUrl}`,
        url: profileUrl,
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const [unreadCount, setUnreadCount] = useState(0);
  
  useFocusEffect(
    useCallback(() => {
      if (user.uid) {
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_uid', user.uid)
          .eq('is_read', false)
          .then(({ count }) => {
            setUnreadCount(count || 0);
          });
      }
    }, [user.uid])
  );

  // Note: Guest users view the TikTok-style login/signup state in-place without forced redirect

  // ── Render ────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <BrandLogo size="small" showText={false} />
        </View>
        {(!user?.uid || user.tier === UserTier.GUEST) ? null : (
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setShowMoreModal(true)}>
              <Ionicons name="ellipsis-horizontal" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {!authInitialized || (user?.uid && !profileData && user.tier !== UserTier.GUEST) ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Centered Avatar Skeleton */}
          <View style={styles.heroCenterWrap}>
            <View style={{ width: 96, height: 96, borderRadius: 48, overflow: 'hidden' }}>
              <Skeleton width={96} height={96} borderRadius={48} />
            </View>
          </View>

          {/* Centered Identity Skeleton */}
          <View style={[styles.heroIdentityBlock, { alignItems: 'center' }]}>
            <Skeleton width={160} height={22} borderRadius={6} style={{ marginBottom: 6 }} />
            <Skeleton width={110} height={14} borderRadius={4} style={{ marginBottom: 10 }} />
            <Skeleton width="80%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
            <Skeleton width="55%" height={14} borderRadius={4} style={{ marginBottom: 14 }} />
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
              <Skeleton width={80} height={26} borderRadius={13} />
              <Skeleton width={110} height={26} borderRadius={13} />
            </View>
          </View>

          {/* Stats Card Skeleton */}
          <View style={[styles.statsCard, { justifyContent: 'space-around', paddingVertical: 18 }]}>
            <Skeleton width={50} height={28} borderRadius={6} />
            <View style={styles.statDivider} />
            <Skeleton width={50} height={28} borderRadius={6} />
            <View style={styles.statDivider} />
            <Skeleton width={50} height={28} borderRadius={6} />
          </View>

          {/* Action Buttons Skeleton */}
          <View style={styles.actionBlock}>
            <View style={styles.actionRow}>
              <Skeleton width="48%" height={44} borderRadius={12} />
              <Skeleton width="48%" height={44} borderRadius={12} />
            </View>
            <View style={styles.actionRow}>
              <Skeleton width="48%" height={44} borderRadius={12} />
              <Skeleton width="48%" height={44} borderRadius={12} />
            </View>
          </View>

          {/* Grid skeleton */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} width={GRID_ITEM_SIZE} height={GRID_ITEM_SIZE * 1.25} borderRadius={6} />
            ))}
          </View>
        </ScrollView>
      ) : (!user?.uid || user.tier === UserTier.GUEST) ? (
        <View style={styles.guestCenterWrap}>
          {/* User Outline Icon matching Image 1 */}
          <View style={styles.guestOutlineIconWrap}>
            <Ionicons name="person-outline" size={70} color="#757575" />
          </View>
          
          <Text style={styles.guestSubtitle}>Log in to existing account</Text>

          <TouchableOpacity
            style={styles.guestLoginPillBtn}
            activeOpacity={0.85}
            onPress={() => setShowAuthModal(true)}
          >
            <Text style={styles.guestLoginPillBtnText}>Login</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {/* ── Centered Pro Hero: Avatar ── */}
          <View style={styles.heroCenterWrap}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarRing}>
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.avatar}
                  defaultSource={{ uri: defaultAvatar }}
                />
              </View>
              <TouchableOpacity
                style={styles.addStoryBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/add-story')}
              >
                <Ionicons name="add" size={16} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Centered Identity Block: Name, @Username, Bio, Badges ── */}
          <View style={styles.heroIdentityBlock}>
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{name}</Text>
              {isCoach && (
                <Ionicons name="checkmark-circle" size={18} color={Colors.primary} style={{ marginLeft: 5 }} />
              )}
              {user.tier === UserTier.PREMIUM && (
                <View style={styles.proPillBadge}>
                  <Ionicons name="star" size={10} color="#000" />
                  <Text style={styles.proPillBadgeText}>PRO</Text>
                </View>
              )}
            </View>

            <Text style={styles.usernameText}>@{username}</Text>

            {bio ? <Text style={styles.bioText}>{bio}</Text> : null}

            <View style={styles.badgesRow}>
              {city ? (
                <View style={styles.infoBadge}>
                  <Ionicons name="location-outline" size={12} color={Colors.primary} />
                  <Text style={styles.infoBadgeText}>{city}</Text>
                </View>
              ) : null}
              {goal ? (
                <View style={styles.infoBadge}>
                  <Ionicons name="trophy-outline" size={12} color={Colors.primary} />
                  <Text style={styles.infoBadgeText}>{goal}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* ── Strict 3-Column Stats Card ── */}
          <View style={styles.statsCard}>
            <View style={styles.statCol}>
              <Text style={styles.statCount}>{stat1Value}</Text>
              <Text style={styles.statName}>{stat1Label}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statCount}>{stat2Value}</Text>
              <Text style={styles.statName}>{stat2Label}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statCount}>{stat3Value}</Text>
              <Text style={styles.statName}>{stat3Label}</Text>
            </View>
          </View>

          {/* ── Pro Action Buttons ── */}
          <View style={styles.actionBlock}>
            {/* Row 1: Edit & Share */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtnDark}
                activeOpacity={0.8}
                onPress={() => router.push('/edit-profile')}
              >
                <Ionicons name="create-outline" size={16} color="#FFF" />
                <Text style={styles.actionBtnDarkText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnDark}
                activeOpacity={0.8}
                onPress={handleShareProfile}
              >
                <Ionicons name="share-social-outline" size={16} color="#FFF" />
                <Text style={styles.actionBtnDarkText}>Share Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Row 2: Role-based actions */}
            {isCoach ? (
              <TouchableOpacity
                style={styles.coachDashboardBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/coach-dashboard')}
              >
                <Ionicons name="speedometer-outline" size={17} color="#000" />
                <Text style={styles.coachDashboardBtnText}>Coach Dashboard</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.findCoachBtn}
                  activeOpacity={0.85}
                  onPress={() => router.push('/coaches')}
                >
                  <Ionicons name="search" size={16} color="#000" />
                  <Text style={styles.findCoachBtnText}>Find Coach</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.becomeCoachBtn}
                  activeOpacity={0.8}
                  onPress={() => router.push('/coach-onboarding')}
                >
                  <Ionicons name="barbell-outline" size={16} color={Colors.primary} />
                  <Text style={styles.becomeCoachBtnText}>Become Coach</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

        {/* ── Tabs ── */}
        <View style={styles.tabsWrap}>
          {defaultTabs.map((tab) => {
            const active = activeTab === tab;
            const icon: any = tab === 'Posts'
              ? 'grid-outline'
              : tab === 'Reposts'
              ? 'repeat-outline'
              : tab === 'Saved'
              ? 'bookmark-outline'
              : 'stats-chart-outline';
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Ionicons name={icon} size={14} color={active ? Colors.textPrimary : Colors.textMuted} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Grid (real posts) ── */}
        {activeTab === 'Posts' && (
          posts.length === 0 ? (
            <TouchableOpacity style={styles.emptyPosts} onPress={() => router.push('/create-post')}>
              <Ionicons name="add-circle-outline" size={48} color={Colors.primary} />
              <Text style={styles.emptyTitle}>Share your first post</Text>
              <Text style={styles.emptySubtitle}>Tap to upload a photo</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.grid}>
              {posts.map((post) => (
                <TouchableOpacity key={post.id} style={styles.gridItem} activeOpacity={0.85}>
                  <Image source={{ uri: post.image_url }} style={styles.gridImg} />
                  <View style={styles.gridOverlay}>
                    <Ionicons name="heart" size={12} color="#FFF" />
                    <Text style={styles.gridLikesText}>{post.likes_count || 0}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        )}

        {/* ── Reposted Posts Grid ── */}
        {activeTab === 'Reposts' && (
          loadingReposts ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : repostedPosts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <Ionicons name="repeat-outline" size={44} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No reposts yet</Text>
              <Text style={styles.emptySubtitle}>Posts you repost from the community will appear here.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {repostedPosts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.gridItem}
                  activeOpacity={0.85}
                  onPress={() => router.push('/(tabs)/community')}
                >
                  <Image source={{ uri: post.image_url }} style={styles.gridImg} />
                  <View style={styles.gridOverlay}>
                    <Ionicons name="repeat" size={12} color={Colors.primary} />
                    <Text style={[styles.gridLikesText, { color: Colors.primary }]}>Repost</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        )}

        {/* ── Saved Posts Grid ── */}
        {activeTab === 'Saved' && (
          loadingSaved ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : savedPosts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <Ionicons name="bookmark-outline" size={44} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No saved posts</Text>
              <Text style={styles.emptySubtitle}>Posts you bookmark in Community will appear here.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {savedPosts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.gridItem}
                  activeOpacity={0.85}
                  onPress={() => router.push('/(tabs)/community')}
                >
                  <Image source={{ uri: post.image_url }} style={styles.gridImg} />
                  <View style={styles.gridOverlay}>
                    <Ionicons name="heart" size={12} color="#FFF" />
                    <Text style={styles.gridLikesText}>{post.likes_count || 0}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        )}

        {activeTab !== 'Posts' && activeTab !== 'Saved' && activeTab !== 'Reposts' && (
          <View style={styles.emptyPosts}>
            <Ionicons name="construct-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptySubtitle}>Coming soon</Text>
          </View>
        )}
      </ScrollView>
      )}

      {/* ── TIKTOK-STYLE MORE MENU MODAL ── */}
      <ProfileMoreModal
        visible={showMoreModal}
        onClose={() => setShowMoreModal(false)}
      />

      {/* ── AUTH BOTTOM SHEET MODAL (Image 2 & 3) ── */}
      <AuthBottomSheetModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { color: Colors.primary, fontSize: 20, fontWeight: '800', fontStyle: 'italic' },
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#101C26',
    borderWidth: 1,
    borderColor: '#192C3C',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: BG,
  },
  notifBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },

  scroll: { paddingBottom: 110 },

  // Hero Center
  heroCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#101C26',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  addStoryBtn: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    backgroundColor: Colors.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: BG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },

  // Identity Block
  heroIdentityBlock: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  nameText: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  usernameText: {
    color: '#8A95A5',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  proPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAB308',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 7,
    gap: 3,
  },
  proPillBadgeText: {
    color: '#000',
    fontSize: 9.5,
    fontWeight: '800',
  },
  bioText: {
    color: '#CBD5E1',
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 12,
    maxWidth: '90%',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101C26',
    borderWidth: 1,
    borderColor: '#1F3142',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  infoBadgeText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },

  // Strict 3-Column Stats Card
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: '#101C26',
    borderWidth: 1,
    borderColor: '#1A2E40',
    borderRadius: 18,
    marginHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCount: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  statName: {
    color: '#8A95A5',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#1E3244',
  },

  // Action Buttons Block
  actionBlock: {
    paddingHorizontal: 16,
    marginBottom: 18,
    gap: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnDark: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15222E',
    borderWidth: 1,
    borderColor: '#223647',
    borderRadius: 12,
    gap: 6,
  },
  actionBtnDarkText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 13.5,
  },
  findCoachBtn: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    gap: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  findCoachBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 13.5,
  },
  becomeCoachBtn: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101F1B',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.4)',
    borderRadius: 12,
    gap: 6,
  },
  becomeCoachBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13.5,
  },
  coachDashboardBtn: {
    width: '100%',
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  coachDashboardBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
  },

  // Tabs
  tabsWrap: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#0D161F',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#192C3C',
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    gap: 5,
  },
  tabBtnActive: {
    backgroundColor: '#152535',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.35)',
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#00E676',
    fontWeight: '700',
  },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 8 },
  gridItem: { width: (width - 28 - 16) / 3, height: (width - 28 - 16) / 3 * 1.15, borderRadius: 12, overflow: 'hidden' },
  gridImg: { width: '100%', height: '100%' },
  gridOverlay: { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3 },
  gridLikesText: { color: '#FFF', fontSize: 11, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },

  // Empty state
  emptyPosts: { alignItems: 'center', paddingVertical: 50, gap: 10 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  emptySubtitle: { color: Colors.textMuted, fontSize: 13 },

  /* TikTok Guest State (Image 1) */
  guestCenterWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: -40,
  },
  guestOutlineIconWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  guestSubtitle: {
    fontSize: 15,
    color: '#A0A0A0',
    fontWeight: '500',
    marginBottom: 24,
    textAlign: 'center',
  },
  guestLoginPillBtn: {
    backgroundColor: Colors.primary,
    width: '100%',
    maxWidth: 240,
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
  guestLoginPillBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
