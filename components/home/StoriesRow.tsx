import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/userStore';
import Skeleton from '../ui/Skeleton';

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

      // 1. Fetch user's own stories and filter expiration in JS safely
      const { data: myData, error: myError } = await supabase
        .from('stories')
        .select('id, uid, username, avatar_url, created_at, expires_at')
        .eq('uid', user.uid);
        
      if (myError) {
        console.warn('myError', myError);
        setErrorMsg(prev => (prev ? prev + '\n' : '') + 'DB Error (own): ' + myError.message);
      }
      
      if (myData) {
        const nowTime = new Date().getTime();
        const validMyStories = myData.filter(s => {
          if (!s.expires_at) return true;
          return new Date(s.expires_at).getTime() > nowTime;
        });
        fetchedStories = [...validMyStories];
      }

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
          const { data: tStories, error: tError } = await supabase
            .from('stories')
            .select('id, uid, username, avatar_url, created_at, expires_at')
            .in('uid', traineeUids);
            
          if (tError) setErrorMsg(prev => (prev ? prev + '\n' : '') + 'DB Error (tStories): ' + tError.message);
            
          if (tStories) {
            const nowTime = new Date().getTime();
            const validTStories = tStories.filter(s => {
              if (!s.expires_at) return true;
              return new Date(s.expires_at).getTime() > nowTime;
            });
            fetchedStories = [...fetchedStories, ...validTStories];
          }
        }
      } else {
        // Trainee sees: Coaches in their city (Max 20)
        const { data: coaches } = await supabase.from('coach_profiles').select('uid');
        const coachUids = (coaches || []).map(c => c.uid);
        
        if (coachUids.length > 0) {
          const userCity = user.city || null;
          
          // Fetch recent stories from coaches (up to 50 to allow for filtering)
          const { data: cStories, error: cError } = await supabase
            .from('stories')
            .select('id, uid, username, avatar_url, created_at, city, expires_at')
            .in('uid', coachUids)
            .order('created_at', { ascending: false })
            .limit(50);
            
          if (cError) setErrorMsg(prev => (prev ? prev + '\n' : '') + 'DB Error (cStories): ' + cError.message);
            
          if (cStories) {
            const nowTime = new Date().getTime();
            const validStories = cStories.filter(story => {
              // 1. Check expiration
              const isExpired = story.expires_at ? new Date(story.expires_at).getTime() < nowTime : false;
              if (isExpired) return false;
              
              // 2. Check city match (allow if story has no city, or matches user's city)
              if (userCity && story.city && story.city !== userCity) return false;
              
              return true;
            });
            
            // Take top 20 after filtering
            fetchedStories = [...fetchedStories, ...validStories.slice(0, 20)];
          }
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
    } catch (e: any) {
      setErrorMsg('Top level error: ' + (e.message || e.toString()));
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
        <View style={[styles.loadingRow, { flexDirection: 'row', paddingHorizontal: 12, gap: 16 }]}>
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={{ alignItems: 'center', gap: 6 }}>
              <Skeleton width={64} height={64} borderRadius={32} />
              <Skeleton width={48} height={10} borderRadius={4} />
            </View>
          ))}
        </View>
      ) : (
        <>
          {errorMsg && (
             <Text style={{color: 'red', fontSize: 12, paddingLeft: 10, paddingRight: 10, marginBottom: 10}}>
               {errorMsg}
             </Text>
          )}
          <FlatList
            data={storyGroups}
            renderItem={renderItem}
            keyExtractor={(item) => item.uid}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        </>
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
