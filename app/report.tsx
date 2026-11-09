import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../store/themeStore';
import BackButton from '../components/ui/BackButton';
import {
  BmiData,
  calcBmi,
  getBmiCategory,
} from '../components/home/ReportBmiSection';

const STORAGE_KEY = '@fitpulse_bmi_data';

export default function ReportScreen() {
  const { colors } = useTheme();

  const [bmiData, setBmiData] = useState<BmiData>({
    heightCm: 175,
    weightKg: 75,
    unit: 'imperial',
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editUnit, setEditUnit] = useState<'metric' | 'imperial'>('imperial');
  const [inputWeight, setInputWeight] = useState('75');
  const [inputHeightFeet, setInputHeightFeet] = useState('5');
  const [inputHeightInches, setInputHeightInches] = useState('9');
  const [inputHeightCm, setInputHeightCm] = useState('175');

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

  // Clamped pointer position (15 to 40)
  const clampedBmi = Math.max(15, Math.min(40, bmi));
  const pointerPercent = ((clampedBmi - 15) / (40 - 15)) * 100;

  // Height and weight displays
  const totalInches = Math.round(bmiData.heightCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  const heightDisplay = `${feet} ft ${inches} in (${bmiData.heightCm} cm)`;
  const weightDisplay = `${Math.round(bmiData.weightKg * 2.20462)} lbs (${bmiData.weightKg} kg)`;

  // Ideal weight range for height
  const heightM = bmiData.heightCm / 100;
  const minHealthyKg = Math.round(18.5 * heightM * heightM);
  const maxHealthyKg = Math.round(24.9 * heightM * heightM);
  const minHealthyLbs = Math.round(minHealthyKg * 2.20462);
  const maxHealthyLbs = Math.round(maxHealthyKg * 2.20462);

  // Estimated daily calories (Harris-Benedict baseline)
  const estBmr = Math.round(10 * bmiData.weightKg + 6.25 * bmiData.heightCm - 5 * 25 + 5);
  const maintCals = Math.round(estBmr * 1.4);

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

  const handleShareReport = async () => {
    try {
      await Share.share({
        message: `My FitPulse Body Report:\nBMI: ${bmi} (${category.label})\nHeight: ${heightDisplay}\nWeight: ${weightDisplay}\nTrack with FitPulse!`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* ── App Bar Header (Image 4 Style) ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <BackButton />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>REPORT</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShareReport} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── Main BMI Card (Image 4 Replica) ── */}
        <View style={[styles.bmiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.bmiCardTop}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>BMI</Text>
            <TouchableOpacity
              style={[styles.editPill, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
              onPress={openEditor}
            >
              <Text style={styles.editPillText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Current Score & Status */}
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreNumber, { color: colors.textPrimary }]}>{bmi}</Text>
            <View style={styles.statusWrap}>
              <View style={[styles.statusDot, { backgroundColor: category.color }]} />
              <Text style={[styles.statusText, { color: category.color }]}>{category.label}</Text>
            </View>
          </View>

          {/* Spectrum Bar (Image 4) */}
          <View style={styles.spectrumContainer}>
            <View style={[styles.pointerWrap, { left: `${Math.min(96, Math.max(2, pointerPercent))}%` }]}>
              <Text style={[styles.pointerArrow, { color: category.color }]}>▼</Text>
            </View>

            <View style={styles.spectrumBar}>
              <View style={[styles.seg, { backgroundColor: '#38BDF8', flex: 1.5 }]} />
              <View style={[styles.seg, { backgroundColor: '#60A5FA', flex: 2 }]} />
              <View style={[styles.seg, { backgroundColor: '#10B981', flex: 6.4 }]} />
              <View style={[styles.seg, { backgroundColor: '#F59E0B', flex: 5 }]} />
              <View style={[styles.seg, { backgroundColor: '#FB923C', flex: 5 }]} />
              <View style={[styles.seg, { backgroundColor: '#EF4444', flex: 5 }]} />
            </View>

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

          {/* Height and Weight */}
          <View style={[styles.metricsRow, { borderTopColor: colors.border }]}>
            <View style={styles.metricCol}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Height</Text>
              <TouchableOpacity onPress={openEditor} style={styles.metricValRow}>
                <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{heightDisplay}</Text>
                <Ionicons name="pencil" size={13} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.metricDiv, { backgroundColor: colors.border }]} />

            <View style={styles.metricCol}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Weight</Text>
              <TouchableOpacity onPress={openEditor} style={styles.metricValRow}>
                <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{weightDisplay}</Text>
                <Ionicons name="pencil" size={13} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Healthy Weight Range Recommendation ── */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text style={[styles.infoCardTitle, { color: colors.textPrimary }]}>Healthy Weight Target</Text>
          </View>
          <Text style={[styles.infoCardSub, { color: colors.textMuted }]}>
            For your height of {heightDisplay}, the ideal medical BMI standard (18.5 - 24.9) suggests:
          </Text>
          <View style={[styles.highlightRow, { backgroundColor: colors.surfaceLight }]}>
            <Text style={[styles.highlightNumber, { color: colors.primary }]}>
              {minHealthyLbs} - {maxHealthyLbs} lbs
            </Text>
            <Text style={[styles.highlightSub, { color: colors.textMuted }]}>
              ({minHealthyKg} - {maxHealthyKg} kg)
            </Text>
          </View>
        </View>

        {/* ── Daily Energy & Nutrition Recommendation ── */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="flame" size={20} color="#F59E0B" />
            <Text style={[styles.infoCardTitle, { color: colors.textPrimary }]}>Metabolism & Calorie Targets</Text>
          </View>
          <View style={styles.statGrid}>
            <View style={[styles.statBox, { backgroundColor: colors.surfaceLight }]}>
              <Text style={[styles.statBoxLabel, { color: colors.textMuted }]}>Basal Metabolic Rate</Text>
              <Text style={[styles.statBoxValue, { color: colors.textPrimary }]}>{estBmr} kcal</Text>
              <Text style={[styles.statBoxSub, { color: colors.textMuted }]}>At complete rest</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.surfaceLight }]}>
              <Text style={[styles.statBoxLabel, { color: colors.textMuted }]}>Daily Maintenance</Text>
              <Text style={[styles.statBoxValue, { color: colors.primary }]}>{maintCals} kcal</Text>
              <Text style={[styles.statBoxSub, { color: colors.textMuted }]}>With active workouts</Text>
            </View>
          </View>
        </View>

        {/* ── Workout Frequency Advisory ── */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="barbell" size={20} color="#3B82F6" />
            <Text style={[styles.infoCardTitle, { color: colors.textPrimary }]}>Recommended Training</Text>
          </View>
          <Text style={[styles.infoCardText, { color: colors.textSecondary }]}>
            {category.advice}
          </Text>
        </View>
      </ScrollView>

      {/* ── Edit Modal ── */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowEditModal(false)}>
          <TouchableOpacity
            style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  shareBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 18,
  },

  // BMI Card
  bmiCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    gap: 16,
  },
  bmiCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  editPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  editPillText: {
    color: '#000',
    fontSize: 12.5,
    fontWeight: '800',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreNumber: {
    fontSize: 38,
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
    fontSize: 15,
    fontWeight: '700',
  },

  // Spectrum
  spectrumContainer: {
    position: 'relative',
    marginVertical: 4,
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

  // Metrics
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  metricCol: {
    flex: 1,
    gap: 3,
  },
  metricLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricValue: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  metricDiv: {
    width: 1,
    height: 32,
    marginHorizontal: 12,
  },

  // Info Cards
  infoCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 12,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  infoCardSub: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  infoCardText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  highlightRow: {
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  highlightNumber: {
    fontSize: 20,
    fontWeight: '900',
  },
  highlightSub: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Stat Grid
  statGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    gap: 3,
  },
  statBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statBoxValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  statBoxSub: {
    fontSize: 11,
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
