import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

export interface RealPost {
  id: string;
  uid: string;
  username: string;
  avatar_url: string;
  image_url: string;
  caption?: string;
  likes_count: number;
  created_at: string;
  isLiked?: boolean;
  isCoach?: boolean;
  city?: string;
}

function timeAgo(dateStr: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  return `${w}w ago`;
}

interface PostCardProps {
  post: RealPost;
  onToggleLike?: (postId: string) => void;
  onPressUser?: (uid: string) => void;
}

export default function PostCard({ post, onToggleLike, onPressUser }: PostCardProps) {
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.username || 'User')}&background=10B981&color=fff&size=150`;

  return (
    <View style={styles.container}>
      {/* Post Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userInfo}
          activeOpacity={0.8}
          onPress={() => onPressUser?.(post.uid)}
        >
          <Image
            source={post.avatar_url || defaultAvatar}
            placeholder={defaultAvatar}
            cachePolicy="memory-disk"
            contentFit="cover"
            style={styles.avatar}
          />
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.userName}>{post.username || 'User'}</Text>
              {post.isCoach && (
                <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
              )}
            </View>
            <Text style={styles.postMeta}>
              {timeAgo(post.created_at)}{post.city ? ` • ${post.city}` : ''}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onPressUser?.(post.uid)}>
          <Ionicons name="ellipsis-horizontal" size={Layout.iconSizeSM} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Post Caption (if any) */}
      {!!post.caption && (
        <Text style={styles.content}>{post.caption}</Text>
      )}

      {/* Post Image */}
      {!!post.image_url && (
        <View style={styles.imageContainer}>
          <Image
            source={post.image_url}
            cachePolicy="memory-disk"
            contentFit="cover"
            style={styles.postImage}
          />
        </View>
      )}

      {/* Post Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => onToggleLike?.(post.id)}
          >
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={Layout.iconSize}
              color={post.isLiked ? '#EF4444' : Colors.textPrimary}
            />
            <Text style={[styles.actionText, post.isLiked && { color: '#EF4444' }]}>
              {post.likes_count || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => onPressUser?.(post.uid)}
          >
            <Ionicons name="chatbubble-outline" size={Layout.iconSizeSM} color={Colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Ionicons name="paper-plane-outline" size={Layout.iconSizeSM} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
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
