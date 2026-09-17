import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';

// Web-safe storage: use localStorage on web, AsyncStorage on native
// This prevents the "Cannot use import.meta outside a module" crash on Vercel
const getStorage = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: (key: string) => {
        try { return Promise.resolve(localStorage.getItem(key)); } 
        catch { return Promise.resolve(null); }
      },
      setItem: (key: string, value: string) => {
        try { localStorage.setItem(key, value); } catch {}
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        try { localStorage.removeItem(key); } catch {}
        return Promise.resolve();
      },
    };
  }
  // Native: lazy-load AsyncStorage to avoid affecting web build
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return AsyncStorage;
};

export interface SetRecord {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface WorkoutProgress {
  [exerciseId: string]: SetRecord[]; // Array of sets for a specific exercise
}

interface ChallengeState {
  joinedChallengeId: string | null;
  bookmarkedChallenges: string[];
  completedDays: number[];
  currentDay: number;
  streak: number;
  currentWorkoutProgress: WorkoutProgress;
  
  // Actions
  joinChallenge: (challengeId: string) => void;
  toggleBookmark: (challengeId: string) => void;
  completeDay: (day: number) => void;
  startWorkout: (day: number) => void;
  saveSetProgress: (exerciseId: string, setIndex: number, record: SetRecord) => void;
  finishWorkout: (day: number) => void;
  resetProgress: () => void;
}

export const useChallengeStore = create<ChallengeState>()(
  persist(
    (set) => ({
      joinedChallengeId: null,
      bookmarkedChallenges: [],
      completedDays: [],
      currentDay: 1,
      streak: 0,
      currentWorkoutProgress: {},

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
      storage: createJSONStorage(() => getStorage()),
    }
  )
);
