import React, { useRef, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  View,
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
 * - Seamless in-place breathing radiant neon glow using pure borderless layered Views
 *   (no outer outline ring, no dark gap, and no percentage-width SVG gradient draw calls).
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
  const glowAnim = useRef(new Animated.Value(0.5)).current;

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
          toValue: 1,
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
      {/* Pure native borderless diffused neon halo behind button (no outline ring, no SVG crash risk) */}
      {!disabled && Platform.OS !== 'web' && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.haloContainer,
            {
              opacity: glowAnim,
            },
          ]}
        >
          <View style={[styles.haloOuter, { borderRadius: (height + 22) / 2 }]} />
          <View style={[styles.haloMid, { borderRadius: (height + 12) / 2 }]} />
          <View style={[styles.haloInner, { borderRadius: (height + 4) / 2 }]} />
        </Animated.View>
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
        ) : (
          <View style={StyleSheet.absoluteFillObject} />
        )}

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
  haloContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  haloOuter: {
    position: 'absolute',
    top: -11,
    bottom: -11,
    left: -11,
    right: -11,
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
  },
  haloMid: {
    position: 'absolute',
    top: -6,
    bottom: -6,
    left: -6,
    right: -6,
    backgroundColor: 'rgba(0, 230, 118, 0.14)',
  },
  haloInner: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    left: -2,
    right: -2,
    backgroundColor: 'rgba(0, 230, 118, 0.22)',
  },
  btnBase: {
    backgroundColor: Colors.primary,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  btnDisabled: {
    backgroundColor: '#1E293B',
    opacity: 0.5,
    shadowOpacity: 0,
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
