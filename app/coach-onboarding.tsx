import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
  TextInput, KeyboardAvoidingView, Modal, FlatList, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auth } from '../lib/firebase';
import Logo from '../components/auth/Logo';
import { Colors } from '../constants/colors';
import { useUserStore } from '../store/userStore';

// ── Dropdown Data ─────────────────────────────────────────────────────────────
const SPECIALIZATIONS = [
  'Personal Training', 'Strength & Conditioning', 'Weight Loss',
  'Bodybuilding', 'CrossFit', 'Yoga & Flexibility', 'Sports Performance',
  'Nutrition Coaching', 'Rehabilitation', 'HIIT & Cardio',
];

const EXPERIENCE_LEVELS = [
  'Beginner (0–1 years)', 'Intermediate (2–4 years)',
  'Experienced (5–9 years)', 'Expert (10+ years)',
];

const YEARS_OPTIONS = [
  '1 year', '2 years', '3 years', '4 years', '5 years',
  '6 years', '7 years', '8 years', '9 years', '10+ years',
];

// ── Dropdown Modal ────────────────────────────────────────────────────────────
function DropdownModal({ visible, title, options, onSelect, onClose }: {
  visible: boolean; title: string; options: string[];
  onSelect: (v: string) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={dd.overlay} activeOpacity={1} onPress={onClose} />
      <View style={dd.sheet}>
        <View style={dd.handle} />
        <Text style={dd.title}>{title}</Text>
        <FlatList
          data={options}
          keyExtractor={(_, i) => String(i)}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={dd.item} onPress={() => { onSelect(item); onClose(); }} activeOpacity={0.7}>
              <Text style={dd.itemText}>{item}</Text>
              <Ionicons name="chevron-forward" size={16} color="#555" />
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

// ── Field Row ─────────────────────────────────────────────────────────────────
function FieldRow({ icon, label, required, children }: any) {
  return (
    <View style={f.row}>
      <View style={f.iconCol}>
        <Ionicons name={icon} size={22} color="#777" />
      </View>
      <View style={f.col}>
        <Text style={f.label}>{label}{required && <Text style={{ color: '#EF4444' }}> *</Text>}</Text>
        {children}
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function CoachOnboardingScreen() {
  const router = useRouter();
  const { setUser, user } = useUserStore();

  const [fullName, setFullName]         = useState('');
  const [phone, setPhone]               = useState('');
  const [specialization, setSpec]       = useState('');
  const [experienceLevel, setExpLevel]  = useState('');
  const [yearsExp, setYears]            = useState('');
  const [about, setAbout]               = useState('');
  const [isSaving, setIsSaving]         = useState(false);

  const [dropdown, setDropdown] = useState<'spec' | 'level' | 'years' | null>(null);

  // ── Validation ──────────────────────────────────────────────────────────────
  const handleContinue = async () => {
    if (!fullName.trim() || !phone.trim() || !specialization || !experienceLevel || !yearsExp || !about.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields before continuing.');
      return;
    }

    setIsSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await updateDoc(doc(db, 'users', uid), {
          fullName: fullName.trim(),
          phone: phone.trim(),
          specialization,
          experienceLevel,
          yearsExperience: yearsExp,
          about: about.trim(),
          onboardingComplete: true,
          updatedAt: serverTimestamp(),
        });
      }
      setUser({ ...user!, role: 'coach', name: fullName.trim() });
      router.replace('/(tabs)'); // Replace with /(coach-tabs) when ready
    } catch (err: any) {
      Alert.alert('Error', 'Could not save your profile. Please try again.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <Logo size="small" />
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Progress */}
          <View style={styles.progress}>
            <Step num={1} label="Account Type" done />
            <Line done />
            <Step num={2} label="Professional Info" active />
            <Line />
            <Step num={3} label="Complete Profile" />
          </View>

          {/* Title */}
          <View style={styles.titleRow}>
            <View style={styles.titleIcon}>
              <Ionicons name="person" size={32} color="#000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Coach <Text style={{ color: Colors.primary }}>Information</Text></Text>
              <Text style={styles.subtitle}>Tell us about your coaching background and experience. This helps us verify your profile and connect you with the right clients.</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.card}>
            {/* Full Name */}
            <FieldRow icon="person-outline" label="Full Name" required>
              <TextInput
                style={f.input}
                placeholder="Enter your full name"
                placeholderTextColor="#555"
                value={fullName}
                onChangeText={setFullName}
              />
            </FieldRow>

            <View style={styles.divider} />

            {/* Phone */}
            <FieldRow icon="call-outline" label="Phone Number" required>
              <TextInput
                style={f.input}
                placeholder="+251 9XX XXX XXX"
                placeholderTextColor="#555"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </FieldRow>

            <View style={styles.divider} />

            {/* Specialization */}
            <TouchableOpacity onPress={() => setDropdown('spec')} activeOpacity={0.7}>
              <FieldRow icon="barbell-outline" label="Specialization" required>
                <View style={f.dropdownRow}>
                  <Text style={[f.input, !specialization && { color: '#555' }]}>{specialization || 'Select your main specialization'}</Text>
                  <Ionicons name="chevron-down" size={18} color="#555" />
                </View>
              </FieldRow>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Experience Level */}
            <TouchableOpacity onPress={() => setDropdown('level')} activeOpacity={0.7}>
              <FieldRow icon="ribbon-outline" label="Experience Level" required>
                <View style={f.dropdownRow}>
                  <Text style={[f.input, !experienceLevel && { color: '#555' }]}>{experienceLevel || 'Select your experience level'}</Text>
                  <Ionicons name="chevron-down" size={18} color="#555" />
                </View>
              </FieldRow>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Years of Experience */}
            <TouchableOpacity onPress={() => setDropdown('years')} activeOpacity={0.7}>
              <FieldRow icon="calendar-outline" label="Years of Experience" required>
                <View style={f.dropdownRow}>
                  <Text style={[f.input, !yearsExp && { color: '#555' }]}>{yearsExp || 'e.g. 3 years'}</Text>
                  <Ionicons name="chevron-down" size={18} color="#555" />
                </View>
              </FieldRow>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* About You */}
            <FieldRow icon="document-text-outline" label="About You" required>
              <TextInput
                style={[f.input, f.textArea]}
                placeholder="Tell us about your training style, certifications, and what makes you unique..."
                placeholderTextColor="#555"
                value={about}
                onChangeText={setAbout}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={f.charCount}>{about.length}/500</Text>
            </FieldRow>
          </View>

          {/* Upload Section */}
          <View style={styles.uploadSection}>
            <Text style={styles.uploadTitle}>Upload Your Credentials</Text>
            <Text style={styles.uploadDesc}>Add your certifications, licenses or proof of experience{'\n'}(optional but recommended).</Text>
            <TouchableOpacity style={styles.uploadCard} activeOpacity={0.8}>
              <View style={styles.uploadIcon}>
                <Ionicons name="cloud-upload-outline" size={28} color="#888" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.uploadCardTitle}>Upload Files</Text>
                <Text style={styles.uploadCardDesc}>PDF, JPG, PNG • Max 10MB</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#555" />
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={[styles.continueBtn, isSaving && { opacity: 0.7 }]}
            onPress={handleContinue}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.continueBtnText}>Continue</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backLinkBtn} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Back</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Dropdowns */}
      <DropdownModal
        visible={dropdown === 'spec'}
        title="Select Specialization"
        options={SPECIALIZATIONS}
        onSelect={setSpec}
        onClose={() => setDropdown(null)}
      />
      <DropdownModal
        visible={dropdown === 'level'}
        title="Select Experience Level"
        options={EXPERIENCE_LEVELS}
        onSelect={setExpLevel}
        onClose={() => setDropdown(null)}
      />
      <DropdownModal
        visible={dropdown === 'years'}
        title="Years of Experience"
        options={YEARS_OPTIONS}
        onSelect={setYears}
        onClose={() => setDropdown(null)}
      />

    </SafeAreaView>
  );
}

