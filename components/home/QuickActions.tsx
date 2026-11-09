import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useTheme } from '../../store/themeStore';
import { trackInteraction } from '../../lib/interactionTelemetry';

export default function QuickActions() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();

  // 2x2 Grid Layout (4 Angles):
  // Screen padding is 16 on each side (32 total), gap between columns is 10
  const cardW = Math.floor((width - 32 - 10) / 2);

  const ACTIONS = [
    // Column 1, Row 1 (Top-Left):
    {
      id: 'workout',
      title: 'My Workout',
      subtitle: 'Track & Improve',
      icon: 'barbell-outline',
      color: '#3B82F6',
      badge: 'TRAIN',
      route: '/challenge',
    },
    // Column 2, Row 1 (Top-Right):
    {
      id: 'marketplace',
      title: 'Market Place',
      subtitle: 'Food & Gear',
      icon: 'cart-outline',
      color: colors.primary,
      badge: 'SHOP',
      route: '/marketplace',
    },
    // Column 1, Row 2 (Bottom-Left, positioned UNDER My Workout):
    {
      id: 'discover',
      title: 'Discover',
      subtitle: 'Routines & Focus',
      icon: 'compass-outline',
      color: '#A855F7',
      badge: 'EXPLORE',
      route: '/discover',
    },
    // Column 2, Row 2 (Bottom-Right, positioned UNDER Market Place):
    {
      id: 'report',
      title: 'Report (BMI)',
      subtitle: 'Body Analytics',
      icon: 'speedometer-outline',
      color: '#10B981',
      badge: 'HEALTH',
      route: '/report',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Hub</Text>
          <View style={[styles.activePill, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '35' }]}>
            <Text style={[styles.activePillText, { color: colors.primary }]}>4 Pillars</Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            trackInteraction('HomePage', 'See all → Quick Actions');
            router.push('/discover');
          }}
        >
          <Text style={[styles.seeAll, { color: colors.primary }]}>See all →</Text>
        </TouchableOpacity>
      </View>

      {/* ── 2x2 Grid: 4 Angles (Zero Horizontal Scroll, 100% Full Visibility) ── */}
      <View style={styles.grid}>
        {ACTIONS.map((item) => (
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
            onPress={() => {
              trackInteraction('HomePage', item.title, undefined, item.route);
              router.push(item.route as any);
            }}
          >
            {/* Top Action Pill Badge */}
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: item.color + '18' }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={[styles.badgeTag, { backgroundColor: item.color + '1A' }]}>
                <Text style={[styles.badgeTagText, { color: item.color }]}>{item.badge}</Text>
              </View>
            </View>

            <View style={styles.textWrap}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.cardSub, { color: colors.textMuted }]} numberOfLines={1}>
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
  container: { marginTop: 20, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.2 },
  activePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  seeAll: { fontSize: 12.5, color: Colors.primary, fontWeight: '700' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'space-between',
    minHeight: 114,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  textWrap: {
    marginTop: 8,
  },
  cardTitle: { fontSize: 13.5, fontWeight: '800', lineHeight: 18 },
  cardSub: { fontSize: 11, marginTop: 2, fontWeight: '500' },
});
