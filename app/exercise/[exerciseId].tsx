import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { EXERCISES } from '../../constants/exercises';
import { getWorkoutForDay } from '../../constants/workouts';
import { useChallengeStore } from '../../store/challengeStore';
import LeapFitnessCharacter from '../../components/workout/LeapFitnessCharacter';
import WorkoutRestScreen from '../../components/workout/WorkoutRestScreen';
import WorkoutCountdownOverlay from '../../components/workout/WorkoutCountdownOverlay';
import { voiceCoach } from '../../lib/voiceCoach';
import { Audio } from 'expo-av';

export default function LeapFitnessWorkoutPlayer() {
  const router = useRouter();
  const { exerciseId, day, index } = useLocalSearchParams();

  const dayNumber = parseInt((day as string) || '1', 10);
  const exerciseIndex = parseInt((index as string) || '0', 10);

  const { activeGoal, completeDay } = useChallengeStore();
  const workout = getWorkoutForDay(activeGoal, dayNumber);
  const totalExercises = workout?.exercises.length || 15;
  const workoutEx = workout?.exercises[exerciseIndex];
  const exData = EXERCISES[(exerciseId as string) || 'high-stepping'] || EXERCISES['high-stepping'];

  // Timer & Play/Pause State
  const isTimeBased = exData.isTimeBased || typeof workoutEx?.reps === 'string';
  const targetSeconds = workoutEx?.durationSeconds || exData.defaultDurationSeconds || 20;

  const [secondsRemaining, setSecondsRemaining] = useState(targetSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  // Settings & Instructions Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Rest Screen & Countdown State
  const [isResting, setIsResting] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(true);

  const timerRef = useRef<any>(null);

  const playTakeRestSound = async () => {
    if (!soundEnabled) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/take_rest.mp3'),
        { shouldPlay: true, volume: 1.0 }
      );
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (e) {
      // audio error non-blocking
    }
  };

  // Reset timer when exercise changes
  useEffect(() => {
    setSecondsRemaining(targetSeconds);
    setIsPaused(false);
    setIsResting(false);
    setIsCountingDown(true);
    setFeedback(null);
  }, [exerciseIndex, exerciseId, targetSeconds]);

  // Sync soundEnabled with voiceCoach
  useEffect(() => {
    voiceCoach.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Main exercise countdown timer
  useEffect(() => {
    if (isResting || isCountingDown) {
      return;
    }

    if (isTimeBased && !isPaused && secondsRemaining > 0) {
      if (secondsRemaining === Math.floor(targetSeconds / 2) && targetSeconds >= 20) {
        voiceCoach.announceHalfway();
      } else if (secondsRemaining <= 3) {
        voiceCoach.playTone(720, 100);
      }
      timerRef.current = setTimeout(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (isTimeBased && secondsRemaining === 0 && !isResting) {
      // Completed exercise -> Trigger Rest Screen!
      handleTriggerRest();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPaused, secondsRemaining, isResting, isCountingDown, isTimeBased, targetSeconds]);

  const handleTriggerRest = () => {
    if (exerciseIndex + 1 < totalExercises) {
      voiceCoach.playTone(520, 150);
      setIsResting(true);
    } else {
      // Last exercise finished! Finish Workout!
      handleFinishWorkout();
    }
  };

  const handleEndRest = () => {
    setIsResting(false);
    handleNextExercise();
  };

  const handleNextExercise = () => {
    const nextIndex = exerciseIndex + 1;
    if (nextIndex < totalExercises && workout) {
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
      handleFinishWorkout();
    }
  };

  const handlePrevExercise = () => {
    if (exerciseIndex > 0 && workout) {
      const prevIndex = exerciseIndex - 1;
      const prevEx = workout.exercises[prevIndex];
      router.replace({
        pathname: '/exercise/[exerciseId]',
        params: {
          exerciseId: prevEx.exerciseId,
          day: dayNumber.toString(),
          index: prevIndex.toString(),
        },
      } as any);
    }
  };

  const handleFinishWorkout = () => {
    voiceCoach.announceComplete();
    completeDay(dayNumber);
    Alert.alert(
      '🎉 Workout Complete!',
      `You crushed Day ${dayNumber}! Your streak has increased. Keep up the great work!`,
      [
        {
          text: 'Return to Calendar',
          onPress: () => router.replace('/challenge'),
        },
      ]
    );
  };

  const handleConfirmExit = () => {
    setIsPaused(true);
    Alert.alert(
      'Pause Workout?',
      'Are you sure you want to quit this workout session?',
      [
        { text: 'Resume', onPress: () => setIsPaused(false) },
        { text: 'Quit', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  // Progress percentage for pause pill
  const progressRatio = isTimeBased
    ? Math.max(0, Math.min(1, (targetSeconds - secondsRemaining) / targetSeconds))
    : 1;

  const nextExData =
    workout && exerciseIndex + 1 < totalExercises
      ? EXERCISES[workout.exercises[exerciseIndex + 1].exerciseId]
      : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP SEGMENTED PROGRESS BAR (15 dashes matching Image 2!) */}
      <View style={styles.segmentedBarContainer}>
        {Array.from({ length: totalExercises }).map((_, i) => {
          const isDone = i < exerciseIndex;
          const isCurrent = i === exerciseIndex;
          return (
            <View
              key={i}
              style={[
                styles.segmentDash,
                isDone && styles.segmentDashDone,
                isCurrent && styles.segmentDashCurrent,
              ]}
            />
          );
        })}
      </View>

      {/* TOP ACTION BAR (Back arrow + Settings, Fullscreen, Music, Video icons) */}
      <View style={styles.topToolbar}>
        <TouchableOpacity
          style={styles.circleIconBtn}
          onPress={handleConfirmExit}
        >
          <Ionicons name="arrow-back" size={22} color="#475569" />
        </TouchableOpacity>

        <View style={styles.topRightIcons}>
          <TouchableOpacity
            style={styles.circleIconBtn}
            onPress={() => setShowSettings(true)}
          >
            <Ionicons name="settings-outline" size={20} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.circleIconBtn}>
            <Ionicons name="scan-outline" size={20} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circleIconBtn}
            onPress={() => setSoundEnabled(!soundEnabled)}
          >
            <Ionicons
              name={soundEnabled ? 'musical-notes' : 'volume-mute-outline'}
              size={20}
              color={soundEnabled ? '#2563EB' : '#94A3B8'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circleIconBtn}
            onPress={() => setShowInfo(true)}
          >
            <Ionicons name="videocam-outline" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* CENTER: 2D ANIMATED LEAP FITNESS CHARACTER (Matching Image 2!) */}
      <View style={styles.characterCenterContainer}>
        <LeapFitnessCharacter
          exerciseId={exData.id}
          isPaused={isPaused || isResting}
        />
      </View>

      {/* BOTTOM EXERCISE INFO (Timer, Name, ? icon, Feedback thumbs) */}
      <View style={styles.bottomSection}>
        {/* Giant Timer or Reps */}
        <View style={styles.timerRow}>
          {isTimeBased ? (
            <Text style={styles.giantTimerText}>
              00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
            </Text>
          ) : (
            <Text style={styles.giantTimerText}>
              x {workoutEx?.reps || exData.defaultReps}
            </Text>
          )}

          {/* Feedback buttons 👍 👎 */}
          <View style={styles.feedbackContainer}>
            <TouchableOpacity
              style={[
                styles.feedbackBtn,
                feedback === 'down' && styles.feedbackBtnActive,
              ]}
              onPress={() => setFeedback(feedback === 'down' ? null : 'down')}
            >
              <Ionicons
                name="thumbs-down-outline"
                size={20}
                color={feedback === 'down' ? '#EF4444' : '#94A3B8'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.feedbackBtn,
                feedback === 'up' && styles.feedbackBtnActive,
              ]}
              onPress={() => setFeedback(feedback === 'up' ? null : 'up')}
            >
              <Ionicons
                name="thumbs-up-outline"
                size={20}
                color={feedback === 'up' ? '#2563EB' : '#94A3B8'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Exercise Name with ? Info Button */}
        <View style={styles.nameRow}>
          <Text style={styles.exerciseNameText}>
            {exData.name.toUpperCase()}
          </Text>
          <TouchableOpacity
            style={styles.questionCircle}
            onPress={() => setShowInfo(true)}
          >
            <Text style={styles.questionText}>?</Text>
          </TouchableOpacity>
        </View>

        {/* MEDIA CONTROLS (|◀, ❚❚ Pause/Play Pill, ▶|) */}
        <View style={styles.playerControlsRow}>
          {/* Previous Button */}
          <TouchableOpacity
            style={[
              styles.navControlBtn,
              exerciseIndex === 0 && styles.navControlBtnDisabled,
            ]}
            disabled={exerciseIndex === 0}
            onPress={handlePrevExercise}
          >
            <Ionicons
              name="play-skip-back"
              size={22}
              color={exerciseIndex === 0 ? '#CBD5E1' : '#0F172A'}
            />
          </TouchableOpacity>

          {/* Pause / Resume Pill Button (timed) OR Glowing DONE button (rep-based) */}
          {isTimeBased ? (
            <TouchableOpacity
              style={styles.pausePillBtn}
              activeOpacity={0.88}
              onPress={() => setIsPaused(!isPaused)}
            >
              {/* Animated Blue Progress Fill */}
              <View
                style={[
                  styles.pausePillFill,
                  { width: `${progressRatio * 100}%` },
                ]}
              />
              <Ionicons
                name={isPaused ? 'play' : 'pause'}
                size={26}
                color="#0F172A"
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.donePillBtn}
              activeOpacity={0.85}
              onPress={handleTriggerRest}
            >
              <Ionicons name="checkmark-sharp" size={24} color="#000000" />
              <Text style={styles.doneBtnText}>DONE</Text>
            </TouchableOpacity>
          )}

          {/* Next / Skip Button */}
          <TouchableOpacity
            style={styles.navControlBtn}
            onPress={handleTriggerRest}
          >
            <Ionicons name="play-skip-forward" size={22} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* AUTHENTIC LEAP FITNESS BLUE REST SCREEN */}
      {isResting && nextExData && (
        <View style={styles.fullScreenRestContainer}>
          <WorkoutRestScreen
            nextExerciseIndex={exerciseIndex + 1}
            totalExercises={totalExercises}
            nextExerciseId={workout?.exercises[exerciseIndex + 1]?.exerciseId || 'pushup'}
            nextExerciseName={nextExData.name}
            nextExerciseDuration={
              workout?.exercises[exerciseIndex + 1]?.durationSeconds ||
              (typeof workout?.exercises[exerciseIndex + 1]?.reps === 'number'
                ? (workout?.exercises[exerciseIndex + 1]?.reps as number) * 2
                : 20)
            }
            initialRestSeconds={workoutEx?.restSeconds || 15}
            onSkip={handleEndRest}
            onFinishRest={handleEndRest}
          />
        </View>
      )}

      {/* 3-2-1 COUNTDOWN OVERLAY BEFORE EXERCISE */}
      {isCountingDown && (
        <WorkoutCountdownOverlay
          soundEnabled={soundEnabled}
          onCountdownComplete={() => setIsCountingDown(false)}
        />
      )}

      {/* INSTRUCTIONS MODAL (?) */}
      <Modal
        visible={showInfo}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{exData.name}</Text>
              <TouchableOpacity onPress={() => setShowInfo(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <Text style={styles.instructionsHeading}>How to perform:</Text>
            {exData.instructions.map((inst, i) => (
              <View key={i} style={styles.instructionItem}>
                <Text style={styles.instructionNum}>{i + 1}.</Text>
                <Text style={styles.instructionText}>{inst}</Text>
              </View>
            ))}

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setShowInfo(false)}
            >
              <Text style={styles.closeModalText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SETTINGS MODAL */}
      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Workout Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setSoundEnabled(!soundEnabled)}
            >
              <Text style={styles.settingLabel}>Voice Coach & Beeps</Text>
              <Text style={[styles.settingStatus, { color: soundEnabled ? '#2563EB' : '#94A3B8' }]}>
                {soundEnabled ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Illustrations</Text>
              <Text style={[styles.settingStatus, { color: '#64748B', fontSize: 13, fontWeight: '600' }]}>
                RepDB (repdb.co)
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean White matching Image 2!
  },

  // SEGMENTED PROGRESS BAR (15 dashes across top)
  segmentedBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 4,
  },
  segmentDash: {
    flex: 1,
    height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  segmentDashDone: {
    backgroundColor: '#1D4ED8',
  },
  segmentDashCurrent: {
    backgroundColor: '#2563EB',
  },

  // TOP TOOLBAR
  topToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  circleIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // CENTER CHARACTER
  characterCenterContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
  },

  // BOTTOM SECTION
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  giantTimerText: {
    fontSize: 58,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  feedbackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackBtnActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },

  // NAME ROW
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  exerciseNameText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  questionCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // MEDIA CONTROLS
  playerControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  navControlBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navControlBtnDisabled: {
    opacity: 0.4,
  },
  pausePillBtn: {
    flex: 1,
    height: 60,
    marginHorizontal: 16,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pausePillFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#3B82F6',
    opacity: 0.2,
  },
  donePillBtn: {
    flex: 1,
    height: 60,
    marginHorizontal: 16,
    borderRadius: 30,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  doneBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },

  // FULL SCREEN REST CONTAINER
  fullScreenRestContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0D66FF',
    zIndex: 150,
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  instructionsHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 8,
  },
  instructionNum: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  closeModalBtn: {
    marginTop: 20,
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  settingStatus: {
    fontSize: 16,
    fontWeight: '800',
  },
});
