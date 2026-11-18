import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import Skeleton from '../components/ui/Skeleton';
import BackButton from '../components/ui/BackButton';
import { useTheme } from '../store/themeStore';
import { useDomainStore, AppDomain } from '../store/domainStore';

export interface Coach {
  id?: string;
  uid: string;
  name: string;
  avatar_url?: string;
  domain?: 'Fitness' | 'Football' | 'Health';
  specialty?: string[];
  experience_years?: number;
  price_per_month: number;
  rating?: number;
  total_trainees?: number;
  is_verified?: boolean;
}

type FilterDomain = 'All' | 'Fitness' | 'Football' | 'Health';

const DOMAIN_TABS: { key: FilterDomain; label: string; icon: keyof typeof Ionicons.glyphMap; accent: string }[] = [
  { key: 'All', label: 'All', icon: 'apps-outline', accent: '#A855F7' },
  { key: 'Fitness', label: 'Fitness', icon: 'barbell-outline', accent: '#10B981' },
  { key: 'Football', label: 'Football', icon: 'football-outline', accent: '#3B82F6' },
  { key: 'Health', label: 'Health', icon: 'fitness-outline', accent: '#F59E0B' },
];

let cachedCoaches: Coach[] = [];
let coachesCacheTimestamp = 0;
const COACHES_CACHE_TTL_MS = 3 * 60 * 1000;

