import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

export default function Header() {
  const { width } = useWindowDimensions();
  const isCompact = width < 360;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.logoContainer}>
          <Ionicons name="fitness" size={isCompact ? 22 : 26} color={Colors.primary} />
        </View>
        <View>
          <Text style={[styles.appName, isCompact && styles.appNameSm]}>BodyBuilder</Text>
          <Text style={styles.tagline}>Stronger • Healthier • Together</Text>
        </View>
      </View>
      <View style={styles.right}>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: Colors.background,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  appNameSm: {
    fontSize: 16,
  },
  tagline: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
});
