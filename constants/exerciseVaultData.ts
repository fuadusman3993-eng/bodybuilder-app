export interface VaultExercise {
  id: string;
  name: string;
  category: 'gym' | 'home';
  gender: 'male' | 'female' | 'unisex';
  bodyPart: 'Abs' | 'Arms' | 'Back' | 'Chest' | 'Cardio' | 'Legs' | 'Shoulders' | 'Bodyweight' | 'Yoga' | 'Mobility' | 'Office' | 'Face';
  equipment: string[];
  animationUrl: string;
  defaultReps?: number;
  defaultDurationSeconds?: number;
  instructions: string[];
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  targetMuscle: string;
}

export interface BodyPartCategory {
  id: string;
  name: 'Abs' | 'Arms' | 'Back' | 'Chest' | 'Cardio' | 'Legs' | 'Shoulders' | 'Bodyweight';
  icon: string;
  maleCount: number;
  femaleCount: number;
  totalCount: number;
  color: string;
}

export const GYM_BODY_PARTS: BodyPartCategory[] = [
  { id: 'abs', name: 'Abs', icon: 'radio-button-on', maleCount: 71, femaleCount: 45, totalCount: 116, color: '#EF4444' },
  { id: 'arms', name: 'Arms', icon: 'flash', maleCount: 90, femaleCount: 38, totalCount: 128, color: '#F59E0B' },
  { id: 'back', name: 'Back', icon: 'thunderstorm', maleCount: 61, femaleCount: 32, totalCount: 93, color: '#3B82F6' },
  { id: 'chest', name: 'Chest', icon: 'shield', maleCount: 51, femaleCount: 24, totalCount: 75, color: '#06B6D4' },
  { id: 'cardio', name: 'Cardio', icon: 'heart', maleCount: 61, femaleCount: 52, totalCount: 113, color: '#EC4899' },
  { id: 'legs', name: 'Legs', icon: 'walk', maleCount: 105, femaleCount: 68, totalCount: 173, color: '#EAB308' },
  { id: 'shoulders', name: 'Shoulders', icon: 'barbell', maleCount: 55, femaleCount: 26, totalCount: 81, color: '#8B5CF6' },
  { id: 'bodyweight', name: 'Bodyweight', icon: 'body', maleCount: 98, femaleCount: 58, totalCount: 156, color: '#00E676' },
];

export const HOME_CATEGORIES = [
  { id: 'home', name: 'Home Workouts', icon: 'home', count: 120, color: '#3B82F6' },
  { id: 'office', name: 'Office Workouts', icon: 'briefcase', count: 45, color: '#F59E0B' },
  { id: 'yoga', name: 'Yoga & Flexibility', icon: 'flower', count: 85, color: '#10B981' },
  { id: 'pilates', name: 'Pilates Core', icon: 'fitness', count: 60, color: '#A855F7' },
  { id: 'face', name: 'Face Yoga', icon: 'happy', count: 30, color: '#EC4899' },
  { id: 'women', name: 'Women Routines', icon: 'woman', count: 95, color: '#F43F5E' },
  { id: 'mobility', name: 'Mobility & Stretch', icon: 'infinite', count: 70, color: '#06B6D4' },
];

