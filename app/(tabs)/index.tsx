import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import Header from '../../components/layout/Header';
import HeroBanner from '../../components/home/HeroBanner';
import StoriesRow from '../../components/home/StoriesRow';
import QuickActions from '../../components/home/QuickActions';
import DiscoverSection from '../../components/home/DiscoverSection';
import CommunityFeed from '../../components/home/CommunityFeed';
import CoachHome from '../../components/home/CoachHome';
import HealthSection from '../../components/home/HealthSection';
import FootballSection from '../../components/home/FootballSection';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../store/themeStore';
import { useDomainStore } from '../../store/domainStore';
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUserStore();
  const { colors } = useTheme();
  const { currentDomain } = useDomainStore();
  const [hasPendingApplication, setHasPendingApplication] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      supabase
        .from('coach_profiles')
        .select('verification_status, is_verified')
        .eq('uid', user.uid)
        .maybeSingle()
        .then(({ data }) => {
          if (data && data.verification_status === 'pending_review' && !data.is_verified) {
            setHasPendingApplication(true);
          } else {
            setHasPendingApplication(false);
          }
        });
    }
  }, [user?.uid]);

  // STRICT COACH GATE: Only verified coaches can view CoachHome!
  if (user.role === 'coach' && user.isCoachVerified) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar style="light" />
        <CoachHome />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        bounces={true}
        overScrollMode="always"
      >
        <Header />

        {/* ── ATHLETE SAFETY: COACH APPLICATION PENDING REVIEW BANNER ── */}
        {hasPendingApplication && (
          <TouchableOpacity
            style={styles.pendingCoachAlert}
            activeOpacity={0.85}
            onPress={() => router.push('/coach-onboarding')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={styles.pendingCoachIconCircle}>
                <Ionicons name="shield-checkmark" size={18} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingCoachAlertTitle}>Coach Application In Review</Text>
                <Text style={styles.pendingCoachAlertSub}>
                  FitPulse Board is verifying your credentials within 24–48 hours.
                </Text>
              </View>
            </View>
            <View style={styles.pendingCoachAlertAction}>
              <Text style={styles.pendingCoachAlertActionText}>Status →</Text>
            </View>
          </TouchableOpacity>
        )}

        <StoriesRow />
        {currentDomain === 'Fitness' ? (
          <>
            <HeroBanner />
            <QuickActions />
            <DiscoverSection />
            <CommunityFeed />
          </>
        ) : currentDomain === 'Health' ? (
          <HealthSection />
        ) : (
          <FootballSection />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  scrollContent: {},
  pendingCoachAlert: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pendingCoachIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingCoachAlertTitle: {
    color: '#F59E0B',
    fontSize: 13.5,
    fontWeight: '700',
  },
  pendingCoachAlertSub: {
    color: '#CBD5E1',
    fontSize: 11.5,
    marginTop: 2,
  },
  pendingCoachAlertAction: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pendingCoachAlertActionText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
  },
});
