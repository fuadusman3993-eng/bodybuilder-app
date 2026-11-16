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
    // Smoothly fade out and remove the HTML preloader once React mounts
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const preloader = document.getElementById('fp-preloader');
      if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => {
          try {
            preloader.remove();
          } catch (_) {}
        }, 250);
      }
    }

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
    // Splash screen entrance duration: 650ms (matches smooth logo animation)
    const MIN_SPLASH_MS = 650;

    const navigateTo = (route: string) => {
      if (hasNavigated) return;
      hasNavigated = true;
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, MIN_SPLASH_MS - elapsed);
      setTimeout(() => {
        router.replace(route as any);
      }, remainingDelay);
    };

    // Instant synchronous auth check from Zustand / localStorage:
    // Eliminates the 1.5 - 3s Firebase network roundtrip lag!
    const storedUser = userRef.current;
    if (storedUser?.uid && storedUser.tier !== UserTier.GUEST) {
      // Returning logged-in user -> Immediately navigate to app tabs
      navigateTo('/(tabs)');
      return;
    }

    // For new/guest users, listen for Firebase auth or proceed to /welcome in 650ms
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        navigateTo('/(tabs)');
      } else {
        navigateTo('/welcome');
      }
    });

    // Fallback safety timer — max 650ms so new users are never blocked
    const fallbackTimer = setTimeout(() => {
      navigateTo('/welcome');
    }, MIN_SPLASH_MS);

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
    // Branded splash is always pure black #000000 with theme-glowing FitPulse logo
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
