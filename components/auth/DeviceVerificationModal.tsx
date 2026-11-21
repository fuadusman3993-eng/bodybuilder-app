import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useTheme } from '../../store/themeStore';
import { verifyDeviceCode, registerOrValidateDevice } from '../../lib/deviceSecurityService';

interface DeviceVerificationModalProps {
  visible: boolean;
  uid: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DeviceVerificationModal({
  visible,
  uid,
  onSuccess,
  onCancel,
}: DeviceVerificationModalProps) {
  const { colors } = useTheme();
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Countdown timer for resend
  useEffect(() => {
    let timer: any;
    if (visible && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible, resendCooldown]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setDigits(['', '', '', '', '', '']);
      setError(null);
      setResendCooldown(60);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
    }
  }, [visible]);

  const handleDigitChange = (val: string, index: number) => {
    setError(null);

    // Handle paste of full 6-digit code
    if (val.length > 1) {
      const clean = val.replace(/\D/g, '').slice(0, 6);
      if (clean.length > 0) {
        const newDigits = [...digits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = clean[i] || '';
        }
        setDigits(newDigits);
        const focusIdx = Math.min(clean.length, 5);
        inputRefs.current[focusIdx]?.focus();

        // If completed 6 digits, auto submit
        if (clean.length === 6) {
          triggerVerification(newDigits.join(''));
        }
        return;
      }
    }

    const singleDigit = val.slice(-1).replace(/\D/g, '');
    const newDigits = [...digits];
    newDigits[index] = singleDigit;
    setDigits(newDigits);

    if (singleDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto verify if last digit entered
    if (singleDigit && index === 5) {
      const fullCode = newDigits.join('');
      if (fullCode.length === 6) {
        triggerVerification(fullCode);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const triggerVerification = async (codeToVerify?: string) => {
    const code = codeToVerify || digits.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await verifyDeviceCode(uid, code);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || 'Invalid code. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Verification error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      await registerOrValidateDevice(uid);
      setResendCooldown(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface || '#161616', borderColor: colors.border || '#262626' }]}>
          {/* Header Icon */}
          <View style={[styles.shieldCircle, { backgroundColor: '#000000', borderColor: colors.primary }]}>
            <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
          </View>

          {/* Title & Description */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>Device Verification</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            A 6-digit login verification code was sent to your active device via the{' '}
            <Text style={{ color: colors.primary, fontWeight: '700' }}>FitPulse Official Chat</Text>.
          </Text>

          <View style={styles.limitNotice}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.limitNoticeText, { color: colors.textMuted }]}>
              Two-Device Limit: Authorizing this phone as Device 2 of 2.
            </Text>
          </View>

          {/* 6 Digit Input Boxes */}
          <View style={styles.digitsRow}>
            {digits.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={(ref) => {
                  inputRefs.current[idx] = ref;
                }}
                style={[
                  styles.digitInput,
                  {
                    backgroundColor: colors.surfaceLight || '#202020',
                    borderColor: digit ? colors.primary : colors.border || '#333333',
                    color: colors.textPrimary || '#FFFFFF',
                  },
                ]}
                keyboardType="number-pad"
                maxLength={6}
                value={digit}
                onChangeText={(val) => handleDigitChange(val, idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
                selectTextOnFocus
                textAlign="center"
              />
            ))}
          </View>

          {/* Error Message */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Action Buttons */}
          <TouchableOpacity
            style={[styles.verifyButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={() => triggerVerification()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify & Authorize Device</Text>
            )}
          </TouchableOpacity>

          {/* Resend Action */}
          <TouchableOpacity
            style={styles.resendBtn}
            activeOpacity={0.7}
            onPress={handleResendCode}
            disabled={resendCooldown > 0 || resending}
          >
            {resending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text
                style={[
                  styles.resendText,
                  { color: resendCooldown > 0 ? colors.textMuted : colors.primary },
                ]}
              >
                {resendCooldown > 0
                  ? `Resend code via FitPulse Chat (${resendCooldown}s)`
                  : 'Resend code via FitPulse Chat'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.7} onPress={onCancel}>
            <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 18,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65)',
      },
    }),
  },
  shieldCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  limitNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  limitNoticeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  digitsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    width: '100%',
  },
  digitInput: {
    width: 46,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 14,
    paddingHorizontal: 10,
  },
  verifyButton: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  verifyButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
  resendBtn: {
    marginTop: 16,
    paddingVertical: 6,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: 10,
    paddingVertical: 6,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
