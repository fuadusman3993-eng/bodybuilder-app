import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
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
  const [selectedFormation, setSelectedFormation] = useState<Formation>('4-3-3');
  const [activeDrillCategory, setActiveDrillCategory] = useState<'All' | 'Passing' | 'Shooting' | 'Stamina'>('All');

  const formationData = FORMATIONS[selectedFormation];

  return (
    <View style={styles.container}>
      {/* ── 1. Hero Banner: Football Tactics & Conditioning ── */}
      <View style={[styles.heroBanner, { backgroundColor: '#0A2312', borderColor: '#164E28' }]}>
        <View style={styles.bannerTagRow}>
          <View style={styles.bannerPill}>
            <Text style={styles.bannerPillText}>⚽ TACTICS & SKILLS</Text>
          </View>
        </View>
        <Text style={styles.bannerTitle}>Football Tactics & Training</Text>
        <Text style={styles.bannerSub}>
          የእግር ኳስ ታክቲክ እና ትሬኒንግ — Master tactical pitch formations, ball drills & 90-minute stamina.
        </Text>
        <View style={styles.bannerBtnRow}>
          <TouchableOpacity
            style={[styles.bannerPrimaryBtn, { backgroundColor: '#00E676' }]}
            onPress={() => setSelectedFormation('4-3-3')}
            activeOpacity={0.8}
          >
            <Ionicons name="clipboard-outline" size={18} color="#000" />
            <Text style={styles.bannerPrimaryBtnText}>Tactical Board</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bannerSecondaryBtn}
            onPress={() => router.push('/(tabs)/community')}
            activeOpacity={0.8}
          >
            <Ionicons name="football-outline" size={18} color="#FFF" />
            <Text style={styles.bannerSecondaryBtnText}>Drills Hub</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 2. Interactive Tactical Pitch (የታክቲክ ቦርድ) ── */}
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

      {/* ── 3. Quick Hub: 4 Football Training Pillars (Mektaterya) ── */}
      <View style={[styles.sectionHeader, { marginTop: 20 }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Football Hub (መቆጣጠሪያ)</Text>
        <Text style={styles.sectionBadge}>4 Pillars</Text>
      </View>

      <View style={styles.grid}>
        {/* Card 1: Ball Drills */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface, borderColor: '#1F2937' }]}
          onPress={() => router.push('/(tabs)/community')}
          activeOpacity={0.75}
        >
          <View style={styles.cardTop}>
            <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(0, 230, 118, 0.15)' }]}>
              <Ionicons name="football" size={20} color="#00E676" />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(0, 230, 118, 0.15)' }]}>
              <Text style={[styles.statusBadgeText, { color: '#00E676' }]}>Dribbling</Text>
            </View>
          </View>
          <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Ball Control & Dribble</Text>
          <Text style={[styles.cardDesc, { color: colors.textPrimary }]}>
            የኳስ ቁጥጥር፣ የመጀመሪያ ንክኪ (First Touch) እና ኮን ድሪብሊንግ
          </Text>
          <Text style={styles.cardHint}>Start Drills →</Text>
        </TouchableOpacity>

        {/* Card 2: Match Stamina */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface, borderColor: '#1F2937' }]}
          onPress={() => router.push('/challenge')}
          activeOpacity={0.75}
        >
          <View style={styles.cardTop}>
            <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Ionicons name="flash" size={20} color="#38BDF8" />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Text style={[styles.statusBadgeText, { color: '#38BDF8' }]}>90 Min Stamina</Text>
            </View>
          </View>
          <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Match Conditioning</Text>
          <Text style={[styles.cardDesc, { color: colors.textPrimary }]}>
            ለ90 ደቂቃ ጨዋታ የሚያበቃ የሳንባ አቅም፣ የፍጥነት እና የቅልጥፍና ልምምድ
          </Text>
          <Text style={[styles.cardHint, { color: '#38BDF8' }]}>View Workouts →</Text>
        </TouchableOpacity>

        {/* Card 3: Shooting & Finishing */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface, borderColor: '#1F2937' }]}
          onPress={() => router.push('/(tabs)/community')}
          activeOpacity={0.75}
        >
          <View style={styles.cardTop}>
            <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="locate" size={20} color="#F59E0B" />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Text style={[styles.statusBadgeText, { color: '#F59E0B' }]}>Finishing</Text>
            </View>
          </View>
          <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Shooting & Free-kicks</Text>
          <Text style={[styles.cardDesc, { color: colors.textPrimary }]}>
            የግብ አገባብ ትክክለኛነት፣ የቅጣት ምት እና የፔናሊቲ ልምምዶች
          </Text>
          <Text style={[styles.cardHint, { color: '#F59E0B' }]}>Watch Guides →</Text>
        </TouchableOpacity>

        {/* Card 4: Defensive Tactics */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface, borderColor: '#1F2937' }]}
          onPress={() => router.push('/(tabs)/community')}
          activeOpacity={0.75}
        >
          <View style={styles.cardTop}>
            <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#A855F7" />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Text style={[styles.statusBadgeText, { color: '#A855F7' }]}>Defending</Text>
            </View>
          </View>
          <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Tactics & Positioning</Text>
          <Text style={[styles.cardDesc, { color: colors.textPrimary }]}>
            1v1 መከላከል፣ የኦፍሳይድ ወጥመድ እና የመስመር አጠባበቅ ታክቲኮች
          </Text>
          <Text style={[styles.cardHint, { color: '#A855F7' }]}>Study Tactics →</Text>
        </TouchableOpacity>
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
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
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
});
