import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/colors';

const LEVELS = ['beginner', 'intermediate', 'advanced'];

export default function CreatePlanPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [weeks, setWeeks] = useState('4');
  const [level, setLevel] = useState('beginner');
  const [exercises, setExercises] = useState([{ name: '', sets: '3', reps: '10', rest: '60s' }]);
  const [saving, setSaving] = useState(false);

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: '3', reps: '10', rest: '60s' }]);
  };

  const updateExercise = (index: number, field: string, value: string) => {
    const updated = [...exercises];
    (updated[index] as any)[field] = value;
    setExercises(updated);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const savePlan = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please add a plan title.');
      return;
    }
    if (!user.uid) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('workout_plans').insert({
        coach_uid: user.uid,
        title: title.trim(),
        description: description.trim(),
        duration_weeks: parseInt(weeks) || 4,
        level,
        exercises: exercises.filter(e => e.name.trim()),
      }).select().single();

      if (error) throw error;
      Alert.alert('✅ Plan Created!', 'You can now assign it to trainees.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={26} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Workout Plan</Text>
          <TouchableOpacity onPress={savePlan} disabled={saving}>
            {saving ? <ActivityIndicator color={Colors.primary} /> : (
              <Text style={styles.saveBtn}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.label}>Plan Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 4 Week Strength Builder"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Describe the plan goals and structure..."
              placeholderTextColor={Colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Duration & Level */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Duration (weeks)</Text>
              <TextInput
                style={styles.input}
                placeholder="4"
                placeholderTextColor={Colors.textMuted}
                value={weeks}
                onChangeText={setWeeks}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.field, { flex: 2 }]}>
              <Text style={styles.label}>Level</Text>
              <View style={styles.levelRow}>
                {LEVELS.map((l) => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.levelBtn, level === l && styles.levelBtnActive]}
                    onPress={() => setLevel(l)}
                  >
                    <Text style={[styles.levelText, level === l && styles.levelTextActive]}>
                      {l.charAt(0).toUpperCase() + l.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Exercises */}
          <View style={styles.exercisesSection}>
            <View style={styles.exercisesHeader}>
              <Text style={styles.label}>Exercises</Text>
              <TouchableOpacity onPress={addExercise} style={styles.addExBtn}>
                <Ionicons name="add" size={18} color={Colors.primary} />
                <Text style={styles.addExText}>Add</Text>
              </TouchableOpacity>
            </View>

            {exercises.map((ex, i) => (
              <View key={i} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseNum}>Exercise {i + 1}</Text>
                  {exercises.length > 1 && (
                    <TouchableOpacity onPress={() => removeExercise(i)}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={styles.exInput}
                  placeholder="Exercise name (e.g. Push-ups)"
                  placeholderTextColor={Colors.textMuted}
                  value={ex.name}
                  onChangeText={(v) => updateExercise(i, 'name', v)}
                />
                <View style={styles.exMetaRow}>
                  <View style={styles.exMeta}>
                    <Text style={styles.exMetaLabel}>Sets</Text>
                    <TextInput
                      style={styles.exMetaInput}
                      value={ex.sets}
                      onChangeText={(v) => updateExercise(i, 'sets', v)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.exMeta}>
                    <Text style={styles.exMetaLabel}>Reps</Text>
                    <TextInput
                      style={styles.exMetaInput}
                      value={ex.reps}
                      onChangeText={(v) => updateExercise(i, 'reps', v)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.exMeta}>
                    <Text style={styles.exMetaLabel}>Rest</Text>
                    <TextInput
                      style={styles.exMetaInput}
                      value={ex.rest}
                      onChangeText={(v) => updateExercise(i, 'rest', v)}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  saveBtn: { color: Colors.primary, fontSize: 16, fontWeight: '800' },
  scroll: { padding: 16, gap: 4, paddingBottom: 40 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, color: Colors.textPrimary, fontSize: 15,
    borderWidth: 1, borderColor: Colors.border,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  levelRow: { flexDirection: 'row', gap: 6 },
  levelBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  levelBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  levelText: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  levelTextActive: { color: '#000' },
  exercisesSection: { marginTop: 8 },
  exercisesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addExBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addExText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  exerciseCard: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.border, gap: 10,
  },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exerciseNum: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  exInput: {
    backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, color: Colors.textPrimary, fontSize: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  exMetaRow: { flexDirection: 'row', gap: 10 },
  exMeta: { flex: 1, gap: 5 },
  exMetaLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textAlign: 'center' },
  exMetaInput: {
    backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 10,
    paddingVertical: 8, color: Colors.textPrimary, fontSize: 14,
    borderWidth: 1, borderColor: Colors.border, textAlign: 'center',
  },
});
