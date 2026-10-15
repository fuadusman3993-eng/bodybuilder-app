import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { EXERCISES } from '../../constants/exercises';
import { getWorkoutForDay } from '../../constants/workouts';
import { useChallengeStore } from '../../store/challengeStore';
import MuscleAnatomyView from '../../components/workout/MuscleAnatomyView';

export default function ExerciseExecutionScreen() {
  const router = useRouter();
  const { exerciseId, day, index } = useLocalSearchParams();

  const dayNumber = parseInt((day as string) || '1', 10);
  const exerciseIndex = parseInt((index as string) || '0', 10);

  const {
    activeGoal,
    currentWorkoutProgress,
    saveSetProgress,
    completeDay,
  } = useChallengeStore();

  const workout = getWorkoutForDay(activeGoal, dayNumber);
  const workoutEx = workout?.exercises[exerciseIndex];
  const exData = EXERCISES[(exerciseId as string) || 'pushup'] || EXERCISES['pushup'];

  const currentSets = currentWorkoutProgress[exData.id] || [];

  // Rest Timer State
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const timerRef = useRef<any>(null);

  // Time-based Exercise Timer State (for timed exercises like Plank, High Stepping)
  const isTimeBased = exData.isTimeBased || typeof workoutEx?.reps === 'string';
  const targetSeconds =
    workoutEx?.durationSeconds || exData.defaultDurationSeconds || 30;
  const [activeSeconds, setActiveSeconds] = useState(targetSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const activeTimerRef = useRef<any>(null);

  // Rest Timer Effect
  useEffect(() => {
    if (isResting && restTimeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setRestTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (isResting && restTimeRemaining === 0) {
      setIsResting(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isResting, restTimeRemaining]);

  // Timed Exercise Effect
  useEffect(() => {
    if (isTimerRunning && activeSeconds > 0) {
      activeTimerRef.current = setTimeout(() => {
        setActiveSeconds((prev) => prev - 1);
      }, 1000);
    } else if (isTimerRunning && activeSeconds === 0) {
      setIsTimerRunning(false);
      handleCompleteSet(0, targetSeconds, 0);
    }
    return () => {
      if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
    };
  }, [isTimerRunning, activeSeconds]);

  if (!workout || !workoutEx || !exData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Exercise not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.navBackBtn}>
            <Text style={styles.navBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalExercises = workout.exercises.length;
  const progressPercent = Math.round(((exerciseIndex + 1) / totalExercises) * 100);

  const handleCompleteSet = (setIdx: number, repsCount: number, weightKg: number) => {
    saveSetProgress(exData.id, setIdx, {
      reps: repsCount,
      weight: weightKg,
      completed: true,
    });

    // Start rest timer if not last set
    const totalSets = workoutEx.sets || 1;
    if (setIdx < totalSets - 1) {
      setRestTimeRemaining(workoutEx.restSeconds || 20);
      setIsResting(true);
    }
  };

  const skipRest = () => {
    setIsResting(false);
    setRestTimeRemaining(0);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleNextExercise = () => {
    const nextIndex = exerciseIndex + 1;
    if (nextIndex < totalExercises) {
      const nextEx = workout.exercises[nextIndex];
      router.replace({
        pathname: '/exercise/[exerciseId]',
        params: {
          exerciseId: nextEx.exerciseId,
          day: dayNumber.toString(),
          index: nextIndex.toString(),
        },
      } as any);
    } else {
      // Workout Finished! Complete Day!
      completeDay(dayNumber);
      Alert.alert(
        '🎉 Great Job!',
        `You have completed Day ${dayNumber}! Your streak has increased.`,
        [
          {
            text: 'Back to Challenge',
            onPress: () => router.replace('/challenge'),
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* HEADER WITH PROGRESS */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerSub}>
            Exercise {exerciseIndex + 1} of {totalExercises}
          </Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => {
            Alert.alert(
              exData.name,
              `${exData.instructions.join('\n\n')}\n\nEquipment: ${exData.equipment.join(', ')}`
            );
          }}
        >
          <Ionicons name="information-circle-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* EXERCISE TITLE & CHIPS */}
        <View style={styles.titleSection}>
          <Text style={styles.exerciseTitle}>{exData.name}</Text>
          {exData.altName && (
            <Text style={styles.altNameText}>Also known as: {exData.altName}</Text>
          )}

          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Ionicons name="fitness-outline" size={13} color={Colors.primary} />
              <Text style={styles.chipText}>{exData.muscleGroup}</Text>
            </View>
            <View style={styles.chip}>
              <Ionicons name="flash-outline" size={13} color="#F59E0B" />
              <Text style={styles.chipText}>{exData.level}</Text>
            </View>
            <View style={styles.chip}>
              <Ionicons name="repeat-outline" size={13} color="#60A5FA" />
              <Text style={styles.chipText}>{exData.movementType}</Text>
            </View>
          </View>
        </View>

        {/* 3D / SVG ANATOMICAL BODY VIEW (TARGET MUSCLES HIGHLIGHTED RED) */}
        <MuscleAnatomyView
          primaryMuscles={exData.primaryMuscles}
          secondaryMuscles={exData.secondaryMuscles}
          exerciseName={exData.name}
        />

        {/* EXERCISE FORM DEMO (PHOTO / ACTION FRAME - FAST & NO LAG) */}
        <View style={styles.demoCard}>
          <View style={styles.demoHeader}>
            <Ionicons name="videocam-outline" size={18} color="#94A3B8" />
            <Text style={styles.demoHeaderText}>Form Demonstration</Text>
          </View>
          <View style={styles.demoImageContainer}>
            <Image
              source={{ uri: exData.thumbnail }}
              style={styles.demoImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* EXECUTION / SETS SECTION */}
        <View style={styles.executionCard}>
          {isTimeBased ? (
            /* TIMED EXERCISE (e.g. Plank 00:30, High Stepping 00:20) */
            <View style={styles.timerContainer}>
              <Text style={styles.timerLabel}>Target Duration</Text>
              <Text style={styles.timerDisplay}>
                00:{activeSeconds < 10 ? `0${activeSeconds}` : activeSeconds}
              </Text>

              <View style={styles.timerControlsRow}>
                <TouchableOpacity
                  style={[
                    styles.timerActionBtn,
                    isTimerRunning ? styles.timerPauseBtn : styles.timerStartBtn,
                  ]}
                  onPress={() => setIsTimerRunning(!isTimerRunning)}
                >
                  <Ionicons
                    name={isTimerRunning ? 'pause' : 'play'}
                    size={24}
                    color="#000"
                  />
                  <Text style={styles.timerActionBtnText}>
                    {isTimerRunning ? 'Pause' : 'Start Timer'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.timerResetBtn}
                  onPress={() => {
                    setIsTimerRunning(false);
                    setActiveSeconds(targetSeconds);
                  }}
                >
                  <Ionicons name="refresh" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* REP-BASED EXERCISE (e.g. Pushup x15, Squat x15) */
            <View style={styles.setsTable}>
              <View style={styles.tableHeader}>
                <Text style={[styles.colHeader, { flex: 0.8 }]}>SET</Text>
                <Text style={[styles.colHeader, { flex: 1.2 }]}>TARGET</Text>
                <Text style={[styles.colHeader, { flex: 1.2 }]}>DONE</Text>
              </View>

              {Array.from({ length: workoutEx.sets || 1 }).map((_, i) => {
                const isSetDone = currentSets[i]?.completed;
                const defaultRepsNum =
                  typeof workoutEx.reps === 'number' ? workoutEx.reps : exData.defaultReps;

                return (
                  <View
                    key={i}
                    style={[styles.setRow, isSetDone && styles.setRowCompleted]}
                  >
                    <Text style={[styles.setNumberText, { flex: 0.8 }]}>
                      Set {i + 1}
                    </Text>
                    <Text style={[styles.setTargetText, { flex: 1.2 }]}>
                      {defaultRepsNum} reps
                    </Text>
                    <View style={{ flex: 1.2, alignItems: 'center' }}>
                      <TouchableOpacity
                        style={[
                          styles.checkBtn,
                          isSetDone && styles.checkBtnDone,
                        ]}
                        onPress={() =>
                          !isSetDone && handleCompleteSet(i, defaultRepsNum, 0)
                        }
                      >
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={isSetDone ? '#000' : '#64748B'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* INSTRUCTIONS */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How to Perform</Text>
          {exData.instructions.map((step, idx) => (
            <View key={idx} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>{idx + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* NEXT EXERCISE / FINISH BUTTON */}
        <TouchableOpacity
          style={styles.nextExerciseBtn}
          activeOpacity={0.85}
          onPress={handleNextExercise}
        >
          <Text style={styles.nextExerciseBtnText}>
            {exerciseIndex + 1 === totalExercises ? 'Finish Workout 🎉' : 'Next Exercise →'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* REST TIMER OVERLAY */}
      {isResting && (
        <View style={styles.restOverlay}>
          <View style={styles.restCard}>
            <Text style={styles.restTitle}>REST & RECOVER</Text>
            <Text style={styles.restCountdown}>{restTimeRemaining}</Text>
            <Text style={styles.restUnit}>seconds remaining</Text>

            <TouchableOpacity style={styles.skipRestBtn} onPress={skipRest}>
              <Text style={styles.skipRestText}>Skip Rest</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Dark gym theme
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  progressBarTrack: {
    width: '100%',
    maxWidth: 160,
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  exerciseTitle: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  altNameText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  chipText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },

  // DEMO CARD
  demoCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  demoHeaderText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  demoImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#020617',
  },
  demoImage: {
    width: '100%',
    height: '100%',
  },

  // EXECUTION CARD
  executionCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  timerLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timerDisplay: {
    color: '#FFF',
    fontSize: 56,
    fontWeight: '900',
    marginVertical: 10,
    fontVariant: ['tabular-nums'],
  },
  timerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  timerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
  },
  timerStartBtn: {
    backgroundColor: Colors.primary,
  },
  timerPauseBtn: {
    backgroundColor: '#F59E0B',
  },
  timerActionBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
  },
  timerResetBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // REP TABLE
  setsTable: {
    gap: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  colHeader: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  setRowCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  setNumberText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  setTargetText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  checkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBtnDone: {
    backgroundColor: Colors.primary,
  },

  // INSTRUCTIONS
  instructionsCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  instructionsTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumber: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 20,
  },

  // NEXT BTN
  nextExerciseBtn: {
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
  },
  nextExerciseBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
  },

  // REST OVERLAY
  restOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: 24,
  },
  restCard: {
    alignItems: 'center',
  },
  restTitle: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16,
  },
  restCountdown: {
    color: '#FFF',
    fontSize: 80,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  restUnit: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    marginTop: -8,
    marginBottom: 36,
  },
  skipRestBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  skipRestText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // ERROR
  errorBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  navBackBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2563EB',
    borderRadius: 16,
  },
  navBackText: {
    color: '#FFF',
    fontWeight: '700',
  },
});
