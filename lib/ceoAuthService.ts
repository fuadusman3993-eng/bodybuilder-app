import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const CEO_SESSION_KEY = 'FITPULSE_CEO_SESSION_TOKEN';
const FAILED_ATTEMPTS_KEY = 'FITPULSE_CEO_FAILED_ATTEMPTS';
const LOCKOUT_TIMESTAMP_KEY = 'FITPULSE_CEO_LOCKOUT_UNTIL';

// The verified CEO Master Key
const MASTER_KEY = '@Fuad2001#';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export interface CeoAuthResult {
  success: boolean;
  message?: string;
  lockedUntil?: number;
}

export async function isCeoAuthenticated(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem(CEO_SESSION_KEY);
    if (!token) return false;
    // Simple integrity check on stored session
    const parts = token.split(':');
    if (parts.length === 2 && parts[0] === 'fitpulse_ceo_active') {
      const loginTime = parseInt(parts[1], 10);
      // Valid for 30 days
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      return Date.now() - loginTime < thirtyDaysMs;
    }
    return false;
  } catch (_) {
    return false;
  }
}

export async function loginCeo(passcode: string): Promise<CeoAuthResult> {
  try {
    // 1. Check for active lockout
    const lockoutUntilStr = await AsyncStorage.getItem(LOCKOUT_TIMESTAMP_KEY);
    if (lockoutUntilStr) {
      const lockoutUntil = parseInt(lockoutUntilStr, 10);
      if (Date.now() < lockoutUntil) {
        const remainingSec = Math.ceil((lockoutUntil - Date.now()) / 1000);
        return {
          success: false,
          message: `Too many failed attempts. Portal locked for ${remainingSec}s.`,
          lockedUntil: lockoutUntil,
        };
      } else {
        // Lockout expired -> Reset
        await AsyncStorage.removeItem(LOCKOUT_TIMESTAMP_KEY);
        await AsyncStorage.removeItem(FAILED_ATTEMPTS_KEY);
      }
    }

    // 2. Verify passcode
    if (passcode.trim() === MASTER_KEY) {
      // Success -> Reset failed counters
      await AsyncStorage.removeItem(FAILED_ATTEMPTS_KEY);
      await AsyncStorage.removeItem(LOCKOUT_TIMESTAMP_KEY);
      // Generate active session token
      const sessionToken = `fitpulse_ceo_active:${Date.now()}`;
      await AsyncStorage.setItem(CEO_SESSION_KEY, sessionToken);
      return { success: true };
    }

    // 3. Failed attempt -> Increment counter
    const currentAttemptsStr = await AsyncStorage.getItem(FAILED_ATTEMPTS_KEY);
    const attempts = (currentAttemptsStr ? parseInt(currentAttemptsStr, 10) : 0) + 1;
    await AsyncStorage.setItem(FAILED_ATTEMPTS_KEY, attempts.toString());

    if (attempts >= MAX_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      await AsyncStorage.setItem(LOCKOUT_TIMESTAMP_KEY, lockoutUntil.toString());
      return {
        success: false,
        message: 'Security lockout triggered (5 failed attempts). Try again in 5 minutes.',
        lockedUntil: lockoutUntil,
      };
    }

    return {
      success: false,
      message: `Invalid Master Key. ${MAX_ATTEMPTS - attempts} attempts remaining.`,
    };
  } catch (e: any) {
    return { success: false, message: e.message || 'Authentication error.' };
  }
}

export async function logoutCeo(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CEO_SESSION_KEY);
  } catch (_) {}
}
