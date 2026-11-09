import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../../store/themeStore';

export default function DiscoverSection() {
  const router = useRouter();
  const { colors } = useTheme();

  const PICKS = [
    {
      id: 'pick-1',
      title: 'Belly Fat Burner HIIT',
      level: 'Beginner',
      duration: '20 min',
      calories: '180 kcal',
      color: '#EF4444',
      badge: 'HIIT',
      bgImg: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
      route: '/challenge',
    },
    {
      id: 'pick-2',
      title: 'Lose Fat (No Jumping!)',
      level: 'Intermediate',
      duration: '20 min',
      calories: '160 kcal',
      color: '#3B82F6',
      badge: 'LOW IMPACT',
      bgImg: 'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=600&auto=format&fit=crop&q=80',
      route: '/challenge',
    },
    {
      id: 'pick-3',
      title: 'Stay Active, Stay in Shape',
      level: 'All Levels',
      duration: '5 workouts',
      calories: 'Daily Fuel',
      color: '#10B981',
      badge: 'PROGRAM',
      bgImg: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=80',
      route: '/challenge',
    },
  ];

  return (
    <View style={styles.container}>
      {/* ── Section Header ── */}
      <View style={styles.sectionHeader}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="compass" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Discover</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/discover')}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>Explore All →</Text>
        </TouchableOpacity>
      </View>

      {/* ── 1. Hero Feature Card: "Only 4 Moves for Abs" (Male Athlete Photo, Seamless Edge-to-Edge) ── */}
      <TouchableOpacity
        style={[styles.heroCard, { borderColor: colors.border }]}
        activeOpacity={0.9}
        onPress={() => router.push('/challenge')}
      >
        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80',
          }}
          style={styles.heroBg}
          imageStyle={styles.heroImg}
        >
          {/* Edge-to-edge seamless gradient (No inner nested rounded box) */}
          <LinearGradient
            colors={['rgba(5, 11, 16, 0.15)', 'rgba(5, 11, 16, 0.75)', 'rgba(5, 11, 16, 0.95)']}
            style={styles.heroGradient}
          >
            <View style={[styles.heroBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.heroBadgeText}>TRENDING ROUTINE</Text>
            </View>
            <Text style={styles.heroTitle}>Only 4 Moves for Abs</Text>
            <Text style={styles.heroSubtitle}>
              4 simple exercises only! Burn belly fat and firm your abs. Get a flat belly fast!
            </Text>
            <View style={styles.heroBtnRow}>
              <View style={[styles.heroActionBtn, { backgroundColor: colors.primary }]}>
                <Ionicons name="play" size={14} color="#000" />
                <Text style={styles.heroActionBtnText}>Start Workout</Text>
              </View>
              <Text style={styles.heroMetaText}>⏱️ 12 min • No gear</Text>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>

      {/* ── 2. Picks for you (Horizontal Carousel) ── */}
      <View style={styles.subSectionHeader}>
        <Text style={[styles.subSectionTitle, { color: colors.textPrimary }]}>Picks for you</Text>
        <Text style={[styles.subSectionMeta, { color: colors.textMuted }]}>Custom tailored</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.picksRow}>
        {PICKS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.pickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.85}
            onPress={() => router.push(item.route as any)}
          >
            <ImageBackground source={{ uri: item.bgImg }} style={styles.pickImg} imageStyle={{ borderRadius: 14 }}>
              <View style={[styles.pickBadge, { backgroundColor: item.color }]}>
                <Text style={styles.pickBadgeText}>{item.badge}</Text>
              </View>
            </ImageBackground>
            <View style={styles.pickInfo}>
              <Text style={[styles.pickTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.pickMetaRow}>
                <Text style={[styles.pickMeta, { color: colors.textMuted }]}>
                  {item.duration} • {item.level}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
  },

  // 1. Featured Hero Card (Seamless edge-to-edge)
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 20,
  },
  heroBg: {
    width: '100%',
    minHeight: 210,
    justifyContent: 'flex-end',
  },
  heroImg: {
    borderRadius: 19,
  },
  heroGradient: {
    padding: 18,
    paddingTop: 38,
    gap: 6,
    justifyContent: 'flex-end',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  heroBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    color: '#CBD5E1',
    fontSize: 12.5,
    lineHeight: 17,
  },
  heroBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
  },
  heroActionBtnText: {
    color: '#000',
    fontSize: 12.5,
    fontWeight: '800',
  },
  heroMetaText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },

  // Sub headers
  subSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subSectionMeta: {
    fontSize: 12,
    fontWeight: '600',
  },

  // 2. Picks for you
  picksRow: {
    gap: 12,
    paddingBottom: 4,
    paddingRight: 8,
  },
  pickCard: {
    width: 200,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    gap: 10,
  },
  pickImg: {
    width: '100%',
    height: 105,
    borderRadius: 14,
    overflow: 'hidden',
    padding: 8,
  },
  pickBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  pickBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  pickInfo: {
    gap: 4,
  },
  pickTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  pickMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickMeta: {
    fontSize: 11.5,
    fontWeight: '500',
  },
});
