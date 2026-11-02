import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { useChallengeStore } from '../store/challengeStore';

export default function SelectTrainingPlanScreen() {
  const router = useRouter();
  const { setGoal, setLevel } = useChallengeStore();

  const handleSelectPlan = (goalId: string, levelName: string, directToDay1: boolean = false) => {
    setGoal(goalId);
    setLevel(levelName);

    if (directToDay1) {
      router.push({
        pathname: '/workout/day/[dayId]',
        params: { dayId: '1' },
      } as any);
    } else {
      router.push({
        pathname: '/workout/calendar',
        params: { goal: goalId },
      } as any);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* HEADER BAR */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Training Hub & Vault</Text>
          <Text style={styles.headerSubtitle}>Select a challenge or explore 800+ exercises</Text>
        </View>
        <View style={styles.headerRightBadge}>
          <Ionicons name="fitness" size={20} color={Colors.primary} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION 1: EXERCISE VAULTS (VitalAnimations Integrated) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIconBadge}>
              <Ionicons name="barbell" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Exercise Vaults</Text>
          </View>
          <Text style={styles.sectionBadge}>800+ ANIMATIONS</Text>
        </View>

        {/* PACKAGE 1: GYM EXERCISES */}
        <View style={styles.packageCard}>
          {/* Top meta row */}
          <View style={styles.packageMetaRow}>
            <View style={styles.packageTagPill}>
              <Text style={styles.packageTagText}>PACKAGE 1</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>AVAILABLE</Text>
            </View>
          </View>

          {/* Icon + Title */}
          <View style={styles.packageHeaderRow}>
            <View style={styles.packageIconWrap}>
              <Text style={styles.packageEmoji}>🏋️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.packageTitle}>Gym Exercises</Text>
              <Text style={styles.packageSubTitle}>Male & Female Workouts</Text>
            </View>
          </View>

          <Text style={styles.packageDesc}>
            Complete gym exercise dataset organized into Male (592) and Female (305) workout libraries — barbell, dumbbell, cable, machine, and bodyweight exercises with HD animations.
          </Text>

          {/* Tags row */}
          <View style={styles.chipsRow}>
            {['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight'].map((tag) => (
              <View key={tag} style={styles.chipPill}>
                <Text style={styles.chipText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Stats Box */}
          <View style={styles.statsBox}>
            <View style={styles.statCol}>
              <Text style={styles.statNum}>800+</Text>
              <Text style={styles.statLabel}>EXERCISES</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNum}>8</Text>
              <Text style={styles.statLabel}>BODY PARTS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNum}>32</Text>
              <Text style={styles.statLabel}>EQUIPMENT</Text>
            </View>
          </View>

          {/* Body parts pills */}
          <View style={styles.chipsRow}>
            {['🛡️ Chest', '⚡ Back', '💥 Shoulders', '✨ Arms', '🦵 Legs', '🎯 Abs', '❤️ Cardio'].map((item) => (
              <View key={item} style={styles.bodyPartPill}>
                <Text style={styles.bodyPartPillText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.primaryActionBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/exercises/gym')}
          >
            <Text style={styles.primaryActionBtnText}>Browse Gym Exercises  →</Text>
          </TouchableOpacity>
        </View>

        {/* PACKAGE 2: HOME WORKOUTS */}
        <View style={styles.packageCard}>
          {/* Top meta row */}
          <View style={styles.packageMetaRow}>
            <View style={styles.packageTagPill}>
              <Text style={styles.packageTagText}>PACKAGE 2</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>AVAILABLE</Text>
            </View>
          </View>

          {/* Icon + Title */}
          <View style={styles.packageHeaderRow}>
            <View style={styles.packageIconWrap}>
              <Text style={styles.packageEmoji}>🏠</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.packageTitle}>Home Workouts</Text>
              <Text style={styles.packageSubTitle}>Zero Equipment Needed</Text>
            </View>
          </View>

          <Text style={styles.packageDesc}>
            Comprehensive home workout collection including office workouts, yoga, pilates, face exercises, women's routines, and mobility routines. 100% equipment-free.
          </Text>

          {/* Tags row */}
          <View style={styles.chipsRow}>
            {['Bodyweight', 'Yoga', 'Pilates', 'Office', 'Face Yoga', 'Stretching'].map((tag) => (
              <View key={tag} style={styles.chipPill}>
                <Text style={styles.chipText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Stats Box */}
          <View style={styles.statsBox}>
            <View style={styles.statCol}>
              <Text style={styles.statNum}>800+</Text>
              <Text style={styles.statLabel}>EXERCISES</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNum}>7</Text>
              <Text style={styles.statLabel}>CATEGORIES</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNum}>16+</Text>
              <Text style={styles.statLabel}>ROUTINES</Text>
            </View>
          </View>

          {/* Categories pills */}
          <View style={styles.chipsRow}>
            {['🏠 Home Workouts', '💼 Office', '🧘 Yoga', '⚡ Pilates', '😊 Face Yoga', '💃 Women', '♾️ Mobility'].map((item) => (
              <View key={item} style={styles.bodyPartPill}>
                <Text style={styles.bodyPartPillText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.primaryActionBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/exercises/home')}
          >
            <Text style={styles.primaryActionBtnText}>Browse Home Workouts  →</Text>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION 2: 30-DAY STRUCTURED CHALLENGES */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <View style={[styles.sectionHeader, { marginTop: 10 }]}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIconBadge}>
              <Ionicons name="calendar" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>30-Day Programs</Text>
          </View>
          <Text style={styles.sectionBadge}>GUIDED</Text>
        </View>

        {/* FEATURED: LOSE BELLY FAT */}
        <View style={styles.featuredCard}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
            }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />

          <View style={styles.featuredOverlay} />

          {/* Top Right: Users Badge */}
          <View style={styles.usersBadge}>
            <Text style={styles.usersBadgeNumber}>8,958,192+</Text>
            <Text style={styles.usersBadgeLabel}>Active Users</Text>
          </View>

          <View style={styles.featuredBody}>
            <Text style={styles.featuredTitle}>Lose Belly Fat</Text>

            <View style={styles.levelRow}>
              <Text style={styles.featuredLevelText}>Beginner</Text>
              <Ionicons name="flash" size={14} color={Colors.primary} />
              <Ionicons name="flash" size={14} color={Colors.primary} />
              <Ionicons name="flash" size={14} color="rgba(255,255,255,0.3)" />
              <Text style={styles.timeTagText}>• 7 min / day</Text>
            </View>

            <Text style={styles.featuredDesc}>
              Start your journey to be leaner and stronger! Just 7 minutes daily to shed belly fat easily.
            </Text>

            <TouchableOpacity
              style={styles.startDay1Btn}
              activeOpacity={0.9}
              onPress={() => handleSelectPlan('lose-belly-fat', 'Beginner', true)}
            >
              <Text style={styles.startDay1Text}>Start Day 1  →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CARD 2: ROCK HARD ABS */}
        <TouchableOpacity
          style={styles.challengeItemCard}
          activeOpacity={0.85}
          onPress={() => handleSelectPlan('lose-belly-fat', 'Intermediate', false)}
        >
          <View style={styles.challengeCardContent}>
            <View style={styles.challengeIconBox}>
              <Ionicons name="flame" size={24} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.challengeTitle}>Rock Hard Abs</Text>
              <View style={styles.levelRowSmall}>
                <Text style={styles.challengeLevelText}>Intermediate</Text>
                <Ionicons name="flash" size={12} color={Colors.primary} />
                <Ionicons name="flash" size={12} color={Colors.primary} />
                <Ionicons name="flash" size={12} color="rgba(255,255,255,0.3)" />
                <Text style={styles.challengeTimeText}>• 12 min / day</Text>
              </View>
            </View>
            <View style={styles.circleChevron}>
              <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
            </View>
          </View>
        </TouchableOpacity>

        {/* CARD 3: SIX PACK ABS */}
        <TouchableOpacity
          style={styles.challengeItemCard}
          activeOpacity={0.85}
          onPress={() => handleSelectPlan('build-muscle', 'Advanced', false)}
        >
          <View style={styles.challengeCardContent}>
            <View style={styles.challengeIconBox}>
              <Ionicons name="trophy" size={24} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.challengeTitle}>Six Pack Abs</Text>
              <View style={styles.levelRowSmall}>
                <Text style={styles.challengeLevelText}>Advanced</Text>
                <Ionicons name="flash" size={12} color={Colors.primary} />
                <Ionicons name="flash" size={12} color={Colors.primary} />
                <Ionicons name="flash" size={12} color={Colors.primary} />
                <Text style={styles.challengeTimeText}>• 20 min / day</Text>
              </View>
            </View>
            <View style={styles.circleChevron}>
              <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerRightBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },

  // SECTION HEADERS
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    letterSpacing: 0.5,
  },

  // PACKAGE CARDS (VitalAnimations Style in FitPulse Theme)
  packageCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  packageMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  packageTagText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  liveText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  packageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  packageIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  packageEmoji: {
    fontSize: 22,
  },
  packageTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  packageSubTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  packageDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  bodyPartPill: {
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.15)',
  },
  bodyPartPillText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },

  // STATS BOX
  statsBox: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    color: Colors.primary,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },

  // ACTION BUTTON
  primaryActionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  primaryActionBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  // FEATURED CARD (30-Day Lose Belly Fat)
  featuredCard: {
    height: 320,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.72)',
  },
  usersBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  usersBadgeNumber: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  usersBadgeLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  featuredBody: {
    zIndex: 1,
  },
  featuredTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  featuredLevelText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginRight: 4,
  },
  timeTagText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 4,
    fontWeight: '600',
  },
  featuredDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  startDay1Btn: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startDay1Text: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
  },

  // CHALLENGE LIST CARDS
  challengeItemCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  challengeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  challengeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.2)',
  },
  challengeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  levelRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  challengeLevelText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    marginRight: 2,
  },
  challengeTimeText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  circleChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
