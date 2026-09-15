import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { quickActions } from '../../constants/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Adaptive sizing: 4 items per row with equal spacing
const ITEMS_PER_ROW = 4;
const HORIZONTAL_PADDING = 16;
const ITEM_GAP = 10;
const ITEM_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - ITEM_GAP * (ITEMS_PER_ROW - 1)) / ITEMS_PER_ROW;

// Adaptive icon box size: scales relative to item width, capped between 44-60px
const ICON_SIZE = Math.min(60, Math.max(44, ITEM_WIDTH * 0.72));
// Adaptive font: smaller on compact screens (< 360px wide like some Tecno models)
const TITLE_FONT = SCREEN_WIDTH < 360 ? 9.5 : 11;
const SUBTITLE_FONT = SCREEN_WIDTH < 360 ? 8 : 9;

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  route: string;
}

function QuickActionItem({ item }: { item: QuickAction }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.actionItem, { width: ITEM_WIDTH }]}
      activeOpacity={0.7}
      onPress={() => {
        if (item.route) {
          router.push(item.route as any);
        }
      }}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20', width: ICON_SIZE, height: ICON_SIZE, borderRadius: ICON_SIZE * 0.3 }]}>
        <Ionicons name={item.icon as any} size={ICON_SIZE * 0.43} color={item.color} />
      </View>
      {/* Allow 2 lines on very small screens so text is never clipped */}
      <Text style={[styles.actionTitle, { fontSize: TITLE_FONT }]} numberOfLines={2} adjustsFontSizeToFit>
        {item.title}
      </Text>
      <Text style={[styles.actionSubtitle, { fontSize: SUBTITLE_FONT }]} numberOfLines={1}>
        {item.subtitle}
      </Text>
    </TouchableOpacity>
  );
}

export default function QuickActions() {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {quickActions.map((action) => (
          <QuickActionItem key={action.id} item={action} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: HORIZONTAL_PADDING,
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
