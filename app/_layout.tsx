import React, { useCallback, useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

if (Platform.OS === 'web') {
  // Force body and html background to black on web to prevent white scroll lag/gaps
  if (typeof document !== 'undefined') {
    document.body.style.backgroundColor = '#000000';
    document.documentElement.style.backgroundColor = '#000000';
  }
}

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
        // No artificial delay here; app/index.tsx handles the visual splash screen
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
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#000000' }} onLayout={onLayoutRootView}>
        <StatusBar style="light" backgroundColor="#000000" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="challenge" options={{ headerShown: false }} />
          <Stack.Screen name="workout/index" options={{ headerShown: false }} />
          <Stack.Screen name="gym/index" options={{ headerShown: false }} />

        </Stack>
      </View>
    </SafeAreaProvider>
  );
}
