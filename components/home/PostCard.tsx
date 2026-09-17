import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Layout, useLayout } from '../../constants/layout';

interface Post {
  id: string;
  user: {
    name: string;
    avatar: string;
    location: string;
  };
  timeAgo: string;
  content: string;
  images: string[];
  imageCount: number;
  currentImage: number;
  likes: number;
  comments: number;
  isLiked: boolean;
}

export default function PostCard({ post }: { post: Post }) {
  const { width } = useWindowDimensions();
  // Image height = square aspect ratio
  const imageHeight = width;

  return (
    <View style={styles.container}>
      {/* Post Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
          <View>
            <Text style={styles.userName}>{post.user.name}</Text>
            <Text style={styles.postMeta}>{post.timeAgo} • {post.user.location}</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={Layout.iconSizeSM} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Post Image */}
      {post.images.length > 0 && (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: post.images[0] }} 
            style={styles.postImage} 
            resizeMode="cover"
          />
          {post.imageCount > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>{post.currentImage}/{post.imageCount}</Text>
            </View>
          )}
        </View>
      )}

      {/* Post Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={Layout.iconSize}
              color={post.isLiked ? Colors.danger : Colors.textPrimary}
            />
            <Text style={[styles.actionText, post.isLiked && { color: Colors.danger }]}>
              {post.likes}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={Layout.iconSizeSM} color={Colors.textPrimary} />
            <Text style={styles.actionText}>{post.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Ionicons name="paper-plane-outline" size={Layout.iconSizeSM} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="bookmark-outline" size={Layout.iconSize} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background, // changed to background to blend like IG
    marginBottom: 20,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.contentPadding,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  userName: {
    fontSize: Layout.fontMD,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  postMeta: {
    fontSize: Layout.fontSM,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  content: {
    fontSize: Layout.fontMD,
    color: Colors.textPrimary,
    paddingHorizontal: Layout.contentPadding,
    paddingBottom: 12,
    lineHeight: 20,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  postImage: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: Colors.surface,
  },
  imageCounter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    fontSize: Layout.fontSM,
    color: '#FFF',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.contentPadding,
    paddingTop: 10,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: Layout.fontMD,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
});
