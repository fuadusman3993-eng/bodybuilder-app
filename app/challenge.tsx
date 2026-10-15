import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CHALLENGES } from '../constants/challenges';
import { useChallengeStore } from '../store/challengeStore';
import { Colors } from '../constants/colors';

export default function ChallengeScreen() {
  const router = useRouter();
  const {
    activeGoal,
    level,
    completedDays,
    setGoal,
    setLevel,
    toggleDayCompleted,
  } = useChallengeStore();

  const [showGoalModal, setShowGoalModal] = useState(false);

  // Active challenge data
  const challenge = CHALLENGES[activeGoal] || CHALLENGES['lose-belly-fat'];
  const totalDays = challenge.totalDays || 30;
  const completedCount = completedDays.length;
  const daysLeft = Math.max(0, totalDays - completedCount);
  const progressPercent = Math.min(100, Math.round((completedCount / totalDays) * 100));

  const handleDayPress = (dayNumber: number, isRest: boolean) => {
    if (isRest) {
      alert(`Day ${dayNumber} is a scheduled Rest & Recovery day! Drink plenty of water and sleep well.`);
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

      {/* TOP HERO HEADER (Blue matching Image 1) */}
      <View style={styles.heroSection}>
        <SafeAreaView edges={['top']} style={styles.safeTop}>
          {/* Top navigation row */}
          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.changeGoalPill}
              onPress={() => setShowGoalModal(true)}
            >
              <Ionicons name="options-outline" size={16} color="#FFF" />
              <Text style={styles.changeGoalText}>Change Plan</Text>
            </TouchableOpacity>
          </View>

          {/* Hero text & Image */}
          <View style={styles.heroContentRow}>
            <View style={styles.heroTextCol}>
              <View style={styles.levelRow}>
                <Ionicons name="flash" size={14} color="#60A5FA" />
                <Ionicons name="flash" size={14} color="#60A5FA" />
                <Ionicons name="flash" size={14} color="#60A5FA" />
                <Text style={styles.levelText}>{level}</Text>
              </View>

              <Text style={styles.heroTitle}>{challenge.title}</Text>
              <Text style={styles.heroSubtitle}>
                {challenge.id === 'lose-belly-fat'
                  ? 'Burn stubborn fat & sculpt lean abs'
                  : 'Hypertrophy & strength progression'}
              </Text>
            </View>

            {/* Athlete Hero Graphic */}
            <View style={styles.heroImageWrapper}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&q=80',
                }}
                style={styles.heroAthleteImage}
                resizeMode="cover"
              />
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* BOTTOM SHEET / DAYS LIST (White curved card matching Image 1) */}
      <View style={styles.daysSheet}>
        {/* Progress header: '29 days left' */}
        <View style={styles.progressHeader}>
          <Text style={styles.daysLeftText}>
            <Text style={styles.daysLeftNumber}>{daysLeft} </Text>
            days left
          </Text>

          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.max(5, progressPercent)}%` },
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
                    <Ionicons name="cafe-outline" size={24} color="#3B82F6" />
                  </View>
                </View>
              );
            }

            // ACTIVE NEXT DAY (Big Blue Card with START Button — e.g. Day 2 in Image 1!)
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

            // REGULAR CARD (Completed OR Future)
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

      {/* PLAN SELECTION MODAL */}
      <Modal
        visible={showGoalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Workout Plan</Text>
              <TouchableOpacity onPress={() => setShowGoalModal(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>Select your primary fitness objective:</Text>

            {/* Goal 1: Lose Belly Fat */}
            <TouchableOpacity
              style={[
                styles.goalOption,
                activeGoal === 'lose-belly-fat' && styles.goalOptionActive,
              ]}
              onPress={() => {
                setGoal('lose-belly-fat');
                setShowGoalModal(false);
              }}
            >
              <View style={styles.goalIconCircle}>
                <Ionicons name="flame" size={24} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.goalOptionTitle}>Lose Belly Fat</Text>
                <Text style={styles.goalOptionDesc}>
                  Targeted high-intensity bodyweight circuits to burn visceral fat.
                </Text>
              </View>
              {activeGoal === 'lose-belly-fat' && (
                <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
              )}
            </TouchableOpacity>

            {/* Goal 2: Build Muscle */}
            <TouchableOpacity
              style={[
                styles.goalOption,
                activeGoal === 'build-muscle' && styles.goalOptionActive,
              ]}
              onPress={() => {
                setGoal('build-muscle');
                setShowGoalModal(false);
              }}
            >
              <View style={styles.goalIconCircle}>
                <Ionicons name="barbell" size={24} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.goalOptionTitle}>Build Muscle</Text>
                <Text style={styles.goalOptionDesc}>
                  Hypertrophy focused volume for chest, back, and leg growth.
                </Text>
              </View>
              {activeGoal === 'build-muscle' && (
                <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
              )}
            </TouchableOpacity>

            {/* Level Selector */}
            <View style={styles.levelSelectorContainer}>
              <Text style={styles.levelSelectorLabel}>Fitness Level:</Text>
              <View style={styles.levelBtnRow}>
                {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                  <TouchableOpacity
                    key={lvl}
                    style={[
                      styles.levelOptionBtn,
                      level === lvl && styles.levelOptionBtnActive,
                    ]}
                    onPress={() => setLevel(lvl)}
                  >
                    <Text
                      style={[
                        styles.levelOptionText,
                        level === lvl && styles.levelOptionTextActive,
                      ]}
                    >
                      {lvl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D4ED8', // Rich blue matching Image 1
  },
  heroSection: {
    backgroundColor: '#1D4ED8',
    paddingBottom: 20,
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
  changeGoalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  changeGoalText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  heroTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 6,
  },
  levelText: {
    color: '#BFDBFE',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroSubtitle: {
    color: '#93C5FD',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  heroImageWrapper: {
    width: 100,
    height: 110,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroAthleteImage: {
    width: '100%',
    height: '100%',
  },

  // DAYS SHEET
  daysSheet: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    overflow: 'hidden',
  },
  progressHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  daysLeftText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  daysLeftNumber: {
    color: '#1D4ED8',
    fontSize: 22,
    fontWeight: '900',
  },
  progressBarTrack: {
    height: 6,
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

  // CARDS
  activeDayCard: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  startBtnText: {
    color: '#1D4ED8',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Regular & Finished Day Card
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

  // Rest Card
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 14,
    color: '#64748B',
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  goalOptionActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  goalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  goalOptionDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  levelSelectorContainer: {
    marginTop: 8,
  },
  levelSelectorLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  levelBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  levelOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  levelOptionBtnActive: {
    backgroundColor: '#2563EB',
  },
  levelOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  levelOptionTextActive: {
    color: '#FFF',
  },
});
