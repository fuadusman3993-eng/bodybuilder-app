import React, { useCallback, useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { getWallet } from '../lib/walletService';
import { getProfile, syncUserProfile } from '../lib/profileService';
import { useUserStore, UserTier } from '../store/userStore';
import { captureSystemError } from '../lib/telemetryService';
import { setupUniversalInteractionEngine, auditScreenRoute } from '../lib/universalInteractionEngine';
import GlobalCallListener from '../components/GlobalCallListener';
import GlobalPresence from '../components/GlobalPresence';
import OfflineNotice from '../components/ui/OfflineNotice';

if (Platform.OS === 'web') {
  if (typeof document !== 'undefined') {
    document.body.style.backgroundColor = '#050B0E';
    document.documentElement.style.backgroundColor = '#050B0E';
  }
} else {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

import { Ionicons } from '@expo/vector-icons';

export default function RootLayout() {
  const [appReady, setAppReady] = useState(Platform.OS === 'web');
  const { setUser, setAuthInitialized } = useUserStore();
  const pathname = usePathname();

  // 1. Universal Screen Route Auditor: Automatically detects when a user navigates to a mock/dummy screen
  useEffect(() => {
    if (pathname && !pathname.startsWith('/ceo')) {
      auditScreenRoute(pathname);
    }
  }, [pathname]);

  // 2. Universal Dead Click & Inactivity Interceptor: Listens to all user clicks globally
  useEffect(() => {
    const teardown = setupUniversalInteractionEngine();
    return () => teardown();
  }, []);

  useEffect(() => {
    async function loadAssetsAsync() {
      try {
        await Font.loadAsync({
          ...Ionicons.font,
        });
      } catch (e) {
        console.warn('Asset loading error:', e);
      } finally {
        setAppReady(true);
      }
    }
    loadAssetsAsync();
  }, []);

  // Proactive Telemetry: Capture uncaught web exceptions silently into Supabase system_errors
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleGlobalError = (event: ErrorEvent) => {
        try {
          captureSystemError(event.error || event.message, {
            component: 'WebWindowOnError',
            metadata: { filename: event.filename, lineno: event.lineno, colno: event.colno },
          });
        } catch (_) {}
      };

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        try {
          captureSystemError(event.reason || 'Unhandled Promise Rejection', {
            component: 'WebUnhandledRejection',
          });
        } catch (_) {}
      };

      window.addEventListener('error', handleGlobalError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      return () => {
        window.removeEventListener('error', handleGlobalError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }
  }, []);

  // Restore user session from Firebase on every app load/refresh
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // 1. Fetch authoritative profile from Supabase
          let profile = await getProfile(firebaseUser.uid);

          // If profile does not exist in Supabase yet, sync from Firebase user
          if (!profile) {
            let uData: any = null;
            try {
              const docSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
              if (docSnap.exists()) uData = docSnap.data();
            } catch (_) {}

            const realResolved = firebaseUser.displayName
              || uData?.username
              || uData?.name
              || firebaseUser.email?.split('@')[0]
              || 'Member';
            const role = (uData?.role as any) || 'user';
            const avatar = uData?.avatar || uData?.photoURL || firebaseUser.photoURL || `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${firebaseUser.uid}.jpg`;
            const city = uData?.city || undefined;

            profile = await syncUserProfile({
              uid: firebaseUser.uid,
              name: realResolved,
              email: firebaseUser.email || undefined,
              avatar_url: avatar,
              role,
              city,
            });
          }

          const rawProfName = profile?.name?.trim();
          const isGeneric = !rawProfName || ['trainee', 'user', 'athlete', 'a user'].includes(rawProfName.toLowerCase());
          const name = !isGeneric
            ? rawProfName
            : (firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Member');
          const role = profile?.role || 'user';
          const avatar = profile?.avatar_url || firebaseUser.photoURL || `https://eweoydtpchrmnoinyute.supabase.co/storage/v1/object/public/avatars/${firebaseUser.uid}.jpg`;
          const city = profile?.city || undefined;

          // 2. Pro persistence: check Supabase wallets.pro_until via Security Definer RPC
          let userTier = UserTier.FREE;
          try {
            const w = await getWallet(firebaseUser.uid);
            if (w?.pro_until && new Date(w.pro_until) > new Date()) {
              userTier = UserTier.PREMIUM;
            }
          } catch (_) {}

          setUser({
            tier: userTier,
            name,
            role,
            uid: firebaseUser.uid,
            email: firebaseUser.email || undefined,
            avatar,
            city,
          });

          // AUTO-SYNC: Safe isolated try-catch for coach_profiles
          try {
            if (role === 'coach') {
              await supabase.from('coach_profiles').upsert({
                uid: firebaseUser.uid,
                name: name,
              }, { onConflict: 'uid' });
            }
          } catch (_) {}

        } catch (e) {
          console.warn('Could not restore user session:', e);
          const currentTier = useUserStore.getState().user.tier;
          setUser({
            tier: currentTier !== UserTier.GUEST ? currentTier : UserTier.FREE,
            name: firebaseUser.displayName || 'User',
            uid: firebaseUser.uid,
          });
        }
      } else {
        // No user logged in — keep as GUEST and clear all fields
        setUser({
          tier: UserTier.GUEST,
          uid: undefined,
          name: undefined,
          email: undefined,
          avatar: undefined,
          role: undefined,
          city: undefined,
        });
      }
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appReady && Platform.OS !== 'web') {
      try {
        await SplashScreen.hideAsync();
      } catch {}
    }
  }, [appReady]);

  if (!appReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#050B0E' }} onLayout={onLayoutRootView}>
        <StatusBar style="light" backgroundColor="#050B0E" />
        <OfflineNotice />
        <GlobalCallListener />
        <GlobalPresence />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="onboarding-quiz" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="challenge" options={{ headerShown: false }} />
          <Stack.Screen name="workout/index" options={{ headerShown: false }} />
          <Stack.Screen name="gym/index" options={{ headerShown: false }} />
          <Stack.Screen name="story-viewer" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="add-story" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="coaches" options={{ headerShown: false }} />
          <Stack.Screen name="coach-profile" options={{ headerShown: false }} />
          <Stack.Screen name="coach-dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="my-coach" options={{ headerShown: false }} />
          <Stack.Screen name="create-plan" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="ceo/index" options={{ headerShown: false }} />
          <Stack.Screen name="ceo/login" options={{ headerShown: false }} />
        </Stack>
      </View>
    </SafeAreaProvider>
  );
}
