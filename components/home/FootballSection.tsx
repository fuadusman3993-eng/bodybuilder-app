import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/themeStore';
import { useRouter } from 'expo-router';

type Formation = '4-3-3' | '4-2-3-1' | '3-5-2' | '4-4-2';

const FORMATIONS: { [key in Formation]: { name: string; style: string; players: { x: number; y: number; num: number; pos: string }[] } } = {
  '4-3-3': {
    name: '4-3-3 Attacking',
    style: 'High Press & Wide Wingers (ፈጣን የማጥቃት ታክቲክ)',
    players: [
      { x: 50, y: 88, num: 1, pos: 'GK' },
      { x: 18, y: 70, num: 2, pos: 'LB' },
      { x: 38, y: 72, num: 4, pos: 'CB' },
      { x: 62, y: 72, num: 5, pos: 'CB' },
      { x: 82, y: 70, num: 3, pos: 'RB' },
      { x: 50, y: 54, num: 6, pos: 'DM' },
      { x: 32, y: 44, num: 8, pos: 'CM' },
      { x: 68, y: 44, num: 10, pos: 'AM' },
      { x: 20, y: 24, num: 11, pos: 'LW' },
      { x: 50, y: 18, num: 9, pos: 'ST' },
      { x: 80, y: 24, num: 7, pos: 'RW' },
    ],
  },
  '4-2-3-1': {
    name: '4-2-3-1 Balanced',
    style: 'Double Pivot Control (የተመጣጠነ የኳስ ቁጥጥር)',
    players: [
      { x: 50, y: 88, num: 1, pos: 'GK' },
      { x: 18, y: 70, num: 2, pos: 'LB' },
      { x: 38, y: 72, num: 4, pos: 'CB' },
      { x: 62, y: 72, num: 5, pos: 'CB' },
      { x: 82, y: 70, num: 3, pos: 'RB' },
      { x: 36, y: 56, num: 6, pos: 'DM' },
      { x: 64, y: 56, num: 8, pos: 'DM' },
      { x: 22, y: 36, num: 11, pos: 'LM' },
      { x: 50, y: 34, num: 10, pos: 'CAM' },
      { x: 78, y: 36, num: 7, pos: 'RM' },
      { x: 50, y: 18, num: 9, pos: 'ST' },
    ],
  },
  '3-5-2': {
    name: '3-5-2 Dominance',
    style: 'Wingbacks & Midfield Superiority (የመሃል ሜዳ ብልጫ)',
    players: [
      { x: 50, y: 88, num: 1, pos: 'GK' },
      { x: 28, y: 72, num: 4, pos: 'CB' },
      { x: 50, y: 74, num: 5, pos: 'CB' },
      { x: 72, y: 72, num: 3, pos: 'CB' },
      { x: 14, y: 48, num: 2, pos: 'LWB' },
      { x: 38, y: 50, num: 6, pos: 'CM' },
      { x: 62, y: 50, num: 8, pos: 'CM' },
      { x: 86, y: 48, num: 7, pos: 'RWB' },
      { x: 50, y: 36, num: 10, pos: 'AM' },
      { x: 36, y: 20, num: 9, pos: 'ST' },
      { x: 64, y: 20, num: 11, pos: 'ST' },
    ],
  },
  '4-4-2': {
    name: '4-4-2 Compact',
    style: 'Classic Twin Strikers & Direct Play (ቀጥተኛ አጥቂዎች)',
    players: [
      { x: 50, y: 88, num: 1, pos: 'GK' },
      { x: 18, y: 70, num: 2, pos: 'LB' },
      { x: 38, y: 72, num: 4, pos: 'CB' },
      { x: 62, y: 72, num: 5, pos: 'CB' },
      { x: 82, y: 70, num: 3, pos: 'RB' },
      { x: 18, y: 46, num: 11, pos: 'LM' },
      { x: 40, y: 48, num: 6, pos: 'CM' },
      { x: 60, y: 48, num: 8, pos: 'CM' },
      { x: 82, y: 46, num: 7, pos: 'RM' },
      { x: 38, y: 20, num: 9, pos: 'ST' },
      { x: 62, y: 20, num: 10, pos: 'ST' },
    ],
  },
};

