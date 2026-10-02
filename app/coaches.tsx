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
      // Fetch coaches from Supabase
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('*');
      if (error) throw error;
      
      const coachesList = data || [];
      const enriched: Coach[] = [];

      // Fetch real names and avatars from Firebase
      for (const coach of coachesList) {
        let name = coach.name || 'Coach';
        let avatar = '';
        try {
          const { getDoc, doc } = await import('firebase/firestore');
          const { db } = await import('../lib/firebase');
          const snap = await getDoc(doc(db, 'users', coach.uid));
          if (snap.exists()) {
            const d = snap.data();
            name = d.name || d.username || name;
            avatar = d.avatar || d.photoURL || '';
          }
        } catch (_) {}

        enriched.push({
          ...coach,
          name,
          avatar_url: avatar,
        });
      }

      setCoaches(enriched);
      setFiltered(enriched);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const renderCoach = ({ item }: { item: Coach }) => (
    <View style={styles.listRow}>
      {/* Avatar */}
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/user-profile', params: { uid: item.uid } })}
      >
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarInitialWrap}>
            <Text style={styles.avatarInitialText}>{item.name?.[0]?.toUpperCase() || 'C'}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Center Info */}
      <TouchableOpacity 
        style={styles.infoCol}
        onPress={() => router.push({ pathname: '/user-profile', params: { uid: item.uid } })}
      >
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          {item.is_verified && <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />}
        </View>
        <Text style={styles.specialty} numberOfLines={1}>
          {item.specialty?.join(' · ') || 'Fitness Coach'}
        </Text>
        <View style={styles.statsRow}>
          {item.total_trainees > 0 && (
            <Text style={styles.statText}>{item.total_trainees} trainees • </Text>
          )}
          <Text style={styles.priceText}>
            {item.price_per_month > 0 ? `$${item.price_per_month}/mo` : 'Free'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Action Button */}
      <TouchableOpacity 
        style={styles.viewBtn}
        onPress={() => router.push({ pathname: '/user-profile', params: { uid: item.uid } })}
      >
        <Text style={styles.viewBtnText}>View</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find a Coach</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon}/>
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
          <Ionicons name="search-outline" size={60} color={Colors.textMuted} />
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
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, backgroundColor: Colors.surface, borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 15, paddingVertical: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 30, gap: 16 },
  
  listRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.surfaceLight },
  avatarInitialWrap: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.surfaceLight,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitialText: { color: Colors.textMuted, fontSize: 24, fontWeight: 'bold' },
  
  infoCol: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  specialty: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statText: { fontSize: 12, color: Colors.textMuted },
  priceText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  
  viewBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8,
  },
  viewBtnText: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600' },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyText: { color: Colors.textMuted, fontSize: 15 },
});
