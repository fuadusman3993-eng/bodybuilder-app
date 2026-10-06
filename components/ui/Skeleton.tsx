import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface Props {
  width: number | string;
  height: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function Skeleton({ width, height, borderRadius = 4, style }: Props) {
  const anim = useRef(new Animated.Value(0.1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  return (
    <Animated.View 
      style={[{ width, height, borderRadius, backgroundColor: '#A0A0A0', opacity: anim }, style]} 
    />
  );
}
