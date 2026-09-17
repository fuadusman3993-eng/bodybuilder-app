import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { gymData } from '../../constants/mockData';

const filterTabs = ['Nearby', 'Popular', 'Price'];

export default function FindGymScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Nearby');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find a Gym</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="options-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search gym name or location..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Gym List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
        {gymData.map((gym) => (
          <TouchableOpacity key={gym.id} style={styles.gymCard} activeOpacity={0.8}>
            <Image source={{ uri: gym.image }} style={styles.gymImage} />
            <View style={styles.gymDetails}>
              <View style={styles.gymHeaderRow}>
                <Text style={styles.gymName} numberOfLines={1}>{gym.name}</Text>
                {gym.isOpen ? (
                  <View style={styles.badgeOpen}>
                    <Text style={styles.badgeOpenText}>Open Now</Text>
                  </View>
                ) : (
                  <View style={styles.badgeClosed}>
                    <Text style={styles.badgeClosedText}>Closed</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.gymStatsRow}>
                <Ionicons name="star" size={14} color={Colors.warning} />
                <Text style={styles.ratingText}>{gym.rating}</Text>
                <Text style={styles.reviewsText}>({gym.reviews})</Text>
              </View>
              
              <View style={styles.gymLocationRow}>
                <Ionicons name="location" size={14} color={Colors.textSecondary} />
                <Text style={styles.distanceText}>{gym.distance} • Addis Ababa</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {/* Placeholder for scroll space */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 20,
    paddingHorizontal: 16,
    minHeight: 50,
    flexShrink: 1,
  },
  searchIcon: {
    marginRight: 10,
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.background,
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  gymCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  gymImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
  },
  gymDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  gymHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gymName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  badgeOpen: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeOpenText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  badgeClosed: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeClosedText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  gymStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  reviewsText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  gymLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  distanceText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
