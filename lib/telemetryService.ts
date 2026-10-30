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
 * Run autonomous real-system probes:
 * Automatically scans and tests live components. When a real anomaly or failure
 * is detected, it automatically captures and logs it to Supabase system_errors without manual intervention.
 */
export async function runAutonomousSystemProbes(): Promise<void> {
  try {
    // 1. Probe Database & Social Cascades
    const { error: postError } = await supabase.from('posts').select('id').limit(1);
    if (postError && postError.code !== 'PGRST116') {
      await captureSystemError(`Database probe error in posts table: ${postError.message}`, {
        component: 'CommunityPostDelete',
        severity: 'warning',
      });
    }

    // 2. Probe Wallets table
    const { error: walletError } = await supabase.from('wallets').select('uid').limit(1);
    if (walletError && walletError.code !== 'PGRST116') {
      await captureSystemError(`Wallet schema probe warning: ${walletError.message}`, {
        component: 'MarketplaceMarketingAI',
        severity: 'warning',
      });
    }

    // 3. Probe Chapa Payment Config
    if (typeof process !== 'undefined' && process.env) {
      const hasChapa = !!(process.env.EXPO_PUBLIC_CHAPA_PUBLIC_KEY || process.env.CHAPA_SECRET_KEY);
      if (!hasChapa) {
        // Auto-detect missing payment gateway configuration
        const existingErrors = await fetchRecentErrors(10);
        const alreadyLogged = existingErrors.some((e) => e.error_message?.includes('Chapa API keys not detected'));
        if (!alreadyLogged) {
          await captureSystemError('Autonomous Probe: Chapa API keys not detected in environment. Live payments may fail.', {
            component: 'MarketplaceMarketingAI',
            severity: 'warning',
          });
        }
      }
    }
  } catch (err) {
    console.warn('[Autonomous Probe] Diagnostic scan encountered error:', err);
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
