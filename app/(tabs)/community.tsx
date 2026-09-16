import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { communityPosts } from '../../constants/mockData';
import PostCard from '../../components/home/PostCard';
import { useUserStore, UserTier } from '../../store/userStore';
import GuestBlocker from '../../components/ui/GuestBlocker';

const tabs = ['For You', 'Following', 'Nearby'];

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState('For You');
  const { user } = useUserStore();

  if (user.tier === UserTier.GUEST) {
    return <GuestBlocker feature="community" />;
  }


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <TouchableOpacity>
          <Ionicons name="create-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Custom Top Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
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

      {/* Feed */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContainer}
      >
        {communityPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {/* Added extra mock post for scroll effect */}
        <PostCard key="extra" post={{...communityPosts[0], id: '3', timeAgo: '5h ago', content: 'Morning run done! 🏃‍♂️'}} />
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
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
  feedContainer: {
    paddingBottom: 24,
  },
});
