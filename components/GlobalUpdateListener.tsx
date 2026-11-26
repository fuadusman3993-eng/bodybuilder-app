import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useUpdateStore } from '../store/updateStore';
import TikTokFeatureUpdateModal from './updates/TikTokFeatureUpdateModal';

/**
 * GlobalUpdateListener:
 * Listens for Over-The-Air (OTA) feature updates without ever crashing the app.
 * - Safely checks for updates 2.5s AFTER the app UI has smoothly mounted.
 * - Displays a sleek TikTok-style In-App Feature Update sheet.
 * - Allows user to click "Update Now", see animated download progress, and restart.
 */
export default function GlobalUpdateListener() {
  const {
    setUpdateAvailable,
    setDownloading,
    setProgress,
    setReady,
    setError,
    reset,
  } = useUpdateStore();

  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let isMounted = true;
    let initialCheckTimer: ReturnType<typeof setTimeout> | null = null;

    async function checkForUpdates() {
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;

      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Updates = require('expo-updates');
        if (__DEV__) {
          // In local development, updates are not fetched from EAS
          return;
        }

        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable && isMounted) {
          // Open the TikTok-style feature update sheet
          setUpdateAvailable(undefined, 'v1.1 Feature Update');
        }
      } catch (err: any) {
        // Non-blocking: Silently catch network or offline errors so the app never crashes
        console.log('[OTA Check] Notice:', err?.message || err);
      } finally {
        isCheckingRef.current = false;
      }
    }

    // Delay check by 2500ms to allow splash transition and app store hydration to settle smoothly
    initialCheckTimer = setTimeout(() => {
      if (isMounted) {
        checkForUpdates();
      }
    }, 2500);

    return () => {
      isMounted = false;
      if (initialCheckTimer) clearTimeout(initialCheckTimer);
    };
  }, [setUpdateAvailable]);

  const handleDownload = async () => {
    if (Platform.OS === 'web') return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Updates = require('expo-updates');
      setDownloading();

      // Smooth simulated progress indicator while expo-updates downloads native bundle chunks
      let currentProgress = 15;
      const progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + Math.random() * 20, 92);
        setProgress(currentProgress);
      }, 350);

      const result = await Updates.fetchUpdateAsync();
      clearInterval(progressInterval);

      if (result.isNew) {
        setReady();
      } else {
        setReady();
      }
    } catch (err: any) {
      console.warn('[OTA Download] Error:', err);
      setError('Download could not be completed. Your connection may be slow.');
    }
  };

  const handleRestart = async () => {
    if (Platform.OS === 'web') return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Updates = require('expo-updates');
      reset();
      await Updates.reloadAsync();
    } catch (err: any) {
      console.warn('[OTA Reload] Error:', err);
      reset();
    }
  };

  return (
    <TikTokFeatureUpdateModal
      onDownloadPress={handleDownload}
      onRestartPress={handleRestart}
    />
  );
}
