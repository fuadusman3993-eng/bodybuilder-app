import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useUserStore, UserTier } from '../../store/userStore';
import CoachSelectionModal from '../modals/CoachSelectionModal';
import PremiumUpgradeModal from '../modals/PremiumUpgradeModal';

export default function HeroBanner() {
  const router = useRouter();
  const { user } = useUserStore();
  const { width } = useWindowDimensions();
  const [coachModalVisible, setCoachModalVisible] = useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);

  // Hero height: 55% of screen width gives a 16:10-ish portrait feel on all phones
  const heroHeight = Math.round(width * 0.72);

  const handleStartToday = () => {
    if (user.tier === UserTier.GUEST || user.tier === UserTier.FREE) {
      router.push('/challenge');
    } else {
      router.push('/(tabs)/chat');
    }
  };

  const handleCoachSelect = (option: 'AI_COACH' | 'REAL_COACH') => {
    if (option === 'AI_COACH') {
      router.push('/(tabs)/chat');
    } else {
      setPremiumModalVisible(true);
    }
  };

  return (
    <>
      <View style={[styles.container, { marginTop: 16 }]}>
        <View style={[styles.background, { minHeight: Math.max(heroHeight, 280) }]}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80' }}
            style={[StyleSheet.absoluteFillObject, styles.backgroundImage, { width: '100%', height: '100%' }]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(10,14,23,0.15)', 'rgba(10,14,23,0.9)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Top tag */}
          <View style={styles.topRow}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>FEATURED</Text>
            </View>
          </View>

          {/* Bottom content */}
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={3}>
              Better{'\n'}Version{'\n'}of <Text style={styles.titleHighlight}>You</Text>
            </Text>
            <Text style={styles.subtitle}>
              Your goals. Our support. Real results.
            </Text>
            <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8} onPress={handleStartToday}>
              <Text style={styles.ctaText}>Start Today</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.background} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <CoachSelectionModal
        visible={coachModalVisible}
        onClose={() => setCoachModalVisible(false)}
        onSelect={handleCoachSelect}
      />
      <PremiumUpgradeModal
        visible={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  background: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  backgroundImage: {
    borderRadius: 20,
  },
  topRow: {
    padding: 16,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  liveBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 22,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  titleHighlight: {
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 18,
    lineHeight: 18,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 30,
    alignSelf: 'flex-start',
    gap: 6,
  },
  ctaText: {
    color: Colors.background,
    fontWeight: '700',
    fontSize: 14,
  },
});
