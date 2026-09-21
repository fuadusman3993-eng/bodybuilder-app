import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../components/auth/Logo';
import AuthInput from '../components/auth/AuthInput';
import { Colors } from '../constants/colors';
import { useUserStore, UserTier } from '../store/userStore';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (text: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(text);
  };

  const handleSignIn = () => {
    setError('');
    
    if (!email) {
      setError('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);

    // Mock API call
    setTimeout(() => {
      setIsLoading(false);
      // For phase 1, mock login success
      setUser({ tier: UserTier.FREE, name: 'User' });
      router.replace('/(tabs)');
    }, 1500);
  };

  const handleSocialLogin = (provider: 'Apple' | 'Google') => {
    // integration point
    console.log(`Continue with ${provider}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Logo size="small" />
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              Welcome <Text style={styles.titleHighlight}>Back</Text>
            </Text>
            <Text style={styles.subtitle}>
              Sign in to continue your fitness journey.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <AuthInput
              icon="mail-outline"
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError('');
              }}
            />
            
            <AuthInput
              icon="lock-closed-outline"
              placeholder="Password"
              isPassword
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
            />

            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity onPress={() => console.log('Forgot Password nav')}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.mainErrorText}>{error}</Text> : null}

            <TouchableOpacity 
              style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]} 
              onPress={handleSignIn}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Text style={styles.primaryBtnText}>Sign In</Text>
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
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => console.log('Sign Up nav')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
  },
  titleHighlight: {
    color: Colors.primary,
  },
  subtitle: {
    color: '#AAAAAA',
    fontSize: 15,
  },
  formContainer: {
    marginBottom: 32,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  mainErrorText: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: '#000000',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#888',
    paddingHorizontal: 16,
    fontSize: 12,
  },
  socialContainer: {
    gap: 16,
    marginBottom: 40,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#0A0A0A',
  },
  socialIcon: {
    marginRight: 12,
  },
  socialBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 20,
  },
  footerText: {
    color: '#888',
    fontSize: 14,
  },
  footerLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
