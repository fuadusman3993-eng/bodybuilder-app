import React, { useRef, useEffect, useState } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  ViewStyle,
  TextStyle,
  LayoutChangeEvent,
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
 * - Breathing radiant neon glow halo ("ደምቅ ያለ መብራት")
 * - Sweeping diagonal laser light beam ("እልፍ የሚል መብራት")
 * - 60fps spring tactile bounce on touch
 * - Clean bold centered text without arrow
 */
export default function ShimmerGlowButton({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  height = 56,
}: ShimmerGlowButtonProps) {
  const [btnWidth, setBtnWidth] = useState<number>(320);

  // Shimmer light sweep animation
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Breathing neon glow pulse
  const glowAnim = useRef(new Animated.Value(0.45)).current;

  // Tactile press bounce
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous breathing neon glow
    const breathingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.85,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.45,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    );
    breathingLoop.start();

    return () => breathingLoop.stop();
  }, [glowAnim]);

  useEffect(() => {
    if (disabled) {
      shimmerAnim.setValue(0);
      return;
    }

    // Shimmer beam sweeps across every 2.4 seconds
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 950,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.delay(1400), // brief rest before next glint
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    shimmerLoop.start();

    return () => shimmerLoop.stop();
  }, [disabled, btnWidth, shimmerAnim]);

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

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0 && width !== btnWidth) {
      setBtnWidth(width);
    }
  };

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-btnWidth * 0.9, btnWidth * 1.4],
  });

  return (
    <Animated.View
      style={[
        styles.glowOuter,
        {
          borderRadius: height / 2,
          transform: [{ scale: pressScale }],
          shadowOpacity: disabled ? 0 : glowAnim,
        },
        Platform.OS === 'web' &&
          !disabled && {
            filter: 'drop-shadow(0px 0px 14px rgba(16, 185, 129, 0.65))',
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
        onLayout={handleLayout}
        style={[
          styles.btnBase,
          { height, borderRadius: height / 2 },
          disabled && styles.btnDisabled,
        ]}
      >
        {/* Shimmer light beam gliding across */}
        {!disabled && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shimmerWrap,
              {
                height: height * 2,
                transform: [{ translateX }, { rotate: '25deg' }],
              },
            ]}
          >
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0)',
                'rgba(255, 255, 255, 0.35)',
                'rgba(255, 255, 255, 0.85)',
                'rgba(255, 255, 255, 0.35)',
                'rgba(255, 255, 255, 0)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shimmerGradient}
            />
          </Animated.View>
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
    shadowRadius: 18,
    elevation: 10,
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
  btnText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  btnTextDisabled: {
    color: '#94A3B8',
  },
  shimmerWrap: {
    position: 'absolute',
    top: -20,
    width: 60,
    zIndex: 1,
  },
  shimmerGradient: {
    flex: 1,
    width: '100%',
  },
});
