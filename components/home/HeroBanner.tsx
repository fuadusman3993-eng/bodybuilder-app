import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useUserStore, UserTier } from '../../store/userStore';
import CoachSelectionModal from '../modals/CoachSelectionModal';

const { width } = Dimensions.get('window');

export default function HeroBanner() {
  const router = useRouter();
  const { user } = useUserStore();
  const [modalVisible, setModalVisible] = useState(false);

  const handleStartToday = () => {
    if (user.tier === UserTier.GUEST) {
      // 1. Guest: Maybe show a login prompt or navigate to a guest explore mode
      // For now, we stay on the screen or show an alert (we can build explore mode later)
      alert("Welcome, Guest! Create an account to unlock more features.");
    } else if (user.tier === UserTier.FREE) {
      // 2. Free User: Show Coach Selection Modal
      setModalVisible(true);
    } else if (user.tier === UserTier.PREMIUM) {
      // 3. Premium User: Navigate directly to Premium Dashboard/Chat
      router.push('/(tabs)/chat');
    }
  };

  const handleCoachSelect = (option: 'AI_COACH' | 'REAL_COACH') => {
    if (option === 'AI_COACH') {
      router.push('/(tabs)/chat'); // Simulating going to AI chat
    } else {
      // Simulated routing to trainers list, or premium upgrade prompt
      alert("Redirecting to Premium Trainers list...");
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
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onSelect={handleCoachSelect} 
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
