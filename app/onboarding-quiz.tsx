import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '../constants/colors';
import { useUserStore, UserTier } from '../store/userStore';
import AnimatedSelectionCard from '../components/ui/AnimatedSelectionCard';
import ShimmerGlowButton from '../components/ui/ShimmerGlowButton';

const { width } = Dimensions.get('window');

// High-definition athletic photography (100% real human athletes)
const ATHLETE_PHOTOS = {
  male: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&auto=format&fit=crop&q=80',
  female: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&auto=format&fit=crop&q=80',
};

const GOAL_OPTIONS = [
  {
    id: 'muscle',
    title: 'Build Muscle & Strength',
    desc: 'Hypertrophy lifting, progressive overload & mass gains',
    photo: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300&auto=format&fit=crop&q=80',
    tag: 'STRENGTH',
  },
  {
    id: 'fatloss',
    title: 'Burn Fat & Lean Out',
    desc: 'High-octane calorie burn, HIIT & athletic definition',
    photo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&auto=format&fit=crop&q=80',
    tag: 'FAT BURN',
  },
  {
    id: 'tone',
    title: 'Tone & Athletic Conditioning',
    desc: 'Functional mobility, speed & core stability',
    photo: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&auto=format&fit=crop&q=80',
    tag: 'AGILITY',
  },
  {
    id: 'health',
    title: 'Stay Fit & Healthy',
    desc: 'Daily vitality, cardiovascular health & longevity',
    photo: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&auto=format&fit=crop&q=80',
    tag: 'VITALITY',
  },
];

const LEVEL_OPTIONS = [
  {
    id: 'beginner',
    title: 'Beginner',
    badge: '🌱 Level 1 • Foundations',
    desc: 'Learning proper exercise form or restarting gym habits',
    photo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    badge: '⚡ Level 2 • Active Lifter',
    desc: 'Consistent training 2 to 3 times a week for 1+ years',
    photo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'advanced',
    title: 'Advanced / Athlete',
    badge: '🏆 Level 3 • Pro Intensity',
    desc: 'Heavy lifter, training 4+ days a week with maximum focus',
    photo: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=300&auto=format&fit=crop&q=80',
  },
];

const COUNTRIES = [
  { name: 'Ethiopia', flag: '🇪🇹' },
  { name: 'USA', flag: '🇺🇸' },
  { name: 'UAE', flag: '🇦🇪' },
  { name: 'UK', flag: '🇬🇧' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'Other', flag: '🌍' },
];

const ETHIOPIA_CITIES = [
  'Addis Ababa',
  'Hawassa',
  'Adama',
  'Bahir Dar',
  'Dire Dawa',
  'Mekelle',
  'Gondar',
  'Jimma',
];

