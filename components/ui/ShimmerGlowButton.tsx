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
 * - Uses separate Animated.View layers with consistent native-driver usage
 *   so Android never mixes JS and native animation drivers on one node.
 */
export default function ShimmerGlowButton({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  height = 56,
}: ShimmerGlowButtonProps) {
  const useNative = Platform.OS !== 'web';

  // In-place breathing neon glow pulse (animates opacity — 100% native-driver safe)
  const glowAnim = useRef(new Animated.Value(0.45)).current;

  // Tactile press bounce on outer wrapper
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (disabled) {
      glowAnim.setValue(0);
      return;
    }

    const breathingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.95,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: useNative,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.45,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: useNative,
        }),
      ])
    );
    breathingLoop.start();

    return () => breathingLoop.stop();
  }, [disabled, glowAnim, useNative]);

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(pressScale, {
      toValue: 0.97,
      useNativeDriver: useNative,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(pressScale, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: useNative,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.glowOuter,
        {
          borderRadius: height / 2,
          transform: [{ scale: pressScale }],
        },
        Platform.OS === 'web' &&
          !disabled && {
            filter: 'drop-shadow(0px 0px 16px rgba(0, 230, 118, 0.75))',
          },
        style,
      ]}
    >
      {/* Dedicated native-safe neon aura layer behind button */}
      {!disabled && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.auraRing,
            {
              height: height + 10,
              borderRadius: (height + 10) / 2,
              opacity: glowAnim,
            },
          ]}
        />
      )}

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
        {/* In-place seamless rich gradient shine */}
        {!disabled ? (
          <LinearGradient
            colors={['#69F0AE', '#00E676', '#00C853']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: height / 2 }]}
          />
        ) : null}

        {/* Clean, bold, centered title with sharp high-contrast clarity */}
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
    position: 'relative',
    justifyContent: 'center',
  },
  auraRing: {
    position: 'absolute',
    left: -4,
    right: -4,
    top: -5,
    backgroundColor: 'rgba(0, 230, 118, 0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(105, 240, 174, 0.45)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
  },
  btnBase: {
    backgroundColor: Colors.primary,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    elevation: 6,
  },
  btnDisabled: {
    backgroundColor: '#1E293B',
    opacity: 0.5,
    elevation: 0,
  },
  btnText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.3,
    textAlign: 'center',
    zIndex: 2,
  },
  btnTextDisabled: {
    color: '#94A3B8',
  },
});
