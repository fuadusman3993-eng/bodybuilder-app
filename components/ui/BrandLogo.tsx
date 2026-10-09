import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface BrandLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  layout?: 'row' | 'column';
}

export default function BrandLogo({ size = 'medium', showText = true, layout = 'row' }: BrandLogoProps) {
  let scale = 1;
  if (size === 'small') scale = 0.65;
  if (size === 'large') scale = 1.6;

  return (
    <View style={[styles.container, layout === 'column' && styles.column]}>
      {/* The Stylized 'F' Icon */}
      <View style={[styles.iconWrap, { transform: [{ scale }] }]}>
        <View style={styles.topStroke} />
        <View style={styles.bottomStroke} />
      </View>

      {/* The Text */}
      {showText && (
        <Text
          style={[
            styles.text,
            {
              fontSize: 24 * scale,
              marginLeft: layout === 'row' ? 10 * scale : 0,
              marginTop: layout === 'column' ? 12 * scale : 0,
            }
          ]}
        >
          Fit<Text style={styles.textPulse}>Pulse</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 36,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // The two distinct strokes of the "F"
  topStroke: {
    position: 'absolute',
    top: 2,
    left: 8,
    width: 26,
    height: 12,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 2,
    transform: [{ skewX: '-20deg' }],
  },
  bottomStroke: {
    position: 'absolute',
    top: 18,
    left: 0,
    width: 22,
    height: 12,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 2,
    transform: [{ skewX: '-20deg' }],
  },
  text: {
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: -0.5,
    fontStyle: 'italic',
  },
  textPulse: {
    color: Colors.primary,
  },
});
