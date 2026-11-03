import React, { useState } from 'react';
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

type FilterCategory = 'all' | 'arm' | 'abs' | 'chest' | 'legs' | 'shoulder-back' | 'full-body' | 'gym-vault' | 'home-vault';

interface ProgramGroup {
  id: FilterCategory;
  name: string;
  icon: string;
  badge: string;
  featured: {
    goalId: string;
    title: string;
    level: string;
    time: string;
    bolts: number;
    users: string;
    description: string;
    image: string;
  };
  secondary: Array<{
    goalId: string;
    title: string;
    level: string;
    time: string;
    bolts: number;
    icon: string;
  }>;
}

const PROGRAM_GROUPS: ProgramGroup[] = [
  // 1. ARM WORKOUT ("ena arm yelena" - front and center!)
  {
    id: 'arm',
    name: 'Arm',
    icon: 'fitness',
    badge: '30-DAY PROGRAM',
    featured: {
      goalId: 'arm-workout',
      title: 'Arm Workout - Bigger Arms',
      level: 'Beginner',
      time: '8 min / day',
      bolts: 2,
      users: '6,245,190+',
      description: 'Build bigger biceps, sculpted triceps, and vascular forearms in 30 days with targeted arm routines.',
      image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80',
    },
    secondary: [
      {
        goalId: 'arm-workout',
        title: 'Toned Biceps & Triceps',
        level: 'Intermediate',
        time: '14 min / day',
        bolts: 2,
        icon: 'flame',
      },
      {
        goalId: 'arm-workout',
        title: 'Monster Arm Hypertrophy',
        level: 'Advanced',
        time: '22 min / day',
        bolts: 3,
        icon: 'trophy',
      },
    ],
  },

  // 2. BELLY FAT & ABS (Exact match to user's screenshot!)
  {
    id: 'abs',
    name: 'Abs & Core',
    icon: 'radio-button-on',
    badge: 'GUIDED',
    featured: {
      goalId: 'lose-belly-fat',
      title: 'Lose Belly Fat',
      level: 'Beginner',
      time: '7 min / day',
      bolts: 2,
      users: '8,958,192+',
      description: 'Start your journey to be leaner and stronger! Just 7 minutes daily to shed belly fat easily.',
      image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
    },
    secondary: [
      {
        goalId: 'lose-belly-fat',
        title: 'Rock Hard Abs',
        level: 'Intermediate',
        time: '12 min / day',
        bolts: 2,
        icon: 'flame',
      },
      {
        goalId: 'lose-belly-fat',
        title: 'Six Pack Abs',
        level: 'Advanced',
        time: '20 min / day',
        bolts: 3,
        icon: 'trophy',
      },
    ],
  },

  // 3. CHEST WORKOUT
  {
    id: 'chest',
    name: 'Chest',
    icon: 'shield',
    badge: '30-DAY PROGRAM',
    featured: {
      goalId: 'chest-workout',
      title: 'Chest Expansion',
      level: 'Beginner',
      time: '10 min / day',
      bolts: 2,
      users: '5,180,300+',
      description: 'Develop a wider, thicker chest with progressive push-ups and fly routines designed for steel pecs.',
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80',
    },
    secondary: [
      {
        goalId: 'chest-workout',
        title: 'Steel Pecs Sculpt',
        level: 'Intermediate',
        time: '15 min / day',
        bolts: 2,
        icon: 'flame',
      },
      {
        goalId: 'chest-workout',
        title: 'Upper Chest Armor',
        level: 'Advanced',
        time: '22 min / day',
        bolts: 3,
        icon: 'trophy',
      },
    ],
  },

  // 4. LEGS & LOWER BODY
  {
    id: 'legs',
    name: 'Legs',
    icon: 'walk',
    badge: '30-DAY PROGRAM',
    featured: {
      goalId: 'legs-workout',
      title: 'Legs & Lower Body Shred',
      level: 'Beginner',
      time: '12 min / day',
      bolts: 2,
      users: '4,890,700+',
      description: 'Strengthen quads, hamstrings, and glutes with progressive lower body athletic conditioning.',
      image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80',
    },
    secondary: [
      {
        goalId: 'legs-workout',
        title: 'Quad & Glute Power',
        level: 'Intermediate',
        time: '16 min / day',
        bolts: 2,
        icon: 'flame',
      },
      {
        goalId: 'legs-workout',
        title: 'Iron Legs & Calves',
        level: 'Advanced',
        time: '24 min / day',
        bolts: 3,
        icon: 'trophy',
      },
    ],
  },

  // 5. SHOULDER & BACK
  {
    id: 'shoulder-back',
    name: 'Shoulder & Back',
    icon: 'barbell',
    badge: '30-DAY PROGRAM',
    featured: {
      goalId: 'shoulder-back',
      title: 'V-Taper Shoulders & Back',
      level: 'Beginner',
      time: '10 min / day',
      bolts: 2,
      users: '4,310,200+',
      description: 'Broaden your deltoids and carve a dense V-taper posture with daily shoulder & back routines.',
      image: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&q=80',
    },
    secondary: [
      {
        goalId: 'shoulder-back',
        title: 'Shoulder Cannonballs',
        level: 'Intermediate',
        time: '15 min / day',
        bolts: 2,
        icon: 'flame',
      },
      {
        goalId: 'shoulder-back',
        title: 'Wings & Dense Lats',
        level: 'Advanced',
        time: '20 min / day',
        bolts: 3,
        icon: 'trophy',
      },
    ],
  },

  // 6. FULL BODY ATHLETIC
  {
    id: 'full-body',
    name: 'Full Body',
    icon: 'body',
    badge: 'TRANSFORMATION',
    featured: {
      goalId: 'full-body',
      title: '30 Days Better You',
      level: 'Beginner',
      time: '12 min / day',
      bolts: 2,
      users: '7,430,900+',
      description: 'Complete full-body functional transformation to burn fat, build lean muscle, and boost stamina.',
      image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80',
    },
    secondary: [
      {
        goalId: 'full-body',
        title: 'Total Body Torch',
        level: 'Intermediate',
        time: '18 min / day',
        bolts: 2,
        icon: 'flame',
      },
      {
        goalId: 'full-body',
        title: 'Elite Athletic Beast',
        level: 'Advanced',
        time: '26 min / day',
        bolts: 3,
        icon: 'trophy',
      },
    ],
  },
];