export default function CoachesPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentDomain } = useDomainStore();

  const isCacheValid = cachedCoaches.length > 0;
  const [coaches, setCoaches] = useState<Coach[]>(cachedCoaches);
  const [selectedDomain, setSelectedDomain] = useState<FilterDomain>(
    (currentDomain as FilterDomain) || 'All'
  );
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(!isCacheValid);

  // Infer domain for existing coaches that don't have explicit domain column yet
  const inferDomain = (c: Coach): 'Fitness' | 'Football' | 'Health' => {
    if (c.domain === 'Fitness' || c.domain === 'Football' || c.domain === 'Health') {
      return c.domain;
    }
    const specStr = (c.specialty || []).join(' ').toLowerCase();
    if (specStr.includes('football') || specStr.includes('soccer') || specStr.includes('tactical') || specStr.includes('striker') || specStr.includes('goalkeeper')) {
      return 'Football';
    }
    if (specStr.includes('nutrition') || specStr.includes('rehab') || specStr.includes('diet') || specStr.includes('physio') || specStr.includes('health')) {
      return 'Health';
    }
    return 'Fitness';
  };

  // Instant batched fetch from Supabase (Zero N+1 Firestore loops!)
  const fetchCoaches = useCallback(async (showLoading = false) => {
    if (showLoading && cachedCoaches.length === 0) setLoading(true);
    try {
      // 1. Fetch all coach_profiles in single lightning-fast query
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('*')
        .order('rating', { ascending: false });

      if (error) throw error;

      const rawList: Coach[] = (data || []).map((c: any) => ({
        id: c.id,
        uid: c.uid,
        name: c.name || 'FitPulse Coach',
        avatar_url: c.avatar_url || `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${c.uid}.jpg`,
        domain: inferDomain(c),
        specialty: Array.isArray(c.specialty) ? c.specialty : [c.specialty || 'General Coach'],
        experience_years: c.experience_years || 2,
        price_per_month: c.price_per_month ?? 0,
        rating: c.rating || 5.0,
        total_trainees: c.total_trainees || 0,
        is_verified: c.is_verified ?? true,
      }));

      // 2. Fetch enriched profile names/avatars from unified profiles in single batched query
      const uids = rawList.map((c) => c.uid).filter(Boolean);
      if (uids.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('uid, name, username, avatar_url')
          .in('uid', uids);

        if (profs && profs.length > 0) {
          const profMap = new Map<string, any>();
          profs.forEach((p) => profMap.set(p.uid, p));

          rawList.forEach((c) => {
            const p = profMap.get(c.uid);
            if (p) {
              if (p.name || p.username) c.name = p.name || p.username;
              if (p.avatar_url) c.avatar_url = p.avatar_url;
            }
          });
        }
      }

      setCoaches(rawList);
      cachedCoaches = rawList;
      coachesCacheTimestamp = Date.now();
    } catch (e) {
      console.warn('Error fetching coaches:', e);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const now = Date.now();
    if (cachedCoaches.length > 0 && now - coachesCacheTimestamp < COACHES_CACHE_TTL_MS) {
      setCoaches(cachedCoaches);
      setLoading(false);
      if (now - coachesCacheTimestamp > 60 * 1000) {
        fetchCoaches(false);
      }
      return;
    }
    fetchCoaches(true);
  }, [fetchCoaches]);

  // Zero-lag instant memoized filtering
  const filtered = useMemo(() => {
    return coaches.filter((c) => {
      // 1. Domain match
      if (selectedDomain !== 'All') {
        const d = inferDomain(c);
        if (d !== selectedDomain) return false;
      }
      // 2. Search match
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesSpec = c.specialty?.some((s) => s.toLowerCase().includes(q));
        const matchesDomain = c.domain?.toLowerCase().includes(q);
        if (!matchesName && !matchesSpec && !matchesDomain) return false;
      }
      return true;
    });
  }, [coaches, selectedDomain, search]);

  const renderCoach = ({ item }: { item: Coach }) => {
    const itemDomain = inferDomain(item);
    const domainMeta = DOMAIN_TABS.find((t) => t.key === itemDomain) || DOMAIN_TABS[1];

    return (
      <TouchableOpacity
        style={[
          styles.coachCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        activeOpacity={0.8}
        onPress={() => router.push({ pathname: '/coach-profile', params: { uid: item.uid } })}
      >
        {/* Top Card Row */}
        <View style={styles.cardTopRow}>
          {/* Avatar with fallback */}
          <View style={styles.avatarWrap}>
            <Image
              source={item.avatar_url}
              placeholder={`https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=10B981&color=fff&size=150`}
              cachePolicy="memory-disk"
              contentFit="cover"
              style={[styles.avatar, { borderColor: colors.border }]}
            />
            {item.is_verified && (
              <View style={[styles.verifiedBadge, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="checkmark" size={11} color="#fff" />
              </View>
            )}
          </View>

          {/* Coach Identity Info */}
          <View style={styles.infoCol}>
            <View style={styles.nameRow}>
              <Text style={[styles.coachName, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={[styles.domainBadge, { backgroundColor: domainMeta.accent + '20' }]}>
                <Ionicons name={domainMeta.icon} size={11} color={domainMeta.accent} style={{ marginRight: 3 }} />
                <Text style={[styles.domainBadgeText, { color: domainMeta.accent }]}>
                  {itemDomain}
                </Text>
              </View>
            </View>

            {/* Experience & Rating */}
            <View style={styles.metaRow}>
              <View style={styles.ratingWrap}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={[styles.ratingText, { color: colors.textPrimary }]}>
                  {(item.rating || 5.0).toFixed(1)}
                </Text>
              </View>
              <Text style={[styles.metaDot, { color: colors.textMuted }]}>•</Text>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                {item.experience_years ? `${item.experience_years}y exp` : 'Experienced'}
              </Text>
              {item.total_trainees ? (
                <>
                  <Text style={[styles.metaDot, { color: colors.textMuted }]}>•</Text>
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>
                    {item.total_trainees} clients
                  </Text>
                </>
              ) : null}
            </View>
          </View>

          {/* Price Tag */}
          <View style={styles.priceCol}>
            <Text style={[styles.priceAmount, { color: colors.primary }]}>
              {item.price_per_month > 0 ? `${item.price_per_month}` : 'Free'}
            </Text>
            {item.price_per_month > 0 && (
              <Text style={[styles.priceSub, { color: colors.textMuted }]}>ETB/mo</Text>
            )}
          </View>
        </View>

        {/* Specialty Tags */}
        {item.specialty && item.specialty.length > 0 && (
          <View style={styles.specsRow}>
            {item.specialty.slice(0, 3).map((spec, i) => (
              <View
                key={i}
                style={[
                  styles.specTag,
                  { backgroundColor: colors.surfaceLight, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.specTagText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {spec}
                </Text>
              </View>
            ))}
            {item.specialty.length > 3 && (
              <View style={[styles.specTagMore, { backgroundColor: colors.surfaceLight }]}>
                <Text style={[styles.specTagMoreText, { color: colors.textMuted }]}>
                  +{item.specialty.length - 3}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Button Row */}
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <Text style={[styles.tapToView, { color: colors.textMuted }]}>
            Tap to view profile & hire
          </Text>
          <View style={[styles.viewProfileBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.viewProfileBtnText}>View Coach</Text>
            <Ionicons name="chevron-forward" size={14} color="#000" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header with search */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <BackButton fallbackRoute="/(tabs)" />
        <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.headerSearch, { color: colors.textPrimary }]}
            placeholder="Search coach, sport, specialty..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Domain Filter Tabs */}
      <View style={styles.domainTabsWrap}>
        {DOMAIN_TABS.map((tab) => {
          const active = selectedDomain === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.domainTabPill,
                {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => setSelectedDomain(tab.key)}
            >
              <Ionicons
                name={tab.icon}
                size={14}
                color={active ? '#000' : colors.textSecondary}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.domainTabPillText,
                  {
                    color: active ? '#000' : colors.textPrimary,
                    fontWeight: active ? '700' : '600',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Coach List */}
      {loading ? (
        <View style={styles.list}>
          <Skeleton width={140} height={18} borderRadius={4} style={{ marginBottom: 16, marginTop: 8 }} />
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.skeletonCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Skeleton width={52} height={52} borderRadius={26} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton width={130} height={16} borderRadius={4} />
                  <Skeleton width={180} height={13} borderRadius={4} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={56} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No coaches found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            {selectedDomain !== 'All'
              ? `No coaches registered in ${selectedDomain} yet. Try another domain or clear filters.`
              : 'Try searching with a different term.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderCoach}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View style={styles.listHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {selectedDomain === 'All' ? 'All Certified Coaches' : `${selectedDomain} Specialists`}
              </Text>
              <Text style={[styles.countBadge, { color: colors.textMuted }]}>
                {filtered.length} {filtered.length === 1 ? 'coach' : 'coaches'}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
  },
  headerSearch: {
    flex: 1,
    fontSize: 14.5,
    paddingVertical: 0,
  },

  // Domain Tabs
  domainTabsWrap: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  domainTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  domainTabPillText: { fontSize: 13 },

  list: { paddingHorizontal: 14, paddingBottom: 40, paddingTop: 6 },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  countBadge: { fontSize: 12.5 },

  // Coach Card
  coachCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
  },
  infoCol: { flex: 1, marginLeft: 12, marginRight: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  coachName: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  domainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  domainBadgeText: { fontSize: 10.5, fontWeight: '700' },

  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 12, fontWeight: '700' },
  metaDot: { marginHorizontal: 5, fontSize: 12 },
  metaText: { fontSize: 12 },

  priceCol: { alignItems: 'flex-end' },
  priceAmount: { fontSize: 16, fontWeight: '800' },
  priceSub: { fontSize: 10.5, marginTop: 1 },

  // Specialties
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  specTag: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    maxWidth: 160,
  },
  specTagText: { fontSize: 11, fontWeight: '500' },
  specTagMore: {
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  specTagMoreText: { fontSize: 11, fontWeight: '600' },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  tapToView: { fontSize: 11.5 },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  viewProfileBtnText: { color: '#000', fontSize: 12.5, fontWeight: '700' },

  skeletonCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 8,
    marginTop: 60,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 8 },
  emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
