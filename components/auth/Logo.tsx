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
      <View style={styles.iconContainer}>
        {/* Custom FitPulse "F" logo approximation */}
        <View style={styles.iconF}>
          <View style={styles.iconFLine1} />
          <View style={styles.iconFLine2} />
          <View style={styles.iconFLine3} />
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
    marginBottom: 16,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconF: {
    width: 44,
    height: 52,
    position: 'relative',
  },
  iconFLine1: {
    position: 'absolute',
    top: 0,
    left: 8,
    width: 36,
    height: 12,
    backgroundColor: Colors.primary,
    borderTopRightRadius: 8,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    transform: [{ skewX: '-15deg' }],
  },
  iconFLine2: {
    position: 'absolute',
    top: 18,
    left: 4,
    width: 28,
    height: 12,
    backgroundColor: Colors.primary,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 4,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    transform: [{ skewX: '-15deg' }],
  },
  iconFLine3: {
    position: 'absolute',
    top: 0,
    left: 4,
    width: 14,
    height: 52,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 4,
    transform: [{ skewX: '-15deg' }],
  },
  textFit: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  textPulse: {
    color: Colors.primary,
  },
  textLarge: {
    fontSize: 48,
  },
  textSmall: {
    fontSize: 32,
  },
});
