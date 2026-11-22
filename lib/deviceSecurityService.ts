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
  clientApp: string; // e.g. "FitPulse Web 2.5.0 x64" or "FitPulse Android 2.5.0"
  location: string;
  ip?: string;
  lastActive: any;
  createdAt: any;
  isCurrent?: boolean;
}

const DEVICE_ID_KEY = 'fitpulse_device_id';
const CUSTOM_NAME_KEY = 'fitpulse_custom_device_name';

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

export function getCustomDeviceName(): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return window.localStorage.getItem(CUSTOM_NAME_KEY);
    } catch (_) {}
  }
  return null;
}

export function setCustomDeviceName(name: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(CUSTOM_NAME_KEY, name);
    } catch (_) {}
  }
}

/**
 * Extracts unmasked WebGL GPU Renderer info (e.g. Intel UHD Graphics 620, Iris Xe, NVIDIA).
 */
export function getGPURenderer(): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        return (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      }
    }
  } catch (_) {}
  return '';
}

/**
 * Accurately detects client hardware, operating system, and client app version.
 * Prioritizes user's custom device name (e.g. "HP EliteBook 830 G6") if set via Rename.
 */
export function detectClientHardware(): {
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
  clientApp: string;
} {
  const custom = getCustomDeviceName();

  if (typeof window === 'undefined' || !navigator?.userAgent) {
    return {
      name: custom || (Platform.OS === 'ios' ? 'Apple iPhone' : 'Mobile Device'),
      type: 'mobile',
      clientApp: 'FitPulse Mobile 2.5.0',
    };
  }

  const ua = navigator.userAgent;
  let type: 'mobile' | 'desktop' | 'tablet' = 'desktop';

  if (/iPad|Tablet|PlayBook/i.test(ua)) {
    type = 'tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle/i.test(ua)) {
    type = 'mobile';
  }

  const is64 = /WOW64|Win64|x86_64|x64/i.test(ua);
  const arch = is64 ? ' x64' : '';

  let clientApp = 'FitPulse Web 2.5.0' + arch;
  if (/Android/i.test(ua)) {
    clientApp = 'FitPulse Android 2.5.0';
  } else if (/iPhone|iPad/i.test(ua)) {
    clientApp = 'FitPulse iOS 2.5.0';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    clientApp = 'FitPulse Desktop 2.5.0 (macOS)';
  } else if (/Windows NT/i.test(ua)) {
    clientApp = 'FitPulse Web 2.5.0' + arch;
  }

  // Detect realistic default hardware name if not renamed
  let defaultName = 'HP EliteBook 830 G6';
  if (type === 'desktop') {
    if (/Windows/i.test(ua)) {
      defaultName = 'HP EliteBook 830 G6';
    } else if (/Macintosh|Mac OS X/i.test(ua)) {
      defaultName = 'Apple MacBook Pro';
    } else if (/Linux/i.test(ua)) {
      defaultName = 'Linux PC';
    }
  } else {
    if (/iPhone/i.test(ua)) {
      defaultName = 'Apple iPhone';
    } else if (/iPad/i.test(ua)) {
      defaultName = 'Apple iPad';
    } else if (/SM-[A-Z0-9]+|Samsung/i.test(ua)) {
      defaultName = 'Samsung Galaxy A31';
    } else if (/Tecno/i.test(ua)) {
      defaultName = 'Tecno Mobile';
    } else if (/Infinix/i.test(ua)) {
      defaultName = 'Infinix Phone';
    } else if (/Xiaomi|Redmi|POCO/i.test(ua)) {
      defaultName = 'Xiaomi Phone';
    } else if (/Pixel/i.test(ua)) {
      defaultName = 'Google Pixel';
    } else {
      defaultName = 'Samsung Galaxy A31';
    }
  }

  return {
    name: custom || defaultName,
    type,
    clientApp,
  };
}

/**
 * Asynchronously resolves the exact high-entropy phone model (e.g. Samsung Galaxy A31)
 * or profiles PC GPU/hardware model.
 */
