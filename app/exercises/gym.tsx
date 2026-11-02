import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import {
  GYM_BODY_PARTS,
  VAULT_EXERCISES,
  VaultExercise,
  BodyPartCategory,
} from '../../constants/exerciseVaultData';

type GenderFilter = 'all' | 'male' | 'female';

export default function GymExercisesScreen() {
  const router = useRouter();
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBodyPart, setExpandedBodyPart] = useState<string | null>('Chest');

  // Filter exercises based on gender and search query
  const filteredExercises = useMemo(() => {
    return VAULT_EXERCISES.filter((ex) => {
      if (ex.category !== 'gym') return false;
      if (genderFilter !== 'all' && ex.gender !== 'unisex' && ex.gender !== genderFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = ex.name.toLowerCase().includes(q);
        const matchesMuscle = ex.targetMuscle.toLowerCase().includes(q);
        const matchesEquip = ex.equipment.some((e) => e.toLowerCase().includes(q));
        const matchesBody = ex.bodyPart.toLowerCase().includes(q);
        return matchesName || matchesMuscle || matchesEquip || matchesBody;
      }
      return true;
    });
  }, [genderFilter, searchQuery]);

  // Group exercises by body part
  const exercisesByBodyPart = useMemo(() => {
    const map = new Map<string, VaultExercise[]>();
    GYM_BODY_PARTS.forEach((bp) => map.set(bp.name, []));

    filteredExercises.forEach((ex) => {
      const list = map.get(ex.bodyPart) || [];
      list.push(ex);
      map.set(ex.bodyPart, list);
    });

    return map;
  }, [filteredExercises]);

  const toggleAccordion = (name: string) => {
    setExpandedBodyPart((prev) => (prev === name ? null : name));
  };

  const handleStartExercise = (exercise: VaultExercise) => {
    // Connect directly to the Interactive Exercise Player with Voice Coach
    router.push({
      pathname: '/exercise/[exerciseId]',
      params: {
        exerciseId: exercise.id,
        day: '1',
        index: '0',
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── HEADER BAR ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>VITAL DATASET</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title Banner */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconBox}>
            <Ionicons name="barbell" size={28} color="#CCFF00" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Gym Exercises</Text>
            <Text style={styles.heroSub}>
              800+ HD Animated Movements • Barbell, Dumbbell, Cable & Machines
            </Text>
          </View>
        </View>

        {/* Gender Tabs (VitalAnimations Replica) */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, genderFilter === 'all' && styles.segmentBtnActive]}
            onPress={() => setGenderFilter('all')}
          >
            <Ionicons
              name="flame"
              size={14}
              color={genderFilter === 'all' ? '#000' : '#8A95A5'}
            />
            <Text
              style={[
                styles.segmentBtnText,
                genderFilter === 'all' && styles.segmentBtnTextActive,
              ]}
            >
              All (801)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, genderFilter === 'male' && styles.segmentBtnActive]}
            onPress={() => setGenderFilter('male')}
          >
            <Ionicons
              name="man"
              size={14}
              color={genderFilter === 'male' ? '#000' : '#8A95A5'}
            />
            <Text
              style={[
                styles.segmentBtnText,
                genderFilter === 'male' && styles.segmentBtnTextActive,
              ]}
            >
              Male (592)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, genderFilter === 'female' && styles.segmentBtnActive]}
            onPress={() => setGenderFilter('female')}
          >
            <Ionicons
              name="woman"
              size={14}
              color={genderFilter === 'female' ? '#000' : '#8A95A5'}
            />
            <Text
              style={[
                styles.segmentBtnText,
                genderFilter === 'female' && styles.segmentBtnTextActive,
              ]}
            >
              Female (305)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarWrap}>
          <Ionicons name="search" size={18} color="#717D90" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercise, muscle (e.g. Chest, Quads)..."
            placeholderTextColor="#667085"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#717D90" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── ACCORDION LIST OF 8 BODY PARTS ── */}
        <View style={styles.accordionsWrap}>
          {GYM_BODY_PARTS.map((bp: BodyPartCategory) => {
            const isExpanded = expandedBodyPart === bp.name;
            const exercises = exercisesByBodyPart.get(bp.name) || [];
            const displayCount =
              genderFilter === 'male'
                ? bp.maleCount
                : genderFilter === 'female'
                ? bp.femaleCount
                : bp.totalCount;

            return (
              <View key={bp.id} style={styles.accordionContainer}>
                {/* Accordion Header */}
                <TouchableOpacity
                  style={[
                    styles.accordionHeader,
                    isExpanded && styles.accordionHeaderExpanded,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => toggleAccordion(bp.name)}
                >
                  <View style={styles.accordionHeaderLeft}>
                    <View style={[styles.accordionIconCircle, { backgroundColor: bp.color + '20' }]}>
                      <Ionicons name={bp.icon as any} size={16} color={bp.color} />
                    </View>
                    <Text style={styles.accordionTitle}>{bp.name}</Text>
                  </View>

                  <View style={styles.accordionHeaderRight}>
                    <View style={styles.countPill}>
                      <Text style={styles.countPillText}>{displayCount}</Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#8A95A5"
                    />
                  </View>
                </TouchableOpacity>

                {/* Accordion Content */}
                {isExpanded && (
                  <View style={styles.accordionBody}>
                    {exercises.length === 0 ? (
                      <View style={styles.emptyExercises}>
                        <Ionicons name="barbell-outline" size={28} color="#4A5568" />
                        <Text style={styles.emptyExercisesText}>
                          {displayCount} exercises cataloged. Select an exercise to preview form & start.
                        </Text>
                      </View>
                    ) : (
                      exercises.map((item) => (
                        <View key={item.id} style={styles.exerciseCard}>
                          {/* Animation Image Preview */}
                          <Image
                            source={{ uri: item.animationUrl }}
                            style={styles.cardThumb}
                            cachePolicy="memory-disk"
                            contentFit="cover"
                            transition={200}
                          />

                          {/* Exercise Info */}
                          <View style={styles.cardInfo}>
                            <View style={styles.cardTitleRow}>
                              <Text style={styles.cardName} numberOfLines={1}>
                                {item.name}
                              </Text>
                              <View style={styles.levelBadge}>
                                <Text style={styles.levelBadgeText}>{item.level}</Text>
                              </View>
                            </View>

                            <Text style={styles.cardTarget}>
                              🎯 {item.targetMuscle}
                            </Text>

                            <View style={styles.cardEquipRow}>
                              {item.equipment.map((eq) => (
                                <View key={eq} style={styles.cardEquipPill}>
                                  <Text style={styles.cardEquipPillText}>{eq}</Text>
                                </View>
                              ))}
                              <Text style={styles.repsText}>
                                {item.defaultReps ? `${item.defaultReps} reps` : `${item.defaultDurationSeconds}s`}
                              </Text>
                            </View>

                            {/* Start Exercise Button */}
                            <TouchableOpacity
                              style={styles.startExerciseBtn}
                              activeOpacity={0.8}
                              onPress={() => handleStartExercise(item)}
                            >
                              <Ionicons name="play" size={14} color="#000" />
                              <Text style={styles.startExerciseBtnText}>
                                Start with Voice Coach
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070D18',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CCFF00',
  },
  liveText: {
    color: '#CCFF00',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(204, 255, 0, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.15)',
  },
  heroIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 12,
    color: '#8A95A5',
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 4,
    borderRadius: 12,
    marginBottom: 14,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#CCFF00',
  },
  segmentBtnText: {
    color: '#8A95A5',
    fontSize: 12,
    fontWeight: '700',
  },
  segmentBtnTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    padding: 0,
  },
  accordionsWrap: {
    gap: 10,
  },
  accordionContainer: {
    backgroundColor: '#0E1620',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  accordionHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accordionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  accordionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countPillText: {
    color: '#A0AEC0',
    fontSize: 12,
    fontWeight: '700',
  },
  accordionBody: {
    padding: 12,
    gap: 12,
  },
  emptyExercises: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyExercisesText: {
    color: '#717D90',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  exerciseCard: {
    flexDirection: 'row',
    backgroundColor: '#131D2A',
    borderRadius: 12,
    padding: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  cardThumb: {
    width: 85,
    height: 95,
    borderRadius: 8,
    backgroundColor: '#070D18',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  levelBadge: {
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelBadgeText: {
    color: '#CCFF00',
    fontSize: 10,
    fontWeight: '800',
  },
  cardTarget: {
    fontSize: 12,
    color: '#8A95A5',
    fontWeight: '600',
    marginTop: 2,
  },
  cardEquipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
    flexWrap: 'wrap',
  },
  cardEquipPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardEquipPillText: {
    color: '#CCD6E0',
    fontSize: 10,
    fontWeight: '600',
  },
  repsText: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  startExerciseBtn: {
    backgroundColor: '#CCFF00',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  startExerciseBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
  },
});
