import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useUserStore, UserTier } from '../store/userStore';

const { width } = Dimensions.get('window');

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

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const finishOnboarding = () => {
    const finalCity = country === 'Ethiopia' ? city : customCity.trim() || city;

    // Cache onboarding data in local session
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

    // Set guest user state
    setUser({
      tier: UserTier.GUEST,
      name: 'Guest Athlete',
      city: finalCity,
    });

    // Enter app home screen directly
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Background ambient glow */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      {/* ── Top Bar with Segmented Progress ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={[
                styles.progressSegment,
                s <= step && styles.progressSegmentActive,
                s === step && styles.progressSegmentCurrent,
              ]}
            />
          ))}
        </View>

        {/* Skip button */}
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={finishOnboarding}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Step 1: Gender ── */}
        {step === 1 && (
          <View style={styles.stepWrapper}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepCategory}>STEP 1 OF 4</Text>
              <Text style={styles.stepTitle}>What is your gender?</Text>
              <Text style={styles.stepSubtitle}>
                This helps our algorithm tailor calorie expenditure and workout intensity.
              </Text>
            </View>

            <View style={styles.cardsStack}>
              <TouchableOpacity
                style={[styles.quizCard, gender === 'male' && styles.quizCardSelected]}
                onPress={() => setGender('male')}
                activeOpacity={0.8}
              >
                <View style={[styles.iconCircle, gender === 'male' && styles.iconCircleActive]}>
                  <Ionicons
                    name="male"
                    size={36}
                    color={gender === 'male' ? Colors.primary : '#FFFFFF'}
                  />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, gender === 'male' && styles.cardTitleActive]}>
                    Male
                  </Text>
                  <Text style={styles.cardDesc}>Optimal strength & muscle building plans</Text>
                </View>
                <View style={[styles.radioCircle, gender === 'male' && styles.radioCircleActive]}>
                  {gender === 'male' && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quizCard, gender === 'female' && styles.quizCardSelected]}
                onPress={() => setGender('female')}
                activeOpacity={0.8}
              >
                <View style={[styles.iconCircle, gender === 'female' && styles.iconCircleActive]}>
                  <Ionicons
                    name="female"
                    size={36}
                    color={gender === 'female' ? Colors.primary : '#FFFFFF'}
                  />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, gender === 'female' && styles.cardTitleActive]}>
                    Female
                  </Text>
                  <Text style={styles.cardDesc}>Toning, fat burn & sculpting programs</Text>
                </View>
                <View style={[styles.radioCircle, gender === 'female' && styles.radioCircleActive]}>
                  {gender === 'female' && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Step 2: Goal ── */}
        {step === 2 && (
          <View style={styles.stepWrapper}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepCategory}>STEP 2 OF 4</Text>
              <Text style={styles.stepTitle}>What's your primary goal?</Text>
              <Text style={styles.stepSubtitle}>
                Select what you want to achieve most in your fitness journey.
              </Text>
            </View>

            <View style={styles.cardsStack}>
              {[
                {
                  id: 'muscle',
                  title: 'Build Muscle & Bulk',
                  desc: 'Hypertrophy workouts, heavy lifting & size gains',
                  icon: 'barbell-outline',
                },
                {
                  id: 'fatloss',
                  title: 'Burn Fat & Lean Out',
                  desc: 'High calorie burn, HIIT & athletic conditioning',
                  icon: 'flame-outline',
                },
                {
                  id: 'tone',
                  title: 'Tone & Athletic Shape',
                  desc: 'Core definition, agility & functional strength',
                  icon: 'flash-outline',
                },
                {
                  id: 'health',
                  title: 'Stay Fit & Healthy',
                  desc: 'Overall mobility, daily energy & healthy lifestyle',
                  icon: 'heart-outline',
                },
              ].map((item) => {
                const isSelected = goal === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.quizCard, isSelected && styles.quizCardSelected]}
                    onPress={() => setGoal(item.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.iconCircle, isSelected && styles.iconCircleActive]}>
                      <Ionicons
                        name={item.icon as any}
                        size={28}
                        color={isSelected ? Colors.primary : '#FFFFFF'}
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
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Step 3: Experience Level ── */}
        {step === 3 && (
          <View style={styles.stepWrapper}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepCategory}>STEP 3 OF 4</Text>
              <Text style={styles.stepTitle}>Your experience level?</Text>
              <Text style={styles.stepSubtitle}>
                We'll calibrate exercise difficulty so you stay challenged without burnout.
              </Text>
            </View>

            <View style={styles.cardsStack}>
              {[
                {
                  id: 'beginner',
                  title: 'Beginner',
                  badge: '🌱 Level 1',
                  desc: 'New to working out or returning after a break',
                },
                {
                  id: 'intermediate',
                  title: 'Intermediate',
                  badge: '⚡ Level 2',
                  desc: 'Working out regularly for 1 to 2 years',
                },
                {
                  id: 'advanced',
                  title: 'Advanced / Athlete',
                  badge: '🏆 Level 3',
                  desc: 'Consistent heavy lifter, training 4+ times a week',
                },
              ].map((item) => {
                const isSelected = level === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.quizCard, isSelected && styles.quizCardSelected]}
                    onPress={() => setLevel(item.id)}
                    activeOpacity={0.8}
                  >
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
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Step 4: Country & City ── */}
        {step === 4 && (
          <View style={styles.stepWrapper}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepCategory}>STEP 4 OF 4</Text>
              <Text style={styles.stepTitle}>Where are you located?</Text>
              <Text style={styles.stepSubtitle}>
                Connect with local gyms, fitness buddies, and coaches in your area.
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
      </ScrollView>

      {/* ── Bottom Fixed CTA Button ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, isNextDisabled() && styles.continueBtnDisabled]}
          disabled={isNextDisabled()}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>
            {step === totalSteps ? 'Explore FitPulse 🚀' : 'Continue'}
          </Text>
          {step < totalSteps && (
            <Ionicons name="arrow-forward" size={18} color="#000000" style={{ marginLeft: 6 }} />
          )}
        </TouchableOpacity>
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
    top: '10%',
    left: '50%',
    width: 320,
    height: 320,
    marginLeft: -160,
    borderRadius: 160,
    backgroundColor: Colors.primary,
    opacity: 0.08,
    ...(Platform.OS === 'web'
      ? { filter: 'blur(100px)' }
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
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    marginHorizontal: 16,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressSegmentActive: {
    backgroundColor: Colors.primary,
  },
  progressSegmentCurrent: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
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
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  stepWrapper: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingTop: 12,
  },
  stepHeader: {
    marginBottom: 28,
  },
  stepCategory: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    color: '#9CA3AF',
    fontSize: 15,
    lineHeight: 22,
  },
  cardsStack: {
    gap: 14,
  },
  quizCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121826',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  quizCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    shadowColor: Colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconCircleActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
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
    marginBottom: 6,
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
    borderColor: 'rgba(255, 255, 255, 0.25)',
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
  continueBtn: {
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  continueBtnDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
  },
  continueBtnText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
