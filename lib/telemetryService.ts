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
