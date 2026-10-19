import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandLogo from '../components/ui/BrandLogo';
import { auth } from '../lib/firebase';

export default function SplashScreen() {
  const router = useRouter();
  
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

    // Fast, responsive splash hold (~1.2s) matching top-tier apps
    const timer = setTimeout(() => {
      if (auth.currentUser) {
        router.replace('/(tabs)');
      } else {
        router.replace('/welcome');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [router, scaleAnim, opacityAnim]);

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
