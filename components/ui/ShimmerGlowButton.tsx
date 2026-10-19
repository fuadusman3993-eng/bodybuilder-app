import React, { useRef, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

interface ShimmerGlowButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  height?: number;
}

/**
 * ShimmerGlowButton:
 * - In-place breathing radiant neon glow ("እዛው shine ያድርግ")
 * - NO moving line streaks across the button
 * - Glossy high-end glass gradient luster in place
 * - 60fps spring tactile bounce on touch
 * - Clean bold centered text (no arrow icon)
 */
export default function ShimmerGlowButton({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  height = 56,
}: ShimmerGlowButtonProps) {
  // In-place breathing neon glow pulse
  const glowAnim = useRef(new Animated.Value(0.45)).current;

  // Tactile press bounce
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (disabled) {
      glowAnim.setValue(0);
      return;
    }

    // Smooth breathing radiant neon glow (in-place shine)
    const breathingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.95,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.45,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    );
    breathingLoop.start();

    return () => breathingLoop.stop();
  }, [disabled, glowAnim]);

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(pressScale, {
      toValue: 0.97,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(pressScale, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.glowOuter,
        {
          borderRadius: height / 2,
          transform: [{ scale: pressScale }],
          shadowOpacity: disabled ? 0 : glowAnim,
          shadowRadius: disabled ? 0 : 20,
        },
        Platform.OS === 'web' &&
          !disabled && {
            filter: 'drop-shadow(0px 0px 16px rgba(16, 185, 129, 0.75))',
          },
        style,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.btnBase,
          { height, borderRadius: height / 2 },
          disabled && styles.btnDisabled,
        ]}
      >
        {/* In-place rich gradient shine luster */}
        {!disabled ? (
          <LinearGradient
            colors={['#34D399', '#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: height / 2 }]}
          />
        ) : null}

        {/* Subtle glass reflection on the top half for rich physical depth */}
        {!disabled && (
          <View
            style={[
              styles.glassHighlight,
              { height: height / 2, borderTopLeftRadius: height / 2, borderTopRightRadius: height / 2 },
            ]}
            pointerEvents="none"
          />
        )}

        {/* Clean, bold, centered title */}
        <Text style={[styles.btnText, disabled && styles.btnTextDisabled, textStyle]}>
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glowOuter: {
    width: '100%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 20,
    elevation: 12,
  },
  btnBase: {
    backgroundColor: Colors.primary,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  btnDisabled: {
    backgroundColor: '#1E293B',
    opacity: 0.5,
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  btnText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
    zIndex: 2,
  },
  btnTextDisabled: {
    color: '#94A3B8',
  },
});
