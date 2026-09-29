import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useUserStore, UserTier } from '../../store/userStore';
import GuestBlocker from '../../components/ui/GuestBlocker';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { signOut } from '../../lib/authService';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 28 - 16) / 3;
const BG = '#0A0F1A';
const CARD_BG = 'rgba(30, 41, 59, 0.5)';
const BORDER = 'rgba(255,255,255,0.06)';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useUserStore();

  const isCoach = user.role === 'coach';
  const defaultTabs = isCoach
    ? ['Posts', 'Clients', 'Reviews']
    : ['Posts', 'Progress', 'Saved'];

  const [activeTab, setActiveTab] = useState('Posts');
  const [profileData, setProfileData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (user.tier !== UserTier.GUEST) loadAll();
    }, [user.uid])
  );

  const loadAll = async () => {
    await Promise.all([fetchProfile(), fetchSupabaseStats()]);
  };

  const fetchProfile = async () => {
    try {
      const uid = auth.currentUser?.uid || user.uid;
      if (!uid) return;
      const docSnap = await getDoc(doc(db, 'users', uid));
      if (docSnap.exists()) setProfileData(docSnap.data());
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setUser({ tier: UserTier.GUEST });
      router.replace('/login');
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  if (user.tier === UserTier.GUEST) return <GuestBlocker feature="profile" />;

  // ── Data ──────────────────────────────────────────────────
  const name = profileData?.name || profileData?.username || user.name || 'User';
  const username = profileData?.username || name.toLowerCase().replace(/\s+/g, '_');
  const bio = profileData?.bio || (isCoach ? 'Ready to train you to the next level.' : 'Fitness is not just a goal, it\'s a lifestyle.');
  const goal = profileData?.goal || 'Build a Stronger Me';
  const city = user.city || profileData?.city || 'Addis Ababa';
  const avatarUri = `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${user.uid}.jpg`;

  const stat1Label = 'Posts';
  const stat1Value = posts.length;
  const stat2Label = 'Followers';
  const stat2Value = followers;
  const stat3Label = 'Following';
  const stat3Value = following;



  // ── Render ────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Ionicons name="fitness" size={22} color={Colors.primary} />
          <Text style={styles.brandText}>FitPulse</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
            <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>3</Text></View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
            <Ionicons name="ellipsis-horizontal" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* ── Top row: avatar | name+badge | edit ── */}
        <View style={styles.topRow}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatarRing}>
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatar}
                defaultSource={{ uri: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150' }}
              />
            </View>
            <TouchableOpacity style={styles.addStoryBtn} onPress={() => router.push('/create-post')}>
              <Ionicons name="add" size={14} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Name / username / status */}
          <View style={styles.nameBlock}>
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{name}</Text>
              {isCoach && <Ionicons name="checkmark-circle" size={15} color={Colors.textPrimary} style={{ marginLeft: 4 }} />}
            </View>
            <Text style={styles.usernameText}>@{username}</Text>
            <View style={styles.activePill}>
              <View style={styles.activeDot} />
              <Text style={styles.activePillText}>Active Now</Text>
            </View>
          </View>

          {/* Edit button */}
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
            <Ionicons name="person-outline" size={12} color={Colors.primary} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          {[
            { label: stat1Label, value: stat1Value },
            { label: stat2Label, value: stat2Value },
            { label: stat3Label, value: stat3Value },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={styles.statDivider} />}
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* ── Bio card ── */}
        <View style={styles.bioCard}>
          <Text style={styles.bioQuote}>"Better Every Day"</Text>
          <Text style={styles.bioText}>{bio}</Text>
          <View style={styles.badgesRow}>
            <View style={styles.infoBadge}>
              <Ionicons name="location-outline" size={11} color={Colors.primary} />
              <Text style={styles.infoBadgeText}>{city}</Text>
            </View>
            <View style={styles.infoBadge}>
              <Ionicons name="calendar-outline" size={11} color={Colors.primary} />
              <Text style={styles.infoBadgeText}>Joined Jan 2026</Text>
            </View>
            <View style={styles.infoBadge}>
              <Ionicons name="trophy-outline" size={11} color={Colors.primary} />
              <Text style={styles.infoBadgeText}>Goal: {goal}</Text>
            </View>
          </View>
        </View>

        {/* ── Action pills ── */}
        <View style={styles.pillRow}>
          {isCoach ? (
            <TouchableOpacity style={styles.pill} onPress={() => router.push('/coach-dashboard')}>
              <Ionicons name="grid-outline" size={15} color={Colors.primary} />
              <Text style={styles.pillText}>Dashboard</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.pill} onPress={() => router.push('/coaches')}>
                <Ionicons name="search-outline" size={15} color={Colors.primary} />
                <Text style={styles.pillText}>Find Coach</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pill} onPress={() => router.push('/my-coach')}>
                <Ionicons name="person-outline" size={15} color={Colors.primary} />
                <Text style={styles.pillText}>My Coach</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pill} onPress={() => router.push('/coach-onboarding')}>
                <Ionicons name="briefcase-outline" size={15} color={Colors.primary} />
                <Text style={styles.pillText}>Become Coach</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── Tabs ── */}
        <View style={styles.tabsWrap}>
          {defaultTabs.map((tab) => {
            const active = activeTab === tab;
            const icon: any = tab === 'Posts'
              ? 'grid-outline'
              : tab.includes('Clients') || tab.includes('Progress')
              ? 'stats-chart-outline'
              : 'bookmark-outline';
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

        {activeTab !== 'Posts' && (
          <View style={styles.emptyPosts}>
            <Ionicons name="construct-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptySubtitle}>Coming soon</Text>
          </View>
        )}
      </ScrollView>
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
  headerActions: { flexDirection: 'row', gap: 14 },
  iconBtn: { position: 'relative' },
  notifBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2 },
  notifBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },

  scroll: { paddingBottom: 110 },

  // Top row
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, marginTop: 14, gap: 12 },
  avatarWrap: { position: 'relative' },
  avatarRing: { width: 82, height: 82, borderRadius: 41, borderWidth: 2, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 74, height: 74, borderRadius: 37 },
  addStoryBtn: { position: 'absolute', bottom: 1, right: 1, backgroundColor: Colors.primary, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: BG },

  nameBlock: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  nameText: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700' },
  usernameText: { color: Colors.textMuted, fontSize: 12, marginBottom: 6 },
  activePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start' },
  activeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#10B981', marginRight: 4 },
  activePillText: { color: '#10B981', fontSize: 10, fontWeight: '600' },

  editBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 18, gap: 4 },
  editBtnText: { color: Colors.primary, fontSize: 11, fontWeight: '600' },

  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 22, marginHorizontal: 24, gap: 0 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 3 },
  statLabel: { color: Colors.textMuted, fontSize: 11 },
  statDivider: { width: 1, height: 32, backgroundColor: BORDER },

  // Bio card
  bioCard: { backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 16, margin: 16, marginTop: 20, padding: 16 },
  bioQuote: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  bioText: { color: Colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 12 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, gap: 4 },
  infoBadgeText: { color: Colors.textMuted, fontSize: 11 },

  // Action pills
  pillRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 10 },
  pill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: Colors.primary, backgroundColor: 'rgba(16,185,129,0.08)', paddingVertical: 10, borderRadius: 14 },
  pillText: { color: Colors.primary, fontWeight: '700', fontSize: 12 },

  // Tabs
  tabsWrap: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 14, backgroundColor: CARD_BG, borderRadius: 30, borderWidth: 1, borderColor: BORDER, padding: 4 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 26, gap: 5 },
  tabBtnActive: { backgroundColor: 'rgba(16,185,129,0.15)' },
  tabText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: Colors.textPrimary },

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
});
