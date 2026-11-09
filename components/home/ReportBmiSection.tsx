import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../store/themeStore';

const STORAGE_KEY = '@fitpulse_bmi_data';

export interface BmiData {
  heightCm: number;
  weightKg: number;
  unit: 'metric' | 'imperial';
}

const DEFAULT_BMI: BmiData = {
  heightCm: 175, // 5 ft 9 in
  weightKg: 75,  // ~24.5 BMI
  unit: 'imperial',
};

export function calcBmi(heightCm: number, weightKg: number): number {
  if (!heightCm || !weightKg) return 24.4;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

export function getBmiCategory(bmi: number): {
  label: string;
  color: string;
  advice: string;
} {
  if (bmi < 18.5) {
    return {
      label: 'Underweight',
      color: '#38BDF8',
      advice: 'Target nutrient-dense meals & progressive resistance training to build healthy mass.',
    };
  }
  if (bmi < 25) {
    return {
      label: 'Healthy weight',
      color: '#10B981',
      advice: 'Great balance! Maintain regular athletic conditioning & wholesome recovery.',
    };
  }
  if (bmi < 30) {
    return {
      label: 'Overweight',
      color: '#F59E0B',
      advice: 'Incorporate consistent HIIT cardio and a light calorie deficit to lean down.',
    };
  }
  return {
    label: 'Obese',
    color: '#EF4444',
    advice: 'Consult with our FitPulse certified coaches to establish an active fat-loss plan.',
  };
}

export default function ReportBmiSection() {
  const router = useRouter();
  const { colors } = useTheme();

  const [bmiData, setBmiData] = useState<BmiData>(DEFAULT_BMI);
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit form state
  const [editUnit, setEditUnit] = useState<'metric' | 'imperial'>('imperial');
  const [inputWeight, setInputWeight] = useState('75');
  const [inputHeightFeet, setInputHeightFeet] = useState('5');
  const [inputHeightInches, setInputHeightInches] = useState('9');
  const [inputHeightCm, setInputHeightCm] = useState('175');

  // Load saved data
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.heightCm && parsed?.weightKg) {
            setBmiData(parsed);
          }
        }
      } catch {}
    })();
  }, []);

  const bmi = calcBmi(bmiData.heightCm, bmiData.weightKg);
  const category = getBmiCategory(bmi);

  // Compute needle percentage position along 15 to 40 spectrum
  // 15 is 0%, 40 is 100%
  const clampedBmi = Math.max(15, Math.min(40, bmi));
  const pointerPercent = ((clampedBmi - 15) / (40 - 15)) * 100;

  // Format height display
  const totalInches = Math.round(bmiData.heightCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  const heightDisplay = `${feet} ft ${inches} in (${bmiData.heightCm} cm)`;
  const weightDisplay = `${Math.round(bmiData.weightKg * 2.20462)} lbs (${bmiData.weightKg} kg)`;

  const openEditor = () => {
    setEditUnit(bmiData.unit || 'imperial');
    setInputWeight(String(bmiData.weightKg));
    setInputHeightCm(String(bmiData.heightCm));
    setInputHeightFeet(String(feet));
    setInputHeightInches(String(inches));
    setShowEditModal(true);
  };

  const handleSave = async () => {
    let finalCm = 175;
    let finalKg = 75;

    if (editUnit === 'imperial') {
      const f = parseInt(inputHeightFeet, 10) || 5;
      const inc = parseInt(inputHeightInches, 10) || 9;
      finalCm = Math.round((f * 12 + inc) * 2.54);
      // If user typed weight in lbs
      const lbs = parseFloat(inputWeight) || 165;
      finalKg = Math.round(lbs / 2.20462);
    } else {
      finalCm = parseInt(inputHeightCm, 10) || 175;
      finalKg = parseFloat(inputWeight) || 75;
    }

    const updated: BmiData = {
      heightCm: Math.max(100, Math.min(250, finalCm)),
      weightKg: Math.max(30, Math.min(300, finalKg)),
      unit: editUnit,
    };

    setBmiData(updated);
    setShowEditModal(false);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  return (
    <View style={styles.container}>
      {/* ── Section Header ── */}
      <View style={styles.sectionHeader}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="speedometer" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Fitness Report</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/report')}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>Full Report →</Text>
        </TouchableOpacity>
      </View>

      {/* ── Main BMI Card (Image 4 Replica) ── */}
      <View style={[styles.bmiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Card Top: Title & Edit Button */}
        <View style={styles.bmiCardTop}>
          <Text style={[styles.bmiCardLabel, { color: colors.textPrimary }]}>BMI</Text>
          <TouchableOpacity
            style={[styles.editPillBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={openEditor}
          >
            <Text style={styles.editPillBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* BMI Score & Status Dot */}
        <View style={styles.scoreRow}>
          <Text style={[styles.scoreNumber, { color: colors.textPrimary }]}>{bmi}</Text>
          <View style={styles.statusWrap}>
            <View style={[styles.statusDot, { backgroundColor: category.color }]} />
            <Text style={[styles.statusText, { color: category.color }]}>{category.label}</Text>
          </View>
        </View>

        {/* ── Visual Spectrum Bar (Image 4) ── */}
        <View style={styles.spectrumWrap}>
          {/* Active Arrow Pointer */}
          <View style={[styles.pointerWrap, { left: `${Math.min(96, Math.max(2, pointerPercent))}%` }]}>
            <Text style={[styles.pointerArrow, { color: category.color }]}>▼</Text>
          </View>

          {/* Color Segments Bar */}
          <View style={styles.spectrumBar}>
            <View style={[styles.seg, { backgroundColor: '#38BDF8', flex: 1.5 }]} />
            <View style={[styles.seg, { backgroundColor: '#60A5FA', flex: 2 }]} />
            <View style={[styles.seg, { backgroundColor: '#10B981', flex: 6.4 }]} />
            <View style={[styles.seg, { backgroundColor: '#F59E0B', flex: 5 }]} />
            <View style={[styles.seg, { backgroundColor: '#FB923C', flex: 5 }]} />
            <View style={[styles.seg, { backgroundColor: '#EF4444', flex: 5 }]} />
          </View>

          {/* Spectrum Numbers */}
          <View style={styles.scaleRow}>
            <Text style={styles.scaleText}>15</Text>
            <Text style={styles.scaleText}>16</Text>
            <Text style={styles.scaleText}>18.5</Text>
            <Text style={styles.scaleText}>25</Text>
            <Text style={styles.scaleText}>30</Text>
            <Text style={styles.scaleText}>35</Text>
            <Text style={styles.scaleText}>40</Text>
          </View>
        </View>

        {/* Height & Weight Display */}
        <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
          <View style={styles.metaCol}>
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Height</Text>
            <TouchableOpacity onPress={openEditor} style={styles.metaValueRow}>
              <Text style={[styles.metaValue, { color: colors.textPrimary }]}>{heightDisplay}</Text>
              <Ionicons name="pencil" size={13} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />

          <View style={styles.metaCol}>
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Weight</Text>
            <TouchableOpacity onPress={openEditor} style={styles.metaValueRow}>
              <Text style={[styles.metaValue, { color: colors.textPrimary }]}>{weightDisplay}</Text>
              <Ionicons name="pencil" size={13} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Health Recommendation Advice */}
        <View style={[styles.adviceBox, { backgroundColor: colors.surfaceLight }]}>
          <Ionicons name="fitness-outline" size={16} color={category.color} />
          <Text style={[styles.adviceText, { color: colors.textSecondary }]}>
            {category.advice}
          </Text>
        </View>
      </View>

      {/* ── Interactive Height & Weight Edit Modal ── */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowEditModal(false)}>
          <TouchableOpacity
            style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Body Metrics</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Unit Switcher */}
            <View style={[styles.unitToggleWrap, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.unitBtn, editUnit === 'imperial' && { backgroundColor: colors.primary }]}
                onPress={() => setEditUnit('imperial')}
              >
                <Text style={[styles.unitBtnText, editUnit === 'imperial' && { color: '#000', fontWeight: '800' }]}>
                  Imperial (ft / lbs)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitBtn, editUnit === 'metric' && { backgroundColor: colors.primary }]}
                onPress={() => setEditUnit('metric')}
              >
                <Text style={[styles.unitBtnText, editUnit === 'metric' && { color: '#000', fontWeight: '800' }]}>
                  Metric (cm / kg)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Height Input */}
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Height</Text>
            {editUnit === 'imperial' ? (
              <View style={styles.imperialRow}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.surfaceLight, borderColor: colors.border, color: colors.textPrimary }]}
                    keyboardType="numeric"
                    value={inputHeightFeet}
                    onChangeText={setInputHeightFeet}
                    placeholder="5"
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text style={[styles.subInputLabel, { color: colors.textMuted }]}>Feet</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.surfaceLight, borderColor: colors.border, color: colors.textPrimary }]}
                    keyboardType="numeric"
                    value={inputHeightInches}
                    onChangeText={setInputHeightInches}
                    placeholder="9"
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text style={[styles.subInputLabel, { color: colors.textMuted }]}>Inches</Text>
                </View>
              </View>
            ) : (
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.surfaceLight, borderColor: colors.border, color: colors.textPrimary }]}
                keyboardType="numeric"
                value={inputHeightCm}
                onChangeText={setInputHeightCm}
                placeholder="175 cm"
                placeholderTextColor={colors.textMuted}
              />
            )}

            {/* Weight Input */}
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
              Weight ({editUnit === 'imperial' ? 'lbs' : 'kg'})
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceLight, borderColor: colors.border, color: colors.textPrimary }]}
              keyboardType="numeric"
              value={inputWeight}
              onChangeText={setInputWeight}
              placeholder={editUnit === 'imperial' ? '165 lbs' : '75 kg'}
              placeholderTextColor={colors.textMuted}
            />

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.88}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>Save & Calculate BMI</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Main BMI Card
  bmiCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    gap: 14,
  },
  bmiCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bmiCardLabel: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  editPillBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  editPillBtnText: {
    color: '#000',
    fontSize: 12.5,
    fontWeight: '800',
  },

  // Score row
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreNumber: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Spectrum Bar
  spectrumWrap: {
    marginTop: 4,
    marginBottom: 4,
    position: 'relative',
  },
  pointerWrap: {
    position: 'absolute',
    top: -12,
    marginLeft: -6,
    zIndex: 10,
  },
  pointerArrow: {
    fontSize: 12,
    fontWeight: '900',
  },
  spectrumBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    gap: 2,
    backgroundColor: '#1E293B',
  },
  seg: {
    height: '100%',
    borderRadius: 2,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  scaleText: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
  },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  metaCol: {
    flex: 1,
    gap: 3,
  },
  metaLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaValue: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  metaDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 12,
  },

  // Advice Box
  adviceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    marginTop: 2,
  },
  adviceText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
    fontWeight: '500',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  unitToggleWrap: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    marginVertical: 4,
  },
  unitBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 9,
    alignItems: 'center',
  },
  unitBtnText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  imperialRow: {
    flexDirection: 'row',
    gap: 10,
  },
  subInputLabel: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 3,
  },
  modalInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
});