export default function SelectTrainingPlanScreen() {
  const router = useRouter();
  const { setGoal, setLevel } = useChallengeStore();
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');

  const handleStartPlan = (goalId: string, levelName: string, directToDay1: boolean = false) => {
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

  const filteredGroups = selectedFilter === 'all'
    ? PROGRAM_GROUPS
    : PROGRAM_GROUPS.filter((g) => g.id === selectedFilter);

  const showGymVault = selectedFilter === 'all' || selectedFilter === 'gym-vault';
  const showHomeVault = selectedFilter === 'all' || selectedFilter === 'home-vault';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* HEADER BAR (Matching User Screenshot) */}
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

      {/* HORIZONTAL CATEGORY SELECTOR */}
      <View style={styles.filterBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'all' && styles.filterChipTextActive]}>
              🔥 All Programs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'arm' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('arm')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'arm' && styles.filterChipTextActive]}>
              💪 Arm Workout
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'abs' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('abs')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'abs' && styles.filterChipTextActive]}>
              🎯 Abs & Core
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'chest' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('chest')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'chest' && styles.filterChipTextActive]}>
              🛡️ Chest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'legs' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('legs')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'legs' && styles.filterChipTextActive]}>
              🦵 Legs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'shoulder-back' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('shoulder-back')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'shoulder-back' && styles.filterChipTextActive]}>
              ⚡ Shoulder & Back
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'full-body' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('full-body')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'full-body' && styles.filterChipTextActive]}>
              🔥 Full Body
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'gym-vault' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('gym-vault')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'gym-vault' && styles.filterChipTextActive]}>
              🏋️ Gym Vault (800+)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'home-vault' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('home-vault')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'home-vault' && styles.filterChipTextActive]}>
              🏠 Home Vault (800+)
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TARGETED MUSCLE PROGRAM GROUPS (Matching User's Screenshot) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {filteredGroups.map((group) => (
          <View key={group.id} style={styles.groupContainer}>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionIconBadge}>
                  <Ionicons name="calendar" size={16} color={Colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>{group.name} 30-Day Programs</Text>
              </View>
              <Text style={styles.sectionBadge}>{group.badge}</Text>
            </View>

            {/* FEATURED CARD: Exact match to Screenshot (Athlete background + Start Day 1) */}
            <View style={styles.featuredCard}>
              <Image
                source={{ uri: group.featured.image }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />

              <View style={styles.featuredOverlay} />

              {/* Top Right: Active Users Badge */}
              <View style={styles.usersBadge}>
                <Text style={styles.usersBadgeNumber}>{group.featured.users}</Text>
                <Text style={styles.usersBadgeLabel}>Active Users</Text>
              </View>

              <View style={styles.featuredBody}>
                <Text style={styles.featuredTitle}>{group.featured.title}</Text>

                <View style={styles.levelRow}>
                  <Text style={styles.featuredLevelText}>{group.featured.level}</Text>
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <Ionicons
                      key={idx}
                      name="flash"
                      size={14}
                      color={idx < group.featured.bolts ? Colors.primary : 'rgba(255,255,255,0.3)'}
                    />
                  ))}
                  <Text style={styles.timeTagText}>• {group.featured.time}</Text>
                </View>

                <Text style={styles.featuredDesc}>{group.featured.description}</Text>

                <TouchableOpacity
                  style={styles.startDay1Btn}
                  activeOpacity={0.9}
                  onPress={() => handleStartPlan(group.featured.goalId, group.featured.level, true)}
                >
                  <Text style={styles.startDay1Text}>Start Day 1  →</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* SECONDARY CARDS: Exact match to Rock Hard Abs & Six Pack Abs in Screenshot */}
            {group.secondary.map((item, sIndex) => (
              <TouchableOpacity
                key={sIndex}
                style={styles.challengeItemCard}
                activeOpacity={0.85}
                onPress={() => handleStartPlan(item.goalId, item.level, false)}
              >
                <View style={styles.challengeCardContent}>
                  <View style={styles.challengeIconBox}>
                    <Ionicons name={item.icon as any} size={22} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.challengeTitle}>{item.title}</Text>
                    <View style={styles.levelRowSmall}>
                      <Text style={styles.challengeLevelText}>{item.level}</Text>
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <Ionicons
                          key={idx}
                          name="flash"
                          size={12}
                          color={idx < item.bolts ? Colors.primary : 'rgba(255,255,255,0.25)'}
                        />
                      ))}
                      <Text style={styles.challengeTimeText}>• {item.time}</Text>
                    </View>
                  </View>
                  <View style={styles.circleChevron}>
                    <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* NATIVE EXERCISE VAULT CARDS (FitPulse Style, Not Clunky Web) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {(showGymVault || showHomeVault) && (
          <View style={[styles.groupContainer, { marginTop: 10 }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionIconBadge}>
                  <Ionicons name="barbell" size={16} color={Colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>Exercise Vaults</Text>
              </View>
              <Text style={styles.sectionBadge}>800+ HD ANIMATIONS</Text>
            </View>

            {/* GYM VAULT CARD */}
            {showGymVault && (
              <View style={styles.featuredCard}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
                  }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                />
                <View style={styles.featuredOverlay} />

                <View style={styles.usersBadge}>
                  <Text style={styles.usersBadgeNumber}>800+ HD</Text>
                  <Text style={styles.usersBadgeLabel}>Animations</Text>
                </View>

                <View style={styles.featuredBody}>
                  <Text style={styles.featuredTitle}>Gym Exercises Vault</Text>

                  <View style={styles.levelRow}>
                    <Text style={styles.featuredLevelText}>Male (592) & Female (305)</Text>
                    <Ionicons name="flash" size={14} color={Colors.primary} />
                    <Ionicons name="flash" size={14} color={Colors.primary} />
                    <Ionicons name="flash" size={14} color={Colors.primary} />
                    <Text style={styles.timeTagText}>• 8 Body Parts</Text>
                  </View>

                  <Text style={styles.featuredDesc}>
                    Complete gym exercise catalog — Barbell, Dumbbell, Cable, Machine & Bodyweight movements with animated form preview and voice coach.
                  </Text>

                  <TouchableOpacity
                    style={styles.startDay1Btn}
                    activeOpacity={0.9}
                    onPress={() => router.push('/exercises/gym')}
                  >
                    <Text style={styles.startDay1Text}>Browse Gym Exercises  →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* HOME VAULT CARD */}
            {showHomeVault && (
              <View style={styles.featuredCard}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
                  }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                />
                <View style={styles.featuredOverlay} />

                <View style={styles.usersBadge}>
                  <Text style={styles.usersBadgeNumber}>NO EQUIPMENT</Text>
                  <Text style={styles.usersBadgeLabel}>800+ Workouts</Text>
                </View>

                <View style={styles.featuredBody}>
                  <Text style={styles.featuredTitle}>Home Workouts Vault</Text>

                  <View style={styles.levelRow}>
                    <Text style={styles.featuredLevelText}>Zero Equipment</Text>
                    <Ionicons name="flash" size={14} color={Colors.primary} />
                    <Ionicons name="flash" size={14} color={Colors.primary} />
                    <Text style={styles.timeTagText}>• 7 Categories • 16+ Routines</Text>
                  </View>

                  <Text style={styles.featuredDesc}>
                    Equipment-free routines for office breaks, yoga & flexibility, pilates core, mobility stretches, face yoga, and women routines.
                  </Text>

                  <TouchableOpacity
                    style={styles.startDay1Btn}
                    activeOpacity={0.9}
                    onPress={() => router.push('/exercises/home')}
                  >
                    <Text style={styles.startDay1Text}>Browse Home Workouts  →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
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

  // FILTER BAR
  filterBarContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#000000',
    fontWeight: '900',
  },

  // SCROLL CONTENT
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 20,
  },
  groupContainer: {
    gap: 12,
  },

  // SECTION HEADERS
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

  // FEATURED CARD: Exactly as in User's Screenshot
  featuredCard: {
    height: 330,
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
    backgroundColor: 'rgba(10, 10, 10, 0.74)',
  },
  usersBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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

  // SECONDARY LIST CARDS: Exactly as in Rock Hard Abs / Six Pack Abs
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
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 3,
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
