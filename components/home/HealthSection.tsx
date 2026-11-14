import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
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
      if (val <= 99) return { label: 'Normal Fasting', color: '#00E676' };
      if (val <= 125) return { label: 'Prediabetes Risk', color: '#F59E0B' };
      return { label: 'High (Diabetes Range)', color: '#EF4444' };
    } else {
      if (val < 140) return { label: 'Normal Post-Meal', color: '#00E676' };
      if (val <= 199) return { label: 'Elevated Post-Meal', color: '#F59E0B' };
      return { label: 'High Glucose', color: '#EF4444' };
    }
  };

  // Diagnostic helper for Blood Pressure
  const getBpStatus = (sys: number, dia: number) => {
    if (sys < 120 && dia < 80) return { label: 'Optimal / Normal', color: '#00E676' };
    if (sys <= 129 && dia < 80) return { label: 'Elevated BP', color: '#F59E0B' };
    if (sys <= 139 || dia <= 89) return { label: 'Stage 1 Hypertension', color: '#F97316' };
    return { label: 'Stage 2 Hypertension', color: '#EF4444' };
  };

  const sugarStatus = getSugarStatus(bloodSugar, bloodSugarType);
  const bpStatus = getBpStatus(systolic, diastolic);

  return (
    <View style={styles.container}>
      {/* ── 1. Hero Banner: Diabetes & Blood Pressure Care ── */}
      <View style={[styles.heroBanner, { backgroundColor: '#0B1E28', borderColor: '#16384C' }]}>
        <View style={styles.bannerTagRow}>
          <View style={styles.bannerPill}>
            <Text style={styles.bannerPillText}>🩺 CLINICAL WELLNESS</Text>
          </View>
        </View>
        <Text style={styles.bannerTitle}>Diabetes & Blood Pressure Care</Text>
        <Text style={styles.bannerSub}>
          የስኳር እና የደም ግፊት ቁጥጥር — Track glucose, hypertension risk & consult certified doctors.
        </Text>
        <View style={styles.bannerBtnRow}>
          <TouchableOpacity
            style={[styles.bannerPrimaryBtn, { backgroundColor: '#00E676' }]}
            onPress={() => setShowSugarModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={18} color="#000" />
            <Text style={styles.bannerPrimaryBtnText}>Log Blood Sugar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bannerSecondaryBtn}
            onPress={() => setShowBpModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="pulse-outline" size={18} color="#FFF" />
            <Text style={styles.bannerSecondaryBtnText}>Log Blood Pressure</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 2. Quick Hub: 4 Health Pillars (Mektaterya) ── */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Health Hub (መቆጣጠሪያ)</Text>
        <Text style={styles.sectionBadge}>4 Care Pillars</Text>
      </View>

      <View style={styles.grid}>
        {/* Card 1: Blood Sugar */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface, borderColor: '#1F2937' }]}
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
          <Text style={styles.cardHint}>Tap to log new reading →</Text>
        </TouchableOpacity>

        {/* Card 2: Blood Pressure */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface, borderColor: '#1F2937' }]}
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
          <Text style={styles.cardHint}>Tap to log new reading →</Text>
        </TouchableOpacity>

        {/* Card 3: Diabetic & BP Nutrition */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface, borderColor: '#1F2937' }]}
          onPress={() => router.push('/(tabs)/marketplace')}
          activeOpacity={0.75}
        >
          <View style={styles.cardTop}>
            <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(0, 230, 118, 0.15)' }]}>
              <Ionicons name="nutrition" size={20} color="#00E676" />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(0, 230, 118, 0.15)' }]}>
              <Text style={[styles.statusBadgeText, { color: '#00E676' }]}>Low GI & Sodium</Text>
            </View>
          </View>
          <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Diet & Meals (የምግብ እቅድ)</Text>
          <Text style={[styles.cardDesc, { color: colors.textPrimary }]}>
            ጤፍ፣ ምስር፣ ሰላጣ እና የደም ግፊትን የሚቆጣጠሩ ምግቦች
          </Text>
          <Text style={[styles.cardHint, { color: '#00E676' }]}>View Healthy Foods →</Text>
        </TouchableOpacity>

        {/* Card 4: Medication Routine */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: '#1F2937' }]}>
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
                color={medsTaken[medKey] ? '#00E676' : colors.textMuted}
              />
              <Text style={[styles.medText, { color: medsTaken[medKey] ? colors.textMuted : colors.textPrimary }]}>
                {medKey}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── 3. Doctor & Health Coach Consultation Card ── */}
      <View style={[styles.consultCard, { backgroundColor: '#09212B', borderColor: '#154153' }]}>
        <View style={styles.consultLeft}>
          <View style={styles.doctorAvatarWrap}>
            <Ionicons name="person" size={24} color="#00E676" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.consultTitle}>Consult Health Specialist</Text>
            <Text style={styles.consultSub}>
              ከስኳር እና የደም ግፊት ሀኪሞች ጋር በቀጥታ ይወያዩ (Direct Chat & Video Call).
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.consultBtn}
          onPress={() => router.push('/(tabs)/chat')}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubbles" size={16} color="#000" />
          <Text style={styles.consultBtnText}>Chat with Doctor</Text>
        </TouchableOpacity>
      </View>

      {/* Modal: Log Blood Sugar */}
      <Modal visible={showSugarModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: '#111827', borderColor: '#374151' }]}>
            <Text style={styles.modalTitle}>🩸 Log Blood Sugar (ስኳር)</Text>
            <Text style={styles.modalSub}>Enter your glucose reading in mg/dL</Text>

            <View style={styles.typeSelector}>
              {(['Fasting', 'Post-Meal'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, bloodSugarType === t && styles.typeBtnActive]}
                  onPress={() => setBloodSugarType(t)}
                >
                  <Text style={[styles.typeBtnText, bloodSugarType === t && styles.typeBtnTextActive]}>
                    {t === 'Fasting' ? 'Fasting (የጾም)' : 'Post-Meal (ከምግብ በኋላ)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.modalInput, { borderColor: '#374151', color: '#FFF' }]}
              placeholder="e.g. 95"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
              value={inputSugar}
              onChangeText={setInputSugar}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowSugarModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveSugar}>
                <Text style={styles.modalSaveText}>Save Reading</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Log Blood Pressure */}
      <Modal visible={showBpModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: '#111827', borderColor: '#374151' }]}>
            <Text style={styles.modalTitle}>🩺 Log Blood Pressure (ደም ግፊት)</Text>
            <Text style={styles.modalSub}>Enter Systolic & Diastolic readings (mmHg)</Text>

            <View style={{ flexDirection: 'row', gap: 10, marginVertical: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputMiniLabel}>Systolic (ላይኛው)</Text>
                <TextInput
                  style={[styles.modalInput, { borderColor: '#374151', color: '#FFF' }]}
                  placeholder="e.g. 120"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  value={inputSys}
                  onChangeText={setInputSys}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputMiniLabel}>Diastolic (ታችኛው)</Text>
                <TextInput
                  style={[styles.modalInput, { borderColor: '#374151', color: '#FFF' }]}
                  placeholder="e.g. 80"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  value={inputDia}
                  onChangeText={setInputDia}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowBpModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveBp}>
                <Text style={styles.modalSaveText}>Save Reading</Text>
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
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bannerPillText: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '800',
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  bannerSub: {
    color: '#A0AEC0',
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
    color: '#000',
    fontWeight: '700',
    fontSize: 13,
  },
  bannerSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  bannerSecondaryBtnText: {
    color: '#FFF',
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
    color: '#00E676',
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
  cardHint: {
    fontSize: 11,
    color: '#00E676',
    fontWeight: '600',
    marginTop: 4,
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
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  consultTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  consultSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  consultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00E676',
    paddingVertical: 10,
    borderRadius: 12,
  },
  consultBtnText: {
    color: '#000',
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
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSub: {
    color: '#9CA3AF',
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
    backgroundColor: '#1F2937',
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: '#00E676',
  },
  typeBtnText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
  },
  typeBtnTextActive: {
    color: '#000',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#1F2937',
  },
  inputMiniLabel: {
    color: '#9CA3AF',
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
    color: '#9CA3AF',
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: '#00E676',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalSaveText: {
    color: '#000',
    fontWeight: '700',
  },
});
