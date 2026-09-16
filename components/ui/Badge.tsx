import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

interface BadgeProps {
  label: string | number;
  variant?: 'primary' | 'premium' | 'success' | 'warning' | 'muted';
  style?: ViewStyle;
}

export default function Badge({ label, variant = 'primary', style }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  primary: { backgroundColor: 'rgba(16,185,129,0.15)' },
  premium: { backgroundColor: 'rgba(212,175,55,0.15)' },
  success: { backgroundColor: 'rgba(34,197,94,0.15)' },
  warning: { backgroundColor: 'rgba(245,158,11,0.15)' },
  muted: { backgroundColor: Colors.surface },
  text: { fontSize: 11, fontWeight: '700' },
  text_primary: { color: Colors.primary },
  text_premium: { color: '#D4AF37' },
  text_success: { color: '#22C55E' },
  text_warning: { color: '#F59E0B' },
  text_muted: { color: Colors.textSecondary },
});
