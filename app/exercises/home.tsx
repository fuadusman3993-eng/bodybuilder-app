import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  HOME_CATEGORIES,
  VAULT_EXERCISES,
  VaultExercise,
} from '../../constants/exerciseVaultData';

export default function HomeWorkoutsScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExercises = useMemo(() => {
    return VAULT_EXERCISES.filter((ex) => {
      if (ex.category !== 'home') return false;
      if (selectedCategory !== 'all') {
        const catObj = HOME_CATEGORIES.find((c) => c.id === selectedCategory);
        if (catObj && ex.bodyPart.toLowerCase() !== catObj.name.toLowerCase() && !catObj.name.toLowerCase().includes(ex.bodyPart.toLowerCase())) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = ex.name.toLowerCase().includes(q);
        const matchesMuscle = ex.targetMuscle.toLowerCase().includes(q);
        const matchesBody = ex.bodyPart.toLowerCase().includes(q);
        return matchesName || matchesMuscle || matchesBody;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const handleStartExercise = (exercise: VaultExercise) => {
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
          <Text style={styles.liveText}>NO EQUIPMENT</Text>
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
            <Ionicons name="home" size={28} color="#FF5376" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Home Workouts</Text>
            <Text style={styles.heroSub}>
              800+ No-Equipment Routines • Yoga, Pilates, Office & Mobility
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarWrap}>
          <Ionicons name="search" size={18} color="#717D90" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search home workout, stretch, yoga..."
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

        {/* Category Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          <TouchableOpacity
            style={[
              styles.catTab,
              selectedCategory === 'all' && styles.catTabActive,
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Ionicons
              name="sparkles"
              size={14}
              color={selectedCategory === 'all' ? '#000' : '#8A95A5'}
            />
            <Text
              style={[
                styles.catTabText,
                selectedCategory === 'all' && styles.catTabTextActive,
              ]}
            >
              All (800+)
            </Text>
          </TouchableOpacity>

          {HOME_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catTab, isSelected && styles.catTabActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={isSelected ? '#000' : cat.color}
                />
                <Text
                  style={[
                    styles.catTabText,
                    isSelected && styles.catTabTextActive,
                  ]}
                >
                  {cat.name} ({cat.count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Exercise Cards */}
        <View style={styles.exercisesList}>
          {filteredExercises.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="fitness-outline" size={36} color="#717D90" />
              <Text style={styles.emptyTitle}>No workouts found</Text>
              <Text style={styles.emptySub}>
                Try selecting "All" or clearing the search query.
              </Text>
            </View>
          ) : (
            filteredExercises.map((item) => (
              <View key={item.id} style={styles.exerciseCard}>
                <Image
                  source={{ uri: item.animationUrl }}
                  style={styles.cardThumb}
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  transition={200}
                />

                <View style={styles.cardInfo}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelBadgeText}>{item.level}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardTarget}>🎯 {item.targetMuscle}</Text>

                  <View style={styles.cardMetaRow}>
                    <View style={styles.noEquipBadge}>
                      <Ionicons name="checkmark-circle" size={12} color="#00E676" />
                      <Text style={styles.noEquipText}>No Equipment</Text>
                    </View>
                    <Text style={styles.durationText}>
                      ⏱️ {item.defaultDurationSeconds ? `${item.defaultDurationSeconds}s` : `${item.defaultReps} reps`}
                    </Text>
                  </View>

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
    backgroundColor: 'rgba(255, 83, 118, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 83, 118, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF5376',
  },
  liveText: {
    color: '#FF5376',
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
    backgroundColor: 'rgba(255, 83, 118, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 83, 118, 0.15)',
  },
  heroIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 83, 118, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 83, 118, 0.3)',
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
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    padding: 0,
  },
  catScroll: {
    gap: 8,
    paddingBottom: 16,
  },
  catTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  catTabActive: {
    backgroundColor: '#FF5376',
    borderColor: '#FF5376',
  },
  catTabText: {
    color: '#8A95A5',
    fontSize: 12,
    fontWeight: '700',
  },
  catTabTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  exercisesList: {
    gap: 12,
  },
  emptyCard: {
    backgroundColor: '#0E1620',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptySub: {
    fontSize: 13,
    color: '#8A95A5',
    textAlign: 'center',
  },
  exerciseCard: {
    flexDirection: 'row',
    backgroundColor: '#0E1620',
    borderRadius: 14,
    padding: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
    backgroundColor: 'rgba(255, 83, 118, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelBadgeText: {
    color: '#FF5376',
    fontSize: 10,
    fontWeight: '800',
  },
  cardTarget: {
    fontSize: 12,
    color: '#8A95A5',
    fontWeight: '600',
    marginTop: 2,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  noEquipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noEquipText: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '600',
  },
  durationText: {
    color: '#A0AEC0',
    fontSize: 11,
    fontWeight: '600',
  },
  startExerciseBtn: {
    backgroundColor: '#FF5376',
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
