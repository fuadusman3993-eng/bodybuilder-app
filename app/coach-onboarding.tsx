import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
  TextInput, KeyboardAvoidingView, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import Logo from '../components/auth/Logo';
import { useUserStore } from '../store/userStore';
import { useTheme } from '../store/themeStore';
import { syncUserProfile } from '../lib/profileService';
import { supabase } from '../lib/supabase';

// ── Domain & Specialty Configurations ─────────────────────────────────────────
export type CoachDomain = 'Fitness' | 'Football' | 'Health';

interface DomainOption {
  key: CoachDomain;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
}

const DOMAINS: DomainOption[] = [
  {
    key: 'Fitness',
    title: 'Fitness & Bodybuilding',
    subtitle: 'Gym, Muscle, Weight Loss & Conditioning',
    icon: 'barbell-outline',
    accent: '#10B981',
  },
  {
    key: 'Football',
    title: 'Football / Soccer',
    subtitle: 'Tactical, Agility, Striker & Youth Academy',
    icon: 'football-outline',
    accent: '#3B82F6',
  },
  {
    key: 'Health',
    title: 'Health & Wellness',
    subtitle: 'Nutrition, Diet, Rehab & Mobility',
    icon: 'fitness-outline',
    accent: '#F59E0B',
  },
];

const DOMAIN_SPECIALTIES: Record<CoachDomain, string[]> = {
  Fitness: [
    'Bodybuilding & Hypertrophy',
    'Weight Loss & Fat Burn',
    'Strength & Powerlifting',
    'CrossFit & Conditioning',
    'Calisthenics & Bodyweight',
    'HIIT & Cardio',
  ],
  Football: [
    'Tactical & Match IQ',
    'Striker & Finishing Specialist',
    'Goalkeeper Specific Training',
    'Football Speed & Agility (SAQ)',
    'Youth & Academy Development',
    'Football Physical Conditioning',
  ],
  Health: [
    'Sports Nutrition & Diet Plan',
    'Physiotherapy & Injury Rehab',
    'Posture & Mobility Correction',
    'Weight Management & Metabolism',
    'Holistic Lifestyle & Recovery',
  ],
};

const EXPERIENCE_YEARS = ['1-2 years', '3-5 years', '5-10 years', '10+ years'];
const PRICE_PRESETS = [0, 250, 500, 1000];

