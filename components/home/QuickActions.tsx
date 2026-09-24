import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

const ACTIONS = [
  { id: '1', title: 'My Workout', subtitle: 'Track & improve', icon: 'barbell-outline', color: '#3B82F6', route: '/workout' },
  { id: '2', title: 'AI Assistant', subtitle: 'Ask anything', icon: 'hardware-chip-outline', color: '#8B5CF6', route: '/(tabs)/chat' },
  { id: '3', title: 'Find Gym', subtitle: 'Near you', icon: 'location-outline', color: '#F59E0B', route: '/gym' },
  { id: '4', title: 'Market Place', subtitle: 'Sport gear & more', icon: 'cart-outline', color: '#EF4444', route: '/gym' },
];

export default function QuickActions() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardW = (width - 32 - 30) / 4; // 4 cards, 16px each side padding, 10px gaps

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {ACTIONS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, { width: cardW + 10 }]}
            activeOpacity={0.75}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={26} color={item.color} />
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.cardSub} numberOfLines={1}>{item.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 22, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  row: { gap: 10 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, lineHeight: 17 },
  cardSub: { fontSize: 11, color: Colors.textSecondary },
});
