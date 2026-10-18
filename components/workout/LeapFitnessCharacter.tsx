import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { getExerciseAnimation } from '@/constants/exerciseAnimations';

interface LeapFitnessCharacterProps {
  exerciseId: string;
  isPaused?: boolean;
}

export default function LeapFitnessCharacter({
  exerciseId,
  isPaused = false,
}: LeapFitnessCharacterProps) {
  const [frame, setFrame] = useState<'start' | 'peak'>('start');
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const animAsset = getExerciseAnimation(exerciseId);

  // Toggle between start and peak frames for 2D animation loop
  useEffect(() => {
    if (isPaused) return;

    const frameInterval = setInterval(() => {
      setFrame((prev) => (prev === 'start' ? 'peak' : 'start'));
    }, 700);

    return () => clearInterval(frameInterval);
  }, [isPaused, exerciseId]);

  // Gentle rhythmic bounce effect
  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (!isPaused) {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 700,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      animLoop.start();
    } else {
      pulseAnim.stopAnimation();
    }
    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [isPaused, exerciseId]);

  const translateY = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });

  const activeSource = frame === 'start' ? animAsset.start : animAsset.peak;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.imageWrapper, { transform: [{ translateY }] }]}>
        <Image
          source={activeSource}
          style={styles.animationImage}
          contentFit="contain"
          transition={150}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 310,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    maxWidth: 420,
    maxHeight: 290,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationImage: {
    width: '100%',
    height: '100%',
  },
});
