import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../constants/colors';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const buttonStyle = [
    styles.base,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    (disabled || loading) && styles.disabled,
    style,
  ];

  const labelStyle = [
    styles.label,
    styles[`label_${size}`],
    styles[`labelColor_${variant}`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.background : Colors.primary} size="small" />
      ) : (
        <>
          {icon}
          <Text style={labelStyle}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    gap: 8,
  },
  size_sm: { height: 40, paddingHorizontal: 16 },
  size_md: { height: 52, paddingHorizontal: 24 },
  size_lg: { height: 60, paddingHorizontal: 32 },
  variant_primary: { backgroundColor: Colors.primary },
  variant_secondary: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  variant_ghost: { backgroundColor: 'transparent' },
  variant_danger: { backgroundColor: '#EF4444' },
  disabled: { opacity: 0.45 },
  label: { fontWeight: '700' },
  label_sm: { fontSize: 13 },
  label_md: { fontSize: 15 },
  label_lg: { fontSize: 17 },
  labelColor_primary: { color: Colors.background },
  labelColor_secondary: { color: Colors.textPrimary },
  labelColor_ghost: { color: Colors.primary },
  labelColor_danger: { color: '#FFF' },
});
