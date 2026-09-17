import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { CHALLENGES } from '../../constants/challenges';
import { WORKOUTS } from '../../constants/workouts';
import { useChallengeStore } from '../../store/challengeStore';

export default function WorkoutCompleteScreen() {
  const { day } = useLocalSearchParams();
  const router = useRouter();
  const { completeDay } = useChallengeStore();
  
  const dayNumber = parseInt(day as string, 10);
  const challenge = CHALLENGES['14-day-muscle'];
  const dayData = challenge.days.find(d => d.day === dayNumber);
  const workout = WORKOUTS[dayData?.workoutId || ''];

  const totalSets = workout?.exercises.reduce((acc, ex) => acc + ex.sets, 0) || 0;

  const handleCompleteDay = () => {
    completeDay(dayNumber);
    router.dismissAll();
    router.replace('/challenge');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="trophy" size={48} color="#000" />
        </View>
        
        <Text style={styles.title}>Workout Completed!</Text>
        <Text style={styles.subtitle}>Great job finishing Day {dayNumber} of the challenge.</Text>

        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{workout?.duration}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Exercises</Text>
            <Text style={styles.statValue}>{workout?.exercises.length} / {workout?.exercises.length}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Sets Completed</Text>
            <Text style={styles.statValue}>{totalSets} / {totalSets}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Calories Burned</Text>
            <Text style={styles.statValue}>~{workout?.estimatedCalories} kcal</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} activeOpacity={0.8} onPress={handleCompleteDay}>
          <Text style={styles.btnText}>Complete Day</Text>
          <Ionicons name="checkmark-circle" size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  statsCard: {
    width: '100%',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statLabel: {
    color: '#888',
    fontSize: 15,
  },
  statValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  btn: {
    backgroundColor: '#FFF',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  }
});
