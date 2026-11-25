import React, { useId } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { Colors } from '../../constants/colors';

interface AmbientGlowProps {
  size?: number;
  color?: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Cross-platform radial ambient glow using react-native-svg.
 * Renders a smooth, edge-free glow on Android, iOS, and Web without relying on
 * CSS filter blur (which does not apply on Android views).
 */
export default function AmbientGlow({
  size = 320,
  color = Colors.primary,
  opacity = 0.22,
  style,
}: AmbientGlowProps) {
  const rawId = useId();
  const gradientId = `ambientGlow_${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const radius = size / 2;

  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          left: '50%',
          marginLeft: -radius,
        },
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
            <Stop offset="45%" stopColor={color} stopOpacity={opacity * 0.45} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={radius} cy={radius} r={radius} fill={`url(#${gradientId})`} />
      </Svg>
    </View>
  );
}
