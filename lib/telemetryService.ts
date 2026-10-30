import { Platform } from 'react-native';
import { supabase } from './supabase';
import { useUserStore } from '../store/userStore';

export interface SystemErrorItem {
  id?: string;
  created_at?: string;
  error_message: string;
  error_stack?: string;
  component?: string;
  platform?: string;
  user_uid?: string;
  user_email?: string;
  severity?: 'critical' | 'warning' | 'info';
  resolved?: boolean;
}

/**
 * Safely capture an error from any part of the app and stream it to Supabase.
 * Designed to never crash or throw, even if logging fails.
 */
export async function captureSystemError(
  error: any,
  meta: {
    component?: string;
    severity?: 'critical' | 'warning' | 'info';
    context?: string;
    metadata?: Record<string, any>;
  } = {}
): Promise<void> {
  try {
    const message = error instanceof Error ? error.message : typeof error === 'string' ? error : JSON.stringify(error);
    const metaStr = meta.metadata ? `\nMeta: ${JSON.stringify(meta.metadata)}` : '';
    const stack = (error instanceof Error ? error.stack : meta.context || '') + metaStr;
    
    // Get active user info if available
    const currentUser = useUserStore.getState().user;
    const user_uid = currentUser?.uid || 'anonymous';
    const user_email = currentUser?.email || 'unknown';

    // Platform description
    const platformStr = Platform.select({
      ios: 'iOS',
      android: 'Android',
      web: typeof navigator !== 'undefined' ? `Web (${navigator.userAgent.includes('Mobile') ? 'Mobile Web' : 'Desktop Web'})` : 'Web',
      default: 'Unknown',
    });

    // Write to Supabase system_errors
    await supabase.from('system_errors').insert([
      {
        error_message: message || 'Unknown System Error',
        error_stack: stack,
        component: meta.component || 'AppGlobal',
        platform: platformStr,
        user_uid,
        user_email,
        severity: meta.severity || 'warning',
        resolved: false,
      },
    ]);
  } catch (err) {
    // Fail-safe: telemetry logging should never interfere with user execution
    console.warn('[Telemetry] Error logging failed silently:', err);
  }
}

export const CORE_SYSTEM_AUDIT_ISSUES: Omit<SystemErrorItem, 'id'>[] = [
  {
    error_message: 'Workout Watchdog: Verify exercise timer progression, rest recovery & celebration modal on mobile web',
    component: 'WorkoutExercisePlayer',
    platform: 'Mobile & Web',
    user_uid: 'system_audit',
    user_email: 'ceo@fitpulse.et',
    severity: 'critical',
    resolved: false,
  },
  {
    error_message: 'Marketplace Wallet: Chapa payment gateway coin crediting & /wallet coin reload audit',
    component: 'MarketplaceMarketingAI',
    platform: 'Web & Mobile',
    user_uid: 'system_audit',
    user_email: 'ceo@fitpulse.et',
    severity: 'warning',
    resolved: false,
  },
  {
    error_message: 'Chat & Video Engine: Verify WebRTC signaling, Profile view & Block modal persistence',
    component: 'ChatVoicePlayer',
    platform: 'Mobile & Web',
    user_uid: 'system_audit',
    user_email: 'ceo@fitpulse.et',
    severity: 'warning',
    resolved: false,
  },
  {
    error_message: 'Community Moderation: Verify cascade deletion of reposts/likes & CEO delete authority',
    component: 'CommunityPostDelete',
    platform: 'Mobile & Web',
    user_uid: 'system_audit',
    user_email: 'ceo@fitpulse.et',
    severity: 'warning',
    resolved: false,
  },
  {
    error_message: 'App Localization: Amharic language persistence & offline workout cache verification',
    component: 'HomeDashboard',
    platform: 'Mobile & Web',
    user_uid: 'system_audit',
    user_email: 'ceo@fitpulse.et',
    severity: 'warning',
    resolved: false,
  },
];

/**
 * Fetch recent errors for the CEO Mission Control Dashboard
 */
export async function fetchRecentErrors(limit: number = 50): Promise<SystemErrorItem[]> {
  try {
    let list: SystemErrorItem[] = [];
    try {
      const { data, error } = await supabase
        .from('system_errors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        list = data;
      }
    } catch (_) {}

    // Check if system audit issues exist in DB list
    const hasAuditIssues = list.some((item) => item.user_uid === 'system_audit');
    if (!hasAuditIssues) {
      // Attempt to persist them to Supabase so they are visible across all sessions
      try {
        const { data: inserted } = await supabase
          .from('system_errors')
          .insert(CORE_SYSTEM_AUDIT_ISSUES)
          .select();
        if (inserted && inserted.length > 0) {
          list = [...inserted, ...list];
        } else {
          throw new Error('No items returned');
        }
      } catch (_) {
        // Fallback local items with predictable keys
        const localAudit: SystemErrorItem[] = CORE_SYSTEM_AUDIT_ISSUES.map((issue, idx) => ({
          ...issue,
          id: `audit-${issue.component?.toLowerCase() || idx}`,
          created_at: new Date(Date.now() - idx * 120000).toISOString(),
        }));
        list = [...localAudit, ...list];
      }
    }

    // Apply any local resolved or deleted overrides if running on web
    if (typeof window !== 'undefined' && window.localStorage) {
      list = list
        .filter((item) => !item.id || window.localStorage.getItem(`deleted_issue_${item.id}`) !== 'true')
        .map((item) => {
          if (item.id && window.localStorage.getItem(`resolved_issue_${item.id}`) === 'true') {
            return { ...item, resolved: true };
          }
          return item;
        });
    }

    return list;
  } catch (e) {
    console.warn('[Telemetry] Failed to load errors:', e);
    return [];
  }
}

/**
 * Mark an error as resolved
 */
export async function resolveError(id: string): Promise<boolean> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`resolved_issue_${id}`, 'true');
    }
    const { error } = await supabase
      .from('system_errors')
      .update({ resolved: true })
      .eq('id', id);
    return !error;
  } catch (_) {
    return true;
  }
}

/**
 * Delete a specific error record
 */
export async function deleteErrorRecord(id: string): Promise<boolean> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`deleted_issue_${id}`, 'true');
    }
    const { error } = await supabase
      .from('system_errors')
      .delete()
      .eq('id', id);
    return !error;
  } catch (_) {
    return true;
  }
}

/**
 * Clear all resolved errors
 */
export async function clearResolvedErrors(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('system_errors')
      .delete()
      .eq('resolved', true);
    return !error;
  } catch (_) {
    return false;
  }
}
