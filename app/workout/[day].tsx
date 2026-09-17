import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { CHALLENGES } from '../../constants/challenges';
import { WORKOUTS } from '../../constants/workouts';
import { EXERCISES } from '../../constants/exercises';
import { useUserStore, UserTier } from '../../store/userStore';

export default function WorkoutOverviewScreen() {
  const { day } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUserStore();

  const dayNumber = parseInt(day as string, 10);
  const challenge = CHALLENGES['14-day-muscle'];
  const dayData = challenge.days.find(d => d.day === dayNumber);

  useEffect(() => {
    // Access control verification
    if (dayData && dayData.isPremium && user.tier !== UserTier.PREMIUM) {
      // Should not happen naturally due to UI locks, but route guarding:
      router.replace('/challenge'); 
    }
  }, [dayData, user.tier]);

  if (!dayData || !dayData.workoutId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.title}>Rest Day</Text>
          <Text style={styles.subtitle}>Take it easy today.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const workout = WORKOUTS[dayData.workoutId];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Day {dayNumber}</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heroInfo}>
          <Text style={styles.workoutTitle}>{workout.title}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="time-outline" size={16} color="#888" />
              <Text style={styles.statText}>{workout.duration}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="flame-outline" size={16} color="#888" />
              <Text style={styles.statText}>{workout.estimatedCalories} kcal</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="barbell-outline" size={16} color="#888" />
              <Text style={styles.statText}>{workout.exercises.length} Exercises</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Exercises</Text>
        
        <View style={styles.exerciseList}>
          {workout.exercises.map((workoutEx, index) => {
            const exData = EXERCISES[workoutEx.exerciseId];
            return (
              <TouchableOpacity 
                key={index} 
                style={styles.exerciseCard}
                activeOpacity={0.7}
                onPress={() => router.push(`/exercise/${workoutEx.exerciseId}?day=${dayNumber}&index=${index}`)}
              >
                <Image source={{ uri: exData.thumbnail }} style={styles.exImage} resizeMode="cover" />
                <View style={styles.exDetails}>
                  <Text style={styles.exName}>{exData.name}</Text>
                  <Text style={styles.exTarget}>{exData.muscleGroup}</Text>
                  <View style={styles.exMetaRow}>
                    <Text style={styles.exMeta}>{workoutEx.sets} Sets</Text>
                    <Text style={styles.exMetaDot}>•</Text>
                    <Text style={styles.exMeta}>{workoutEx.reps} Reps</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#333" />
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity 
          style={styles.startBtn}
          activeOpacity={0.8}
          onPress={() => router.push(`/exercise/${workout.exercises[0].exerciseId}?day=${dayNumber}&index=0`)}
        >
          <Text style={styles.startBtnText}>Start Workout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  heroInfo: {
    marginBottom: 32,
  },
  workoutTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 16,
  },
  exerciseList: {
    gap: 12,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  exImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#222',
  },
  exDetails: {
    flex: 1,
    marginLeft: 16,
  },
  exName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  exTarget: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 6,
  },
  exMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exMeta: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  exMetaDot: {
    fontSize: 12,
    color: '#555',
    marginHorizontal: 6,
  },
  startBtn: {
    backgroundColor: '#FFF',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  startBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
  }
});
