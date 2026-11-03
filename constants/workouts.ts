export interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  reps: number | string;
  durationSeconds?: number;
  restSeconds: number;
}

export interface Workout {
  id: string;
  title: string;
  duration: string;
  estimatedCalories: number;
  exercises: WorkoutExercise[];
}

export const WORKOUTS: Record<string, Workout> = {
  // ─── BELLY FAT & ABS (Existing) ───
  'wk-belly-1': {
    id: 'wk-belly-1',
    title: 'Lose Belly Fat - Day 1',
    duration: '12 min',
    estimatedCalories: 180,
    exercises: [
      { exerciseId: 'jump-squat', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 15 },
      { exerciseId: 'kettlebell-swing', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'barbell-squat', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'goblet-squat', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'reverse-lunges', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'hip-thrust', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'pec-deck-fly', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'svend-press', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'overhead-press', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'arnold-press', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'lateral-raises', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'triceps-pushdown', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 0 },
    ],
  },
  'wk-belly-2': {
    id: 'wk-belly-2',
    title: 'Belly Fat Core Burn - Day 2',
    duration: '10 min',
    estimatedCalories: 160,
    exercises: [
      { exerciseId: 'jump-squat', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 15 },
      { exerciseId: 'barbell-squat', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 25 },
      { exerciseId: 'kettlebell-swing', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'goblet-squat', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'reverse-lunges', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 25 },
      { exerciseId: 'hip-thrust', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'jump-squat', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 15 },
      { exerciseId: 'kettlebell-swing', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 0 },
    ],
  },
  'wk-belly-3': {
    id: 'wk-belly-3',
    title: 'High Burn Core Sculpt - Day 3',
    duration: '10 min',
    estimatedCalories: 150,
    exercises: [
      { exerciseId: 'jump-squat', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 15 },
      { exerciseId: 'pec-deck-fly', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'svend-press', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'overhead-press', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'arnold-press', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'lateral-raises', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'triceps-pushdown', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'kettlebell-swing', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 0 },
    ],
  },

  // ─── ARM WORKOUT ("ena arm yelena" Resolved) ───
  'wk-arm-1': {
    id: 'wk-arm-1',
    title: 'Bigger Arms Sculpt - Day 1',
    duration: '14 min',
    estimatedCalories: 190,
    exercises: [
      { exerciseId: 'standing-dumbbell-bicep-curl', sets: 3, reps: 12, durationSeconds: 40, restSeconds: 20 },
      { exerciseId: 'triceps-rope-pushdown', sets: 3, reps: 15, durationSeconds: 35, restSeconds: 20 },
      { exerciseId: 'bodyweight-pushups', sets: 3, reps: 12, durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'triceps-pushdown', sets: 3, reps: 12, durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'lateral-raises', sets: 3, reps: 15, durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'arm-circles', sets: 2, reps: '00:40', durationSeconds: 40, restSeconds: 0 },
    ],
  },
  'wk-arm-2': {
    id: 'wk-arm-2',
    title: 'Toned Biceps & Triceps - Day 2',
    duration: '16 min',
    estimatedCalories: 210,
    exercises: [
      { exerciseId: 'standing-dumbbell-bicep-curl', sets: 3, reps: 14, durationSeconds: 40, restSeconds: 20 },
      { exerciseId: 'triceps-rope-pushdown', sets: 3, reps: 15, durationSeconds: 35, restSeconds: 20 },
      { exerciseId: 'svend-press', sets: 3, reps: 15, durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'bodyweight-pushups', sets: 3, reps: 15, durationSeconds: 35, restSeconds: 20 },
      { exerciseId: 'triceps-pushdown', sets: 3, reps: 14, durationSeconds: 30, restSeconds: 0 },
    ],
  },
  'wk-arm-3': {
    id: 'wk-arm-3',
    title: 'Arm Hypertrophy & Density - Day 3',
    duration: '18 min',
    estimatedCalories: 230,
    exercises: [
      { exerciseId: 'standing-dumbbell-bicep-curl', sets: 4, reps: 12, durationSeconds: 45, restSeconds: 25 },
      { exerciseId: 'triceps-rope-pushdown', sets: 4, reps: 15, durationSeconds: 40, restSeconds: 25 },
      { exerciseId: 'bodyweight-pushups', sets: 3, reps: 16, durationSeconds: 35, restSeconds: 20 },
      { exerciseId: 'lateral-raises', sets: 3, reps: 15, durationSeconds: 35, restSeconds: 20 },
      { exerciseId: 'arm-circles', sets: 2, reps: '00:45', durationSeconds: 45, restSeconds: 0 },
    ],
  },

  // ─── CHEST WORKOUT ───
  'wk-chest-1': {
    id: 'wk-chest-1',
    title: 'Chest Expansion - Day 1',
    duration: '15 min',
    estimatedCalories: 200,
    exercises: [
      { exerciseId: 'barbell-bench-press', sets: 3, reps: 10, durationSeconds: 45, restSeconds: 30 },
      { exerciseId: 'incline-dumbbell-press', sets: 3, reps: 12, durationSeconds: 40, restSeconds: 25 },
      { exerciseId: 'cable-chest-flyes', sets: 3, reps: 15, durationSeconds: 35, restSeconds: 20 },
      { exerciseId: 'pec-deck-fly', sets: 3, reps: 12, durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'bodyweight-pushups', sets: 2, reps: 15, durationSeconds: 30, restSeconds: 0 },
    ],
  },

  // ─── LEGS & GLUTES WORKOUT ───
  'wk-legs-1': {
    id: 'wk-legs-1',
    title: 'Legs & Lower Body Shred - Day 1',
    duration: '18 min',
    estimatedCalories: 240,
    exercises: [
      { exerciseId: 'barbell-back-squat', sets: 3, reps: 10, durationSeconds: 50, restSeconds: 30 },
      { exerciseId: 'dumbbell-lunges', sets: 3, reps: 14, durationSeconds: 45, restSeconds: 25 },
      { exerciseId: 'jump-squat', sets: 3, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'goblet-squat', sets: 3, reps: 12, durationSeconds: 35, restSeconds: 20 },
      { exerciseId: 'hip-thrust', sets: 3, reps: 12, durationSeconds: 35, restSeconds: 0 },
    ],
  },

  // ─── SHOULDER & BACK WORKOUT ───
  'wk-shoulder-1': {
    id: 'wk-shoulder-1',
    title: 'V-Taper Shoulders & Back - Day 1',
    duration: '16 min',
    estimatedCalories: 220,
    exercises: [
      { exerciseId: 'overhead-dumbbell-press', sets: 3, reps: 10, durationSeconds: 40, restSeconds: 25 },
      { exerciseId: 'lat-pulldown', sets: 3, reps: 12, durationSeconds: 40, restSeconds: 25 },
      { exerciseId: 'seated-cable-row', sets: 3, reps: 12, durationSeconds: 40, restSeconds: 25 },
      { exerciseId: 'arnold-press', sets: 3, reps: 12, durationSeconds: 35, restSeconds: 20 },
      { exerciseId: 'lateral-raises', sets: 3, reps: 15, durationSeconds: 30, restSeconds: 0 },
    ],
  },

  // ─── FULL BODY ATHLETIC ───
  'wk-fullbody-1': {
    id: 'wk-fullbody-1',
    title: 'Full Body Athletic Torch - Day 1',
    duration: '20 min',
    estimatedCalories: 260,
    exercises: [
      { exerciseId: 'jump-squat', sets: 2, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'bodyweight-pushups', sets: 3, reps: 15, durationSeconds: 35, restSeconds: 20 },
      { exerciseId: 'kettlebell-swing', sets: 2, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'home-plank-hold', sets: 2, reps: '00:45', durationSeconds: 45, restSeconds: 20 },
      { exerciseId: 'standing-dumbbell-bicep-curl', sets: 2, reps: 12, durationSeconds: 35, restSeconds: 20 },
      { exerciseId: 'lateral-raises', sets: 2, reps: 12, durationSeconds: 30, restSeconds: 0 },
    ],
  },

  // ─── MUSCLE HYPERTROPHY (Existing) ───
  'wk-muscle-upper': {
    id: 'wk-muscle-upper',
    title: 'Upper Body Power',
    duration: '35 min',
    estimatedCalories: 280,
    exercises: [
      { exerciseId: 'pec-deck-fly', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 30 },
      { exerciseId: 'svend-press', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 30 },
      { exerciseId: 'overhead-press', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 30 },
      { exerciseId: 'arnold-press', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 30 },
      { exerciseId: 'lateral-raises', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 30 },
      { exerciseId: 'triceps-pushdown', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 0 },
    ],
  },
  'wk-muscle-lower': {
    id: 'wk-muscle-lower',
    title: 'Lower Body Strength',
    duration: '35 min',
    estimatedCalories: 310,
    exercises: [
      { exerciseId: 'jump-squat', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 30 },
      { exerciseId: 'barbell-squat', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 30 },
      { exerciseId: 'goblet-squat', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 30 },
      { exerciseId: 'reverse-lunges', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 30 },
      { exerciseId: 'hip-thrust', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 30 },
      { exerciseId: 'kettlebell-swing', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 0 },
    ],
  },
};

