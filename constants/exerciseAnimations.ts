import { ImageSourcePropType } from 'react-native';
import type { AVPlaybackSource } from 'expo-av';

export interface ExerciseAnimationAsset {
  id: string;
  title: string;
  thumbnail: ImageSourcePropType;
  source: ImageSourcePropType;
  video?: AVPlaybackSource;
  isVideo: boolean;
}

export const EXERCISE_ANIMATIONS: Record<string, ExerciseAnimationAsset> = {
  // 1. Pec Deck Machine Fly (Chest)
  'pec-deck-fly': {
    id: 'pec-deck-fly',
    title: 'Pec Deck Fly',
    thumbnail: require('@/assets/exercises/0051_thumb.jpg'),
    source: require('@/assets/exercises/0051_thumb.jpg'),
    video: require('@/assets/videos/0051.mp4'),
    isVideo: true,
  },
  'pushup': {
    id: 'pushup',
    title: 'Pec Deck Fly',
    thumbnail: require('@/assets/exercises/0051_thumb.jpg'),
    source: require('@/assets/exercises/0051_thumb.jpg'),
    video: require('@/assets/videos/0051.mp4'),
    isVideo: true,
  },
  'push-ups': {
    id: 'push-ups',
    title: 'Pec Deck Fly',
    thumbnail: require('@/assets/exercises/0051_thumb.jpg'),
    source: require('@/assets/exercises/0051_thumb.jpg'),
    video: require('@/assets/videos/0051.mp4'),
    isVideo: true,
  },
  'wide-arm-pushups': {
    id: 'wide-arm-pushups',
    title: 'Pec Deck Fly',
    thumbnail: require('@/assets/exercises/0051_thumb.jpg'),
    source: require('@/assets/exercises/0051_thumb.jpg'),
    video: require('@/assets/videos/0051.mp4'),
    isVideo: true,
  },

  // 2. Svend Press (Chest / Core)
  'svend-press': {
    id: 'svend-press',
    title: 'Svend Press',
    thumbnail: require('@/assets/exercises/0052_thumb.jpg'),
    source: require('@/assets/exercises/0052_thumb.jpg'),
    video: require('@/assets/videos/0052.mp4'),
    isVideo: true,
  },
  'chest-press-pulse': {
    id: 'chest-press-pulse',
    title: 'Svend Press',
    thumbnail: require('@/assets/exercises/0052_thumb.jpg'),
    source: require('@/assets/exercises/0052_thumb.jpg'),
    video: require('@/assets/videos/0052.mp4'),
    isVideo: true,
  },

  // 3. Barbell Back Squat (Quads / Legs)
  'squat': {
    id: 'squat',
    title: 'Barbell Squat',
    thumbnail: require('@/assets/exercises/0054_thumb.jpg'),
    source: require('@/assets/exercises/0054_thumb.jpg'),
    video: require('@/assets/videos/0054.mp4'),
    isVideo: true,
  },
  'squats': {
    id: 'squats',
    title: 'Barbell Squat',
    thumbnail: require('@/assets/exercises/0054_thumb.jpg'),
    source: require('@/assets/exercises/0054_thumb.jpg'),
    video: require('@/assets/videos/0054.mp4'),
    isVideo: true,
  },
  'barbell-squat': {
    id: 'barbell-squat',
    title: 'Barbell Squat',
    thumbnail: require('@/assets/exercises/0054_thumb.jpg'),
    source: require('@/assets/exercises/0054_thumb.jpg'),
    video: require('@/assets/videos/0054.mp4'),
    isVideo: true,
  },

  // 4. Barbell Hip Thrust (Glutes)
  'hip-thrust': {
    id: 'hip-thrust',
    title: 'Barbell Hip Thrust',
    thumbnail: require('@/assets/exercises/0057_thumb.jpg'),
    source: require('@/assets/exercises/0057_thumb.jpg'),
    video: require('@/assets/videos/0057.mp4'),
    isVideo: true,
  },
  'butt-bridge': {
    id: 'butt-bridge',
    title: 'Hip Thrust Bridge',
    thumbnail: require('@/assets/exercises/0057_thumb.jpg'),
    source: require('@/assets/exercises/0057_thumb.jpg'),
    video: require('@/assets/videos/0057.mp4'),
    isVideo: true,
  },
  'glute-bridge': {
    id: 'glute-bridge',
    title: 'Hip Thrust Bridge',
    thumbnail: require('@/assets/exercises/0057_thumb.jpg'),
    source: require('@/assets/exercises/0057_thumb.jpg'),
    video: require('@/assets/videos/0057.mp4'),
    isVideo: true,
  },

  // 5. Barbell Reverse Lunges (Legs)
  'lunges': {
    id: 'lunges',
    title: 'Reverse Lunges',
    thumbnail: require('@/assets/exercises/0059_thumb.jpg'),
    source: require('@/assets/exercises/0059_thumb.jpg'),
    video: require('@/assets/videos/0059.mp4'),
    isVideo: true,
  },
  'reverse-lunges': {
    id: 'reverse-lunges',
    title: 'Reverse Lunges',
    thumbnail: require('@/assets/exercises/0059_thumb.jpg'),
    source: require('@/assets/exercises/0059_thumb.jpg'),
    video: require('@/assets/videos/0059.mp4'),
    isVideo: true,
  },

  // 6. Dumbbell Goblet Squat (Legs / Quads)
  'goblet-squat': {
    id: 'goblet-squat',
    title: 'Goblet Squat',
    thumbnail: require('@/assets/exercises/0064_thumb.jpg'),
    source: require('@/assets/exercises/0064_thumb.jpg'),
    video: require('@/assets/videos/0064.mp4'),
    isVideo: true,
  },

  // 7. Dumbbell Jump Squat (Legs / Cardio / Calorie Burn)
  'jump-squat': {
    id: 'jump-squat',
    title: 'Dumbbell Jump Squat',
    thumbnail: require('@/assets/exercises/0066_thumb.jpg'),
    source: require('@/assets/exercises/0066_thumb.jpg'),
    video: require('@/assets/videos/0066.mp4'),
    isVideo: true,
  },
  'jumping-jacks': {
    id: 'jumping-jacks',
    title: 'Jump Squat Power',
    thumbnail: require('@/assets/exercises/0066_thumb.jpg'),
    source: require('@/assets/exercises/0066_thumb.jpg'),
    video: require('@/assets/videos/0066.mp4'),
    isVideo: true,
  },

  // 8. Kettlebell Swing (Hamstrings / Cardio / Core)
  'kettlebell-swing': {
    id: 'kettlebell-swing',
    title: 'Kettlebell Swing',
    thumbnail: require('@/assets/exercises/0072_thumb.jpg'),
    source: require('@/assets/exercises/0072_thumb.jpg'),
    video: require('@/assets/videos/0072.mp4'),
    isVideo: true,
  },
  'mountain-climbers': {
    id: 'mountain-climbers',
    title: 'Kettlebell Swing',
    thumbnail: require('@/assets/exercises/0072_thumb.jpg'),
    source: require('@/assets/exercises/0072_thumb.jpg'),
    video: require('@/assets/videos/0072.mp4'),
    isVideo: true,
  },

  // 9. Triceps Pushdown (Arms)
  'triceps-pushdown': {
    id: 'triceps-pushdown',
    title: 'Triceps Pushdown',
    thumbnail: require('@/assets/exercises/0085_thumb.jpg'),
    source: require('@/assets/exercises/0085_thumb.jpg'),
    video: require('@/assets/videos/0085.mp4'),
    isVideo: true,
  },
  'bench-dips': {
    id: 'bench-dips',
    title: 'Triceps Pushdown',
    thumbnail: require('@/assets/exercises/0085_thumb.jpg'),
    source: require('@/assets/exercises/0085_thumb.jpg'),
    video: require('@/assets/videos/0085.mp4'),
    isVideo: true,
  },

  // 10. Arnold Press Dumbbell (Shoulders)
  'arnold-press': {
    id: 'arnold-press',
    title: 'Arnold Press',
    thumbnail: require('@/assets/exercises/0087_thumb.jpg'),
    source: require('@/assets/exercises/0087_thumb.jpg'),
    video: require('@/assets/videos/0087.mp4'),
    isVideo: true,
  },
  'russian-twists': {
    id: 'russian-twists',
    title: 'Arnold Press',
    thumbnail: require('@/assets/exercises/0087_thumb.jpg'),
    source: require('@/assets/exercises/0087_thumb.jpg'),
    video: require('@/assets/videos/0087.mp4'),
    isVideo: true,
  },

  // 11. Dumbbell Overhead Press (Shoulders)
  'overhead-press': {
    id: 'overhead-press',
    title: 'Overhead Press',
    thumbnail: require('@/assets/exercises/0090_thumb.jpg'),
    source: require('@/assets/exercises/0090_thumb.jpg'),
    video: require('@/assets/videos/0090.mp4'),
    isVideo: true,
  },
  'plank': {
    id: 'plank',
    title: 'Overhead Press',
    thumbnail: require('@/assets/exercises/0090_thumb.jpg'),
    source: require('@/assets/exercises/0090_thumb.jpg'),
    video: require('@/assets/videos/0090.mp4'),
    isVideo: true,
  },

  // 12. Lateral Raises Dumbbell (Shoulders / Arms)
  'lateral-raises': {
    id: 'lateral-raises',
    title: 'Lateral Raises',
    thumbnail: require('@/assets/exercises/0096_thumb.jpg'),
    source: require('@/assets/exercises/0096_thumb.jpg'),
    video: require('@/assets/videos/0096.mp4'),
    isVideo: true,
  },
  'cobra-stretch': {
    id: 'cobra-stretch',
    title: 'Lateral Raises',
    thumbnail: require('@/assets/exercises/0096_thumb.jpg'),
    source: require('@/assets/exercises/0096_thumb.jpg'),
    video: require('@/assets/videos/0096.mp4'),
    isVideo: true,
  },
  'standing-bicycle-crunches': {
    id: 'standing-bicycle-crunches',
    title: 'Lateral Raises',
    thumbnail: require('@/assets/exercises/0096_thumb.jpg'),
    source: require('@/assets/exercises/0096_thumb.jpg'),
    video: require('@/assets/videos/0096.mp4'),
    isVideo: true,
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

  return asset || EXERCISE_ANIMATIONS['pec-deck-fly'];
}
