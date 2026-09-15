export const stories = [
  { id: '1', name: 'Your story', image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150', isOwn: true },
  { id: '2', name: 'Getachew', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', isOwn: false },
  { id: '3', name: 'FitLife', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=150', isOwn: false },
  { id: '4', name: 'Selam', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', isOwn: false },
  { id: '5', name: 'Abel', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', isOwn: false },
  { id: '6', name: 'Miki', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', isOwn: false },
];

export const quickActions = [
  { id: '1', title: 'My Workout', subtitle: "Today's plan", icon: 'fitness', color: '#3B82F6', route: '/workout' },
  { id: '2', title: 'Nutrition', subtitle: 'Meal plan', icon: 'nutrition', color: '#10B981', route: '/nutrition' },
  { id: '3', title: 'Progress', subtitle: 'Track results', icon: 'trending-up', color: '#8B5CF6', route: '/progress' },
  { id: '4', title: 'AI Assistant', subtitle: 'Ask anything', icon: 'sparkles', color: '#F59E0B', route: '/ai' },
  { id: '5', title: 'Chat with Coach', subtitle: 'Get advice', icon: 'chatbubble-ellipses', color: '#EF4444', route: '/chat' },
  { id: '6', title: 'Video Call', subtitle: '1-on-1 session', icon: 'videocam', color: '#EC4899', route: '/video' },
  { id: '7', title: 'Challenges', subtitle: 'Earn rewards', icon: 'trophy', color: '#F97316', route: '/challenges' },
  { id: '8', title: 'Find a Gym', subtitle: 'Near you', icon: 'location', color: '#06B6D4', route: '/gym' },
];

export const communityPosts = [
  {
    id: '1',
    user: {
      name: 'AbelFit',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      location: 'Addis Ababa',
    },
    timeAgo: '2h ago',
    content: 'Finally hit 80kg! 💪\nConsistency is everything. Keep going brothers! 🔥',
    images: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600',
    ],
    imageCount: 3,
    currentImage: 1,
    likes: 342,
    comments: 48,
    isLiked: true,
  },
  {
    id: '2',
    user: {
      name: 'Selam',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      location: 'Addis Ababa',
    },
    timeAgo: '3h ago',
    content: 'Meal prep for the week! 🥗\nHealthy food = better energy 💪',
    images: [
      'https://images.unsplash.com/photo-1547592180-85f173990554?w=600',
    ],
    imageCount: 1,
    currentImage: 1,
    likes: 218,
    comments: 36,
    isLiked: false,
  },
];

export const chatList = [
  { id: '1', name: 'Coach Daniel', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', lastMessage: '🎥 Video call ended · 45 min', time: '8:34 PM', unread: 2, isCoach: true, isVerified: true },
  { id: '2', name: 'AI Fitness Assistant', avatar: null, lastMessage: "Here's your updated meal plan for the...", time: '7:12 PM', unread: 1, isAI: true },
  { id: '3', name: 'FitLife Community', avatar: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=150', lastMessage: 'Selam: በኦሎም ጥሩ ሰራ ሰሪ ነህ!', time: '6:45 PM', unread: 12, isGroup: true },
  { id: '4', name: 'Coach Meron', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', lastMessage: 'Great form on your squat! Keep it up 💪', time: '5:20 PM', unread: 1, isCoach: true, isVerified: true },
  { id: '5', name: 'Tsegaye', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', lastMessage: 'Sent a photo', time: '4:12 PM', unread: 0 },
  { id: '6', name: 'Miki', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', lastMessage: "Don't forget your meal plan today! 🍉", time: '3:45 PM', unread: 0 },
  { id: '7', name: 'Gym Fitness Center', avatar: null, lastMessage: 'New classes available this week!', time: '1:20 PM', unread: 1, isGym: true },
  { id: '8', name: 'Natnael', avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150', lastMessage: "I'm in. Let's do it! 💪", time: '11:03 AM', unread: 0 },
];

export const workoutData = {
  weekDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  weekDates: [12, 13, 14, 15, 16, 17, 18],
  activeDay: 3,
  todayWorkout: {
    title: 'Upper Body',
    duration: '45 min',
    location: 'Gym',
    exercises: [
      { id: '1', name: 'Bench Press', sets: 4, reps: 8 },
      { id: '2', name: 'Incline Dumbbell Press', sets: 3, reps: 10 },
      { id: '3', name: 'Lat Pulldown', sets: 3, reps: 12 },
      { id: '4', name: 'Shoulder Press', sets: 3, reps: 10 },
      { id: '5', name: 'Triceps Pushdown', sets: 3, reps: 12 },
    ],
  },
  weeklyRoutine: {
    title: 'Weekly Routine',
    days: '5 days',
    split: 'Split',
  },
};

export const gymData = [
  { id: '1', name: 'FitZone Gym', rating: 4.8, reviews: 234, distance: '3.0 km', isOpen: true, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400' },
  { id: '2', name: 'PowerHouse Fitness', rating: 4.6, reviews: 189, distance: '4.2 km', isOpen: true, image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400' },
];

export const profileData = {
  name: 'Fuad',
  title: 'Fitness Enthusiast',
  avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300',
  stats: {
    workouts: 12,
    weeksStreak: 8,
    followers: '2.4k',
  },
  bio: 'Stronger every day 💪\nFitness • Discipline • Big Dreams',
  gridImages: [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300',
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=300',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300',
    'https://images.unsplash.com/photo-1526506190301-3829280b1e36?w=300',
  ]
};
