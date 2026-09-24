import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { communityPosts } from '../../constants/mockData';

function PostCard({ post }: { post: any }) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);

  const toggleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <View style={styles.card}>
      {/* Post Header */}
      <View style={styles.cardHeader}>
        <View style={styles.userRow}>
          <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{post.user.name}</Text>
              <Ionicons name="checkmark-circle" size={14} color={Colors.info} />
            </View>
            <Text style={styles.metaText}>{post.timeAgo} · {post.user.location}</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <Text style={styles.postText}>{post.content}</Text>

      {/* Post Image */}
      {post.images && post.images.length > 0 && (
        <View style={styles.imageWrap}>
          <Image source={{ uri: post.images[0] }} style={styles.postImage} resizeMode="cover" />
          {post.imageCount > 1 && (
            <View style={styles.imageCount}>
              <Text style={styles.imageCountText}>+{post.imageCount - 1}</Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={toggleLike}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? '#EF4444' : Colors.textMuted} />
          <Text style={[styles.actionText, liked && styles.actionTextLiked]}>{likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="share-social-outline" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CommunityFeed() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <TouchableOpacity
        style={styles.sectionHeaderCard}
        activeOpacity={0.85}
        onPress={() => router.push('/(tabs)/community')}
      >
        <View style={styles.sectionHeaderLeft}>
          <View style={styles.sectionIcon}>
            <Ionicons name="people" size={20} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Community Feed</Text>
            <Text style={styles.sectionSubtitle}>Workout tips, progress, and motivation.</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
      </TouchableOpacity>

      {/* Posts */}
      {communityPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 22, paddingBottom: 20 },

  sectionHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(16,185,129,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  sectionSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },

  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    paddingBottom: 10,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceLight },
  userInfo: { gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  metaText: { fontSize: 11, color: Colors.textMuted },

  postText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20, paddingHorizontal: 14, paddingBottom: 10 },

  imageWrap: { position: 'relative' },
  postImage: { width: '100%', height: 200 },
  imageCount: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageCountText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  actions: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 20,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  actionTextLiked: { color: '#EF4444' },
});
