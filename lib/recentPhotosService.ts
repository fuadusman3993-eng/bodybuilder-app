import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

const STORAGE_KEY = 'fitpulse_recent_user_photos';

/**
 * Fetch real recent photos:
 * - On Native: queries device camera roll via expo-media-library (up to 50 assets).
 * - On Web: retrieves user photos previously snapped/picked on this device from AsyncStorage,
 *   plus queries Supabase chat messages & posts for real community photos so the user
 *   has a rich horizontal gallery to swipe through (next, next, next).
 * - NEVER returns mock or stock dummy images.
 */
export async function getRealRecentPhotos(conversationId?: string, userUid?: string): Promise<string[]> {
  const photos: string[] = [];

  // 1. Try Native MediaLibrary (up to 50 photos from phone camera roll)
  if (Platform.OS !== 'web') {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const res = await MediaLibrary.getAssetsAsync({
          first: 50,
          mediaType: ['photo'],
          sortBy: [MediaLibrary.SortBy.creationTime],
        });
        if (res.assets && res.assets.length > 0) {
          return res.assets.map((a) => a.uri);
        }
      }
    } catch (err) {
      console.warn('[recentPhotosService] Native MediaLibrary error:', err);
    }
  }

  // 2. Load locally cached user photos from AsyncStorage (both Web and Native fallback)
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: string[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        photos.push(...parsed);
      }
    }
  } catch (err) {
    console.warn('[recentPhotosService] AsyncStorage error:', err);
  }

  // 3. Query Supabase for real images to enrich the horizontal swipe gallery
  try {
    // A. From current conversation messages
    if (conversationId) {
      const { data: convMsgs } = await supabase
        .from('messages')
        .select('media_url')
        .eq('conversation_id', conversationId)
        .eq('media_type', 'image')
        .order('created_at', { ascending: false })
        .limit(20);

      if (convMsgs && convMsgs.length > 0) {
        convMsgs.forEach((row) => {
          if (row.media_url && !photos.includes(row.media_url)) {
            photos.push(row.media_url);
          }
        });
      }
    }

    // B. From all chat messages with image attachments
    const { data: allMsgs } = await supabase
      .from('messages')
      .select('media_url')
      .eq('media_type', 'image')
      .not('media_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(30);

    if (allMsgs && allMsgs.length > 0) {
      allMsgs.forEach((row) => {
        if (row.media_url && !photos.includes(row.media_url)) {
          photos.push(row.media_url);
        }
      });
    }

    // C. From posts / stories with media
    const { data: posts } = await supabase
      .from('posts')
      .select('media_url')
      .not('media_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);

    if (posts && posts.length > 0) {
      posts.forEach((row) => {
        if (row.media_url && !photos.includes(row.media_url)) {
          photos.push(row.media_url);
        }
      });
    }
  } catch (err) {
    console.warn('[recentPhotosService] Supabase image pool error:', err);
  }

  return photos.slice(0, 50);
}

/**
 * Save a newly captured or picked photo to recent device storage
 */
export async function saveRealPhoto(uri: string): Promise<void> {
  if (!uri) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    let current: string[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(current)) current = [];

    // Filter out if duplicate, add to top
    current = [uri, ...current.filter((item) => item !== uri)].slice(0, 50);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('[recentPhotosService] saveRealPhoto error:', err);
  }
}

/**
 * Pick real photos from the device file manager / gallery (supports selecting multiple photos)
 */
export async function pickRealPhotosFromDevice(): Promise<string[]> {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true; // Allow selecting multiple photos at once

      input.onchange = async (e: any) => {
        const files: File[] = Array.from(e.target?.files || []);
        if (files.length === 0) {
          resolve([]);
          return;
        }

        const readPromises = files.map((file) => {
          return new Promise<string>((res) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                res(reader.result);
              } else {
                res(URL.createObjectURL(file));
              }
            };
            reader.onerror = () => res(URL.createObjectURL(file));
            reader.readAsDataURL(file);
          });
        });

        const urls = await Promise.all(readPromises);
        for (const url of urls) {
          await saveRealPhoto(url);
        }
        resolve(urls);
      };

      input.oncancel = () => resolve([]);
      input.click();
    });
  }

  // Native ImagePicker
  try {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
    });

    if (!res.canceled && res.assets && res.assets.length > 0) {
      const uris = res.assets.map((a) => a.uri);
      for (const uri of uris) {
        await saveRealPhoto(uri);
      }
      return uris;
    }
  } catch (err) {
    console.warn('[recentPhotosService] Native pick error:', err);
  }

  return [];
}
