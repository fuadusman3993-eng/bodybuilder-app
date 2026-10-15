export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  level: string;
  videoUrl: string;
  thumbnail: string;
  instructions: string[];
  equipment: string[];
  defaultSets: number;
  defaultReps: number;
  defaultRestSeconds: number;
}

export const EXERCISES: Record<string, Exercise> = {
  'bench-press': {
    id: 'bench-press',
    name: 'Bench Press',
    muscleGroup: 'Chest',
    level: 'Intermediate',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', // Demo video
    thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600',
    instructions: [
      'Lie flat on the bench.',
      'Grip the bar slightly wider than shoulder-width.',
      'Lower the bar slowly to your chest.',
      'Press the bar upward explosively.',
    ],
    equipment: ['Barbell', 'Bench'],
    defaultSets: 4,
    defaultReps: 10,
    defaultRestSeconds: 60,
  },
  'squat': {
    id: 'squat',
    name: 'Barbell Squat',
    muscleGroup: 'Legs',
    level: 'Intermediate',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', // Demo video
    thumbnail: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600',
    instructions: [
      'Place barbell across your upper back.',
      'Keep your chest up and core braced.',
      'Squat down until thighs are parallel to the floor.',
      'Drive through your heels to return to standing.',
    ],
    equipment: ['Barbell', 'Squat Rack'],
    defaultSets: 4,
    defaultReps: 10,
    defaultRestSeconds: 90,
  },
  'lat-pulldown': {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    muscleGroup: 'Back',
    level: 'Beginner',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600',
    instructions: [
      'Sit facing the machine, thighs secured.',
      'Grip the bar wide.',
      'Pull the bar down to your upper chest.',
      'Slowly release back to the top.',
    ],
    equipment: ['Cable Machine'],
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSeconds: 60,
  },
  'pushup': {
    id: 'pushup',
    name: 'Push Up',
    muscleGroup: 'Chest',
    level: 'Beginner',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600',
    instructions: [
      'Start in a high plank position.',
      'Lower your body until chest is near the floor.',
      'Push back up to starting position.',
      'Keep core tight throughout.',
    ],
    equipment: ['Bodyweight'],
    defaultSets: 3,
    defaultReps: 15,
    defaultRestSeconds: 45,
  },
};
