import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from '../components/auth/Logo';
import { Colors } from '../constants/colors';

export default function SplashScreen() {
  const router = useRouter();
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate the progress bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start();

    // Navigate to permissions after 2.5 seconds
    const timer = setTimeout(() => {
      router.replace('/permissions');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Logo size="large" />
        <Text style={styles.tagline}>Empowering your fitness & health</Text>
        <Text style={styles.subTagline}>Simpler. Faster. Better.</Text>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBarFill, { width: progressBarWidth }]} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    letterSpacing: 0.5,
  },
  subTagline: {
    color: '#888888',
    fontSize: 14,
    marginTop: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 80,
    width: '100%',
    alignItems: 'center',
  },
  progressBarContainer: {
    width: 140,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  }
});
