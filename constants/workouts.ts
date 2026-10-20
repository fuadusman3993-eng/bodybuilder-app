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
  // Day 1 - Full Body Athletic Workout (12 Exercises, 30s each, 12 min, 180 kcal)
  'wk-belly-1': {
    id: 'wk-belly-1',
    title: 'Full Body Athletic - Day 1',
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

  // Day 2 - Lower Body & Explosive Power (8 Exercises, 30s each, 10 min, 160 kcal)
  'wk-belly-2': {
    id: 'wk-belly-2',
    title: 'Lower Body & Power - Day 2',
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

  // Day 3 - Upper Body & Delts Sculpt (8 Exercises, 30s each, 10 min, 150 kcal)
  'wk-belly-3': {
    id: 'wk-belly-3',
    title: 'Upper Body Sculpt - Day 3',
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

  // Gym / Muscle Building - Upper Body
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

  // Gym / Muscle Building - Lower Body
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

  if (goal === 'build-muscle') {
    return day % 2 === 1 ? WORKOUTS['wk-muscle-upper'] : WORKOUTS['wk-muscle-lower'];
  }

  // Default: Lose Belly Fat (cycle through belly-1, belly-2, belly-3)
  const cycleIndex = (day % 3);
  if (cycleIndex === 1) return WORKOUTS['wk-belly-1'];
  if (cycleIndex === 2) return WORKOUTS['wk-belly-2'];
  return WORKOUTS['wk-belly-3'];
}
