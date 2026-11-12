import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  useWindowDimensions,
  Image,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../store/themeStore';
import BackButton from '../components/ui/BackButton';
import {
  ChestSvg,
  ArmShoulderSvg,
  ButtLegSvg,
  SixPackSvg,
} from '../components/ui/BodyFocusSvg';

export default function DiscoverScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const heroHeight = Math.max(Math.round(width * 0.68), 230);

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const gridItemWidth = Math.floor((width - 32 - 12) / 2);

  const PICKS = [
    {
      id: 'p1',
      title: 'Belly Fat Burner HIIT Beginner',
      time: '20 min',
      level: 'Beginner',
      img: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'p2',
      title: 'Lose Fat (No Jumping!)',
      time: '20 min',
      level: 'Intermediate',
      img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'p3',
      title: 'Full Body Morning Ignition',
      time: '15 min',
      level: 'All Levels',
      img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const STRETCHES = [
    {
      id: 's1',
      title: 'Upper Body Stretching',
      time: '8 min',
      img: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 's2',
      title: 'Lower Body Stretching',
      time: '10 min',
      img: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 's3',
      title: 'Lower Back Pain Relief',
      time: '6 min',
      img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 's4',
      title: 'Back Stretching',
      time: '7 min',
      img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const BODY_FOCUS = [
    {
      id: 'chest',
      title: 'Chest',
      sub: 'Upper & Lower',
      SvgComp: ChestSvg,
      color: '#38BDF8',
    },
    {
      id: 'arm',
      title: 'Arm & Shoulder',
      sub: 'Biceps, Triceps & Delts',
      SvgComp: ArmShoulderSvg,
      color: '#F59E0B',
    },
    {
      id: 'legs',
      title: 'Butt & Leg',
      sub: 'Quads, Glutes & Calves',
      SvgComp: ButtLegSvg,
      color: '#EC4899',
    },
    {
      id: 'abs',
      title: 'Six pack',
      sub: 'Abs & Obliques',
      SvgComp: SixPackSvg,
      color: '#10B981',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* ── App Bar Header (Image 2 style) ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <BackButton />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>DISCOVER</Text>
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            activeOpacity={0.7}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons name="search" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionBtn}
            activeOpacity={0.7}
            onPress={() => router.push('/challenge')}
          >
            <Ionicons name="time-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Collapsible Search */}
      {showSearch && (
        <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search exercises, routines, muscles..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Top Featured Hero Card (HeroBanner Style Replica) ── */}
        <TouchableOpacity
          style={[styles.heroCard, { height: heroHeight, borderColor: colors.border }]}
          activeOpacity={0.9}
          onPress={() => router.push('/challenge')}
        >
          {/* Background Photo */}
          <Image
            source={require('../assets/images/abs-plank-hero.jpg')}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />

          {/* Dark gradient overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.05)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Top: tag badge */}
          <View style={styles.topRow}>
            <View style={styles.tagBadge}>
              <View style={[styles.tagDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.tagText}>TRENDING ROUTINE</Text>
            </View>
          </View>

          {/* Bottom content */}
          <View style={styles.bottomContent}>
            <Text style={styles.title}>
              Only 4 Moves{'\n'}
              <Text style={[styles.titleAccent, { color: colors.primary }]}>for Abs</Text>
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              Burn belly fat &amp; firm your abs. No gear needed.
            </Text>
            <View style={styles.btnMetaRow}>
              <TouchableOpacity
                style={[styles.joinBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
                onPress={() => router.push('/challenge')}
              >
                <Text style={styles.joinBtnText}>▶  Start Workout</Text>
              </TouchableOpacity>
              <Text style={styles.metaText}>⏱ 12 min · No gear</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ── Picks for you Section (Image 2) ── */}
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Picks for you</Text>
        </View>

        <View style={styles.picksList}>
          {PICKS.map((pick) => (
            <TouchableOpacity
              key={pick.id}
              style={[styles.pickRowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.85}
              onPress={() => router.push('/challenge')}
            >
              <ImageBackground
                source={{ uri: pick.img }}
                style={styles.pickRowImg}
                imageStyle={{ borderRadius: 12 }}
              />
              <View style={styles.pickRowDetails}>
                <Text style={[styles.pickRowTitle, { color: colors.textPrimary }]}>
                  {pick.title}
                </Text>
                <Text style={[styles.pickRowSubtitle, { color: colors.textMuted }]}>
                  {pick.time} • {pick.level}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── "Stay active, stay in shape" Program Banner (Image 2) ── */}
        <TouchableOpacity
          style={[styles.programBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={0.88}
          onPress={() => router.push('/challenge')}
        >
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?w=800&auto=format&fit=crop&q=80' }}
            style={styles.programBannerBg}
            imageStyle={{ borderRadius: 18 }}
          >
            <View style={styles.programBannerOverlay}>
              <Text style={styles.programBannerTitle}>Stay active, stay in shape</Text>
              <Text style={styles.programBannerSub}>5 targeted workouts</Text>
              <View style={[styles.programBannerBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.programBannerBtnText}>View Program →</Text>
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        {/* ── Stretching Section (Image 3) ── */}
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Stretching</Text>
        </View>

        <View style={styles.stretchGrid}>
          {STRETCHES.map((str) => (
            <TouchableOpacity
              key={str.id}
              style={[
                styles.stretchItem,
                {
                  width: gridItemWidth,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.85}
              onPress={() => router.push('/challenge')}
            >
              <ImageBackground
                source={{ uri: str.img }}
                style={styles.stretchItemImg}
                imageStyle={{ borderRadius: 12 }}
              />
              <Text style={[styles.stretchItemTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                {str.title}
              </Text>
              <Text style={[styles.stretchItemTime, { color: colors.textMuted }]}>{str.time}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Body focus Section (Image 3 - 4 Corner 2x2 Grid) ── */}
        <View style={styles.sectionTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Body focus</Text>
            <View style={[styles.focusCountPill, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.focusCountPillText, { color: colors.primary }]}>4 TARGETS</Text>
            </View>
          </View>
        </View>

        <View style={styles.bodyFocusGrid}>
          {BODY_FOCUS.map((focus) => {
            const { SvgComp } = focus;
            return (
              <TouchableOpacity
                key={focus.id}
                style={[
                  styles.bodyFocusCard,
                  {
                    width: gridItemWidth,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => router.push('/challenge')}
              >
                {/* Pure Vector Code Graphic */}
                <View style={[styles.bodyFocusSvgWrap, { backgroundColor: colors.surfaceLight }]}>
                  <SvgComp size={54} color={colors.primary} />
                </View>

                <View style={styles.bodyFocusText}>
                  <Text style={[styles.bodyFocusTitle, { color: colors.textPrimary }]}>
                    {focus.title}
                  </Text>
                  <Text style={[styles.bodyFocusSubtitle, { color: colors.textMuted }]}>
                    {focus.sub}
                  </Text>
                </View>

                <View style={styles.bodyFocusFooter}>
                  <Text style={[styles.bodyFocusAction, { color: colors.primary }]}>Start</Text>
                  <Ionicons name="arrow-forward-circle" size={17} color={colors.primary} />
                </View>
              </TouchableOpacity>
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActionBtn: {
    padding: 4,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 20,
  },

  // Hero Card (HeroBanner Replica)
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  topRow: {
    padding: 14,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  bottomContent: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    maxWidth: '56%',
    zIndex: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 30,
    letterSpacing: -0.5,
    marginBottom: 5,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  titleAccent: {},
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.90)',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    lineHeight: 16,
  },
  btnMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  joinBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    alignSelf: 'flex-start',
  },
  joinBtnText: { color: '#000', fontWeight: '800', fontSize: 13 },
  metaText: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 11.5,
    fontWeight: '600',
  },

  // Headings
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  // Picks for you list
  picksList: {
    gap: 12,
  },
  pickRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  pickRowImg: {
    width: 80,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickRowDetails: {
    flex: 1,
    gap: 4,
  },
  pickRowTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    lineHeight: 18,
  },
  pickRowSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Program banner
  programBanner: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
  },
  programBannerBg: {
    width: '100%',
    minHeight: 140,
    justifyContent: 'center',
  },
  programBannerOverlay: {
    padding: 18,
    backgroundColor: 'rgba(5, 11, 16, 0.72)',
    borderRadius: 18,
    gap: 6,
  },
  programBannerTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  programBannerSub: {
    color: '#94A3B8',
    fontSize: 12.5,
    fontWeight: '500',
  },
  programBannerBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 4,
  },
  programBannerBtnText: {
    color: '#000',
    fontSize: 11.5,
    fontWeight: '800',
  },

  // Stretching grid
  stretchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stretchItem: {
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    gap: 6,
  },
  stretchItemImg: {
    width: '100%',
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
  },
  stretchItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  stretchItemTime: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Body focus grid
  focusCountPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  focusCountPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  bodyFocusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bodyFocusCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  bodyFocusSvgWrap: {
    width: 68,
    height: 68,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyFocusText: {
    gap: 2,
  },
  bodyFocusTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  bodyFocusSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  bodyFocusFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  bodyFocusAction: {
    fontSize: 12,
    fontWeight: '700',
  },
});
