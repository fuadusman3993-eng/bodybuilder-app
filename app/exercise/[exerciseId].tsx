import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Share, Modal, Platform, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/colors';
import { EXERCISES, Exercise } from '../../constants/exercises';
import { useUserStore } from '../../store/userStore';
import { supabase } from '../../lib/supabase';
import AnatomicalVisualizer from '../../components/workout/AnatomicalVisualizer';
import RepsHistoryChart, { HistorySession } from '../../components/workout/RepsHistoryChart';

export default function ExerciseDetailScreen() {
  const { exerciseId, day, index } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUserStore();

  const id = (exerciseId as string) || 'pushup';
  const exData: Exercise = EXERCISES[id] || EXERCISES['pushup'];

  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [isFavorite, setIsFavorite] = useState(false);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [showLevelWhy, setShowLevelWhy] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [historySessions, setHistorySessions] = useState<HistorySession[]>([]);

  // ── Load Note & History from Supabase / AsyncStorage ──────────
  useEffect(() => {
    let isMounted = true;

    // 1. Load Note
    const loadNote = async () => {
      const cacheKey = `exercise_note_${user?.uid || 'guest'}_${id}`;
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached && isMounted) setNote(cached);

        if (user?.uid) {
          const { data } = await supabase
            .from('exercise_notes')
            .select('note')
            .eq('user_uid', user.uid)
            .eq('exercise_id', id)
            .maybeSingle();

          if (data?.note && isMounted) {
            setNote(data.note);
            AsyncStorage.setItem(cacheKey, data.note).catch(() => {});
          }
        }
      } catch (_) {}
    };

    // 2. Load History Sessions for Chart
    const loadHistory = async () => {
      const cacheKey = `exercise_history_${user?.uid || 'guest'}_${id}`;
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached && isMounted) {
          try { setHistorySessions(JSON.parse(cached)); } catch (_) {}
        }

        if (user?.uid) {
          const { data } = await supabase
            .from('exercise_set_logs')
            .select('reps, created_at')
            .eq('user_uid', user.uid)
            .eq('exercise_id', id)
            .order('created_at', { ascending: true })
            .limit(20);

          if (data && data.length > 0 && isMounted) {
            // Group into sessions by date
            const grouped: Record<string, number[]> = {};
            data.forEach((row: any) => {
              const d = new Date(row.created_at);
              const dayStr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
              if (!grouped[dayStr]) grouped[dayStr] = [];
              grouped[dayStr].push(row.reps || 0);
            });

            const parsedSessions: HistorySession[] = Object.keys(grouped).map(dayLabel => {
              const repsList = grouped[dayLabel];
              const maxReps = Math.max(...repsList, 0);
              const totalReps = repsList.reduce((a, b) => a + b, 0);
              return { date: dayLabel, maxReps, totalReps };
            });

            if (parsedSessions.length > 0) {
              setHistorySessions(parsedSessions);
              AsyncStorage.setItem(cacheKey, JSON.stringify(parsedSessions)).catch(() => {});
            }
          }
        }
      } catch (_) {}
    };

    loadNote();
    loadHistory();

    return () => { isMounted = false; };
  }, [id, user?.uid]);

  // ── Save Note to Supabase ─────────────────────────────────
  const handleSaveNote = async (text: string) => {
    setNote(text);
    const cacheKey = `exercise_note_${user?.uid || 'guest'}_${id}`;
    AsyncStorage.setItem(cacheKey, text).catch(() => {});

    if (!user?.uid) return;
    setSavingNote(true);
    try {
      await supabase.from('exercise_notes').upsert({
        user_uid: user.uid,
        exercise_id: id,
        note: text,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_uid,exercise_id' });
    } catch (_) {}
    finally { setSavingNote(false); }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: exData.name,
        message: `Check out ${exData.name} on BodyBuilder! ${exData.muscleGroup} exercise.`,
      });
    } catch (_) {}
  };

  const handleStartWorkout = () => {
    router.push({
      pathname: '/workout/session',
      params: {
        exerciseId: id,
        day: day || '1',
        index: index || '0',
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Top Header (Matching Image 2) ────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{exData.name}</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setIsFavorite(prev => !prev)}
          >
            <Ionicons
              name={isFavorite ? 'star' : 'star-outline'}
              size={22}
              color={isFavorite ? '#FBBF24' : '#FFF'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowInfoModal(true)}
          >
            <Ionicons name="information-circle-outline" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleShare}
          >
            <Ionicons name="ellipsis-vertical" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Sub Header: Share & Level 3 indicator */}
        <View style={styles.subHeaderRow}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color="#3B82F6" />
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>

          <View style={styles.levelWrap}>
            <Text style={styles.levelText}>{exData.levelLabel}</Text>
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
          </View>
        </View>

        {/* ── Anatomical 3D Visualizer with M/F & Speed ──────────── */}
        <AnatomicalVisualizer
          exercise={exData}
          gender={gender}
          onGenderChange={setGender}
          onStartWorkout={handleStartWorkout}
          showStartButton={true}
        />

        {/* ── Detail Chips Row ─────────────────────────────────── */}
        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={styles.chip}
            onPress={() => setShowLevelWhy(true)}
          >
            <Ionicons name="bar-chart-outline" size={14} color="#818CF8" />
            <Text style={styles.chipText}>
              {exData.levelLabel} · <Text style={{ color: '#3B82F6' }}>why?</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.chip}>
            <Ionicons name="swap-horizontal-outline" size={14} color="#34D399" />
            <Text style={styles.chipText}>{exData.movementType}</Text>
          </View>

          <View style={styles.chip}>
            <Ionicons name="trending-up-outline" size={14} color="#FBBF24" />
            <Text style={styles.chipText}>{exData.trackingType}</Text>
          </View>
        </View>

        {/* Also known as */}
        {exData.altName && (
          <Text style={styles.altNameText}>Also known as: {exData.altName}</Text>
        )}

        {/* ── Exercise Note (Matching Image 2) ─────────────────── */}
        <View style={styles.noteCard}>
          <View style={styles.noteHeader}>
            <Ionicons name="create-outline" size={18} color="#FFF" />
            <Text style={styles.noteTitle}>Exercise Note</Text>
            {savingNote && (
              <Text style={styles.savingBadge}>Saving...</Text>
            )}
          </View>
          <TextInput
            style={styles.noteInput}
            placeholder="Write your personal notes and tips"
            placeholderTextColor="#64748B"
            multiline
            value={note}
            onChangeText={handleSaveNote}
          />
        </View>

        {/* ── Reps History Bar Chart (Matching Image 2) ────────── */}
        <RepsHistoryChart sessions={historySessions} />

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating AI Coach Assistant Button (Bottom Right) */}
      <TouchableOpacity
        style={styles.floatingAiBtn}
        activeOpacity={0.85}
        onPress={() => setShowAiModal(true)}
      >
        <Ionicons name="sparkles" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* ── Level Why Modal ────────────────────────────────────── */}
      <Modal visible={showLevelWhy} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{exData.levelLabel} Difficulty</Text>
            <Text style={styles.modalDesc}>{exData.levelWhy}</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowLevelWhy(false)}
            >
              <Text style={styles.modalCloseText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── How to Perform Info Modal ──────────────────────────── */}
      <Modal visible={showInfoModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>How to Perform {exData.name}</Text>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.instructionHeading}>Execution Steps</Text>
              {exData.instructions.map((step, idx) => (
                <View key={idx} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}

              <Text style={[styles.instructionHeading, { marginTop: 16 }]}>Pro Form Tips</Text>
              {exData.formTips.map((tip, idx) => (
                <View key={idx} style={styles.stepRow}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                  <Text style={styles.stepText}>{tip}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── AI Coach Assistant Modal ───────────────────────────── */}
      <Modal visible={showAiModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="sparkles" size={20} color={Colors.primary} />
                <Text style={styles.modalTitle}>AI Coach Advice</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAiModal(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDesc}>
              "For {exData.name}, prioritize full range of motion over speed. Inhale on the descent, engage your core like a solid steel plank, and press explosively while exhaling!"
            </Text>
            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: Colors.primary }]}
              onPress={() => {
                setShowAiModal(false);
                handleStartWorkout();
              }}
            >
              <Text style={[styles.modalCloseText, { color: '#000' }]}>Start Session with Coach</Text>
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
    backgroundColor: '#020617',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shareText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  levelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '700',
  },
  levelBars: {
    flexDirection: 'row',
    gap: 3,
  },
  levelBar: {
    width: 8,
    height: 12,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  levelBarFilled: {
    backgroundColor: '#3B82F6',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  altNameText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 12,
  },
  noteCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noteTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  savingBadge: {
    color: '#64748B',
    fontSize: 11,
    marginLeft: 'auto',
  },
  noteInput: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
    minHeight: 50,
  },
  floatingAiBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
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
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  modalDesc: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  modalCloseBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  instructionHeading: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
  },
});
