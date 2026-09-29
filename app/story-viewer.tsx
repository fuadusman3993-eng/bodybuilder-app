import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
  Animated,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/colors';
import { Modal, ScrollView } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story

interface Story {
  id: string;
  uid: string;
  username: string;
  avatar_url: string;
  image_url: string;
  caption?: string;
  created_at: string;
}

interface ViewerInfo {
  uid: string;
  name: string;
  username: string;
  avatar: string;
}

export default function StoryViewer() {
  const router = useRouter();
  const { uid, allUids } = useLocalSearchParams<{ uid: string; allUids: string }>();
  const { user } = useUserStore();

  const [userStories, setUserStories] = useState<Story[]>([]);
  const [storyIndex, setStoryIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);

  const [showViewers, setShowViewers] = useState(false);
  const [viewersList, setViewersList] = useState<ViewerInfo[]>([]);
  const [likersList, setLikersList] = useState<string[]>([]); // Store UIDs of likers to show heart icon
  const [loadingViewers, setLoadingViewers] = useState(false);

  const progress = useRef(new Animated.Value(0)).current;
  const animation = useRef<Animated.CompositeAnimation | null>(null);

  // Load stories for this user
  useEffect(() => {
    loadStories();
  }, [uid]);

  const loadStories = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('uid', uid)
        .or(`expires_at.gt.${now},expires_at.is.null`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setUserStories(data || []);
    } catch (e) {
      console.warn('Error loading stories:', e);
    } finally {
      setLoading(false);
    }
  };

  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  // Record view and fetch stats when story changes
  useEffect(() => {
    const fetchStats = async () => {
      if (userStories.length > 0 && userStories[storyIndex]) {
        const story = userStories[storyIndex];
        
        if (user.uid) {
          // Record view
          try {
            await supabase.from('story_views').insert({
              story_id: story.id,
              viewer_uid: user.uid,
            });
          } catch (e) {
            // ignore conflicts
          }
        }

        // Fetch likes count
        const { count: likeCount } = await supabase
          .from('story_likes')
          .select('*', { count: 'exact', head: true })
          .eq('story_id', story.id);
        setLikes(likeCount || 0);

        // Fetch views count
        const { count: viewCount } = await supabase
          .from('story_views')
          .select('*', { count: 'exact', head: true })
          .eq('story_id', story.id);
        setViews(viewCount || 0);

        // Check if liked
        if (user.uid) {
          const { data: likedRow } = await supabase
            .from('story_likes')
            .select('id')
            .eq('story_id', story.id)
            .eq('uid', user.uid)
            .single();
          setIsLiked(!!likedRow);
        }
      }
    };
    fetchStats();
  }, [storyIndex, userStories, user.uid]);

  const handleLike = async () => {
    if (!user.uid) return;
    const story = userStories[storyIndex];
    if (isLiked) {
      await supabase.from('story_likes').delete().eq('story_id', story.id).eq('uid', user.uid);
      setIsLiked(false);
      setLikes(l => Math.max(0, l - 1));
    } else {
      await supabase.from('story_likes').insert({ story_id: story.id, uid: user.uid });
      setIsLiked(true);
      setLikes(l => l + 1);
      
      // Notify creator
      if (story.uid !== user.uid) {
        await supabase.from('notifications').insert({
          user_uid: story.uid,
          sender_uid: user.uid,
          type: 'like_story',
          message: `${user.name || 'Someone'} liked your story`,
        });
      }
    }
  };

  const openViewersModal = async () => {
    if (userStories.length === 0 || storyIndex >= userStories.length) return;
    const story = userStories[storyIndex];
    
    setPaused(true);
    animation.current?.stop();
    setShowViewers(true);
    setLoadingViewers(true);

    try {
      // 1. Fetch Viewers UIDs
      const { data: viewData } = await supabase
        .from('story_views')
        .select('viewer_uid')
        .eq('story_id', story.id)
        .order('created_at', { ascending: false });
        
      const viewerUids = viewData?.map(row => row.viewer_uid) || [];
      const allUidsToFetch = Array.from(new Set([...viewerUids]));

      if (allUidsToFetch.length === 0) {
        setViewersList([]);
        setLoadingViewers(false);
        return;
      }

      // Fetch from Firebase
      const fetchedUsers: ViewerInfo[] = [];
      for (const uid of allUidsToFetch) {
        const docSnap = await getDoc(doc(db, 'users', uid));
        if (docSnap.exists()) {
          const d = docSnap.data();
          fetchedUsers.push({
            uid,
            name: d.name || 'Unknown',
            username: d.username || 'user',
            avatar: d.avatar || `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${uid}.jpg`,
          });
        } else {
          fetchedUsers.push({
            uid,
            name: 'User',
            username: 'user',
            avatar: `https://ui-avatars.com/api/?name=User&background=10B981&color=fff`,
          });
        }
      }
      
      setViewersList(fetchedUsers);
    } catch (e) {
      console.warn('Error fetching viewers', e);
    } finally {
      setLoadingViewers(false);
    }
  };

  const closeViewersModal = () => {
    setShowViewers(false);
    setPaused(false);
    startProgress();
  };

  // Start progress animation
  const startProgress = useCallback(() => {
    progress.setValue(0);
    animation.current = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    animation.current.start(({ finished }) => {
      if (finished) goNext();
    });
  }, [storyIndex, userStories.length]);

  useEffect(() => {
    if (!loading && userStories.length > 0) {
      startProgress();
    }
    return () => {
      animation.current?.stop();
    };
  }, [storyIndex, loading, userStories.length]);

  const goNext = () => {
    if (storyIndex < userStories.length - 1) {
      setStoryIndex(i => i + 1);
    } else {
      router.back();
    }
  };

  const goPrev = () => {
    if (storyIndex > 0) {
      setStoryIndex(i => i - 1);
    }
  };

  const handleLongPress = () => {
    setPaused(true);
    animation.current?.stop();
  };

  const handlePressOut = () => {
    setPaused(false);
    startProgress();
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Empty state — show proper UI instead of silent router.back()
  if (userStories.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }]}>
        <Ionicons name="images-outline" size={60} color="#444" />
        <Text style={{ color: '#888', fontSize: 16, marginTop: 16 }}>No stories yet</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 30, backgroundColor: Colors.primary, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 20 }}
        >
          <Text style={{ color: '#000', fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const current = userStories[storyIndex];

  return (
    <>
      <View style={styles.container}>
        <StatusBar hidden />

      {/* Background image */}
      <Image
        source={{ uri: current.image_url }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      {/* Dark overlay */}
      <View style={styles.overlay} />

      {/* Progress bars */}
      <SafeAreaView style={styles.topSafe}>
        <View style={styles.progressBars}>
          {userStories.map((_, i) => (
            <View key={i} style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width:
                      i < storyIndex
                        ? '100%'
                        : i === storyIndex
                        ? progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                        : '0%',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => {
              animation.current?.stop();
              router.push({ pathname: '/user-profile', params: { uid: current.uid } });
            }}
          >
            <Image source={{ uri: current.avatar_url }} style={styles.avatar} />
            <View style={styles.headerInfo}>
              <Text style={styles.username}>{current.username}</Text>
              <Text style={styles.timeAgo}>{formatTime(current.created_at)}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

        {/* Touch zones */}
        <View style={styles.touchZones}>
          <TouchableWithoutFeedback onPress={goPrev} onLongPress={handleLongPress} onPressOut={handlePressOut}>
            <View style={styles.touchLeft} />
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={goNext} onLongPress={handleLongPress} onPressOut={handlePressOut}>
            <View style={styles.touchRight} />
          </TouchableWithoutFeedback>
        </View>

        {/* Footer Details (Caption & Interaction) */}
        <View style={styles.footerContainer}>
          {current.caption ? (
            <View style={styles.captionWrap}>
              <Text style={styles.caption}>{current.caption}</Text>
            </View>
          ) : <View style={styles.captionWrap} />}

          {/* Stats & Actions */}
          <SafeAreaView edges={['bottom']} style={styles.actionArea}>
            {current.uid === user.uid ? (
              // Owner view
              <TouchableOpacity style={styles.ownerStatsRow} onPress={openViewersModal} activeOpacity={0.8}>
                <View style={styles.ownerStat}>
                  <Ionicons name="eye-outline" size={24} color="#FFF" />
                  <Text style={styles.ownerStatText}>{views}</Text>
                </View>
                <View style={{ flex: 1 }} />
                <Ionicons name="chevron-up" size={24} color="#FFF" />
              </TouchableOpacity>
            ) : (
              // Viewer view
              <View style={styles.viewerActionRow}>
                <View style={styles.viewerInputMock}>
                  <Text style={styles.viewerInputText}>Send message...</Text>
                </View>
                <View style={styles.viewerStats}>
                  <View style={styles.viewerStatItem}>
                    <Ionicons name="eye-outline" size={26} color="#FFF" />
                    <Text style={styles.viewerStatText}>{views}</Text>
                  </View>
                </View>
              </View>
            )}
          </SafeAreaView>
        </View>
      </View>

      {/* Viewers Modal */}
      <Modal visible={showViewers} animationType="slide" transparent={true} onRequestClose={closeViewersModal}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Story Views</Text>
              <TouchableOpacity onPress={closeViewersModal} style={styles.modalClose}>
                <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            
            {loadingViewers ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
            ) : viewersList.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Ionicons name="eye-off-outline" size={50} color={Colors.textMuted} />
                <Text style={styles.modalEmptyText}>No views yet</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.modalList}>
                {viewersList.map((viewer) => (
                  <TouchableOpacity 
                    key={viewer.uid} 
                    style={styles.viewerRow}
                    onPress={() => {
                      closeViewersModal();
                      router.push({ pathname: '/user-profile', params: { uid: viewer.uid } });
                    }}
                  >
                    <Image source={{ uri: viewer.avatar }} style={styles.viewerAvatar} />
                    <View style={styles.viewerInfo}>
                      <Text style={styles.viewerName}>{viewer.name}</Text>
                      <Text style={styles.viewerUsername}>@{viewer.username}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  image: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  safeArea: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  progressContainer: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: Platform.OS === 'android' ? 40 : 10, gap: 4 },
  progressTrack: { flex: 1, height: 2.5, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 2 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 10, gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: Colors.primary },
  headerInfo: { flex: 1 },
  username: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  timeAgo: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1 },
  closeBtn: { padding: 4 },
  touchZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 5 },
  touchLeft: { flex: 1 },
  touchRight: { flex: 1 },

  // Footer UI
  footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20 },
  captionWrap: { paddingHorizontal: 16, paddingBottom: 16 },
  caption: { color: '#FFF', fontSize: 15, lineHeight: 22, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  actionArea: { paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 10 : 20, paddingTop: 10, backgroundColor: 'rgba(0,0,0,0.4)' },
  
  ownerStatsRow: { flexDirection: 'row', justifyContent: 'flex-start', gap: 24, paddingVertical: 6 },
  ownerStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ownerStatText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  viewerActionRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  viewerInputMock: { flex: 1, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 16, justifyContent: 'center' },
  viewerInputText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  
  viewerStats: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  viewerStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewerStatText: { color: '#FFF', fontSize: 14, fontWeight: '700', minWidth: 14 },

  // Modal UI
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: SCREEN_H * 0.7, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  modalTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  modalClose: { position: 'absolute', right: 16 },
  modalEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 },
  modalEmptyText: { color: Colors.textMuted, fontSize: 15 },
  modalList: { padding: 16 },
  viewerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  viewerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#333' },
  viewerInfo: { flex: 1, marginLeft: 12 },
  viewerName: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  viewerUsername: { color: Colors.textMuted, fontSize: 13, marginTop: 2 },
});
