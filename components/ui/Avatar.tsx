import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  isAI?: boolean;
  isGroup?: boolean;
  isGym?: boolean;
  showBorder?: boolean;
  borderColor?: string;
}

export default function Avatar({
  uri,
  name,
  size = 44,
  isAI = false,
  isGroup = false,
  isGym = false,
  showBorder = false,
  borderColor = Colors.primary,
}: AvatarProps) {
  const radius = size / 2;
  const iconSize = size * 0.5;

  const containerStyle = [
    styles.container,
    { width: size, height: size, borderRadius: radius },
    showBorder && { borderWidth: 2, borderColor },
  ];

  if (isAI) {
    return (
      <View style={[containerStyle, styles.aiBackground]}>
        <Ionicons name="hardware-chip" size={iconSize} color={Colors.primary} />
      </View>
    );
  }

  if (isGroup) {
    return (
      <View style={[containerStyle, styles.groupBackground]}>
        <Ionicons name="people" size={iconSize} color="#818CF8" />
      </View>
    );
  }

  if (isGym) {
    return (
      <View style={[containerStyle, styles.gymBackground]}>
        <Ionicons name="barbell" size={iconSize} color="#F59E0B" />
      </View>
    );
  }

  if (uri) {
    return <Image source={{ uri }} style={[containerStyle, { resizeMode: 'cover' }]} />;
  }

  // Fallback initials
  const initials = name ? name.slice(0, 2).toUpperCase() : '?';
  return (
    <View style={[containerStyle, styles.initialsBackground]}>
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  aiBackground: { backgroundColor: 'rgba(16,185,129,0.15)' },
  groupBackground: { backgroundColor: 'rgba(129,140,248,0.15)' },
  gymBackground: { backgroundColor: 'rgba(245,158,11,0.15)' },
  initialsBackground: { backgroundColor: Colors.surface },
  initials: { color: Colors.textPrimary, fontWeight: '700' },
});
