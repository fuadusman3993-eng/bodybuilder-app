import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Dimensions, Image, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/colors';
import Skeleton from '../components/ui/Skeleton';

const { width } = Dimensions.get('window');
const BG = '#0A0F1A';
const CARD_BG = 'rgba(30, 41, 59, 0.5)';
const BORDER = 'rgba(255,255,255,0.06)';
const GRID_SIZE = (width - 28 - 16) / 3;

export default function UserProfilePage() {
  const router = useRouter();
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const { user: currentUser } = useUserStore();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [coachData, setCoachData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isOwnProfile = uid === currentUser.uid;

  useEffect(() => {
    if (uid) loadAll();
  }, [uid]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchFirebaseProfile(),
      fetchSupabaseData(),
    ]);
    setLoading(false);
  };

  const fetchFirebaseProfile = async () => {
    try {
      const snap = await getDoc(doc(db, 'users', uid!));
      if (snap.exists()) setProfile(snap.data());
    } catch (e) { console.warn(e); }
  };

  const fetchSupabaseData = async () => {
    try {
      // Coach profile
      const { data: cp } = await supabase
        .from('coach_profiles')
        .select('*')
        .eq('uid', uid)
        .single();
      setCoachData(cp || null);

      // Posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('uid', uid)
        .order('created_at', { ascending: false });
      setPosts(postsData || []);

      // Followers count
      const { count: fCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_uid', uid);
      setFollowers(fCount || 0);

      // Following count
      const { count: fgCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_uid', uid);
      setFollowing(fgCount || 0);

      // Is current user following this profile?
      if (currentUser.uid && currentUser.uid !== uid) {
        const { data: fRow } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_uid', currentUser.uid)
          .eq('following_uid', uid)
          .single();
        setIsFollowing(!!fRow);

        // Has request been sent?
        const { data: rRow } = await supabase
          .from('coach_requests')
          .select('id')
          .eq('coach_uid', uid)
          .eq('trainee_uid', currentUser.uid)
          .single();
        setRequestSent(!!rRow);
      }
    } catch (e) { console.warn(e); }
  };

  const handleFollow = async () => {
    if (!currentUser.uid || actionLoading) return;
    setActionLoading(true);
    try {
      if (isFollowing) {
        await supabase.from('follows')
          .delete()
          .eq('follower_uid', currentUser.uid)
          .eq('following_uid', uid);
        setIsFollowing(false);
        setFollowers(f => Math.max(0, f - 1));
      } else {
        await supabase.from('follows').insert({
          follower_uid: currentUser.uid,
          following_uid: uid,
        });
        setIsFollowing(true);
        setFollowers(f => f + 1);
      }
    } catch (e) { console.warn(e); }
    setActionLoading(false);
  };

  const handleSendRequest = async () => {
    if (!currentUser.uid || actionLoading || requestSent) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('coach_requests').insert({
        coach_uid: uid,
        trainee_uid: currentUser.uid,
        status: 'pending',
      });
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setRequestSent(true);
        // Add notification for coach
        await supabase.from('notifications').insert({
          user_uid: uid,
          sender_uid: currentUser.uid,
          type: 'request',
          message: `${currentUser.name || 'A user'} wants you to be their coach.`,
        });
        Alert.alert('✅ Request Sent!', 'The coach will review your request.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header skeleton */}
        <View style={styles.header}>
          <Skeleton width={36} height={36} borderRadius={18} />
          <Skeleton width={120} height={18} borderRadius={4} />
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Avatar + Stats row */}
          <View style={styles.topSection}>
            <View style={styles.avatarRing}>
              <Skeleton width={86} height={86} borderRadius={43} />
            </View>
            <View style={styles.statsRow}>
              {[1, 2, 3].map(i => (
                <View key={i} style={styles.statItem}>
                  <Skeleton width={28} height={22} borderRadius={4} />
                  <Skeleton width={44} height={11} borderRadius={3} style={{ marginTop: 6 }} />
                </View>
              ))}
            </View>
          </View>

          {/* Name / role / bio */}
          <View style={styles.nameSection}>
            <Skeleton width={150} height={20} borderRadius={4} style={{ marginBottom: 6 }} />
            <Skeleton width={90} height={13} borderRadius={4} style={{ marginBottom: 10 }} />
            <Skeleton width="90%" height={13} borderRadius={4} style={{ marginBottom: 5 }} />
            <Skeleton width="70%" height={13} borderRadius={4} style={{ marginBottom: 12 }} />
            <View style={styles.badgesRow}>
              <Skeleton width={64} height={24} borderRadius={10} />
              <Skeleton width={80} height={24} borderRadius={10} />
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            <Skeleton width="48%" height={40} borderRadius={10} />
            <Skeleton width="48%" height={40} borderRadius={10} />
          </View>

          {/* Grid tab icon */}
          <View style={styles.gridHeader}>
            <Skeleton width={24} height={24} borderRadius={4} />
          </View>

          {/* Photo grid */}
          <View style={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton
                key={i}
                width={GRID_SIZE}
                height={GRID_SIZE * 1.15}
                borderRadius={10}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const name = profile?.name || profile?.username || 'User';
  const username = profile?.username || name.toLowerCase().replace(/\s+/g, '_');
  const bio = profile?.bio || (coachData ? 'Ready to train you to the next level.' : 'Fitness enthusiast.');
  const goal = profile?.goal || '';
  const city = profile?.city || '';
  const isCoach = profile?.role === 'coach';
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10B981&color=fff&size=150`;
  const avatarUri = profile?.avatar || `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${uid}.jpg`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>@{username}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Avatar + Stats */}
        <View style={styles.topSection}>
          <View style={styles.avatarRing}>
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatar}
              defaultSource={{ uri: defaultAvatar }}
            />
          </View>

          <View style={styles.statsRow}>
            {[
              { label: 'Posts', value: posts.length },
              { label: 'Followers', value: followers },
              { label: 'Following', value: following },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={styles.statDiv} />}
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Name / role */}
        <View style={styles.nameSection}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>{name}</Text>
            {isCoach && (
              <Ionicons name="checkmark-circle" size={16} color={Colors.primary} style={{ marginLeft: 4 }} />
            )}
          </View>
          {isCoach && (
            <Text style={styles.roleTag}>
              {coachData?.specialty?.join(' · ') || 'Fitness Coach'}
              {coachData?.experience_years ? `  •  ${coachData.experience_years} yrs` : ''}
            </Text>
          )}
          {bio ? <Text style={styles.bioText}>{bio}</Text> : null}
          <View style={styles.badgesRow}>
            {city ? (
              <View style={styles.badge}>
                <Ionicons name="location-outline" size={11} color={Colors.primary} />
                <Text style={styles.badgeText}>{city}</Text>
              </View>
            ) : null}
            {goal ? (
              <View style={styles.badge}>
                <Ionicons name="trophy-outline" size={11} color={Colors.primary} />
                <Text style={styles.badgeText}>Goal: {goal}</Text>
              </View>
            ) : null}
            {coachData?.price_per_month > 0 ? (
              <View style={styles.badge}>
                <Ionicons name="cash-outline" size={11} color={Colors.primary} />
                <Text style={styles.badgeText}>${coachData.price_per_month}/mo</Text>
              </View>
            ) : coachData ? (
              <View style={styles.badge}>
                <Ionicons name="gift-outline" size={11} color={Colors.primary} />
                <Text style={styles.badgeText}>Free</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Action Buttons */}
        {!isOwnProfile && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, isFollowing && styles.actionBtnOutline]}
              onPress={handleFollow}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color={isFollowing ? Colors.primary : '#000'} />
              ) : (
                <Text style={[styles.actionBtnText, isFollowing && { color: Colors.primary }]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>

            {isCoach && currentUser.role !== 'coach' && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnOutline, requestSent && { opacity: 0.5 }]}
                onPress={handleSendRequest}
                disabled={actionLoading || requestSent}
              >
                <Text style={[styles.actionBtnText, { color: Colors.primary }]}>
                  {requestSent ? '✓ Request Sent' : 'Send Request'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.actionBtn, styles.actionBtnOutline]}
              onPress={async () => {
                if (!currentUser.uid || !uid) return;
                try {
                  const u1 = currentUser.uid < uid ? currentUser.uid : uid;
                  const u2 = currentUser.uid < uid ? uid : currentUser.uid;
                  
                  const { data: existing, error: err1 } = await supabase
                    .from('conversations')
                    .select('id')
                    .eq('user1_uid', u1)
                    .eq('user2_uid', u2)
                    .single();
                    
                  let convId = existing?.id;
                  
                  if (!convId) {
                    const { data: created, error: err2 } = await supabase
                      .from('conversations')
                      .insert({ user1_uid: u1, user2_uid: u2 })
                      .select('id')
                      .single();
                      
                    if (err2) throw new Error(err2.message);
                    convId = created?.id;
                  }
                  
                  if (convId) {
                    router.push({ pathname: '/chat-room', params: { conversationId: convId, otherUserUid: uid } });
                  }
                } catch (e: any) {
                  Alert.alert('Chat Error', e.message);
                }
              }}
            >
              <Ionicons name="chatbubble-outline" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Coach stats card */}
        {isCoach && coachData && (
          <View style={styles.coachCard}>
            <View style={styles.coachStat}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.coachStatText}>{coachData.rating?.toFixed(1) || '5.0'} Rating</Text>
            </View>
            <View style={styles.coachStat}>
              <Ionicons name="people-outline" size={16} color={Colors.primary} />
              <Text style={styles.coachStatText}>{coachData.total_trainees || 0} Clients</Text>
            </View>
            <View style={styles.coachStat}>
              <Ionicons name="time-outline" size={16} color={Colors.primary} />
              <Text style={styles.coachStatText}>{coachData.experience_years || 0} yrs exp</Text>
            </View>
          </View>
        )}

        {/* Posts Grid */}
        <View style={styles.gridHeader}>
          <Ionicons name="grid-outline" size={20} color={Colors.textMuted} />
        </View>

        {posts.length === 0 ? (
          <View style={styles.emptyPosts}>
            <Ionicons name="images-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No posts yet</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {posts.map((post) => (
              <TouchableOpacity key={post.id} style={styles.gridItem} activeOpacity={0.85}>
                <Image source={{ uri: post.image_url }} style={styles.gridImg} />
                <View style={styles.gridLikes}>
                  <Ionicons name="heart" size={12} color="#FFF" />
                  <Text style={styles.gridLikesText}>{post.likes_count || 0}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },

  scroll: { paddingBottom: 100 },

  topSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, marginTop: 10, gap: 20 },
  avatarRing: { width: 86, height: 86, borderRadius: 43, borderWidth: 2, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 78, height: 78, borderRadius: 39 },

  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  statLabel: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  statDiv: { width: 1, backgroundColor: BORDER, height: 30, alignSelf: 'center' },

  nameSection: { paddingHorizontal: 18, marginTop: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  nameText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  roleTag: { color: Colors.primary, fontSize: 12, marginBottom: 6, fontWeight: '600' },
  bioText: { color: Colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 10 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, gap: 4 },
  badgeText: { color: Colors.textMuted, fontSize: 11 },

  actionsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 18, marginTop: 14, marginBottom: 6 },
  actionBtn: { flex: 1, backgroundColor: Colors.primary, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionBtnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.primary, flex: 1 },
  actionBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },

  coachCard: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 14, marginHorizontal: 18, marginTop: 14, marginBottom: 6, paddingVertical: 14 },
  coachStat: { alignItems: 'center', gap: 4 },
  coachStatText: { color: Colors.textPrimary, fontSize: 12, fontWeight: '600' },

  gridHeader: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: BORDER, marginTop: 16 },

  emptyPosts: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 8 },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE * 1.15, borderRadius: 10, overflow: 'hidden' },
  gridImg: { width: '100%', height: '100%' },
  gridLikes: { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3 },
  gridLikesText: { color: '#FFF', fontSize: 11, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
});
