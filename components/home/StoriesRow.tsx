import React from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { stories } from '../../constants/mockData';

interface Story {
  id: string;
  name: string;
  image: string;
  isOwn: boolean;
}

function StoryItem({ item }: { item: Story }) {
  return (
    <TouchableOpacity style={styles.storyItem} activeOpacity={0.7}>
      <View style={[styles.storyRing, item.isOwn && styles.storyRingOwn]}>
        <Image source={{ uri: item.image }} style={styles.storyImage} />
        {item.isOwn && (
          <View style={styles.addBadge}>
            <Ionicons name="add" size={14} color={Colors.textPrimary} />
          </View>
        )}
      </View>
      <Text style={styles.storyName} numberOfLines={1}>
        {item.isOwn ? 'Your story' : item.name}
      </Text>
    </TouchableOpacity>
  );
}

export default function StoriesRow() {
  return (
    <View style={styles.container}>
      <FlatList
        data={stories}
        renderItem={({ item }) => <StoryItem item={item} />}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  storyItem: {
    alignItems: 'center',
    width: 68,
  },
  storyRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRingOwn: {
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
  },
  storyImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
  },
  addBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  storyName: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
