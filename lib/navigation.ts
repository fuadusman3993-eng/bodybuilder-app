import { router } from 'expo-router';
import { Platform } from 'react-native';

/**
 * Universal safe back navigation for web & mobile.
 * Solves the issue where page refresh clears Expo Router's in-memory stack,
 * causing router.back() to silently fail on web.
 *
 * @param fallbackRoute Route to navigate to if no history exists (default: '/(tabs)')
 */
export function safeBack(fallbackRoute: string = '/(tabs)') {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // In web, if there is history in this browser session, go back
      if (window.history.length > 1) {
        window.history.back();
        return;
      }
      // Direct visit in new tab with no previous history -> replace with fallback
      router.replace(fallbackRoute as any);
      return;
    }

    // Native platforms
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackRoute as any);
    }
  } catch (_) {
    try {
      router.replace(fallbackRoute as any);
    } catch {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  }
}
