export interface Exercise {
  id: string;
  name: string;
  altName: string;
  muscleGroup: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  level: number;
  levelLabel: string;
  levelWhy: string;
  movementType: string; // 'Bilateral' | 'Unilateral'
  trackingType: 'Reps' | 'Time';
  videoUrl: string; // fallback
  videoMaleUrl: string;
  videoFemaleUrl: string;
  anatomicalMaleImage: string;
  anatomicalFemaleImage: string;
  thumbnail: string;
  instructions: string[];
  formTips: string[];
  equipment: string[];
  defaultSets: number;
  defaultReps: number;
  defaultRestSeconds: number;
}

export const EXERCISES: Record<string, Exercise> = {
  'pushup': {
    id: 'pushup',
    name: 'Push-up',
    altName: 'Press-up',
    muscleGroup: 'Chest',
    primaryMuscles: ['Pectoralis Major', 'Triceps Brachii'],
    secondaryMuscles: ['Anterior Deltoid', 'Rectus Abdominis', 'Serratus Anterior'],
    level: 3,
    levelLabel: 'Level 3',
    levelWhy: 'Push-ups require controlling approximately 64% of your total bodyweight while maintaining strict spinal alignment and shoulder stabilization.',
    movementType: 'Bilateral',
    trackingType: 'Reps',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athlete-doing-push-ups-in-the-gym-42417-large.mp4',
    videoMaleUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athlete-doing-push-ups-in-the-gym-42417-large.mp4',
    videoFemaleUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-doing-push-ups-in-a-gym-42777-large.mp4',
    anatomicalMaleImage: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&q=80',
    anatomicalFemaleImage: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600',
    instructions: [
      'Assume a high plank position with hands positioned slightly wider than shoulder-width apart.',
      'Maintain a neutral spine by contracting your glutes and bracing your core.',
      'Lower your torso with control until your chest touches or comes within 2 inches of the floor, keeping elbows at a 45-degree angle.',
      'Press firmly through your palms to return to full arm extension without hyperextending your elbows.',
    ],
    formTips: [
      'Keep your neck neutral — look slightly forward, not straight down.',
      'Do not let your hips sag or hike into a pike position.',
      'Inhale on the descent; exhale powerfully on the push.',
    ],
    equipment: ['Bodyweight', 'Exercise Mat'],
    defaultSets: 3,
    defaultReps: 15,
    defaultRestSeconds: 60,
  },
  'bench-press': {
    id: 'bench-press',
    name: 'Bench Press',
    altName: 'Barbell Flat Bench',
    muscleGroup: 'Chest',
    primaryMuscles: ['Pectoralis Major', 'Triceps Brachii'],
    secondaryMuscles: ['Anterior Deltoid', 'Latissimus Dorsi'],
    level: 3,
    levelLabel: 'Level 3',
    levelWhy: 'Requires high central nervous system recruitment and scapular retraction under external load.',
    movementType: 'Bilateral',
    trackingType: 'Reps',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-doing-bench-presses-with-a-barbell-42525-large.mp4',
    videoMaleUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-doing-bench-presses-with-a-barbell-42525-large.mp4',
    videoFemaleUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-bench-press-in-the-gym-42784-large.mp4',
    anatomicalMaleImage: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
    anatomicalFemaleImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600',
    instructions: [
      'Lie flat on the bench with eyes directly under the racked barbell.',
      'Plant your feet flat on the floor and retract your scapulae firmly into the bench.',
      'Unrack the bar and bring it to arm extension above your mid-chest.',
      'Lower the bar slowly to the sternum, pause for a split second, and press back up.',
    ],
    formTips: [
      'Maintain contact with the bench at 5 points: head, shoulders, glutes, and both feet.',
      'Do not bounce the bar off your ribcage.',
      'Squeeze the bar aggressively to engage forearm and shoulder stabilizers.',
    ],
    equipment: ['Barbell', 'Flat Bench', 'Weight Plates'],
    defaultSets: 4,
    defaultReps: 10,
    defaultRestSeconds: 90,
  },
  'squat': {
    id: 'squat',
    name: 'Barbell Squat',
    altName: 'Back Squat',
    muscleGroup: 'Legs',
    primaryMuscles: ['Quadriceps', 'Gluteus Maximus'],
    secondaryMuscles: ['Hamstrings', 'Calves', 'Erector Spinae'],
    level: 4,
    levelLabel: 'Level 4',
    levelWhy: 'Heavy compound movement demanding substantial hip mobility, ankle dorsiflexion, and thoracic stiffness.',
    movementType: 'Bilateral',
    trackingType: 'Reps',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-doing-squats-with-a-barbell-42526-large.mp4',
    videoMaleUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-doing-squats-with-a-barbell-42526-large.mp4',
    videoFemaleUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-squats-in-a-gym-42780-large.mp4',
    anatomicalMaleImage: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80',
    anatomicalFemaleImage: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600',
    instructions: [
      'Position the barbell across your upper traps and step back with feet shoulder-width apart.',
      'Take a deep diaphragmatic breath, brace your core, and initiate by breaking at the hips and knees.',
      'Descend until the hip crease dips below the top of the knee cap (parallel depth).',
      'Drive aggressively through mid-foot and stand upright.',
    ],
    formTips: [
      'Keep knees tracking in line with your toes throughout the descent.',
      'Maintain an upright chest and neutral spine.',
    ],
    equipment: ['Barbell', 'Squat Rack', 'Plates'],
    defaultSets: 4,
    defaultReps: 10,
    defaultRestSeconds: 90,
  },
  'lat-pulldown': {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    altName: 'Cable Pulldown',
    muscleGroup: 'Back',
    primaryMuscles: ['Latissimus Dorsi', 'Biceps Brachii'],
    secondaryMuscles: ['Rhomboids', 'Rear Deltoids', 'Trapezius'],
    level: 2,
    levelLabel: 'Level 2',
    levelWhy: 'Controlled vertical pulling plane allowing targeted hypertrophy with low spinal compression.',
    movementType: 'Bilateral',
    trackingType: 'Reps',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-doing-lat-pulldowns-in-a-gym-42528-large.mp4',
    videoMaleUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-doing-lat-pulldowns-in-a-gym-42528-large.mp4',
    videoFemaleUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fit-woman-doing-lat-pulldowns-42781-large.mp4',
    anatomicalMaleImage: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80',
    anatomicalFemaleImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600',
    instructions: [
      'Adjust the thigh pads so your legs are firmly anchored while seated.',
      'Grasp the bar with a wide overhand grip, lean back approximately 10 degrees.',
      'Pull the bar down toward your upper chest by driving your elbows down and back.',
      'Squeeze your lats at the bottom, then slowly return to full overhead stretch.',
    ],
    formTips: [
      'Do not use excessive momentum or swing your torso backwards.',
      'Focus on pulling through your elbows, not just gripping with your hands.',
    ],
    equipment: ['Cable Machine', 'Wide Lat Bar'],
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSeconds: 60,
  },
};