// Helper function to resolve any day number to a workout
export function getWorkoutForDay(goal: string, day: number): Workout | null {
  // Every 4th day is a Rest Day (e.g. Day 4, Day 8, Day 12, Day 16, Day 20, Day 24, Day 28)
  if (day % 4 === 0) {
    return null; // Rest Day!
  }

  // 1. ARM WORKOUT
  if (goal === 'arm-workout') {
    const cycle = day % 3;
    if (cycle === 1) return WORKOUTS['wk-arm-1'];
    if (cycle === 2) return WORKOUTS['wk-arm-2'];
    return WORKOUTS['wk-arm-3'];
  }

  // 2. CHEST WORKOUT
  if (goal === 'chest-workout') {
    return WORKOUTS['wk-chest-1'];
  }

  // 3. LEGS WORKOUT
  if (goal === 'legs-workout') {
    return WORKOUTS['wk-legs-1'];
  }

  // 4. SHOULDER & BACK
  if (goal === 'shoulder-back') {
    return WORKOUTS['wk-shoulder-1'];
  }

  // 5. FULL BODY
  if (goal === 'full-body') {
    return WORKOUTS['wk-fullbody-1'];
  }

  // 6. BUILD MUSCLE
  if (goal === 'build-muscle') {
    return day % 2 === 1 ? WORKOUTS['wk-muscle-upper'] : WORKOUTS['wk-muscle-lower'];
  }

  // 7. DEFAULT: LOSE BELLY FAT
  const cycleIndex = day % 3;
  if (cycleIndex === 1) return WORKOUTS['wk-belly-1'];
  if (cycleIndex === 2) return WORKOUTS['wk-belly-2'];
  return WORKOUTS['wk-belly-3'];
}
