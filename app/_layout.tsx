import React, { useCallback, useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useUserStore, UserTier } from '../store/userStore';

if (Platform.OS === 'web') {
  if (typeof document !== 'undefined') {
    document.body.style.backgroundColor = '#000000';
    document.documentElement.style.backgroundColor = '#000000';
  }
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const { setUser } = useUserStore();

  useEffect(() => {
    async function loadAssetsAsync() {
      try {
        await Font.loadAsync({});
      } catch (e) {
        console.warn('Asset loading error:', e);
      } finally {
        setAppReady(true);
      }
    }
    loadAssetsAsync();
  }, []);

  // Restore user session from Firebase on every app load/refresh
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const docSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
          const role = docSnap.exists() ? (docSnap.data().role ?? 'user') : 'user';
          setUser({
            tier: UserTier.FREE,
            name: firebaseUser.displayName || docSnap.data()?.username || 'User',
            role,
            uid: firebaseUser.uid,
            email: firebaseUser.email || undefined,
          });
        } catch (e) {
          console.warn('Could not restore user session:', e);
          setUser({ tier: UserTier.FREE, name: firebaseUser.displayName || 'User', uid: firebaseUser.uid });
        }
      } else {
        // No user logged in — keep as GUEST
        setUser({ tier: UserTier.GUEST });
      }
    });
    return () => unsubscribe();
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
          <Stack.Screen name="story-viewer" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="add-story" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        </Stack>
      </View>
    </SafeAreaProvider>
  );
}