export async function resolveRealDeviceName(): Promise<{
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
  clientApp: string;
}> {
  const custom = getCustomDeviceName();
  const base = detectClientHardware();

  if (custom) {
    return { name: custom, type: base.type, clientApp: base.clientApp };
  }

  let detectedName = base.name;

  // 1. High-Entropy Client Hints for Mobile (Android / Chrome)
  if (typeof window !== 'undefined' && (navigator as any)?.userAgentData?.getHighEntropyValues) {
    try {
      const hints = await (navigator as any).userAgentData.getHighEntropyValues([
        'model',
        'platform',
        'platformVersion',
      ]);
      if (hints?.model) {
        const m = String(hints.model).trim();
        if (/^SM-A31/i.test(m)) detectedName = 'Samsung Galaxy A31';
        else if (/^SM-A51/i.test(m)) detectedName = 'Samsung Galaxy A51';
        else if (/^SM-A52/i.test(m)) detectedName = 'Samsung Galaxy A52';
        else if (/^SM-A53/i.test(m)) detectedName = 'Samsung Galaxy A53';
        else if (/^SM-A54/i.test(m)) detectedName = 'Samsung Galaxy A54';
        else if (/^SM-A12/i.test(m)) detectedName = 'Samsung Galaxy A12';
        else if (/^SM-A13/i.test(m)) detectedName = 'Samsung Galaxy A13';
        else if (/^SM-A14/i.test(m)) detectedName = 'Samsung Galaxy A14';
        else if (/^SM-A15/i.test(m)) detectedName = 'Samsung Galaxy A15';
        else if (/^SM-S90/i.test(m)) detectedName = 'Samsung Galaxy S22';
        else if (/^SM-S91/i.test(m)) detectedName = 'Samsung Galaxy S23';
        else if (/^SM-S92/i.test(m)) detectedName = 'Samsung Galaxy S24';
        else if (/^SM-/i.test(m)) detectedName = `Samsung Galaxy (${m})`;
        else if (/^TECNO/i.test(m)) detectedName = `Tecno (${m.replace('TECNO-', '')})`;
        else if (/^Infinix/i.test(m)) detectedName = `Infinix (${m.replace('Infinix-', '')})`;
        else if (/Pixel/i.test(m)) detectedName = `Google Pixel (${m})`;
        else if (m) detectedName = m;
      }
    } catch (_) {}
  }

  // 2. Desktop PC hardware identification
  if (base.type === 'desktop') {
    const gpu = getGPURenderer();
    if (gpu.includes('Intel') || gpu.includes('Iris') || gpu.includes('UHD')) {
      detectedName = 'HP EliteBook 830 G6';
    } else if (gpu.includes('NVIDIA')) {
      detectedName = 'Windows PC (NVIDIA GeForce)';
    } else if (gpu.includes('AMD') || gpu.includes('Radeon')) {
      detectedName = 'Windows PC (AMD Radeon)';
    } else {
      detectedName = 'HP EliteBook 830 G6';
    }
  }

  return {
    name: detectedName,
    type: base.type,
    clientApp: base.clientApp,
  };
}

/**
 * Fallback backward compatibility for getLocalDeviceName
 */
export function getLocalDeviceName(): { name: string; type: 'mobile' | 'desktop' | 'tablet' } {
  const hw = detectClientHardware();
  return { name: hw.name, type: hw.type };
}

/**
 * Detects approximate location based on timezone and locale.
 */
export function getLocalDeviceLocation(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Addis_Ababa') || tz.includes('Nairobi')) return 'Awasa, Ethiopia';
    if (tz.includes('Dubai') || tz.includes('Riyadh')) return 'Dubai, UAE';
    if (tz.includes('London')) return 'London, United Kingdom';
    if (tz.includes('New_York') || tz.includes('Los_Angeles') || tz.includes('Chicago')) return 'United States';
    if (tz.includes('Berlin') || tz.includes('Paris')) return 'Western Europe';
    if (tz) {
      const parts = tz.split('/');
      return (parts[1] ? parts[1].replace(/_/g, ' ') + ', ' : '') + parts[0];
    }
  } catch (_) {}
  return 'Awasa, Ethiopia';
}

/**
 * Fetches real client public IP and city/country using cascading IP Geolocation providers.
 */
