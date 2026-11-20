import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
  TextInput, KeyboardAvoidingView, ActivityIndicator, Alert, Switch
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import Logo from '../components/auth/Logo';
import { useUserStore } from '../store/userStore';
import { useTheme } from '../store/themeStore';
import { syncUserProfile } from '../lib/profileService';
import { supabase } from '../lib/supabase';
import { sendOfficialFitPulseMessage } from '../lib/officialChatService';

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
    subtitle: 'Gym, Muscle Hypertrophy, Weight Loss & Conditioning',
    icon: 'barbell-outline',
    accent: '#10B981',
  },
  {
    key: 'Football',
    title: 'Football / Soccer',
    subtitle: 'Tactical, Agility, Striker & Youth Academy Coaching',
    icon: 'football-outline',
    accent: '#3B82F6',
  },
  {
    key: 'Health',
    title: 'Health, Diet & Rehabilitation',
    subtitle: 'Clinical Nutrition, Sports Physio, Injury Rehab & Posture',
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

  // Verification & Existing Profile State
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [existingApplication, setExistingApplication] = useState<any | null>(null);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Form states
  const [fullName, setFullName] = useState(user.name || '');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [domain, setDomain] = useState<CoachDomain>('Fitness');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([
    DOMAIN_SPECIALTIES.Fitness[0],
  ]);
  const [institutionName, setInstitutionName] = useState('');
  const [licenseTitle, setLicenseTitle] = useState('');
  const [experience, setExperience] = useState('3-5 years');
  const [pricePerMonth, setPricePerMonth] = useState<number>(500);
  const [customPriceText, setCustomPriceText] = useState('500');
  const [hasFirstAid, setHasFirstAid] = useState<'yes' | 'in_progress' | 'no'>('yes');
  const [safetyAgreementAccepted, setSafetyAgreementAccepted] = useState(false);
  const [about, setAbout] = useState('');

  // Document Uploads
  const [certUri, setCertUri] = useState<string | null>(null);
  const [idCardUri, setIdCardUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Check if coach already applied and is in review
  useEffect(() => {
    const currentUid = auth.currentUser?.uid || user.uid;
    if (!currentUid) {
      setCheckingExisting(false);
      return;
    }

    async function loadCoachData() {
      try {
        const { data: coachData } = await supabase
          .from('coach_profiles')
          .select('*')
          .eq('uid', currentUid)
          .maybeSingle();

        if (coachData) {
          setExistingApplication(coachData);
          if (coachData.name) setFullName(coachData.name);
          if (coachData.phone) setPhone(coachData.phone);
          if (coachData.telegram) setTelegram(coachData.telegram);
          if (coachData.domain) setDomain(coachData.domain);
          if (coachData.specialty) setSelectedSpecialties(coachData.specialty);
          if (coachData.institution_name) setInstitutionName(coachData.institution_name);
          if (coachData.license_number) setLicenseTitle(coachData.license_number);
          if (coachData.price_per_month !== undefined) {
            setPricePerMonth(coachData.price_per_month);
            setCustomPriceText(String(coachData.price_per_month));
          }
          if (coachData.bio) setAbout(coachData.bio);
          if (coachData.certificate_url) setCertUri(coachData.certificate_url);
          if (coachData.id_card_url) setIdCardUri(coachData.id_card_url);
          if (coachData.safety_agreement_accepted) setSafetyAgreementAccepted(true);
        } else if (currentUid) {
          // Check Firestore fallback
          const snap = await getDoc(doc(db, 'users', currentUid));
          if (snap.exists()) {
            const d = snap.data();
            if (d.fullName || d.name) setFullName(d.fullName || d.name);
            if (d.phone) setPhone(d.phone);
          }
        }
      } catch (e) {
        console.warn('Error checking existing coach status:', e);
      } finally {
        setCheckingExisting(false);
      }
    }

    loadCoachData();
  }, [user.uid]);

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

  // Document Pickers
  const pickCertificate = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });
      if (!res.canceled && res.assets[0]?.uri) {
        setCertUri(res.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Permission Error', 'Could not open photo library.');
    }
  };

  const pickIdCard = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });
      if (!res.canceled && res.assets[0]?.uri) {
        setIdCardUri(res.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Permission Error', 'Could not open photo library.');
    }
  };

  // Upload image helper
  const uploadDocImage = async (uri: string, prefix: string): Promise<string> => {
    // If it's already an external public URL, return it
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }
    const uid = auth.currentUser?.uid || user.uid;
    const response = await fetch(uri);
    const blob = await response.blob();
    const mimeType = blob.type || 'image/jpeg';
    const ext = mimeType.split('/')[1]?.split('+')[0] || 'jpg';
    const fileName = `coach_docs/${uid}_${prefix}_${Date.now()}.${ext}`;

    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Failed to read image data.'));
      reader.readAsArrayBuffer(blob);
    });

    const { error: uploadError } = await supabase.storage
      .from('posts')
      .upload(fileName, arrayBuffer, { contentType: mimeType, upsert: true });

    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from('posts').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSubmitApplication = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your legal full name.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Required', 'Please enter your phone number.');
      return;
    }
    if (!certUri) {
      Alert.alert(
        'Certificate Required 📜',
        'To protect athlete safety and prevent injuries, please upload a clear photo of your coaching license, diploma, or certification.'
      );
      return;
    }
    if (!idCardUri) {
      Alert.alert(
        'Identity Document Required 🪪',
        'Please upload your Kebele ID, National ID, or Passport to verify your identity.'
      );
      return;
    }
    if (!safetyAgreementAccepted) {
      Alert.alert(
        'Safety Agreement Required 🛡️',
        'You must review and agree to the FitPulse Athlete Safety Code and Legal Liability Agreement.'
      );
      return;
    }
    if (!about.trim()) {
      Alert.alert('Required', 'Please write a brief summary of your coaching philosophy.');
      return;
    }

    setIsUploading(true);
    try {
      const uid = auth.currentUser?.uid || user.uid;
      if (!uid) {
        Alert.alert('Authentication Error', 'Please log in first.');
        return;
      }

      // 1. Upload Certificate and ID images to Supabase storage
      let uploadedCertUrl = certUri;
      let uploadedIdUrl = idCardUri;

      if (!certUri.startsWith('http')) {
        uploadedCertUrl = await uploadDocImage(certUri, 'cert');
      }
      if (!idCardUri.startsWith('http')) {
        uploadedIdUrl = await uploadDocImage(idCardUri, 'id');
      }

      const match = experience.match(/\d+/);
      const yearsNum = match ? parseInt(match[0], 10) : 3;
      const avatarUrl = user.avatar || `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${uid}.jpg`;

      // 2. Upsert into Supabase coach_profiles with STRICT 'pending_review' status!
      const coachData: any = {
        uid,
        name: fullName.trim(),
        avatar_url: avatarUrl,
        bio: about.trim(),
        domain,
        specialty: selectedSpecialties,
        experience_years: yearsNum,
        price_per_month: pricePerMonth,
        phone: phone.trim(),
        telegram: telegram.trim() || null,
        institution_name: institutionName.trim() || 'Private Trainer',
        license_number: licenseTitle.trim() || 'Certified Coach',
        certificate_url: uploadedCertUrl,
        id_card_url: uploadedIdUrl,
        has_first_aid: hasFirstAid === 'yes',
        safety_agreement_accepted: true,
        verification_status: 'pending_review',
        is_verified: false, // Must be reviewed and approved by CEO safety board!
        rating: 5.0,
        total_trainees: 0,
        created_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await supabase.from('coach_profiles').upsert(coachData);
      if (upsertErr) {
        console.warn('Upsert fallback warning:', upsertErr.message);
      }

      // 3. Keep Firestore & Profiles in sync
      // IMPORTANT: Retain role as 'user' (trainee) until CEO explicitly approves!
      const effectiveRole = (user.role === 'coach' && user.isCoachVerified) ? 'coach' : 'user';
      await updateDoc(doc(db, 'users', uid), {
        fullName: fullName.trim(),
        name: fullName.trim(),
        role: effectiveRole,
        coach_status: 'pending_review',
        domain,
        phone: phone.trim(),
        telegram: telegram.trim() || null,
        institution_name: institutionName.trim(),
        verification_status: 'pending_review',
        is_verified: false,
        isCoachVerified: false,
        onboardingComplete: true,
        updatedAt: serverTimestamp(),
      }).catch(() => {});

      await syncUserProfile({
        uid,
        name: fullName.trim(),
        role: effectiveRole,
        bio: about.trim(),
      }).catch(() => {});

      // 4. Update Zustand state (Applicant remains in trainee mode until CEO verifies)
      setUser({
        ...user,
        role: effectiveRole,
        name: fullName.trim(),
        isCoachVerified: false,
      });

      // 5. Send official confirmation message from FitPulse Safety Board in Chat
      await sendOfficialFitPulseMessage(
        uid,
        `🛡️ ሰላም ${fullName.trim()}! የአሰልጣኝነት ማመልከቻዎ እና ያያያዟቸው ሰነዶች ለ FitPulse ቦርድ ደርሰዋል።\n\nበ 24–48 ሰዓት ውስጥ ሰነዶችዎ ተመርምረው ምላሽ ይሰጥዎታል። ማመልከቻዎ በይፋ እስኪጸድቅ ድረስ መለያዎ በግምገማ ላይ (Under Review) ይቆያል።\n\nማንኛውም የሰነድ ችግር ካለ ወይም ተጨማሪ ማረጋገጫ ሲያስፈልግ በዚህ ይፋዊ የ FitPulse Safety Board የውይይት መስመር መልዕክት ይደርስዎታል።\n\n— FitPulse Executive Safety Board`,
        '🛡️ ማመልከቻዎ በግምገማ ላይ ነው (24-48 Hours)'
      );

      setExistingApplication(coachData);
      setIsEditingExisting(false);

      Alert.alert(
        '🛡️ Application Submitted!',
        'Your credentials have been securely received. To protect athlete safety, our board reviews all certificates within 24–48 hours before activating your public profile.'
      );
    } catch (err: any) {
      console.error('Error submitting coach application:', err);
      Alert.alert('Upload Error', err.message || 'Failed to submit application. Please check your connection and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (checkingExisting) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textMuted, marginTop: 14 }}>Loading coaching credentials...</Text>
      </SafeAreaView>
    );
  }

  // ── EXECUTIVE "APPLICATION UNDER REVIEW" PORTAL VIEW ────────────────────────
  if (existingApplication?.verification_status === 'pending_review' && !isEditingExisting) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <Logo size="small" />
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Status Header */}
          <View style={[styles.statusHeroCard, { backgroundColor: colors.surface, borderColor: '#F59E0B' }]}>
            <View style={styles.statusBadgeWrap}>
              <View style={[styles.statusIconCircle, { backgroundColor: 'rgba(245,158,11,0.18)' }]}>
                <Ionicons name="shield-checkmark" size={32} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusHeroTitle, { color: colors.textPrimary }]}>
                  Verification In Progress
                </Text>
                <Text style={[styles.statusHeroSub, { color: '#F59E0B', fontWeight: '700' }]}>
                  በግምገማ ላይ (Under Review)
                </Text>
              </View>
            </View>

            {/* Stepper */}
            <View style={styles.stepperContainer}>
              <View style={styles.stepItem}>
                <View style={[styles.stepDot, { backgroundColor: colors.primary }]}>
                  <Ionicons name="checkmark" size={12} color="#000" />
                </View>
                <Text style={[styles.stepText, { color: colors.textPrimary }]}>Submitted</Text>
              </View>
              <View style={[styles.stepLine, { backgroundColor: '#F59E0B' }]} />
              <View style={styles.stepItem}>
                <View style={[styles.stepDot, { backgroundColor: '#F59E0B' }]}>
                  <ActivityIndicator size="small" color="#000" />
                </View>
                <Text style={[styles.stepText, { color: '#F59E0B', fontWeight: '700' }]}>Board Review</Text>
              </View>
              <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
              <View style={styles.stepItem}>
                <View style={[styles.stepDot, { backgroundColor: colors.surfaceLight, borderColor: colors.border, borderWidth: 1 }]}>
                  <Ionicons name="ribbon-outline" size={12} color={colors.textMuted} />
                </View>
                <Text style={[styles.stepText, { color: colors.textMuted }]}>Verified Badge</Text>
              </View>
            </View>
          </View>

          {/* Safety Notice */}
          <View style={[styles.noticeCard, { backgroundColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.3)' }]}>
            <Ionicons name="information-circle-outline" size={24} color="#3B82F6" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.noticeTitle, { color: '#3B82F6' }]}>Athlete Safety & Quality Standards</Text>
              <Text style={[styles.noticeDesc, { color: colors.textSecondary }]}>
                To protect athletes from injuries and improper coaching, FitPulse Sports Board manually verifies all submitted coaching licenses, diplomas, and identity documents within 24–48 hours.
              </Text>
            </View>
          </View>

          {/* Submitted Documents Summary */}
          <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginTop: 24 }]}>
            Submitted Credentials
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Coach Name:</Text>
              <Text style={[styles.summaryVal, { color: colors.textPrimary }]}>{existingApplication?.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Domain:</Text>
              <Text style={[styles.summaryVal, { color: colors.primary, fontWeight: '700' }]}>{existingApplication?.domain}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Affiliation:</Text>
              <Text style={[styles.summaryVal, { color: colors.textPrimary }]}>{existingApplication?.institution_name || 'Independent'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Phone:</Text>
              <Text style={[styles.summaryVal, { color: colors.textPrimary }]}>{existingApplication?.phone}</Text>
            </View>

            {/* Document Previews */}
            <View style={{ marginTop: 14 }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Attached Proof Documents:</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                {existingApplication?.certificate_url && (
                  <View style={styles.previewBox}>
                    <Image
                      source={existingApplication.certificate_url}
                      style={styles.previewThumbnail}
                      contentFit="cover"
                    />
                    <Text style={[styles.previewLabel, { color: colors.textMuted }]}>License / Cert</Text>
                  </View>
                )}
                {existingApplication?.id_card_url && (
                  <View style={styles.previewBox}>
                    <Image
                      source={existingApplication.id_card_url}
                      style={styles.previewThumbnail}
                      contentFit="cover"
                    />
                    <Text style={[styles.previewLabel, { color: colors.textMuted }]}>National ID</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary, marginTop: 28 }]}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>Return to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cancelBtn, { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]}
            onPress={() => router.push('/(tabs)/chat')}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubbles-outline" size={16} color="#00E676" />
            <Text style={[styles.cancelBtnText, { color: '#00E676', fontWeight: '700' }]}>
              Open FitPulse Safety Board Chat
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cancelBtn, { marginTop: 4 }]}
            onPress={() => setIsEditingExisting(true)}
          >
            <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Update or Replace Documents</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── 5-STAGE RIGOROUS VERIFICATION APPLICATION FORM ──────────────────────────
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
                Coach <Text style={{ color: colors.primary }}>Verification</Text>
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Submit your official qualifications to become a certified FitPulse coach.
              </Text>
            </View>
          </View>

          {/* ── 1. DOMAIN SELECTION ── */}
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
            1. Coaching Domain & Expertise
          </Text>
          <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
            Select your professional coaching field:
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

          {/* Specialties Chips */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
            Select Specific Programs Offered:
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
                  {active && <Ionicons name="checkmark" size={14} color="#000" style={{ marginRight: 4 }} />}
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

          {/* ── 2. OFFICIAL CREDENTIAL & ID UPLOADS (MANDATORY) ── */}
          <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginTop: 28 }]}>
            2. Official License & ID Documents
          </Text>
          <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
            Mandatory proof to safeguard athlete safety & prevent physical injuries:
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Certificate Upload Card */}
            <View style={styles.inputField}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Coaching License or Diploma Photo *
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8 }}>
                Upload CAF License, ISSA/ACE, University Degree, or Sports Diploma:
              </Text>

              {certUri ? (
                <View style={styles.docUploadedBox}>
                  <Image source={certUri} style={styles.docThumbnail} contentFit="cover" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                      <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13 }}>
                        Certificate Attached
                      </Text>
                    </View>
                    <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>Ready for board verification</Text>
                  </View>
                  <TouchableOpacity onPress={pickCertificate} style={styles.replaceBtn}>
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.uploadBox, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
                  onPress={pickCertificate}
                  activeOpacity={0.8}
                >
                  <Ionicons name="document-attach-outline" size={28} color={colors.primary} />
                  <Text style={[styles.uploadBoxTitle, { color: colors.textPrimary }]}>
                    Upload Coaching Certificate / License
                  </Text>
                  <Text style={[styles.uploadBoxSub, { color: colors.textMuted }]}>
                    JPG, PNG, or Document Photo
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* National ID / Passport Upload Card */}
            <View style={[styles.inputField, { marginTop: 18 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Kebele ID / National ID / Passport *
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8 }}>
                Used solely to confirm your identity matches your certificate:
              </Text>

              {idCardUri ? (
                <View style={styles.docUploadedBox}>
                  <Image source={idCardUri} style={styles.docThumbnail} contentFit="cover" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                      <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13 }}>
                        Government ID Attached
                      </Text>
                    </View>
                    <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>Identity verified</Text>
                  </View>
                  <TouchableOpacity onPress={pickIdCard} style={styles.replaceBtn}>
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.uploadBox, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
                  onPress={pickIdCard}
                  activeOpacity={0.8}
                >
                  <Ionicons name="card-outline" size={28} color="#38BDF8" />
                  <Text style={[styles.uploadBoxTitle, { color: colors.textPrimary }]}>
                    Upload Kebele ID or Passport
                  </Text>
                  <Text style={[styles.uploadBoxSub, { color: colors.textMuted }]}>
                    Clear photo of front side
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* License Title */}
            <View style={[styles.inputField, { marginTop: 18 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>License Title & Issuing Authority</Text>
              <View style={[styles.textInputWrap, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                <Ionicons name="ribbon-outline" size={19} color="#F59E0B" style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary }]}
                  placeholder="e.g. CAF License B, ISSA CPT #9821, AAU Sports Science"
                  placeholderTextColor={colors.textMuted}
                  value={licenseTitle}
                  onChangeText={setLicenseTitle}
                />
              </View>
            </View>
          </View>

          {/* ── 3. AFFILIATION & EXPERIENCE ── */}
          <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginTop: 28 }]}>
            3. Working Background & Experience
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Institution / Gym / Club */}
            <View style={styles.inputField}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Current or Past Gym, Football Club or Studio Affiliation *
              </Text>
              <View style={[styles.textInputWrap, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                <Ionicons name="business-outline" size={19} color={colors.primary} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary }]}
                  placeholder="e.g. BodyTech Gym, St. George FC Academy, Tikur Anbessa Hospital"
                  placeholderTextColor={colors.textMuted}
                  value={institutionName}
                  onChangeText={setInstitutionName}
                />
              </View>
            </View>

            {/* Years of Experience */}
            <View style={[styles.inputField, { marginTop: 16 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Years of Active Coaching Experience
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

            {/* Full Legal Name */}
            <View style={[styles.inputField, { marginTop: 16 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Full Legal Name *</Text>
              <View style={[styles.textInputWrap, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                <Ionicons name="person-outline" size={19} color={colors.primary} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary }]}
                  placeholder="Your legal name as it appears on your ID"
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
          </View>

          {/* ── 4. FIRST AID & ATHLETE SAFETY PLEDGE ── */}
          <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginTop: 28 }]}>
            4. Athlete Safety, CPR & Legal Liability
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* First Aid Training */}
            <View style={styles.inputField}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Do you hold valid CPR / First Aid Certification?
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                {[
                  { key: 'yes', label: 'Yes, Certified' },
                  { key: 'in_progress', label: 'In Progress' },
                  { key: 'no', label: 'None' },
                ].map((fa) => {
                  const active = hasFirstAid === fa.key;
                  return (
                    <TouchableOpacity
                      key={fa.key}
                      style={[
                        styles.expBtn,
                        {
                          backgroundColor: active ? colors.primary : colors.surfaceLight,
                          borderColor: active ? colors.primary : colors.border,
                          flex: 1,
                          alignItems: 'center',
                        },
                      ]}
                      onPress={() => setHasFirstAid(fa.key as any)}
                    >
                      <Text style={[styles.expBtnText, { color: active ? '#000' : colors.textPrimary, fontWeight: active ? '700' : '500' }]}>
                        {fa.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Legal Liability & Safety Code Switch */}
            <View style={[styles.safetyAgreementWrap, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                  FitPulse Athlete Safety & Legal Liability Agreement *
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 4 }}>
                  I solemnly certify that all uploaded credentials and identity documents are authentic. I agree to conduct physical readiness screenings for all clients before intense exercises, to prevent injuries, and understand that negligence or fraud results in immediate termination and legal prosecution.
                </Text>
              </View>
              <Switch
                value={safetyAgreementAccepted}
                onValueChange={setSafetyAgreementAccepted}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* ── 5. MONTHLY FEE & PHILOSOPHY ── */}
          <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginTop: 28 }]}>
            5. Coaching Fee & Philosophy
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Price Presets */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Monthly Client Fee (ETB / Coins)</Text>
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

            {/* Custom Price */}
            <View style={[styles.textInputWrap, { backgroundColor: colors.surfaceLight, borderColor: colors.border, marginTop: 4 }]}>
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

            {/* Bio */}
            <View style={[styles.inputField, { marginTop: 16 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Coaching Bio & Methodology *</Text>
              <TextInput
                style={[
                  styles.textAreaInput,
                  { backgroundColor: colors.surfaceLight, borderColor: colors.border, color: colors.textPrimary },
                ]}
                placeholder="Explain your training philosophy, injury prevention principles, and who you work best with..."
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
              { backgroundColor: colors.primary, marginTop: 32 },
              isUploading && { opacity: 0.7 },
            ]}
            onPress={handleSubmitApplication}
            disabled={isUploading}
            activeOpacity={0.85}
          >
            {isUploading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <View style={styles.submitBtnInner}>
                <Ionicons name="shield-checkmark" size={20} color="#000" />
                <Text style={styles.submitBtnText}>Submit for Board Verification</Text>
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
    paddingBottom: 60,
    maxWidth: 580,
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
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
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
    marginBottom: 8,
  },

  // Document Upload Elements
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  uploadBoxTitle: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  uploadBoxSub: { fontSize: 11.5 },
  docUploadedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
    backgroundColor: 'rgba(16,185,129,0.08)',
  },
  docThumbnail: { width: 56, height: 56, borderRadius: 8 },
  replaceBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(16,185,129,0.15)',
  },

  // Safety Agreement
  safetyAgreementWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
  },

  // Price presets
  priceRow: { flexDirection: 'row', gap: 8, marginBottom: 12, marginTop: 6 },
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
  inputLabel: { fontSize: 12.5, fontWeight: '600', marginBottom: 6 },
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
  },
  submitBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelBtnText: { fontSize: 14 },

  // Status View Styles
  statusHeroCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 16,
  },
  statusBadgeWrap: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  statusIconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  statusHeroTitle: { fontSize: 20, fontWeight: '800' },
  statusHeroSub: { fontSize: 13, marginTop: 2 },
  stepperContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  stepText: { fontSize: 11 },
  stepLine: { flex: 1, height: 2, marginHorizontal: 8, marginBottom: 14 },

  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  noticeTitle: { fontSize: 13, fontWeight: '700' },
  noticeDesc: { fontSize: 12, lineHeight: 17, marginTop: 3 },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  summaryLabel: { fontSize: 13 },
  summaryVal: { fontSize: 13, fontWeight: '600' },
  previewBox: { alignItems: 'center', gap: 4 },
  previewThumbnail: { width: 80, height: 80, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  previewLabel: { fontSize: 11 },
});
