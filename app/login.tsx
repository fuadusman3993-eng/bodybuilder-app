import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../components/auth/Logo';
import AuthInput from '../components/auth/AuthInput';
import { Colors } from '../constants/colors';
import { useUserStore, UserTier } from '../store/userStore';
import { loginWithEmail, loginWithGoogle, firebaseErrorMessage } from '../lib/authService';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useUserStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [mainError, setMainError] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const validateEmail = (text: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);

  const handleSignIn = async () => {
    setEmailError('');
    setPasswordError('');
    setMainError('');

    let valid = true;
    if (!email) { setEmailError('Email is required.'); valid = false; }
    else if (!validateEmail(email)) { setEmailError('Please enter a valid email address.'); valid = false; }
    if (!password) { setPasswordError('Password is required.'); valid = false; }
    else if (password.length < 6) { setPasswordError('Password must be at least 6 characters.'); valid = false; }
    if (!valid) return;

    setIsLoading(true);
    try {
      const user = await loginWithEmail(email, password);
      setUser({ tier: UserTier.FREE, name: user.displayName || user.email || 'User' });
      router.replace('/(tabs)');
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
      setUser({ tier: UserTier.FREE, name: user.displayName || user.email || 'User' });
      router.replace('/(tabs)');
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setMainError(firebaseErrorMessage(err?.code || ''));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
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

            <View style={styles.header}>
              <Logo size="small" />
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                Welcome <Text style={styles.titleHighlight}>Back</Text>
              </Text>
              <Text style={styles.subtitle}>Sign in to continue your fitness journey.</Text>
            </View>

            <View style={styles.formContainer}>
              <AuthInput
                icon="mail-outline"
                placeholder="Email address"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                error={emailError}
                onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(''); }}
              />

              <AuthInput
                icon="lock-closed-outline"
                placeholder="Password"
                isPassword
                value={password}
                error={passwordError}
                onChangeText={(t) => { setPassword(t); if (passwordError) setPasswordError(''); }}
              />

              <View style={styles.forgotPasswordContainer}>
                <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              {mainError ? <Text style={styles.mainErrorText}>{mainError}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
                onPress={handleSignIn}
                disabled={isLoading || isGoogleLoading}
                activeOpacity={0.8}
              >
                {isLoading
                  ? <ActivityIndicator color={Colors.primary} />
                  : <Text style={styles.primaryBtnText}>Sign In</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialContainer}>
              {/* Apple — placeholder until native SDK is added */}
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => setMainError('Apple Sign In is not configured yet.')}
                activeOpacity={0.7}
              >
                <Ionicons name="logo-apple" size={20} color="#FFF" style={styles.socialIcon} />
                <Text style={styles.socialBtnText}>Continue with Apple</Text>
              </TouchableOpacity>

              {/* Google — real Firebase popup */}
              <TouchableOpacity
                style={[styles.socialBtn, isGoogleLoading && styles.btnDisabled]}
                onPress={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
                activeOpacity={0.7}
              >
                {isGoogleLoading
                  ? <ActivityIndicator color="#FFF" />
                  : (
                    <>
                      <Ionicons name="logo-google" size={20} color="#FFF" style={styles.socialIcon} />
                      <Text style={styles.socialBtnText}>Continue with Google</Text>
                    </>
                  )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/role-selection')}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 24,
    paddingBottom: 24,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  header: { alignItems: 'center', marginBottom: 32 },
  titleContainer: { alignItems: 'center', marginBottom: 32 },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  titleHighlight: { color: Colors.primary },
  subtitle: { color: '#AAAAAA', fontSize: 14 },
  formContainer: { marginBottom: 32 },
  forgotPasswordContainer: { alignItems: 'flex-end', marginBottom: 24 },
  forgotPasswordText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  mainErrorText: { color: '#EF4444', fontSize: 13, textAlign: 'center', marginBottom: 16 },
  primaryBtn: {
    backgroundColor: '#000000',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#333' },
  dividerText: { color: '#888', paddingHorizontal: 16, fontSize: 12 },
  socialContainer: { gap: 16, marginBottom: 32 },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#0A0A0A',
  },
  socialIcon: { marginRight: 12 },
  socialBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', paddingTop: 16 },
  footerText: { color: '#888', fontSize: 14 },
  footerLink: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
