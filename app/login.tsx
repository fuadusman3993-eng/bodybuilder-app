import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import BrandLogo from '../components/ui/BrandLogo';
import AuthInput from '../components/auth/AuthInput';
import { Colors } from '../constants/colors';
import { useUserStore, UserTier } from '../store/userStore';
import { loginWithEmail, loginWithGoogle, signOut, firebaseErrorMessage } from '../lib/authService';
import { saveLastAccount } from '../lib/savedAccountService';
import { registerOrValidateDevice } from '../lib/deviceSecurityService';
import DeviceVerificationModal from '../components/auth/DeviceVerificationModal';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Save user profile to Firestore (merge so existing data stays)
const saveAndCheckUser = async (uid: string, name: string, email: string) => {
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    let isProfileComplete = false;
    let existingProfileData: any = null;

    if (snap.exists()) {
      isProfileComplete = !!snap.data().country; // Country is required in create-profile
    }

    // Check if an account already exists with this email under any document in Firestore
    if (email) {
      try {
        const q = query(collection(db, 'users'), where('email', '==', email));
        const querySnap = await getDocs(q);
        querySnap.forEach((d) => {
          const data = d.data();
          if (data && (data.country || data.username || data.role || data.city)) {
            existingProfileData = data;
            isProfileComplete = true;
          }
        });
      } catch (err) {
        console.warn('Could not query users by email:', err);
      }
    }

    // Set user data, copying over any existing profile information
    const dataToSave: any = {
      name: existingProfileData?.name || name,
      email,
      updatedAt: serverTimestamp(),
    };

    if (existingProfileData?.country) dataToSave.country = existingProfileData.country;
    if (existingProfileData?.city) dataToSave.city = existingProfileData.city;
    if (existingProfileData?.username) dataToSave.username = existingProfileData.username;
    if (existingProfileData?.role) dataToSave.role = existingProfileData.role;
    if (existingProfileData?.avatar) dataToSave.avatar = existingProfileData.avatar;
    if (existingProfileData?.photoURL) dataToSave.photoURL = existingProfileData.photoURL;

    if (!snap.exists()) {
      dataToSave.uid = uid;
      dataToSave.role = existingProfileData?.role || 'user';
      dataToSave.createdAt = serverTimestamp();
    }

    if (!snap.exists() || !snap.data().username) {
      if (!dataToSave.username) {
        dataToSave.username = email.split('@')[0];
      }
    }

    await setDoc(docRef, dataToSave, { merge: true });
    return isProfileComplete;
  } catch (e) {
    console.warn('Firestore save failed', e);
    return true; // Fallback to tabs to avoid getting stuck
  }
};

function GoogleColorIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </Svg>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { prefillEmail } = useLocalSearchParams<{ prefillEmail?: string }>();
  const { setUser } = useUserStore();

  const [email, setEmail] = useState(prefillEmail || '');
  const [password, setPassword] = useState('');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [mainError, setMainError] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Two-Device 2FA State
  const [pending2FAUser, setPending2FAUser] = useState<{ uid: string; isComplete: boolean } | null>(null);
  const [show2FAModal, setShow2FAModal] = useState(false);

  useEffect(() => {
    // Respect Android hardware back button to navigate back cleanly
    const onBackPress = () => {
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      router.replace('/welcome');
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [router]);

  const validateEmail = (text: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);

  const handleSignIn = async () => {
    setEmailError('');
    setPasswordError('');
    setMainError('');

    let valid = true;
    if (!email.trim()) {
      setEmailError('Email is required.');
      valid = false;
    } else if (!validateEmail(email.trim())) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      valid = false;
    }

    if (!valid) return;

    setIsLoading(true);
    try {
      const user = await loginWithEmail(email.trim(), password);
      const name = user.displayName || user.email?.split('@')[0] || 'User';
      const isComplete = await saveAndCheckUser(user.uid, name, user.email || '');

      // Check multi-device security rules (Max 2 devices)
      const devResult = await registerOrValidateDevice(user.uid);

      if (devResult.status === 'LIMIT_REACHED') {
        await signOut().catch(() => {});
        setMainError(
          'Device limit reached (Max 2 devices). Please sign out from another device in Settings.'
        );
        return;
      }

      setUser({ uid: user.uid, tier: UserTier.FREE, name });

      // Save for quick One-Tap login suggestion next time
      await saveLastAccount({
        uid: user.uid,
        name,
        email: user.email || email.trim(),
        authProvider: 'password',
      });

      if (devResult.status === 'REQUIRES_2FA') {
        setPending2FAUser({ uid: user.uid, isComplete });
        setShow2FAModal(true);
        return;
      }

      if (isComplete) {
        router.replace('/(tabs)');
      } else {
        router.replace('/create-profile');
      }
    } catch (err: any) {
      setMainError(firebaseErrorMessage(err?.code || ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setMainError('');
    setIsGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      const name = user.displayName || user.email?.split('@')[0] || 'User';
      const isComplete = await saveAndCheckUser(user.uid, name, user.email || '');

      const devResult = await registerOrValidateDevice(user.uid);

      if (devResult.status === 'LIMIT_REACHED') {
        await signOut().catch(() => {});
        setMainError(
          'Device limit reached (Max 2 devices). Please sign out from another device in Settings.'
        );
        return;
      }

      setUser({ uid: user.uid, tier: UserTier.FREE, name });

      await saveLastAccount({
        uid: user.uid,
        name,
        email: user.email || '',
        avatar: user.photoURL || undefined,
        authProvider: 'google',
      });

      if (devResult.status === 'REQUIRES_2FA') {
        setPending2FAUser({ uid: user.uid, isComplete });
        setShow2FAModal(true);
        return;
      }

      router.replace('/(tabs)');
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setMainError(firebaseErrorMessage(err?.code || ''));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handle2FASuccess = () => {
    setShow2FAModal(false);
    if (pending2FAUser?.isComplete) {
      router.replace('/(tabs)');
    } else {
      router.replace('/create-profile');
    }
    setPending2FAUser(null);
  };

  const handle2FACancel = async () => {
    setShow2FAModal(false);
    setPending2FAUser(null);
    await signOut().catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* ── 1. Top Navigation Bar (FitPulse Style: Chevron Back + Brand Logo + Secure Badge) ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.topBarBrand}>
          <BrandLogo size="small" showText={false} />
        </View>

        <View style={styles.shieldBadge}>
          <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
          <Text style={styles.shieldText}>SECURE</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentWrapper}>
            {/* ── 2. Clean Modern Header (FitPulse Style) ── */}
            <View style={styles.header}>
              <Text style={styles.title}>
                Welcome <Text style={styles.titleHighlight}>Back</Text>
              </Text>
              <Text style={styles.subtitle}>
                Enter your email address and password to continue.
              </Text>
            </View>

            {/* ── 3. Ultra-Clean Inputs (Neon Focus Glow) ── */}
            <View style={styles.formContainer}>
              <AuthInput
                icon="mail-outline"
                placeholder="Email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                error={emailError}
                onChangeText={(t) => {
                  setEmail(t);
                  if (emailError) setEmailError('');
                  if (mainError) setMainError('');
                }}
              />

              <AuthInput
                icon="lock-closed-outline"
                placeholder="Password"
                isPassword
                value={password}
                error={passwordError}
                onChangeText={(t) => {
                  setPassword(t);
                  if (passwordError) setPasswordError('');
                  if (mainError) setMainError('');
                }}
              />

              {/* Forgot password aligned right */}
              <View style={styles.forgotPassContainer}>
                <TouchableOpacity
                  onPress={() => router.push('/forgot-password')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotPassText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              {/* Inline Error Banner if any */}
              {mainError ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                  <Text style={styles.errorBannerText}>{mainError}</Text>
                </View>
              ) : null}

              {/* ── 4. High-Contrast FitPulse Sign In Button ── */}
              <TouchableOpacity
                style={[styles.primaryBtn, (isLoading || isGoogleLoading) && styles.btnDisabled]}
                onPress={handleSignIn}
                disabled={isLoading || isGoogleLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <View style={styles.btnInner}>
                    <Text style={styles.primaryBtnText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={18} color="#000000" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* ── 5. Clean Divider ── */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ── 6. Minimalist Single Google Pill Button ── */}
            <TouchableOpacity
              style={[styles.googleBtn, isGoogleLoading && styles.btnDisabled]}
              onPress={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
              activeOpacity={0.75}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.googleBtnInner}>
                  <GoogleColorIcon size={20} />
                  <Text style={styles.googleBtnText}>Google</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* ── 7. Footer Sign Up Link ── */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/role-selection')}
                activeOpacity={0.7}
              >
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {pending2FAUser && (
        <DeviceVerificationModal
          visible={show2FAModal}
          uid={pending2FAUser.uid}
          onSuccess={handle2FASuccess}
          onCancel={handle2FACancel}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 10 : 6,
    paddingBottom: 10,
  },
  topBarBrand: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  shieldText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  titleHighlight: {
    color: Colors.primary,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  formContainer: {
    width: '100%',
    marginBottom: 16,
  },
  forgotPassContainer: {
    alignItems: 'flex-end',
    marginTop: -4,
    marginBottom: 20,
  },
  forgotPassText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#F87171',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    color: '#64748B',
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '500',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: '#0E131F',
    paddingHorizontal: 28,
    marginBottom: 16,
  },
  googleBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  googleBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  footerLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
});
