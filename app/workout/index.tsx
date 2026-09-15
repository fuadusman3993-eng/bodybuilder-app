import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { workoutData } from '../../constants/mockData';

export default function WorkoutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Workout</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Weekly Calendar */}
        <View style={styles.calendarContainer}>
          {workoutData.weekDays.map((day, index) => {
            const isActive = index === workoutData.activeDay;
            return (
              <View key={index} style={styles.calendarDay}>
                <Text style={styles.dayText}>{day}</Text>
                <View style={[styles.dateCircle, isActive && styles.activeDateCircle]}>
                  <Text style={[styles.dateText, isActive && styles.activeDateText]}>
                    {workoutData.weekDates[index]}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Today's Workout Section */}
        <Text style={styles.sectionTitle}>Today's Workout</Text>
        
        <View style={styles.workoutCard}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconBox}>
                <Ionicons name="barbell" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.workoutTitle}>{workoutData.todayWorkout.title}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>
                {workoutData.todayWorkout.duration} • {workoutData.todayWorkout.location}
              </Text>
            </View>
          </View>

          {/* Exercise List */}
          <View style={styles.exerciseList}>
            {workoutData.todayWorkout.exercises.map((exercise, index) => (
              <View key={exercise.id} style={styles.exerciseRow}>
                <Text style={styles.exerciseName}>
                  {index + 1}. {exercise.name}
                </Text>
                <Text style={styles.exerciseSets}>
                  {exercise.sets} x {exercise.reps}
                </Text>
              </View>
            ))}
          </View>

          {/* Start Button */}
          <TouchableOpacity style={styles.startButton} activeOpacity={0.8}>
            <Text style={styles.startButtonText}>Start Workout</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.background} />
          </TouchableOpacity>
        </View>

        {/* This Week Section */}
        <Text style={styles.sectionTitle}>This Week</Text>
        <TouchableOpacity style={styles.weeklyRoutineCard} activeOpacity={0.8}>
          <View style={styles.weeklyRoutineLeft}>
            <View style={[styles.iconBox, { backgroundColor: Colors.info + '20' }]}>
              <Ionicons name="calendar" size={20} color={Colors.info} />
            </View>
            <View>
              <Text style={styles.weeklyRoutineTitle}>{workoutData.weeklyRoutine.title}</Text>
              <Text style={styles.weeklyRoutineSubtitle}>
                {workoutData.weeklyRoutine.days} • {workoutData.weeklyRoutine.split}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 24,
  },
  calendarDay: {
    alignItems: 'center',
    gap: 8,
  },
  dayText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDateCircle: {
    backgroundColor: Colors.primary,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  activeDateText: {
    color: Colors.background,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  workoutCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tag: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  exerciseList: {
    gap: 16,
    marginBottom: 24,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  exerciseSets: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.background,
  },
  weeklyRoutineCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
  },
  weeklyRoutineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weeklyRoutineTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  weeklyRoutineSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
