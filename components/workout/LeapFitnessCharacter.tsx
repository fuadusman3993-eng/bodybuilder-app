import React, { useEffect, useRef } from 'react';
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
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const animAsset = getExerciseAnimation(exerciseId);

  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (!isPaused) {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
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
    outputRange: [0, -4],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.imageWrapper, { transform: [{ translateY }] }]}>
        <Image
          source={animAsset.source}
          style={styles.animationImage}
          contentFit="contain"
          autoplay={!isPaused}
          transition={200}
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
