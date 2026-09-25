import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/userStore';

export default function CoachHome() {
  const router = useRouter();
  const { user } = useUserStore();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ trainees: 0, requests: 0, plans: 0, rating: '5.0' });
  const [requests, setRequests] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    if (!user.uid) return;
    try {
      // Fetch stats
      const { data: profile } = await supabase.from('coach_profiles').select('total_trainees, rating').eq('uid', user.uid).single();
      const { count: reqCount } = await supabase.from('coach_requests').select('*', { count: 'exact', head: true }).eq('coach_uid', user.uid).eq('status', 'pending');
      const { count: planCount } = await supabase.from('workout_plans').select('*', { count: 'exact', head: true }).eq('coach_uid', user.uid);
      
      setStats({
        trainees: profile?.total_trainees || 0,
        requests: reqCount || 0,
        plans: planCount || 0,
        rating: profile?.rating?.toFixed(1) || '5.0',
      });

      // Fetch Recent Requests (Limit 4)
      const { data: recentReqs } = await supabase.from('coach_requests').select('*').eq('coach_uid', user.uid).eq('status', 'pending').order('created_at', { ascending: false }).limit(4);
      setRequests(recentReqs || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setRefreshing(false);
    }
  }, [user.uid]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleRequest = async (id: string, action: 'accepted' | 'rejected') => {
    try {
      await supabase.from('coach_requests').update({ status: action }).eq('id', id);
      if (action === 'accepted') {
        await supabase.rpc('increment_trainees', { coach_uid_param: user.uid }).catch(() => {});
      }
      fetchDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Custom Coach Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logoText}>FitPulse</Text>
          <Text style={styles.headerSub}>Coach Dashboard</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={24} color="#FFF" />
            {stats.requests > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{stats.requests}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <Image source={{ uri: `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${user.uid}.jpg` }} style={styles.avatar} />
            <View style={styles.onlineDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Banner */}
      <View style={styles.bannerContainer}>
        <ImageBackground 
          source={{ uri: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80' }} 
          style={styles.bannerBg}
          imageStyle={{ borderRadius: 20 }}
        >
          <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent', 'rgba(0,0,0,0.8)']} style={styles.bannerGradient}>
            <View style={styles.bannerTag}><Text style={styles.bannerTagText}>MAKE AN IMPACT</Text></View>
            <Text style={styles.bannerTitle}>Stronger People{'\n'}Build a Healthier World</Text>
            <Text style={styles.bannerSub}>Train  •  Guide  •  Transform</Text>
            <TouchableOpacity style={styles.bannerBtn} onPress={() => router.push('/coach-dashboard')}>
              <Text style={styles.bannerBtnText}>View My Trainees</Text>
              <Ionicons name="arrow-forward" size={16} color="#000" />
            </TouchableOpacity>
          </LinearGradient>
        </ImageBackground>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={20} color={Colors.primary} style={styles.statIcon} />
          <Text style={styles.statValue}>{stats.trainees}</Text>
          <Text style={styles.statLabel}>Total Trainees</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="chatbubbles" size={20} color={Colors.primary} style={styles.statIcon} />
          <Text style={styles.statValue}>{stats.requests}</Text>
          <Text style={styles.statLabel}>Pending Requests</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="barbell" size={20} color={Colors.primary} style={styles.statIcon} />
          <Text style={styles.statValue}>{stats.plans}</Text>
          <Text style={styles.statLabel}>Active Plans</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star" size={20} color={Colors.primary} style={styles.statIcon} />
          <Text style={styles.statValue}>{stats.rating}</Text>
          <Text style={styles.statLabel}>Avg. Rating</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity><Text style={styles.seeAllText}>See all <Ionicons name="arrow-forward" size={12}/></Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.qaScroll}>
        <TouchableOpacity style={styles.qaCard} onPress={() => router.push('/coach-dashboard')}>
          <Ionicons name="people" size={28} color={Colors.primary} />
          <Text style={styles.qaTitle}>My Trainees</Text>
          <Text style={styles.qaDesc}>View & manage your trainees</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.qaCard} onPress={() => router.push('/create-plan')}>
          <Ionicons name="clipboard" size={28} color="#A855F7" />
          <Text style={styles.qaTitle}>Create Plan</Text>
          <Text style={styles.qaDesc}>Build workout plans for trainees</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.qaCard} onPress={() => router.push('/(tabs)/chat')}>
          <Ionicons name="chatbubble-ellipses" size={28} color="#3B82F6" />
          <Text style={styles.qaTitle}>Messages</Text>
          <Text style={styles.qaDesc}>Chat with your trainees</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.qaCard}>
          <Ionicons name="play-circle" size={28} color="#F59E0B" />
          <Text style={styles.qaTitle}>Add Lesson</Text>
          <Text style={styles.qaDesc}>Share videos, text or images</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Recent Requests */}
      <View style={styles.sectionHeader}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <Ionicons name="notifications" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Recent Requests</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/coach-dashboard')}><Text style={styles.seeAllText}>See all <Ionicons name="arrow-forward" size={12}/></Text></TouchableOpacity>
      </View>
      <View style={styles.requestsContainer}>
        {requests.length === 0 ? (
          <Text style={styles.noReqText}>No pending requests right now.</Text>
        ) : (
          requests.map(req => (
            <View key={req.id} style={styles.reqCard}>
              <Image source={{ uri: req.trainee_avatar || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=150' }} style={styles.reqAvatar} />
              <View style={styles.reqInfo}>
                <Text style={styles.reqName}>{req.trainee_name}</Text>
                <Text style={styles.reqMeta}>New Trainee • Request</Text>
              </View>
              <View style={styles.reqActions}>
                <TouchableOpacity style={styles.acceptBtn} onPress={() => handleRequest(req.id, 'accepted')}>
                  <Ionicons name="checkmark" size={16} color={Colors.primary} />
                  <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRequest(req.id, 'rejected')}>
                  <Ionicons name="close" size={16} color="#EF4444" />
                  <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Bottom Banner */}
      <View style={styles.bottomBanner}>
        <ImageBackground source={{ uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80' }} style={styles.bbBg} imageStyle={{ borderRadius: 16 }}>
          <LinearGradient colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.6)']} style={styles.bbGradient}>
            <Text style={styles.bbTitle}>Good Coaches{'\n'}<Text style={{color: Colors.primary}}>Change Lives</Text></Text>
            <Text style={styles.bbSub}>Be the reason someone gets stronger.</Text>
          </LinearGradient>
        </ImageBackground>
      </View>

      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16 },
  logoText: { fontSize: 24, fontWeight: '900', color: Colors.primary, fontStyle: 'italic' },
  headerSub: { fontSize: 13, color: Colors.textMuted },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bellBtn: { position: 'relative' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, backgroundColor: Colors.primary, borderRadius: 6, borderWidth: 2, borderColor: Colors.background },
  
  bannerContainer: { paddingHorizontal: 16, marginBottom: 20 },
  bannerBg: { width: '100%', height: 200, borderRadius: 20 },
  bannerGradient: { flex: 1, borderRadius: 20, padding: 20, justifyContent: 'center' },
  bannerTag: { backgroundColor: 'rgba(34,197,94,0.2)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(34,197,94,0.5)' },
  bannerTagText: { color: Colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  bannerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', lineHeight: 28 },
  bannerSub: { color: Colors.textMuted, fontSize: 13, marginTop: 8, marginBottom: 16 },
  bannerBtn: { backgroundColor: Colors.primary, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 6 },
  bannerBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },

  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: 'rgba(34,197,94,0.05)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)', borderRadius: 14, padding: 12 },
  statIcon: { alignSelf: 'flex-end', marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  seeAllText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },

  qaScroll: { paddingHorizontal: 16, gap: 12, paddingBottom: 10 },
  qaCard: { width: 140, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 16 },
  qaTitle: { fontSize: 15, fontWeight: '700', color: '#FFF', marginTop: 12, marginBottom: 4 },
  qaDesc: { fontSize: 12, color: Colors.textMuted, lineHeight: 16 },

  requestsContainer: { paddingHorizontal: 16, gap: 12, marginBottom: 24 },
  noReqText: { color: Colors.textMuted, textAlign: 'center', paddingVertical: 20 },
  reqCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  reqAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  reqInfo: { flex: 1 },
  reqName: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  reqMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  reqActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(34,197,94,0.1)' },
  acceptText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  rejectBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.1)' },
  rejectText: { color: '#EF4444', fontSize: 12, fontWeight: '700' },

  bottomBanner: { paddingHorizontal: 16, marginTop: 10 },
  bbBg: { width: '100%', height: 100, borderRadius: 16 },
  bbGradient: { flex: 1, borderRadius: 16, padding: 16, justifyContent: 'center' },
  bbTitle: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  bbSub: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
});
