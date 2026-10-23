import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import BrandLogo from '../components/ui/BrandLogo';
import { auth } from '../lib/firebase';
import { useUserStore, UserTier } from '../store/userStore';

export default function SplashScreen() {
  const router = useRouter();
  // Snapshot user once at mount — do NOT put user in effect deps (causes re-run loop)
  const userRef = useRef(useUserStore.getState().user);

  // Clean micro-animations like Instagram / TikTok
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth entrance: Scale from 0.85 -> 1.0 & Fade in
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web' ? true : false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web' ? true : false,
      }),
    ]).start();

    let hasNavigated = false;
    const startTime = Date.now();
    const MIN_SPLASH_MS = Platform.OS === 'web' ? 400 : 800;

    const navigateTo = (route: string) => {
      if (hasNavigated) return;
      hasNavigated = true;
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, MIN_SPLASH_MS - elapsed);
      setTimeout(() => {
        router.replace(route as any);
      }, remainingDelay);
    };

    // Listen for Firebase auth state resolution to directly route authenticated users
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const storedUser = userRef.current;
      if (firebaseUser) {
        // Authenticated user -> Go to app tabs
        navigateTo('/(tabs)');
      } else if (storedUser?.uid && storedUser.tier !== UserTier.GUEST) {
        // Persistent non-guest user in store -> Go to app tabs
        navigateTo('/(tabs)');
      } else {
        // No session -> Go to welcome
        navigateTo('/welcome');
      }
    });

    // Fallback safety timer — longer on web so Firebase has time to initialise
    const FALLBACK_MS = Platform.OS === 'web' ? 3000 : 2000;
    const fallbackTimer = setTimeout(() => {
      const storedUser = userRef.current;
      if (auth.currentUser || (storedUser?.uid && storedUser.tier !== UserTier.GUEST)) {
        navigateTo('/(tabs)');
      } else {
        navigateTo('/welcome');
      }
    }, FALLBACK_MS);

    return () => {
      unsubscribe();
      clearTimeout(fallbackTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerContainer}>
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <BrandLogo size="splash" showText={false} />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
