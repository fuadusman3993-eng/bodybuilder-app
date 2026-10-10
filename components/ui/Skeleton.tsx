import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface Props {
  width: number | string;
  height: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

// Shared animation value for all skeletons to prevent lag
const sharedAnim = new Animated.Value(0.3);
let isAnimating = false;

export default function Skeleton({ width, height, borderRadius = 4, style }: Props) {
  useEffect(() => {
    if (!isAnimating) {
      isAnimating = true;
      Animated.loop(
        Animated.sequence([
          Animated.timing(sharedAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(sharedAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, []);

  return (
    <Animated.View 
      style={[{ width, height, borderRadius, backgroundColor: '#2A3241', opacity: sharedAnim }, style]} 
    />
  );
}
