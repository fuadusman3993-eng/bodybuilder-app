import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Audio } from 'expo-av';
import { voiceCoach } from '@/lib/voiceCoach';

interface WorkoutCountdownOverlayProps {
  onCountdownComplete: () => void;
  soundEnabled?: boolean;
}

export default function WorkoutCountdownOverlay({
  onCountdownComplete,
  soundEnabled = true,
}: WorkoutCountdownOverlayProps) {
  const [currentCount, setCurrentCount] = useState(3);
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

  // Play countdown sound / voice cues on mount and count change
  useEffect(() => {
    voiceCoach.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Animate number in on each count change
  const animateIn = () => {
    scaleAnim.setValue(1.6);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    animateIn();

    if (soundEnabled) {
      voiceCoach.announceCountdownStep(currentCount);
    }

    if (currentCount === 0) {
      // "GO!" — wait 650ms then finish
      const t = setTimeout(() => {
        onCountdownComplete();
      }, 700);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      setCurrentCount((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(t);
  }, [currentCount, soundEnabled]);

  const label = currentCount === 0 ? 'GO!' : `${currentCount}`;
  const isGo = currentCount === 0;

  return (
    <View style={styles.overlay}>
      <Animated.Text
        style={[
          styles.countText,
          isGo && styles.goText,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {label}
      </Animated.Text>
      <Text style={styles.readyText}>
        {isGo ? 'START EXERCISING!' : 'GET READY'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  countText: {
    fontSize: 100,
    fontWeight: '900',
    color: '#1E3A8A', // Deep Athletic Blue
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  goText: {
    color: '#2563EB',
    fontSize: 88,
  },
  readyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 2,
    marginTop: 12,
  },
});
