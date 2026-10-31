import { Platform } from 'react-native';
import { captureSystemError } from './telemetryService';

// Track active network requests so click observer knows if a background API call was fired
let activeFetchCounter = 0;
let lastNetworkActivityTimestamp = 0;

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  try {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      activeFetchCounter++;
      lastNetworkActivityTimestamp = Date.now();
      try {
        return await originalFetch(...args);
      } finally {
        activeFetchCounter = Math.max(0, activeFetchCounter - 1);
        lastNetworkActivityTimestamp = Date.now();
      }
    };
  } catch (_) {}
}

/**
 * Universal Mock/Incomplete Screen Auditor:
 * Automatically flags screens that rely on static mock data or lack real backend connectivity.
 */
const KNOWN_DUMMY_SCREENS: Record<string, { pageName: string; reason: string }> = {
  gym: { pageName: 'FindGymPage', reason: 'ገጹ በውሸት (Dummy Mock Data) ላይ የሚሰራና ከዳታቤዝ ጋር ያልተገናኘ ነው' },
  workout: { pageName: 'WorkoutPage', reason: 'የዕለታዊ ልምምድ ዝርዝር በ Mock Data ላይ የተመሰረተ ነው' },
};

export function auditScreenRoute(pathname: string) {
  if (!pathname) return;
  const normalized = pathname.toLowerCase();
  for (const [routeKey, info] of Object.entries(KNOWN_DUMMY_SCREENS)) {
    if (normalized.includes(routeKey)) {
      captureSystemError(
        `ተጠቃሚው በ [${info.pageName}] ገብቷል፤ ${info.reason} (Dummy / Incomplete Screen)`,
        {
          component: info.pageName,
          severity: 'warning',
          metadata: { pathname, pageName: info.pageName, type: 'dummy_screen' },
        }
      );
      break;
    }
  }
}

/**
 * Traverses upwards to find whether the clicked target is an interactive element.
 * Uses role, tabindex, focusable attribute, or cursor pointer.
 */
function findInteractiveElement(target: HTMLElement | null): HTMLElement | null {
  let curr: HTMLElement | null = target;
  let depth = 0;
  while (curr && curr !== document.body && depth < 8) {
    const role = curr.getAttribute('role');
    const tabIndex = curr.getAttribute('tabindex');
    const tagName = curr.tagName.toLowerCase();
    
    // Check computed cursor style safely
    let isPointer = false;
    try {
      isPointer = window.getComputedStyle(curr).cursor === 'pointer';
    } catch (_) {}

    if (
      tagName === 'button' ||
      tagName === 'a' ||
      role === 'button' ||
      role === 'link' ||
      role === 'menuitem' ||
      tabIndex === '0' ||
      curr.getAttribute('data-focusable') === 'true' ||
      curr.getAttribute('data-interactive') === 'true' ||
      isPointer
    ) {
      return curr;
    }
    curr = curr.parentElement;
    depth++;
  }
  return null;
}

/**
 * Universal Dead Click & Inactivity Interceptor for Web & Hybrid:
 * Listens to all user clicks globally. If an interactive button/card/element is clicked
 * but produces NO route change, NO network call, and NO DOM state change within 1.0s,
 * it automatically reports a Dead Click to CEO Mission Control.
 */
export function setupUniversalInteractionEngine() {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  let lastProcessedClickTime = 0;

  const handleGlobalInteraction = (event: MouseEvent | TouchEvent) => {
    try {
      const now = Date.now();
      // Debounce rapid tap duplicates within 400ms
      if (now - lastProcessedClickTime < 400) return;
      lastProcessedClickTime = now;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      // Ignore text input fields
      const tag = target.tagName ? target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      // Find nearest genuinely interactive element
      const clickable = findInteractiveElement(target);
      if (!clickable) return;

      // Extract a meaningful label
      const rawText = (clickable.getAttribute('aria-label') || clickable.innerText || clickable.textContent || '').trim();
      const buttonLabel = rawText.replace(/\s+/g, ' ').slice(0, 45);

      // Ignore clicks without label or trivial background
      if (!buttonLabel) return;

      // Ignore interactions inside CEO dashboard itself
      if (window.location.pathname.startsWith('/ceo')) return;

      const startPath = window.location.pathname;
      const initialDomLength = document.body ? document.body.innerHTML.length : 0;
      const startNetworkTime = lastNetworkActivityTimestamp;

      // Determine page name from current pathname
      const pageName = getPageNameFromPath(startPath);

      // Observe for 1000ms
      setTimeout(() => {
        const pathChanged = window.location.pathname !== startPath;
        const networkFired = lastNetworkActivityTimestamp > startNetworkTime || activeFetchCounter > 0;
        const currentDomLength = document.body ? document.body.innerHTML.length : 0;
        const domChanged = Math.abs(currentDomLength - initialDomLength) > 80;

        // If nothing happened at all: No navigation, no network request, no DOM reaction
        if (!pathChanged && !networkFired && !domChanged) {
          captureSystemError(
            `ተጠቃሚው በ [${pageName}] ላይ ['${buttonLabel}'] ነክቶ ምንም ምላሽ አልሰጠም (Dead Click / Unhandled Action)`,
            {
              component: pageName,
              severity: 'warning',
              metadata: {
                buttonLabel,
                pageName,
                pathname: startPath,
                type: 'dead_click',
              },
            }
          );
        }
      }, 1000);
    } catch (_) {}
  };

  document.addEventListener('click', handleGlobalInteraction, true);

  return () => {
    document.removeEventListener('click', handleGlobalInteraction, true);
  };
}

export function getPageNameFromPath(pathname: string): string {
  if (!pathname || pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index') return 'HomePage';
  if (pathname.includes('gym')) return 'FindGymPage';
  if (pathname.includes('workout') || pathname.includes('exercise')) return 'WorkoutPage';
  if (pathname.includes('marketplace')) return 'MarketplacePage';
  if (pathname.includes('community')) return 'CommunityPage';
  if (pathname.includes('chat')) return 'ChatPage';
  if (pathname.includes('profile')) return 'ProfilePage';
  return 'AppClient';
}
