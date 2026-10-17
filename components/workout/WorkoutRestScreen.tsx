import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { getExerciseAnimation } from '@/constants/exerciseAnimations';

interface WorkoutRestScreenProps {
  nextExerciseIndex: number;
  totalExercises: number;
  nextExerciseId: string;
  nextExerciseName: string;
  nextExerciseDuration: number;
  onSkip: () => void;
  onFinishRest: () => void;
  initialRestSeconds?: number;
}

export default function WorkoutRestScreen({
  nextExerciseIndex,
  totalExercises,
  nextExerciseId,
  nextExerciseName,
  nextExerciseDuration,
  onSkip,
  onFinishRest,
  initialRestSeconds = 15,
}: WorkoutRestScreenProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialRestSeconds);
  const nextAnim = getExerciseAnimation(nextExerciseId);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onFinishRest();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onFinishRest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onFinishRest]);

  const addTwentySeconds = () => {
    setSecondsLeft((prev) => prev + 20);
  };

  const formattedTimer = `00:${secondsLeft.toString().padStart(2, '0')}`;
  const formattedNextDuration = `00:${nextExerciseDuration.toString().padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Header with Close and Title */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onSkip} style={styles.headerIconBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>REST</Text>
        <View style={styles.headerIconBtn} />
      </View>

      {/* 2. Next Exercise Card Preview */}
      <View style={styles.nextExerciseCard}>
        <View style={styles.nextInfoRow}>
          <View style={styles.nextTextCol}>
            <Text style={styles.nextBadge}>
              NEXT {nextExerciseIndex + 1}/{totalExercises}
            </Text>
            <View style={styles.titleWithHelp}>
              <Text style={styles.nextExerciseTitle} numberOfLines={1}>
                {nextExerciseName}
              </Text>
              <Ionicons name="help-circle-outline" size={18} color="#E0E7FF" style={styles.helpIcon} />
            </View>
          </View>
          <Text style={styles.nextDuration}>{formattedNextDuration}</Text>
        </View>

        {/* Small thumbnail preview of next exercise */}
        <View style={styles.thumbnailContainer}>
          <Image
            source={nextAnim.source}
            style={styles.thumbnailImage}
            contentFit="contain"
            autoplay={true}
          />
        </View>
      </View>

      {/* 3. Center Rest Countdown */}
      <View style={styles.centerSection}>
        <Text style={styles.restLabel}>REST</Text>
        <Text style={styles.countdownText}>{formattedTimer}</Text>
        <TouchableOpacity style={styles.editTimeBtn}>
          <Text style={styles.editTimeText}>Edit Rest Time</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Bottom Controls (+20s & Skip) */}
      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.plusBtn} onPress={addTwentySeconds} activeOpacity={0.8}>
          <Text style={styles.plusBtnText}>+20s</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.8}>
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D66FF',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  nextExerciseCard: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  nextInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nextTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  nextBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#BAE6FD',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  titleWithHelp: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextExerciseTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  helpIcon: {
    marginLeft: 6,
  },
  nextDuration: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  thumbnailContainer: {
    width: '100%',
    height: 140,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  restLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E0E7FF',
    letterSpacing: 3,
    marginBottom: 6,
  },
  countdownText: {
    fontSize: 74,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  editTimeBtn: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
  },
  editTimeText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  plusBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  plusBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  skipBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  skipBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0D66FF',
  },
});
