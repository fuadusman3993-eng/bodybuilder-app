import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../../store/themeStore';

export default function DiscoverSection() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const heroHeight = Math.max(Math.round(width * 0.62), 200);

  const PICKS = [
    {
      id: 'pick-1',
      title: 'Belly Fat Burner HIIT',
      level: 'Beginner',
      duration: '20 min',
      calories: '180 kcal',
      color: '#EF4444',
      badge: 'HIIT',
      bgImg: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=80', // HIIT running - full outfit
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
      bgImg: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80', // push-up full outfit
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
      bgImg: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80', // modest training
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

      {/* ── 1. Hero Feature Card: "Only 4 Moves for Abs" (HeroBanner Style Replica) ── */}
      <TouchableOpacity
        style={[styles.heroCard, { height: heroHeight, borderColor: colors.border }]}
        activeOpacity={0.9}
        onPress={() => router.push('/challenge')}
      >
        {/* Background Photo */}
        <Image
          source={require('../../assets/images/abs-plank-hero.jpg')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />

        {/* Dark gradient overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.05)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Top: tag badge */}
        <View style={styles.topRow}>
          <View style={styles.tagBadge}>
            <View style={[styles.tagDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.tagText}>TRENDING ROUTINE</Text>
          </View>
        </View>

        {/* Bottom content */}
        <View style={styles.bottomContent}>
          <Text style={styles.title}>
            Only 4 Moves for{'\n'}
            <Text style={[styles.titleAccent, { color: colors.primary }]}>Abs</Text>
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            4 simple exercises only! Burn belly fat &amp; firm your abs.
          </Text>
          <TouchableOpacity
            style={[styles.joinBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={() => router.push('/challenge')}
          >
            <Text style={styles.joinBtnText}>Start Workout  →</Text>
          </TouchableOpacity>
        </View>
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

  // 1. Featured Hero Card (HeroBanner Replica)
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 20,
    position: 'relative',
  },
  topRow: {
    padding: 14,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  bottomContent: {
    position: 'absolute',
    bottom: 22,
    left: 18,
    right: 18,
    maxWidth: '62%',
    zIndex: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  titleAccent: {},
  subtitle: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 14,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    lineHeight: 16,
  },
  joinBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 30,
    alignSelf: 'flex-start',
  },
  joinBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },

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
