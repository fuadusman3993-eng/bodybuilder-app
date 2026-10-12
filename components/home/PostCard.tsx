import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  TextInput, FlatList, KeyboardAvoidingView, Platform,
  ActivityIndicator, Image as RNImage,
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
  isBookmarked?: boolean;
  isCoach?: boolean;
  city?: string;
  recentLikerName?: string;
  isFollowing?: boolean;
  isSelf?: boolean;
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
  onToggleBookmark?: (postId: string) => void;
  onFollowToggle?: (uid: string, isFollowing: boolean) => void;
  onPressUser?: (uid: string) => void;
}

export default function PostCard({
  post,
  onToggleLike,
  onToggleBookmark,
  onFollowToggle,
  onPressUser,
}: PostCardProps) {
  const { user: currentUser } = useUserStore();
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.username || 'User')}&background=10B981&color=fff&size=150`;
  const currentAvatar = currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=10B981&color=fff&size=150`;

  // Image Aspect Ratio & Full View State
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [showFullImage, setShowFullImage] = useState(false);

  useEffect(() => {
    if (post.image_url) {
      RNImage.getSize(
        post.image_url,
        (w, h) => {
          if (w && h) {
            const ratio = w / h;
            setAspectRatio(Math.max(0.75, Math.min(1.91, ratio)));
          }
        },
        () => {}
      );
    }
  }, [post.image_url]);

  // Comments State
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsCount, setCommentsCount] = useState<number>(post.comments_count || 0);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

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

  /* ─── Derived subtitle ─── */
  const subtitle = post.isSelf
    ? timeAgo(post.created_at) + (post.city ? ` • ${post.city}` : '')
    : post.isFollowing
      ? `Following • ${timeAgo(post.created_at)}`
      : `Suggested for you • ${timeAgo(post.created_at)}`;

  return (
    <View style={styles.container}>
      {/* ── 1. HEADER ── */}
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
            <Text style={styles.postMeta} numberOfLines={1}>{subtitle}</Text>
          </View>
        </TouchableOpacity>

        {/* Right side: Follow button + menu */}
        <View style={styles.headerRight}>
          {!post.isSelf && (
            <TouchableOpacity
              style={[styles.followBtn, post.isFollowing && styles.followingBtn]}
              activeOpacity={0.8}
              onPress={() => onFollowToggle?.(post.uid, !!post.isFollowing)}
            >
              <Text style={[styles.followBtnText, post.isFollowing && styles.followingBtnText]}>
                {post.isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => onPressUser?.(post.uid)}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 2. PHOTO ── */}
      {!!post.image_url && (
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => setShowFullImage(true)}
          style={styles.imageContainer}
        >
          <Image
            source={post.image_url}
            cachePolicy="memory-disk"
            contentFit="contain"
            onLoad={(e) => {
              if (e.source?.width && e.source?.height) {
                const ratio = e.source.width / e.source.height;
                setAspectRatio(Math.max(0.75, Math.min(1.91, ratio)));
              }
            }}
            style={[styles.postImage, { aspectRatio }]}
          />
        </TouchableOpacity>
      )}

      {/* ── 3. ACTION BAR ── */}
      <View style={styles.actions}>
        {/* Left: Like · Comment · Send */}
        <View style={styles.leftActions}>
          {/* Like */}
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => onToggleLike?.(post.id)}
          >
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={26}
              color={post.isLiked ? '#EF4444' : Colors.textPrimary}
            />
            <Text style={[styles.actionText, post.isLiked && { color: '#EF4444' }]}>
              {post.likes_count || 0}
            </Text>
          </TouchableOpacity>

          {/* Comment */}
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => setShowComments(true)}
          >
            <Ionicons name="chatbubble-outline" size={24} color={Colors.textPrimary} />
            <Text style={styles.actionText}>{commentsCount}</Text>
          </TouchableOpacity>

          {/* Send / Share */}
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Ionicons name="paper-plane-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Right: Bookmark */}
        <TouchableOpacity
          style={styles.bookmarkBtn}
          activeOpacity={0.7}
          onPress={() => onToggleBookmark?.(post.id)}
        >
          <Ionicons
            name={post.isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={post.isBookmarked ? Colors.primary : Colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* ── 4. LIKED BY ROW ── */}
      {(post.likes_count || 0) > 0 && (
        <View style={styles.likedByRow}>
          <Text style={styles.likedByText}>
            {post.recentLikerName && post.recentLikerName !== post.username
              ? `Liked by ${post.recentLikerName}${post.likes_count > 1 ? ' and others' : ''}`
              : `${post.likes_count} like${post.likes_count !== 1 ? 's' : ''}`}
          </Text>
        </View>
      )}

      {/* ── 5. CAPTION ── */}
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

      {/* ── 6. COMMENTS PREVIEW ── */}
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

      {/* ── COMMENTS MODAL ── */}
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
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Comments ({commentsCount})</Text>
              <TouchableOpacity onPress={() => setShowComments(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

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
                  Be the first to share your thoughts!
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
                style={[styles.sendBtn, (!commentText.trim() || submittingComment) && { opacity: 0.35 }]}
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

      {/* ── FULL SCREEN IMAGE MODAL ── */}
      <Modal
        visible={showFullImage}
        animationType="fade"
        transparent
        onRequestClose={() => setShowFullImage(false)}
      >
        <View style={styles.fullImageModal}>
          <TouchableOpacity
            style={styles.fullImageClose}
            onPress={() => setShowFullImage(false)}
          >
            <Ionicons name="close" size={26} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={1}
            style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
            onPress={() => setShowFullImage(false)}
          >
            <Image
              source={post.image_url}
              contentFit="contain"
              style={styles.fullImage}
            />
          </TouchableOpacity>
        </View>
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
    borderColor: 'rgba(255, 255, 255, 0.06)',
    width: '100%',
  },

  // ── Header ──
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
    flex: 1,
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
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.primary,
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  followBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  followingBtnText: {
    color: Colors.primary,
  },
  menuBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Image ──
  imageContainer: {
    width: '100%',
    backgroundColor: '#070B14',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postImage: {
    width: '100%',
    maxHeight: 500,
    backgroundColor: '#070B14',
  },

  // ── Actions ──
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
    gap: 14,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  bookmarkBtn: {
    padding: 2,
  },

  // ── Liked by ──
  likedByRow: {
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  likedByText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  // ── Caption ──
  captionWrap: {
    paddingHorizontal: 14,
    paddingTop: 4,
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

  // ── Comments Preview ──
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

  // ── Comments Modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  backdropDismiss: { flex: 1 },
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
  loadingText: { fontSize: 13, color: Colors.textMuted },
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
  commentContent: { flex: 1 },
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
  commentTime: { fontSize: 11, color: Colors.textMuted },
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
  inputAvatar: { width: 30, height: 30, borderRadius: 15 },
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

  // ── Full Screen Image ──
  fullImageModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageClose: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 24 : 50,
    right: 20,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '95%',
    height: '85%',
  },
});
