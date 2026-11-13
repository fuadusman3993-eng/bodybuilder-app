import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../store/themeStore';
import { useUserStore } from '../../store/userStore';
import { getDiscoverRoutine, getAllDiscoverRoutines } from '../../constants/discoverRoutines';
import ProUpgradeModal from '../../components/wallet/ProUpgradeModal';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = Math.round(width * 0.75);

// Keep track of session-unlocked routines in memory
const sessionUnlockedRoutines = new Set<string>();

export default function DiscoverRoutineDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user, isPremium } = useUserStore();

  const routineId = id || 'abs-4-moves';
  const routine = getDiscoverRoutine(routineId);

  // States
  const [isIntroExpanded, setIsIntroExpanded] = useState(true);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showProUpgradeModal, setShowProUpgradeModal] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [forceUnlocked, setForceUnlocked] = useState(false);

  // Determine if unlocked
  const isUnlocked = isPremium() || sessionUnlockedRoutines.has(routineId) || forceUnlocked;

  if (!routine) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.errorText, { color: colors.textPrimary }]}>Routine not found</Text>
          <TouchableOpacity style={[styles.backPillBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
            <Text style={styles.backPillText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Related routines for "You may like" section
  const allRoutines = getAllDiscoverRoutines();
  const relatedRoutines = allRoutines.filter((r) => r.id !== routine.id).slice(0, 4);

  // Handle Watch Ad Simulation
  const handleWatchAd = () => {
    setIsWatchingAd(true);
    setAdCountdown(5);

    let count = 5;
    const interval = setInterval(() => {
      count -= 1;
      setAdCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        sessionUnlockedRoutines.add(routineId);
        setForceUnlocked(true);
        setIsWatchingAd(false);
        setShowUnlockModal(false);
      }
    }, 1000);
  };

  // Handle Start Workout
  const handleStartWorkout = () => {
    if (!isUnlocked) {
      setShowUnlockModal(true);
      return;
    }

    if (routine.exercises.length === 0) return;
    const firstEx = routine.exercises[0];

    router.push({
      pathname: '/exercise/[exerciseId]',
      params: {
        exerciseId: firstEx.exerciseId,
        routineId: routine.id,
        index: '0',
      },
    } as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* ── 1. Top Hero Image Section ── */}
        <View style={styles.heroWrap}>
          <Image
            source={routine.isLocalImage ? routine.image : { uri: routine.image }}
            style={styles.heroImg}
            resizeMode="cover"
          />

          {/* Cinematic Gradient overlay on bottom of hero */}
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.85)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Floating Circular Back Button */}
          <SafeAreaView edges={['top']} style={styles.heroTopBar}>
            <TouchableOpacity
              style={styles.circleBackBtn}
              activeOpacity={0.8}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* ── 2. Floating Overlapping Sheet (Screenshots 2 & 3 style) ── */}
        <View style={[styles.sheetContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Routine Title */}
          <Text style={[styles.routineTitle, { color: colors.textPrimary }]}>{routine.title}</Text>

          {/* Metadata Row: 3 Pills (Level, Duration, 4 Exercises) */}
          <View style={styles.metaRow}>
            <View style={[styles.metaPill, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
              <Ionicons name="layers-outline" size={15} color={colors.primary} />
              <Text style={[styles.metaPillText, { color: colors.textPrimary }]}>{routine.level}</Text>
            </View>

            <View style={[styles.metaPill, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
              <Ionicons name="time-outline" size={15} color={colors.primary} />
              <Text style={[styles.metaPillText, { color: colors.textPrimary }]}>{routine.time}</Text>
            </View>

            <View style={[styles.metaPill, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
              <Ionicons name="flame-outline" size={15} color={colors.primary} />
              <Text style={[styles.metaPillText, { color: colors.textPrimary }]}>4 Exercises</Text>
            </View>
          </View>

          {/* Introduction Accordion (Screenshot 3) */}
          <View style={[styles.introWrap, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={styles.introHeaderRow}
              activeOpacity={0.8}
              onPress={() => setIsIntroExpanded(!isIntroExpanded)}
            >
              <Text style={[styles.introHeading, { color: colors.textPrimary }]}>Introduction</Text>
              <Ionicons
                name={isIntroExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {isIntroExpanded && (
              <Text style={[styles.introText, { color: colors.textSecondary }]}>
                {routine.introduction}
              </Text>
            )}
          </View>

          {/* Primary Action Button: [ ▶ Unlock ] or [ ▶ Start Workout ] */}
          <TouchableOpacity
            style={[
              styles.primaryCtaBtn,
              { backgroundColor: isUnlocked ? colors.primary : '#2563EB' },
            ]}
            activeOpacity={0.9}
            onPress={handleStartWorkout}
          >
            <View style={styles.ctaContentRow}>
              <Ionicons
                name={isUnlocked ? 'play' : 'lock-closed'}
                size={18}
                color={isUnlocked ? '#000000' : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.primaryCtaText,
                  { color: isUnlocked ? '#000000' : '#FFFFFF' },
                ]}
              >
                {isUnlocked ? 'Start Workout' : 'Unlock'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* ── 3. The 4 Exercises List (User: "4 exsrsice becha new menorew") ── */}
          <View style={styles.exercisesSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Exercises (4 Moves)
              </Text>
              {!isUnlocked && (
                <View style={[styles.proBadgePill, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                  <Ionicons name="lock-closed" size={11} color="#EAB308" />
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>

            <View style={styles.exerciseList}>
              {routine.exercises.map((item, index) => (
                <TouchableOpacity
                  key={item.exerciseId}
                  style={[
                    styles.exerciseCard,
                    { backgroundColor: colors.surfaceLight, borderColor: colors.border },
                  ]}
                  activeOpacity={0.85}
                  onPress={handleStartWorkout}
                >
                  {/* Number Badge */}
                  <View style={[styles.numberBadge, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.numberText, { color: colors.primary }]}>{index + 1}</Text>
                  </View>

                  {/* Thumbnail */}
                  <View style={styles.exThumbWrap}>
                    <Image source={{ uri: item.thumbnail }} style={styles.exThumbImg} />
                    {!isUnlocked && (
                      <View style={styles.exThumbLockOverlay}>
                        <Ionicons name="lock-closed" size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </View>

                  {/* Details */}
                  <View style={styles.exDetails}>
                    <Text style={[styles.exTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.exMetaRow}>
                      <Text style={[styles.exReps, { color: colors.primary }]}>
                        {item.repsOrTime}
                      </Text>
                      <Text style={[styles.exMuscleTag, { color: colors.textMuted }]}>
                        • {item.targetMuscle}
                      </Text>
                    </View>
                  </View>

                  {/* Chevron / Lock Icon */}
                  <Ionicons
                    name={isUnlocked ? 'chevron-forward' : 'lock-closed-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── 4. "You may like" Section (Screenshots 3 & 4) ── */}
          <View style={styles.youMayLikeSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>You may like</Text>

            <View style={styles.relatedList}>
              {relatedRoutines.map((rel) => (
                <TouchableOpacity
                  key={rel.id}
                  style={[
                    styles.relatedCard,
                    { backgroundColor: colors.surfaceLight, borderColor: colors.border },
                  ]}
                  activeOpacity={0.85}
                  onPress={() => {
                    router.push({
                      pathname: '/routine/[id]',
                      params: { id: rel.id },
                    } as any);
                  }}
                >
                  <Image
                    source={rel.isLocalImage ? rel.image : { uri: rel.image }}
                    style={styles.relatedThumb}
                  />
                  <View style={styles.relatedDetails}>
                    <Text style={[styles.relatedTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {rel.title}
                    </Text>
                    <Text style={[styles.relatedSubtitle, { color: colors.textMuted }]}>
                      {rel.time} • <Text style={{ color: colors.primary }}>{rel.level}</Text>
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── 5. UNLOCK PREMIUM WORKOUT MODAL (Screenshot 2 Match!) ── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Modal
        visible={showUnlockModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isWatchingAd) setShowUnlockModal(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.unlockCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                if (!isWatchingAd) setShowUnlockModal(false);
              }}
            >
              <Ionicons name="close-circle" size={26} color={colors.textMuted} />
            </TouchableOpacity>

            {isWatchingAd ? (
              /* Rewarded Ad Simulation Playing View */
              <View style={styles.adPlayingWrap}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={[styles.adPlayingTitle, { color: colors.textPrimary }]}>
                  Watching Sponsored Ad...
                </Text>
                <View style={styles.adCountCircle}>
                  <Text style={styles.adCountText}>{adCountdown}s</Text>
                </View>
                <Text style={[styles.adPlayingDesc, { color: colors.textMuted }]}>
                  Unlocking premium workout for this session. Please do not close.
                </Text>
              </View>
            ) : (
              /* Normal Unlock Options Dialog (Screenshot 2) */
              <>
                {/* Hero Blue Icon with Play & Lock Badge */}
                <View style={styles.modalIconWrap}>
                  <View style={styles.blueSquareIcon}>
                    <Ionicons name="play" size={28} color="#FFFFFF" style={{ marginLeft: 3 }} />
                    <View style={styles.iconLockBadge}>
                      <Ionicons name="lock-closed" size={12} color="#000000" />
                    </View>
                  </View>
                </View>

                {/* Title */}
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  UNLOCK PREMIUM WORKOUT
                </Text>

                {/* Subtitle */}
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Watch a short video to unlock the premium workout once for free
                </Text>

                {/* Option 1: WATCH AD Button */}
                <TouchableOpacity
                  style={styles.watchAdBtn}
                  activeOpacity={0.88}
                  onPress={handleWatchAd}
                >
                  <Ionicons name="play-circle" size={22} color="#FFFFFF" />
                  <Text style={styles.watchAdText}>WATCH AD</Text>
                  <View style={styles.adSmallBadge}>
                    <Text style={styles.adSmallBadgeText}>AD</Text>
                  </View>
                </TouchableOpacity>

                {/* OR Divider */}
                <View style={styles.orRow}>
                  <View style={[styles.orLine, { backgroundColor: colors.border }]} />
                  <Text style={[styles.orText, { color: colors.textMuted }]}>OR</Text>
                  <View style={[styles.orLine, { backgroundColor: colors.border }]} />
                </View>

                {/* Option 2: Go Premium Button */}
                <TouchableOpacity
                  style={styles.goPremiumBtn}
                  activeOpacity={0.88}
                  onPress={() => {
                    setShowUnlockModal(false);
                    setShowProUpgradeModal(true);
                  }}
                >
                  <Ionicons name="sparkles" size={18} color="#000000" />
                  <Text style={styles.goPremiumText}>Go Premium</Text>
                </TouchableOpacity>

                {/* Pricing / Trial text (Screenshot 2) */}
                <Text style={[styles.trialNoticeText, { color: colors.textMuted }]}>
                  Free 7 days trial, then ETB 6,339.20/year{'\n'}Cancel anytime during the trial
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Pro Membership Upgrade Modal */}
      <ProUpgradeModal
        visible={showProUpgradeModal}
        onClose={() => setShowProUpgradeModal(false)}
        coinsBalance={user.coinsBalance || 0}
        onSuccess={() => {
          setForceUnlocked(true);
          setShowProUpgradeModal(false);
        }}
        onOpenTopup={() => {
          setShowProUpgradeModal(false);
          router.push('/wallet');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
  },
  backPillBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backPillText: {
    color: '#000000',
    fontWeight: '800',
  },

  // Hero Section
  heroWrap: {
    height: HERO_HEIGHT,
    width: '100%',
    position: 'relative',
    backgroundColor: '#000000',
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  heroTopBar: {
    position: 'absolute',
    top: 10,
    left: 16,
    zIndex: 10,
  },
  circleBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  // Overlapping Rounded Sheet
  sheetContainer: {
    marginTop: -28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  routineTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 14,
  },

  // Meta pills row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Introduction Accordion
  introWrap: {
    paddingTop: 16,
    borderTopWidth: 1,
    marginBottom: 22,
  },
  introHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  introHeading: {
    fontSize: 16,
    fontWeight: '800',
  },
  introText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
  },

  // Primary CTA Button
  primaryCtaBtn: {
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryCtaText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  // Exercises Section
  exercisesSection: {
    marginBottom: 30,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  proBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  proBadgeText: {
    color: '#EAB308',
    fontSize: 11,
    fontWeight: '800',
  },
  exerciseList: {
    gap: 12,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 12,
    fontWeight: '900',
  },
  exThumbWrap: {
    width: 58,
    height: 58,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  exThumbImg: {
    width: '100%',
    height: '100%',
  },
  exThumbLockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  exTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  exMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exReps: {
    fontSize: 12,
    fontWeight: '800',
  },
  exMuscleTag: {
    fontSize: 12,
    fontWeight: '500',
  },

  // You May Like Section (Screenshots 3 & 4)
  youMayLikeSection: {
    paddingTop: 10,
  },
  relatedList: {
    marginTop: 12,
    gap: 10,
  },
  relatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  relatedThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  relatedDetails: {
    flex: 1,
  },
  relatedTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  relatedSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── UNLOCK MODAL STYLES (Screenshot 2) ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  unlockCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    position: 'relative',
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 5,
  },
  modalIconWrap: {
    marginTop: 8,
    marginBottom: 16,
  },
  blueSquareIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconLockBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#F59E0B',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 22,
    paddingHorizontal: 8,
  },
  watchAdBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#2563EB',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
  },
  watchAdText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  adSmallBadge: {
    position: 'absolute',
    top: 6,
    right: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  adSmallBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 16,
    gap: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    fontSize: 12,
    fontWeight: '800',
  },
  goPremiumBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#F59E0B',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  goPremiumText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
  },
  trialNoticeText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 14,
  },

  // Ad playing simulation
  adPlayingWrap: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 14,
  },
  adPlayingTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  adCountCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adCountText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  adPlayingDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
});
