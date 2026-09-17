import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore, UserTier } from '../store/userStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { setUser } = useUserStore();

  const handleLogin = () => {
    setUser({ tier: UserTier.FREE, name: email.split('@')[0] || 'Athlete' });
    router.replace('/(tabs)');
  };

  const handleGuest = () => {
    setUser({ tier: UserTier.GUEST, name: 'Guest' });
    router.replace('/(tabs)');
  };

  const handleSignUp = () => {
    handleLogin();
  };

  return (
    <View style={styles.root}>
      {/* Fixed full-screen background */}
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80' }}
        style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }]}
        resizeMode="cover"
      />
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo & Branding */}
            <View style={styles.brandingContainer}>
              <View style={styles.logoRow}>
                <View style={styles.logoBox}>
                  <Ionicons name="barbell-outline" size={28} color="#10B981" />
                </View>
                <View style={styles.brandText}>
                  <Text style={styles.appName}>BodyBuilder</Text>
                  <Text style={styles.appTagline}>Stronger • Healthier • Happier</Text>
                </View>
              </View>

              <View style={styles.heroText}>
                <Text style={styles.heroTitle}>Your Goal.{'\n'}Our Mission.</Text>
                <Text style={styles.heroSubtitle}>
                  Build your best version with{'\n'}the right support, tools and community.
                </Text>
                <View style={styles.dots}>
                  <View style={[styles.dot, styles.dotActive]} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
              </View>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              {/* Email */}
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email or Phone Number"
                  placeholderTextColor="#888"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password */}
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#888"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#888" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.forgotContainer}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Log In */}
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.85}>
                <Text style={styles.loginButtonText}>Log In</Text>
                <Ionicons name="arrow-forward" size={18} color="#000" />
              </TouchableOpacity>

              {/* OR Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Buttons */}
              <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialButton} activeOpacity={0.85} onPress={handleLogin}>
                  <Text style={styles.socialIcon}>G</Text>
                  <Text style={styles.socialText} numberOfLines={1}>Continue with Google</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton} activeOpacity={0.85} onPress={handleLogin}>
                  <Ionicons name="logo-apple" size={20} color="#FFF" />
                  <Text style={styles.socialText} numberOfLines={1}>Continue with Apple</Text>
                </TouchableOpacity>
              </View>

              {/* Sign Up Row */}
              <View style={styles.signupRow}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <TouchableOpacity onPress={handleSignUp}>
                  <Text style={styles.signupLink}>Sign Up →</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.guestButton} onPress={handleGuest} activeOpacity={0.7}>
                <Text style={styles.guestText}>Continue as Guest</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  brandingContainer: {
    paddingTop: 24,
    flex: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
  },
  brandText: {
    flexShrink: 1,
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  appTagline: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 2,
  },
  heroText: {
    marginTop: 16,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFF',
    lineHeight: 44,
    letterSpacing: -0.5,
    marginBottom: 14,
    flexShrink: 1,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#CCC',
    lineHeight: 22,
    marginBottom: 24,
    flexShrink: 1,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#10B981',
    width: 20,
  },
  formContainer: {
    paddingTop: 24,
    gap: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    minHeight: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  inputIcon: {
    marginRight: 12,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#FFF',
    paddingVertical: 14,
  },
  eyeButton: {
    padding: 4,
    flexShrink: 0,
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  forgotText: {
    color: '#CCC',
    fontSize: 13,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#FFF',
    minHeight: 56,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 24,
  },
  loginButtonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dividerText: {
    color: '#888',
    fontSize: 13,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    minHeight: 52,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  socialIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    flexShrink: 0,
  },
  socialText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 2,
  },
  signupText: {
    color: '#888',
    fontSize: 14,
  },
  signupLink: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  guestButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  guestText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
