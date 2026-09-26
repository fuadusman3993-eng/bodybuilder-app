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
import { useRouter, useFocusEffect } from 'expo-router';
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

  useFocusEffect(
    React.useCallback(() => {
      fetchStories();
    }, [user.uid])
  );

  const fetchStories = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();

      let fetchedStories: any[] = [];

      // 1. Fetch user's own stories
      const { data: myData } = await supabase
        .from('stories')
        .select('id, uid, username, avatar_url, created_at')
        .eq('uid', user.uid)
        .gt('expires_at', now);
      
      if (myData) fetchedStories = [...myData];

      // 2. Role-based Fetching
      if (user.role === 'coach') {
        // Coach sees: Trainees they train
        const { data: trainees } = await supabase
          .from('coach_requests')
          .select('trainee_uid')
          .eq('coach_uid', user.uid)
          .eq('status', 'accepted');
        
        const traineeUids = (trainees || []).map(t => t.trainee_uid);
        if (traineeUids.length > 0) {
          const { data: tStories } = await supabase
            .from('stories')
            .select('id, uid, username, avatar_url, created_at')
            .in('uid', traineeUids)
            .gt('expires_at', now);
          if (tStories) fetchedStories = [...fetchedStories, ...tStories];
        }
      } else {
        // Trainee sees: Coaches in their city (Max 20)
        const { data: coaches } = await supabase.from('coach_profiles').select('uid');
        const coachUids = (coaches || []).map(c => c.uid);
        
        if (coachUids.length > 0) {
          const userCity = user.city || 'Addis Ababa';
          const { data: cStories } = await supabase
            .from('stories')
            .select('id, uid, username, avatar_url, created_at')
            .in('uid', coachUids)
            .eq('city', userCity)
            .gt('expires_at', now)
            .order('created_at', { ascending: false })
            .limit(20); // 20 latest stories from local coaches
          if (cStories) fetchedStories = [...fetchedStories, ...cStories];
        }
      }

      // 3. Fetch Views
      const { data: views } = await supabase
        .from('story_views')
        .select('story_id')
        .eq('viewer_uid', user.uid);
      const viewedSet = new Set((views || []).map(v => v.story_id));

      // 4. Group by User
      const groupMap: { [uid: string]: StoryGroup & { allViewed: boolean } } = {};
      
      // Sort stories old to new, so the "latest" dictates the ring status
      fetchedStories.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      fetchedStories.forEach((s: any) => {
        if (!groupMap[s.uid]) {
          groupMap[s.uid] = {
            uid: s.uid,
            username: s.username,
            avatar_url: s.avatar_url,
            isOwn: s.uid === user.uid,
            hasStory: true,
            viewed: false, // We will evaluate this below
            allViewed: true,
          };
        }
        // If even one story is NOT viewed, the whole ring is NOT viewed
        if (!viewedSet.has(s.id)) {
          groupMap[s.uid].allViewed = false;
        }
      });

      // 5. Build Final List
      const groups: StoryGroup[] = [];
      const ownExists = user.uid && groupMap[user.uid];
      
      // Always show "Your Story" first
      groups.push({
        uid: user.uid || 'own',
        username: user.name || 'You',
        avatar_url: user.uid
          ? `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${user.uid}.jpg`
          : 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150',
        isOwn: true,
        hasStory: !!ownExists,
        viewed: ownExists ? groupMap[user.uid].allViewed : false,
      });

      // Add others
      Object.values(groupMap).forEach((g) => {
        if (!g.isOwn) {
          groups.push({ ...g, viewed: g.allViewed });
        }
      });

      setStoryGroups(groups);
    } catch (e) {
      console.warn('Stories fetch error:', e);
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
    if (group.isOwn && !group.hasStory) {
      router.push('/add-story');
    } else if (group.hasStory) {
      if (!group.isOwn) setViewedIds(prev => [...prev, group.uid]);
      router.push({ pathname: '/story-viewer', params: { uid: group.uid } });
    }
  };

  const StoryAvatar = ({ url }: { url: string }) => {
    const [error, setError] = useState(false);
    const fallback = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150';
    return (
      <Image
        source={{ uri: error ? fallback : url }}
        onError={() => setError(true)}
        style={{
          width: avatarInner,
          height: avatarInner,
          borderRadius: avatarInner / 2,
          backgroundColor: Colors.surface,
        }}
        resizeMode="cover"
      />
    );
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
          <StoryAvatar url={item.avatar_url} />
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
