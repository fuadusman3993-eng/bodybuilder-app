import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/colors';

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

export default function CoachProfilePage() {
  const router = useRouter();
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const { user } = useUserStore();
  const [coach, setCoach] = useState<CoachProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none');

  useEffect(() => {
    fetchCoach();
    checkRequestStatus();
  }, [uid]);

  const fetchCoach = async () => {
    try {
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('*')
        .eq('uid', uid)
        .single();
      if (error) throw error;
      setCoach(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const checkRequestStatus = async () => {
    if (!user.uid) return;
    const { data } = await supabase
      .from('coach_requests')
      .select('status')
      .eq('trainee_uid', user.uid)
      .eq('coach_uid', uid)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (data) setRequestStatus(data.status as any);
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
      Alert.alert('✅ Request Sent!', 'The coach will review your request.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send request.');
    } finally {
      setRequesting(false);
    }
  };

  const getButtonLabel = () => {
    if (requestStatus === 'pending') return 'Request Pending ⏳';
    if (requestStatus === 'accepted') return 'Already Your Coach ✅';
    if (requestStatus === 'rejected') return 'Request Again';
    return 'Request Coach';
  };

  const getButtonStyle = () => {
    if (requestStatus === 'pending') return [styles.requestBtn, styles.requestBtnPending];
    if (requestStatus === 'accepted') return [styles.requestBtn, styles.requestBtnAccepted];
    return styles.requestBtn;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
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
            source={{ uri: coach.avatar_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300' }}
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
            <Ionicons name="card-outline" size={22} color={Colors.primary} />
            <Text style={styles.priceText}>
              {coach.price_per_month > 0
                ? `$${coach.price_per_month} / month`
                : 'Free'}
            </Text>
          </View>
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
  requestBtn: {
    backgroundColor: Colors.primary, paddingVertical: 16,
    borderRadius: 30, alignItems: 'center',
  },
  requestBtnPending: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  requestBtnAccepted: { backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: Colors.primary },
  requestBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
});
