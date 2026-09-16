import React from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
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
  const { width } = useWindowDimensions();
  // Scale avatar size between 56px (small) and 64px (large)
  const avatarOuter = width < 360 ? 56 : 64;
  const avatarInner = avatarOuter - 8;

  return (
    <TouchableOpacity style={styles.storyItem} activeOpacity={0.7}>
      <View
        style={[
          styles.storyRing,
          {
            width: avatarOuter,
            height: avatarOuter,
            borderRadius: avatarOuter / 2,
          },
          item.isOwn && styles.storyRingOwn,
        ]}
      >
        <Image
          source={{ uri: item.image }}
          style={{
            width: avatarInner,
            height: avatarInner,
            borderRadius: avatarInner / 2,
            backgroundColor: Colors.surface,
          }}
        />
        {item.isOwn && (
          <View style={styles.addBadge}>
            <Ionicons name="add" size={12} color={Colors.textPrimary} />
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
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    gap: 5,
    maxWidth: 70,
  },
  storyRing: {
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRingOwn: {
    borderColor: Colors.borderLight,
  },
  addBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
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
    textAlign: 'center',
    width: '100%',
  },
});
