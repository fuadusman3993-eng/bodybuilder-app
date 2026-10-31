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
 * Robust interactive element finder:
 * Detects buttons, links, cards, focusable items, and styled actionable elements.
 */
function findClickableOrCardElement(target: HTMLElement | null): { element: HTMLElement; label: string } | null {
  if (!target || target === document.body || target === document.documentElement) return null;

  let curr: HTMLElement | null = target;
  let depth = 0;
  let bestLabel = '';

  while (curr && curr !== document.body && depth < 8) {
    const role = curr.getAttribute('role');
    const tabIndex = curr.getAttribute('tabindex');
    const tagName = curr.tagName.toLowerCase();
    const className = curr.className || '';

    let isPointer = false;
    let hasBorderRadius = false;
    try {
      const computed = window.getComputedStyle(curr);
      isPointer = computed.cursor === 'pointer';
      hasBorderRadius = parseFloat(computed.borderRadius) > 4;
    } catch (_) {}

    const text = (curr.innerText || curr.textContent || '').trim().replace(/\s+/g, ' ');
    if (text && text.length < 50 && !bestLabel) {
      bestLabel = text;
    }

    if (
      tagName === 'button' ||
      tagName === 'a' ||
      role === 'button' ||
      role === 'link' ||
      role === 'menuitem' ||
      tabIndex === '0' ||
      curr.getAttribute('data-focusable') === 'true' ||
      curr.getAttribute('data-interactive') === 'true' ||
      isPointer ||
      hasBorderRadius ||
      (typeof className === 'string' && (className.includes('card') || className.includes('btn') || className.includes('touchable')))
    ) {
      const label = bestLabel || (curr.getAttribute('aria-label') || text).slice(0, 45);
      if (label) {
        return { element: curr, label: label.slice(0, 45) };
      }
    }

    curr = curr.parentElement;
    depth++;
  }

  // Fallback: If clicked element itself has meaningful short text (e.g. gym title, button label)
  const targetText = (target.innerText || target.textContent || '').trim().replace(/\s+/g, ' ');
  if (targetText && targetText.length >= 2 && targetText.length <= 40) {
    return { element: target, label: targetText };
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

  // 1. Immediately audit the initial URL on startup
  setTimeout(() => auditScreenRoute(window.location.pathname), 100);

  // 2. Intercept History pushState and replaceState to catch all client-side navigation
  try {
    const originalPushState = window.history.pushState;
    window.history.pushState = function (...args) {
      const res = originalPushState.apply(this, args);
      setTimeout(() => auditScreenRoute(window.location.pathname), 50);
      return res;
    };

    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = function (...args) {
      const res = originalReplaceState.apply(this, args);
      setTimeout(() => auditScreenRoute(window.location.pathname), 50);
      return res;
    };

    window.addEventListener('popstate', () => {
      setTimeout(() => auditScreenRoute(window.location.pathname), 50);
    });
  } catch (_) {}

  let lastProcessedClickTime = 0;

  const handleGlobalInteraction = (event: MouseEvent | TouchEvent) => {
    try {
      const now = Date.now();
      if (now - lastProcessedClickTime < 400) return;
      lastProcessedClickTime = now;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      const tag = target.tagName ? target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      const found = findClickableOrCardElement(target);
      if (!found) return;

      const buttonLabel = found.label;
      if (!buttonLabel) return;

      if (window.location.pathname.startsWith('/ceo')) return;

      const startPath = window.location.pathname;
      const initialDomLength = document.body ? document.body.innerHTML.length : 0;
      const startNetworkTime = lastNetworkActivityTimestamp;
      const pageName = getPageNameFromPath(startPath);

      setTimeout(() => {
        const pathChanged = window.location.pathname !== startPath;
        const networkFired = lastNetworkActivityTimestamp > startNetworkTime || activeFetchCounter > 0;
        const currentDomLength = document.body ? document.body.innerHTML.length : 0;
        const domChanged = Math.abs(currentDomLength - initialDomLength) > 80;

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