export default function CoachOnboardingScreen() {
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const { colors } = useTheme();

  // Form states
  const [fullName, setFullName] = useState(user.name || '');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [domain, setDomain] = useState<CoachDomain>('Fitness');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([
    DOMAIN_SPECIALTIES.Fitness[0],
  ]);
  const [experience, setExperience] = useState('3-5 years');
  const [pricePerMonth, setPricePerMonth] = useState<number>(500);
  const [customPriceText, setCustomPriceText] = useState('500');
  const [certifications, setCertifications] = useState('');
  const [about, setAbout] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Pre-fill existing user info if logged in
  useEffect(() => {
    const currentUid = auth.currentUser?.uid || user.uid;
    if (!currentUid) return;

    // Check if user already has partial profile
    getDoc(doc(db, 'users', currentUid)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.fullName || d.displayName || d.name) {
          setFullName(d.fullName || d.displayName || d.name);
        }
        if (d.phone) setPhone(d.phone);
        if (d.telegram) setTelegram(d.telegram);
        if (d.about || d.bio) setAbout(d.about || d.bio);
      }
    }).catch(() => {});
  }, [user.uid]);

  // When domain switches, select appropriate default specialty
  const handleDomainChange = (newDomain: CoachDomain) => {
    setDomain(newDomain);
    setSelectedSpecialties([DOMAIN_SPECIALTIES[newDomain][0]]);
  };

  const toggleSpecialty = (item: string) => {
    if (selectedSpecialties.includes(item)) {
      if (selectedSpecialties.length > 1) {
        setSelectedSpecialties(selectedSpecialties.filter((s) => s !== item));
      }
    } else {
      setSelectedSpecialties([...selectedSpecialties, item]);
    }
  };

  const handlePriceSelect = (val: number) => {
    setPricePerMonth(val);
    setCustomPriceText(String(val));
  };

  const handleCustomPriceChange = (text: string) => {
    const num = parseInt(text.replace(/\D/g, ''), 10) || 0;
    setCustomPriceText(text.replace(/\D/g, ''));
    setPricePerMonth(num);
  };

  const handleContinue = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Required', 'Please enter your phone number so clients can reach you.');
      return;
    }
    if (selectedSpecialties.length === 0) {
      Alert.alert('Required', 'Please select at least one specialty.');
      return;
    }
    if (!about.trim()) {
      Alert.alert('Required', 'Please write a brief bio about your coaching philosophy.');
      return;
    }

    setIsSaving(true);
    try {
      const uid = auth.currentUser?.uid || user.uid;
      if (!uid) {
        Alert.alert('Authentication Error', 'User ID not found. Please log in first.');
        return;
      }

      const yearsNum = parseInt(experience.replace(/\D/g, ''), 10) || 3;
      const certsList = certifications
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const avatarUrl = user.avatar || `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${uid}.jpg`;

      // 1. Upsert into Supabase coach_profiles (with graceful fallback if extra columns aren't migrated yet)
      const coachData: any = {
        uid,
        name: fullName.trim(),
        avatar_url: avatarUrl,
        bio: about.trim(),
        specialty: selectedSpecialties,
        experience_years: yearsNum,
        price_per_month: pricePerMonth,
        rating: 5.0,
        total_trainees: 0,
        is_verified: true,
      };

      // Try with extended fields (domain, phone, telegram, certifications)
      const { error: upsertErr } = await supabase.from('coach_profiles').upsert({
        ...coachData,
        domain,
        phone: phone.trim(),
        telegram: telegram.trim() || null,
        certifications: certsList,
      });

      // If schema doesn't have the new columns yet, fall back to core columns gracefully
      if (upsertErr) {
        console.warn('Extended columns fallback:', upsertErr.message);
        await supabase.from('coach_profiles').upsert(coachData);
      }

      // 2. Update Supabase Unified Profiles (SSOT)
      await syncUserProfile({
        uid,
        name: fullName.trim(),
        role: 'coach',
        bio: about.trim(),
      }).catch(() => {});

      // 3. Keep Firestore in sync for backwards-compatibility
      await updateDoc(doc(db, 'users', uid), {
        fullName: fullName.trim(),
        name: fullName.trim(),
        displayName: fullName.trim(),
        role: 'coach',
        domain,
        specialization: selectedSpecialties[0],
        specialties: selectedSpecialties,
        phone: phone.trim(),
        telegram: telegram.trim() || null,
        yearsExperience: experience,
        price_per_month: pricePerMonth,
        about: about.trim(),
        bio: about.trim(),
        onboardingComplete: true,
        updatedAt: serverTimestamp(),
      }).catch(() => {});

      // 4. Update local Zustand state
      setUser({
        ...user,
        role: 'coach',
        name: fullName.trim(),
      });

      // 5. Navigate to Coach experience
      Alert.alert(
        '🎉 Welcome, Coach!',
        'Your professional coach profile is now live! Clients can find and hire you directly in FitPulse.',
        [
          {
            text: 'Go to Coach Studio',
            onPress: () => router.replace('/coach-dashboard'),
          },
        ]
      );
    } catch (err: any) {
      console.error('Coach onboarding error:', err);
      Alert.alert('Error', err.message || 'Could not save coach profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <Logo size="small" />
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Banner */}
          <View style={styles.titleRow}>
            <View style={[styles.titleIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="shield-checkmark" size={30} color="#000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                Coach <Text style={{ color: colors.primary }}>Onboarding</Text>
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Set up your professional credentials to start coaching athletes in FitPulse.
              </Text>
            </View>
          </View>

          {/* ── 1. DOMAIN SELECTION (Interactive Cards) ── */}
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
            1. Select Your Coaching Domain
          </Text>
          <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
            Choose where your primary coaching expertise lies.
          </Text>

          <View style={styles.domainGrid}>
            {DOMAINS.map((d) => {
              const isSelected = domain === d.key;
              return (
                <TouchableOpacity
                  key={d.key}
                  style={[
                    styles.domainCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isSelected ? d.accent : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleDomainChange(d.key)}
                >
                  <View
                    style={[
                      styles.domainIconCircle,
                      { backgroundColor: isSelected ? d.accent : colors.surfaceLight },
                    ]}
                  >
                    <Ionicons
                      name={d.icon}
                      size={22}
                      color={isSelected ? '#fff' : colors.textPrimary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.domainTitle,
                        { color: colors.textPrimary, fontWeight: isSelected ? '700' : '600' },
                      ]}
                    >
                      {d.title}
                    </Text>
                    <Text style={[styles.domainSubtitle, { color: colors.textMuted }]}>
                      {d.subtitle}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={d.accent} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── 2. SPECIALTIES (Dynamic Multi-Select Chips) ── */}
          <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginTop: 24 }]}>
            2. Specialties & Programs
          </Text>
          <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
            Tap all areas you offer training in:
          </Text>

          <View style={styles.chipsContainer}>
            {DOMAIN_SPECIALTIES[domain].map((item) => {
              const active = selectedSpecialties.includes(item);
              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.primary : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => toggleSpecialty(item)}
                >
                  {active && <Ionicons name="checkmark" size={15} color="#000" style={{ marginRight: 4 }} />}
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: active ? '#000' : colors.textPrimary,
                        fontWeight: active ? '700' : '500',
                      },
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── 3. PRICING & EXPERIENCE CARD ── */}
          <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginTop: 28 }]}>
            3. Coaching Fee & Experience
          </Text>
          <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
            Set your monthly client fee (1 Coin = 1 ETB):
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Price Presets */}
            <View style={styles.priceRow}>
              {PRICE_PRESETS.map((p) => {
                const selected = pricePerMonth === p && customPriceText === String(p);
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.pricePresetBtn,
                      {
                        backgroundColor: selected ? colors.primary : colors.surfaceLight,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handlePriceSelect(p)}
                  >
                    <Text
                      style={[
                        styles.pricePresetText,
                        { color: selected ? '#000' : colors.textPrimary, fontWeight: selected ? '700' : '600' },
                      ]}
                    >
                      {p === 0 ? 'Free' : `${p} ETB`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Price Input */}
            <View style={styles.inputField}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Monthly Fee (ETB / Coins)
              </Text>
              <View style={[styles.textInputWrap, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                <Ionicons name="cash-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary }]}
                  placeholder="e.g. 500"
                  placeholderTextColor={colors.textMuted}
                  value={customPriceText}
                  onChangeText={handleCustomPriceChange}
                  keyboardType="numeric"
                />
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>ETB / month</Text>
              </View>
            </View>

            {/* Experience Selector */}
            <View style={[styles.inputField, { marginTop: 16 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Experience
              </Text>
              <View style={styles.expRow}>
                {EXPERIENCE_YEARS.map((ey) => {
                  const sel = experience === ey;
                  return (
                    <TouchableOpacity
                      key={ey}
                      style={[
                        styles.expBtn,
                        {
                          backgroundColor: sel ? colors.primary : colors.surfaceLight,
                          borderColor: sel ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setExperience(ey)}
                    >
                      <Text
                        style={[
                          styles.expBtnText,
                          { color: sel ? '#000' : colors.textPrimary, fontWeight: sel ? '700' : '500' },
                        ]}
                      >
                        {ey}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* ── 4. PERSONAL & CONTACT DETAILS ── */}
          <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginTop: 28 }]}>
            4. Contact & Credentials
          </Text>
          <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
            How trainees will communicate with you:
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Full Name */}
            <View style={styles.inputField}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Full Name *</Text>
              <View style={[styles.textInputWrap, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                <Ionicons name="person-outline" size={19} color={colors.primary} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary }]}
                  placeholder="Your full name"
                  placeholderTextColor={colors.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Phone */}
            <View style={[styles.inputField, { marginTop: 16 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Phone Number *</Text>
              <View style={[styles.textInputWrap, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                <Ionicons name="call-outline" size={19} color={colors.primary} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary }]}
                  placeholder="+251 9XX XXX XXX"
                  placeholderTextColor={colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Telegram */}
            <View style={[styles.inputField, { marginTop: 16 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Telegram Handle (Optional)</Text>
              <View style={[styles.textInputWrap, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                <Ionicons name="paper-plane-outline" size={19} color="#38BDF8" style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary }]}
                  placeholder="@your_telegram_username"
                  placeholderTextColor={colors.textMuted}
                  value={telegram}
                  onChangeText={setTelegram}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Certifications */}
            <View style={[styles.inputField, { marginTop: 16 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Certifications / Licenses</Text>
              <View style={[styles.textInputWrap, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                <Ionicons name="ribbon-outline" size={19} color="#F59E0B" style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary }]}
                  placeholder="e.g. CAF License, ISSA CPT, BSc Sports Science"
                  placeholderTextColor={colors.textMuted}
                  value={certifications}
                  onChangeText={setCertifications}
                />
              </View>
            </View>

            {/* Bio */}
            <View style={[styles.inputField, { marginTop: 16 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Coaching Bio & Philosophy *</Text>
              <TextInput
                style={[
                  styles.textAreaInput,
                  { backgroundColor: colors.surfaceLight, borderColor: colors.border, color: colors.textPrimary },
                ]}
                placeholder="Share your coaching philosophy, who you work best with, and how you help clients achieve results..."
                placeholderTextColor={colors.textMuted}
                value={about}
                onChangeText={setAbout}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={[styles.charCount, { color: colors.textMuted }]}>{about.length}/500</Text>
            </View>
          </View>

          {/* ── SUBMIT BUTTON ── */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: colors.primary },
              isSaving && { opacity: 0.7 },
            ]}
            onPress={handleContinue}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator color="#000" />
            ) : (
              <View style={styles.submitBtnInner}>
                <Text style={styles.submitBtnText}>Publish Coach Profile</Text>
                <Ionicons name="arrow-forward" size={19} color="#000" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel & Return</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 50,
    maxWidth: 560,
    alignSelf: 'center',
    width: '100%',
  },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22, marginTop: 4 },
  titleIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, lineHeight: 18, marginTop: 4 },

  sectionHeading: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  sectionSub: { fontSize: 12.5, marginBottom: 12 },

  // Domain Cards
  domainGrid: { gap: 10 },
  domainCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  domainIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  domainTitle: { fontSize: 15 },
  domainSubtitle: { fontSize: 12, marginTop: 2 },

  // Specialty Chips
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13 },

  // Cards
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },

  // Price presets
  priceRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pricePresetBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  pricePresetText: { fontSize: 13 },

  // Inputs
  inputField: { width: '100%' },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  textInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  textInput: { flex: 1, fontSize: 14.5, paddingVertical: 0 },
  textAreaInput: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    minHeight: 90,
    fontSize: 14,
  },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 4 },

  // Experience
  expRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  expBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  expBtnText: { fontSize: 12.5 },

  // Submit
  submitBtn: {
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  submitBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelBtnText: { fontSize: 14 },
});
