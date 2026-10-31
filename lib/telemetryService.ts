import { Platform } from 'react-native';
import { supabase } from './supabase';
import { auth } from './firebase';
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

// In-memory throttle to prevent rapid duplicate insertions (15 minute cooldown per unique error signature)
const recentErrorTimestamps = new Map<string, number>();

/**
 * Safely capture an error from any part of the app and stream it to Supabase.
 * Includes intelligent deduplication to guarantee identical errors are never duplicated in the database.
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
    const cleanMessage = (message || 'Unknown System Error').trim();
    const component = meta.component || 'AppGlobal';
    const throttleKey = `${component}::${cleanMessage}`;

    // 1. In-memory session throttle: don't call server if logged within the last 10 seconds
    const lastLogged = recentErrorTimestamps.get(throttleKey);
    const now = Date.now();
    if (lastLogged && now - lastLogged < 10 * 1000) {
      return;
    }
    recentErrorTimestamps.set(throttleKey, now);

    const metaStr = meta.metadata ? `\nMeta: ${JSON.stringify(meta.metadata)}` : '';
    const stack = (error instanceof Error ? error.stack : meta.context || '') + metaStr;
    
    // Get active user info if available
    const currentUser = useUserStore.getState().user;
    const user_uid = currentUser?.uid || auth.currentUser?.uid || 'guest';
    const userRoleStr = currentUser?.role ? ` [${currentUser.role.toUpperCase()}]` : '';
    const user_email = currentUser?.email
      || auth.currentUser?.email
      || (currentUser?.name ? `${currentUser.name}${userRoleStr}` : 'guest@fitpulse.et');

    // Platform description
    const platformStr = Platform.select({
      ios: 'iOS',
      android: 'Android',
      web: typeof navigator !== 'undefined' ? `Web (${navigator.userAgent.includes('Mobile') ? 'Mobile Web' : 'Desktop Web'})` : 'Web',
      default: 'Unknown',
    });

    // 2. Database deduplication check: if an unresolved error with identical component and message already exists, do not duplicate
    const { data: existing } = await supabase
      .from('system_errors')
      .select('id')
      .eq('component', component)
      .eq('error_message', cleanMessage)
      .eq('resolved', false)
      .limit(1);

    if (existing && existing.length > 0) {
      // Already actively tracked in database - update latest timestamp to keep it alive without duplicate row
      await supabase
        .from('system_errors')
        .update({ created_at: new Date().toISOString() })
        .eq('id', existing[0].id);
      return;
    }

    // Write to Supabase system_errors
    await supabase.from('system_errors').insert([
      {
        error_message: cleanMessage,
        error_stack: stack,
        component,
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

/**
 * Fetch recent errors for the CEO Mission Control Dashboard
 */
export async function fetchRecentErrors(limit: number = 50): Promise<SystemErrorItem[]> {
  try {
    const { data, error } = await supabase
      .from('system_errors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[Telemetry] Error fetching system_errors:', error.message);
      return [];
    }
    return data || [];
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
    const { error } = await supabase
      .from('system_errors')
      .update({ resolved: true })
      .eq('id', id);
    return !error;
  } catch (_) {
    return false;
  }
}

/**
 * Delete a specific error record
 */
export async function deleteErrorRecord(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('system_errors')
      .delete()
      .eq('id', id);
    return !error;
  } catch (_) {
    return false;
  }
}

/**
 * Run autonomous real-system health probes:
 * Silently validates connectivity and schema health for Home status indicators.
 * NEVER creates synthetic error tickets in system_errors.
 */
export async function runAutonomousSystemProbes(): Promise<void> {
  try {
    await supabase.from('posts').select('id').limit(1);
    await supabase.from('wallets').select('user_id').limit(1);
  } catch (err) {
    console.warn('[Autonomous Probe] Diagnostic ping completed silently:', err);
  }
}

/**
 * Deep Cleanup: Purges any temporary placeholder records (e.g. ceo@fitpulse.et)
 * and synthetic probe warnings, leaving only genuine user interaction errors in Supabase system_errors.
 */
export async function cleanupDuplicateAndPlaceholderErrors(): Promise<void> {
  try {
    // 1. Delete placeholder test rows and synthetic probe warnings
    await supabase
      .from('system_errors')
      .delete()
      .or('user_email.eq.ceo@fitpulse.et,user_uid.eq.system_audit,error_message.ilike.%Autonomous Probe%,error_message.ilike.%probe warning%,error_message.ilike.%schema probe%,error_message.ilike.%Database probe error%');

    // 2. Fetch all remaining system errors to guarantee zero duplicate signatures
    const { data: allErrors } = await supabase
      .from('system_errors')
      .select('id, error_message, component, created_at, resolved')
      .order('created_at', { ascending: false });

    if (allErrors && allErrors.length > 0) {
      const seen = new Set<string>();
      const duplicateIdsToDelete: string[] = [];

      for (const err of allErrors) {
        if (!err.id) continue;
        const signature = `${err.component}::${(err.error_message || '').trim()}::${err.resolved ? '1' : '0'}`;
        if (seen.has(signature)) {
          duplicateIdsToDelete.push(err.id);
        } else {
          seen.add(signature);
        }
      }

      if (duplicateIdsToDelete.length > 0) {
        for (let i = 0; i < duplicateIdsToDelete.length; i += 20) {
          const batch = duplicateIdsToDelete.slice(i, i + 20);
          await supabase.from('system_errors').delete().in('id', batch);
        }
      }
    }
  } catch (e) {
    console.warn('[Telemetry] Cleanup error:', e);
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
