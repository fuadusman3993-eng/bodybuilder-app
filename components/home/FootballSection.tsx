import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/themeStore';
import { useRouter } from 'expo-router';

// ── Football Specific Training Drills (Self-Contained) ──
interface FootballDrill {
  id: string;
  title: string;
  amharicTitle: string;
  focus: string;
  sets: string;
  badge: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const GYM_DRILLS: FootballDrill[] = [
  {
    id: 'gym-1',
    title: 'Explosive Box Jumps',
    amharicTitle: 'የእግር ፈንጂነት ዝላይ',
    focus: 'Fast-twitch calf & quad explosive power for headers & sprints.',
    sets: '4 Sets × 8 Reps',
    badge: 'POWER',
    icon: 'flash-outline',
  },
  {
    id: 'gym-2',
    title: 'Nordic Hamstring Curls',
    amharicTitle: 'የሃምስትሪንግ ጉዳት መከላከያ',
    focus: 'Eccentric hamstring control to shield against tears & ACL strains.',
    sets: '3 Sets × 6 Reps',
    badge: 'INJURY CARE',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'gym-3',
    title: 'Bulgarian Split Squats',
    amharicTitle: 'ነጠላ እግር ሚዛንና ጥንካሬ',
    focus: 'Unilateral leg strength, shooting stability and hip mobility.',
    sets: '4 Sets × 10 Reps',
    badge: 'STRENGTH',
    icon: 'barbell-outline',
  },
  {
    id: 'gym-4',
    title: 'Core Anti-Rotation Holds',
    amharicTitle: 'የሰውነት መረጋጋትና ሚዛን',
    focus: 'Upper body shielding strength when battling defenders for the ball.',
    sets: '3 Sets × 45 Sec',
    badge: 'STABILITY',
    icon: 'body-outline',
  },
];

const PITCH_DRILLS: FootballDrill[] = [
  {
    id: 'pitch-1',
    title: 'Slalom Cone Dribbling',
    amharicTitle: 'የኮን ድሪብሊንግ ቅልጥፍና',
    focus: 'Inside-outside foot touch, rapid deceleration and tight control.',
    sets: '5 Rounds × 60 Sec',
    badge: 'AGILITY',
    icon: 'football-outline',
  },
  {
    id: 'pitch-2',
    title: '1-Touch Wall Rebound Passes',
    amharicTitle: 'የአንድ ንክኪ ፈጣን ቅብብል',
    focus: 'Vision, weight of pass and instant first-touch control.',
    sets: '4 Sets × 25 Passes',
    badge: 'PASSING',
    icon: 'git-compare-outline',
  },
  {
    id: 'pitch-3',
    title: 'Box-to-Box Shuttle Sprints',
    amharicTitle: 'የ90-ደቂቃ የሳንባ ጥንካሬ',
    focus: 'High-intensity interval stamina to out-run opponents in late minutes.',
    sets: '6 Reps × 100m Sprint',
    badge: 'STAMINA',
    icon: 'speedometer-outline',
  },
  {
    id: 'pitch-4',
    title: 'Curled Corner & Box Finishing',
    amharicTitle: 'የግብ አጨራረስና ቮሊ',
    focus: 'Composure in the 18-yard box, striking low corners with power.',
    sets: '4 Sets × 10 Shots',
    badge: 'FINISHING',
    icon: 'trophy-outline',
  },
];

export default function FootballSection() {
  const { colors } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();

  // Modals & State
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [trainingTrack, setTrainingTrack] = useState<'gym' | 'pitch'>('gym');
  const [completedDrills, setCompletedDrills] = useState<{ [key: string]: boolean }>({
    'gym-1': true,
    'pitch-1': true,
  });
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTacticsModal, setShowTacticsModal] = useState(false);

  // 2x2 Grid calculations
  const cardW = Math.floor((width - 32 - 10) / 2);
  const bannerHeight = Math.max(Math.round((width - 32) * 0.62), 220);

