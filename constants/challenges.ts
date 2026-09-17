export interface ChallengeDay {
  day: number;
  workoutId: string | null; // null means rest day
  title: string;
  isPremium: boolean;
  image: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  days: ChallengeDay[];
}

export const CHALLENGES: Record<string, Challenge> = {
  '14-day-muscle': {
    id: '14-day-muscle',
    title: '14 Days Challenge',
    description: 'Build Muscle in 14 Days',
    days: [
      { day: 1, title: 'Full Body Fundamentals', workoutId: 'wk-1-full', isPremium: false, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=400' },
      { day: 2, title: 'Upper Body Power', workoutId: 'wk-1-upper', isPremium: true, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=400&auto=format&fit=crop' },
      { day: 3, title: 'Lower Body Strength', workoutId: 'wk-1-full', isPremium: true, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=400&auto=format&fit=crop' },
      { day: 4, title: 'Active Recovery', workoutId: null, isPremium: true, image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400&auto=format&fit=crop' },
      { day: 5, title: 'Upper Body Power', workoutId: 'wk-1-upper', isPremium: true, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=400&auto=format&fit=crop' },
      { day: 6, title: 'Lower Body Strength', workoutId: 'wk-1-full', isPremium: true, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=400&auto=format&fit=crop' },
      { day: 7, title: 'Rest Day', workoutId: null, isPremium: true, image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400&auto=format&fit=crop' },
    ]
  }
};
