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
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../components/auth/Logo';
import AuthInput from '../components/auth/AuthInput';
import { Colors } from '../constants/colors';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const validateEmail = (text: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(text);
  };

  const handleReset = () => {
    setEmailError('');
    
    if (!email) {
      setEmailError('Email is required.');
      return;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    // Mock API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1500);
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
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.contentWrapper}>
            
            <View style={styles.header}>
              <Logo size="small" />
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                Reset <Text style={styles.titleHighlight}>Password</Text>
              </Text>
              <Text style={styles.subtitle}>
                {isSent 
                  ? "We've sent a password reset link to your email." 
                  : "Enter your email address to receive a password reset link."}
              </Text>
            </View>

            {!isSent ? (
              <View style={styles.formContainer}>
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

                <TouchableOpacity 
                  style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled, { marginTop: 16 }]} 
                  onPress={handleReset}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.primary} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.formContainer}>
                <TouchableOpacity 
                  style={styles.primaryBtn} 
                  onPress={() => router.back()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryBtnText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            )}

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
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  header: { alignItems: 'center', marginBottom: 32 },
  titleContainer: { alignItems: 'center', marginBottom: 40 },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  titleHighlight: { color: Colors.primary },
  subtitle: { color: '#AAAAAA', fontSize: 14, textAlign: 'center', lineHeight: 20 },
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
});
