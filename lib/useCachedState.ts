import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A custom hook that behaves like useState but synchronizes the state with AsyncStorage.
 * It's perfect for local caching (offline mode) of chat messages and conversation lists.
 */
export function useCachedState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(initialValue);
  const [cacheLoaded, setCacheLoaded] = useState(false);

  // Load from cache when mounted
  useEffect(() => {
    if (!key) return;
    let isMounted = true;
    
    AsyncStorage.getItem(key).then(cached => {
      if (isMounted) {
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setState(parsed);
          } catch (e) {
            console.error(`Failed to parse cache for key ${key}:`, e);
          }
        }
        setCacheLoaded(true);
      }
    }).catch(e => {
      console.error(`Failed to read cache for key ${key}:`, e);
      if (isMounted) setCacheLoaded(true);
    });
    
    return () => {
      isMounted = false;
    };
  }, [key]);

  // Save to cache on every update, but filter out optimistic/uploading messages
  const setCachedState = useCallback((valOrUpdater: any) => {
    setState(prev => {
      const next = typeof valOrUpdater === 'function' ? valOrUpdater(prev) : valOrUpdater;
      
      try {
        // If it's an array of messages, do not cache items that are currently uploading
        // to prevent getting a stuck spinner when reloading from cache later.
        const toCache = Array.isArray(next) 
          ? next.filter((item: any) => !item.isUploading) 
          : next;
          
        AsyncStorage.setItem(key, JSON.stringify(toCache)).catch(() => {});
      } catch (e) {
        console.error(`Failed to stringify cache for key ${key}:`, e);
      }
      
      return next;
    });
  }, [key]);

  return [state, setCachedState, cacheLoaded] as const;
}
