import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  TextInput, FlatList, KeyboardAvoidingView, Platform,
  ActivityIndicator, Image as RNImage, Alert, Share,
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
  recentLikerAvatar?: string;
  reposts_count?: number;
  isReposted?: boolean;
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
  onToggleRepost?: (postId: string) => void;
  onFollowToggle?: (uid: string, isFollowing: boolean) => void;
  onPressUser?: (uid: string) => void;
  onDeletePost?: (postId: string) => void;
}

export default function PostCard({
  post,
  onToggleLike,
  onToggleBookmark,
  onToggleRepost,
  onFollowToggle,
  onPressUser,
  onDeletePost,
}: PostCardProps) {
  const { user: currentUser } = useUserStore();
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.username || 'User')}&background=10B981&color=fff&size=150`;
  const currentAvatar = currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=10B981&color=fff&size=150`;

  // Image Aspect Ratio & Full View State
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [showFullImage, setShowFullImage] = useState(false);
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = 'https://bodybuilder-app-phi.vercel.app';
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({ title: 'FitPulse Post', url });
        } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }
      } else {
        await Share.share({ message: url });
      }
    } catch (_) {}
  };

  const isOwner = !!post.isSelf || (!!currentUser?.uid && post.uid === currentUser.uid);

  const handleDelete = () => {
    setShowPostOptions(false);
    const doDelete = () => {
      onDeletePost?.(post.id);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this post?')) {
        doDelete();
      }
    } else {
      Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

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

  useEffect(() => {
    if (typeof post.comments_count === 'number') {
      setCommentsCount(post.comments_count);
    }
  }, [post.comments_count]);

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
      : `Suggested for you`;

  return (
    <View style={styles.container}>
      {/* ── 1. HEADER (Instagram style) ── */}
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
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.userName}>{post.username || 'User'}</Text>
              {post.isCoach && (
                <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
              )}
            </View>
            <Text style={styles.postMeta} numberOfLines={1}>{subtitle}</Text>
          </View>
        </TouchableOpacity>

        {/* Right side: Follow button + 3-dots */}
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
            onPress={() => {
              if (isOwner) {
                setShowPostOptions(true);
              } else {
                onPressUser?.(post.uid);
              }
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 2. PHOTO (Edge-to-Edge, Zero Margins, Zero Radius) ── */}
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

      {/* ── 3. ACTION BAR (Heart, Comment, Repost, Send, Bookmark) ── */}
      <View style={styles.actions}>
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

          {/* Repost */}
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => onToggleRepost?.(post.id)}
          >
            <Ionicons
              name="repeat-outline"
              size={24}
              color={post.isReposted ? Colors.primary : Colors.textPrimary}
            />
            {(post.reposts_count || 0) > 0 && (
              <Text style={[styles.actionText, post.isReposted && { color: Colors.primary }]}>
                {post.reposts_count}
              </Text>
            )}
          </TouchableOpacity>

          {/* Send / Share */}
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={handleShare}
          >
            <Ionicons
              name={copied ? 'checkmark-circle-outline' : 'paper-plane-outline'}
              size={24}
              color={copied ? Colors.primary : Colors.textPrimary}
            />
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

      {/* ── 4. LIKED BY ROW (Overlapping Avatars + Text) ── */}
      {(post.likes_count || 0) > 0 && !!post.recentLikerName && (
        <View style={styles.likedByRow}>
          <View style={styles.likedAvatars}>
            <Image
              source={post.recentLikerAvatar || defaultAvatar}
              placeholder={defaultAvatar}
              cachePolicy="memory-disk"
              contentFit="cover"
              style={styles.likedAvatar1}
            />
            <Image
              source={post.avatar_url || defaultAvatar}
              placeholder={defaultAvatar}
              cachePolicy="memory-disk"
              contentFit="cover"
              style={styles.likedAvatar2}
            />
          </View>
          <Text style={styles.likedByText}>
            Liked by{' '}
            <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>
              {post.recentLikerName}
            </Text>
            {(post.likes_count || 0) > 1 ? ' and others' : ''}
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

      {/* ── POST OPTIONS MODAL (OWNER DELETE) ── */}
      <Modal
        visible={showPostOptions}
        animationType="fade"
        transparent
        onRequestClose={() => setShowPostOptions(false)}
      >
        <TouchableOpacity
          style={styles.optionsModalOverlay}
          activeOpacity={1}
          onPress={() => setShowPostOptions(false)}
        >
          <View style={styles.optionsSheet}>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={styles.deleteOptionText}>Delete Post</Text>
            </TouchableOpacity>
            <View style={styles.optionDivider} />
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setShowPostOptions(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.cancelOptionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Seamless Edge-to-Edge Container (No rounded box, no borders)
  container: {
    backgroundColor: 'transparent',
    marginBottom: 24,
    width: '100%',
  },

  // ── Header (Padding 12) ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
  },
  userName: {
    fontSize: 13.5,
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
    gap: 10,
  },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  followBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  followingBtnText: {
    color: Colors.textSecondary,
  },
  menuBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Edge-to-Edge Image (Zero Radius, Zero Margin) ──
  imageContainer: {
    width: '100%',
    backgroundColor: '#000000',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postImage: {
    width: '100%',
    maxHeight: 560,
    backgroundColor: '#000000',
  },

  // ── Actions (Padding 12) ──
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
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
  bookmarkBtn: {
    padding: 2,
  },

  // ── Liked by (Overlapping Avatars + Text) ──
  likedByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 4,
  },
  likedAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likedAvatar1: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#0A0F1A',
  },
  likedAvatar2: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -6,
    borderWidth: 1.5,
    borderColor: '#0A0F1A',
  },
  likedByText: {
    fontSize: 12.5,
    color: Colors.textPrimary,
  },

  // ── Caption ──
  captionWrap: {
    paddingHorizontal: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 4,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
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

  // ── Post Owner Options Modal ──
  optionsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  optionsSheet: {
    backgroundColor: '#161616',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  optionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  deleteOptionText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelOptionText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
});
