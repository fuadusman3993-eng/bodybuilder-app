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
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/colors';

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

export default function StoryViewer() {
  const router = useRouter();
  const { uid, allUids } = useLocalSearchParams<{ uid: string; allUids: string }>();
  const { user } = useUserStore();

  const [userStories, setUserStories] = useState<Story[]>([]);
  const [storyIndex, setStoryIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);

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
        .gt('expires_at', now)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setUserStories(data || []);
    } catch (e) {
      console.warn('Error loading stories:', e);
    } finally {
      setLoading(false);
    }
  };

  // Record view when story changes
  useEffect(() => {
    if (userStories.length > 0 && userStories[storyIndex] && user.uid) {
      supabase.from('story_views').insert({
        story_id: userStories[storyIndex].id,
        viewer_uid: user.uid,
      }).catch(() => {}); // ignore conflicts if already viewed
    }
  }, [storyIndex, userStories]);

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

  if (userStories.length === 0) {
    router.back();
    return null;
  }

  const current = userStories[storyIndex];

  return (
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
          <Image source={{ uri: current.avatar_url }} style={styles.avatar} />
          <View style={styles.headerInfo}>
            <Text style={styles.username}>{current.username}</Text>
            <Text style={styles.timeAgo}>{formatTime(current.created_at)}</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Caption */}
      {current.caption ? (
        <View style={styles.captionWrap}>
          <Text style={styles.caption}>{current.caption}</Text>
        </View>
      ) : null}

      {/* Touch zones */}
      <View style={styles.touchZones}>
        <TouchableWithoutFeedback onPress={goPrev} onLongPress={handleLongPress} onPressOut={handlePressOut}>
          <View style={styles.touchLeft} />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={goNext} onLongPress={handleLongPress} onPressOut={handlePressOut}>
          <View style={styles.touchRight} />
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  topSafe: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  progressBars: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    gap: 4,
  },
  progressTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  headerInfo: { flex: 1 },
  username: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  timeAgo: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1 },
  closeBtn: { padding: 4 },
  captionWrap: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 14,
  },
  caption: { color: '#FFF', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  touchZones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 5,
  },
  touchLeft: { flex: 1 },
  touchRight: { flex: 1 },
});
