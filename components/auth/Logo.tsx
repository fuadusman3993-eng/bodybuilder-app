import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface LogoProps {
  size?: 'large' | 'small';
}

export default function Logo({ size = 'large' }: LogoProps) {
  const isLarge = size === 'large';
  
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, isLarge ? styles.iconContainerLarge : styles.iconContainerSmall]}>
        {/* Sleeker FitPulse "F" logo approximation */}
        <View style={styles.iconF}>
          <View style={[styles.iconFLine1, isLarge ? styles.line1Large : styles.line1Small]} />
          <View style={[styles.iconFLine2, isLarge ? styles.line2Large : styles.line2Small]} />
          <View style={[styles.iconFLine3, isLarge ? styles.line3Large : styles.line3Small]} />
        </View>
      </View>
      <Text style={[styles.textFit, isLarge ? styles.textLarge : styles.textSmall]}>
        Fit<Text style={styles.textPulse}>Pulse</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerLarge: {
    marginBottom: 12,
    height: 48,
  },
  iconContainerSmall: {
    marginBottom: 8,
    height: 32,
  },
  iconF: {
    position: 'relative',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconFLine1: {
    position: 'absolute',
    backgroundColor: Colors.primary,
    borderRadius: 4,
    transform: [{ skewX: '-15deg' }],
  },
  iconFLine2: {
    position: 'absolute',
    backgroundColor: Colors.primary,
    borderRadius: 4,
    transform: [{ skewX: '-15deg' }],
  },
  iconFLine3: {
    position: 'absolute',
    backgroundColor: Colors.primary,
    borderRadius: 4,
    transform: [{ skewX: '-15deg' }],
  },
  
  // Large Logo Variants
  line1Large: { top: 0, left: 6, width: 26, height: 10 },
  line2Large: { top: 16, left: 2, width: 18, height: 10 },
  line3Large: { top: 0, left: 2, width: 10, height: 44 },
  
  // Small Logo Variants
  line1Small: { top: 0, left: 4, width: 18, height: 7 },
  line2Small: { top: 11, left: 1, width: 12, height: 7 },
  line3Small: { top: 0, left: 1, width: 7, height: 30 },

  textFit: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  textPulse: {
    color: Colors.primary,
  },
  textLarge: {
    fontSize: 34,
  },
  textSmall: {
    fontSize: 24,
  },
});
