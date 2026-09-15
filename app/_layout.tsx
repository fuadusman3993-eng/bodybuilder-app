import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

// Keep the splash screen visible until assets are fully loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function loadAssetsAsync() {
      try {
        // Pre-load fonts or other heavy assets here if needed
        await Font.loadAsync({
          // Add custom fonts here in future
        });
        
        // Artificial delay so you can see the Splash Screen (2.5 seconds)
        await new Promise(resolve => setTimeout(resolve, 2500));
      } catch (e) {
        console.warn('Asset loading error:', e);
      } finally {
        setAppReady(true);
      }
    }
    loadAssetsAsync();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      // Hide splash screen only after app is ready and layout is complete
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) {
    return null; // Splash screen stays visible
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: Colors.background }} onLayout={onLayoutRootView}>
        <StatusBar style="light" backgroundColor={Colors.background} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="workout/index" options={{ headerShown: false }} />
          <Stack.Screen name="gym/index" options={{ headerShown: false }} />
        </Stack>
      </View>
    </SafeAreaProvider>
  );
}
