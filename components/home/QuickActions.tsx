import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { quickActions } from '../../constants/mockData';

const ITEMS_PER_ROW = 4;
const H_PADDING = 16;
const ITEM_GAP = 10;

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  route: string;
}

function QuickActionItem({ item, itemWidth }: { item: QuickAction; itemWidth: number }) {
  const router = useRouter();
  const iconSize = Math.min(52, Math.max(40, itemWidth * 0.72));
  const titleFont = itemWidth < 72 ? 9.5 : 11;
  const subtitleFont = itemWidth < 72 ? 8 : 9.5;

  return (
    <TouchableOpacity
      style={[styles.actionItem, { width: itemWidth }]}
      activeOpacity={0.7}
      onPress={() => item.route && router.push(item.route as any)}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: item.color + '20',
            width: iconSize,
            height: iconSize,
            borderRadius: iconSize * 0.28,
          },
        ]}
      >
        <Ionicons name={item.icon as any} size={iconSize * 0.44} color={item.color} />
      </View>
      <Text
        style={[styles.actionTitle, { fontSize: titleFont }]}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        {item.title}
      </Text>
      <Text style={[styles.actionSubtitle, { fontSize: subtitleFont }]} numberOfLines={1}>
        {item.subtitle}
      </Text>
    </TouchableOpacity>
  );
}

export default function QuickActions() {
  const { width } = useWindowDimensions();
  const itemWidth = (width - H_PADDING * 2 - ITEM_GAP * (ITEMS_PER_ROW - 1)) / ITEMS_PER_ROW;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>
      <View style={styles.grid}>
        {quickActions.map((action) => (
          <QuickActionItem key={action.id} item={action} itemWidth={itemWidth} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: H_PADDING,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ITEM_GAP,
  },
  actionItem: {
    alignItems: 'center',
    gap: 5,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 14,
  },
  actionSubtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
