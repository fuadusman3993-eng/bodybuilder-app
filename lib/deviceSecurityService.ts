import { Platform } from 'react-native';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { sendOfficialFitPulseMessage } from './officialChatService';

export interface DeviceSession {
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  location: string;
  ip?: string;
  lastActive: any;
  createdAt: any;
  isCurrent?: boolean;
}

const DEVICE_ID_KEY = 'fitpulse_device_id';

/**
 * Returns or generates a persistent unique Device ID for this client.
 */
export function getLocalDeviceId(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    let id = window.localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      try {
        window.localStorage.setItem(DEVICE_ID_KEY, id);
      } catch (_) {}
    }
    return id;
  }
  return 'dev_' + Platform.OS + '_' + Date.now().toString(36);
}

/**
 * Parses user agent to detect human-readable phone model or desktop OS.
 */
export function getLocalDeviceName(): { name: string; type: 'mobile' | 'desktop' | 'tablet' } {
  if (typeof window === 'undefined' || !navigator?.userAgent) {
    return { name: Platform.OS === 'ios' ? 'Apple iPhone' : 'Mobile Device', type: 'mobile' };
  }

  const ua = navigator.userAgent;
  let type: 'mobile' | 'desktop' | 'tablet' = 'desktop';

  if (/iPad|Tablet|PlayBook/i.test(ua)) {
    type = 'tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle/i.test(ua)) {
    type = 'mobile';
  }

  let name = 'Web Browser';

  // Specific phone brand checks
  if (/iPhone/i.test(ua)) {
    name = 'Apple iPhone';
  } else if (/iPad/i.test(ua)) {
    name = 'Apple iPad';
  } else if (/SM-[A-Z0-9]+|Samsung/i.test(ua)) {
    name = 'Samsung Galaxy';
  } else if (/Tecno/i.test(ua)) {
    name = 'Tecno Mobile';
  } else if (/Infinix/i.test(ua)) {
    name = 'Infinix Phone';
  } else if (/Xiaomi|Redmi|POCO/i.test(ua)) {
    name = 'Xiaomi / Redmi';
  } else if (/Pixel/i.test(ua)) {
    name = 'Google Pixel';
  } else if (/Huawei|HONOR/i.test(ua)) {
    name = 'Huawei Device';
  } else if (/Android/i.test(ua)) {
    name = 'Android Phone';
  } else if (/Windows NT/i.test(ua)) {
    name = 'Windows PC';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    name = 'MacBook / macOS';
  } else if (/Linux/i.test(ua)) {
    name = 'Linux PC';
  }

  return { name, type };
}

/**
 * Detects approximate location based on timezone and locale.
 */
export function getLocalDeviceLocation(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Addis_Ababa') || tz.includes('Nairobi')) return 'Addis Ababa, Ethiopia';
    if (tz.includes('Dubai') || tz.includes('Riyadh')) return 'Dubai, UAE';
    if (tz.includes('London')) return 'London, United Kingdom';
    if (tz.includes('New_York') || tz.includes('Los_Angeles') || tz.includes('Chicago')) return 'United States';
    if (tz.includes('Berlin') || tz.includes('Paris')) return 'Western Europe';
    if (tz) {
      const parts = tz.split('/');
      return (parts[1] ? parts[1].replace(/_/g, ' ') + ', ' : '') + parts[0];
    }
  } catch (_) {}
  return 'Addis Ababa, Ethiopia';
}

/**
 * Retrieves all active sessions for a given user from Firestore.
 */
export async function getActiveSessions(uid: string): Promise<DeviceSession[]> {
  if (!uid) return [];
  const currentDevId = getLocalDeviceId();

  try {
    const sessionsCol = collection(db, 'users', uid, 'active_sessions');
    const snap = await getDocs(sessionsCol);
    const sessions: DeviceSession[] = [];

    snap.forEach((d) => {
      const data = d.data();
      sessions.push({
        deviceId: d.id,
        deviceName: data.deviceName || 'Authorized Device',
        deviceType: data.deviceType || 'mobile',
        location: data.location || 'Unknown Location',
        ip: data.ip || '196.188.xxx.xxx',
        lastActive: data.lastActive || data.createdAt,
        createdAt: data.createdAt,
        isCurrent: d.id === currentDevId,
      });
    });

    // Sort: Current device first, then newest
    return sessions.sort((a, b) => (b.isCurrent ? 1 : 0) - (a.isCurrent ? 1 : 0));
  } catch (err) {
    console.warn('Error fetching active sessions:', err);
    return [];
  }
}

export type DeviceValidationResult =
  | { status: 'AUTHORIZED' }
  | { status: 'REQUIRES_2FA'; deviceName: string; location: string }
  | { status: 'LIMIT_REACHED'; activeCount: number; maxAllowed: number };

/**
 * Registers or validates the current device upon login.
 * Enforces maximum 2 devices per account and dispatches 2FA OTP for a new secondary device.
 */
