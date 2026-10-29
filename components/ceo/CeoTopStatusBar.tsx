import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface CeoTopStatusBarProps {
  lastUpdated: string;
  unresolvedErrorsCount: number;
  refreshing: boolean;
  onRefresh: () => void;
  onOpenAiConfig: () => void;
  onAlertsClick?: () => void;
}

export default function CeoTopStatusBar({
  lastUpdated,
  unresolvedErrorsCount,
  refreshing,
  onRefresh,
  onOpenAiConfig,
  onAlertsClick,
}: CeoTopStatusBarProps) {
  return (
    <View style={styles.topBar}>
      {/* ── LEFT: STATUS & TIME ── */}
      <View style={styles.statusLeft}>
        <View style={styles.onlinePill}>
          <View style={styles.pulsingDot} />
          <Text style={styles.onlineText}>All Systems Online</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.lastUpdatedText}>
          Last updated: {lastUpdated || 'Just now'}
        </Text>
      </View>

      {/* ── RIGHT: ACTIONS (NOTIF, LANGUAGE, MOON, REFRESH, AI) ── */}
      <View style={styles.actionsRight}>
        {/* AI Key Button */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onOpenAiConfig}
          activeOpacity={0.7}
        >
          <Ionicons name="sparkles" size={17} color="#00E676" />
        </TouchableOpacity>

        {/* Refresh Button */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="refresh" size={17} color="#94A3B8" />
          )}
        </TouchableOpacity>

        {/* Notification Bell with Badge */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onAlertsClick}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications" size={18} color="#CBD5E1" />
          <View style={styles.bellBadge}>
            <Text style={styles.bellBadgeText}>
              {unresolvedErrorsCount > 0 ? unresolvedErrorsCount : 3}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Language Selector Dropdown Pill */}
        <View style={styles.langSelector}>
          <Ionicons name="globe-outline" size={15} color="#94A3B8" />
          <Text style={styles.langText}>English</Text>
          <Ionicons name="chevron-down" size={12} color="#94A3B8" />
        </View>

        {/* Dark Mode Moon Icon */}
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
          <Ionicons name="moon" size={17} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 64,
    backgroundColor: '#080E1A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E676',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  onlineText: {
    color: '#00E676',
    fontSize: 12.5,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  lastUpdatedText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  langSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  langText: {
    color: '#CBD5E1',
    fontSize: 12.5,
    fontWeight: '600',
  },
});
