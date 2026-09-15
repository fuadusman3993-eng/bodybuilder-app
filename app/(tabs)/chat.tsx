import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { chatList } from '../../constants/mockData';

const filterTabs = ['All', 'Coaches', 'Clients', 'Groups'];

export default function ChatScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const renderAvatar = (chat: any) => {
    if (chat.isAI) {
      return (
        <View style={[styles.avatar, styles.aiAvatar]}>
          <Ionicons name="hardware-chip" size={24} color={Colors.textPrimary} />
        </View>
      );
    }
    if (chat.isGroup) {
      return (
        <View style={[styles.avatar, styles.groupAvatar]}>
          <Ionicons name="people" size={24} color={Colors.textPrimary} />
        </View>
      );
    }
    if (chat.isGym) {
      return (
        <View style={[styles.avatar, styles.gymAvatar]}>
          <Ionicons name="barbell" size={24} color={Colors.textPrimary} />
        </View>
      );
    }
    return <Image source={{ uri: chat.avatar }} style={styles.avatar} />;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat</Text>
        <TouchableOpacity>
          <Ionicons name="create-outline" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
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
        </ScrollView>
      </View>

      {/* Chat List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
        {chatList.map((chat) => (
          <TouchableOpacity key={chat.id} style={styles.chatCard} activeOpacity={0.8}>
            {renderAvatar(chat)}
            
            <View style={styles.chatDetails}>
              <View style={styles.chatHeaderRow}>
                <View style={styles.nameRow}>
                  <Text style={styles.chatName} numberOfLines={1}>{chat.name}</Text>
                  {chat.isVerified && (
                    <Ionicons name="checkmark-circle" size={14} color={Colors.info} style={styles.verifiedIcon} />
                  )}
                </View>
                <Text style={[styles.timeText, chat.unread > 0 && styles.timeTextUnread]}>
                  {chat.time}
                </Text>
              </View>
              
              <View style={styles.chatFooterRow}>
                <Text style={[styles.lastMessage, chat.unread > 0 && styles.lastMessageUnread]} numberOfLines={1}>
                  {chat.lastMessage}
                </Text>
                {chat.unread > 0 ? (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{chat.unread}</Text>
                  </View>
                ) : (
                  <Ionicons name="checkmark-done" size={16} color={Colors.textSecondary} />
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 46,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    height: '100%',
  },
  filterButton: {
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.background,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for bottom navigation
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiAvatar: {
    backgroundColor: Colors.info,
  },
  groupAvatar: {
    backgroundColor: '#059669', // Teal color for groups
  },
  gymAvatar: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chatDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  timeText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  timeTextUnread: {
    color: Colors.primary,
    fontWeight: '600',
  },
  chatFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: 16,
  },
  lastMessageUnread: {
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: Colors.background,
    fontSize: 11,
    fontWeight: '700',
  },
});
