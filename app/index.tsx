import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useUserStore, UserTier } from '../store/userStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { setUser } = useUserStore();

  const handleLogin = () => {
    // Basic auth logic -> Sets User to FREE
    setUser({ tier: UserTier.FREE, name: email.split('@')[0] || 'Athlete' });
    router.replace('/(tabs)');
  };

  const handleGuest = () => {
    // Sets User to GUEST
    setUser({ tier: UserTier.GUEST, name: 'Guest' });
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        
        <View style={styles.logoContainer}>
          <Image source={require('../assets/icon.png')} style={styles.logo} />
          <Text style={styles.title}>BodyBuilder</Text>
          <Text style={styles.subtitle}>Stronger • Healthier • Together</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={Colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.8}>
            <Text style={styles.loginButtonText}>Log In / Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestButton} onPress={handleGuest} activeOpacity={0.8}>
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  formContainer: {
    gap: 16,
  },
  input: {
    backgroundColor: Colors.surface,
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  guestButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guestButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