export const VAULT_EXERCISES: VaultExercise[] = [
  // ── CHEST ──
  {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    category: 'gym',
    gender: 'male',
    bodyPart: 'Chest',
    equipment: ['Barbell', 'Flat Bench'],
    animationUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&q=80',
    defaultReps: 10,
    defaultDurationSeconds: 45,
    instructions: [
      'Lie back on a flat bench with feet firmly planted on the floor.',
      'Grip the barbell slightly wider than shoulder-width.',
      'Lower the bar slowly to your mid-chest while keeping elbows at a 45-degree angle.',
      'Press the bar explosively back to starting position without locking elbows.'
    ],
    level: 'Intermediate',
    targetMuscle: 'Pectoralis Major & Triceps'
  },
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    category: 'gym',
    gender: 'male',
    bodyPart: 'Chest',
    equipment: ['Dumbbell', 'Incline Bench'],
    animationUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&q=80',
    defaultReps: 12,
    defaultDurationSeconds: 40,
    instructions: [
      'Set an adjustable bench to an incline of 30 to 45 degrees.',
      'Hold a dumbbell in each hand resting on your thighs.',
      'Press the dumbbells straight up above your chest, palms facing forward.',
      'Lower under control until elbows are slightly below chest level, then drive back up.'
    ],
    level: 'Beginner',
    targetMuscle: 'Upper Chest & Front Deltoids'
  },
  {
    id: 'cable-chest-flyes',
    name: 'Cable Chest Flyes',
    category: 'gym',
    gender: 'unisex',
    bodyPart: 'Chest',
    equipment: ['Cable Machine'],
    animationUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80',
    defaultReps: 15,
    defaultDurationSeconds: 35,
    instructions: [
      'Position pulleys at chest height with single handles.',
      'Take a small step forward into a staggered stance with a slight bend in your elbows.',
      'Bring your hands forward in an arc motion until they meet in front of your chest.',
      'Squeeze your chest for 1 second before slowly returning to starting position.'
    ],
    level: 'Intermediate',
    targetMuscle: 'Inner & Sternal Chest'
  },

  // ── BACK ──
  {
    id: 'lat-pulldown',
    name: 'Wide-Grip Lat Pulldown',
    category: 'gym',
    gender: 'unisex',
    bodyPart: 'Back',
    equipment: ['Cable Machine', 'Lat Bar'],
    animationUrl: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=600&q=80',
    defaultReps: 12,
    defaultDurationSeconds: 40,
    instructions: [
      'Sit comfortably and adjust the knee pad securely.',
      'Grasp the bar with a wide overhand grip.',
      'Pull the bar down toward your upper chest by driving your elbows down and back.',
      'Pause at the bottom and control the return to full stretch.'
    ],
    level: 'Beginner',
    targetMuscle: 'Latissimus Dorsi & Rhomboids'
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    category: 'gym',
    gender: 'male',
    bodyPart: 'Back',
    equipment: ['Cable Machine', 'V-Bar Handle'],
    animationUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80',
    defaultReps: 12,
    defaultDurationSeconds: 45,
    instructions: [
      'Sit on the bench with knees slightly bent and feet on the footrests.',
      'Keep your torso upright with a slight natural arch in your lower back.',
      'Pull the handle into your abdomen while squeezing shoulder blades together.',
      'Slowly extend arms without rounding your spine.'
    ],
    level: 'Intermediate',
    targetMuscle: 'Middle Back & Lats'
  },

  // ── ARMS ──
  {
    id: 'standing-dumbbell-bicep-curl',
    name: 'Alternating Dumbbell Bicep Curl',
    category: 'gym',
    gender: 'unisex',
    bodyPart: 'Arms',
    equipment: ['Dumbbell'],
    animationUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&q=80',
    defaultReps: 12,
    defaultDurationSeconds: 35,
    instructions: [
      'Stand upright with a dumbbell in each hand at your sides, palms facing inward.',
      'Keeping upper arms stationary, curl the right weight while rotating palm upward.',
      'Squeeze the bicep at the top, then slowly lower as you curl the left arm.'
    ],
    level: 'Beginner',
    targetMuscle: 'Biceps Brachii'
  },
  {
    id: 'triceps-rope-pushdown',
    name: 'Triceps Rope Pushdown',
    category: 'gym',
    gender: 'unisex',
    bodyPart: 'Arms',
    equipment: ['Cable Machine', 'Rope Attachment'],
    animationUrl: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=600&q=80',
    defaultReps: 15,
    defaultDurationSeconds: 30,
    instructions: [
      'Attach a rope to the high pulley and grasp with a neutral grip.',
      'Keep your elbows pinned tight to your ribs throughout the movement.',
      'Push the rope down, spreading the ends apart at the bottom for maximum triceps contraction.',
      'Control the weight back up to chest height.'
    ],
    level: 'Beginner',
    targetMuscle: 'Triceps (Lateral & Long Head)'
  },

  // ── LEGS ──
  {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    category: 'gym',
    gender: 'male',
    bodyPart: 'Legs',
    equipment: ['Barbell', 'Squat Rack'],
    animationUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&q=80',
    defaultReps: 10,
    defaultDurationSeconds: 50,
    instructions: [
      'Rest the bar across your upper traps and stand with feet shoulder-width apart.',
      'Initiate the squat by breaking at the hips and bending your knees.',
      'Descend until your thighs are at least parallel to the floor.',
      'Drive powerfully through your heels back to the starting standing position.'
    ],
    level: 'Advanced',
    targetMuscle: 'Quadriceps, Glutes & Hamstrings'
  },
  {
    id: 'dumbbell-lunges',
    name: 'Walking Dumbbell Lunges',
    category: 'gym',
    gender: 'female',
    bodyPart: 'Legs',
    equipment: ['Dumbbell'],
    animationUrl: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=600&q=80',
    defaultReps: 14,
    defaultDurationSeconds: 45,
    instructions: [
      'Hold a dumbbell in each hand hanging at your sides.',
      'Step forward with your right foot, lowering hips until both knees are bent at 90 degrees.',
      'Push through right heel to stand and step forward directly into a left leg lunge.'
    ],
    level: 'Intermediate',
    targetMuscle: 'Glutes & Hamstrings'
  },

  // ── SHOULDERS ──
  {
    id: 'overhead-dumbbell-press',
    name: 'Seated Dumbbell Shoulder Press',
    category: 'gym',
    gender: 'unisex',
    bodyPart: 'Shoulders',
    equipment: ['Dumbbell', 'Bench'],
    animationUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&q=80',
    defaultReps: 10,
    defaultDurationSeconds: 40,
    instructions: [
      'Sit on an upright bench holding dumbbells at shoulder level, palms facing forward.',
      'Press the dumbbells overhead until your arms are extended but not locked.',
      'Lower the weights smoothly to ear height before pressing up again.'
    ],
    level: 'Beginner',
    targetMuscle: 'Anterior & Lateral Deltoids'
  },

  // ── ABS ──
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    category: 'gym',
    gender: 'unisex',
    bodyPart: 'Abs',
    equipment: ['Pull-Up Bar'],
    animationUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80',
    defaultReps: 12,
    defaultDurationSeconds: 30,
    instructions: [
      'Hang from a pull-up bar with an overhand grip and arms straight.',
      'Without swinging, raise your legs straight out in front of you until parallel to the ground.',
      'Hold for a split second, then lower slowly with control.'
    ],
    level: 'Intermediate',
    targetMuscle: 'Lower Rectus Abdominis'
  },

  // ── HOME WORKOUTS (NO EQUIPMENT) ──
  {
    id: 'bodyweight-pushups',
    name: 'Standard Push-Ups',
    category: 'home',
    gender: 'unisex',
    bodyPart: 'Bodyweight',
    equipment: ['Bodyweight'],
    animationUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600&q=80',
    defaultReps: 15,
    defaultDurationSeconds: 35,
    instructions: [
      'Start in a high plank position with hands slightly wider than shoulder-width.',
      'Keep core braced and spine neutral from head to heels.',
      'Lower chest until it almost touches the floor, keeping elbows at 45 degrees.',
      'Push back up to the top position.'
    ],
    level: 'Beginner',
    targetMuscle: 'Chest, Front Delts & Triceps'
  },
  {
    id: 'home-plank-hold',
    name: 'Forearm Core Plank',
    category: 'home',
    gender: 'unisex',
    bodyPart: 'Abs',
    equipment: ['Bodyweight'],
    animationUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=600&q=80',
    defaultDurationSeconds: 45,
    instructions: [
      'Place forearms on the floor with elbows directly under shoulders.',
      'Ground your toes into the floor and squeeze glutes to stabilize your body.',
      'Hold without letting hips sag or pike upward.'
    ],
    level: 'Beginner',
    targetMuscle: 'Core & Transverse Abdominis'
  },
  {
    id: 'office-desk-chair-squats',
    name: 'Desk Chair Box Squats',
    category: 'home',
    gender: 'unisex',
    bodyPart: 'Office',
    equipment: ['Chair'],
    animationUrl: 'https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?w=600&q=80',
    defaultReps: 20,
    defaultDurationSeconds: 40,
    instructions: [
      'Stand in front of your office chair with feet hip-width apart.',
      'Hinge hips back and lower until your glutes lightly tap the chair seat.',
      'Stand back up without resting on the chair.'
    ],
    level: 'Beginner',
    targetMuscle: 'Quads & Glutes'
  },
  {
    id: 'yoga-downward-dog',
    name: 'Downward-Facing Dog (Adho Mukha)',
    category: 'home',
    gender: 'unisex',
    bodyPart: 'Yoga',
    equipment: ['Yoga Mat'],
    animationUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80',
    defaultDurationSeconds: 60,
    instructions: [
      'Start on all fours with hands shoulder-width and knees hip-width.',
      'Press through palms, lift knees and send sitting bones high toward the ceiling.',
      'Pedal your heels toward the mat and hold with deep calm breathing.'
    ],
    level: 'Beginner',
    targetMuscle: 'Hamstrings, Calves & Spine'
  },
  {
    id: 'pilates-hundred',
    name: 'Pilates The Hundred',
    category: 'home',
    gender: 'female',
    bodyPart: 'Bodyweight',
    equipment: ['Mat'],
    animationUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80',
    defaultDurationSeconds: 50,
    instructions: [
      'Lie flat on back, lift head, neck, and shoulders off the mat.',
      'Extend legs to a 45-degree angle.',
      'Pump arms briskly up and down 6 inches while inhaling for 5 counts and exhaling for 5 counts.'
    ],
    level: 'Intermediate',
    targetMuscle: 'Deep Abdominals & Core Endurance'
  },
  {
    id: 'mobility-cat-cow',
    name: 'Cat-Cow Spinal Mobility',
    category: 'home',
    gender: 'unisex',
    bodyPart: 'Mobility',
    equipment: ['Bodyweight'],
    animationUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80',
    defaultDurationSeconds: 60,
    instructions: [
      'On hands and knees, inhale as you drop belly toward the mat, lifting chest (Cow).',
      'Exhale as you draw belly to spine and round back toward ceiling (Cat).',
      'Move fluidly with breath for spinal decompression.'
    ],
    level: 'Beginner',
    targetMuscle: 'Spine, Neck & Core Mobility'
  }
];
