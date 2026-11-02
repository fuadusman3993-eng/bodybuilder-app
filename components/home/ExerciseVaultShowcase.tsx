import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { GYM_BODY_PARTS, HOME_CATEGORIES } from '../../constants/exerciseVaultData';

export default function ExerciseVaultShowcase() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.pulseDot} />
          <Text style={styles.sectionBadge}>HD ANIMATION VAULT</Text>
        </View>
        <Text style={styles.sectionSubtitle}>800+ Certified Movement Libraries</Text>
      </View>

      {/* ── PACKAGE 1: GYM EXERCISES ── */}
      <View style={[styles.packageCard, styles.gymCardBorder]}>
        {/* Top Meta Bar */}
        <View style={styles.cardTopRow}>
          <View style={styles.packageBadgeGym}>
            <Text style={styles.packageBadgeGymText}>PACKAGE 1</Text>
          </View>
          <View style={styles.availableRow}>
            <View style={styles.availableDot} />
            <Text style={styles.availableText}>AVAILABLE</Text>
          </View>
        </View>

        {/* Title & Icon Header */}
        <View style={styles.titleRow}>
          <View style={styles.iconCircleGym}>
            <Ionicons name="barbell" size={26} color="#CCFF00" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.packageTitle}>Gym Exercises</Text>
            <Text style={styles.packageTagline}>Male & Female Workout Libraries</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.packageDesc}>
          Complete gym exercise dataset organized into Male and Female workout libraries — barbell, dumbbell, cable, machine, and bodyweight exercises with HD animations.
        </Text>

        {/* Equipment Badges */}
        <View style={styles.pillWrap}>
          {['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight'].map((eq) => (
            <View key={eq} style={styles.equipPill}>
              <Text style={styles.equipPillText}>{eq}</Text>
            </View>
          ))}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#CCFF00' }]}>800+</Text>
            <Text style={styles.statLabel}>EXERCISES</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>BODY PARTS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>32</Text>
            <Text style={styles.statLabel}>EQUIPMENT</Text>
          </View>
        </View>

        {/* Body Part Badges */}
        <View style={styles.bodyPartPillsRow}>
          {GYM_BODY_PARTS.slice(0, 7).map((bp) => (
            <View key={bp.id} style={styles.bodyPartPill}>
              <Ionicons name={bp.icon as any} size={12} color={bp.color} />
              <Text style={styles.bodyPartPillText}>{bp.name}</Text>
            </View>
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.gymCtaBtn}
          activeOpacity={0.85}
          onPress={() => router.push('/exercises/gym')}
        >
          <Text style={styles.gymCtaBtnText}>Browse Gym Exercises</Text>
          <Ionicons name="arrow-forward" size={18} color="#000" />
        </TouchableOpacity>
      </View>

      {/* ── PACKAGE 2: HOME WORKOUTS ── */}
      <View style={[styles.packageCard, styles.homeCardBorder]}>
        {/* Top Meta Bar */}
        <View style={styles.cardTopRow}>
          <View style={styles.packageBadgeHome}>
            <Text style={styles.packageBadgeHomeText}>PACKAGE 2</Text>
          </View>
          <View style={styles.availableRow}>
            <View style={[styles.availableDot, { backgroundColor: '#FF5376' }]} />
            <Text style={[styles.availableText, { color: '#FF5376' }]}>AVAILABLE</Text>
          </View>
        </View>

        {/* Title & Icon Header */}
        <View style={styles.titleRow}>
          <View style={styles.iconCircleHome}>
            <Ionicons name="home" size={26} color="#FF5376" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.packageTitle}>Home Workouts</Text>
            <Text style={styles.packageTagline}>Zero Equipment Needed</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.packageDesc}>
          Comprehensive home workout collection including office workouts, yoga, pilates, face exercises, women's routines, and mobility stretches.
        </Text>

        {/* Equipment Badges */}
        <View style={styles.pillWrap}>
          {['Bodyweight', 'Yoga', 'Pilates', 'Office', 'Face Yoga', 'Stretching'].map((eq) => (
            <View key={eq} style={styles.equipPill}>
              <Text style={styles.equipPillText}>{eq}</Text>
            </View>
          ))}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#FF5376' }]}>800+</Text>
            <Text style={styles.statLabel}>EXERCISES</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>7</Text>
            <Text style={styles.statLabel}>CATEGORIES</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>16+</Text>
            <Text style={styles.statLabel}>ROUTINES</Text>
          </View>
        </View>

        {/* Category Pills */}
        <View style={styles.bodyPartPillsRow}>
          {HOME_CATEGORIES.map((cat) => (
            <View key={cat.id} style={styles.bodyPartPill}>
              <Ionicons name={cat.icon as any} size={12} color={cat.color} />
              <Text style={styles.bodyPartPillText}>{cat.name}</Text>
            </View>
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.homeCtaBtn}
          activeOpacity={0.85}
          onPress={() => router.push('/exercises/home')}
        >
          <Text style={styles.homeCtaBtnText}>Browse Home Workouts</Text>
          <Ionicons name="arrow-forward" size={18} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    gap: 16,
  },
  sectionHeader: {
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E676',
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00E676',
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  packageCard: {
    backgroundColor: '#0E1620',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  gymCardBorder: {
    borderColor: 'rgba(204, 255, 0, 0.25)',
  },
  homeCardBorder: {
    borderColor: 'rgba(255, 83, 118, 0.25)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  packageBadgeGym: {
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.4)',
  },
  packageBadgeGymText: {
    color: '#CCFF00',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  packageBadgeHome: {
    backgroundColor: 'rgba(255, 83, 118, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 83, 118, 0.4)',
  },
  packageBadgeHomeText: {
    color: '#FF5376',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E676',
  },
  availableText: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  iconCircleGym: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
  },
  iconCircleHome: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 83, 118, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 83, 118, 0.25)',
  },
  packageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  packageTagline: {
    fontSize: 13,
    color: '#8A95A5',
    fontWeight: '600',
    marginTop: 2,
  },
  packageDesc: {
    fontSize: 13,
    color: '#B0BCCE',
    lineHeight: 19,
    marginBottom: 14,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  equipPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  equipPillText: {
    color: '#CCD6E0',
    fontSize: 11,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#717D90',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  bodyPartPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 18,
  },
  bodyPartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  bodyPartPillText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  gymCtaBtn: {
    backgroundColor: '#CCFF00',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  gymCtaBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  homeCtaBtn: {
    backgroundColor: '#FF5376',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  homeCtaBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
});
