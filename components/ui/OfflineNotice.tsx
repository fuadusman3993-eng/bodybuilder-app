import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import BrandLogo from './BrandLogo';

export default function OfflineNotice() {
  // Never default to offline on initial mount to eliminate reload/refresh flashes
  const [isOffline, setIsOffline] = useState(false);
  const offlineTimerRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const clearPendingTimer = () => {
      if (offlineTimerRef.current) {
        clearTimeout(offlineTimerRef.current);
        offlineTimerRef.current = null;
      }
    };

    // Active probe to verify real connectivity before triggering the offline screen
    const verifyConnectivity = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        await fetch(`/favicon.ico?_ping=${Date.now()}`, {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        // Ping succeeded -> User is actively online
        setIsOffline(false);
        clearPendingTimer();
      } catch (_) {
        // Genuine offline confirmed
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setIsOffline(true);
        }
      }
    };

    const handleOnline = () => {
      clearPendingTimer();
      setIsOffline(false);
    };

    const handleOffline = () => {
      clearPendingTimer();
      // Debounce offline trigger by 2.2 seconds to eliminate refresh flickers
      offlineTimerRef.current = setTimeout(() => {
        verifyConnectivity();
      }, 2200);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check after startup grace period (2.5 seconds)
    // Never trigger during initial load or page refresh
    const initialTimer = setTimeout(() => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        verifyConnectivity();
      }
    }, 2500);

    return () => {
      clearPendingTimer();
      clearTimeout(initialTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  const handleRetry = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentCard}>
        {/* FitPulse Brand Icon */}
        <View style={styles.logoWrap}>
          <BrandLogo size="medium" showText={false} />
        </View>

        {/* Offline Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="cloud-offline-outline" size={38} color="#EF4444" />
        </View>

        <Text style={styles.title}>No Internet Connection</Text>
        <Text style={styles.subtitle}>
          FitPulse requires an internet connection to sync your workouts, progress, and community.
        </Text>

        <TouchableOpacity style={styles.retryBtn} activeOpacity={0.85} onPress={handleRetry}>
          <Ionicons name="refresh" size={17} color="#000" />
          <Text style={styles.retryBtnText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#050B0E',
    zIndex: 999999,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  contentCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0D161F',
    borderWidth: 1,
    borderColor: '#1A2938',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  logoWrap: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#8A95A5',
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    width: '100%',
    height: 48,
    borderRadius: 14,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
});
