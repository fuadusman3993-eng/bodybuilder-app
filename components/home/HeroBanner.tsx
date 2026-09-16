import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useUserStore, UserTier } from '../../store/userStore';
import CoachSelectionModal from '../modals/CoachSelectionModal';
import PremiumUpgradeModal from '../modals/PremiumUpgradeModal';

const { width } = Dimensions.get('window');

export default function HeroBanner() {
  const router = useRouter();
  const { user } = useUserStore();
  const [coachModalVisible, setCoachModalVisible] = useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);

  const handleStartToday = () => {
    if (user.tier === UserTier.GUEST || user.tier === UserTier.FREE) {
      // Direct Guest and Free users to the new cinematic Challenge page
      router.push('/challenge');
    } else if (user.tier === UserTier.PREMIUM) {
      // Premium User -> Full Access
      router.push('/(tabs)/chat');
    }
  };

  const handleCoachSelect = (option: 'AI_COACH' | 'REAL_COACH') => {
    if (option === 'AI_COACH') {
      router.push('/(tabs)/chat');
    } else {
      // Show Premium Upgrade for Real Coach
      setPremiumModalVisible(true);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80' }}
          style={styles.background}
          imageStyle={styles.backgroundImage}
        >
          <LinearGradient
            colors={['rgba(10, 14, 23, 0.3)', 'rgba(10, 14, 23, 0.85)']}
            style={styles.gradient}
          >
            <View style={styles.content}>
              <Text style={styles.title}>
                Better{'\n'}Version{'\n'}of <Text style={styles.titleHighlight}>You</Text>
              </Text>
              <Text style={styles.subtitle}>
                Your goals. Our support.{'\n'}Real results.
              </Text>
              <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8} onPress={handleStartToday}>
                <Text style={styles.ctaText}>Start Today</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.background} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>
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
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 240,
  },
  background: {
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    borderRadius: 20,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  content: {
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 36,
  },
  titleHighlight: {
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.background,
  },
});
