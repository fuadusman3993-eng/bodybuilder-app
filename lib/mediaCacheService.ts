import { Image } from 'expo-image';

/**
 * Smart Media Cache Service (Telegram-style architecture):
 * Ensures remote media files (Marketplace products, workout demos, coach avatars)
 * are saved directly onto the device's internal storage disk cache, loading in 0ms
 * without network lag, and functioning seamlessly when offline.
 */

/**
 * Pre-buffers a batch of image URLs into the phone's persistent disk cache in the background.
 * Call this when a screen mounts to warm the cache for immediate smooth scrolling.
 */
export async function prefetchMediaBatch(urls: string[]): Promise<void> {
  const validUrls = urls.filter((u) => typeof u === 'string' && u.startsWith('http'));
  if (validUrls.length === 0) return;

  try {
    await Image.prefetch(validUrls, 'memory-disk');
  } catch {
    // Non-blocking background prefetch
  }
}

/**
 * Clears the persistent disk cache if the user requests cache cleanup in Settings.
 */
export async function clearMediaCacheAsync(): Promise<boolean> {
  try {
    return await Image.clearDiskCache();
  } catch {
    return false;
  }
}

/**
 * Clears the in-memory RAM cache.
 */
export async function clearMemoryCacheAsync(): Promise<boolean> {
  try {
    return await Image.clearMemoryCache();
  } catch {
    return false;
  }
}
