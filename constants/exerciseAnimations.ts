import { ImageSourcePropType } from 'react-native';

export interface ExerciseAnimationAsset {
  id: string;
  title: string;
  start: ImageSourcePropType;
  peak: ImageSourcePropType;
  thumbnail: ImageSourcePropType;
  source?: ImageSourcePropType;
}

export const EXERCISE_ANIMATIONS: Record<string, ExerciseAnimationAsset> = {
  'jumping-jacks': {
    id: 'jumping-jacks',
    title: 'Jumping Jacks',
    start: require('@/assets/exercises/jumping-jacks-start.webp'),
    peak: require('@/assets/exercises/jumping-jacks-peak.webp'),
    thumbnail: require('@/assets/exercises/jumping-jacks-peak.webp'),
  },
  'pushup': {
    id: 'pushup',
    title: 'Push-ups',
    start: require('@/assets/exercises/push-up-start.webp'),
    peak: require('@/assets/exercises/push-up-peak.webp'),
    thumbnail: require('@/assets/exercises/push-up-peak.webp'),
  },
  'push-ups': {
    id: 'push-ups',
    title: 'Push-ups',
    start: require('@/assets/exercises/push-up-start.webp'),
    peak: require('@/assets/exercises/push-up-peak.webp'),
    thumbnail: require('@/assets/exercises/push-up-peak.webp'),
  },
  'close-grip-push-ups': {
    id: 'close-grip-push-ups',
    title: 'Close Grip Push-ups',
    start: require('@/assets/exercises/close-grip-push-ups-start.webp'),
    peak: require('@/assets/exercises/close-grip-push-ups-peak.webp'),
    thumbnail: require('@/assets/exercises/close-grip-push-ups-peak.webp'),
  },
  'archer-push-ups': {
    id: 'archer-push-ups',
    title: 'Archer Push-ups',
    start: require('@/assets/exercises/archer-push-ups-start.webp'),
    peak: require('@/assets/exercises/archer-push-ups-peak.webp'),
    thumbnail: require('@/assets/exercises/archer-push-ups-peak.webp'),
  },
  'wide-arm-pushups': {
    id: 'wide-arm-pushups',
    title: 'Wide Arm Push-ups',
    start: require('@/assets/exercises/archer-push-ups-start.webp'),
    peak: require('@/assets/exercises/archer-push-ups-peak.webp'),
    thumbnail: require('@/assets/exercises/archer-push-ups-peak.webp'),
  },
  'knee-push-ups': {
    id: 'knee-push-ups',
    title: 'Knee Push-ups',
    start: require('@/assets/exercises/knee-push-ups-start.webp'),
    peak: require('@/assets/exercises/knee-push-ups-peak.webp'),
    thumbnail: require('@/assets/exercises/knee-push-ups-peak.webp'),
  },
  'squat': {
    id: 'squat',
    title: 'Squats',
    start: require('@/assets/exercises/bodyweight-squat-start.webp'),
    peak: require('@/assets/exercises/bodyweight-squat-peak.webp'),
    thumbnail: require('@/assets/exercises/bodyweight-squat-peak.webp'),
  },
  'squats': {
    id: 'squats',
    title: 'Squats',
    start: require('@/assets/exercises/bodyweight-squat-start.webp'),
    peak: require('@/assets/exercises/bodyweight-squat-peak.webp'),
    thumbnail: require('@/assets/exercises/bodyweight-squat-peak.webp'),
  },
  'jump-squat': {
    id: 'jump-squat',
    title: 'Jump Squats',
    start: require('@/assets/exercises/jump-squat-start.webp'),
    peak: require('@/assets/exercises/jump-squat-peak.webp'),
    thumbnail: require('@/assets/exercises/jump-squat-peak.webp'),
  },
  'mountain-climbers': {
    id: 'mountain-climbers',
    title: 'Mountain Climbers',
    start: require('@/assets/exercises/mountain-climbers-start.webp'),
    peak: require('@/assets/exercises/mountain-climbers-peak.webp'),
    thumbnail: require('@/assets/exercises/mountain-climbers-peak.webp'),
  },
  'mountain-climber': {
    id: 'mountain-climber',
    title: 'Mountain Climbers',
    start: require('@/assets/exercises/mountain-climbers-start.webp'),
    peak: require('@/assets/exercises/mountain-climbers-peak.webp'),
    thumbnail: require('@/assets/exercises/mountain-climbers-peak.webp'),
  },
  'bicycle-crunches': {
    id: 'bicycle-crunches',
    title: 'Bicycle Crunches',
    start: require('@/assets/exercises/bicycle-crunch-start.webp'),
    peak: require('@/assets/exercises/bicycle-crunch-peak.webp'),
    thumbnail: require('@/assets/exercises/bicycle-crunch-peak.webp'),
  },
  'standing-bicycle-crunches': {
    id: 'standing-bicycle-crunches',
    title: 'Bicycle Crunches',
    start: require('@/assets/exercises/bicycle-crunch-start.webp'),
    peak: require('@/assets/exercises/bicycle-crunch-peak.webp'),
    thumbnail: require('@/assets/exercises/bicycle-crunch-peak.webp'),
  },
  'plank': {
    id: 'plank',
    title: 'Plank',
    start: require('@/assets/exercises/high-plank-main.webp'),
    peak: require('@/assets/exercises/plank-knee-tuck-peak.webp'),
    thumbnail: require('@/assets/exercises/high-plank-main.webp'),
  },
  'side-plank': {
    id: 'side-plank',
    title: 'Plank',
    start: require('@/assets/exercises/high-plank-main.webp'),
    peak: require('@/assets/exercises/high-plank-main.webp'),
    thumbnail: require('@/assets/exercises/high-plank-main.webp'),
  },
  'side-plank-right': {
    id: 'side-plank-right',
    title: 'Side Plank',
    start: require('@/assets/exercises/high-plank-main.webp'),
    peak: require('@/assets/exercises/high-plank-main.webp'),
    thumbnail: require('@/assets/exercises/high-plank-main.webp'),
  },
  'russian-twists': {
    id: 'russian-twists',
    title: 'Russian Twists',
    start: require('@/assets/exercises/russian-twist-start.webp'),
    peak: require('@/assets/exercises/russian-twist-peak.webp'),
    thumbnail: require('@/assets/exercises/russian-twist-peak.webp'),
  },
  'butt-bridge': {
    id: 'butt-bridge',
    title: 'Glute Bridge',
    start: require('@/assets/exercises/glute-bridge-hold-main.webp'),
    peak: require('@/assets/exercises/glute-bridge-peak.webp'),
    thumbnail: require('@/assets/exercises/glute-bridge-peak.webp'),
  },
  'glute-bridge': {
    id: 'glute-bridge',
    title: 'Glute Bridge',
    start: require('@/assets/exercises/glute-bridge-hold-main.webp'),
    peak: require('@/assets/exercises/glute-bridge-peak.webp'),
    thumbnail: require('@/assets/exercises/glute-bridge-peak.webp'),
  },
  'lunges': {
    id: 'lunges',
    title: 'Reverse Lunges',
    start: require('@/assets/exercises/bodyweight-reverse-lunge-start.webp'),
    peak: require('@/assets/exercises/bodyweight-reverse-lunge-peak.webp'),
    thumbnail: require('@/assets/exercises/bodyweight-reverse-lunge-peak.webp'),
  },
  'bench-dips': {
    id: 'bench-dips',
    title: 'Bench Dips',
    start: require('@/assets/exercises/bench-dips-start.webp'),
    peak: require('@/assets/exercises/bench-dips-peak.webp'),
    thumbnail: require('@/assets/exercises/bench-dips-peak.webp'),
  },
  'cobra-stretch': {
    id: 'cobra-stretch',
    title: 'Cobra Stretch',
    start: require('@/assets/exercises/cobra-stretch-main.webp'),
    peak: require('@/assets/exercises/childs-pose-main.webp'),
    thumbnail: require('@/assets/exercises/cobra-stretch-main.webp'),
  },
  'high-stepping': {
    id: 'high-stepping',
    title: 'High Knees',
    start: require('@/assets/exercises/high-knees-main.webp'),
    peak: require('@/assets/exercises/jumping-jacks-peak.webp'),
    thumbnail: require('@/assets/exercises/high-knees-main.webp'),
  },
  'burpees': {
    id: 'burpees',
    title: 'Burpees',
    start: require('@/assets/exercises/burpees-main.webp'),
    peak: require('@/assets/exercises/jumping-jacks-peak.webp'),
    thumbnail: require('@/assets/exercises/burpees-main.webp'),
  },
  'ab-wheel-rollout': {
    id: 'ab-wheel-rollout',
    title: 'Ab Wheel Rollout',
    start: require('@/assets/exercises/ab-wheel-rollout-start.webp'),
    peak: require('@/assets/exercises/ab-wheel-rollout-peak.webp'),
    thumbnail: require('@/assets/exercises/ab-wheel-rollout-peak.webp'),
  },
  'arm-circles': {
    id: 'arm-circles',
    title: 'Arm Circles',
    start: require('@/assets/exercises/jumping-jacks-start.webp'),
    peak: require('@/assets/exercises/jumping-jacks-peak.webp'),
    thumbnail: require('@/assets/exercises/jumping-jacks-peak.webp'),
  },
  'dynamic-chest': {
    id: 'dynamic-chest',
    title: 'Chest Stretch',
    start: require('@/assets/exercises/push-up-start.webp'),
    peak: require('@/assets/exercises/archer-push-ups-peak.webp'),
    thumbnail: require('@/assets/exercises/archer-push-ups-peak.webp'),
  },
  'chest-press-pulse': {
    id: 'chest-press-pulse',
    title: 'Chest Press',
    start: require('@/assets/exercises/push-up-start.webp'),
    peak: require('@/assets/exercises/close-grip-push-ups-peak.webp'),
    thumbnail: require('@/assets/exercises/close-grip-push-ups-peak.webp'),
  },
  'half-bending': {
    id: 'half-bending',
    title: 'Forward Stretch',
    start: require('@/assets/exercises/bodyweight-squat-start.webp'),
    peak: require('@/assets/exercises/bodyweight-squat-peak.webp'),
    thumbnail: require('@/assets/exercises/bodyweight-squat-peak.webp'),
  },
};

export function getExerciseAnimation(exerciseId: string): ExerciseAnimationAsset {
  const normalized = (exerciseId || '').toLowerCase().trim();
  let asset = EXERCISE_ANIMATIONS[normalized];

  if (!asset) {
    for (const [key, value] of Object.entries(EXERCISE_ANIMATIONS)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        asset = value;
        break;
      }
    }
  }

  const finalAsset = asset || EXERCISE_ANIMATIONS['jumping-jacks'];
  return {
    ...finalAsset,
    source: finalAsset.thumbnail,
  };
}
