import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/themeStore';
import { useRouter } from 'expo-router';

export default function FootballSection() {
  const { colors } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();

  // 2x2 Grid calculations
  const cardW = Math.floor((width - 32 - 10) / 2);
  const bannerHeight = Math.min(Math.max(Math.round((width - 32) * 0.58), 205), 235);

  // 4 Pillars of Football Quick Hub
  const FOOTBALL_ACTIONS = [
    {
      id: 'workout',
      title: 'My Workout',
      subtitle: 'Gym & Field Track',
      icon: 'football-outline' as const,
      color: '#3B82F6',
      badge: 'TRAIN',
      onPress: () => router.push('/football-training'),
    },
    {
      id: 'marketplace',
      title: 'Market Place',
      subtitle: 'Boots & Pro Gear',
      icon: 'cart-outline' as const,
      color: colors.primary,
      badge: 'SHOP',
      onPress: () => router.push('/marketplace'),
    },
    {
      id: 'report',
      title: 'Report',
      subtitle: 'Stamina & Stats',
      icon: 'speedometer-outline' as const,
      color: '#F59E0B',
      badge: 'STATS',
      onPress: () => router.push('/report'),
    },
    {
      id: 'tactics',
      title: 'Tactics Coach',
      subtitle: 'Consult Strategist',
      icon: 'people-outline' as const,
      color: '#A855F7',
      badge: 'COACH',
      onPress: () => router.push('/(tabs)/chat'),
    },
  ];

  return (
    <View style={styles.container}>
      {/* ── 1. Football Hero Banner with "Join Now" ── */}
      <View style={[styles.bannerContainer, { height: bannerHeight }]}>
        <Image
          source={require('../../assets/images/banners/football-hero.jpg')}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          contentPosition="center"
          transition={200}
          cachePolicy="memory-disk"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.30)', 'rgba(0,0,0,0.80)']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.bannerInner}>
          {/* Top Row: Tag Badge + Top Right Motivational Quote */}
          <View style={styles.topHeaderRow}>
            <View style={styles.tagBadge}>
              <View style={[styles.tagDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.tagText}>SOCCER PRO</Text>
            </View>

            <View style={styles.quoteSignature}>
              <Text style={[styles.quoteTextGreen, { color: colors.primary }]}>Relentless</Text>
              <Text style={styles.quoteTextWhite}>Match</Text>
              <View>
                <Text style={styles.quoteTextWhite}>Pace</Text>
                <View style={[styles.quoteUnderline, { backgroundColor: colors.primary }]} />
              </View>
            </View>
          </View>

          {/* Bottom Content with "Join Now" */}
          <View style={styles.bottomContent}>
            <Text style={styles.title}>
              Football{'\n'}
              <Text style={[styles.titleAccent, { color: colors.primary }]}>Tactics & Training</Text>
            </Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              Master pitch drills, explosive leg power & 90-minute stamina.
            </Text>
            <TouchableOpacity
              style={[styles.joinBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
              onPress={() => router.push('/football-training')}
            >
              <Text style={[styles.joinBtnText, { color: '#000000' }]}>Join Now</Text>
              <Ionicons name="arrow-forward" size={14} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── 2. Football Quick Hub (4 Pillars) ── */}
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Football Hub</Text>
          <View
            style={[
              styles.activePill,
              {
                backgroundColor: colors.primary + '18',
                borderColor: colors.primary + '40',
              },
            ]}
          >
            <Text style={[styles.activePillText, { color: colors.primary }]}>4 Pillars</Text>
          </View>
        </View>
      </View>

      {/* 2x2 Grid Layout */}
      <View style={styles.grid}>
        {FOOTBALL_ACTIONS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.card,
              {
                width: cardW,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.78}
            onPress={item.onPress}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrap, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <View style={[styles.badge, { backgroundColor: item.color + '20', borderColor: item.color + '40' }]}>
                <Text style={[styles.badgeText, { color: item.color }]}>{item.badge}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                {item.subtitle}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bannerContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    backgroundColor: '#0A0E17',
  },
  bannerInner: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
    zIndex: 2,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quoteSignature: {
    alignItems: 'flex-end',
  },
  quoteTextGreen: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
  quoteTextWhite: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
  quoteUnderline: {
    height: 2.5,
    borderRadius: 1.5,
    marginTop: 2,
    width: '100%',
  },
  bottomContent: {
    justifyContent: 'flex-end',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  titleAccent: {
    fontWeight: '900',
  },
  subtitle: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 12,
    maxWidth: '85%',
  },
  joinBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  joinBtnText: {
    fontWeight: '800',
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    minHeight: 105,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  cardBody: {
    marginTop: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
});
