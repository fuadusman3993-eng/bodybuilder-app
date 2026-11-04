import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { safeBack } from '../../lib/navigation';

interface BackButtonProps {
  onPress?: () => void;
  fallbackRoute?: string;
  style?: ViewStyle;
  size?: number;
  color?: string;
  testID?: string;
}

export default function BackButton({
  onPress,
  fallbackRoute,
  style,
  size = 26,
  color = '#FFFFFF',
  testID = 'back-button',
}: BackButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      safeBack(fallbackRoute ?? '/(tabs)');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.btn, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Ionicons name="chevron-back" size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
});
