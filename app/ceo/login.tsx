import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import BrandLogo from '../../components/ui/BrandLogo';
import { loginCeo, isCeoAuthenticated } from '../../lib/ceoAuthService';

export default function CeoLoginScreen() {
  const router = useRouter();
  const [passcode, setPasscode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  // If already authenticated, redirect straight to dashboard
  useEffect(() => {
    isCeoAuthenticated().then((authenticated) => {
      if (authenticated) {
        router.replace('/ceo');
      } else {
        setCheckingSession(false);
      }
    });
  }, [router]);

  const handleLogin = async () => {
    if (!passcode.trim()) {
      setErrorMsg('Please enter the CEO Master Key.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const result = await loginCeo(passcode);
      if (result.success) {
        router.replace('/ceo');
      } else {
        setErrorMsg(result.message || 'Access denied.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Executive Shield Glow */}
          <View style={styles.glowOrb} pointerEvents="none" />

          <View style={styles.card}>
            {/* Logo */}
            <View style={styles.logoWrap}>
              <BrandLogo size="medium" showText={false} />
            </View>

            {/* Header Badge */}
            <View style={styles.badgePill}>
              <Ionicons name="shield-checkmark" size={12} color={Colors.primary} />
              <Text style={styles.badgePillText}>RESTRICTED EXECUTIVE GATE</Text>
            </View>

            <Text style={styles.title}>CEO Mission Control</Text>
            <Text style={styles.subtitle}>
              FitPulse System Operations, Telemetry, and Financial Oversight.
            </Text>

            {/* Error Banner */}
            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Passcode Input */}
            <View style={styles.inputWrap}>
              <Ionicons name="key-outline" size={18} color="#8A95A5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter CEO Master Key..."
                placeholderTextColor="#64748B"
                secureTextEntry={!showPass}
                value={passcode}
                onChangeText={(t) => {
                  setPasscode(t);
                  if (errorMsg) setErrorMsg('');
                }}
                onSubmitEditing={handleLogin}
                returnKeyType="go"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPass(!showPass)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPass ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#8A95A5"
                />
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.loginBtn}
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Ionicons name="lock-open-outline" size={18} color="#000" />
                  <Text style={styles.loginBtnText}>Access Command Center</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.footerNote}>
              <Ionicons name="information-circle-outline" size={13} color="#64748B" />
              <Text style={styles.footerNoteText}>
                Encrypted session • Automatically logs out after 30 days of inactivity.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050B0E',
  },
  centerLoading: {
    flex: 1,
    backgroundColor: '#050B0E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  glowOrb: {
    position: 'absolute',
    top: '20%',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Colors.primary,
    opacity: 0.12,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0D161F',
    borderWidth: 1,
    borderColor: '#192C3C',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },
  logoWrap: {
    marginBottom: 16,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 5,
    marginBottom: 14,
  },
  badgePillText: {
    color: Colors.primary,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: '#8A95A5',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#F87171',
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 48,
    backgroundColor: '#15222E',
    borderWidth: 1,
    borderColor: '#223647',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  eyeBtn: {
    padding: 6,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  footerNoteText: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
  },
});
