import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView, Platform, Share, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/themeStore';
import { RealPost } from './PostCard';
import { useUserStore } from '../../store/userStore';
import { supabase } from '../../lib/supabase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Contact {
  uid: string;
  name: string;
  avatar: string;
  conversationId?: string;
}

interface SharePostModalProps {
  visible: boolean;
  onClose: () => void;
  post: RealPost;
  onToggleRepost?: (postId: string) => void;
}

export default function SharePostModal({
  visible,
  onClose,
  post,
  onToggleRepost,
}: SharePostModalProps) {
  const { user } = useUserStore();
  const { colors } = useTheme();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [sendingMap, setSendingMap] = useState<Record<string, boolean>>({});
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible && user?.uid) {
      loadContacts();
    }
  }, [visible, user?.uid]);

  const loadContacts = async () => {
    if (!user?.uid) return;
    setLoadingContacts(true);
    try {
      // 1. Fetch from active conversations
      const { data: convs } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_uid.eq.${user.uid},user2_uid.eq.${user.uid}`)
        .order('last_message_at', { ascending: false })
        .limit(10);

      const contactList: Contact[] = [];
      const seenUids = new Set<string>();

      if (convs && convs.length > 0) {
        for (const c of convs) {
          const otherUid = c.user1_uid === user.uid ? c.user2_uid : c.user1_uid;
          if (seenUids.has(otherUid)) continue;
          seenUids.add(otherUid);

          try {
            const snap = await getDoc(doc(db, 'users', otherUid));
            if (snap.exists()) {
              const d = snap.data();
              contactList.push({
                uid: otherUid,
                name: d.name || d.displayName || d.username || 'User',
                avatar: d.avatar || d.photoURL || '',
                conversationId: c.id,
              });
            }
          } catch (_) {}
        }
      }

      // 2. If conversations are few, fetch from following
      if (contactList.length < 5) {
        const { data: follows } = await supabase
          .from('follows')
          .select('following_uid')
          .eq('follower_uid', user.uid)
          .limit(8);

        if (follows) {
          for (const f of follows) {
            if (seenUids.has(f.following_uid)) continue;
            seenUids.add(f.following_uid);
            try {
              const snap = await getDoc(doc(db, 'users', f.following_uid));
              if (snap.exists()) {
                const d = snap.data();
                contactList.push({
                  uid: f.following_uid,
                  name: d.name || d.displayName || d.username || 'User',
                  avatar: d.avatar || d.photoURL || '',
                });
              }
            } catch (_) {}
          }
        }
      }

      setContacts(contactList);
    } catch (e) {
      console.warn('Error loading share contacts:', e);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleSendToFriend = async (contact: Contact) => {
    if (!user?.uid || sendingMap[contact.uid] || sentMap[contact.uid]) return;

    setSendingMap(prev => ({ ...prev, [contact.uid]: true }));
    try {
      let convId = contact.conversationId;

      if (!convId) {
        const u1 = user.uid < contact.uid ? user.uid : contact.uid;
        const u2 = user.uid < contact.uid ? contact.uid : user.uid;

        const { data: existing } = await supabase
          .from('conversations')
          .select('id')
          .eq('user1_uid', u1)
          .eq('user2_uid', u2)
          .single();

        if (existing?.id) {
          convId = existing.id;
        } else {
          const { data: created } = await supabase
            .from('conversations')
            .insert({ user1_uid: u1, user2_uid: u2 })
            .select('id')
            .single();
          convId = created?.id;
        }
      }

      if (convId) {
        const shareMsg = `Shared a post from @${post.username || 'user'}`;
        await supabase.from('messages').insert({
          conversation_id: convId,
          sender_uid: user.uid,
          text: `📷 ${shareMsg}: "${post.caption || 'FitPulse Post'}"`,
          media_url: post.image_url,
          type: post.image_url ? 'image' : 'text',
          is_read: false,
        });

        await supabase.from('conversations').update({
          last_message: `📷 ${shareMsg}`,
          last_message_at: new Date().toISOString(),
        }).eq('id', convId);

        setSentMap(prev => ({ ...prev, [contact.uid]: true }));
      }
    } catch (e) {
      console.warn('Failed to send post to friend:', e);
    } finally {
      setSendingMap(prev => ({ ...prev, [contact.uid]: false }));
    }
  };

  const handleCopyLink = async () => {
    const postUrl = `https://bodybuilder-app-phi.vercel.app`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(postUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  const handleExternalShare = async () => {
    const postUrl = `https://bodybuilder-app-phi.vercel.app`;
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({
            title: `FitPulse Post by ${post.username}`,
            text: post.caption || 'Check out this workout post on FitPulse!',
            url: postUrl,
          });
        } else {
          handleCopyLink();
        }
      } else {
        await Share.share({
          message: `Check out this workout post by @${post.username} on FitPulse: ${postUrl}`,
        });
      }
    } catch (_) {}
  };

  const handleRepostAction = () => {
    onToggleRepost?.(post.id);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={1}
          onPress={e => e.stopPropagation()}
        >
          {/* Sheet Handle */}
          <View style={[styles.handle, { backgroundColor: colors.borderLight }]} />

          {/* Title Header */}
          <View style={styles.headerRow}>
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Share to</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Post preview thumbnail row */}
          <View style={[styles.postPreviewRow, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
            {post.image_url ? (
              <Image
                source={post.image_url}
                style={styles.previewImage}
                contentFit="cover"
              />
            ) : null}
            <View style={styles.previewInfo}>
              <Text style={[styles.previewUser, { color: colors.textPrimary }]} numberOfLines={1}>
                @{post.username || 'User'}
              </Text>
              <Text style={[styles.previewCaption, { color: colors.textSecondary }]} numberOfLines={1}>
                {post.caption || 'FitPulse Community Post'}
              </Text>
            </View>
          </View>

          {/* ── 1. SEND TO FRIENDS (Chat List) ── */}
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Send in Chat</Text>

            {loadingContacts ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : contacts.length === 0 ? (
              <View style={styles.emptyContacts}>
                <Ionicons name="chatbubbles-outline" size={24} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No recent chats found</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.friendsScroll}
              >
                {contacts.map((contact) => {
                  const isSent = !!sentMap[contact.uid];
                  const isSending = !!sendingMap[contact.uid];
                  const avatarUri = contact.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=10B981&color=fff&size=120`;

                  return (
                    <TouchableOpacity
                      key={contact.uid}
                      style={styles.friendItem}
                      onPress={() => handleSendToFriend(contact)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.friendAvatarWrap}>
                        <Image
                          source={avatarUri}
                          style={[styles.friendAvatar, { backgroundColor: colors.surfaceLight }]}
                          contentFit="cover"
                        />
                        {isSent ? (
                          <View style={[styles.sentCheckBadge, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
                            <Ionicons name="checkmark" size={12} color="#000" />
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.friendName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {contact.name.split(' ')[0]}
                      </Text>
                      <View style={[styles.sendPill, { backgroundColor: isSent ? colors.primary : colors.surfaceLight }]}>
                        {isSending ? (
                          <ActivityIndicator size={10} color="#000" />
                        ) : (
                          <Text style={[styles.sendPillText, { color: isSent ? '#000' : colors.textPrimary }]}>
                            {isSent ? 'Sent' : 'Send'}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* ── 2. QUICK ACTIONS (Copy link, Repost, Share via...) ── */}
          <View style={styles.actionsGrid}>
            {/* Repost Action */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleRepostAction}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIconWrap,
                  { backgroundColor: colors.surfaceLight },
                  post.isReposted && { backgroundColor: colors.primary + '20', borderWidth: 1, borderColor: colors.primary },
                ]}
              >
                <Ionicons
                  name="repeat-outline"
                  size={24}
                  color={post.isReposted ? colors.primary : colors.textPrimary}
                />
              </View>
              <Text style={[styles.actionBtnLabel, { color: colors.textSecondary }]}>
                {post.isReposted ? 'Reposted' : 'Repost'}
              </Text>
            </TouchableOpacity>

            {/* Copy Link Action */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleCopyLink}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIconWrap,
                  { backgroundColor: colors.surfaceLight },
                  copied && { backgroundColor: colors.primary + '20', borderWidth: 1, borderColor: colors.primary },
                ]}
              >
                <Ionicons
                  name={copied ? 'checkmark' : 'link-outline'}
                  size={24}
                  color={copied ? colors.primary : colors.textPrimary}
                />
              </View>
              <Text style={[styles.actionBtnLabel, { color: colors.textSecondary }]}>
                {copied ? 'Copied!' : 'Copy Link'}
              </Text>
            </TouchableOpacity>

            {/* Share to external apps */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleExternalShare}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: colors.surfaceLight }]}>
                <Ionicons name="share-social-outline" size={24} color={colors.textPrimary} />
              </View>
              <Text style={[styles.actionBtnLabel, { color: colors.textSecondary }]}>Share to...</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderWidth: 1,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  postPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  previewImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  previewInfo: {
    marginLeft: 10,
    flex: 1,
  },
  previewUser: {
    fontSize: 13,
    fontWeight: '700',
  },
  previewCaption: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionWrap: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  loadingWrap: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContacts: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  emptyText: {
    fontSize: 13,
  },
  friendsScroll: {
    paddingHorizontal: 16,
    gap: 14,
  },
  friendItem: {
    alignItems: 'center',
    width: 64,
  },
  friendAvatarWrap: {
    position: 'relative',
    marginBottom: 6,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  sentCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  friendName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  sendPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 44,
    alignItems: 'center',
  },
  sendPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 6,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
