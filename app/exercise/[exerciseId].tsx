import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from '../../constants/colors';
import { EXERCISES } from '../../constants/exercises';
import { WORKOUTS } from '../../constants/workouts';
import { CHALLENGES } from '../../constants/challenges';
import { useChallengeStore } from '../../store/challengeStore';

export default function ExerciseExecutionScreen() {
  const { exerciseId, day, index } = useLocalSearchParams();
  const router = useRouter();
  
  const dayNumber = parseInt(day as string, 10);
  const exerciseIndex = parseInt(index as string, 10);
  
  const challenge = CHALLENGES['14-day-muscle'];
  const dayData = challenge.days.find(d => d.day === dayNumber);
  const workout = WORKOUTS[dayData?.workoutId || ''];
  const workoutEx = workout?.exercises[exerciseIndex];
  const exData = EXERCISES[exerciseId as string];

  const { currentWorkoutProgress, saveSetProgress } = useChallengeStore();
  const currentSets = currentWorkoutProgress[exerciseId as string] || [];

  // State for Rest Timer
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // State for Camera Form Record
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (isResting && restTimeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setRestTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (isResting && restTimeRemaining === 0) {
      setIsResting(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isResting, restTimeRemaining]);

  if (!exData || !workoutEx) return null;

  const handleCompleteSet = (setIndex: number, reps: number, weight: number) => {
    saveSetProgress(exData.id, setIndex, { reps, weight, completed: true });
    // Start Rest Timer
    if (setIndex < workoutEx.sets - 1) {
      setRestTimeRemaining(workoutEx.restSeconds);
      setIsResting(true);
    }
  };

  const skipRest = () => {
    setIsResting(false);
    setRestTimeRemaining(0);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleNext = () => {
    const nextIndex = exerciseIndex + 1;
    if (nextIndex < workout.exercises.length) {
      const nextEx = workout.exercises[nextIndex];
      router.replace(`/exercise/${nextEx.exerciseId}?day=${dayNumber}&index=${nextIndex}`);
    } else {
      router.replace(`/workout/complete?day=${dayNumber}`);
    }
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission required', 'Camera permission is needed to record your form.');
        return;
      }
    }
    setShowCamera(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.progressHeader}>
          <Text style={styles.headerTitle}>Exercise {exerciseIndex + 1} of {workout.exercises.length}</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${((exerciseIndex + 1) / workout.exercises.length) * 100}%` }]} />
          </View>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={openCamera}>
          <Ionicons name="videocam-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Video Player */}
        <View style={styles.videoContainer}>
          <Video
            source={{ uri: exData.videoUrl }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay
            posterSource={{ uri: exData.thumbnail }}
            usePoster
          />
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.exName}>{exData.name}</Text>
          <Text style={styles.exMeta}>{exData.muscleGroup} • {exData.level}</Text>
          <Text style={styles.exGoal}>{workoutEx.sets} Sets × {workoutEx.reps} Reps</Text>
        </View>

        <View style={styles.instructionsSection}>
          <Text style={styles.sectionTitle}>How to perform</Text>
          {exData.instructions.map((inst, i) => (
            <View key={i} style={styles.instructionRow}>
              <Text style={styles.instructionNum}>{i + 1}</Text>
              <Text style={styles.instructionText}>{inst}</Text>
            </View>
          ))}
        </View>

        <View style={styles.setsSection}>
          <View style={styles.setRowHeader}>
            <Text style={[styles.setColHeader, { flex: 0.5 }]}>SET</Text>
            <Text style={[styles.setColHeader, { flex: 1 }]}>KG</Text>
            <Text style={[styles.setColHeader, { flex: 1 }]}>REPS</Text>
            <Text style={[styles.setColHeader, { flex: 1, textAlign: 'center' }]}>DONE</Text>
          </View>

          {Array.from({ length: workoutEx.sets }).map((_, i) => {
            const isCompleted = currentSets[i]?.completed;
            return (
              <SetRow 
                key={i} 
                index={i} 
                defaultReps={typeof workoutEx.reps === 'number' ? workoutEx.reps : 0} 
                isCompleted={isCompleted}
                onComplete={(reps, weight) => handleCompleteSet(i, reps, weight)}
              />
            );
          })}
        </View>
        
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {exerciseIndex + 1 === workout.exercises.length ? 'Finish Workout' : 'Next Exercise'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Rest Timer Overlay */}
      {isResting && (
        <View style={styles.restOverlay}>
          <View style={styles.restCard}>
            <Text style={styles.restTitle}>REST</Text>
            <Text style={styles.restTime}>{restTimeRemaining}</Text>
            <Text style={styles.restSub}>seconds</Text>
            
            <TouchableOpacity style={styles.skipRestBtn} onPress={skipRest}>
              <Text style={styles.skipRestText}>Skip Rest</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.cameraContainer}>
          <CameraView style={StyleSheet.absoluteFillObject} facing="front" />
          <SafeAreaView style={styles.cameraOverlay}>
            <TouchableOpacity style={styles.cameraClose} onPress={() => setShowCamera(false)}>
              <Ionicons name="close" size={32} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.cameraBottom}>
              <TouchableOpacity style={styles.recordBtn}>
                <View style={styles.recordBtnInner} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SetRow({ index, defaultReps, isCompleted, onComplete }: { index: number, defaultReps: number, isCompleted: boolean, onComplete: (reps: number, weight: number) => void }) {
  const [reps, setReps] = useState(defaultReps.toString());
  const [weight, setWeight] = useState('');

  return (
    <View style={[styles.setRow, isCompleted && styles.setRowCompleted]}>
      <Text style={[styles.setNum, { flex: 0.5 }]}>{index + 1}</Text>
      <TextInput
        style={[styles.input, { flex: 1 }]}
        keyboardType="numeric"
        placeholder="-"
        placeholderTextColor="#555"
        value={weight}
        onChangeText={setWeight}
        editable={!isCompleted}
      />
      <TextInput
        style={[styles.input, { flex: 1 }]}
        keyboardType="numeric"
        placeholder={defaultReps.toString()}
        placeholderTextColor="#555"
        value={reps}
        onChangeText={setReps}
        editable={!isCompleted}
      />
      <View style={{ flex: 1, alignItems: 'center' }}>
        <TouchableOpacity 
          style={[styles.checkBtn, isCompleted && styles.checkBtnActive]}
          onPress={() => !isCompleted && onComplete(parseInt(reps) || 0, parseInt(weight) || 0)}
          disabled={isCompleted}
        >
          <Ionicons name="checkmark" size={18} color={isCompleted ? "#000" : "#888"} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, height: 56, borderBottomWidth: 1, borderBottomColor: '#222' },
  iconBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  progressHeader: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  progressBarBg: { width: 120, height: 4, backgroundColor: '#222', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary },
  content: { paddingBottom: 100 },
  videoContainer: { width: '100%', aspectRatio: 16/9, backgroundColor: '#111' },
  video: { width: '100%', height: '100%' },
  infoSection: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#111' },
  exName: { color: '#FFF', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  exMeta: { color: Colors.primary, fontSize: 14, fontWeight: '600', marginBottom: 12 },
  exGoal: { color: '#CCC', fontSize: 16, fontWeight: '500' },
  instructionsSection: { padding: 20 },
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 16 },
  instructionRow: { flexDirection: 'row', marginBottom: 12, paddingRight: 20 },
  instructionNum: { color: '#888', fontSize: 14, fontWeight: '700', width: 24 },
  instructionText: { color: '#CCC', fontSize: 14, lineHeight: 20, flex: 1 },
  setsSection: { padding: 20, paddingTop: 0 },
  setRowHeader: { flexDirection: 'row', marginBottom: 12, paddingHorizontal: 12 },
  setColHeader: { color: '#888', fontSize: 12, fontWeight: '600' },
  setRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 12, padding: 8, marginBottom: 8 },
  setRowCompleted: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  setNum: { color: '#FFF', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  input: { backgroundColor: '#222', borderRadius: 8, color: '#FFF', fontSize: 16, fontWeight: '600', textAlign: 'center', height: 40, marginHorizontal: 4 },
  checkBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
  checkBtnActive: { backgroundColor: Colors.primary },
  nextBtn: { backgroundColor: '#FFF', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', margin: 20, marginTop: 10 },
  nextBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  restOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  restCard: { alignItems: 'center' },
  restTitle: { color: Colors.primary, fontSize: 20, fontWeight: '800', letterSpacing: 2, marginBottom: 20 },
  restTime: { color: '#FFF', fontSize: 72, fontWeight: '900' },
  restSub: { color: '#888', fontSize: 16, marginTop: -10, marginBottom: 40 },
  skipRestBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30, borderWidth: 1, borderColor: '#444' },
  skipRestText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  cameraOverlay: { flex: 1, justifyContent: 'space-between' },
  cameraClose: { alignSelf: 'flex-start', padding: 20 },
  cameraBottom: { padding: 40, alignItems: 'center' },
  recordBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  recordBtnInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#EF4444' },
});
