import { getWorkoutForDay } from './workouts';

export interface ChallengeDay {
  day: number;
  workoutId: string | null; // null means rest day
  title: string;
  isRest: boolean;
  isPremium?: boolean;
  exerciseCount: number;
  image?: string;
}

export interface Challenge {
  id: string;
  title: string;
  level: string;
  description: string;
  totalDays: number;
  heroImage: string;
  days: ChallengeDay[];
}

function generate30Days(challengeId: string, challengeTitle: string): ChallengeDay[] {
  const days: ChallengeDay[] = [];
  for (let i = 1; i <= 30; i++) {
    const isRest = i % 4 === 0;
    const workout = getWorkoutForDay(challengeId, i);
    days.push({
      day: i,
      workoutId: workout ? workout.id : null,
      title: isRest ? 'Rest' : `Day ${i}`,
      isRest,
      exerciseCount: workout ? workout.exercises.length : 0,
      image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&q=80',
    });
  }
  return days;
}

export const CHALLENGES: Record<string, Challenge> = {
  // 1. BELLY FAT & ABS
  'lose-belly-fat': {
    id: 'lose-belly-fat',
    title: 'Lose Belly Fat',
    level: 'Beginner',
    description: '30-day targeted belly fat burn and core sculpting plan.',
    totalDays: 30,
    heroImage: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
    days: generate30Days('lose-belly-fat', 'Lose Belly Fat'),
  },

  // 2. ARM WORKOUT ("ena arm yelena" Resolved)
  'arm-workout': {
    id: 'arm-workout',
    title: 'Arm Workout - Bigger Arms',
    level: 'Beginner',
    description: 'Build bigger biceps, sculpted triceps, and vascular forearms in 30 days.',
    totalDays: 30,
    heroImage: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80',
    days: generate30Days('arm-workout', 'Arm Workout'),
  },

  // 3. CHEST WORKOUT
  'chest-workout': {
    id: 'chest-workout',
    title: 'Chest Expansion',
    level: 'Beginner',
    description: '30-day progressive chest hypertrophy and definition plan for steel pecs.',
    totalDays: 30,
    heroImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80',
    days: generate30Days('chest-workout', 'Chest Workout'),
  },

  // 4. LEGS WORKOUT
  'legs-workout': {
    id: 'legs-workout',
    title: 'Legs & Lower Body Shred',
    level: 'Beginner',
    description: 'Build powerful quads, hamstrings, and glutes with progressive resistance.',
    totalDays: 30,
    heroImage: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80',
    days: generate30Days('legs-workout', 'Legs Workout'),
  },

  // 5. SHOULDER & BACK
  'shoulder-back': {
    id: 'shoulder-back',
    title: 'V-Taper Shoulders & Back',
    level: 'Beginner',
    description: 'Broaden your shoulders and build a dense, powerful V-taper back.',
    totalDays: 30,
    heroImage: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&q=80',
    days: generate30Days('shoulder-back', 'Shoulder & Back'),
  },

  // 6. FULL BODY ATHLETIC
  'full-body': {
    id: 'full-body',
    title: '30 Days Better You',
    level: 'Beginner',
    description: 'Full-body metabolic conditioning, stamina, and strength transformation.',
    totalDays: 30,
    heroImage: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80',
    days: generate30Days('full-body', 'Full Body'),
  },

  // 7. BUILD MUSCLE (Hypertrophy)
  'build-muscle': {
    id: 'build-muscle',
    title: 'Build Muscle',
    level: 'Intermediate',
    description: '30-day progressive overload hypertrophy and strength plan.',
    totalDays: 30,
    heroImage: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80',
    days: generate30Days('build-muscle', 'Build Muscle'),
  },

  // 8. HOME WORKOUT (Zero Equipment)
  'home-workout': {
    id: 'home-workout',
    title: 'Home Workout - Zero Equipment',
    level: 'Beginner',
    description: 'Full-body home workout program with zero equipment needed. Shed fat and build functional strength.',
    totalDays: 30,
    heroImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
    days: generate30Days('home-workout', 'Home Workout'),
  },
};

// Backward-compatibility alias
CHALLENGES['14-day-muscle'] = CHALLENGES['build-muscle'];
