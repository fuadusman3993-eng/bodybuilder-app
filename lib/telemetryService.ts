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

// In-memory throttle to prevent rapid duplicate insertions (15 minute cooldown per unique error signature)
const recentErrorTimestamps = new Map<string, number>();

/**
 * Safely capture an error from any part of the app and stream it to Supabase.
 * Includes intelligent deduplication to guarantee identical errors are not spammed.
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

    // 1. In-memory session throttle: don't call server if logged within the last 15 minutes
    const lastLogged = recentErrorTimestamps.get(throttleKey);
    const now = Date.now();
    if (lastLogged && now - lastLogged < 15 * 60 * 1000) {
      return;
    }
    recentErrorTimestamps.set(throttleKey, now);

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

    // 2. Database deduplication check: skip if ANY identical record exists (resolved or not)
    //    This prevents re-inserting probe warnings that were already resolved by the CEO
    const { data: existing } = await supabase
      .from('system_errors')
      .select('id, resolved')
      .eq('component', component)
      .eq('error_message', cleanMessage)
      .limit(1);

    if (existing && existing.length > 0) {
      // Record already exists (resolved or unresolved) — skip duplicate row creation
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

// Session-level guard: probes run at most once per browser session
let probesHaveRun = false;

/**
 * Run autonomous real-system probes:
 * Automatically scans and tests live components. Runs only ONCE per session.
 * When a real anomaly is detected it captures it to Supabase — with full deduplication.
 */
export async function runAutonomousSystemProbes(): Promise<void> {
  // Guarantee probes run at most once per page load/session
  if (probesHaveRun) return;
  probesHaveRun = true;

  try {
    // 1. Probe Database & Social Cascades
    const { error: postError } = await supabase.from('posts').select('id').limit(1);
    if (postError && postError.code !== 'PGRST116') {
      await captureSystemError(`Database probe error in posts table: ${postError.message}`, {
        component: 'CommunityPostDelete',
        severity: 'warning',
      });
    }

    // 2. Probe Wallets table (using actual column user_id)
    const { error: walletError } = await supabase.from('wallets').select('user_id').limit(1);
    if (walletError && walletError.code !== 'PGRST116') {
      await captureSystemError(`Wallet schema probe warning: ${walletError.message}`, {
        component: 'MarketplaceMarketingAI',
        severity: 'warning',
      });
    }

    // NOTE: Chapa API key detection is NOT run here — process.env is unavailable in the
    // browser bundle. Chapa configuration errors are captured server-side via the webhook route.
  } catch (err) {
    console.warn('[Autonomous Probe] Diagnostic scan encountered error:', err);
  }
}

/**
 * Cleanup any temporary test placeholder records (e.g. ceo@fitpulse.et)
 * and deduplicate existing duplicate records in Supabase system_errors.
 * Also removes stale Chapa probe warnings (false alarms from browser-side env check).
 */
export async function cleanupDuplicateAndPlaceholderErrors(): Promise<void> {
  try {
    // 1. Delete placeholder test rows AND stale Chapa false-alarm warnings
    await supabase
      .from('system_errors')
      .delete()
      .or('user_email.eq.ceo@fitpulse.et,user_uid.eq.system_audit');

    // 2. Remove all Chapa probe false-alarm records (browser env check always fails)
    await supabase
      .from('system_errors')
      .delete()
      .ilike('error_message', '%Chapa API keys not detected%');

    // 3. Fetch all system errors to check for remaining duplicates
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
