import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/colors';
import Skeleton from '../components/ui/Skeleton';
import { getWallet, hireCoachWithCoins, coinsToEtb } from '../lib/walletService';

interface CoachProfile {
  uid: string;
  name: string;
  avatar_url: string;
  bio: string;
  specialty: string[];
  experience_years: number;
  price_per_month: number;
  rating: number;
  total_trainees: number;
  is_verified: boolean;
}

interface CachedCoachProfile {
  coach: CoachProfile;
  requestStatus: 'none' | 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

const coachProfileCache: Record<string, CachedCoachProfile> = {};

export default function CoachProfilePage() {
  const router = useRouter();
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const { user, updateCoins } = useUserStore();

  const cached = uid ? coachProfileCache[uid] : undefined;

  const [coach, setCoach] = useState<CoachProfile | null>(cached?.coach || null);
  const [loading, setLoading] = useState(!cached);
  const [requesting, setRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>(cached?.requestStatus || 'none');
  const [traineeBalance, setTraineeBalance] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!uid) return;
    const c = coachProfileCache[uid];
    if (c) {
      setCoach(c.coach);
      setRequestStatus(c.requestStatus);
      setLoading(false);
      if (Date.now() - c.timestamp > 2 * 60 * 1000) {
        fetchAll(false);
      }
    } else {
      fetchAll(true);
    }
    // Fetch trainee's coin balance
    if (user.uid) {
      getWallet(user.uid).then((w) => {
        setTraineeBalance(w?.balance_coins ?? 0);
      });
    }
  }, [uid]);

  const fetchAll = async (showLoading: boolean) => {
    if (showLoading) setLoading(true);
    try {
      const coachPromise = (async () => {
        try {
          const { data } = await supabase.from('coach_profiles').select('*').eq('uid', uid).single();
          return data;
        } catch { return null; }
      })();

      const reqPromise = (async () => {
        if (!user.uid) return 'none';
        try {
          const { data } = await supabase.from('coach_requests').select('status').eq('trainee_uid', user.uid).eq('coach_uid', uid).order('created_at', { ascending: false }).limit(1).single();
          return (data?.status as any) || 'none';
        } catch { return 'none'; }
      })();

      const [coachData, reqStat] = await Promise.all([coachPromise, reqPromise]);

      if (coachData) {
        setCoach(coachData);
        setRequestStatus(reqStat);

        coachProfileCache[uid!] = {
          coach: coachData,
          requestStatus: reqStat,
          timestamp: Date.now(),
        };
      }
    } catch (e) {
      console.warn(e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const sendRequest = async () => {
    if (!user.uid) {
      Alert.alert('Not logged in', 'Please log in first.');
      return;
    }
    if (requestStatus === 'pending') {
      Alert.alert('Already sent', 'Your request is pending.');
      return;
    }

    const priceCoins = coach?.price_per_month ?? 0;

    // If coach has a coin price, use coin payment flow
    if (priceCoins > 0) {
      // Re-check live wallet balance before showing confirm
      const w = await getWallet(user.uid);
      const bal = w?.balance_coins ?? 0;
      setTraineeBalance(bal);

      if (bal < priceCoins) {
        const msg = `You need 🪙 ${priceCoins} coins to hire this coach.\nYour balance: 🪙 ${bal} coins.\n\nTop up your FitPulse Wallet to continue.`;
        if (Platform.OS === 'web') {
          const go = window.confirm(msg + '\n\nOpen Wallet now?');
          if (go) router.push('/wallet');
        } else {
          Alert.alert('Insufficient Coins', msg, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Top Up Now', onPress: () => router.push('/wallet') },
          ]);
        }
        return;
      }
      setShowConfirm(true);
      return;
    }

    // Free coach — direct request
    await doSendFreeRequest();
  };

  const doSendFreeRequest = async () => {
    setRequesting(true);
    try {
      const { error } = await supabase.from('coach_requests').insert({
        trainee_uid: user.uid,
        trainee_name: user.name || 'Trainee',
        trainee_avatar: `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${user.uid}.jpg`,
        coach_uid: uid,
        status: 'pending',
        message: `${user.name || 'Trainee'} wants to train with you!`,
      });
      if (error) throw error;
      setRequestStatus('pending');
      if (coachProfileCache[uid!]) { coachProfileCache[uid!].requestStatus = 'pending'; }
      Alert.alert('✅ Request Sent!', 'The coach will review your request.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send request.');
    } finally {
      setRequesting(false);
    }
  };

  const doHireWithCoins = async () => {
    if (!coach || !user.uid) return;
    setRequesting(true);
    setShowConfirm(false);
    try {
      const res = await hireCoachWithCoins({
        traineeUid: user.uid,
        traineeName: user.name || 'Trainee',
        traineeAvatar: `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${user.uid}.jpg`,
        coachUid: coach.uid,
        coachName: coach.name,
        coins: coach.price_per_month,
        message: `${user.name || 'Trainee'} hired you via FitPulse Coins!`,
      });
      if (res.success) {
        setRequestStatus('pending');
        if (coachProfileCache[uid!]) { coachProfileCache[uid!].requestStatus = 'pending'; }
        updateCoins(res.remainingBalance ?? 0);
        setTraineeBalance(res.remainingBalance ?? 0);
        Alert.alert('✅ Coach Hired!', `🪙 ${coach.price_per_month} coins paid.\nRemaining balance: 🪙 ${res.remainingBalance} coins.`);
      } else {
        const errMsg = res.error === 'INSUFFICIENT_COINS'
          ? 'Not enough coins. Please top up your FitPulse Wallet.'
          : (res.error ?? 'Payment failed.');
        Alert.alert('Payment Failed', errMsg);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to hire coach.');
    } finally {
      setRequesting(false);
    }
  };

  const getButtonLabel = () => {
    if (requestStatus === 'pending') return 'Request Pending ⏳';
    if (requestStatus === 'accepted') return 'Already Your Coach ✅';
    if (requestStatus === 'rejected') return coach?.price_per_month ? `Hire Again — 🪙 ${coach.price_per_month}` : 'Request Again';
    if (coach?.price_per_month) return `Hire Coach — 🪙 ${coach.price_per_month} Coins`;
    return 'Request Coach';
  };

  const getButtonStyle = () => {
    if (requestStatus === 'pending') return [styles.requestBtn, styles.requestBtnPending];
    if (requestStatus === 'accepted') return [styles.requestBtn, styles.requestBtnAccepted];
    return styles.requestBtn;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header skeleton */}
        <View style={styles.header}>
          <Skeleton width={36} height={36} borderRadius={18} />
          <Skeleton width={130} height={18} borderRadius={4} />
          <View style={{ width: 24 }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero: avatar + name + specialty + stats */}
          <View style={[styles.heroSection]}>
            <Skeleton width={110} height={110} borderRadius={55} />
            <Skeleton width={160} height={24} borderRadius={6} style={{ marginTop: 14 }} />
            <Skeleton width={100} height={14} borderRadius={4} style={{ marginTop: 6 }} />
            {/* Stats row */}
            <View style={[styles.statsRow]}>
              {[1, 2, 3].map((_, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <View style={styles.statDivider} />}
                  <View style={styles.statBox}>
                    <Skeleton width={36} height={22} borderRadius={4} />
                    <Skeleton width={48} height={11} borderRadius={3} style={{ marginTop: 6 }} />
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>
          {/* About section */}
          <View style={styles.section}>
            <Skeleton width={60} height={16} borderRadius={4} style={{ marginBottom: 10 }} />
            <Skeleton width="100%" height={13} borderRadius={4} style={{ marginBottom: 5 }} />
            <Skeleton width="80%" height={13} borderRadius={4} />
          </View>
          {/* Specialties */}
          <View style={styles.section}>
            <Skeleton width={90} height={16} borderRadius={4} style={{ marginBottom: 10 }} />
            <View style={styles.tagRow}>
              {[80, 110, 70].map((w, i) => (
                <Skeleton key={i} width={w} height={30} borderRadius={20} />
              ))}
            </View>
          </View>
          {/* Price */}
          <View style={styles.section}>
            <Skeleton width={60} height={16} borderRadius={4} style={{ marginBottom: 10 }} />
            <Skeleton width="100%" height={54} borderRadius={14} />
          </View>
          {/* Request button */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 40, marginTop: 10 }}>
            <Skeleton width="100%" height={54} borderRadius={30} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!coach) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.textMuted }}>Coach not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Coach Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Avatar & Name */}
        <View style={styles.heroSection}>
          <Image
            source={coach.avatar_url || 'https://ui-avatars.com/api/?name=Coach&background=2A3241&color=fff&size=150'}
            placeholder="https://ui-avatars.com/api/?name=Coach&background=2A3241&color=fff&size=150"
            cachePolicy="memory-disk"
            contentFit="cover"
            style={styles.avatar}
          />
          <View style={styles.nameRow}>
            <Text style={styles.coachName}>{coach.name}</Text>
            {coach.is_verified && (
              <Ionicons name="checkmark-circle" size={20} color={Colors.info} />
            )}
          </View>
          <Text style={styles.specialty}>{coach.specialty?.join(' · ')}</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{coach.rating?.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{coach.total_trainees}</Text>
              <Text style={styles.statLabel}>Trainees</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{coach.experience_years} yrs</Text>
              <Text style={styles.statLabel}>Experience</Text>
            </View>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{coach.bio || 'No bio yet.'}</Text>
        </View>

        {/* Specialties */}
        {coach.specialty?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialties</Text>
            <View style={styles.tagRow}>
              {coach.specialty.map((s, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={styles.priceCard}>
            <Ionicons name="wallet-outline" size={22} color={Colors.primary} />
            <View>
              <Text style={styles.priceText}>
                {coach.price_per_month > 0
                  ? `🪙 ${coach.price_per_month} Coins / month`
                  : 'Free'}
              </Text>
              {coach.price_per_month > 0 && (
                <Text style={styles.priceSubtext}>= {coinsToEtb(coach.price_per_month)} ETB per month</Text>
              )}
            </View>
          </View>
          {traineeBalance !== null && coach.price_per_month > 0 && (
            <Text style={[styles.balanceHint, { color: traineeBalance >= coach.price_per_month ? Colors.primary : '#F87171' }]}>
              Your wallet: 🪙 {traineeBalance} coins
              {traineeBalance < coach.price_per_month ? '  ⚠️ Insufficient' : '  ✅ Sufficient'}
            </Text>
          )}
        </View>

        {/* Request Button */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 40, marginTop: 10 }}>
          <TouchableOpacity
            style={getButtonStyle()}
            onPress={sendRequest}
            disabled={requesting || requestStatus === 'pending' || requestStatus === 'accepted'}
            activeOpacity={0.8}
          >
            {requesting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.requestBtnText}>{getButtonLabel()}</Text>
            )}
          </TouchableOpacity>
          {coach.price_per_month > 0 && requestStatus === 'none' && (
            <Text style={styles.coinHireHint}>
              Tapping "Hire Coach" will deduct 🪙 {coach.price_per_month} coins from your FitPulse Wallet
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Coin Hire Confirmation Modal */}
      <Modal visible={showConfirm} transparent animationType="fade" onRequestClose={() => setShowConfirm(false)}>
        <View style={confirmModalS.overlay}>
          <View style={confirmModalS.card}>
            <Text style={confirmModalS.icon}>🪙</Text>
            <Text style={confirmModalS.title}>Confirm Payment</Text>
            <Text style={confirmModalS.desc}>
              You are about to pay{' '}
              <Text style={{ color: Colors.primary, fontWeight: '800' }}>🪙 {coach?.price_per_month} coins</Text>
              {' '}to hire{' '}
              <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{coach?.name}</Text>
              {' '}for 1 month.
            </Text>
            <Text style={confirmModalS.balance}>
              Your current balance: 🪙 {traineeBalance ?? 0} coins
            </Text>
            <View style={confirmModalS.btnRow}>
              <TouchableOpacity style={confirmModalS.cancelBtn} onPress={() => setShowConfirm(false)} activeOpacity={0.8}>
                <Text style={confirmModalS.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={confirmModalS.confirmBtn} onPress={doHireWithCoins} disabled={requesting} activeOpacity={0.85}>
                {requesting ? <ActivityIndicator color="#000" size="small" /> : <Text style={confirmModalS.confirmText}>Pay & Hire</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  heroSection: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: Colors.primary, backgroundColor: Colors.surfaceLight },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  coachName: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  specialty: { color: Colors.primary, fontSize: 14, marginTop: 4 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: 16, marginTop: 20, width: '100%',
    borderWidth: 1, borderColor: Colors.border,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 3 },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  section: { paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  bio: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: 'rgba(34,197,94,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  priceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, padding: 16, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  priceText: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  priceSubtext: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  balanceHint: { fontSize: 12.5, fontWeight: '600', marginTop: 8, paddingLeft: 4 },
  coinHireHint: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 18 },
  requestBtn: {
    backgroundColor: Colors.primary, paddingVertical: 16,
    borderRadius: 30, alignItems: 'center',
  },
  requestBtnPending: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  requestBtnAccepted: { backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: Colors.primary },
  requestBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
});

const confirmModalS = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: {
    backgroundColor: '#111', borderRadius: 22, padding: 26, width: '100%', maxWidth: 380,
    borderWidth: 1, borderColor: 'rgba(0,230,118,0.2)', alignItems: 'center',
  },
  icon: { fontSize: 40, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 10 },
  desc: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 21 },
  balance: { fontSize: 13, color: '#6B7280', marginTop: 10 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 22, width: '100%' },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center',
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a',
  },
  cancelText: { color: '#9CA3AF', fontWeight: '700', fontSize: 14 },
  confirmBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  confirmText: { color: '#000', fontWeight: '800', fontSize: 14 },
});
