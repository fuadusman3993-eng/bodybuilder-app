import React, { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Listens for Over-The-Air (OTA) updates on native devices (Android / iOS).
 * Automatically downloads and prepares updates in the background.
 * On Web, gracefully does nothing.
 */
export default function GlobalUpdateListener() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    let isMounted = true;

    async function checkOTAUpdates() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Updates = require('expo-updates');
        if (__DEV__) return; // Don't check updates in local development

        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable && isMounted) {
          await Updates.fetchUpdateAsync();
          // The update is downloaded and ready!
          // It will automatically activate on next launch or can be reloaded.
        }
      } catch (_) {
        // Silently catch network or offline errors
      }
    }

    checkOTAUpdates();

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}