export default function OnboardingQuizScreen() {
  const router = useRouter();
  const { setUser } = useUserStore();

  const [step, setStep] = useState<number>(1);

  // User selections
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [country, setCountry] = useState<string>('Ethiopia');
  const [city, setCity] = useState<string>('Addis Ababa');
  const [customCity, setCustomCity] = useState<string>('');

  const totalSteps = 4;

  // ── Liquid Progress Bar Animation ──
  const progressAnim = useRef(new Animated.Value(0.25)).current;

  // ── Step Slide & Fade Animation ──
  const stepSlideAnim = useRef(new Animated.Value(0)).current;
  const stepOpacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Smooth liquid expansion of progress bar
    Animated.timing(progressAnim, {
      toValue: step / totalSteps,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [step]);

  const animateTransition = (direction: 'next' | 'back', callback: () => void) => {
    const exitX = direction === 'next' ? -35 : 35;
    const enterX = direction === 'next' ? 35 : -35;

    Animated.parallel([
      Animated.timing(stepSlideAnim, {
        toValue: exitX,
        duration: 140,
        easing: Easing.in(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(stepOpacityAnim, {
        toValue: 0,
        duration: 140,
        easing: Easing.in(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      callback();
      stepSlideAnim.setValue(enterX);

      Animated.parallel([
        Animated.spring(stepSlideAnim, {
          toValue: 0,
          friction: 8,
          tension: 70,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(stepOpacityAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (step < totalSteps) {
      animateTransition('next', () => setStep(prev => prev + 1));
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      animateTransition('back', () => setStep(prev => prev - 1));
    } else {
      router.back();
    }
  };

  const finishOnboarding = () => {
    const finalCity = country === 'Ethiopia' ? city : customCity.trim() || city;

    const quizData = {
      gender,
      goal,
      level,
      country,
      city: finalCity,
      completedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('fitpulse_onboarding_quiz', JSON.stringify(quizData));
      } catch (_) {}
    }

    setUser({
      tier: UserTier.GUEST,
      name: 'Guest Athlete',
      city: finalCity,
      country,
    });

    router.replace('/(tabs)');
  };

  const isNextDisabled = () => {
    if (step === 1) return !gender;
    if (step === 2) return !goal;
    if (step === 3) return !level;
    if (step === 4) {
      if (country === 'Ethiopia') return !city;
      return !customCity.trim() && !city;
    }
    return false;
  };

  const progressPercent = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Background ambient radial glow */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      {/* ── Top Bar with Liquid Progress Bar ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Continuous Liquid Progress Bar */}
        <View style={styles.liquidProgressTrack}>
          <Animated.View style={[styles.liquidProgressFill, { width: progressPercent }]} />
        </View>

        {/* Skip button */}
        <TouchableOpacity style={styles.skipBtn} onPress={finishOnboarding} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={[
            styles.animatedStepContainer,
            {
              transform: [{ translateX: stepSlideAnim }],
              opacity: stepOpacityAnim,
            },
          ]}
        >
          {/* ── Step 1: Real Athletic Vector Icons ── */}
          {step === 1 && (
            <View style={styles.stepWrapper}>
              <View style={styles.stepHeader}>
                <View style={styles.stepPill}>
                  <Text style={styles.stepCategory}>STEP 1 OF 4</Text>
                </View>
                <Text style={styles.stepTitle}>What is your gender?</Text>
                <Text style={styles.stepSubtitle}>
                  Tailors calorie calculation, hormonal baseline, and athletic workout splits.
                </Text>
              </View>

              <View style={styles.cardsStack}>
                <AnimatedSelectionCard
                  selected={gender === 'male'}
                  onPress={() => setGender('male')}
                >
                  <View style={[styles.avatarWrap, gender === 'male' && styles.avatarWrapActive]}>
                    <Image
                      source={{ uri: ATHLETE_PHOTOS.male }}
                      style={styles.athleteAvatar}
                      contentFit="cover"
                      transition={200}
                    />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardTitle, gender === 'male' && styles.cardTitleActive]}>
                      Male
                    </Text>
                    <Text style={styles.cardDesc}>
                      Upper & lower hypertrophy splits, strength & muscle mass
                    </Text>
                  </View>
                  <View style={[styles.radioCircle, gender === 'male' && styles.radioCircleActive]}>
                    {gender === 'male' && <View style={styles.radioDot} />}
                  </View>
                </AnimatedSelectionCard>

                <AnimatedSelectionCard
                  selected={gender === 'female'}
                  onPress={() => setGender('female')}
                >
                  <View style={[styles.avatarWrap, gender === 'female' && styles.avatarWrapActive]}>
                    <Image
                      source={{ uri: ATHLETE_PHOTOS.female }}
                      style={styles.athleteAvatar}
                      contentFit="cover"
                      transition={200}
                    />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardTitle, gender === 'female' && styles.cardTitleActive]}>
                      Female
                    </Text>
                    <Text style={styles.cardDesc}>
                      Glute sculpting, core tone, metabolic burn & endurance
                    </Text>
                  </View>
                  <View style={[styles.radioCircle, gender === 'female' && styles.radioCircleActive]}>
                    {gender === 'female' && <View style={styles.radioDot} />}
                  </View>
                </AnimatedSelectionCard>
              </View>
            </View>
          )}

          {/* ── Step 2: Goal with Real Fitness Photography Badges ── */}
          {step === 2 && (
            <View style={styles.stepWrapper}>
              <View style={styles.stepHeader}>
                <View style={styles.stepPill}>
                  <Text style={styles.stepCategory}>STEP 2 OF 4</Text>
                </View>
                <Text style={styles.stepTitle}>What is your primary goal?</Text>
                <Text style={styles.stepSubtitle}>
                  We'll customize your daily workouts and nutrition cues accordingly.
                </Text>
              </View>

              <View style={styles.cardsStack}>
                {GOAL_OPTIONS.map((item) => {
                  const isSelected = goal === item.id;
                  return (
                    <AnimatedSelectionCard
                      key={item.id}
                      selected={isSelected}
                      onPress={() => setGoal(item.id)}
                    >
                      <View style={[styles.photoBadgeWrap, isSelected && styles.photoBadgeWrapActive]}>
                        <Image
                          source={{ uri: item.photo }}
                          style={styles.photoBadge}
                          contentFit="cover"
                          transition={200}
                        />
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={[styles.cardTitle, isSelected && styles.cardTitleActive]}>
                          {item.title}
                        </Text>
                        <Text style={styles.cardDesc}>{item.desc}</Text>
                      </View>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </AnimatedSelectionCard>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Step 3: Experience Level with Tiered Photo Badges ── */}
          {step === 3 && (
            <View style={styles.stepWrapper}>
              <View style={styles.stepHeader}>
                <View style={styles.stepPill}>
                  <Text style={styles.stepCategory}>STEP 3 OF 4</Text>
                </View>
                <Text style={styles.stepTitle}>Your experience level?</Text>
                <Text style={styles.stepSubtitle}>
                  Sets the starting weight, rest duration, and technical exercise complexity.
                </Text>
              </View>

              <View style={styles.cardsStack}>
                {LEVEL_OPTIONS.map((item) => {
                  const isSelected = level === item.id;
                  return (
                    <AnimatedSelectionCard
                      key={item.id}
                      selected={isSelected}
                      onPress={() => setLevel(item.id)}
                    >
                      <View style={[styles.photoBadgeWrap, isSelected && styles.photoBadgeWrapActive]}>
                        <Image
                          source={{ uri: item.photo }}
                          style={styles.photoBadge}
                          contentFit="cover"
                          transition={200}
                        />
                      </View>
                      <View style={styles.cardInfo}>
                        <View style={styles.badgeRow}>
                          <Text style={styles.badgeText}>{item.badge}</Text>
                        </View>
                        <Text style={[styles.cardTitle, isSelected && styles.cardTitleActive]}>
                          {item.title}
                        </Text>
                        <Text style={styles.cardDesc}>{item.desc}</Text>
                      </View>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </AnimatedSelectionCard>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Step 4: Location (Country & City) ── */}
          {step === 4 && (
            <View style={styles.stepWrapper}>
              <View style={styles.stepHeader}>
                <View style={styles.stepPill}>
                  <Text style={styles.stepCategory}>STEP 4 OF 4</Text>
                </View>
                <Text style={styles.stepTitle}>Where are you located?</Text>
                <Text style={styles.stepSubtitle}>
                  Connects you with local gyms, verified fitness coaches, and athletic events.
                </Text>
              </View>

              {/* Country Selector */}
              <Text style={styles.sectionLabel}>Select Country</Text>
              <View style={styles.chipsRow}>
                {COUNTRIES.map((c) => {
                  const isSelected = country === c.name;
                  return (
                    <TouchableOpacity
                      key={c.name}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => {
                        setCountry(c.name);
                        if (c.name === 'Ethiopia') setCity('Addis Ababa');
                        else setCity('');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.chipFlag}>{c.flag}</Text>
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* City Selector */}
              <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Select City</Text>
              {country === 'Ethiopia' ? (
                <View style={styles.chipsRow}>
                  {ETHIOPIA_CITIES.map((ct) => {
                    const isSelected = city === ct;
                    return (
                      <TouchableOpacity
                        key={ct}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => setCity(ct)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {ct}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.inputWrap}>
                  <Ionicons name="location-outline" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your city name..."
                    placeholderTextColor="#6B7280"
                    value={customCity}
                    onChangeText={setCustomCity}
                  />
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* ── Bottom Fixed CTA Button with Radiant Shimmer Beam ── */}
      <View style={styles.footer}>
        <View style={styles.footerInner}>
          <ShimmerGlowButton
            title={step === totalSteps ? 'Explore FitPulse 🚀' : 'Continue'}
            disabled={isNextDisabled()}
            onPress={handleNext}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  ambientGlow: {
    position: 'absolute',
    top: '5%',
    left: '50%',
    width: 360,
    height: 360,
    marginLeft: -180,
    borderRadius: 180,
    backgroundColor: Colors.primary,
    opacity: 0.08,
    ...(Platform.OS === 'web'
      ? { filter: 'blur(110px)' }
      : { shadowColor: Colors.primary, shadowRadius: 90, shadowOpacity: 0.5 }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liquidProgressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  liquidProgressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 110,
  },
  animatedStepContainer: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingTop: 8,
  },
  stepWrapper: {
    width: '100%',
  },
  stepHeader: {
    marginBottom: 24,
  },
  stepPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: 10,
  },
  stepCategory: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  stepSubtitle: {
    color: '#9CA3AF',
    fontSize: 14.5,
    lineHeight: 22,
  },
  cardsStack: {
    gap: 14,
  },
  avatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1E293B',
  },
  avatarWrapActive: {
    borderColor: Colors.primary,
    borderWidth: 2.5,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 10,
    elevation: 6,
  },
  athleteAvatar: {
    width: '100%',
    height: '100%',
  },
  photoBadgeWrap: {
    width: 58,
    height: 58,
    borderRadius: 16,
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: '#1E293B',
  },
  photoBadgeWrapActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 5,
  },
  photoBadge: {
    width: '100%',
    height: '100%',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardTitleActive: {
    color: Colors.primary,
  },
  cardDesc: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 18,
  },
  badgeRow: {
    marginBottom: 4,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  radioCircleActive: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  sectionLabel: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121826',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: Colors.primary,
  },
  chipFlag: {
    fontSize: 16,
    marginRight: 8,
  },
  chipText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121826',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: Platform.OS === 'ios' ? 24 : 20,
    backgroundColor: 'rgba(10, 14, 23, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerInner: {
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
});
