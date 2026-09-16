import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

interface GuestBlockerProps {
  title: string;
  description: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function GuestBlocker({ title, description, icon = 'lock-closed-outline' }: GuestBlockerProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={64} color={Colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      
      <TouchableOpacity 
        style={styles.signupButton} 
        activeOpacity={0.8}
        onPress={() => router.replace('/')} // Go to login/signup
      >
        <Text style={styles.signupButtonText}>Create Free Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  signupButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  signupButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
});
