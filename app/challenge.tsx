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
import { useRouter } from 'expo-router';
import { useChallengeStore } from '../store/challengeStore';

export default function SelectTrainingPlanScreen() {
  const router = useRouter();
  const { setGoal, setLevel } = useChallengeStore();

  const handleSelectPlan = (goalId: string, levelName: string, directToDay1: boolean = false) => {
    setGoal(goalId);
    setLevel(levelName);

    if (directToDay1) {
      // Go directly to Day 1 Workout Preview (Image 2 style)
      router.push({
        pathname: '/workout/day/[dayId]',
        params: { dayId: '1' },
      } as any);
    } else {
      // Open 30-Day Challenge Calendar
      router.push({
        pathname: '/workout/calendar',
        params: { goal: goalId },
      } as any);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* HEADER: ← Select Training Plan */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Training Plan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* TOP FEATURED CARD: LOSE BELLY FAT (Matches Image 1 exactly!) */}
        <View style={styles.featuredCard}>
          {/* Athlete Sit-up Background Photo */}
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
            }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />

          {/* Dark Overlay for Readability */}
          <View style={styles.featuredOverlay} />

          {/* Top Right: 8,958,192+ Users Badge */}
          <View style={styles.usersBadge}>
            <Text style={styles.usersBadgeNumber}>8,958,192+</Text>
            <Text style={styles.usersBadgeLabel}>Users</Text>
          </View>

          {/* Card Body */}
          <View style={styles.featuredBody}>
            <Text style={styles.featuredTitle}>Lose Belly Fat</Text>

            <View style={styles.levelRow}>
              <Text style={styles.featuredLevelText}>Beginner</Text>
              <Ionicons name="flash" size={14} color="#FFF" />
              <Ionicons name="flash" size={14} color="#FFF" />
              <Ionicons name="flash" size={14} color="rgba(255,255,255,0.4)" />
            </View>

            <Text style={styles.featuredDesc}>
              Start your journey to be stronger! Just 7 minutes to shed belly fat easily.
            </Text>

            {/* Start Day 1 Button (White pill matching Image 1) */}
            <TouchableOpacity
              style={styles.startDay1Btn}
              activeOpacity={0.9}
              onPress={() => handleSelectPlan('lose-belly-fat', 'Beginner', true)}
            >
              <Text style={styles.startDay1Text}>Start Day 1</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CARD 2: ROCK HARD ABS (Purple Gradient matching Image 1) */}
        <TouchableOpacity
          style={styles.purpleCard}
          activeOpacity={0.88}
          onPress={() => handleSelectPlan('lose-belly-fat', 'Intermediate', false)}
        >
          <View style={styles.gradientCardContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.gradientTitle}>Rock Hard Abs</Text>
              <View style={styles.gradientLevelRow}>
                <Text style={styles.gradientLevelText}>Intermediate</Text>
                <Ionicons name="flash" size={13} color="#DDD6FE" />
                <Ionicons name="flash" size={13} color="#DDD6FE" />
                <Ionicons name="flash" size={13} color="rgba(255,255,255,0.4)" />
              </View>
            </View>

            <View style={styles.circleArrowBtn}>
              <Ionicons name="chevron-forward" size={20} color="#7C3AED" />
            </View>
          </View>
        </TouchableOpacity>

        {/* CARD 3: SIX PACK ABS (Red-Orange Gradient matching Image 1) */}
        <TouchableOpacity
          style={styles.orangeCard}
          activeOpacity={0.88}
          onPress={() => handleSelectPlan('build-muscle', 'Advanced', false)}
        >
          <View style={styles.gradientCardContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.gradientTitle}>Six Pack Abs</Text>
              <View style={styles.gradientLevelRow}>
                <Text style={styles.gradientLevelText}>Advanced</Text>
                <Ionicons name="flash" size={13} color="#FED7AA" />
                <Ionicons name="flash" size={13} color="#FED7AA" />
                <Ionicons name="flash" size={13} color="#FED7AA" />
              </View>
            </View>

            <View style={styles.circleArrowBtn}>
              <Ionicons name="chevron-forward" size={20} color="#EA580C" />
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 32,
    gap: 16,
  },

  // FEATURED CARD (Lose Belly Fat)
  featuredCard: {
    height: 380,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 22,
    backgroundColor: '#1E293B',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  usersBadge: {
    position: 'absolute',
    top: 18,
    right: 18,
    alignItems: 'flex-end',
  },
  usersBadgeNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  usersBadgeLabel: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  featuredBody: {
    zIndex: 1,
  },
  featuredTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  featuredLevelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 4,
  },
  featuredDesc: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: '90%',
  },
  startDay1Btn: {
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  startDay1Text: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },

  // PURPLE CARD (Rock Hard Abs)
  purpleCard: {
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  // ORANGE CARD (Six Pack Abs)
  orangeCard: {
    backgroundColor: '#F97316',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  gradientCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gradientTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  gradientLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gradientLevelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 4,
  },
  circleArrowBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
});
