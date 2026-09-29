import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/userStore';

export default function Header() {
  const { width } = useWindowDimensions();
  const isCompact = width < 360;
  const router = useRouter();
  const { user } = useUserStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_uid', user.uid)
          .eq('is_read', false)
          .then(({ count }) => setUnreadCount(count || 0));
      }
    }, [user?.uid])
  );

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Ionicons name="pulse" size={isCompact ? 28 : 34} color={Colors.primary} style={styles.logoIcon} />
        <View style={styles.textStack}>
          <Text style={[styles.appName, isCompact && styles.appNameSm]}>FitPulse</Text>
          <Text style={styles.tagline}>Stronger • Healthier • Together</Text>
        </View>
      </View>
      <View style={styles.right}>
        <TouchableOpacity 
          style={styles.iconButton} 
          activeOpacity={0.7}
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
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
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: Colors.background,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  logoIcon: {
    marginRight: 4,
  },
  textStack: {
    justifyContent: 'center',
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  appNameSm: {
    fontSize: 20,
  },
  tagline: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