  const toggleDrill = (id: string) => {
    setCompletedDrills((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const totalCompleted = Object.values(completedDrills).filter(Boolean).length;

  // 4 Pillars of Football Quick Hub
  const FOOTBALL_ACTIONS = [
    {
      id: 'workout',
      title: 'My Workout',
      subtitle: 'Gym & Pitch Drills',
      icon: 'football-outline' as const,
      color: '#3B82F6',
      badge: 'TRAIN',
      onPress: () => {
        setTrainingTrack('gym');
        setShowTrainingModal(true);
      },
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
      subtitle: 'Stamina & Stats',
      icon: 'speedometer-outline' as const,
      color: '#F59E0B',
      badge: 'STATS',
      onPress: () => setShowReportModal(true),
    },
    {
      id: 'tactics',
      title: 'Tactics Coach',
      subtitle: 'Consult Strategist',
      icon: 'people-outline' as const,
      color: '#A855F7',
      badge: 'COACH',
      onPress: () => setShowTacticsModal(true),
    },
  ];

  return (
    <View style={styles.container}>
      {/* ── 1. Football Hero Banner with "Join Now →" ── */}
      <View style={[styles.bannerContainer, { height: bannerHeight }]}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1000&q=80' }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.88)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Top: Tag Badge */}
        <View style={styles.topRow}>
          <View style={styles.tagBadge}>
            <View style={[styles.tagDot, { backgroundColor: '#00E676' }]} />
            <Text style={styles.tagText}>SOCCER PRO</Text>
          </View>
        </View>

        {/* Top Right Motivational Quote */}
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
            Master pitch drills, explosive leg power & 90-minute stamina.
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

      {/* ── 2. Football Quick Hub (4 Pillars) ── */}
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Football Hub</Text>
          <View style={[styles.activePill, { backgroundColor: 'rgba(0, 230, 118, 0.15)', borderColor: 'rgba(0, 230, 118, 0.35)' }]}>
            <Text style={[styles.activePillText, { color: '#00E676' }]}>4 Pillars</Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowReportModal(true)}
        >
          <Text style={[styles.seeAll, { color: '#00E676' }]}>View Stats →</Text>
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
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrap, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <View style={[styles.badge, { backgroundColor: item.color + '20', borderColor: item.color + '40' }]}>
                <Text style={[styles.badgeText, { color: item.color }]}>{item.badge}</Text>
              </View>
            </View>

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

      {/* ── 3. Quick Daily Drill Preview Card ── */}
      <View style={[styles.dailyDrillCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.drillCardHeader}>
          <View style={styles.drillCardTitleWrap}>
            <Ionicons name="flame" size={20} color="#FF6D00" />
            <Text style={[styles.drillCardTitle, { color: colors.textPrimary }]}>Today's Soccer Drills</Text>
          </View>
          <TouchableOpacity onPress={() => setShowTrainingModal(true)}>
            <Text style={{ color: '#00E676', fontSize: 12, fontWeight: '700' }}>Open All ({totalCompleted}/8 Done) →</Text>
          </TouchableOpacity>
        </View>

        {/* Mini item 1 */}
        <TouchableOpacity
          style={styles.drillRow}
          onPress={() => toggleDrill('pitch-1')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={completedDrills['pitch-1'] ? 'checkbox' : 'square-outline'}
            size={22}
            color={completedDrills['pitch-1'] ? '#00E676' : colors.textMuted}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.drillName, { color: colors.textPrimary, textDecorationLine: completedDrills['pitch-1'] ? 'line-through' : 'none' }]}>
              Slalom Cone Dribbling (የኮን ድሪብሊንግ)
            </Text>
            <Text style={[styles.drillSub, { color: colors.textMuted }]}>5 Rounds × 60s • Field Agility</Text>
          </View>
        </TouchableOpacity>

        {/* Mini item 2 */}
        <TouchableOpacity
          style={[styles.drillRow, { borderBottomWidth: 0 }]}
          onPress={() => toggleDrill('gym-1')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={completedDrills['gym-1'] ? 'checkbox' : 'square-outline'}
            size={22}
            color={completedDrills['gym-1'] ? '#00E676' : colors.textMuted}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.drillName, { color: colors.textPrimary, textDecorationLine: completedDrills['gym-1'] ? 'line-through' : 'none' }]}>
              Explosive Box Jumps (የእግር ፈንጂነት)
            </Text>
            <Text style={[styles.drillSub, { color: colors.textMuted }]}>4 Sets × 8 Reps • Leg Power</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── MODAL 1: Football Training Hub (Gym vs Pitch) ── */}
      <Modal visible={showTrainingModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.fullModalBox, { backgroundColor: '#0A1822', borderColor: '#16384C' }]}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>⚽ Football Training Hub</Text>
                <Text style={styles.modalHeaderSub}>የእግር ኳስ ስልጠና — Select Gym or Field Drills</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowTrainingModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Segmented Track Switcher */}
            <View style={styles.trackSwitcher}>
              <TouchableOpacity
                style={[styles.trackBtn, trainingTrack === 'gym' && styles.trackBtnActive]}
                onPress={() => setTrainingTrack('gym')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="barbell-outline"
                  size={18}
                  color={trainingTrack === 'gym' ? '#000' : '#38BDF8'}
                />
                <Text style={[styles.trackBtnText, trainingTrack === 'gym' && styles.trackBtnTextActive]}>
                  🏋️ Gym Track (የጂም)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.trackBtn, trainingTrack === 'pitch' && styles.trackBtnActivePitch]}
                onPress={() => setTrainingTrack('pitch')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="football-outline"
                  size={18}
                  color={trainingTrack === 'pitch' ? '#000' : '#00E676'}
                />
                <Text style={[styles.trackBtnText, trainingTrack === 'pitch' && styles.trackBtnTextActivePitch]}>
                  ⚽ Field Track (የሜዳ)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable Drills List */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {(trainingTrack === 'gym' ? GYM_DRILLS : PITCH_DRILLS).map((drill) => {
                const isDone = !!completedDrills[drill.id];
                return (
                  <TouchableOpacity
                    key={drill.id}
                    style={[styles.drillItemCard, isDone && styles.drillItemCardDone]}
                    activeOpacity={0.75}
                    onPress={() => toggleDrill(drill.id)}
                  >
                    <View style={styles.drillItemTop}>
                      <View style={[styles.drillIconCircle, { backgroundColor: isDone ? '#00E676' : 'rgba(255,255,255,0.08)' }]}>
                        <Ionicons
                          name={drill.icon}
                          size={20}
                          color={isDone ? '#000' : '#FFF'}
                        />
                      </View>
                      <View style={{ flex: 1, marginHorizontal: 10 }}>
                        <Text style={[styles.drillItemTitle, isDone && { color: '#00E676' }]}>
                          {drill.title}
                        </Text>
                        <Text style={styles.drillItemAmharic}>{drill.amharicTitle}</Text>
                      </View>
                      <View style={[styles.drillBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                        <Text style={styles.drillBadgeText}>{drill.badge}</Text>
                      </View>
                    </View>

                    <Text style={styles.drillItemFocus}>{drill.focus}</Text>

                    <View style={styles.drillItemFooter}>
                      <View style={styles.setsPill}>
                        <Ionicons name="time-outline" size={14} color="#38BDF8" />
                        <Text style={styles.setsText}>{drill.sets}</Text>
                      </View>

                      <View style={styles.checkWrap}>
                        <Ionicons
                          name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                          size={20}
                          color={isDone ? '#00E676' : '#64748B'}
                        />
                        <Text style={[styles.checkText, { color: isDone ? '#00E676' : '#94A3B8' }]}>
                          {isDone ? 'Completed' : 'Mark Done'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: Football Performance Report (Dedicated) ── */}
      <Modal visible={showReportModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.reportModalBox, { backgroundColor: '#0B1E28', borderColor: '#1F4760' }]}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>📊 Football Match & Stamina Report</Text>
                <Text style={styles.modalHeaderSub}>የእግር ኳስ የተጫዋች ብቃት ሪፖርት</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowReportModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Stamina & Match Readiness Metric */}
            <View style={styles.reportScoreBanner}>
              <View>
                <Text style={styles.reportScoreLabel}>90-MIN MATCH STAMINA</Text>
                <Text style={styles.reportScoreVal}>88%</Text>
                <Text style={styles.reportScoreSub}>Match Ready (ከፍተኛ የሳንባ ጥንካሬ)</Text>
              </View>
              <View style={styles.reportBadgeGreen}>
                <Ionicons name="shield-checkmark" size={24} color="#00E676" />
                <Text style={styles.reportBadgeGreenText}>PRO FIT</Text>
              </View>
            </View>

            {/* 3 Metric Grid */}
            <View style={styles.reportGrid}>
              <View style={styles.reportCol}>
                <Ionicons name="flash" size={18} color="#38BDF8" />
                <Text style={styles.reportColVal}>29.4</Text>
                <Text style={styles.reportColUnit}>km/h Top Sprint</Text>
              </View>
              <View style={styles.reportCol}>
                <Ionicons name="football" size={18} color="#00E676" />
                <Text style={styles.reportColVal}>{totalCompleted}/8</Text>
                <Text style={styles.reportColUnit}>Drills Finished</Text>
              </View>
              <View style={styles.reportCol}>
                <Ionicons name="flame" size={18} color="#F59E0B" />
                <Text style={styles.reportColVal}>5 Days</Text>
                <Text style={styles.reportColUnit}>Active Streak</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.reportDoneBtn}
              onPress={() => setShowReportModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.reportDoneBtnText}>Close Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 3: Tactics Coach Consultation ── */}
      <Modal visible={showTacticsModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.reportModalBox, { backgroundColor: '#0B1E28', borderColor: '#4C1D95' }]}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>🧠 Football Tactics & Strategy</Text>
                <Text style={styles.modalHeaderSub}>የእግር ኳስ ታክቲክ እና ስትራቴጂ ምክክር</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowTacticsModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Quick Tactical Insights */}
            <View style={styles.tacticsTipCard}>
              <Ionicons name="bulb-outline" size={20} color="#A855F7" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.tacticsTipTitle}>High Press Trigger (ቦታ መዝጋት)</Text>
                <Text style={styles.tacticsTipDesc}>
                  ተጋጣሚው ደካማ እግሩን ሲጠቀም ወይም ወደ ኋላ ሲያይ በቡድን ፕሬስ በማድረግ ኳስ ማስጣል ይቻላል።
                </Text>
              </View>
            </View>

            <View style={styles.tacticsTipCard}>
              <Ionicons name="compass-outline" size={20} color="#38BDF8" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.tacticsTipTitle}>Half-Space Exploitation (መካከል ሰብሮ መግባት)</Text>
                <Text style={styles.tacticsTipDesc}>
                  በክንፍ እና በመሃል ተከላካዮች መሀል ባለው ሰፊ ክፍተት ውስጥ ኳስ ተቀብሎ ፈጣን ዕድል መፍጠር።
                </Text>
              </View>
            </View>

            {/* Direct Consult Button */}
            <TouchableOpacity
              style={[styles.reportDoneBtn, { backgroundColor: '#A855F7' }]}
              onPress={() => {
                setShowTacticsModal(false);
                router.push('/(tabs)/chat');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={[styles.reportDoneBtnText, { color: '#FFF' }]}>Chat with Tactics Coach →</Text>
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
  // Hero Banner matching Fitness structure
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

  // 2x2 Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
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

  // Daily Drill Preview Card
  dailyDrillCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 24,
  },
  drillCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  drillCardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  drillCardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  drillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  drillName: {
    fontSize: 13,
    fontWeight: '700',
  },
  drillSub: {
    fontSize: 11,
    marginTop: 2,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  fullModalBox: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
  },
  reportModalBox: {
    width: '100%',
    maxWidth: 420,
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
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
  },
  modalHeaderSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // Track Switcher (Gym vs Field)
  trackSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 6,
  },
  trackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  trackBtnActive: {
    backgroundColor: '#38BDF8',
  },
  trackBtnActivePitch: {
    backgroundColor: '#00E676',
  },
  trackBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  trackBtnTextActive: {
    color: '#000',
    fontWeight: '800',
  },
  trackBtnTextActivePitch: {
    color: '#000',
    fontWeight: '800',
  },

  // Drill item cards
  drillItemCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  drillItemCardDone: {
    borderColor: 'rgba(0, 230, 118, 0.4)',
    backgroundColor: 'rgba(0, 230, 118, 0.05)',
  },
  drillItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drillIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drillItemTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  drillItemAmharic: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  drillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  drillBadgeText: {
    color: '#FFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  drillItemFocus: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 16,
    marginVertical: 10,
  },
  drillItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  setsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  setsText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  checkWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Report Modal
  reportScoreBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
    marginBottom: 16,
  },
  reportScoreLabel: {
    color: '#86EFAC',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  reportScoreVal: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    marginVertical: 2,
  },
  reportScoreSub: {
    color: '#94A3B8',
    fontSize: 11,
  },
  reportBadgeGreen: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00E676',
  },
  reportBadgeGreenText: {
    color: '#00E676',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 2,
  },
  reportGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  reportCol: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  reportColVal: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 6,
  },
  reportColUnit: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  reportDoneBtn: {
    backgroundColor: '#00E676',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  reportDoneBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },

  // Tactics
  tacticsTipCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tacticsTipTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  tacticsTipDesc: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 16,
  },
});
