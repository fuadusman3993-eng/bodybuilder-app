import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/colors';

interface Coach {
  id: string;
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

export default function CoachesPage() {
  const router = useRouter();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [filtered, setFiltered] = useState<Coach[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCoaches(); }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(coaches);
    } else {
      const q = search.toLowerCase();
      setFiltered(coaches.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.specialty?.some(s => s.toLowerCase().includes(q))
      ));
    }
  }, [search, coaches]);

  const fetchCoaches = async () => {
    try {
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('*')
        .order('rating', { ascending: false });
      if (error) throw error;
      setCoaches(data || []);
      setFiltered(data || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const renderCoach = ({ item }: { item: Coach }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => router.push({ pathname: '/coach-profile', params: { uid: item.uid } })}
    >
      <Image
        source={{ uri: item.avatar_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200' }}
        style={styles.avatar}
      />
      <View style={styles.cardBody}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.name || 'Coach'}</Text>
          {item.is_verified && (
            <Ionicons name="checkmark-circle" size={16} color={Colors.info} />
          )}
        </View>
        <Text style={styles.specialty} numberOfLines={1}>
          {item.specialty?.join(' · ') || 'Fitness Coach'}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.statText}>{item.rating?.toFixed(1) || '5.0'}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="people" size={12} color={Colors.primary} />
            <Text style={styles.statText}>{item.total_trainees || 0} trainees</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="time" size={12} color={Colors.textMuted} />
            <Text style={styles.statText}>{item.experience_years || 0} yrs</Text>
          </View>
        </View>
        <Text style={styles.price}>
          {item.price_per_month > 0 ? `$${item.price_per_month}/mo` : 'Free'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find a Coach</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or specialty..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={60} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No coaches found</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderCoach}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 16, backgroundColor: Colors.surface, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 15 },
  list: { paddingHorizontal: 16, paddingBottom: 30, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.surfaceLight },
  cardBody: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  specialty: { fontSize: 12, color: Colors.primary },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: 12, color: Colors.textMuted },
  price: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyText: { color: Colors.textMuted, fontSize: 15 },
});
