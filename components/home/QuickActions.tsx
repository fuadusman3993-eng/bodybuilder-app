import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { quickActions } from '../../constants/mockData';

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
      style={styles.actionItem}
      activeOpacity={0.7}
      onPress={() => {
        if (item.route) {
          router.push(item.route as any);
        }
      }}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon as any} size={24} color={item.color} />
      </View>
      <Text style={styles.actionTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.actionSubtitle} numberOfLines={1}>{item.subtitle}</Text>
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
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionItem: {
    width: '22%',
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 9,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
