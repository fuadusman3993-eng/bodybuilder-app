import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandLogo from '../components/ui/BrandLogo';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Background ambient radial glow effect */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      <View style={styles.contentWrapper}>
        {/* Top spacer to balance layout */}
        <View style={styles.topSpacer} />

        {/* Center: Brand Logo + Manifesto Tagline */}
        <View style={styles.brandContainer}>
          <View style={styles.logoWrapper}>
            <BrandLogo size="xlarge" showText={true} layout="column" />
          </View>

          <View style={styles.taglineContainer}>
            <Text style={styles.tagline}>
              Stronger Body. Sharper Mind.
            </Text>
            <Text style={styles.taglineSub}>
              Greater Goals.
            </Text>
          </View>
        </View>

        {/* Bottom CTA Actions */}
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/onboarding-quiz')}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.7}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.secondaryBtnText}>
              I already have an account
            </Text>
          </TouchableOpacity>
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
  ambientGlow: {
    position: 'absolute',
    top: '25%',
    left: '50%',
    width: 280,
    height: 280,
    marginLeft: -140,
    marginTop: -140,
    borderRadius: 140,
    backgroundColor: Colors.primary,
    opacity: 0.12,
    ...(Platform.OS === 'web'
      ? { filter: 'blur(90px)' }
      : { shadowColor: Colors.primary, shadowOpacity: 0.8, shadowRadius: 80, elevation: 20 }),
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 32,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  topSpacer: {
    height: 40,
  },
  brandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  taglineContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tagline: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 28,
  },
  taglineSub: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 28,
  },
  footerContainer: {
    width: '100%',
    gap: 14,
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    width: '100%',
    height: 56,
    borderRadius: 28, // Pill shape
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
