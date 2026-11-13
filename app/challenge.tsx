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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { useTheme } from '../store/themeStore';
import BackButton from '../components/ui/BackButton';
import { useChallengeStore } from '../store/challengeStore';

type MainTab = 'gym' | 'home';

type GymFilter = 'all' | 'arm' | 'abs' | 'chest' | 'legs' | 'shoulder-back' | 'full-body' | 'gym-vault';
type HomeFilter = 'all' | 'home-main' | 'yoga' | 'pilates' | 'office' | 'face' | 'women' | 'mobility' | 'home-vault';

interface ProgramGroup {
  id: string;
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

// ── GYM 30-DAY PROGRAM GROUPS ──
const GYM_PROGRAM_GROUPS: ProgramGroup[] = [
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
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
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
      image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80',
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
      image: 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800&q=80',
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

// ── HOME 30-DAY PROGRAM GROUPS ──
const HOME_PROGRAM_GROUPS: ProgramGroup[] = [
  {
    id: 'home-main',
    name: 'Home Workout (No Equipment)',
    icon: 'home',
    badge: 'ZERO EQUIPMENT',
    featured: {
      goalId: 'home-workout',
      title: 'Home Workout - Zero Equipment',
      level: 'Beginner',
      time: '10 min / day',
      bolts: 2,
      users: '7,850,000+',
      description: 'Complete full-body home routines with zero equipment needed. Shed fat, tone muscle, and boost energy.',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
    },
    secondary: [
      {
        goalId: 'home-workout',
        title: 'Full Body Home Burn',
        level: 'Intermediate',
        time: '15 min / day',
        bolts: 2,
        icon: 'flame',
      },
      {
        goalId: 'home-workout',
        title: 'Home HIIT & Calisthenics',
        level: 'Advanced',
        time: '22 min / day',
        bolts: 3,
        icon: 'trophy',
      },
    ],
  },
  {
    id: 'yoga',
    name: 'Yoga & Flexibility',
    icon: 'flower',
    badge: 'MIND & BODY',
    featured: {
      goalId: 'home-workout',
      title: 'Daily Yoga Flow & Flexibility',
      level: 'Beginner',
      time: '15 min / day',
      bolts: 1,
      users: '3,410,000+',
      description: 'Gentle spinal stretches, Downward Dog, and deep hip openers to relieve stiffness and improve flexibility.',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
    },
    secondary: [
      {
        goalId: 'home-workout',
        title: 'Morning Energy Sun Flow',
        level: 'Beginner',
        time: '12 min / day',
        bolts: 1,
        icon: 'sunny',
      },
      {
        goalId: 'home-workout',
        title: 'Deep Hip & Back Release',
        level: 'Intermediate',
        time: '18 min / day',
        bolts: 2,
        icon: 'leaf',
      },
    ],
  },
  {
    id: 'pilates',
    name: 'Pilates Core Sculpt',
    icon: 'fitness',
    badge: 'CORE SCULPT',
    featured: {
      goalId: 'home-workout',
      title: 'Pilates Core & Posture',
      level: 'Beginner',
      time: '12 min / day',
      bolts: 2,
      users: '2,980,000+',
      description: 'Classical mat pilates targeting deep transverse abdominals, The Hundred, and spine articulation.',
      image: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=800&q=80',
    },
    secondary: [
      {
        goalId: 'home-workout',
        title: 'Pilates The Hundred & Criss-Cross',
        level: 'Intermediate',
        time: '15 min / day',
        bolts: 2,
        icon: 'flame',
      },
      {
        goalId: 'home-workout',
        title: 'Power Pilates Waist Trimmer',
        level: 'Advanced',
        time: '20 min / day',
        bolts: 3,
        icon: 'trophy',
      },
    ],
  },
  {
    id: 'office',
    name: 'Office & Desk Routines',
    icon: 'briefcase',
    badge: 'QUICK RELIEF',
    featured: {
      goalId: 'home-workout',
      title: 'Desk Worker Posture Fix',
      level: 'Beginner',
      time: '6 min / day',
      bolts: 1,
      users: '4,150,000+',
      description: 'Quick seated chair squats, torso twists, wrist stretches, and neck releases designed for busy work days.',
      image: 'https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?w=800&q=80',
    },
    secondary: [
      {
        goalId: 'home-workout',
        title: 'Neck & Shoulder Tension Release',
        level: 'Beginner',
        time: '5 min / day',
        bolts: 1,
        icon: 'happy',
      },
      {
        goalId: 'home-workout',
        title: 'Standing Desk Calf & Core Energizer',
        level: 'Beginner',
        time: '8 min / day',
        bolts: 1,
        icon: 'walk',
      },
    ],
  },
  {
    id: 'face',
    name: 'Face Yoga & Sculpt',
    icon: 'happy',
    badge: 'ANTI-AGING',
    featured: {
      goalId: 'home-workout',
      title: 'Jawline Sculpt & Cheek Lifter',
      level: 'Beginner',
      time: '8 min / day',
      bolts: 1,
      users: '1,890,000+',
      description: 'Natural facial exercises to chisel jawline, release forehead tension, tone cheeks, and firm swan neck.',
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
    },
    secondary: [
      {
        goalId: 'home-workout',
        title: 'Swan Neck & Double Chin Eraser',
        level: 'Beginner',
        time: '7 min / day',
        bolts: 1,
        icon: 'sparkles',
      },
      {
        goalId: 'home-workout',
        title: 'Forehead & Eye Glow Revitalizer',
        level: 'Beginner',
        time: '6 min / day',
        bolts: 1,
        icon: 'eye',
      },
    ],
  },
  {
    id: 'women',
    name: 'Women Sculpt & Tone',
    icon: 'woman',
    badge: 'CURVE SCULPT',
    featured: {
      goalId: 'home-workout',
      title: 'Glutes & Waist Curve Sculpt',
      level: 'Beginner',
      time: '14 min / day',
      bolts: 2,
      users: '5,320,000+',
      description: 'Targeted glute bridge pulses, donkey kicks, fire hydrants, and core bird-dog for sculpted curves.',
      image: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=800&q=80',
    },
    secondary: [
      {
        goalId: 'home-workout',
        title: 'Booty Lift & Hamstring Burn',
        level: 'Intermediate',
        time: '16 min / day',
        bolts: 2,
        icon: 'flame',
      },
      {
        goalId: 'home-workout',
        title: 'Inner Thigh & Pelvic Tightener',
        level: 'Intermediate',
        time: '15 min / day',
        bolts: 2,
        icon: 'heart',
      },
    ],
  },
  {
    id: 'mobility',
    name: 'Mobility & Recovery',
    icon: 'infinite',
    badge: 'STRETCH & HEAL',
    featured: {
      goalId: 'home-workout',
      title: 'Full Body Mobility & Joint Health',
      level: 'Beginner',
      time: '12 min / day',
      bolts: 1,
      users: '2,670,000+',
      description: "Cat-Cow, World's Greatest Stretch, and 90/90 hip openers to restore joint range and eliminate soreness.",
      image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&q=80',
    },
    secondary: [
      {
        goalId: 'home-workout',
        title: 'Primal Deep Squat Mobility',
        level: 'Intermediate',
        time: '10 min / day',
        bolts: 2,
        icon: 'barbell',
      },
      {
        goalId: 'home-workout',
        title: 'Spine & Thoracic Rotation Flow',
        level: 'Beginner',
        time: '10 min / day',
        bolts: 1,
        icon: 'refresh',
      },
    ],
  },
];

export default function SelectTrainingPlanScreen() {
  const router = useRouter();
  const { setGoal, setLevel } = useChallengeStore();
  const { colors } = useTheme();

  // Top Master Switch: 'gym' or 'home'
  const [activeTab, setActiveTab] = useState<MainTab>('gym');

  // Sub-filters for Gym & Home
  const [gymFilter, setGymFilter] = useState<GymFilter>('all');
  const [homeFilter, setHomeFilter] = useState<HomeFilter>('all');

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

  // Filter groups depending on active tab & sub-filter
  const currentGymGroups = gymFilter === 'all'
    ? GYM_PROGRAM_GROUPS
    : GYM_PROGRAM_GROUPS.filter((g) => g.id === gymFilter);

  const currentHomeGroups = homeFilter === 'all'
    ? HOME_PROGRAM_GROUPS
    : HOME_PROGRAM_GROUPS.filter((g) => g.id === homeFilter);

  const showGymVaultCard = activeTab === 'gym' && (gymFilter === 'all' || gymFilter === 'gym-vault');
  const showHomeVaultCard = activeTab === 'home' && (homeFilter === 'all' || homeFilter === 'home-vault');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* HEADER BAR: compact title + 30-DAY pill */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <BackButton fallbackRoute="/(tabs)" />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Training Hub</Text>
        <View style={[styles.headerBadgePill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="flash" size={12} color={colors.primary} />
          <Text style={[styles.headerBadgeText, { color: colors.primary }]}>30-DAY</Text>
        </View>
      </View>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MASTER PILL SWITCH: [ 🏋️ Gym Workouts ] [ 🏠 Home Workouts ] */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <View style={[styles.masterTabWrap, { backgroundColor: colors.background }]}>
        <View style={[styles.masterTabContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.masterTabBtn, activeTab === 'gym' && styles.masterTabBtnActive]}
            activeOpacity={0.85}
            onPress={() => setActiveTab('gym')}
          >
            <Ionicons name="barbell" size={16} color={activeTab === 'gym' ? '#000' : colors.textMuted} />
            <Text style={[styles.masterTabText, { color: activeTab === 'gym' ? '#000' : colors.textMuted }, activeTab === 'gym' && styles.masterTabTextActive]}>
              Gym Workouts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.masterTabBtn, activeTab === 'home' && styles.masterTabBtnActive]}
            activeOpacity={0.85}
            onPress={() => setActiveTab('home')}
          >
            <Ionicons name="home" size={16} color={activeTab === 'home' ? '#000' : colors.textMuted} />
            <Text style={[styles.masterTabText, { color: activeTab === 'home' ? '#000' : colors.textMuted }, activeTab === 'home' && styles.masterTabTextActive]}>
              Home Workouts
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SUB-FILTER CHIPS BAR */}
      <View style={[styles.filterBarContainer, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {activeTab === 'gym' ? (
            <>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, gymFilter === 'all' && styles.filterChipActive]}
                onPress={() => setGymFilter('all')}
              >
                <Text style={[styles.filterChipText, { color: colors.textMuted }, gymFilter === 'all' && styles.filterChipTextActive]}>
                  🔥 All Gym
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, gymFilter === 'arm' && styles.filterChipActive]}
                onPress={() => setGymFilter('arm')}
              >
                <Text style={[styles.filterChipText, { color: colors.textMuted }, gymFilter === 'arm' && styles.filterChipTextActive]}>
                  💪 Arm Workout
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, gymFilter === 'abs' && styles.filterChipActive]}
                onPress={() => setGymFilter('abs')}
              >
                <Text style={[styles.filterChipText, { color: colors.textMuted }, gymFilter === 'abs' && styles.filterChipTextActive]}>
                  🎯 Abs & Core
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, gymFilter === 'chest' && styles.filterChipActive]}
                onPress={() => setGymFilter('chest')}
              >
                <Text style={[styles.filterChipText, { color: colors.textMuted }, gymFilter === 'chest' && styles.filterChipTextActive]}>
                  🛡️ Chest
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, gymFilter === 'legs' && styles.filterChipActive]}
                onPress={() => setGymFilter('legs')}
              >
                <Text style={[styles.filterChipText, { color: colors.textMuted }, gymFilter === 'legs' && styles.filterChipTextActive]}>
                  🦵 Legs
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, gymFilter === 'shoulder-back' && styles.filterChipActive]}
                onPress={() => setGymFilter('shoulder-back')}
              >
                <Text style={[styles.filterChipText, { color: colors.textMuted }, gymFilter === 'shoulder-back' && styles.filterChipTextActive]}>
                  ⚡ Shoulder & Back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, gymFilter === 'full-body' && styles.filterChipActive]}
                onPress={() => setGymFilter('full-body')}
              >
                <Text style={[styles.filterChipText, { color: colors.textMuted }, gymFilter === 'full-body' && styles.filterChipTextActive]}>
                  🔥 Full Body
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, gymFilter === 'gym-vault' && styles.filterChipActive]}
                onPress={() => setGymFilter('gym-vault')}
              >
                <Text style={[styles.filterChipText, { color: colors.textMuted }, gymFilter === 'gym-vault' && styles.filterChipTextActive]}>
                  🏋️ 800+ Gym Vault
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, homeFilter === 'all' && styles.filterChipActive]}
                onPress={() => setHomeFilter('all')}
              >
                <Text style={[styles.filterChipText, { color: colors.textMuted }, homeFilter === 'all' && styles.filterChipTextActive]}>
                  🔥 All Home
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, homeFilter === 'home-main' && styles.filterChipActive]}
                onPress={() => setHomeFilter('home-main')}
              >
                <Text style={[styles.filterChipText, { color: colors.textMuted }, homeFilter === 'home-main' && styles.filterChipTextActive]}>
                  🏠 Zero Equipment
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, homeFilter === 'yoga' && styles.filterChipActive]}
                onPress={() => setHomeFilter('yoga')}
              >
                <Text style={[styles.filterChipText, { color: colors.textMuted }, homeFilter === 'yoga' && styles.filterChipTextActive]}>
                  🧘 Yoga & Stretch
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, homeFilter === 'pilates' && styles.filterChipActive]}
                onPress={() => setHomeFilter('pilates')}
              >
                <Text style={[styles.filterChipText, { color: colors.textMuted }, homeFilter === 'pilates' && styles.filterChipTextActive]}>
                  ⚡ Pilates Core
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, homeFilter === 'office' && styles.filterChipActive]}
                onPress={() => setHomeFilter('office')}
              >
                <Text style={[styles.filterChipText, { color: colors.textMuted }, homeFilter === 'office' && styles.filterChipTextActive]}>
                  💼 Office Workouts
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, homeFilter === 'face' && styles.filterChipActive]}
                onPress={() => setHomeFilter('face')}
              >
                <Text style={[styles.filterChipText, { color: colors.textMuted }, homeFilter === 'face' && styles.filterChipTextActive]}>
                  😊 Face Yoga
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, homeFilter === 'women' && styles.filterChipActive]}
                onPress={() => setHomeFilter('women')}
              >
                <Text style={[styles.filterChipText, { color: colors.textMuted }, homeFilter === 'women' && styles.filterChipTextActive]}>
                  💃 Women Sculpt
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, homeFilter === 'mobility' && styles.filterChipActive]}
                onPress={() => setHomeFilter('mobility')}
              >
                <Text style={[styles.filterChipText, { color: colors.textMuted }, homeFilter === 'mobility' && styles.filterChipTextActive]}>
                  ♾️ Mobility
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, homeFilter === 'home-vault' && styles.filterChipActive]}
                onPress={() => setHomeFilter('home-vault')}
              >
                <Text style={[styles.filterChipText, { color: colors.textMuted }, homeFilter === 'home-vault' && styles.filterChipTextActive]}>
                  🏠 800+ Home Vault
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* GYM WORKOUTS CONTENT */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'gym' && (
          <>
            {currentGymGroups.map((group) => (
              <View key={group.id} style={styles.groupContainer}>
                {/* FEATURED CARD — no separate section header above */}
                <View style={[styles.featuredCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Image
                    source={{ uri: group.featured.image }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.92)']}
                    style={StyleSheet.absoluteFill}
                  />

                  {/* Top row: category badge (left) + users pill (right) */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.categoryBadge}>
                      <View style={[styles.badgeDot, { backgroundColor: colors.primary }]} />
                      <Text style={styles.categoryBadgeText}>{group.badge}</Text>
                    </View>
                    <View style={styles.usersPill}>
                      <Ionicons name="people" size={12} color={colors.primary} />
                      <Text style={styles.usersPillText}>{group.featured.users}</Text>
                    </View>
                  </View>

                  <View style={styles.featuredBody}>
                    <Text style={styles.featuredTitle}>{group.featured.title}</Text>

                    <View style={styles.levelRow}>
                      <View style={styles.levelTag}>
                        <Text style={styles.featuredLevelText}>{group.featured.level}</Text>
                      </View>
                      <View style={styles.boltsWrap}>
                        {Array.from({ length: 3 }).map((_, idx) => (
                          <Ionicons
                            key={idx}
                            name="flash"
                            size={14}
                            color={idx < group.featured.bolts ? colors.primary : 'rgba(255,255,255,0.3)'}
                          />
                        ))}
                      </View>
                      <Text style={styles.timeTagText}>• {group.featured.time}</Text>
                    </View>

                    <Text style={styles.featuredDesc} numberOfLines={2}>{group.featured.description}</Text>

                    <TouchableOpacity
                      style={[styles.startDay1Btn, { backgroundColor: colors.primary }]}
                      activeOpacity={0.9}
                      onPress={() => handleStartPlan(group.featured.goalId, group.featured.level, true)}
                    >
                      <Text style={styles.startDay1Text}>Start Day 1  →</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* SECONDARY LIST CARDS */}
                {group.secondary.map((item, sIndex) => (
                  <TouchableOpacity
                    key={sIndex}
                    style={[styles.challengeItemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    activeOpacity={0.85}
                    onPress={() => handleStartPlan(item.goalId, item.level, false)}
                  >
                    <View style={styles.challengeCardContent}>
                      <View style={[styles.challengeIconBox, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}33` }]}>
                        <Ionicons name={item.icon as any} size={22} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.challengeTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                        <View style={styles.levelRowSmall}>
                          <Text style={[styles.challengeLevelText, { color: colors.textMuted }]}>{item.level}</Text>
                          {Array.from({ length: 3 }).map((_, idx) => (
                            <Ionicons
                              key={idx}
                              name="flash"
                              size={12}
                              color={idx < item.bolts ? colors.primary : 'rgba(255,255,255,0.25)'}
                            />
                          ))}
                          <Text style={[styles.challengeTimeText, { color: colors.textMuted }]}>• {item.time}</Text>
                        </View>
                      </View>
                      <View style={[styles.circleChevron, { backgroundColor: colors.surfaceLight }]}>
                        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {/* GYM VAULT CARD */}
            {showGymVaultCard && (
              <View style={[styles.groupContainer, { marginTop: 10 }]}>
                <View style={[styles.featuredCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
                    }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.92)']}
                    style={StyleSheet.absoluteFill}
                  />

                  <View style={styles.cardTopRow}>
                    <View style={styles.categoryBadge}>
                      <View style={[styles.badgeDot, { backgroundColor: colors.primary }]} />
                      <Text style={styles.categoryBadgeText}>GYM VAULT</Text>
                    </View>
                    <View style={styles.usersPill}>
                      <Ionicons name="library" size={12} color={colors.primary} />
                      <Text style={styles.usersPillText}>800+ HD</Text>
                    </View>
                  </View>

                  <View style={styles.featuredBody}>
                    <Text style={styles.featuredTitle}>Gym Exercises Vault</Text>

                    <View style={styles.levelRow}>
                      <View style={styles.levelTag}>
                        <Text style={styles.featuredLevelText}>Male & Female</Text>
                      </View>
                      <View style={styles.boltsWrap}>
                        <Ionicons name="flash" size={14} color={colors.primary} />
                        <Ionicons name="flash" size={14} color={colors.primary} />
                        <Ionicons name="flash" size={14} color={colors.primary} />
                      </View>
                      <Text style={styles.timeTagText}>• 8 Body Parts</Text>
                    </View>

                    <Text style={styles.featuredDesc} numberOfLines={2}>
                      Explore full gym movement catalog: Barbell, Dumbbell, Cable, and Machines with HD animated preview.
                    </Text>

                    <TouchableOpacity
                      style={[styles.startDay1Btn, { backgroundColor: colors.primary }]}
                      activeOpacity={0.9}
                      onPress={() => router.push('/exercises/gym')}
                    >
                      <Text style={styles.startDay1Text}>Browse Gym Exercises Vault  →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* HOME WORKOUTS CONTENT */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'home' && (
          <>
            {currentHomeGroups.map((group) => (
              <View key={group.id} style={styles.groupContainer}>
                {/* FEATURED HOME CARD — no separate section header */}
                <View style={[styles.featuredCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Image
                    source={{ uri: group.featured.image }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.92)']}
                    style={StyleSheet.absoluteFill}
                  />

                  <View style={styles.cardTopRow}>
                    <View style={styles.categoryBadge}>
                      <View style={[styles.badgeDot, { backgroundColor: colors.primary }]} />
                      <Text style={styles.categoryBadgeText}>{group.badge}</Text>
                    </View>
                    <View style={styles.usersPill}>
                      <Ionicons name="people" size={12} color={colors.primary} />
                      <Text style={styles.usersPillText}>{group.featured.users}</Text>
                    </View>
                  </View>

                  <View style={styles.featuredBody}>
                    <Text style={styles.featuredTitle}>{group.featured.title}</Text>

                    <View style={styles.levelRow}>
                      <View style={styles.levelTag}>
                        <Text style={styles.featuredLevelText}>{group.featured.level}</Text>
                      </View>
                      <View style={styles.boltsWrap}>
                        {Array.from({ length: 3 }).map((_, idx) => (
                          <Ionicons
                            key={idx}
                            name="flash"
                            size={14}
                            color={idx < group.featured.bolts ? colors.primary : 'rgba(255,255,255,0.3)'}
                          />
                        ))}
                      </View>
                      <Text style={styles.timeTagText}>• {group.featured.time}</Text>
                    </View>

                    <Text style={styles.featuredDesc} numberOfLines={2}>{group.featured.description}</Text>

                    <TouchableOpacity
                      style={[styles.startDay1Btn, { backgroundColor: colors.primary }]}
                      activeOpacity={0.9}
                      onPress={() => handleStartPlan(group.featured.goalId, group.featured.level, true)}
                    >
                      <Text style={styles.startDay1Text}>Start Day 1  →</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* SECONDARY LIST CARDS */}
                {group.secondary.map((item, sIndex) => (
                  <TouchableOpacity
                    key={sIndex}
                    style={[styles.challengeItemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    activeOpacity={0.85}
                    onPress={() => handleStartPlan(item.goalId, item.level, false)}
                  >
                    <View style={styles.challengeCardContent}>
                      <View style={[styles.challengeIconBox, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}33` }]}>
                        <Ionicons name={item.icon as any} size={22} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.challengeTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                        <View style={styles.levelRowSmall}>
                          <Text style={[styles.challengeLevelText, { color: colors.textMuted }]}>{item.level}</Text>
                          {Array.from({ length: 3 }).map((_, idx) => (
                            <Ionicons
                              key={idx}
                              name="flash"
                              size={12}
                              color={idx < item.bolts ? colors.primary : 'rgba(255,255,255,0.25)'}
                            />
                          ))}
                          <Text style={[styles.challengeTimeText, { color: colors.textMuted }]}>• {item.time}</Text>
                        </View>
                      </View>
                      <View style={[styles.circleChevron, { backgroundColor: colors.surfaceLight }]}>
                        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {/* HOME VAULT CARD */}
            {showHomeVaultCard && (
              <View style={[styles.groupContainer, { marginTop: 10 }]}>
                <View style={[styles.featuredCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
                    }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.92)']}
                    style={StyleSheet.absoluteFill}
                  />

                  <View style={styles.cardTopRow}>
                    <View style={styles.categoryBadge}>
                      <View style={[styles.badgeDot, { backgroundColor: colors.primary }]} />
                      <Text style={styles.categoryBadgeText}>HOME VAULT</Text>
                    </View>
                    <View style={styles.usersPill}>
                      <Ionicons name="home" size={12} color={colors.primary} />
                      <Text style={styles.usersPillText}>800+</Text>
                    </View>
                  </View>

                  <View style={styles.featuredBody}>
                    <Text style={styles.featuredTitle}>Home Workouts Vault</Text>

                    <View style={styles.levelRow}>
                      <View style={styles.levelTag}>
                        <Text style={styles.featuredLevelText}>Zero Equipment</Text>
                      </View>
                      <View style={styles.boltsWrap}>
                        <Ionicons name="flash" size={14} color={colors.primary} />
                        <Ionicons name="flash" size={14} color={colors.primary} />
                      </View>
                      <Text style={styles.timeTagText}>• 7 Categories</Text>
                    </View>

                    <Text style={styles.featuredDesc} numberOfLines={2}>
                      Equipment-free routines for office breaks, yoga & flexibility, pilates core, mobility stretches, face yoga, and women routines.
                    </Text>

                    <TouchableOpacity
                      style={[styles.startDay1Btn, { backgroundColor: colors.primary }]}
                      activeOpacity={0.9}
                      onPress={() => router.push('/exercises/home')}
                    >
                      <Text style={styles.startDay1Text}>Browse Home Workouts Vault  →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    flex: 1,
    textAlign: 'center',
  },
  headerBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  // MASTER TAB SWITCH (Gym vs Home)
  masterTabWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  masterTabContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 28,
    borderWidth: 1,
  },
  masterTabBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 24,
  },
  masterTabBtnActive: {
    backgroundColor: Colors.primary,
  },
  masterTabText: {
    fontSize: 13,
    fontWeight: '800',
  },
  masterTabTextActive: {
    color: '#000000',
    fontWeight: '900',
  },

  // FILTER BAR
  filterBarContainer: {
    borderBottomWidth: 1,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
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

  // FEATURED CARD — cinematic gradient style
  featuredCard: {
    height: 330,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 20,
    borderWidth: 1,
  },

  // TOP ROW: category badge (left) + users pill (right) INSIDE the card
  cardTopRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  usersPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  usersPillText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '700',
  },

  featuredBody: {
    zIndex: 1,
  },
  featuredTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  levelTag: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  featuredLevelText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  boltsWrap: {
    flexDirection: 'row',
    gap: 2,
  },
  timeTagText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  featuredDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  startDay1Btn: {
    height: 46,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startDay1Text: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
  },

  // SECONDARY LIST CARDS
  challengeItemCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '800',
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
    marginRight: 2,
  },
  challengeTimeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  circleChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

