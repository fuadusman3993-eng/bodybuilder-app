import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

const STORAGE_KEY = 'fitpulse_recent_user_photos';

/**
 * Fetch real recent photos:
 * - On Native: queries device camera roll via expo-media-library (if permitted),
 *   falling back to locally cached user photos.
 * - On Web: retrieves photos previously snapped/picked on this device from AsyncStorage,
 *   plus recent image messages sent by the user in this conversation.
 * - NEVER returns mock or stock dummy images.
 */
export async function getRealRecentPhotos(conversationId?: string, userUid?: string): Promise<string[]> {
  const photos: string[] = [];

  // 1. Try Native MediaLibrary
  if (Platform.OS !== 'web') {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const res = await MediaLibrary.getAssetsAsync({
          first: 15,
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

  // 3. On Web: if we have few local photos, fetch recent image messages from Supabase chat
  if (Platform.OS === 'web' && photos.length < 5 && conversationId) {
    try {
      const { data } = await supabase
        .from('messages')
        .select('media_url')
        .eq('conversation_id', conversationId)
        .eq('media_type', 'image')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        data.forEach((row) => {
          if (row.media_url && !photos.includes(row.media_url)) {
            photos.push(row.media_url);
          }
        });
      }
    } catch (err) {
      console.warn('[recentPhotosService] Supabase messages image fetch error:', err);
    }
  }

  return photos.slice(0, 15);
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
    current = [uri, ...current.filter((item) => item !== uri)].slice(0, 20);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('[recentPhotosService] saveRealPhoto error:', err);
  }
}

/**
 * Pick real photos from the device file manager / gallery
 */
export async function pickRealPhotosFromDevice(): Promise<string[]> {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;

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
