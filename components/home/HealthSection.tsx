import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/themeStore';
import { useRouter } from 'expo-router';

export default function HealthSection() {
  const { colors } = useTheme();
  const router = useRouter();

  // Blood Sugar State
  const [bloodSugar, setBloodSugar] = useState<number>(98);
  const [bloodSugarType, setBloodSugarType] = useState<'Fasting' | 'Post-Meal'>('Fasting');
  const [showSugarModal, setShowSugarModal] = useState(false);
  const [inputSugar, setInputSugar] = useState('');

  // Blood Pressure State
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [showBpModal, setShowBpModal] = useState(false);
  const [inputSys, setInputSys] = useState('');
  const [inputDia, setInputDia] = useState('');

  // Medication Tracker State
  const [medsTaken, setMedsTaken] = useState<{ [key: string]: boolean }>({
    'Morning Metformin / BP pill': false,
    'Evening Vital Nutrients': false,
  });

  const handleSaveSugar = () => {
    const val = parseFloat(inputSugar);
    if (!val || isNaN(val) || val <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid blood sugar reading (mg/dL).');
      return;
    }
    setBloodSugar(val);
    setShowSugarModal(false);
    setInputSugar('');
  };

  const handleSaveBp = () => {
    const sys = parseInt(inputSys, 10);
    const dia = parseInt(inputDia, 10);
    if (!sys || !dia || isNaN(sys) || isNaN(dia) || sys <= 0 || dia <= 0) {
      Alert.alert('Invalid Input', 'Please enter valid systolic and diastolic values.');
      return;
    }
    setSystolic(sys);
    setDiastolic(dia);
    setShowBpModal(false);
    setInputSys('');
    setInputDia('');
  };

  // Diagnostic helper for Blood Sugar
  const getSugarStatus = (val: number, type: 'Fasting' | 'Post-Meal') => {
    if (type === 'Fasting') {
      if (val < 70) return { label: 'Low (Hypoglycemia)', color: '#EF4444' };
      if (val <= 99) return { label: 'Normal Fasting', color: colors.primary };
      if (val <= 125) return { label: 'Prediabetes Risk', color: '#F59E0B' };
      return { label: 'High (Diabetes Range)', color: '#EF4444' };
    } else {
      if (val < 140) return { label: 'Normal Post-Meal', color: colors.primary };
      if (val <= 199) return { label: 'Elevated Post-Meal', color: '#F59E0B' };
      return { label: 'High Glucose', color: '#EF4444' };
    }
  };

  // Diagnostic helper for Blood Pressure
  const getBpStatus = (sys: number, dia: number) => {
    if (sys < 120 && dia < 80) return { label: 'Optimal / Normal', color: colors.primary };
    if (sys <= 129 && dia < 80) return { label: 'Elevated BP', color: '#F59E0B' };
    if (sys <= 139 || dia <= 89) return { label: 'Stage 1 Hypertension', color: '#F97316' };
    return { label: 'Stage 2 Hypertension', color: '#EF4444' };
  };

  const sugarStatus = getSugarStatus(bloodSugar, bloodSugarType);
  const bpStatus = getBpStatus(systolic, diastolic);

  return (
    <View style={styles.container}>
      {/* ── 1. Hero Banner: Diabetes & Blood Pressure Care ── */}
      <View style={[styles.heroBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.bannerTagRow}>
          <View style={[styles.bannerPill, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}>
            <Text style={[styles.bannerPillText, { color: colors.primary }]}>🩺 CLINICAL WELLNESS</Text>
          </View>
        </View>
        <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>Diabetes & Blood Pressure Care</Text>
        <Text style={[styles.bannerSub, { color: colors.textMuted }]}>
          የስኳር እና የደም ግፊት ቁጥጥር — Track glucose, hypertension risk & consult certified doctors.
        </Text>
        <View style={styles.bannerBtnRow}>
          <TouchableOpacity
            style={[styles.bannerPrimaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowSugarModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={18} color="#000" />
            <Text style={[styles.bannerPrimaryBtnText, { color: '#000' }]}>Log Blood Sugar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bannerSecondaryBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
            onPress={() => setShowBpModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="pulse-outline" size={18} color={colors.textPrimary} />
            <Text style={[styles.bannerSecondaryBtnText, { color: colors.textPrimary }]}>Log Blood Pressure</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 2. Quick Hub: 4 Health Pillars (Mektaterya) ── */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Health Hub (መቆጣጠሪያ)</Text>
        <Text style={[styles.sectionBadge, { color: colors.primary }]}>4 Care Pillars</Text>
      </View>

      <View style={styles.grid}>
        {/* Card 1: Blood Sugar */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowSugarModal(true)}
          activeOpacity={0.75}
        >
          <View style={styles.cardTop}>
            <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="water" size={20} color="#EF4444" />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: sugarStatus.color + '22' }]}>
              <Text style={[styles.statusBadgeText, { color: sugarStatus.color }]}>
                {sugarStatus.label}
              </Text>
            </View>
          </View>
          <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Blood Sugar (ስኳር)</Text>
          <View style={styles.cardValueRow}>
            <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{bloodSugar}</Text>
            <Text style={[styles.cardUnit, { color: colors.textMuted }]}>mg/dL</Text>
          </View>
          <View style={styles.cardHintRow}>
            <Text style={[styles.cardHint, { color: colors.primary }]}>Tap to log new reading</Text>
            <Ionicons name="arrow-forward" size={13} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Card 2: Blood Pressure */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowBpModal(true)}
          activeOpacity={0.75}
        >
          <View style={styles.cardTop}>
            <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Ionicons name="heart" size={20} color="#38BDF8" />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: bpStatus.color + '22' }]}>
              <Text style={[styles.statusBadgeText, { color: bpStatus.color }]}>
                {bpStatus.label}
              </Text>
            </View>
          </View>
          <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Blood Pressure (ደም ግፊት)</Text>
          <View style={styles.cardValueRow}>
            <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{systolic}/{diastolic}</Text>
            <Text style={[styles.cardUnit, { color: colors.textMuted }]}>mmHg</Text>
          </View>
          <View style={styles.cardHintRow}>
            <Text style={[styles.cardHint, { color: colors.primary }]}>Tap to log new reading</Text>
            <Ionicons name="arrow-forward" size={13} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Card 3: Diabetic & BP Nutrition */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/marketplace')}
          activeOpacity={0.75}
        >
          <View style={styles.cardTop}>
            <View style={[styles.cardIconWrap, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="nutrition" size={20} color={colors.primary} />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: colors.primary + '18' }]}>
              <Text style={[styles.statusBadgeText, { color: colors.primary }]}>Low GI & Sodium</Text>
            </View>
          </View>
          <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Diet & Meals (የምግብ እቅድ)</Text>
          <Text style={[styles.cardDesc, { color: colors.textPrimary }]}>
            ጤፍ፣ ምስር፣ ሰላጣ እና የደም ግፊትን የሚቆጣጠሩ ምግቦች
          </Text>
          <View style={styles.cardHintRow}>
            <Text style={[styles.cardHint, { color: colors.primary }]}>View Healthy Foods</Text>
            <Ionicons name="arrow-forward" size={13} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Card 4: Medication Routine */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardTop}>
            <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Ionicons name="medkit" size={20} color="#A855F7" />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Text style={[styles.statusBadgeText, { color: '#A855F7' }]}>Daily Alert</Text>
            </View>
          </View>
          <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Medication (መድኃኒት ማስታወሻ)</Text>
          {Object.keys(medsTaken).map((medKey) => (
            <TouchableOpacity
              key={medKey}
              style={styles.medRow}
              onPress={() => setMedsTaken(prev => ({ ...prev, [medKey]: !prev[medKey] }))}
              activeOpacity={0.7}
            >
              <Ionicons
                name={medsTaken[medKey] ? 'checkbox' : 'square-outline'}
                size={18}
                color={medsTaken[medKey] ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.medText, { color: medsTaken[medKey] ? colors.textMuted : colors.textPrimary }]}>
                {medKey}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── 3. Doctor & Health Coach Consultation Card ── */}
      <View style={[styles.consultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.consultLeft}>
          <View style={[styles.doctorAvatarWrap, { backgroundColor: colors.primary + '18' }]}>
            <Ionicons name="person" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.consultTitle, { color: colors.textPrimary }]}>Consult Health Specialist</Text>
            <Text style={[styles.consultSub, { color: colors.textMuted }]}>
              ከስኳር እና የደም ግፊት ሀኪሞች ጋር በቀጥታ ይወያዩ (Direct Chat & Video Call).
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.consultBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/chat')}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubbles" size={16} color="#000" />
          <Text style={[styles.consultBtnText, { color: '#000' }]}>Chat with Doctor</Text>
        </TouchableOpacity>
      </View>

      {/* Modal: Log Blood Sugar */}
      <Modal visible={showSugarModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>🩸 Log Blood Sugar (ስኳር)</Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>Enter your glucose reading in mg/dL</Text>

            <View style={styles.typeSelector}>
              {(['Fasting', 'Post-Meal'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeBtn,
                    { backgroundColor: colors.surfaceLight },
                    bloodSugarType === t && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setBloodSugarType(t)}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      { color: colors.textMuted },
                      bloodSugarType === t && { color: '#000', fontWeight: '800' },
                    ]}
                  >
                    {t === 'Fasting' ? 'Fasting (የጾም)' : 'Post-Meal (ከምግብ በኋላ)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[
                styles.modalInput,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="e.g. 95"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={inputSugar}
              onChangeText={setInputSugar}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowSugarModal(false)}>
                <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveSugar}
              >
                <Text style={[styles.modalSaveText, { color: '#000' }]}>Save Reading</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Log Blood Pressure */}
      <Modal visible={showBpModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>🩺 Log Blood Pressure (ደም ግፊት)</Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>Enter Systolic & Diastolic readings (mmHg)</Text>

            <View style={{ flexDirection: 'row', gap: 10, marginVertical: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputMiniLabel, { color: colors.textMuted }]}>Systolic (ላይኛው)</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="e.g. 120"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={inputSys}
                  onChangeText={setInputSys}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputMiniLabel, { color: colors.textMuted }]}>Diastolic (ታችኛው)</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="e.g. 80"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={inputDia}
                  onChangeText={setInputDia}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowBpModal(false)}>
                <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveBp}
              >
                <Text style={[styles.modalSaveText, { color: '#000' }]}>Save Reading</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heroBanner: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  bannerTagRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bannerPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  bannerPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  bannerSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  bannerBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bannerPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bannerPrimaryBtnText: {
    fontWeight: '800',
    fontSize: 13,
  },
  bannerSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerSecondaryBtnText: {
    fontWeight: '600',
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 90,
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  cardUnit: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardDesc: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    marginBottom: 6,
  },
  cardHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  cardHint: {
    fontSize: 11,
    fontWeight: '600',
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 3,
  },
  medText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  consultCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 24,
  },
  consultLeft: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  doctorAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  consultTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  consultSub: {
    fontSize: 12,
    marginTop: 2,
  },
  consultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  consultBtnText: {
    fontWeight: '800',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    marginBottom: 14,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  inputMiniLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  modalCancelText: {
    fontWeight: '600',
  },
  modalSaveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalSaveText: {
    fontWeight: '700',
  },
});
