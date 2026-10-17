import { ImageSourcePropType } from 'react-native';

export interface ExerciseAnimationAsset {
  source: ImageSourcePropType;
  title: string;
  isLeapNative?: boolean;
}

export const EXERCISE_ANIMATIONS: Record<string, ExerciseAnimationAsset> = {
  // --- 1. Authentic Leap Fitness Character Animations (Extracted from Leap Fitness) ---
  'arm-circles': {
    source: require('@/assets/exercises/arm_circles.webp'),
    title: 'Arm Circles',
    isLeapNative: true,
  },
  'dynamic-chest': {
    source: require('@/assets/exercises/dynamic_chest.webp'),
    title: 'Dynamic Chest',
    isLeapNative: true,
  },
  'chest-press-pulse': {
    source: require('@/assets/exercises/chest_press_pulse.webp'),
    title: 'Chest Press Pulse',
    isLeapNative: true,
  },
  'half-bending': {
    source: require('@/assets/exercises/half_bending.webp'),
    title: 'Half Bending Pushing Forward',
    isLeapNative: true,
  },
  'pushup': {
    source: require('@/assets/exercises/pushup.webp'),
    title: 'Push-ups',
    isLeapNative: true,
  },
  'pushups': {
    source: require('@/assets/exercises/pushup.webp'),
    title: 'Push-ups',
    isLeapNative: true,
  },
  'wide-arm-pushups': {
    source: require('@/assets/exercises/wide_arm_pushups.webp'),
    title: 'Wide Arm Push-ups',
    isLeapNative: true,
  },
  'high-stepping': {
    source: require('@/assets/exercises/high_stepping.png'),
    title: 'High Stepping',
    isLeapNative: true,
  },
  'side-plank-right': {
    source: require('@/assets/exercises/side_plank_right.png'),
    title: 'Side Plank Right',
    isLeapNative: true,
  },
  'side-plank-left': {
    source: require('@/assets/exercises/side_plank_right.png'),
    title: 'Side Plank Left',
    isLeapNative: true,
  },
  'side-plank': {
    source: require('@/assets/exercises/side_plank_right.png'),
    title: 'Side Plank',
    isLeapNative: true,
  },

  // --- 2. Universal 2D Animated Exercises (Complete 30-Day Coverage) ---
  'jumping-jacks': {
    source: require('@/assets/exercises/jumping_jacks.gif'),
    title: 'Jumping Jacks',
  },
  'standing-bicycle-crunches': {
    source: require('@/assets/exercises/bicycle_crunches.gif'),
    title: 'Standing Bicycle Crunches',
  },
  'bicycle-crunches': {
    source: require('@/assets/exercises/bicycle_crunches.gif'),
    title: 'Bicycle Crunches',
  },
  'mountain-climbers': {
    source: require('@/assets/exercises/mountain_climbers.gif'),
    title: 'Mountain Climber',
  },
  'mountain-climber': {
    source: require('@/assets/exercises/mountain_climbers.gif'),
    title: 'Mountain Climber',
  },
  'plank': {
    source: require('@/assets/exercises/plank.gif'),
    title: 'Plank',
  },
  'russian-twists': {
    source: require('@/assets/exercises/russian_twists.gif'),
    title: 'Russian Twists',
  },
  'butt-bridge': {
    source: require('@/assets/exercises/butt_bridge.gif'),
    title: 'Butt Bridge',
  },
  'glute-bridge': {
    source: require('@/assets/exercises/butt_bridge.gif'),
    title: 'Glute Bridge',
  },
  'squat': {
    source: require('@/assets/exercises/squat.gif'),
    title: 'Squats',
  },
  'squats': {
    source: require('@/assets/exercises/squat.gif'),
    title: 'Squats',
  },
  'lunges': {
    source: require('@/assets/exercises/lunges.gif'),
    title: 'Lunges',
  },
  'cobra-stretch': {
    source: require('@/assets/exercises/cobra_stretch.gif'),
    title: 'Cobra Stretch',
  },
};

export function getExerciseAnimation(exerciseId: string): ExerciseAnimationAsset {
  const normalized = exerciseId.toLowerCase().trim();
  if (EXERCISE_ANIMATIONS[normalized]) {
    return EXERCISE_ANIMATIONS[normalized];
  }

  // Fallback match by prefix or keywords
  for (const [key, value] of Object.entries(EXERCISE_ANIMATIONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  // Ultimate fallback to Jumping Jacks
  return EXERCISE_ANIMATIONS['jumping-jacks'];
}
