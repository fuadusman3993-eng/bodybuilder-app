export interface RoutineExercise {
  exerciseId: string;
  name: string;
  repsOrTime: string;
  isTimeBased: boolean;
  durationSeconds?: number;
  reps?: number;
  targetMuscle: string;
  thumbnail: string;
  instructions: string[];
}

export interface DiscoverRoutine {
  id: string;
  title: string;
  subtitle: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  time: string;
  durationMinutes: number;
  calories: string;
  badge: string;
  isLocalImage?: boolean;
  image: any; // ImageSource or URL string
  introduction: string;
  isPro: boolean;
  exercises: RoutineExercise[];
}

export const DISCOVER_ROUTINES: Record<string, DiscoverRoutine> = {
  'abs-4-moves': {
    id: 'abs-4-moves',
    title: 'Only 4 Moves for Abs',
    subtitle: 'Burn belly fat & firm your abs with zero equipment.',
    level: 'Beginner',
    time: '12 mins',
    durationMinutes: 12,
    calories: '120 kcal',
    badge: 'TRENDING ROUTINE',
    isLocalImage: true,
    image: require('../assets/images/abs-plank-hero.jpg'),
    introduction:
      'Pulling your T-shirt again and again because of belly bulge? This high-yield routine targets your core and abdominal fat with 4 focused, bodyweight moves. With targeted activation of upper abs, lower abs, and the deep transverse abdominis, this workout ignites calorie burn and strengthens your core for hours after you finish.',
    isPro: true,
    exercises: [
      {
        exerciseId: 'jumping-jacks',
        name: 'Jumping Jacks Warmup',
        repsOrTime: '00:30',
        isTimeBased: true,
        durationSeconds: 30,
        targetMuscle: 'Full Body & Core',
        thumbnail: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=600&q=80',
        instructions: [
          'Stand upright with feet together and arms at your sides.',
          'Jump up, spreading your legs wider than shoulders and clapping hands above head.',
          'Return smoothly to starting position and keep your core braced.',
        ],
      },
      {
        exerciseId: 'crunches',
        name: 'Abdominal Crunches',
        repsOrTime: 'x16',
        isTimeBased: false,
        reps: 16,
        targetMuscle: 'Upper Abs',
        thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
        instructions: [
          'Lie on your back with knees bent and feet flat on the floor.',
          'Place hands gently behind ears, curl shoulders upward toward pelvis.',
          'Hold at peak contraction for one second, then lower slowly with control.',
        ],
      },
      {
        exerciseId: 'mountain-climber',
        name: 'Mountain Climbers',
        repsOrTime: 'x20',
        isTimeBased: false,
        reps: 20,
        targetMuscle: 'Lower Abs & Obliques',
        thumbnail: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=600&q=80',
        instructions: [
          'Start in a solid high plank position with shoulders directly above wrists.',
          'Drive one knee rapidly toward your chest without letting hips sag.',
          'Alternate legs smoothly at a brisk, controlled cadence.',
        ],
      },
      {
        exerciseId: 'plank',
        name: 'Core Stability Plank',
        repsOrTime: '00:30',
        isTimeBased: true,
        durationSeconds: 30,
        targetMuscle: 'Deep Core & Transverse',
        thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80',
        instructions: [
          'Support your weight on your forearms and toes.',
          'Keep your entire body in a straight line from ears to heels.',
          'Brace glutes and abdominal wall tight, breathing steadily.',
        ],
      },
    ],
  },

  'belly-fat-burner': {
    id: 'belly-fat-burner',
    title: 'Belly Fat Burner HIIT',
    subtitle: 'High intensity interval burst for stubborn midsection fat.',
    level: 'Beginner',
    time: '15 mins',
    durationMinutes: 15,
    calories: '180 kcal',
    badge: 'HIIT BURN',
    isLocalImage: false,
    image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=80',
    introduction:
      'High-Intensity Interval Training (HIIT) is scientifically proven to activate Excess Post-Exercise Oxygen Consumption (EPOC), continuing to melt fat long after your session. This 4-move circuit accelerates heart rate and engages total-body muscle groups.',
    isPro: true,
    exercises: [
      {
        exerciseId: 'high-stepping',
        name: 'High Stepping (High Knees)',
        repsOrTime: '00:30',
        isTimeBased: true,
        durationSeconds: 30,
        targetMuscle: 'Cardio & Lower Abs',
        thumbnail: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&q=80',
        instructions: [
          'Drive knees up toward chest alternately in rapid running motion.',
          'Pump your arms and stay light on your toes.',
        ],
      },
      {
        exerciseId: 'bicycle-crunches',
        name: 'Bicycle Crunches',
        repsOrTime: 'x16',
        isTimeBased: false,
        reps: 16,
        targetMuscle: 'Obliques & Core',
        thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80',
        instructions: [
          'Rotate torso to bring opposite elbow toward opposite knee.',
          'Extend other leg out straight without touching the ground.',
        ],
      },
      {
        exerciseId: 'burpees',
        name: 'Full Body Burpees',
        repsOrTime: 'x10',
        isTimeBased: false,
        reps: 10,
        targetMuscle: 'Full Body & Core',
        thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80',
        instructions: [
          'Drop down into a squat, kick feet back into plank, return feet, and jump straight up.',
        ],
      },
      {
        exerciseId: 'plank-taps',
        name: 'Plank Shoulder Taps',
        repsOrTime: 'x20',
        isTimeBased: false,
        reps: 20,
        targetMuscle: 'Core & Deltoids',
        thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
        instructions: [
          'In plank position, tap left shoulder with right hand, then alternate.',
          'Keep hips parallel to the floor without swaying.',
        ],
      },
    ],
  },

  'lose-fat-no-jumping': {
    id: 'lose-fat-no-jumping',
    title: 'Lose Fat (No Jumping!)',
    subtitle: 'Apartment-friendly, knee-safe low impact fat burn.',
    level: 'Intermediate',
    time: '14 mins',
    durationMinutes: 14,
    calories: '160 kcal',
    badge: 'LOW IMPACT',
    isLocalImage: false,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80',
    introduction:
      'Living in an apartment or protecting your knees and joints? This zero-jumping workout delivers maximum cardiovascular burn and metabolic stimulation with zero loud thuds and zero joint impact.',
    isPro: true,
    exercises: [
      {
        exerciseId: 'bodyweight-squats',
        name: 'Deep Bodyweight Squats',
        repsOrTime: 'x16',
        isTimeBased: false,
        reps: 16,
        targetMuscle: 'Quads & Glutes',
        thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&q=80',
        instructions: [
          'Sit hips back and down with chest elevated and heels firmly planted.',
          'Drive through heels back to full standing position.',
        ],
      },
      {
        exerciseId: 'reverse-lunges',
        name: 'Controlled Reverse Lunges',
        repsOrTime: 'x12',
        isTimeBased: false,
        reps: 12,
        targetMuscle: 'Legs & Balance',
        thumbnail: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=600&q=80',
        instructions: [
          'Step one foot back and lower knee until front thigh is parallel to floor.',
          'Press through front heel to return to start.',
        ],
      },
      {
        exerciseId: 'standing-crunches',
        name: 'Standing Side Crunches',
        repsOrTime: 'x20',
        isTimeBased: false,
        reps: 20,
        targetMuscle: 'Side Waist & Obliques',
        thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80',
        instructions: [
          'Lift knee sideways toward your elbow in a controlled standing crunch.',
        ],
      },
      {
        exerciseId: 'wall-sit',
        name: 'Isometric Wall Sit',
        repsOrTime: '00:35',
        isTimeBased: true,
        durationSeconds: 35,
        targetMuscle: 'Quads & Core',
        thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
        instructions: [
          'Slide back down a wall until thighs are parallel to the floor.',
          'Hold strong and breathe steadily through the burn.',
        ],
      },
    ],
  },

  'morning-ignition': {
    id: 'morning-ignition',
    title: 'Full Body Morning Ignition',
    subtitle: 'Wake up metabolism, nervous system, and posture.',
    level: 'All Levels',
    time: '12 mins',
    durationMinutes: 12,
    calories: '140 kcal',
    badge: 'MORNING BOOST',
    isLocalImage: false,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
    introduction:
      'Start your day with dynamic energy. This 4-move routine opens the chest, aligns the spine, activates the glutes, and releases dopamine to elevate your focus and mood all day.',
    isPro: true,
    exercises: [
      {
        exerciseId: 'arm-circles',
        name: 'Arm Circles & Dynamic Reach',
        repsOrTime: '00:30',
        isTimeBased: true,
        durationSeconds: 30,
        targetMuscle: 'Shoulders & Thoracic',
        thumbnail: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=600&q=80',
        instructions: ['Rotate arms smoothly in large circles, warming up shoulders and rotator cuff.'],
      },
      {
        exerciseId: 'pushups',
        name: 'Standard Push-ups',
        repsOrTime: 'x12',
        isTimeBased: false,
        reps: 12,
        targetMuscle: 'Chest & Triceps',
        thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80',
        instructions: ['Lower chest toward floor with elbows at 45 degrees, push up firmly.'],
      },
      {
        exerciseId: 'glute-bridge',
        name: 'Glute Bridges',
        repsOrTime: 'x16',
        isTimeBased: false,
        reps: 16,
        targetMuscle: 'Glutes & Hamstrings',
        thumbnail: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=600&q=80',
        instructions: ['Lie on back and drive hips to ceiling, squeezing glutes at top.'],
      },
      {
        exerciseId: 'cobra-stretch',
        name: 'Cobra to Child’s Pose Flow',
        repsOrTime: '00:30',
        isTimeBased: true,
        durationSeconds: 30,
        targetMuscle: 'Spine & Abdominal Wall',
        thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80',
        instructions: ['Arch gently into cobra stretch, then push hips back into child’s pose.'],
      },
    ],
  },

  'stay-active': {
    id: 'stay-active',
    title: 'Stay Active, Stay in Shape',
    subtitle: 'Daily balanced maintenance for lasting wellness.',
    level: 'Beginner',
    time: '15 mins',
    durationMinutes: 15,
    calories: '150 kcal',
    badge: 'DAILY ROUTINE',
    isLocalImage: false,
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    introduction:
      'Consistency beats intensity every single time. Designed for sustainable everyday wellness, this 4-movement routine keeps your joints lubricated, preserves lean muscle tone, and elevates daily metabolism.',
    isPro: true,
    exercises: [
      {
        exerciseId: 'step-jacks',
        name: 'Low Impact Step Jacks',
        repsOrTime: '00:30',
        isTimeBased: true,
        durationSeconds: 30,
        targetMuscle: 'Cardio & Shoulders',
        thumbnail: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=600&q=80',
        instructions: ['Step one foot out while raising arms, step back, and switch sides.'],
      },
      {
        exerciseId: 'incline-pushups',
        name: 'Incline Push-ups',
        repsOrTime: 'x12',
        isTimeBased: false,
        reps: 12,
        targetMuscle: 'Upper Chest & Arms',
        thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80',
        instructions: ['Place hands on a bench or sturdy elevated surface and push up with control.'],
      },
      {
        exerciseId: 'bird-dog',
        name: 'Bird Dog Balance',
        repsOrTime: 'x12',
        isTimeBased: false,
        reps: 12,
        targetMuscle: 'Lower Back & Glutes',
        thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80',
        instructions: ['On hands and knees, reach opposite arm and leg straight out simultaneously.'],
      },
      {
        exerciseId: 'cat-cow',
        name: 'Cat-Cow Mobility Flow',
        repsOrTime: '00:30',
        isTimeBased: true,
        durationSeconds: 30,
        targetMuscle: 'Spine & Core',
        thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80',
        instructions: ['Inhale and arch back down (cow), exhale and round spine up (cat).'],
      },
    ],
  },

  'upper-body-stretch': {
    id: 'upper-body-stretch',
    title: 'Upper Body Stretching',
    subtitle: 'Relieve neck, shoulder, and chest tension.',
    level: 'Beginner',
    time: '8 mins',
    durationMinutes: 8,
    calories: '60 kcal',
    badge: 'MOBILITY',
    isLocalImage: false,
    image: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=800&auto=format&fit=crop&q=80',
    introduction:
      'Sitting at a desk or working on a phone causes shoulder hunching and neck stiffness. This routine opens your chest, lengthens tight neck muscles, and restores upper body alignment.',
    isPro: true,
    exercises: [
      {
        exerciseId: 'neck-stretch',
        name: 'Side Neck & Trap Stretch',
        repsOrTime: '00:30',
        isTimeBased: true,
        durationSeconds: 30,
        targetMuscle: 'Neck & Upper Trapezius',
        thumbnail: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=600&q=80',
        instructions: ['Gently tilt ear toward shoulder, holding gently without pulling.'],
      },
      {
        exerciseId: 'shoulder-cross-stretch',
        name: 'Cross-Body Shoulder Stretch',
        repsOrTime: '00:30',
        isTimeBased: true,
        durationSeconds: 30,
        targetMuscle: 'Deltoids & Upper Back',
        thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80',
        instructions: ['Bring arm across chest and hug it close with your other forearm.'],
      },
      {
        exerciseId: 'chest-opener',
        name: 'Doorway Chest Opener',
        repsOrTime: '00:30',
        isTimeBased: true,
        durationSeconds: 30,
        targetMuscle: 'Pectorals & Biceps',
        thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80',
        instructions: ['Place forearms against doorframe and lean forward gently.'],
      },
      {
        exerciseId: 'overhead-tricep-stretch',
        name: 'Overhead Tricep Stretch',
        repsOrTime: '00:30',
        isTimeBased: true,
        durationSeconds: 30,
        targetMuscle: 'Triceps & Lats',
        thumbnail: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=600&q=80',
        instructions: ['Reach arm behind head and gently press elbow back.'],
      },
    ],
  },

  'lower-body-stretch': {
    id: 'lower-body-stretch',
    title: 'Lower Body Stretching',
    subtitle: 'Loosen tight hamstrings, hips, and calves.',
    level: 'Beginner',
    time: '10 mins',
    durationMinutes: 10,
    calories: '75 kcal',
    badge: 'FLEXIBILITY',
    isLocalImage: false,
    image: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&auto=format&fit=crop&q=80',
    introduction:
      'Unlock tight hip flexors and relieve lower back strain. This 4-move lower body stretch increases range of motion and leg flexibility.',
    isPro: true,
    exercises: [
      {
        exerciseId: 'hamstring-stretch',
        name: 'Seated Single-Leg Hamstring Stretch',
        repsOrTime: '00:30',
        isTimeBased: true,
        durationSeconds: 30,
        targetMuscle: 'Hamstrings',
        thumbnail: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=600&q=80',
        instructions: ['Extend one leg and hinge forward from hips toward toes.'],
      },
      {
        exerciseId: 'hip-flexor-stretch',
        name: 'Kneeling Hip Flexor Stretch',
        repsOrTime: '00:30',
        isTimeBased: true,
        durationSeconds: 30,
        targetMuscle: 'Psoas & Hip Flexors',
        thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80',
        instructions: ['In half-kneeling stance, shift hips forward and tuck pelvis.'],
      },
      {
        exerciseId: 'quad-stretch',
        name: 'Standing Quad Stretch',
        repsOrTime: '00:30',
        isTimeBased: true,
        durationSeconds: 30,
        targetMuscle: 'Quadriceps',
        thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
        instructions: ['Pull foot to glute while keeping knees aligned and core tight.'],
      },
      {
        exerciseId: 'butterfly-stretch',
        name: 'Butterfly Adductor Stretch',
        repsOrTime: '00:30',
        isTimeBased: true,
        durationSeconds: 30,
        targetMuscle: 'Inner Thighs & Groin',
        thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80',
        instructions: ['Press soles of feet together and lower knees gently toward floor.'],
      },
    ],
  },

  'back-pain-relief': {
    id: 'back-pain-relief',
    title: 'Lower Back Pain Relief',
    subtitle: 'Gentle spinal decompression and tension release.',
    level: 'Beginner',
    time: '6 mins',
    durationMinutes: 6,
    calories: '45 kcal',
    badge: 'RECOVERY',
    isLocalImage: false,
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
    introduction:
      'Specially designed for immediate relief of lumbar spine tension. These 4 therapeutic movements relieve sciatic pressure and decompress lower back discs safely.',
    isPro: true,
    exercises: [
      {
        exerciseId: 'knees-to-chest',
        name: 'Double Knees-to-Chest',
        repsOrTime: '00:30',
        isTimeBased: true,
        durationSeconds: 30,
        targetMuscle: 'Lumbar Spine',
        thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80',
        instructions: ['Hug knees to chest and rock side-to-side gently.'],
      },
      {
        exerciseId: 'supine-twist',
        name: 'Supine Lumbar Twist',
        repsOrTime: '00:30',
        isTimeBased: true,
        durationSeconds: 30,
        targetMuscle: 'Lower Back & Glutes',
        thumbnail: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=600&q=80',
        instructions: ['Drop knees to one side while keeping shoulders flat on floor.'],
      },
      {
        exerciseId: 'childs-pose',
        name: 'Extended Child’s Pose',
        repsOrTime: '00:30',
        isTimeBased: true,
        durationSeconds: 30,
        targetMuscle: 'Lats & Spine',
        thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80',
        instructions: ['Sit back onto heels and reach arms out long on floor.'],
      },
      {
        exerciseId: 'pelvic-tilt',
        name: 'Gentle Pelvic Tilts',
        repsOrTime: 'x12',
        isTimeBased: false,
        reps: 12,
        targetMuscle: 'Pelvic Floor & Core',
        thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
        instructions: ['Flatten lower back against floor by tilting pelvis upward.'],
      },
    ],
  },

  'back-stretch': {
    id: 'back-stretch',
    title: 'Back Stretching',
    subtitle: 'Full spine mobilization and posture rejuvenation.',
    level: 'Beginner',
    time: '7 mins',
    durationMinutes: 7,
    calories: '55 kcal',
    badge: 'POSTURE',
    isLocalImage: false,
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80',
    introduction:
      'Realign thoracic curves, increase spinal flexibility, and alleviate mid-back tightness with these 4 restorative posture-correcting stretches.',
    isPro: true,
    exercises: [
      {
        exerciseId: 'cat-cow-deep',
        name: 'Deep Cat-Cow Spine Flow',
        repsOrTime: '00:30',
        isTimeBased: true,
        durationSeconds: 30,
        targetMuscle: 'Entire Spine',
        thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80',
        instructions: ['Flow rhythmically between spinal flexion and extension with deep breathing.'],
      },
      {
        exerciseId: 'thread-needle',
        name: 'Thread the Needle Stretch',
        repsOrTime: '00:30',
        isTimeBased: true,
        durationSeconds: 30,
        targetMuscle: 'Thoracic Spine & Shoulders',
        thumbnail: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=600&q=80',
        instructions: ['Slide one arm under chest until shoulder rests on floor.'],
      },
      {
        exerciseId: 'sphinx-pose',
        name: 'Sphinx Lumbar Extension',
        repsOrTime: '00:30',
        isTimeBased: true,
        durationSeconds: 30,
        targetMuscle: 'Lower Back Arch',
        thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80',
        instructions: ['Lie on stomach and prop chest up on forearms, pulling shoulders back.'],
      },
      {
        exerciseId: 'puppy-pose',
        name: 'Puppy Dog Heart-Melting Pose',
        repsOrTime: '00:30',
        isTimeBased: true,
        durationSeconds: 30,
        targetMuscle: 'Upper Back & Chest',
        thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80',
        instructions: ['Keep hips over knees and walk hands forward, melting chest toward mat.'],
      },
    ],
  },
};

export function getDiscoverRoutine(id: string): DiscoverRoutine | undefined {
  return DISCOVER_ROUTINES[id] || DISCOVER_ROUTINES['abs-4-moves'];
}

export function getAllDiscoverRoutines(): DiscoverRoutine[] {
  return Object.values(DISCOVER_ROUTINES);
}
