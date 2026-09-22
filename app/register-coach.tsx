import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../components/auth/Logo';
import AuthInput from '../components/auth/AuthInput';
import { Colors } from '../constants/colors';
import { useUserStore, UserTier } from '../store/userStore';
import { registerWithEmail, loginWithGoogle, firebaseErrorMessage } from '../lib/authService';

export default function CoachRegisterScreen() {
  const router = useRouter();
  const { setUser } = useUserStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [mainError, setMainError] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const validateEmail = (t: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);

  const handleSignUp = async () => {
    setNameError(''); setEmailError(''); setPasswordError(''); setMainError('');
    let valid = true;
    if (!name.trim()) { setNameError('Full name is required.'); valid = false; }
    if (!email) { setEmailError('Email is required.'); valid = false; }
    else if (!validateEmail(email)) { setEmailError('Enter a valid email address.'); valid = false; }
    if (!password) { setPasswordError('Password is required.'); valid = false; }
    else if (password.length < 6) { setPasswordError('Password must be at least 6 characters.'); valid = false; }
    if (!valid) return;

    setIsLoading(true);
    try {
      const user = await registerWithEmail(name.trim(), email, password, 'coach');
      setUser({ tier: UserTier.FREE, name: user.displayName || name.trim(), role: 'coach', uid: user.uid });
      // Go to Coach professional info onboarding
      router.replace('/coach-onboarding');
    } catch (err: any) {
      setMainError(firebaseErrorMessage(err?.code || ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setMainError('');
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle('coach');
    } catch (err: any) {
      setIsGoogleLoading(false);
      setMainError(firebaseErrorMessage(err?.code || ''));
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="chevron-back" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={s.content}>
            <View style={s.logoWrap}>
              <Logo size="small" />
            </View>

            {/* Coach Badge */}
            <View style={s.badge}>
              <Ionicons name="stopwatch" size={16} color={Colors.primary} />
              <Text style={s.badgeText}>Coach Account</Text>
            </View>

            <Text style={s.title}>Create <Text style={s.accent}>Account</Text></Text>
            <Text style={s.subtitle}>Create programs, manage clients, and grow your coaching business.</Text>

            {/* Inputs */}
            <View style={s.form}>
              <AuthInput icon="person-outline" placeholder="Full Name" value={name} error={nameError}
                onChangeText={(t) => { setName(t); if (nameError) setNameError(''); }} />
              <AuthInput icon="mail-outline" placeholder="Email address" keyboardType="email-address"
                autoCapitalize="none" value={email} error={emailError}
                onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(''); }} />
              <AuthInput icon="lock-closed-outline" placeholder="Password" isPassword value={password}
                error={passwordError}
                onChangeText={(t) => { setPassword(t); if (passwordError) setPasswordError(''); }} />

              {mainError ? <Text style={s.mainError}>{mainError}</Text> : null}

              <TouchableOpacity style={[s.primaryBtn, isLoading && s.btnDisabled]} onPress={handleSignUp}
                disabled={isLoading || isGoogleLoading} activeOpacity={0.85}>
                {isLoading ? <ActivityIndicator color={Colors.primary} />
                  : <Text style={s.primaryBtnText}>Continue as Coach →</Text>}
              </TouchableOpacity>
              <Text style={s.nextHint}>Next: Add your professional info</Text>
            </View>

            <View style={s.dividerRow}>
              <View style={s.line} /><Text style={s.dividerText}>Or continue with</Text><View style={s.line} />
            </View>

            <View style={s.socialWrap}>
              <TouchableOpacity style={s.socialBtn} onPress={() => setMainError('Apple Sign In is not configured yet.')} activeOpacity={0.7}>
                <Ionicons name="logo-apple" size={20} color="#FFF" style={{ marginRight: 10 }} />
                <Text style={s.socialText}>Continue with Apple</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.socialBtn, isGoogleLoading && s.btnDisabled]} onPress={handleGoogleSignUp}
                disabled={isLoading || isGoogleLoading} activeOpacity={0.7}>
                {isGoogleLoading ? <ActivityIndicator color="#FFF" />
                  : <><Ionicons name="logo-google" size={20} color="#FFF" style={{ marginRight: 10 }} />
                    <Text style={s.socialText}>Continue with Google</Text></>}
              </TouchableOpacity>
            </View>

            <View style={s.footer}>
              <Text style={s.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={s.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scroll: { flexGrow: 1 },
  headerRow: { paddingHorizontal: 16, paddingTop: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)' },
  content: { flex: 1, paddingHorizontal: 24, paddingBottom: 32, maxWidth: 480, alignSelf: 'center', width: '100%' },
  logoWrap: { alignItems: 'center', marginVertical: 20 },
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6, marginBottom: 16 },
  badgeText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  title: { color: '#FFF', fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  accent: { color: Colors.primary },
  subtitle: { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  form: { marginBottom: 24 },
  mainError: { color: '#EF4444', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  primaryBtn: { backgroundColor: '#000', height: 52, borderRadius: 12, borderWidth: 1, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  nextHint: { color: '#555', fontSize: 11, textAlign: 'center', marginTop: 8 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#222' },
  dividerText: { color: '#666', paddingHorizontal: 14, fontSize: 12 },
  socialWrap: { gap: 14, marginBottom: 32 },
  socialBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#0A0A0A' },
  socialText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#888', fontSize: 14 },
  footerLink: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
});
