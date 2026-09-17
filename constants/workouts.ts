import { EXERCISES } from './exercises';

export interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  reps: number | string;
  restSeconds: number;
}

export interface Workout {
  id: string;
  title: string;
  duration: string;
  exercises: WorkoutExercise[];
  estimatedCalories: number;
}

export const WORKOUTS: Record<string, Workout> = {
  'wk-1-full': {
    id: 'wk-1-full',
    title: 'Full Body Fundamentals',
    duration: '45 min',
    estimatedCalories: 320,
    exercises: [
      { exerciseId: 'bench-press', sets: 4, reps: 10, restSeconds: 60 },
      { exerciseId: 'squat', sets: 4, reps: 10, restSeconds: 90 },
      { exerciseId: 'lat-pulldown', sets: 3, reps: 12, restSeconds: 60 },
    ]
  },
  'wk-1-upper': {
    id: 'wk-1-upper',
    title: 'Upper Body Power',
    duration: '40 min',
    estimatedCalories: 280,
    exercises: [
      { exerciseId: 'bench-press', sets: 4, reps: 8, restSeconds: 90 },
      { exerciseId: 'pushup', sets: 3, reps: 15, restSeconds: 45 },
      { exerciseId: 'lat-pulldown', sets: 4, reps: 10, restSeconds: 60 },
    ]
  }
};
