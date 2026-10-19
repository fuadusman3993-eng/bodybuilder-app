import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useUserStore, UserTier } from '../../store/userStore';
import { auth } from '../../lib/firebase';
import Skeleton from '../ui/Skeleton';

interface StoryGroup {
  uid: string;
  username: string;
  avatar_url: string;
  isOwn: boolean;
  hasStory: boolean;
  viewed: boolean;
}

let cachedStories: StoryGroup[] = [];
let cachedViewedIds: string[] = [];
let cachedUserUid: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — no re-fetch within this window

export default function StoriesRow() {
  const router = useRouter();
  const { user } = useUserStore();
  const { width } = useWindowDimensions();
  const avatarOuter = width < 360 ? 56 : 64;
  const avatarInner = avatarOuter - 8;

  const activeUid = user.uid || auth.currentUser?.uid;
  const ownAvatar = user.avatar || (activeUid ? `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${activeUid}.jpg` : null);
  const fallbackAvatar = ownAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=10B981&color=fff&size=150`;

  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>(cachedStories);
  const [loading, setLoading] = useState(cachedStories.length === 0 || cachedUserUid !== activeUid);
  const [viewedIds, setViewedIds] = useState<string[]>(cachedViewedIds);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      if (user.tier === UserTier.GUEST) {
        setStoryGroups([{
          uid: 'ai_coach',
          username: 'FitPulse AI',
          avatar_url: 'ai_coach',
          isOwn: false,
          hasStory: true,
          viewed: viewedIds.includes('ai_coach'),
        }]);
        setLoading(false);
        return;
      }

      const currentUid = user.uid || auth.currentUser?.uid;
      const now = Date.now();
      // Only reuse cache if it belongs to THIS user and is fresh
      if (
        currentUid &&
        cachedUserUid === currentUid &&
        cachedStories.length > 0 &&
        (now - cacheTimestamp) < CACHE_TTL_MS
      ) {
        setStoryGroups(cachedStories);
        setLoading(false);
        return;
      }
      fetchStories();
    }, [user.uid, user.avatar, user.role, user.tier])
  );

  const fetchStories = async () => {
    try {
      if (user.tier === UserTier.GUEST) {
        setStoryGroups([{
          uid: 'ai_coach',
          username: 'FitPulse AI',
          avatar_url: 'ai_coach',
          isOwn: false,
          hasStory: true,
          viewed: viewedIds.includes('ai_coach'),
        }]);
        setLoading(false);
        return;
      }
      const activeUid = user.uid || auth.currentUser?.uid;
      if (cachedStories.length === 0 || cachedUserUid !== activeUid) setLoading(true);
      const now = new Date().toISOString();

      let fetchedStories: any[] = [];

      // 1. Fetch user's own stories and filter expiration in JS safely
      if (activeUid) {
        const { data: myData, error: myError } = await supabase
          .from('stories')
          .select('id, uid, username, avatar_url, created_at, expires_at')
          .eq('uid', activeUid);
          
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
      }

      // 2. Role-based Fetching
      if (user.role === 'coach') {
        // Coach sees: Trainees they train
        const { data: trainees } = await supabase
          .from('coach_requests')
          .select('trainee_uid')
          .eq('coach_uid', activeUid)
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
        .eq('viewer_uid', activeUid);
      const viewedSet = new Set((views || []).map(v => v.story_id));

      // 4. Group by User
      const groupMap: { [uid: string]: StoryGroup & { allViewed: boolean } } = {};
      
      // Sort stories old to new, so the "latest" dictates the ring status
      fetchedStories.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      fetchedStories.forEach((s: any) => {
        const isThisUser = activeUid ? s.uid === activeUid : false;
        if (!groupMap[s.uid]) {
          groupMap[s.uid] = {
            uid: s.uid,
            username: s.username,
            avatar_url: s.avatar_url,
            isOwn: isThisUser,
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
      const ownGroup = activeUid ? groupMap[activeUid] : null;
      const ownExists = !!ownGroup;
      const myAvatar = user.avatar || (activeUid ? `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${activeUid}.jpg` : fallbackAvatar);

      // Always show "Your Story" first
      groups.push({
        uid: activeUid || 'own',
        username: user.name || 'You',
        avatar_url: myAvatar,
        isOwn: true,
        hasStory: ownExists,
        viewed: ownExists ? ownGroup.allViewed : false,
      });

      // Add other users' stories (filter out own UID to never duplicate)
      Object.values(groupMap).forEach((g) => {
        if (g.uid !== activeUid && !g.isOwn) {
          groups.push({ ...g, viewed: g.allViewed });
        }
      });

      cachedStories = groups;
      cachedUserUid = activeUid || null;
      cacheTimestamp = Date.now();
      setStoryGroups(groups);
    } catch (e: any) {
      setErrorMsg('Top level error: ' + (e.message || e.toString()));
      console.warn('Stories fetch error:', e);
      const activeUid = user.uid || auth.currentUser?.uid;
      const myAvatar = user.avatar || (activeUid ? `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${activeUid}.jpg` : fallbackAvatar);
      const fallbackGroup = [
        {
          uid: activeUid || 'own',
          username: user.name || 'You',
          avatar_url: myAvatar,
          isOwn: true,
          hasStory: false,
          viewed: false,
        },
      ];
      cachedStories = fallbackGroup;
      cachedUserUid = activeUid || null;
      setStoryGroups(fallbackGroup);
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

  const storyFallback = 'https://ui-avatars.com/api/?name=User&background=2A3241&color=fff&size=150';

  const StoryAvatar = ({ url }: { url: string }) => {
    if (url === 'ai_coach') {
      return (
        <View
          style={{
            width: avatarInner,
            height: avatarInner,
            borderRadius: avatarInner / 2,
            backgroundColor: '#064E3B',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="sparkles" size={avatarInner * 0.48} color={Colors.primary} />
        </View>
      );
    }
    return (
      <Image
        source={url || storyFallback}
        placeholder={storyFallback}
        cachePolicy="memory-disk"
        contentFit="cover"
        style={{
          width: avatarInner,
          height: avatarInner,
          borderRadius: avatarInner / 2,
          backgroundColor: Colors.surface,
        }}
      />
    );
  };

  const renderItem = ({ item }: { item: StoryGroup }) => {
    const isViewed = viewedIds.includes(item.uid);
    const isAiCoach = item.uid === 'ai_coach';
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
            isAiCoach && { borderColor: Colors.primary, shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 6 },
          ]}
        >
          <StoryAvatar url={item.avatar_url} />
          {item.isOwn && (
            <View style={styles.addBadge}>
              <Ionicons name="add" size={12} color={Colors.textPrimary} />
            </View>
          )}
          {isAiCoach && (
            <View style={[styles.addBadge, { backgroundColor: Colors.primary }]}>
              <Ionicons name="flash" size={10} color="#000" />
            </View>
          )}
        </View>
        <Text style={[styles.storyName, isAiCoach && { color: Colors.primary, fontWeight: '700' }]} numberOfLines={1}>
          {item.isOwn ? 'Your story' : item.username}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        user.tier === UserTier.GUEST ? (
          <View style={[styles.loadingRow, { flexDirection: 'row', paddingHorizontal: 16 }]}>
            <View style={styles.storyItem}>
              <Skeleton width={avatarOuter} height={avatarOuter} borderRadius={avatarOuter / 2} />
              <Skeleton width={56} height={10} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
          </View>
        ) : (
          <View style={[styles.loadingRow, { flexDirection: 'row', paddingHorizontal: 16, gap: 14 }]}>
            {/* "Your story" — real button, loads immediately */}
            <View style={styles.storyItem}>
              <View style={[
                styles.storyRing,
                { width: avatarOuter, height: avatarOuter, borderRadius: avatarOuter / 2 },
                styles.storyRingEmpty,
                styles.storyRingOwn,
              ]}>
                <Image
                  source={ownAvatar || fallbackAvatar}
                  placeholder={fallbackAvatar}
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  style={{ width: avatarInner, height: avatarInner, borderRadius: avatarInner / 2, backgroundColor: Colors.surface }}
                />
                <View style={styles.addBadge}>
                  <Ionicons name="add" size={12} color={Colors.textPrimary} />
                </View>
              </View>
              <Text style={styles.storyName} numberOfLines={1}>Your story</Text>
            </View>

            {/* 4 skeleton placeholders — same size/spacing as real story items */}
            {[1, 2, 3, 4].map(i => (
              <View key={i} style={styles.storyItem}>
                <Skeleton width={avatarOuter} height={avatarOuter} borderRadius={avatarOuter / 2} />
                <Skeleton width={44} height={10} borderRadius={4} style={{ marginTop: 1 }} />
              </View>
            ))}
          </View>
        )
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