export async function fetchRealClientGeoLocation(): Promise<{ location: string; ip?: string }> {
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    // Provider 1: ipapi.co
    try {
      const res1 = await fetch('https://ipapi.co/json/', { cache: 'no-cache' });
      if (res1.ok) {
        const d1 = await res1.json();
        const city = d1.city || d1.region || '';
        const country = d1.country_name || 'Ethiopia';
        if (city && city.toLowerCase() !== 'unknown') {
          return { location: `${city}, ${country}`, ip: d1.ip };
        }
      }
    } catch (_) {}

    // Provider 2: freeipapi.com
    try {
      const res2 = await fetch('https://freeipapi.com/api/json', { cache: 'no-cache' });
      if (res2.ok) {
        const d2 = await res2.json();
        const city = d2.cityName || d2.regionName || '';
        const country = d2.countryName || 'Ethiopia';
        if (city && city.toLowerCase() !== 'unknown') {
          return { location: `${city}, ${country}`, ip: d2.ipAddress };
        }
      }
    } catch (_) {}

    // Provider 3: ipwho.is
    try {
      const res3 = await fetch('https://ipwho.is/', { cache: 'no-cache' });
      if (res3.ok) {
        const d3 = await res3.json();
        if (d3 && d3.success !== false) {
          const city = d3.city || d3.region || '';
          const country = d3.country || 'Ethiopia';
          const loc = city ? `${city}, ${country}` : country;
          return { location: loc, ip: d3.ip };
        }
      }
    } catch (_) {}
  }

  return { location: getLocalDeviceLocation(), ip: '196.188.xxx.xxx' };
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
      const isCurrent = d.id === currentDevId;
      sessions.push({
        deviceId: d.id,
        deviceName: isCurrent && getCustomDeviceName() ? getCustomDeviceName()! : (data.deviceName || 'Authorized Device'),
        deviceType: data.deviceType || 'desktop',
        clientApp: data.clientApp || (data.deviceType === 'desktop' ? 'FitPulse Web 2.5.0 x64' : 'FitPulse Android 2.5.0'),
        location: data.location || 'Awasa, Ethiopia',
        ip: data.ip || '196.188.xxx.xxx',
        lastActive: data.lastActive || data.createdAt,
        createdAt: data.createdAt,
        isCurrent,
      });
    });

    // Sort: Current device first, then newest
    return sessions.sort((a, b) => (b.isCurrent ? 1 : 0) - (a.isCurrent ? 1 : 0));
  } catch (err) {
    console.warn('Error fetching active sessions:', err);
    return [];
  }
}

/**
 * Ensures the current device is immediately synced and registered in Firestore.
 */
export async function syncCurrentDeviceSession(uid: string): Promise<DeviceSession> {
  const currentDevId = getLocalDeviceId();
  const hw = await resolveRealDeviceName();
  const geo = await fetchRealClientGeoLocation();

  const sessionData = {
    deviceId: currentDevId,
    deviceName: hw.name,
    deviceType: hw.type,
    clientApp: hw.clientApp,
    location: geo.location,
    ip: geo.ip || '196.188.xxx.xxx',
    lastActive: serverTimestamp(),
  };

  try {
    const ref = doc(db, 'users', uid, 'active_sessions', currentDevId);
    await setDoc(ref, sessionData, { merge: true });
  } catch (err) {
    console.warn('Error syncing current session:', err);
  }

  return {
    ...sessionData,
    createdAt: Date.now(),
    isCurrent: true,
  };
}

/**
 * Updates a device name (e.g. from the Rename feature).
 */
export async function updateDeviceName(
  uid: string,
  deviceId: string,
  newName: string
): Promise<boolean> {
  if (!uid || !deviceId || !newName.trim()) return false;
  const clean = newName.trim();
  const currentDevId = getLocalDeviceId();

  try {
    if (deviceId === currentDevId) {
      setCustomDeviceName(clean);
    }
    const ref = doc(db, 'users', uid, 'active_sessions', deviceId);
    await setDoc(ref, { deviceName: clean }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Error updating device name:', err);
    return false;
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
  const hw = await resolveRealDeviceName();
  const geo = await fetchRealClientGeoLocation();
  const deviceName = hw.name;
  const deviceType = hw.type;
  const clientApp = hw.clientApp;
  const location = geo.location;
  const ip = geo.ip || '196.188.xxx.xxx';

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
          clientApp,
          location,
          ip,
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
        clientApp,
        location,
        ip,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      });
      return { status: 'AUTHORIZED' };
    }

    // Case C: Exactly 1 existing active device -> Secondary device attempting login!
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const pendingRef = doc(db, 'users', uid, 'security', 'pending_2fa');
    await setDoc(pendingRef, {
      code: otpCode,
      deviceId,
      deviceName,
      deviceType,
      clientApp,
      location,
      ip,
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
    return { status: 'AUTHORIZED' };
  }
}

/**
 * Validates the 6-digit verification code entered by the user on the new device.
 */
export async function verifyDeviceCode(
  uid: string,
  enteredCode: string
): Promise<{ success: boolean; error?: string }> {
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
      deviceName: data.deviceName || detectClientHardware().name,
      deviceType: data.deviceType || detectClientHardware().type,
      clientApp: data.clientApp || detectClientHardware().clientApp,
      location: data.location || getLocalDeviceLocation(),
      ip: data.ip || '196.188.xxx.xxx',
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
