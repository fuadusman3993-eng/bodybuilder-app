import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChallengeStore } from '../../../store/challengeStore';
import { getWorkoutForDay } from '../../../constants/workouts';
import { EXERCISES } from '../../../constants/exercises';
import { Colors } from '../../../constants/colors';

export default function DayWorkoutPreviewScreen() {
  const router = useRouter();
  const { dayId } = useLocalSearchParams();
  const dayNumber = parseInt((dayId as string) || '1', 10);

  const { activeGoal, level, completedDays } = useChallengeStore();
  const workout = getWorkoutForDay(activeGoal, dayNumber);
  const isCompleted = completedDays.includes(dayNumber);

  const [soundEnabled, setSoundEnabled] = useState(true);

  if (!workout) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Ionicons name="cafe-outline" size={64} color="#3B82F6" />
        <Text style={styles.emptyTitle}>Rest Day</Text>
        <Text style={styles.emptyDesc}>Day {dayNumber} is a scheduled recovery day.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleStartWorkout = () => {
    if (workout.exercises.length === 0) return;
    const firstEx = workout.exercises[0];
    router.push({
      pathname: '/exercise/[exerciseId]',
      params: {
        exerciseId: firstEx.exerciseId,
        day: dayNumber.toString(),
        index: '0',
      },
    } as any);
  };

  const handleExercisePress = (exerciseId: string, index: number) => {
    router.push({
      pathname: '/exercise/[exerciseId]',
      params: {
        exerciseId,
        day: dayNumber.toString(),
        index: index.toString(),
      },
    } as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* TOP HERO HEADER (Blue matching Image 2) */}
      <View style={styles.heroSection}>
        <SafeAreaView edges={['top']} style={styles.safeTop}>
          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="ellipsis-vertical" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroTitleRow}>
            <View>
              <Text style={styles.heroDayTitle}>Day {dayNumber}</Text>
              <View style={styles.levelRow}>
                <Ionicons name="flash" size={13} color="#60A5FA" />
                <Ionicons name="flash" size={13} color="#60A5FA" />
                <Ionicons name="flash" size={13} color="#60A5FA" />
                <Text style={styles.levelText}>{level}</Text>
              </View>
            </View>

            {/* Top athlete graphic */}
            <View style={styles.heroThumbWrapper}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80',
                }}
                style={styles.heroThumb}
                resizeMode="cover"
              />
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* WHITE CONTENT SHEET (matching Image 2) */}
      <View style={styles.sheetContainer}>
        {/* STATS ROW (15 Exercises • 11 min Time • 159.3 kcal Calories) */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>{workout.exercises.length}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>{workout.duration}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>{workout.estimatedCalories} kcal</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
        </View>

        {/* WORKOUT SETTINGS PILL (Music & Coach & Timer, etc.) */}
        <TouchableOpacity
          style={styles.settingsPill}
          activeOpacity={0.8}
          onPress={() => setSoundEnabled(!soundEnabled)}
        >
          <View style={styles.settingsPillLeft}>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
            <View>
              <Text style={styles.settingsTitle}>Workout Settings</Text>
              <Text style={styles.settingsSub}>
                Coach Sound: {soundEnabled ? 'ON' : 'OFF'} • Rest Timer: Active
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* SECTION HEADER: 'Exercises' */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          <TouchableOpacity style={styles.reorderBtn}>
            <Ionicons name="create-outline" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* EXERCISES LIST */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.exerciseScroll}
        >
          {workout.exercises.map((item, index) => {
            const exData = EXERCISES[item.exerciseId] || {
              name: item.exerciseId,
              thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
            };

            const repsDisplay =
              typeof item.reps === 'string'
                ? item.reps
                : `x ${item.reps}`;

            return (
              <TouchableOpacity
                key={`${item.exerciseId}-${index}`}
                style={styles.exerciseRow}
                activeOpacity={0.7}
                onPress={() => handleExercisePress(item.exerciseId, index)}
              >
                {/* Mini Preview Image */}
                <View style={styles.exerciseThumbWrapper}>
                  <Image
                    source={{ uri: exData.thumbnail }}
                    style={styles.exerciseThumb}
                    resizeMode="cover"
                  />
                </View>

                {/* Details */}
                <View style={styles.exerciseDetails}>
                  <Text style={styles.exerciseName} numberOfLines={1}>
                    {exData.name.toUpperCase()}
                  </Text>
                  <Text style={styles.exerciseReps}>{repsDisplay}</Text>
                </View>

                {/* Checkmark circle */}
                <View style={styles.exerciseCheck}>
                  <Ionicons name="checkmark" size={16} color="#3B82F6" />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* BOTTOM ACTION BUTTON ('START' or 'DO IT AGAIN' matching Image 2!) */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.mainActionBtn}
            activeOpacity={0.85}
            onPress={handleStartWorkout}
          >
            <Text style={styles.mainActionText}>
              {isCompleted ? 'DO IT AGAIN' : 'START'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D4ED8', // Matches Image 2 Blue
  },
  heroSection: {
    backgroundColor: '#1D4ED8',
    paddingBottom: 16,
  },
  safeTop: {
    paddingHorizontal: 16,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  heroDayTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  levelText: {
    color: '#BFDBFE',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  heroThumbWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroThumb: {
    width: '100%',
    height: '100%',
  },

  // SHEET
  sheetContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    overflow: 'hidden',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  statCol: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  settingsPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  settingsPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  newBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  settingsSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  reorderBtn: {
    padding: 4,
  },
  exerciseScroll: {
    paddingHorizontal: 16,
    paddingBottom: 90,
    gap: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 14,
  },
  exerciseThumbWrapper: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  exerciseThumb: {
    width: '100%',
    height: '100%',
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  exerciseReps: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  exerciseCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // BOTTOM ACTION
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  mainActionBtn: {
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mainActionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Empty Rest
  emptyContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#2563EB',
  },
  backBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
