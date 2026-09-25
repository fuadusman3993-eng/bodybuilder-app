import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/colors';

export default function MyCoachPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [coach, setCoach] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchMyCoach(); }, []);

  const fetchMyCoach = async () => {
    if (!user.uid) return;
    try {
      // Check if accepted by a coach
      const { data: req } = await supabase
        .from('coach_requests')
        .select('*, coach_uid')
        .eq('trainee_uid', user.uid)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (req) {
        setRequestStatus('accepted');
        // Fetch coach profile
        const { data: coachData } = await supabase
          .from('coach_profiles')
          .select('*')
          .eq('uid', req.coach_uid)
          .single();
        setCoach(coachData);

        // Fetch assigned plans
        const { data: assignments } = await supabase
          .from('plan_assignments')
          .select('*, workout_plans(*)')
          .eq('trainee_uid', user.uid)
          .eq('status', 'active');
        setPlans(assignments || []);
      } else {
        // Check if pending
        const { data: pending } = await supabase
          .from('coach_requests')
          .select('*')
          .eq('trainee_uid', user.uid)
          .eq('status', 'pending')
          .limit(1)
          .single();
        if (pending) setRequestStatus('pending');
        else setRequestStatus('none');
      }
    } catch (e) {
      setRequestStatus('none');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  // No coach yet
  if (requestStatus === 'none') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Coach</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={80} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Coach Yet</Text>
          <Text style={styles.emptyText}>Find a coach and send a request to get started</Text>
          <TouchableOpacity style={styles.findBtn} onPress={() => router.push('/coaches')}>
            <Text style={styles.findBtnText}>Browse Coaches</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Pending request
  if (requestStatus === 'pending') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Coach</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <View style={styles.pendingIcon}>
            <Ionicons name="time" size={50} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Request Pending ⏳</Text>
          <Text style={styles.emptyText}>Your coach request is under review. You'll be notified when accepted.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Has a coach
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Coach</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/chat')}>
          <Ionicons name="chatbubble-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Coach Card */}
        {coach && (
          <View style={styles.coachCard}>
            <Image
              source={{ uri: coach.avatar_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300' }}
              style={styles.coachAvatar}
            />
            <View style={styles.coachInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.coachName}>{coach.name}</Text>
                {coach.is_verified && <Ionicons name="checkmark-circle" size={16} color={Colors.info} />}
              </View>
              <Text style={styles.coachSpecialty}>{coach.specialty?.join(' · ')}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.ratingText}>{coach.rating?.toFixed(1)} · {coach.experience_years} yrs exp</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => router.push('/(tabs)/chat')}
            >
              <Ionicons name="chatbubble" size={18} color="#000" />
            </TouchableOpacity>
          </View>
        )}

        {/* Workout Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Workout Plans</Text>
          {plans.length === 0 ? (
            <View style={styles.noPlans}>
              <Ionicons name="barbell-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.noPlansText}>No plans assigned yet</Text>
              <Text style={styles.noPlansSubText}>Your coach will send you a plan soon</Text>
            </View>
          ) : (
            plans.map((a) => (
              <TouchableOpacity key={a.id} style={styles.planCard} activeOpacity={0.8}>
                <View style={styles.planIcon}>
                  <Ionicons name="barbell" size={24} color={Colors.primary} />
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planTitle}>{a.workout_plans?.title}</Text>
                  <Text style={styles.planMeta}>
                    {a.workout_plans?.duration_weeks} weeks · {a.workout_plans?.level}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  pendingIcon: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  findBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 32,
    paddingVertical: 14, borderRadius: 30, marginTop: 10,
  },
  findBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
  coachCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    margin: 16, backgroundColor: Colors.surface, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: Colors.border,
  },
  coachAvatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: Colors.primary, backgroundColor: Colors.surfaceLight },
  coachInfo: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  coachName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  coachSpecialty: { fontSize: 12, color: Colors.primary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 12, color: Colors.textMuted },
  chatBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  section: { paddingHorizontal: 16, paddingTop: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  noPlans: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  noPlansText: { fontSize: 16, fontWeight: '600', color: Colors.textMuted },
  noPlansSubText: { fontSize: 13, color: Colors.textMuted },
  planCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.border,
  },
  planIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(34,197,94,0.12)', justifyContent: 'center', alignItems: 'center',
  },
  planInfo: { flex: 1 },
  planTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  planMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
});
