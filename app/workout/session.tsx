import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Platform, Alert, Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/colors';
import { EXERCISES, Exercise } from '../../constants/exercises';
import { useUserStore } from '../../store/userStore';
import { supabase } from '../../lib/supabase';
import { soundEngine } from '../../lib/soundHelper';
import AnatomicalVisualizer from '../../components/workout/AnatomicalVisualizer';
import FormCameraRecorder from '../../components/workout/FormCameraRecorder';

interface SetRowData {
  id: number;
  last: string;
  reps: string;
  weight: string;
  completed: boolean;
}

export default function ActiveWorkoutSessionScreen() {
  const { exerciseId, day, index } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUserStore();

  const id = (exerciseId as string) || 'pushup';
  const exData: Exercise = EXERCISES[id] || EXERCISES['pushup'];

  // ── Workout Stopwatch Timer (Time: 00:00) ──────────────────
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ── Sound State ───────────────────────────────────────────
  const [soundEnabled, setSoundEnabled] = useState(true);
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.setEnabled(next);
  };

  // ── Rest Timer State ──────────────────────────────────────
  const [restDuration, setRestDuration] = useState(exData.defaultRestSeconds || 60);
  const [isResting, setIsResting] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);
  const restTimerRef = useRef<any>(null);

  useEffect(() => {
    if (isResting && restRemaining > 0) {
      restTimerRef.current = setTimeout(() => {
        setRestRemaining(prev => prev - 1);
        if (restRemaining <= 4 && restRemaining > 1) {
          soundEngine.play('tick');
        }
      }, 1000);
    } else if (isResting && restRemaining === 0) {
      setIsResting(false);
      soundEngine.play('restEnd');
      soundEngine.speak("Rest is over! Let's go.");
    }
    return () => {
      if (restTimerRef.current) clearTimeout(restTimerRef.current);
    };
  }, [isResting, restRemaining]);

  // ── Sets Table State (Matching Image 3) ───────────────────
  const [sets, setSets] = useState<SetRowData[]>([
    { id: 1, last: '-', reps: '15', weight: '0', completed: false },
    { id: 2, last: '-', reps: '12', weight: '0', completed: false },
    { id: 3, last: '-', reps: '10', weight: '0', completed: false },
  ]);
  const [activeSetIndex, setActiveSetIndex] = useState(0);

  // Load previous session sets from Supabase
  useEffect(() => {
    const fetchPreviousSets = async () => {
      if (!user?.uid) return;
      try {
        const { data } = await supabase
          .from('exercise_set_logs')
          .select('set_number, reps, weight_kg')
          .eq('user_uid', user.uid)
          .eq('exercise_id', id)
          .order('created_at', { ascending: false })
          .limit(sets.length);

        if (data && data.length > 0) {
          setSets(prev =>
            prev.map((s, idx) => {
              const prevMatch = data.find((d: any) => d.set_number === s.id);
              return {
                ...s,
                last: prevMatch ? `${prevMatch.reps} reps` : '-',
              };
            })
          );
        }
      } catch (_) {}
    };
    fetchPreviousSets();
  }, [id, user?.uid]);

  // ── Modals & Controls State ───────────────────────────────
  const [showCamera, setShowCamera] = useState(false);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [showTechniqueModal, setShowTechniqueModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [gender, setGender] = useState<'M' | 'F'>('M');

  // ── Dynamic Actions: Add Set ──────────────────────────────
  const handleAddSet = () => {
    setSets(prev => [
      ...prev,
      {
        id: prev.length + 1,
        last: '-',
        reps: prev[prev.length - 1]?.reps || '10',
        weight: prev[prev.length - 1]?.weight || '0',
        completed: false,
      },
    ]);
  };

  const handleUpdateReps = (index: number, val: string) => {
    setSets(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], reps: val };
      return copy;
    });
  };

  // ── Log Set CTA ───────────────────────────────────────────
  const handleLogSet = async () => {
    const targetIdx = activeSetIndex < sets.length ? activeSetIndex : sets.findIndex(s => !s.completed);
    if (targetIdx === -1) {
      // All sets already logged -> Finish workout
      handleFinishWorkout();
      return;
    }

    // Mark current set completed
    const updatedSets = [...sets];
    const currentSet = { ...updatedSets[targetIdx], completed: true };
    updatedSets[targetIdx] = currentSet;
    setSets(updatedSets);

    soundEngine.play('success');

    // Save set to Supabase asynchronously
    if (user?.uid) {
      supabase.from('exercise_set_logs').insert({
        user_uid: user.uid,
        exercise_id: id,
        set_number: currentSet.id,
        reps: parseInt(currentSet.reps, 10) || 0,
        weight_kg: parseFloat(currentSet.weight) || 0,
        completed: true,
      }).then(() => {}).catch(() => {});
    }

    // Cache locally
    const cacheKey = `logged_sets_${id}_${new Date().toDateString()}`;
    AsyncStorage.setItem(cacheKey, JSON.stringify(updatedSets)).catch(() => {});

    // Check if more sets remain
    const nextIncomplete = updatedSets.findIndex((s, i) => i > targetIdx && !s.completed);
    if (nextIncomplete !== -1) {
      setActiveSetIndex(nextIncomplete);
      // Trigger Rest Countdown
      setRestRemaining(restDuration);
      setIsResting(true);
      soundEngine.speak(`Set ${currentSet.id} logged. Rest for ${restDuration} seconds.`);
    } else {
      // All completed
      setActiveSetIndex(updatedSets.length);
      soundEngine.speak("All sets completed! Fantastic job!");
    }
  };

  const skipRest = () => {
    setIsResting(false);
    setRestRemaining(0);
    if (restTimerRef.current) clearTimeout(restTimerRef.current);
  };

  // ── Finish Workout ────────────────────────────────────────
  const handleFinishWorkout = async () => {
    const completedCount = sets.filter(s => s.completed).length;
    const totalRepsLogged = sets.filter(s => s.completed).reduce((sum, s) => sum + (parseInt(s.reps, 10) || 0), 0);

    // Save workout summary log to Supabase
    if (user?.uid) {
      try {
        await supabase.from('workout_logs').insert({
          user_uid: user.uid,
          challenge_id: '30-days-better-you',
          workout_title: exData.name,
          duration_seconds: secondsElapsed,
          total_volume_kg: totalRepsLogged * 5, // estimated tonnage
          calories_burned: Math.round(secondsElapsed * 0.15) + 20,
        });
      } catch (_) {}
    }

    router.replace({
      pathname: '/workout/complete',
      params: {
        day: day || '1',
        time: secondsElapsed.toString(),
        reps: totalRepsLogged.toString(),
        sets: completedCount.toString(),
      },
    });
  };

  const isAllCompleted = sets.length > 0 && sets.every(s => s.completed);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Top Bar (Matching Image 3) ────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setShowDiscardModal(true)}
        >
          <Ionicons name="close" size={26} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.timeText}>Time: {formatTime(secondsElapsed)}</Text>

        <View style={styles.topRightActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={toggleSound}>
            <Ionicons
              name={soundEnabled ? 'volume-high-outline' : 'volume-mute-outline'}
              size={22}
              color={soundEnabled ? Colors.primary : '#94A3B8'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowTechniqueModal(true)}
          >
            <Ionicons name="information-circle-outline" size={24} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleFinishWorkout} style={styles.finishBtn}>
            <Text style={styles.finishText}>Finish</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* ── Central Exercise Stage with Left Floating Tools ──── */}
        <View style={styles.stageRow}>
          {/* Left Vertical Tools (Matching Image 3) */}
          <View style={styles.leftTools}>
            <TouchableOpacity
              style={styles.toolCircle}
              onPress={() => setShowCoachModal(true)}
            >
              <Ionicons name="sparkles-outline" size={18} color="#38BDF8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolCircle}
              onPress={() => setShowTechniqueModal(true)}
            >
              <Ionicons name="bulb-outline" size={18} color="#FBBF24" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolCircle}
              onPress={() => router.push('/(tabs)/index')}
            >
              <Ionicons name="list-outline" size={18} color="#A78BFA" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolCircle}
              onPress={() => {
                setRestRemaining(restDuration);
                setIsResting(true);
              }}
            >
              <Ionicons name="stopwatch-outline" size={18} color="#34D399" />
            </TouchableOpacity>
          </View>

          {/* Central Animated Player Area */}
          <View style={styles.playerContainer}>
            <AnatomicalVisualizer
              exercise={exData}
              gender={gender}
              onGenderChange={setGender}
              showStartButton={false}
              isLiveWorkout={true}
            />

            {/* Top-Right PiP Camera Preview Trigger */}
            <TouchableOpacity
              style={styles.cameraThumbBtn}
              onPress={() => setShowCamera(true)}
            >
              <Ionicons name="add" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Exercise Status & Chips (Matching Image 3) ──────── */}
        <View style={styles.exerciseStatusRow}>
          <View>
            <View style={styles.levelBars}>
              {[1, 2, 3, 4, 5].map(lvl => (
                <View
                  key={lvl}
                  style={[
                    styles.levelBar,
                    lvl <= exData.level && styles.levelBarFilled,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.exerciseNameText}>{exData.name}</Text>
            <Text style={styles.restLabelText}>⏱ {restDuration} sec rest</Text>
          </View>

          <View style={styles.statusChips}>
            <TouchableOpacity
              style={styles.statusChip}
              onPress={() => setShowCoachModal(true)}
            >
              <Ionicons name="sparkles" size={14} color="#38BDF8" />
              <Text style={styles.statusChipText}>Coach</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statusChip}
              onPress={() => setShowEditModal(true)}
            >
              <Ionicons name="pencil-outline" size={14} color="#FFF" />
              <Text style={styles.statusChipText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Interactive Sets Table (Matching Image 3) ────────── */}
        <View style={styles.tableCard}>
          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableColTitle, { flex: 0.8, textAlign: 'left' }]}>
              Sets
            </Text>
            <Text style={[styles.tableColTitle, { flex: 1, textAlign: 'center' }]}>
              Last
            </Text>
            <Text style={[styles.tableColTitle, { flex: 1, textAlign: 'right' }]}>
              Reps
            </Text>
          </View>

          {/* Set Rows */}
          {sets.map((row, idx) => {
            const isActive = idx === activeSetIndex;
            return (
              <View
                key={row.id}
                style={[
                  styles.tableRow,
                  row.completed && styles.tableRowCompleted,
                  isActive && styles.tableRowActive,
                ]}
              >
                {/* Set # */}
                <View style={{ flex: 0.8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.setNumText, row.completed && { color: Colors.primary }]}>
                    {row.id}
                  </Text>
                  {row.completed && (
                    <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                  )}
                </View>

                {/* Last */}
                <Text style={[styles.lastText, { flex: 1, textAlign: 'center' }]}>
                  {row.last}
                </Text>

                {/* Reps Input */}
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <TextInput
                    style={[
                      styles.repsInput,
                      row.completed && styles.repsInputCompleted,
                      isActive && styles.repsInputActive,
                    ]}
                    keyboardType="numeric"
                    value={row.reps}
                    onChangeText={val => handleUpdateReps(idx, val)}
                    placeholder="-"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>
            );
          })}

          {/* + Add a Set Button */}
          <TouchableOpacity style={styles.addSetBtn} onPress={handleAddSet}>
            <Ionicons name="add-circle-outline" size={20} color="#38BDF8" />
            <Text style={styles.addSetText}>Add a set</Text>
          </TouchableOpacity>
        </View>

        {/* ── Big Bottom CTA: Log Set / Finish ────────────────── */}
        <TouchableOpacity
          style={[styles.logSetBtn, isAllCompleted && styles.logSetBtnFinished]}
          activeOpacity={0.85}
          onPress={handleLogSet}
        >
          <Ionicons
            name={isAllCompleted ? 'trophy-outline' : 'checkmark'}
            size={22}
            color="#FFF"
          />
          <Text style={styles.logSetBtnText}>
            {isAllCompleted
              ? 'Finish Workout'
              : `✓ Log set ${activeSetIndex < sets.length ? sets[activeSetIndex].id : sets.length}`}
          </Text>
        </TouchableOpacity>

        {/* Extra Bottom Spacing */}
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ── 60s Rest Timer Overlay (When Resting) ─────────────── */}
      {isResting && (
        <View style={styles.restFloatingCard}>
          <View style={styles.restHeader}>
            <Text style={styles.restTitleText}>REST TIMER</Text>
            <TouchableOpacity onPress={skipRest} style={styles.skipBtn}>
              <Text style={styles.skipBtnText}>Skip ➔</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.restCountdownNumber}>{restRemaining}s</Text>

          <View style={styles.restActionsRow}>
            <TouchableOpacity
              style={styles.addTimeBtn}
              onPress={() => setRestRemaining(prev => prev + 30)}
            >
              <Text style={styles.addTimeText}>+30s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addTimeBtn, { backgroundColor: Colors.primary }]}
              onPress={skipRest}
            >
              <Text style={[styles.addTimeText, { color: '#000' }]}>Start Next Set</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Discard Confirmation Modal ────────────────────────── */}
      <Modal visible={showDiscardModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>End Workout?</Text>
            <Text style={styles.modalDesc}>
              Do you want to save your completed sets or discard this session?
            </Text>
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colors.primary }]}
                onPress={() => {
                  setShowDiscardModal(false);
                  handleFinishWorkout();
                }}
              >
                <Text style={[styles.modalBtnText, { color: '#000' }]}>Save & Finish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: '#EF4444' }]}
                onPress={() => {
                  setShowDiscardModal(false);
                  router.back();
                }}
              >
                <Text style={[styles.modalBtnText, { color: '#EF4444' }]}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: 'transparent' }]}
                onPress={() => setShowDiscardModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: '#94A3B8' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Edit Rest Duration Modal ──────────────────────────── */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Adjust Rest Time</Text>
            <View style={styles.restOptionsRow}>
              {[30, 45, 60, 90, 120].map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.restOptionBtn, restDuration === s && styles.restOptionBtnActive]}
                  onPress={() => {
                    setRestDuration(s);
                    setShowEditModal(false);
                  }}
                >
                  <Text style={[styles.restOptionText, restDuration === s && styles.restOptionTextActive]}>
                    {s}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Technique Tips Modal ──────────────────────────────── */}
      <Modal visible={showTechniqueModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{exData.name} Technique</Text>
              <TouchableOpacity onPress={() => setShowTechniqueModal(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {exData.instructions.map((inst, i) => (
                <View key={i} style={styles.techniqueRow}>
                  <Text style={styles.techniqueNum}>{i + 1}</Text>
                  <Text style={styles.techniqueText}>{inst}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── AI Coach Tips Modal ───────────────────────────────── */}
      <Modal visible={showCoachModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="sparkles" size={20} color={Colors.primary} />
                <Text style={styles.modalTitle}>AI Coach Live Cues</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCoachModal(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDesc}>
              "Push down hard into the floor! Think about screwing your hands into the ground to externally rotate your shoulders. Maintain steady breathing."
            </Text>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: Colors.primary }]}
              onPress={() => setShowCoachModal(false)}
            >
              <Text style={[styles.modalBtnText, { color: '#000' }]}>Got It!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Form Camera Recorder */}
      <FormCameraRecorder visible={showCamera} onClose={() => setShowCamera(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  finishBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  finishText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
  },
  leftTools: {
    flexDirection: 'column',
    gap: 12,
    paddingTop: 8,
  },
  toolCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  playerContainer: {
    flex: 1,
    position: 'relative',
  },
  cameraThumbBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(59,130,246,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  exerciseStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  levelBars: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 4,
  },
  levelBar: {
    width: 8,
    height: 10,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  levelBarFilled: {
    backgroundColor: '#3B82F6',
  },
  exerciseNameText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  restLabelText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  statusChips: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusChipText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tableCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tableColTitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  tableRowActive: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  tableRowCompleted: {
    opacity: 0.85,
  },
  setNumText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  lastText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  repsInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    textAlign: 'center',
    minWidth: 60,
  },
  repsInputActive: {
    borderColor: '#3B82F6',
    borderWidth: 1.5,
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  repsInputCompleted: {
    color: Colors.primary,
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 8,
  },
  addSetText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '600',
  },
  logSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 20,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  logSetBtnFinished: {
    backgroundColor: Colors.primary,
  },
  logSetBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  restFloatingCard: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#38BDF8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  restHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restTitleText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  skipBtn: {
    padding: 4,
  },
  skipBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  restCountdownNumber: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
    marginVertical: 4,
  },
  restActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  addTimeBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  addTimeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  modalDesc: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 22,
    marginVertical: 14,
  },
  modalBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  techniqueRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  techniqueNum: {
    color: '#38BDF8',
    fontWeight: '800',
    fontSize: 13,
  },
  techniqueText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
  },
  restOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  restOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  restOptionBtnActive: {
    backgroundColor: '#3B82F6',
  },
  restOptionText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  restOptionTextActive: {
    color: '#FFF',
  },
});
