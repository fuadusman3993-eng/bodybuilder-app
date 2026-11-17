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
      // If returning from external payment gateways (Chapa/Telebirr/CBE), avoid rewinding through redirect loops
      if (window.location.search && (window.location.search.includes('chapa') || window.location.search.includes('tx_ref') || window.location.search.includes('status'))) {
        router.replace(fallbackRoute as any);
        return;
      }
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
