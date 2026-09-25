import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/userStore';

interface StoryGroup {
  uid: string;
  username: string;
  avatar_url: string;
  isOwn: boolean;
  hasStory: boolean;
  viewed: boolean;
}

export default function StoriesRow() {
  const router = useRouter();
  const { user } = useUserStore();
  const { width } = useWindowDimensions();
  const avatarOuter = width < 360 ? 56 : 64;
  const avatarInner = avatarOuter - 8;

  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewedIds, setViewedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      // Get stories from last 24 hours
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('stories')
        .select('uid, username, avatar_url, created_at')
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by uid
      const groupMap: { [uid: string]: StoryGroup } = {};
      (data || []).forEach((s: any) => {
        if (!groupMap[s.uid]) {
          groupMap[s.uid] = {
            uid: s.uid,
            username: s.username,
            avatar_url: s.avatar_url,
            isOwn: s.uid === user.uid,
            hasStory: true,
            viewed: false,
          };
        }
      });

      // Put own story first
      const groups: StoryGroup[] = [];
      
      // Always show "Your Story" bubble
      const ownExists = user.uid && groupMap[user.uid];
      groups.push({
        uid: user.uid || 'own',
        username: user.name || 'You',
        avatar_url: user.uid
          ? `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${user.uid}.jpg`
          : 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150',
        isOwn: true,
        hasStory: !!ownExists,
        viewed: false,
      });

      // Add others
      Object.values(groupMap).forEach((g) => {
        if (!g.isOwn) groups.push(g);
      });

      setStoryGroups(groups);
    } catch (e) {
      console.warn('Stories fetch error:', e);
      // Fallback to mock data look
      setStoryGroups([
        {
          uid: user.uid || 'own',
          username: 'You',
          avatar_url: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150',
          isOwn: true,
          hasStory: false,
          viewed: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryPress = (group: StoryGroup) => {
    if (group.isOwn) {
      // Open add story page
      router.push('/add-story');
    } else if (group.hasStory) {
      // Mark as viewed locally
      setViewedIds(prev => [...prev, group.uid]);
      router.push({ pathname: '/story-viewer', params: { uid: group.uid } });
    }
  };

  const renderItem = ({ item }: { item: StoryGroup }) => {
    const isViewed = viewedIds.includes(item.uid);
    return (
      <TouchableOpacity
        style={styles.storyItem}
        activeOpacity={0.75}
        onPress={() => handleStoryPress(item)}
      >
        <View
          style={[
            styles.storyRing,
            { width: avatarOuter, height: avatarOuter, borderRadius: avatarOuter / 2 },
            !item.hasStory && styles.storyRingEmpty,
            isViewed && styles.storyRingViewed,
            item.isOwn && !item.hasStory && styles.storyRingOwn,
          ]}
        >
          <Image
            source={{ uri: item.avatar_url }}
            style={{
              width: avatarInner,
              height: avatarInner,
              borderRadius: avatarInner / 2,
              backgroundColor: Colors.surface,
            }}
            resizeMode="cover"
          />
          {item.isOwn && (
            <View style={styles.addBadge}>
              <Ionicons name="add" size={12} color={Colors.textPrimary} />
            </View>
          )}
        </View>
        <Text style={styles.storyName} numberOfLines={1}>
          {item.isOwn ? 'Your story' : item.username}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={storyGroups}
          renderItem={renderItem}
          keyExtractor={(item) => item.uid}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12 },
  loadingRow: { height: 90, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 16, gap: 14 },
  storyItem: { alignItems: 'center', gap: 5, maxWidth: 70 },
  storyRing: {
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRingEmpty: { borderColor: Colors.border },
  storyRingViewed: { borderColor: Colors.textMuted },
  storyRingOwn: { borderColor: Colors.borderLight },
  addBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  storyName: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    width: '100%',
  },
});
