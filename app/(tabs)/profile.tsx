import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { profileData } from '../../constants/mockData';
import { useUserStore, UserTier } from '../../store/userStore';
import GuestBlocker from '../../components/ui/GuestBlocker';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 32 - 16) / 3;

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState('Posts');
  const { user } = useUserStore();

  if (user.tier === UserTier.GUEST) {
    return (
      <GuestBlocker 
        title="Your Profile Awaits"
        description="Sign up to track your workouts, earn achievements, and build your fitness portfolio."
        icon="person-circle-outline"
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="share-social-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <Image source={{ uri: profileData.avatar }} style={styles.avatar} />
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profileData.name}</Text>
            <Ionicons name="checkmark-circle" size={20} color={Colors.info} />
          </View>
          <Text style={styles.title}>{profileData.title}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profileData.stats.workouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profileData.stats.weeksStreak}</Text>
            <Text style={styles.statLabel}>Weeks Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profileData.stats.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
        </View>

        {/* Edit Button & Bio */}
        <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        
        <Text style={styles.bio}>{profileData.bio}</Text>

        {/* Profile Tabs */}
        <View style={styles.tabsContainer}>
          {['Posts', 'Progress', 'Achievements'].map((tab) => (
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

        {/* Grid Gallery */}
        <View style={styles.gridContainer}>
          {profileData.gridImages.map((img, index) => (
            <TouchableOpacity key={index} activeOpacity={0.8}>
              <Image source={{ uri: img }} style={styles.gridImage} />
            </TouchableOpacity>
          ))}
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.surfaceLight,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  title: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  editButton: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  bio: {
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 20,
    marginHorizontal: 20,
    lineHeight: 22,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginTop: 24,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.textPrimary,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  gridImage: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
});
