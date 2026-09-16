import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface IconButtonProps {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  color?: string;
  bg?: string;
  style?: ViewStyle;
}

export default function IconButton({
  name,
  onPress,
  size = 22,
  color = Colors.textPrimary,
  bg = Colors.surface,
  style,
}: IconButtonProps) {
  return (
    <TouchableOpacity style={[styles.button, { backgroundColor: bg }, style]} onPress={onPress} activeOpacity={0.75}>
      <Ionicons name={name} size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
