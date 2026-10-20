import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView, Platform, Share, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
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
          style={styles.sheet}
          activeOpacity={1}
          onPress={e => e.stopPropagation()}
        >
          {/* Sheet Handle */}
          <View style={styles.handle} />

          {/* Title Header */}
          <View style={styles.headerRow}>
            <Text style={styles.sheetTitle}>Share to</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Post preview thumbnail row */}
          <View style={styles.postPreviewRow}>
            {post.image_url ? (
              <Image
                source={post.image_url}
                style={styles.previewImage}
                contentFit="cover"
              />
            ) : null}
            <View style={styles.previewInfo}>
              <Text style={styles.previewUser} numberOfLines={1}>
                @{post.username || 'User'}
              </Text>
              <Text style={styles.previewCaption} numberOfLines={1}>
                {post.caption || 'FitPulse Community Post'}
              </Text>
            </View>
          </View>

          {/* ── 1. SEND TO FRIENDS (Chat List) ── */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Send in Chat</Text>

            {loadingContacts ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : contacts.length === 0 ? (
              <View style={styles.emptyContacts}>
                <Ionicons name="chatbubbles-outline" size={24} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No recent chats found</Text>
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
                          style={styles.friendAvatar}
                          contentFit="cover"
                        />
                        {isSent ? (
                          <View style={styles.sentCheckBadge}>
                            <Ionicons name="checkmark" size={12} color="#000" />
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.friendName} numberOfLines={1}>
                        {contact.name.split(' ')[0]}
                      </Text>
                      <View style={[styles.sendPill, isSent && styles.sendPillSent]}>
                        {isSending ? (
                          <ActivityIndicator size={10} color="#000" />
                        ) : (
                          <Text style={[styles.sendPillText, isSent && styles.sendPillTextSent]}>
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
          <View style={styles.divider} />

          {/* ── 2. QUICK ACTIONS (Copy link, Repost, Share via...) ── */}
          <View style={styles.actionsGrid}>
            {/* Repost Action */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleRepostAction}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconWrap, post.isReposted && styles.actionIconWrapActive]}>
                <Ionicons
                  name="repeat-outline"
                  size={24}
                  color={post.isReposted ? Colors.primary : Colors.textPrimary}
                />
              </View>
              <Text style={styles.actionBtnLabel}>
                {post.isReposted ? 'Reposted' : 'Repost'}
              </Text>
            </TouchableOpacity>

            {/* Copy Link Action */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleCopyLink}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconWrap, copied && styles.actionIconWrapActive]}>
                <Ionicons
                  name={copied ? 'checkmark' : 'link-outline'}
                  size={24}
                  color={copied ? Colors.primary : Colors.textPrimary}
                />
              </View>
              <Text style={styles.actionBtnLabel}>
                {copied ? 'Copied!' : 'Copy Link'}
              </Text>
            </TouchableOpacity>

            {/* Share to external apps */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleExternalShare}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name="share-social-outline" size={24} color={Colors.textPrimary} />
              </View>
              <Text style={styles.actionBtnLabel}>Share to...</Text>
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
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  postPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    color: Colors.textPrimary,
  },
  previewCaption: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionWrap: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
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
    color: Colors.textMuted,
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
    backgroundColor: Colors.surfaceLight,
  },
  sentCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  friendName: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 6,
  },
  sendPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 44,
    alignItems: 'center',
  },
  sendPillSent: {
    backgroundColor: Colors.primary,
  },
  sendPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sendPillTextSent: {
    color: '#000',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconWrapActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionBtnLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