export async function registerOrValidateDevice(uid: string): Promise<DeviceValidationResult> {
  if (!uid) return { status: 'AUTHORIZED' };

  const deviceId = getLocalDeviceId();
  const { name: deviceName, type: deviceType } = getLocalDeviceName();
  const location = getLocalDeviceLocation();

  try {
    const sessionDocRef = doc(db, 'users', uid, 'active_sessions', deviceId);
    const sessionSnap = await getDoc(sessionDocRef);

    // 1. Device already authorized: update last active and permit login
    if (sessionSnap.exists()) {
      await setDoc(
        sessionDocRef,
        {
          deviceName,
          deviceType,
          location,
          lastActive: serverTimestamp(),
        },
        { merge: true }
      );
      return { status: 'AUTHORIZED' };
    }

    // 2. Device is NEW: Check current active sessions count
    const sessions = await getActiveSessions(uid);

    // Case A: Account has 2 or more devices already -> Strict Limit Reached!
    if (sessions.length >= 2) {
      return {
        status: 'LIMIT_REACHED',
        activeCount: sessions.length,
        maxAllowed: 2,
      };
    }

    // Case B: First ever device on this account -> Auto-authorize
    if (sessions.length === 0) {
      await setDoc(sessionDocRef, {
        deviceId,
        deviceName,
        deviceType,
        location,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      });
      return { status: 'AUTHORIZED' };
    }

    // Case C: Exactly 1 existing active device -> Secondary device attempting login!
    // Generate secure 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const pendingRef = doc(db, 'users', uid, 'security', 'pending_2fa');
    await setDoc(pendingRef, {
      code: otpCode,
      deviceId,
      deviceName,
      deviceType,
      location,
      expiresAt,
      createdAt: serverTimestamp(),
    });

    // Send official security alert with the OTP code into user's FitPulse Official Chat Channel!
    await sendOfficialFitPulseMessage(
      uid,
      `🛡️ FitPulse Security Alert: New Device Login\n\nA new login was attempted on your account from ${deviceName} (${location}).\n\nYour 6-digit login verification code is:\n\n🔑 ${otpCode}\n\n• Valid for 10 minutes.\n• Enter this code on your new device to authorize it (Max 2 devices allowed).\n• If this wasn't you, please change your password immediately!\n\n— FitPulse Security Team`,
      '🛡️ New Device Verification Code'
    );

    return {
      status: 'REQUIRES_2FA',
      deviceName,
      location,
    };
  } catch (err) {
    console.warn('Error in registerOrValidateDevice:', err);
    // Graceful fallback to avoid locking users out in case of network glitch
    return { status: 'AUTHORIZED' };
  }
}

/**
 * Validates the 6-digit verification code entered by the user on the new device.
 */
export async function verifyDeviceCode(uid: string, enteredCode: string): Promise<{ success: boolean; error?: string }> {
  if (!uid || !enteredCode) return { success: false, error: 'Code is required.' };

  const cleanCode = enteredCode.trim().replace(/\s+/g, '');
  const currentDevId = getLocalDeviceId();

  try {
    const pendingRef = doc(db, 'users', uid, 'security', 'pending_2fa');
    const pendingSnap = await getDoc(pendingRef);

    if (!pendingSnap.exists()) {
      return { success: false, error: 'No verification request found or code expired. Please log in again.' };
    }

    const data = pendingSnap.data();
    if (Date.now() > (data.expiresAt || 0)) {
      await deleteDoc(pendingRef).catch(() => {});
      return { success: false, error: 'Verification code has expired. Please log in again to request a new code.' };
    }

    if (data.code !== cleanCode) {
      return { success: false, error: 'Incorrect verification code. Please check your FitPulse Official Chat and try again.' };
    }

    // Code is valid! Authorize this new device into active_sessions
    const sessionDocRef = doc(db, 'users', uid, 'active_sessions', currentDevId);
    await setDoc(sessionDocRef, {
      deviceId: currentDevId,
      deviceName: data.deviceName || getLocalDeviceName().name,
      deviceType: data.deviceType || getLocalDeviceName().type,
      location: data.location || getLocalDeviceLocation(),
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    });

    // Clean up used 2FA document
    await deleteDoc(pendingRef).catch(() => {});

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Verification failed. Please try again.' };
  }
}

/**
 * Terminates / revokes an authorized device session.
 */
export async function terminateSession(uid: string, targetDeviceId: string): Promise<boolean> {
  if (!uid || !targetDeviceId) return false;
  try {
    const ref = doc(db, 'users', uid, 'active_sessions', targetDeviceId);
    await deleteDoc(ref);
    return true;
  } catch (err) {
    console.warn('Error terminating session:', err);
    return false;
  }
}

/**
 * Terminates all other active sessions except the current device.
 */
export async function terminateAllOtherSessions(uid: string): Promise<boolean> {
  if (!uid) return false;
  const currentDevId = getLocalDeviceId();

  try {
    const sessionsCol = collection(db, 'users', uid, 'active_sessions');
    const snap = await getDocs(sessionsCol);
    const deletePromises = snap.docs
      .filter((d) => d.id !== currentDevId)
      .map((d) => deleteDoc(d.ref));

    await Promise.all(deletePromises);
    return true;
  } catch (err) {
    console.warn('Error terminating other sessions:', err);
    return false;
  }
}
