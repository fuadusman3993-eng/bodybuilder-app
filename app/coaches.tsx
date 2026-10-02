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
        try {
          const { getDoc, doc } = await import('firebase/firestore');
          const { db } = await import('../lib/firebase');
          const snap = await getDoc(doc(db, 'users', coach.uid));
          
          if (snap.exists()) {
            const d = snap.data();
            const name = d.name || d.username || coach.name || 'Coach';
            const avatar = d.avatar || d.photoURL || '';
            
            enriched.push({
              ...coach,
              name,
              avatar_url: avatar,
            });
          }
          // If snap.exists() is false, we DO NOT push it to the list (filters out Foziya/ghosts)
        } catch (_) {}
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
          {item.is_verified && <Ionicons name="checkmark-circle" size={14} color="#3b82f6" />}
        </View>
        <Text style={styles.specialty} numberOfLines={1}>
          {item.specialty?.join(' · ') || 'Fitness Coach'}
          {item.price_per_month > 0 ? ` · $${item.price_per_month}/mo` : ' · Free'}
        </Text>
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
        <TextInput
          style={styles.headerSearch}
          placeholder="Search"
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <View style={{ width: 24 }} />
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
          ListHeaderComponent={() => (
            <Text style={styles.sectionTitle}>Suggested for you</Text>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' }, // Pitch black like IG
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerSearch: { 
    flex: 1, backgroundColor: '#262626', 
    color: '#fff', fontSize: 16, 
    paddingVertical: 8, paddingHorizontal: 16, 
    borderRadius: 10, marginRight: 16
  },
  
  list: { paddingHorizontal: 16, paddingBottom: 30, paddingTop: 10 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 16 },
  
  listRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
  },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#262626' },
  avatarInitialWrap: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: '#262626',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitialText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  
  infoCol: { flex: 1, justifyContent: 'center', marginLeft: 12, marginRight: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: 14, fontWeight: '700', color: '#fff' },
  specialty: { fontSize: 13, color: '#A8A8A8', marginTop: 2 },
  
  viewBtn: {
    backgroundColor: '#3b82f6', // Instagram Blue
    paddingHorizontal: 20, paddingVertical: 7, borderRadius: 8,
  },
  viewBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyText: { color: '#A8A8A8', fontSize: 15 },
});
