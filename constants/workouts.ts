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
  // Day 1 - Lose Belly Fat (15 Exercises, 11 min, 159.3 kcal) - Matches Image 2!
  'wk-belly-1': {
    id: 'wk-belly-1',
    title: 'Lose Belly Fat - Day 1',
    duration: '11 min',
    estimatedCalories: 159,
    exercises: [
      { exerciseId: 'high-stepping', sets: 1, reps: '00:20', durationSeconds: 20, restSeconds: 15 },
      { exerciseId: 'jumping-jacks', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 15 },
      { exerciseId: 'standing-bicycle-crunches', sets: 1, reps: 20, restSeconds: 20 },
      { exerciseId: 'mountain-climbers', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'pushup', sets: 1, reps: 15, restSeconds: 25 },
      { exerciseId: 'plank', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'butt-bridge', sets: 1, reps: 15, restSeconds: 20 },
      { exerciseId: 'russian-twists', sets: 1, reps: 20, restSeconds: 25 },
      { exerciseId: 'squat', sets: 1, reps: 15, restSeconds: 25 },
      { exerciseId: 'high-stepping', sets: 1, reps: '00:20', durationSeconds: 20, restSeconds: 15 },
      { exerciseId: 'jumping-jacks', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 15 },
      { exerciseId: 'standing-bicycle-crunches', sets: 1, reps: 20, restSeconds: 20 },
      { exerciseId: 'mountain-climbers', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'plank', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'cobra-stretch', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 0 },
    ],
  },

  // Day 2 - Lose Belly Fat (15 Exercises, 12 min, 168 kcal)
  'wk-belly-2': {
    id: 'wk-belly-2',
    title: 'Lose Belly Fat - Day 2',
    duration: '12 min',
    estimatedCalories: 168,
    exercises: [
      { exerciseId: 'jumping-jacks', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 15 },
      { exerciseId: 'high-stepping', sets: 1, reps: '00:25', durationSeconds: 25, restSeconds: 15 },
      { exerciseId: 'mountain-climbers', sets: 1, reps: '00:35', durationSeconds: 35, restSeconds: 20 },
      { exerciseId: 'standing-bicycle-crunches', sets: 1, reps: 22, restSeconds: 20 },
      { exerciseId: 'pushup', sets: 1, reps: 15, restSeconds: 25 },
      { exerciseId: 'plank', sets: 1, reps: '00:35', durationSeconds: 35, restSeconds: 20 },
      { exerciseId: 'butt-bridge', sets: 1, reps: 18, restSeconds: 20 },
      { exerciseId: 'lunges', sets: 1, reps: 16, restSeconds: 25 },
      { exerciseId: 'russian-twists', sets: 1, reps: 22, restSeconds: 25 },
      { exerciseId: 'squat', sets: 1, reps: 18, restSeconds: 25 },
      { exerciseId: 'high-stepping', sets: 1, reps: '00:25', durationSeconds: 25, restSeconds: 15 },
      { exerciseId: 'mountain-climbers', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'pushup', sets: 1, reps: 15, restSeconds: 25 },
      { exerciseId: 'plank', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'cobra-stretch', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 0 },
    ],
  },

  // Day 3 - Core Shred (15 Exercises, 12 min, 172 kcal)
  'wk-belly-3': {
    id: 'wk-belly-3',
    title: 'Core Shred - Day 3',
    duration: '12 min',
    estimatedCalories: 172,
    exercises: [
      { exerciseId: 'high-stepping', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 15 },
      { exerciseId: 'standing-bicycle-crunches', sets: 1, reps: 25, restSeconds: 20 },
      { exerciseId: 'mountain-climbers', sets: 1, reps: '00:35', durationSeconds: 35, restSeconds: 20 },
      { exerciseId: 'russian-twists', sets: 1, reps: 25, restSeconds: 20 },
      { exerciseId: 'plank', sets: 1, reps: '00:40', durationSeconds: 40, restSeconds: 25 },
      { exerciseId: 'butt-bridge', sets: 1, reps: 20, restSeconds: 20 },
      { exerciseId: 'jumping-jacks', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 15 },
      { exerciseId: 'pushup', sets: 1, reps: 16, restSeconds: 25 },
      { exerciseId: 'squat', sets: 1, reps: 20, restSeconds: 25 },
      { exerciseId: 'standing-bicycle-crunches', sets: 1, reps: 20, restSeconds: 20 },
      { exerciseId: 'mountain-climbers', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'russian-twists', sets: 1, reps: 20, restSeconds: 20 },
      { exerciseId: 'pushup', sets: 1, reps: 12, restSeconds: 20 },
      { exerciseId: 'plank', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 20 },
      { exerciseId: 'cobra-stretch', sets: 1, reps: '00:30', durationSeconds: 30, restSeconds: 0 },
    ],
  },

  // Gym / Muscle Building - Upper Body
  'wk-muscle-upper': {
    id: 'wk-muscle-upper',
    title: 'Upper Body Power',
    duration: '40 min',
    estimatedCalories: 290,
    exercises: [
      { exerciseId: 'bench-press', sets: 4, reps: 10, restSeconds: 75 },
      { exerciseId: 'pushup', sets: 3, reps: 15, restSeconds: 45 },
      { exerciseId: 'lat-pulldown', sets: 4, reps: 12, restSeconds: 60 },
      { exerciseId: 'plank', sets: 3, reps: '00:45', durationSeconds: 45, restSeconds: 45 },
    ],
  },

  // Gym / Muscle Building - Lower Body
  'wk-muscle-lower': {
    id: 'wk-muscle-lower',
    title: 'Lower Body Strength',
    duration: '42 min',
    estimatedCalories: 330,
    exercises: [
      { exerciseId: 'squat', sets: 4, reps: 12, restSeconds: 90 },
      { exerciseId: 'lunges', sets: 3, reps: 16, restSeconds: 60 },
      { exerciseId: 'butt-bridge', sets: 4, reps: 15, restSeconds: 45 },
      { exerciseId: 'plank', sets: 3, reps: '00:45', durationSeconds: 45, restSeconds: 45 },
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
