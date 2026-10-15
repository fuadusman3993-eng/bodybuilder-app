import React from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CHALLENGES } from '../../constants/challenges';
import { useChallengeStore } from '../../store/challengeStore';

export default function WorkoutCalendarScreen() {
  const router = useRouter();
  const { goal } = useLocalSearchParams();

  const {
    activeGoal,
    level,
    completedDays,
    toggleDayCompleted,
  } = useChallengeStore();

  const planId = (goal as string) || activeGoal || 'lose-belly-fat';
  const challenge = CHALLENGES[planId] || CHALLENGES['lose-belly-fat'];
  const totalDays = challenge.totalDays || 30;
  const completedCount = completedDays.length;
  const daysLeft = Math.max(0, totalDays - completedCount);
  const progressPercent = Math.min(100, Math.round((completedCount / totalDays) * 100));

  const handleDayPress = (dayNumber: number, isRest: boolean) => {
    if (isRest) {
      alert(`Day ${dayNumber} is a scheduled Rest & Recovery day! Relax and recover.`);
      return;
    }
    router.push({
      pathname: '/workout/day/[dayId]',
      params: { dayId: dayNumber.toString() },
    } as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* TOP BLUE HEADER (matching previous user image) */}
      <View style={styles.heroSection}>
        <SafeAreaView edges={['top']} style={styles.safeTop}>
          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.changePlanBtn}
              onPress={() => router.replace('/challenge')}
            >
              <Ionicons name="swap-horizontal" size={16} color="#FFF" />
              <Text style={styles.changePlanText}>Plans</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroContentRow}>
            <View style={styles.heroTextCol}>
              <View style={styles.levelRow}>
                <Ionicons name="flash" size={14} color="#60A5FA" />
                <Ionicons name="flash" size={14} color="#60A5FA" />
                <Ionicons name="flash" size={14} color="#60A5FA" />
                <Text style={styles.levelText}>{level}</Text>
              </View>

              <Text style={styles.heroTitle}>{challenge.title}</Text>
            </View>

            <View style={styles.heroImageWrapper}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80',
                }}
                style={styles.heroAthleteImage}
                resizeMode="cover"
              />
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* WHITE CURVED SHEET (Days List) */}
      <View style={styles.daysSheet}>
        {/* Progress Header: 29 days left */}
        <View style={styles.progressHeader}>
          <Text style={styles.daysLeftText}>
            <Text style={styles.daysLeftNumber}>{daysLeft} </Text>
            days left
          </Text>

          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.max(4, progressPercent)}%` },
              ]}
            />
          </View>
        </View>

        {/* 30-Day Scroll List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {challenge.days.map((item) => {
            const isCompleted = completedDays.includes(item.day);
            const isNextActive = !isCompleted && (item.day === 1 || completedDays.includes(item.day - 1));

            // REST DAY
            if (item.isRest) {
              return (
                <View key={item.day} style={styles.restCard}>
                  <View>
                    <Text style={styles.restTitle}>Day {item.day}</Text>
                    <Text style={styles.restSubtitle}>Rest & Recovery</Text>
                  </View>
                  <View style={styles.restIconCircle}>
                    <Ionicons name="cafe-outline" size={22} color="#3B82F6" />
                  </View>
                </View>
              );
            }

            // ACTIVE NEXT DAY (Big Blue Card with START Button)
            if (isNextActive) {
              return (
                <View key={item.day} style={styles.activeDayCard}>
                  <View style={styles.activeDayLeft}>
                    <Text style={styles.activeDayTitle}>Day {item.day}</Text>
                    <Text style={styles.activeDaySub}>{item.exerciseCount || 15} Exercises</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.startBtn}
                    activeOpacity={0.85}
                    onPress={() => handleDayPress(item.day, false)}
                  >
                    <Text style={styles.startBtnText}>START</Text>
                  </TouchableOpacity>
                </View>
              );
            }

            // REGULAR CARD (Completed or Future)
            return (
              <TouchableOpacity
                key={item.day}
                style={[styles.dayCard, isCompleted && styles.dayCardCompleted]}
                activeOpacity={0.7}
                onPress={() => handleDayPress(item.day, false)}
              >
                <View>
                  <Text style={[styles.dayCardTitle, isCompleted && styles.dayCardTitleCompleted]}>
                    Day {item.day}
                  </Text>
                  <Text style={styles.dayCardSub}>
                    {isCompleted ? 'Finished' : `${item.exerciseCount || 15} Exercises`}
                  </Text>
                </View>

                {isCompleted ? (
                  <TouchableOpacity
                    onPress={() => toggleDayCompleted(item.day)}
                    style={styles.checkCircle}
                  >
                    <Ionicons name="checkmark" size={18} color="#3B82F6" />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D4ED8',
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
    paddingVertical: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  changePlanText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  heroTextCol: {
    flex: 1,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 4,
  },
  levelText: {
    color: '#BFDBFE',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroAthleteImage: {
    width: '100%',
    height: '100%',
  },
  daysSheet: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    overflow: 'hidden',
  },
  progressHeader: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  daysLeftText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  daysLeftNumber: {
    color: '#1D4ED8',
    fontSize: 20,
    fontWeight: '900',
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  activeDayCard: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  activeDayLeft: {
    flex: 1,
  },
  activeDayTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  activeDaySub: {
    color: '#BFDBFE',
    fontSize: 14,
    fontWeight: '600',
  },
  startBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 30,
  },
  startBtnText: {
    color: '#1D4ED8',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  dayCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayCardCompleted: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  dayCardTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  dayCardTitleCompleted: {
    color: '#475569',
  },
  dayCardSub: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  restTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  restSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  restIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
