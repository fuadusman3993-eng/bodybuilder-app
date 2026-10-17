import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Audio } from 'expo-av';

interface WorkoutCountdownOverlayProps {
  onCountdownComplete: () => void;
  soundEnabled?: boolean;
}

const COUNT_SEQUENCE = [3, 2, 1, 0]; // 0 = "GO!"

export default function WorkoutCountdownOverlay({
  onCountdownComplete,
  soundEnabled = true,
}: WorkoutCountdownOverlayProps) {
  const [currentCount, setCurrentCount] = useState(3);
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const hasStarted = useRef(false);

  // Play countdown sound once on mount
  useEffect(() => {
    if (soundEnabled) {
      const loadAndPlay = async () => {
        try {
          const { sound } = await Audio.Sound.createAsync(
            require('@/assets/sounds/countdown_321.mp3'),
            { shouldPlay: true, volume: 1.0 }
          );
          soundRef.current = sound;
        } catch (e) {
          // silent fail - audio not critical
        }
      };
      loadAndPlay();
    }

    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

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

    if (currentCount === 0) {
      // "GO!" — wait 600ms then finish
      const t = setTimeout(() => {
        onCountdownComplete();
      }, 650);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      setCurrentCount((prev) => prev - 1);
    }, 900);

    return () => clearTimeout(t);
  }, [currentCount]);

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
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  countText: {
    fontSize: 120,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -4,
    textShadowColor: 'rgba(37, 99, 235, 0.6)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
  goText: {
    fontSize: 80,
    color: '#22C55E',
    letterSpacing: 0,
    textShadowColor: 'rgba(34, 197, 94, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
});
