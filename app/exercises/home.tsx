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
import { Colors } from '../../constants/colors';
import BackButton from '../../components/ui/BackButton';
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
        const matchesCat =
          ex.homeCategory === selectedCategory ||
          ex.bodyPart.toLowerCase() === selectedCategory.toLowerCase() ||
          (selectedCategory === 'home' && (ex.homeCategory === 'home' || ex.bodyPart.toLowerCase() === 'bodyweight' || ex.bodyPart.toLowerCase() === 'abs'));
        if (!matchesCat) {
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
        <BackButton fallbackRoute="/challenge" />

        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>ZERO EQUIPMENT</Text>
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
            <Ionicons name="home" size={26} color={Colors.primary} />
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
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search home workout, stretch, yoga..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Pills (Horizontal Scroll) */}
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
            <Text
              style={[
                styles.catTabText,
                selectedCategory === 'all' && styles.catTabTextActive,
              ]}
            >
              🔥 All Home
            </Text>
          </TouchableOpacity>

          {HOME_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catTab, isActive && styles.catTabActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={isActive ? '#000000' : Colors.textMuted}
                />
                <Text
                  style={[styles.catTabText, isActive && styles.catTabTextActive]}
                >
                  {cat.name} ({cat.count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Exercise List */}
        <View style={styles.exercisesList}>
          {filteredExercises.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="home-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No workouts found</Text>
              <Text style={styles.emptySub}>
                Try adjusting your search or switching to another category.
              </Text>
            </View>
          ) : (
            filteredExercises.map((item) => (
              <View key={item.id} style={styles.exerciseCard}>
                {/* Animation Image Preview */}
                <Image
                  source={{ uri: item.animationUrl }}
                  style={styles.cardThumb}
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  transition={200}
                />

                {/* Info */}
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
                      <Ionicons name="checkmark-circle" size={13} color={Colors.primary} />
                      <Text style={styles.noEquipText}>No Equipment</Text>
                    </View>
                    <Text style={styles.durationText}>
                      ⏱️ {item.defaultDurationSeconds ? `${item.defaultDurationSeconds}s` : '30s'}
                    </Text>
                  </View>

                  {/* Start Exercise Button */}
                  <TouchableOpacity
                    style={styles.startExerciseBtn}
                    activeOpacity={0.8}
                    onPress={() => handleStartExercise(item)}
                  >
                    <Ionicons name="play" size={14} color="#000000" />
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
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  liveText: {
    color: Colors.primary,
    fontSize: 10,
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
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  heroSub: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 16,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
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
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catTabText: {
    color: Colors.textMuted,
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
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  exerciseCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    padding: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardThumb: {
    width: 80,
    height: 90,
    borderRadius: 8,
    backgroundColor: Colors.background,
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
    color: Colors.textPrimary,
    flex: 1,
  },
  levelBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelBadgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  cardTarget: {
    fontSize: 12,
    color: Colors.textMuted,
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
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  durationText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  startExerciseBtn: {
    backgroundColor: Colors.primary,
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