export default function FootballSection() {
  const { colors } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [selectedFormation, setSelectedFormation] = useState<Formation>('4-3-3');
  const [showTrainingModal, setShowTrainingModal] = useState(false);

  // 2x2 grid calculation identical to Fitness QuickActions
  const cardW = Math.floor((width - 32 - 10) / 2);
  const bannerHeight = Math.max(Math.round((width - 32) * 0.62), 220);

  const formationData = FORMATIONS[selectedFormation];

  // 4 Pillars for Football Quick Hub
  const FOOTBALL_ACTIONS = [
    {
      id: 'workout',
      title: 'My Workout',
      subtitle: 'Soccer Conditioning',
      icon: 'barbell-outline' as const,
      color: '#3B82F6',
      badge: 'TRAIN',
      onPress: () => setShowTrainingModal(true),
    },
    {
      id: 'marketplace',
      title: 'Market Place',
      subtitle: 'Boots & Pro Gear',
      icon: 'cart-outline' as const,
      color: '#00E676',
      badge: 'SHOP',
      onPress: () => router.push('/marketplace'),
    },
    {
      id: 'report',
      title: 'Report',
      subtitle: 'Stamina & Analytics',
      icon: 'speedometer-outline' as const,
      color: '#F59E0B',
      badge: 'STATS',
      onPress: () => router.push('/report'),
    },
    {
      id: 'tactics',
      title: 'Tactics Coach',
      subtitle: 'Consult Strategist',
      icon: 'people-outline' as const,
      color: '#A855F7',
      badge: 'COACH',
      onPress: () => router.push('/(tabs)/chat'),
    },
  ];

  return (
    <View style={styles.container}>
      {/* ── 1. Football Hero Banner with "Join Now →" ── */}
      <View style={[styles.bannerContainer, { height: bannerHeight }]}>
        {/* Background Photo */}
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1000&q=80' }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        {/* Dark LinearGradient overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Top: Tag Badge */}
        <View style={styles.topRow}>
          <View style={styles.tagBadge}>
            <View style={[styles.tagDot, { backgroundColor: '#00E676' }]} />
            <Text style={styles.tagText}>SOCCER PRO</Text>
          </View>
        </View>

        {/* Motivational Quote Top-Right */}
        <View style={styles.quoteWrap}>
          <View style={styles.quoteSignature}>
            <Text style={[styles.quoteTextGreen, { color: '#00E676' }]}>Relentless</Text>
            <Text style={styles.quoteTextWhite}>Match</Text>
            <View>
              <Text style={styles.quoteTextWhite}>Pace</Text>
              <View style={[styles.quoteUnderline, { backgroundColor: '#00E676' }]} />
            </View>
          </View>
        </View>

        {/* Bottom Content with "Join Now →" */}
        <View style={styles.bottomContent}>
          <Text style={styles.title}>
            Football{'\n'}
            <Text style={[styles.titleAccent, { color: '#00E676' }]}>Tactics & Training</Text>
          </Text>
          <Text style={styles.subtitle}>
            Master pitch formations, ball drills & 90-minute stamina.
          </Text>
          <TouchableOpacity
            style={[styles.joinBtn, { backgroundColor: '#00E676' }]}
            activeOpacity={0.85}
            onPress={() => setShowTrainingModal(true)}
          >
            <Text style={styles.joinBtnText}>Join Now  →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 2. Football Quick Hub (4 Pillars: My Workout, Marketplace, Report, Tactics Coach) ── */}
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Football Hub</Text>
          <View style={[styles.activePill, { backgroundColor: 'rgba(0, 230, 118, 0.15)', borderColor: 'rgba(0, 230, 118, 0.35)' }]}>
            <Text style={[styles.activePillText, { color: '#00E676' }]}>4 Pillars</Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/community')}
        >
          <Text style={[styles.seeAll, { color: '#00E676' }]}>See all →</Text>
        </TouchableOpacity>
      </View>

      {/* 2x2 Grid Layout */}
      <View style={styles.grid}>
        {FOOTBALL_ACTIONS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.card,
              {
                width: cardW,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.78}
            onPress={item.onPress}
          >
            {/* Top Action Pill Badge */}
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrap, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <View style={[styles.badge, { backgroundColor: item.color + '20', borderColor: item.color + '40' }]}>
                <Text style={[styles.badgeText, { color: item.color }]}>{item.badge}</Text>
              </View>
            </View>

            {/* Title & Subtitle */}
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                {item.subtitle}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── 3. Interactive Tactical Pitch (የታክቲክ ቦርድ) ── */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Tactical Pitch (የታክቲክ ቦርድ)</Text>
        <Text style={styles.sectionBadge}>Interactive Formations</Text>
      </View>

      {/* Formation Selector Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.formationSelector}>
        {(['4-3-3', '4-2-3-1', '3-5-2', '4-4-2'] as Formation[]).map((f) => {
          const isActive = selectedFormation === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.formBtn, isActive && styles.formBtnActive]}
              onPress={() => setSelectedFormation(f)}
              activeOpacity={0.75}
            >
              <Text style={[styles.formBtnText, isActive && styles.formBtnTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Visual Green Pitch */}
      <View style={styles.pitchCard}>
        <View style={styles.pitchHeader}>
          <Text style={styles.pitchTitle}>{formationData.name}</Text>
          <Text style={styles.pitchSub}>{formationData.style}</Text>
        </View>

        <View style={styles.pitchField}>
          {/* Pitch Markings */}
          <View style={styles.pitchCenterCircle} />
          <View style={styles.pitchHalfLine} />
          <View style={styles.pitchPenaltyBoxTop} />
          <View style={styles.pitchPenaltyBoxBottom} />

          {/* Interactive Player Dots */}
          {formationData.players.map((p, idx) => (
            <View
              key={idx}
              style={[
                styles.playerDot,
                {
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  transform: [{ translateX: -14 }, { translateY: -14 }],
                },
              ]}
            >
              <Text style={styles.playerNum}>{p.num}</Text>
              <Text style={styles.playerPos}>{p.pos}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── 4. Football Training Masterclass Banner ── */}
      <View style={[styles.masterclassCard, { backgroundColor: '#13281E', borderColor: '#22543D' }]}>
        <View style={styles.masterclassHeader}>
          <Ionicons name="trophy" size={24} color="#00E676" />
          <Text style={styles.masterclassTitle}>Pro Football IQ & Analysis</Text>
        </View>
        <Text style={styles.masterclassDesc}>
          ዘመናዊ የእግር ኳስ ጽንሰ-ሀሳቦች፦ High-pressing፣ Half-spaces፣ Transition play እና የጨዋታ አነባበብ ትንተና።
        </Text>
        <TouchableOpacity
          style={styles.masterclassBtn}
          onPress={() => router.push('/(tabs)/community')}
          activeOpacity={0.8}
        >
          <Text style={styles.masterclassBtnText}>Explore Pro Football Hub →</Text>
        </TouchableOpacity>
      </View>

      {/* ── 5. "Join Now" Training Selector Modal (Gym vs Pitch) ── */}
      <Modal visible={showTrainingModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: '#0B1E28', borderColor: '#164E28' }]}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>⚽ Select Training Mode</Text>
                <Text style={styles.modalHeaderSub}>የት ልምምድ መስራት ይፈልጋሉ? (Choose your training track)</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowTrainingModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Option 1: Gym Training */}
            <TouchableOpacity
              style={styles.modalChoiceCard}
              activeOpacity={0.8}
              onPress={() => {
                setShowTrainingModal(false);
                router.push('/challenge');
              }}
            >
              <View style={[styles.modalChoiceIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <Ionicons name="barbell" size={28} color="#38BDF8" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.choiceTitleRow}>
                  <Text style={styles.choiceTitle}>Gym Training (የጂም ልምምድ)</Text>
                  <Ionicons name="arrow-forward" size={16} color="#38BDF8" />
                </View>
                <Text style={styles.choiceDesc}>
                  Strength, Leg Power, Explosive Plyometrics & Injury Prevention (የእግር ጉልበትና ጉዳት መከላከያ).
                </Text>
                <View style={styles.choicePillRow}>
                  <Text style={styles.choicePill}>Squats</Text>
                  <Text style={styles.choicePill}>Core Stability</Text>
                  <Text style={styles.choicePill}>Hamstring Care</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Option 2: Pitch / Field Training */}
            <TouchableOpacity
              style={styles.modalChoiceCard}
              activeOpacity={0.8}
              onPress={() => {
                setShowTrainingModal(false);
                router.push('/workout');
              }}
            >
              <View style={[styles.modalChoiceIconWrap, { backgroundColor: 'rgba(0, 230, 118, 0.15)' }]}>
                <Ionicons name="football" size={28} color="#00E676" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.choiceTitleRow}>
                  <Text style={styles.choiceTitle}>Pitch Training (የሜዳ ላይ ልምምድ)</Text>
                  <Ionicons name="arrow-forward" size={16} color="#00E676" />
                </View>
                <Text style={styles.choiceDesc}>
                  Ball Control, Dribble Cones, Sprint Agility & 90-Min Stamina (የኳስ ቅልጥፍና እና የሳንባ አቅም).
                </Text>
                <View style={styles.choicePillRow}>
                  <Text style={[styles.choicePill, { color: '#00E676' }]}>Cone Dribbling</Text>
                  <Text style={[styles.choicePill, { color: '#00E676' }]}>Shuttle Runs</Text>
                  <Text style={[styles.choicePill, { color: '#00E676' }]}>Finishing</Text>
                </View>
              </View>
            </TouchableOpacity>
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
  // Hero Banner matching Fitness banner structure
  bannerContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quoteWrap: {
    position: 'absolute',
    top: 14,
    right: 16,
    alignItems: 'flex-end',
    zIndex: 2,
  },
  quoteSignature: {
    alignItems: 'flex-end',
  },
  quoteTextGreen: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
  quoteTextWhite: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
  quoteUnderline: {
    height: 2.5,
    borderRadius: 1.5,
    marginTop: 2,
    width: '100%',
  },
  bottomContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  titleAccent: {
    fontWeight: '900',
  },
  subtitle: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 12,
    maxWidth: '85%',
  },
  joinBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  joinBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 13,
  },

  // Section Header matching QuickActions
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionBadge: {
    color: '#00E676',
    fontSize: 12,
    fontWeight: '700',
  },

  // 2x2 Grid matching QuickActions
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    minHeight: 105,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  cardBody: {
    marginTop: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Tactical Pitch Styles
  formationSelector: {
    gap: 8,
    paddingBottom: 14,
  },
  formBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  formBtnActive: {
    backgroundColor: '#00E676',
    borderColor: '#00E676',
  },
  formBtnText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  formBtnTextActive: {
    color: '#000',
    fontWeight: '800',
  },
  pitchCard: {
    borderRadius: 20,
    backgroundColor: '#0F2E1B',
    borderWidth: 2,
    borderColor: '#1D5C35',
    overflow: 'hidden',
    padding: 14,
    marginBottom: 20,
  },
  pitchHeader: {
    marginBottom: 12,
  },
  pitchTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  pitchSub: {
    color: '#86EFAC',
    fontSize: 11,
    marginTop: 2,
  },
  pitchField: {
    height: 320,
    borderRadius: 14,
    backgroundColor: '#15803D',
    borderWidth: 2,
    borderColor: '#DCFCE7',
    position: 'relative',
    overflow: 'hidden',
  },
  pitchHalfLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#DCFCE7',
    opacity: 0.6,
  },
  pitchCenterCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#DCFCE7',
    opacity: 0.6,
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  pitchPenaltyBoxTop: {
    position: 'absolute',
    top: 0,
    left: '25%',
    right: '25%',
    height: 50,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#DCFCE7',
    opacity: 0.6,
  },
  pitchPenaltyBoxBottom: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 50,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#DCFCE7',
    opacity: 0.6,
  },
  playerDot: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#00E676',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  playerNum: {
    color: '#00E676',
    fontSize: 9.5,
    fontWeight: '900',
    lineHeight: 11,
  },
  playerPos: {
    color: '#FFFFFF',
    fontSize: 7.5,
    fontWeight: '700',
    lineHeight: 9,
  },

  // Masterclass card
  masterclassCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    marginBottom: 24,
  },
  masterclassHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  masterclassTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  masterclassDesc: {
    color: '#86EFAC',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  masterclassBtn: {
    backgroundColor: '#00E676',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  masterclassBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 13,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalBox: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  modalHeaderSub: {
    color: '#9CA3AF',
    fontSize: 11.5,
    marginTop: 3,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalChoiceCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
  },
  modalChoiceIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  choiceTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  choiceTitle: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  choiceDesc: {
    color: '#9CA3AF',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  choicePillRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  choicePill: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#38BDF8',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
