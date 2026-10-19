import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

export type FitnessIconType =
  | 'male'
  | 'female'
  | 'muscle'
  | 'fatloss'
  | 'tone'
  | 'health'
  | 'beginner'
  | 'intermediate'
  | 'advanced';

interface AnimatedFitnessIconProps {
  type: FitnessIconType;
  selected?: boolean;
  size?: number;
}

/**
 * AnimatedFitnessIcon:
 * Real vector fitness icons from @expo/vector-icons featuring lifelike 60fps micro-animations:
 * - male/female: Rhythmic athletic breathing pulse + glowing emerald halo
 * - muscle: Barbell lifting rep (vertical pump + tilt)
 * - fatloss: Active fire flame flicker & flare
 * - tone: High-voltage electric lightning zap
 * - health: Authentic human heartbeat (lub-dub double pulse)
 * - beginner: Gentle sprouting leaf sway
 * - intermediate: Speedometer energy boost pulse
 * - advanced: Golden champion trophy sparkle & elevation
 */
export default function AnimatedFitnessIcon({
  type,
  selected = false,
  size = 56,
}: AnimatedFitnessIconProps) {
  // Primary animation value
  const animValue = useRef(new Animated.Value(0)).current;
  // Secondary pulse for halo / zap
  const secondaryAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animationLoop: Animated.CompositeAnimation | null = null;

    if (type === 'health') {
      // Natural lub-dub human heartbeat rhythm
      animationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1.24,
            duration: 130,
            easing: Easing.out(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(animValue, {
            toValue: 1.05,
            duration: 100,
            easing: Easing.in(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(animValue, {
            toValue: 1.28,
            duration: 140,
            easing: Easing.out(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(animValue, {
            toValue: 1.0,
            duration: 220,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.delay(850), // pause before next heartbeat
        ])
      );
    } else if (type === 'muscle') {
      // Barbell lifting rep (down -> lift up with power -> hold -> lower)
      animationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1, // lifted up
            duration: 750,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.delay(200), // peak contraction
          Animated.timing(animValue, {
            toValue: 0, // eccentric lowering
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.delay(350), // reset for next rep
        ])
      );
    } else if (type === 'fatloss') {
      // Dynamic fire flame flicker & flare
      animationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 220,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(animValue, {
            toValue: 0.4,
            duration: 180,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(animValue, {
            toValue: 0.9,
            duration: 260,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
    } else if (type === 'tone') {
      // Lightning zap double-flash
      animationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1.25,
            duration: 90,
            easing: Easing.linear,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(animValue, {
            toValue: 1.0,
            duration: 90,
            easing: Easing.linear,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(animValue, {
            toValue: 1.3,
            duration: 100,
            easing: Easing.linear,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(animValue, {
            toValue: 1.0,
            duration: 140,
            easing: Easing.out(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.delay(1200), // wait before next electric pulse
        ])
      );
    } else if (type === 'advanced') {
      // Golden champion trophy sparkle & elevation
      animationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
    } else if (type === 'beginner') {
      // Sprouting leaf floating sway
      animationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 1100,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
    } else {
      // Male, female, intermediate: Smooth breathing rhythm
      animationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
    }

    animationLoop.start();
    return () => animationLoop?.stop();
  }, [type, animValue]);

  // Transform bindings per type
  let animatedStyle = {};
  let iconName: keyof typeof Ionicons.glyphMap = 'fitness';
  let defaultColor = '#9CA3AF';
  let activeColor = Colors.primary;
  let bgBadgeTint = selected ? 'rgba(16, 185, 129, 0.16)' : 'rgba(255, 255, 255, 0.04)';
  let borderColor = selected ? Colors.primary : 'rgba(255, 255, 255, 0.08)';

  switch (type) {
    case 'male':
      iconName = 'man';
      defaultColor = '#60A5FA'; // Athletic Sky Blue
      activeColor = '#38BDF8';
      animatedStyle = {
        transform: [
          {
            scale: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.1],
            }),
          },
        ],
      };
      break;

    case 'female':
      iconName = 'woman';
      defaultColor = '#F472B6'; // Athletic Rose
      activeColor = '#FB7185';
      animatedStyle = {
        transform: [
          {
            scale: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.1],
            }),
          },
        ],
      };
      break;

    case 'muscle':
      iconName = 'barbell';
      defaultColor = '#38BDF8';
      activeColor = Colors.primary;
      animatedStyle = {
        transform: [
          {
            translateY: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [2, -6], // Repetition lift
            }),
          },
          {
            rotate: animValue.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: ['0deg', '4deg', '0deg'],
            }),
          },
          {
            scale: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.12],
            }),
          },
        ],
      };
      break;

    case 'fatloss':
      iconName = 'flame';
      defaultColor = '#F97316';
      activeColor = '#FB923C';
      animatedStyle = {
        transform: [
          {
            scale: animValue.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, 1.18, 1.08],
            }),
          },
          {
            translateY: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -3],
            }),
          },
        ],
        opacity: animValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.85, 1, 0.95],
        }),
      };
      break;

    case 'tone':
      iconName = 'flash';
      defaultColor = '#FACC15';
      activeColor = '#FDE047';
      animatedStyle = {
        transform: [
          {
            scale: animValue,
          },
        ],
      };
      break;

    case 'health':
      iconName = 'heart';
      defaultColor = '#EF4444';
      activeColor = '#F87171';
      animatedStyle = {
        transform: [
          {
            scale: animValue,
          },
        ],
      };
      break;

    case 'beginner':
      iconName = 'leaf';
      defaultColor = '#34D399';
      activeColor = Colors.primary;
      animatedStyle = {
        transform: [
          {
            translateY: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -4],
            }),
          },
          {
            rotate: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: ['-5deg', '5deg'],
            }),
          },
        ],
      };
      break;

    case 'intermediate':
      iconName = 'speedometer';
      defaultColor = '#38BDF8';
      activeColor = Colors.primary;
      animatedStyle = {
        transform: [
          {
            scale: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.1],
            }),
          },
        ],
      };
      break;

    case 'advanced':
      iconName = 'trophy';
      defaultColor = '#FBBF24'; // Champion Gold
      activeColor = '#F59E0B';
      animatedStyle = {
        transform: [
          {
            scale: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.14],
            }),
          },
          {
            translateY: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -3],
            }),
          },
        ],
      };
      break;
  }

  const iconColor = selected ? activeColor : defaultColor;

  return (
    <View
      style={[
        styles.badgeContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgBadgeTint,
          borderColor,
        },
        selected && styles.badgeContainerSelected,
      ]}
    >
      {/* Animated icon core */}
      <Animated.View style={animatedStyle}>
        <Ionicons name={iconName} size={Math.round(size * 0.52)} color={iconColor} />
      </Animated.View>

      {/* Subtle glowing halo when selected */}
      {selected && (
        <View
          style={[
            styles.glowHalo,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: activeColor,
            },
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    marginRight: 16,
    position: 'relative',
  },
  badgeContainerSelected: {
    borderWidth: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  glowHalo: {
    position: 'absolute',
    borderWidth: 1.5,
    opacity: 0.45,
    transform: [{ scale: 1.16 }],
  },
});
