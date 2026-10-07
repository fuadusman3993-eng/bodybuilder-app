import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Skeleton from '../components/ui/Skeleton';

interface Coach {
  id: string;
  uid: string;
  name: string;
  avatar_url: string;
  specialty: string[];
  price_per_month: number;
  is_verified: boolean;
}

export default function CoachesPage() {
  const router = useRouter();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCoaches = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('*');

      if (error) throw error;

      const coachesList = data || [];
      const enriched: Coach[] = [];

      for (const coach of coachesList) {
        try {
          const snap = await getDoc(doc(db, 'users', coach.uid));
          if (snap.exists()) {
            const d = snap.data();
            enriched.push({
              ...coach,
              name: d.name || d.username || coach.name || 'Coach',
              avatar_url: d.avatar || d.photoURL || '',
            });
          }
          // If not in Firebase → skip (ghost account)
        } catch (_) {}
      }

      setCoaches(enriched);
    } catch (e) {
      console.warn(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCoaches();
  }, [fetchCoaches]);

  // Filter by search
  const filtered = search.trim()
    ? coaches.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.specialty?.some(s => s.toLowerCase().includes(search.toLowerCase()))
      )
    : coaches;

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
          {(item.specialty?.join(' · ') || 'Fitness Coach') +
            (item.price_per_month > 0 ? ` · $${item.price_per_month}/mo` : ' · Free')}
        </Text>
      </TouchableOpacity>

      {/* View Button */}
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
      {/* Header with search */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TextInput
          style={styles.headerSearch}
          placeholder="Search coaches..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={{ marginLeft: 8 }}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={{ padding: 16, gap: 16 }}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#1a1a2e', borderRadius: 14, padding: 14 }}>
              <Skeleton width={64} height={64} borderRadius={32} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton width="55%" height={16} borderRadius={4} />
                <Skeleton width="40%" height={13} borderRadius={4} />
                <Skeleton width="70%" height={13} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={60} color="#444" />
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
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', marginRight: 8 },
  headerSearch: {
    flex: 1, backgroundColor: '#1c1c1e',
    color: '#fff', fontSize: 15,
    paddingVertical: 9, paddingHorizontal: 14,
    borderRadius: 10,
  },

  list: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 16, marginTop: 8 },

  listRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 18,
  },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#262626' },
  avatarInitialWrap: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: '#2a2a2a',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitialText: { color: '#fff', fontSize: 22, fontWeight: '700' },

  infoCol: { flex: 1, marginLeft: 12, marginRight: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { fontSize: 14, fontWeight: '700', color: '#fff', flexShrink: 1 },
  specialty: { fontSize: 12.5, color: '#A8A8A8', marginTop: 3 },

  viewBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 18, paddingVertical: 7, borderRadius: 8,
  },
  viewBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { color: '#888', fontSize: 15 },
});