// ── Progress Step Components ──────────────────────────────────────────────────
function Step({ num, label, done, active }: { num: number; label: string; done?: boolean; active?: boolean }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <View style={[p.circle, (done || active) && p.circleActive]}>
        {done
          ? <Ionicons name="checkmark" size={16} color="#000" />
          : <Text style={[p.num, (done || active) && p.numActive]}>{num}</Text>}
      </View>
      <Text style={[p.label, active && p.labelActive]}>{label}</Text>
    </View>
  );
}
function Line({ done }: { done?: boolean }) {
  return <View style={[p.line, done && p.lineDone]} />;
}

// ── StyleSheets ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 48, maxWidth: 520, alignSelf: 'center', width: '100%' },

  progress: { flexDirection: 'row', alignItems: 'center', marginBottom: 36 },

  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 28 },
  titleIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#FFF', marginBottom: 6 },
  subtitle: { color: '#888', fontSize: 13, lineHeight: 20 },

  card: { backgroundColor: '#0D0D0D', borderRadius: 16, borderWidth: 1, borderColor: '#1F1F1F', marginBottom: 32, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: '#1A1A1A', marginLeft: 56 },

  uploadSection: { marginBottom: 32 },
  uploadTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  uploadDesc: { color: '#888', fontSize: 13, lineHeight: 20, marginBottom: 16 },
  uploadCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D0D0D', borderRadius: 14, borderWidth: 1, borderColor: '#1F1F1F', padding: 16, gap: 14 },
  uploadIcon: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },
  uploadCardTitle: { color: '#FFF', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  uploadCardDesc: { color: '#777', fontSize: 12 },

  continueBtn: { backgroundColor: Colors.primary, borderRadius: 100, height: 56, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  continueBtnText: { color: '#000', fontSize: 17, fontWeight: '700' },
  backLinkBtn: { alignItems: 'center', paddingVertical: 8 },
  backLinkText: { color: '#777', fontSize: 15 },
});

const p = StyleSheet.create({
  circle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: '#333', justifyContent: 'center', alignItems: 'center', marginBottom: 6, backgroundColor: '#000' },
  circleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  num: { color: '#555', fontSize: 13, fontWeight: '700' },
  numActive: { color: '#000' },
  label: { color: '#555', fontSize: 10, textAlign: 'center' },
  labelActive: { color: '#FFF', fontWeight: '600' },
  line: { flex: 1.5, height: 1.5, backgroundColor: '#2A2A2A', marginBottom: 22 },
  lineDone: { backgroundColor: Colors.primary },
});

const f = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 14 },
  iconCol: { width: 40, paddingTop: 20 },
  col: { flex: 1 },
  label: { color: '#777', fontSize: 11, marginBottom: 4 },
  input: { color: '#FFF', fontSize: 15, paddingVertical: 0 },
  dropdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textArea: { minHeight: 80 },
  charCount: { color: '#444', fontSize: 11, textAlign: 'right', marginTop: 4 },
});

const dd = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '65%' },
  handle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { color: '#FFF', fontSize: 17, fontWeight: '700', marginBottom: 16 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  itemText: { color: '#DDD', fontSize: 15 },
});
