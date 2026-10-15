import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// Metro automatically resolves ./storage.web.ts on web builds (no AsyncStorage imported)
// and ./storage.ts on native builds (uses AsyncStorage)
import storage from './storage';

export interface SetRecord {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface WorkoutProgress {
  [exerciseId: string]: SetRecord[]; // Array of sets for a specific exercise
}

interface ChallengeState {
  activeGoal: string;
  level: string;
  joinedChallengeId: string | null;
  bookmarkedChallenges: string[];
  completedDays: number[];
  currentDay: number;
  streak: number;
  currentWorkoutProgress: WorkoutProgress;
  
  // Actions
  setGoal: (goal: string) => void;
  setLevel: (level: string) => void;
  joinChallenge: (challengeId: string) => void;
  toggleBookmark: (challengeId: string) => void;
  completeDay: (day: number) => void;
  toggleDayCompleted: (day: number) => void;
  startWorkout: (day: number) => void;
  saveSetProgress: (exerciseId: string, setIndex: number, record: SetRecord) => void;
  finishWorkout: (day: number) => void;
  resetProgress: () => void;
}

export const useChallengeStore = create<ChallengeState>()(
  persist(
    (set) => ({
      activeGoal: 'lose-belly-fat',
      level: 'Beginner',
      joinedChallengeId: 'lose-belly-fat',
      bookmarkedChallenges: [],
      completedDays: [1], // Day 1 finished by default as in user's Image 1!
      currentDay: 2,      // Day 2 ready with START button as in Image 1!
      streak: 1,
      currentWorkoutProgress: {},

      setGoal: (goal) => set({ activeGoal: goal, joinedChallengeId: goal }),
      setLevel: (level) => set({ level }),

      joinChallenge: (id) => set({ joinedChallengeId: id }),
      
      toggleBookmark: (id) => set((state) => ({
        bookmarkedChallenges: state.bookmarkedChallenges.includes(id)
          ? state.bookmarkedChallenges.filter(c => c !== id)
          : [...state.bookmarkedChallenges, id]
      })),
      
      completeDay: (day) => set((state) => {
        const newlyCompleted = !state.completedDays.includes(day);
        const newCompletedDays = newlyCompleted
          ? [...state.completedDays, day]
          : state.completedDays;
        
        return {
          completedDays: newCompletedDays,
          currentDay: newlyCompleted ? day + 1 : state.currentDay,
          streak: newlyCompleted ? state.streak + 1 : state.streak,
          currentWorkoutProgress: {} // clear active workout
        };
      }),

      toggleDayCompleted: (day) => set((state) => {
        const isDone = state.completedDays.includes(day);
        const updated = isDone
          ? state.completedDays.filter(d => d !== day)
          : [...state.completedDays, day].sort((a, b) => a - b);
        return {
          completedDays: updated,
          streak: updated.length
        };
      }),
      
      startWorkout: (day) => set({ currentWorkoutProgress: {} }),

      saveSetProgress: (exerciseId, setIndex, record) => set((state) => {
        const exerciseProgress = state.currentWorkoutProgress[exerciseId] || [];
        const newExerciseProgress = [...exerciseProgress];
        newExerciseProgress[setIndex] = record;
        
        return {
          currentWorkoutProgress: {
            ...state.currentWorkoutProgress,
            [exerciseId]: newExerciseProgress
          }
        };
      }),

      finishWorkout: (day) => set((state) => {
        // Workout finished, but we might want to wait for "Complete Day" button click
        return { }; 
      }),

      resetProgress: () => set({ 
        joinedChallengeId: null, 
        completedDays: [], 
        currentDay: 1, 
        streak: 0,
        currentWorkoutProgress: {}
      }),
    }),
    {
      name: 'bodybuilder-challenge-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);
