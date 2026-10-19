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
  const { user } = useUserStore();
  
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
    const MIN_SPLASH_MS = 1000;

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
      if (firebaseUser) {
        // Authenticated user exists -> Go DIRECTLY to app tabs!
        navigateTo('/(tabs)');
      } else if (user?.uid && user.tier !== UserTier.GUEST) {
        // Persistent non-guest user in store -> Go DIRECTLY to app tabs!
        navigateTo('/(tabs)');
      } else {
        // No account session -> Go to welcome
        navigateTo('/welcome');
      }
    });

    // Fallback safety timer if auth resolution is delayed
    const fallbackTimer = setTimeout(() => {
      if (auth.currentUser || (user?.uid && user.tier !== UserTier.GUEST)) {
        navigateTo('/(tabs)');
      } else {
        navigateTo('/welcome');
      }
    }, 2200);

    return () => {
      unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, [router, scaleAnim, opacityAnim, user]);

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
