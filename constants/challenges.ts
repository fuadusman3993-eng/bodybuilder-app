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
  'lose-belly-fat': {
    id: 'lose-belly-fat',
    title: 'Lose Belly Fat',
    level: 'Beginner',
    description: '30-day targeted belly fat burn and core sculpting plan.',
    totalDays: 30,
    heroImage: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80',
    days: generate30Days('lose-belly-fat', 'Lose Belly Fat'),
  },
  'build-muscle': {
    id: 'build-muscle',
    title: 'Build Muscle',
    level: 'Intermediate',
    description: '30-day progressive overload hypertrophy and strength plan.',
    totalDays: 30,
    heroImage: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80',
    days: generate30Days('build-muscle', 'Build Muscle'),
  },
};

// Backward-compatibility alias
CHALLENGES['14-day-muscle'] = CHALLENGES['build-muscle'];
