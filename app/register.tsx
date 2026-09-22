import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../components/auth/Logo';
import AuthInput from '../components/auth/AuthInput';
import { Colors } from '../constants/colors';
import { useUserStore, UserTier, UserRole } from '../store/userStore';
import { registerWithEmail, loginWithGoogle, firebaseErrorMessage } from '../lib/authService';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const selectedRole = (params.role as UserRole) || 'user';
  
  const { setUser } = useUserStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const validateEmail = (text: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);

  const handleSignUp = async () => {
    setNameError('');
    setEmailError('');
    setPasswordError('');
    
    let isValid = true;
    if (!name.trim()) { setNameError('Full name is required.'); isValid = false; }
    if (!email) { setEmailError('Email is required.'); isValid = false; }
    else if (!validateEmail(email)) { setEmailError('Please enter a valid email address.'); isValid = false; }
    if (!password) { setPasswordError('Password is required.'); isValid = false; }
    else if (password.length < 6) { setPasswordError('Password must be at least 6 characters.'); isValid = false; }

    if (!isValid) return;

    setIsLoading(true);
    try {
      const user = await registerWithEmail(name.trim(), email, password, selectedRole);
      setUser({ tier: UserTier.FREE, name: user.displayName || name.trim(), role: user.role, uid: user.uid });
      
      if (user.role === 'coach') {
        router.replace('/coach-onboarding');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setPasswordError(firebaseErrorMessage(err?.code || ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle(selectedRole); // Saves pending role and redirects
    } catch (err: any) {
      setIsGoogleLoading(false);
      Alert.alert('Google Sign Up Error', firebaseErrorMessage(err?.code || ''));
    }
  };

  const handleSocialLogin = (provider: 'Apple' | 'Google') => {
    Alert.alert(`${provider} Sign Up`, `Continue with ${provider} is not configured yet.`);
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
                Create <Text style={styles.titleHighlight}>Account</Text>
              </Text>
              <Text style={styles.subtitle}>
                {selectedRole === 'coach' ? 'Join as a Coach and grow your business.' : 'Join the ultimate fitness revolution.'}
              </Text>
            </View>

            <View style={styles.formContainer}>
              <AuthInput
                icon="person-outline"
                placeholder="Full Name"
                autoCapitalize="words"
                value={name}
                error={nameError}
                onChangeText={(text) => {
                  setName(text);
                  if (nameError) setNameError('');
                }}
              />

              <AuthInput
                icon="mail-outline"
                placeholder="Email address"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                error={emailError}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
              />
              
              <AuthInput
                icon="lock-closed-outline"
                placeholder="Password"
                isPassword
                value={password}
                error={passwordError}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                }}
              />

              <TouchableOpacity 
                style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled, { marginTop: 16 }]} 
                onPress={handleSignUp}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={styles.primaryBtnText}>Sign Up</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialLogin('Apple')} activeOpacity={0.7}>
                <Ionicons name="logo-apple" size={20} color="#FFF" style={styles.socialIcon} />
                <Text style={styles.socialBtnText}>Continue with Apple</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialLogin('Google')} activeOpacity={0.7}>
                <Ionicons name="logo-google" size={20} color="#FFF" style={styles.socialIcon} />
                <Text style={styles.socialBtnText}>Continue with Google</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.footerLink}>Sign In</Text>
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
  primaryBtn: {
    backgroundColor: '#000000',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.6 },
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
