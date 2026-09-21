import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface AuthInputProps extends TextInputProps {
  icon: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  error?: string;
}

export default function AuthInput({ icon, isPassword, error, ...props }: AuthInputProps) {
  const [isSecure, setIsSecure] = useState(isPassword);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, isFocused && styles.containerFocused, error ? styles.containerError : null]}>
        <Ionicons name={icon} size={20} color={isFocused ? Colors.primary : "#666"} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholderTextColor="#666"
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setIsSecure(!isSecure)} style={styles.eyeIcon} activeOpacity={0.7}>
            <Ionicons name={isSecure ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    height: 56,
    paddingHorizontal: 16,
  },
  containerFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#111',
  },
  containerError: {
    borderColor: '#EF4444',
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
    marginRight: -8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
});
