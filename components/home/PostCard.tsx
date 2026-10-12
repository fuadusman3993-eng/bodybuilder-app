import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  TextInput, FlatList, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/userStore';

export interface RealPost {
  id: string;
  uid: string;
  username: string;
  avatar_url: string;
  image_url: string;
  caption?: string;
  likes_count: number;
  comments_count?: number;
  created_at: string;
  isLiked?: boolean;
  isCoach?: boolean;
  city?: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  uid: string;
  username: string;
  avatar_url?: string;
  text: string;
  created_at: string;
  isCoach?: boolean;
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
  const { user: currentUser } = useUserStore();
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.username || 'User')}&background=10B981&color=fff&size=150`;
  const currentAvatar = currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=10B981&color=fff&size=150`;

  // Comments State
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsCount, setCommentsCount] = useState<number>(post.comments_count || 0);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Load comments when modal opens
  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments]);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setComments(data);
        setCommentsCount(data.length);
      }
    } catch (e) {
      console.warn('Error fetching comments:', e);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUser?.uid || submittingComment) return;
    const text = commentText.trim();
    setCommentText('');
    setSubmittingComment(true);

    const tempId = `temp_${Date.now()}`;
    const newComment: PostComment = {
      id: tempId,
      post_id: post.id,
      uid: currentUser.uid,
      username: currentUser.name || 'User',
      avatar_url: currentAvatar,
      text,
      created_at: new Date().toISOString(),
      isCoach: currentUser.role === 'coach',
    };

    // Optimistic UI update
    setComments(prev => [...prev, newComment]);
    setCommentsCount(c => c + 1);

    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          uid: currentUser.uid,
          username: currentUser.name || 'User',
          avatar_url: currentUser.avatar || null,
          text,
        })
        .select()
        .single();

      if (!error && data) {
        setComments(prev => prev.map(c => c.id === tempId ? data : c));
      }

      // Notify post author if not self
      if (post.uid !== currentUser.uid) {
        try {
          await supabase.from('notifications').insert({
            user_uid: post.uid,
            sender_uid: currentUser.uid,
            type: 'comment_post',
            message: `${currentUser.name || 'Someone'} commented on your post: "${text.slice(0, 45)}"`,
          });
        } catch (_) {}
      }
    } catch (e) {
      console.warn('Comment insert error:', e);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Header: Avatar + Username + Location/Time */}
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

      {/* 2. Photo: Contained, balanced height so everything fits in 1 screen */}
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

      {/* 3. Action Bar: Immediately below photo */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          {/* Like Button */}
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

          {/* Comment Button (Opens Comments Modal) */}
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => setShowComments(true)}
          >
            <Ionicons name="chatbubble-outline" size={Layout.iconSizeSM} color={Colors.textPrimary} />
            <Text style={styles.actionText}>{commentsCount}</Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Ionicons name="paper-plane-outline" size={Layout.iconSizeSM} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Caption: Below Actions, Instagram-style */}
      {!!post.caption && (
        <View style={styles.captionWrap}>
          <Text style={styles.captionText} numberOfLines={3}>
            <Text
              style={styles.captionUsername}
              onPress={() => onPressUser?.(post.uid)}
            >
              {post.username}{' '}
            </Text>
            {post.caption}
          </Text>
        </View>
      )}

      {/* 5. Comments preview & quick entry */}
      {commentsCount > 0 ? (
        <TouchableOpacity
          style={styles.viewCommentsRow}
          onPress={() => setShowComments(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.viewCommentsText}>
            View all {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.addCommentRow}
          onPress={() => setShowComments(true)}
          activeOpacity={0.7}
        >
          <Image
            source={currentAvatar}
            placeholder={defaultAvatar}
            cachePolicy="memory-disk"
            contentFit="cover"
            style={styles.tinyAvatar}
          />
          <Text style={styles.addCommentPlaceholder}>Add a comment...</Text>
        </TouchableOpacity>
      )}

      {/* COMMENTS MODAL */}
      <Modal
        visible={showComments}
        animationType="slide"
        transparent
        onRequestClose={() => setShowComments(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <TouchableOpacity
            style={styles.backdropDismiss}
            activeOpacity={1}
            onPress={() => setShowComments(false)}
          />

          <View style={styles.modalSheet}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Sheet Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                Comments ({commentsCount})
              </Text>
              <TouchableOpacity
                onPress={() => setShowComments(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Comments List */}
            {loadingComments ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading comments...</Text>
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.emptyComments}>
                <Ionicons name="chatbubbles-outline" size={44} color={Colors.textMuted} />
                <Text style={styles.emptyCommentsTitle}>No comments yet</Text>
                <Text style={styles.emptyCommentsSubtitle}>
                  Be the first to share your thoughts on this post!
                </Text>
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.commentsList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <TouchableOpacity onPress={() => { setShowComments(false); onPressUser?.(item.uid); }}>
                      <Image
                        source={item.avatar_url || defaultAvatar}
                        placeholder={defaultAvatar}
                        cachePolicy="memory-disk"
                        contentFit="cover"
                        style={styles.commentAvatar}
                      />
                    </TouchableOpacity>
                    <View style={styles.commentContent}>
                      <View style={styles.commentAuthorRow}>
                        <Text style={styles.commentAuthor}>{item.username || 'User'}</Text>
                        {item.isCoach && (
                          <Ionicons name="checkmark-circle" size={13} color={Colors.primary} />
                        )}
                        <Text style={styles.commentTime}>{timeAgo(item.created_at)}</Text>
                      </View>
                      <Text style={styles.commentText}>{item.text}</Text>
                    </View>
                  </View>
                )}
              />
            )}

            {/* Bottom Input Bar */}
            <View style={styles.inputBar}>
              <Image
                source={currentAvatar}
                placeholder={defaultAvatar}
                cachePolicy="memory-disk"
                contentFit="cover"
                style={styles.inputAvatar}
              />
              <TextInput
                style={styles.commentInput}
                placeholder={`Comment as ${currentUser?.name || 'User'}...`}
                placeholderTextColor={Colors.textMuted}
                value={commentText}
                onChangeText={setCommentText}
                maxLength={300}
                returnKeyType="send"
                onSubmitEditing={handleAddComment}
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!commentText.trim() || submittingComment) && { opacity: 0.35 }
                ]}
                onPress={handleAddComment}
                disabled={!commentText.trim() || submittingComment}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Ionicons name="arrow-up" size={18} color="#000" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  postMeta: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  // Contained Image
  imageContainer: {
    width: '100%',
    backgroundColor: '#0A0F1D',
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 310,
    backgroundColor: '#0A0F1D',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
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
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },

  // Caption
  captionWrap: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 4,
  },
  captionText: {
    fontSize: 13.5,
    color: Colors.textPrimary,
    lineHeight: 19,
  },
  captionUsername: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Comments view / add
  viewCommentsRow: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  viewCommentsText: {
    fontSize: 12.5,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  addCommentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tinyAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  addCommentPlaceholder: {
    fontSize: 12.5,
    color: Colors.textMuted,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '82%',
    minHeight: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  sheetTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  emptyComments: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyCommentsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyCommentsSubtitle: {
    fontSize: 12.5,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  commentsList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginTop: 2,
  },
  commentContent: {
    flex: 1,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  commentTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  commentText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: '#0B1120',
  },
  inputAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
