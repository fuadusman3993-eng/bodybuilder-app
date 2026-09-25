import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/colors';

interface Request {
  id: string;
  trainee_uid: string;
  trainee_name: string;
  trainee_avatar: string;
  status: string;
  message: string;
  created_at: string;
}

interface Assignment {
  id: string;
  trainee_uid: string;
  trainee_name: string;
  trainee_avatar: string;
  plan_title: string;
  assigned_at: string;
}

export default function CoachDashboard() {
  const router = useRouter();
  const { user } = useUserStore();
  const [requests, setRequests] = useState<Request[]>([]);
  const [trainees, setTrainees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'trainees' | 'requests'>('trainees');

  const fetchData = useCallback(async () => {
    if (!user.uid) return;
    try {
      // Fetch pending requests
      const { data: reqs } = await supabase
        .from('coach_requests')
        .select('*')
        .eq('coach_uid', user.uid)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Fetch accepted trainees
      const { data: accepted } = await supabase
        .from('coach_requests')
        .select('*')
        .eq('coach_uid', user.uid)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      setRequests(reqs || []);
      setTrainees(accepted || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.uid]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRequest = async (requestId: string, traineeUid: string, action: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('coach_requests')
        .update({ status: action })
        .eq('id', requestId);
      if (error) throw error;

      if (action === 'accepted') {
        // Update coach total_trainees count
        await supabase.rpc('increment_trainees', { coach_uid_param: user.uid }).catch(() => {});
        Alert.alert('✅ Accepted!', 'Trainee has been added to your roster.');
      } else {
        Alert.alert('Rejected', 'Request has been declined.');
      }
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coach Dashboard</Text>
        <TouchableOpacity onPress={() => router.push('/create-plan')}>
          <Ionicons name="add-circle" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{trainees.length}</Text>
          <Text style={styles.summaryLabel}>Trainees</Text>
        </View>
        <View style={[styles.summaryCard, requests.length > 0 && styles.summaryCardAlert]}>
          <Text style={styles.summaryValue}>{requests.length}</Text>
          <Text style={styles.summaryLabel}>Requests</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'trainees' && styles.tabActive]}
          onPress={() => setActiveTab('trainees')}
        >
          <Text style={[styles.tabText, activeTab === 'trainees' && styles.tabTextActive]}>
            My Trainees ({trainees.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
            Requests {requests.length > 0 ? `(${requests.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'trainees' ? (
          trainees.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={60} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No trainees yet</Text>
              <Text style={styles.emptyText}>Accept requests to add trainees</Text>
            </View>
          ) : (
            trainees.map((t) => (
              <View key={t.id} style={styles.traineeCard}>
                <Image
                  source={{ uri: t.trainee_avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150' }}
                  style={styles.avatar}
                />
                <View style={styles.traineeInfo}>
                  <Text style={styles.traineeName}>{t.trainee_name}</Text>
                  <Text style={styles.traineeDate}>
                    Joined {new Date(t.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity style={styles.planBtn} onPress={() => router.push('/create-plan')}>
                  <Text style={styles.planBtnText}>+ Plan</Text>
                </TouchableOpacity>
              </View>
            ))
          )
        ) : (
          requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="mail-outline" size={60} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No pending requests</Text>
              <Text style={styles.emptyText}>New requests will appear here</Text>
            </View>
          ) : (
            requests.map((req) => (
              <View key={req.id} style={styles.requestCard}>
                <Image
                  source={{ uri: req.trainee_avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150' }}
                  style={styles.avatar}
                />
                <View style={styles.traineeInfo}>
                  <Text style={styles.traineeName}>{req.trainee_name}</Text>
                  <Text style={styles.traineeDate} numberOfLines={2}>{req.message}</Text>
                </View>
                <View style={styles.actionBtns}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleRequest(req.id, req.trainee_uid, 'accepted')}
                  >
                    <Ionicons name="checkmark" size={18} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleRequest(req.id, req.trainee_uid, 'rejected')}
                  >
                    <Ionicons name="close" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        )}
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
  summaryRow: { flexDirection: 'row', gap: 12, padding: 16 },
  summaryCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 14,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  summaryCardAlert: { borderColor: Colors.primary },
  summaryValue: { fontSize: 28, fontWeight: '900', color: Colors.textPrimary },
  summaryLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  tabRow: {
    flexDirection: 'row', paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: Colors.primary },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 40 },
  traineeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  requestCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surfaceLight },
  traineeInfo: { flex: 1, gap: 3 },
  traineeName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  traineeDate: { fontSize: 12, color: Colors.textMuted },
  planBtn: {
    backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: Colors.primary,
  },
  planBtnText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  actionBtns: { flexDirection: 'row', gap: 8 },
  acceptBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  rejectBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#EF4444',
    justifyContent: 'center', alignItems: 'center',
  },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: 14, color: Colors.textMuted },
});
