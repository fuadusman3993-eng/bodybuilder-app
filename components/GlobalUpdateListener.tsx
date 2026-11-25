import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';

/**
 * Listens for Over-The-Air (OTA) updates on native devices (Android / iOS).
 * Automatically downloads updates in the background and offers an instant restart.
 * On Web, gracefully does nothing.
 */
export default function GlobalUpdateListener() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    let isMounted = true;
    let promptTimer: ReturnType<typeof setTimeout> | null = null;

    async function checkOTAUpdates() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Updates = require('expo-updates');
        if (__DEV__) return; // Don't check updates in local development

        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable && isMounted) {
          await Updates.fetchUpdateAsync();
          if (isMounted) {
            promptTimer = setTimeout(() => {
              if (!isMounted) return;
              try {
                Alert.alert(
                  'Update Ready',
                  'A new FitPulse update has been downloaded. Restart now to apply the latest fixes?',
                  [
                    { text: 'Later', style: 'cancel' },
                    {
                      text: 'Restart Now',
                      onPress: () => {
                        Updates.reloadAsync().catch(() => {});
                      },
                    },
                  ]
                );
              } catch (_) {}
            }, 1500);
          }
        }
      } catch (_) {
        // Silently catch network or offline errors
      }
    }

    checkOTAUpdates();

    return () => {
      isMounted = false;
      if (promptTimer) clearTimeout(promptTimer);
    };
  }, []);

  return null;
}
