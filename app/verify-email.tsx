import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { sendOTPEmail } from '../lib/emailjs';
import { Colors } from '../constants/colors';
import { useUserStore, UserTier } from '../store/userStore';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email, name, password, otp: initialOtp, role } = useLocalSearchParams<{
    email: string; name: string; password: string; otp: string; role: 'user'|'coach';
  }>();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [currentOtp, setCurrentOtp] = useState(initialOtp || '');

  const { setUser } = useUserStore();

  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleInput = (text: string, index: number) => {
    setError('');

    // Handle paste: if 6+ digits entered at once, distribute across all boxes
    const digits = text.replace(/[^0-9]/g, '');
    if (digits.length >= 6) {
      const newCode = digits.slice(0, 6).split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      return;
    }

    const digit = digits.slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (!digit && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const entered = code.join('');
    if (entered.length < 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    if (entered !== currentOtp) {
      setError('Incorrect code. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      return;
    }

    setIsVerifying(true);
    try {
      // 1. OTP is correct, NOW we register the user in Firebase
      const { registerWithEmail } = await import('../lib/authService');
      const user = await registerWithEmail(name, email, password, role);
      setUser({ tier: UserTier.FREE, name: user.displayName || name, role, uid: user.uid });

      // 2. Mark as verified in Firestore
      if (user.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          emailVerified: true,
          verifiedAt: serverTimestamp(),
        });
      }

      // 3. Proceed to next screen
      router.replace('/create-profile');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setIsResending(true);
    setError('');
    try {
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      await sendOTPEmail(email, name, newOtp);
      setCurrentOtp(newOtp);
      setCode(['', '', '', '', '', '']);
      setResendTimer(60);
      inputRefs.current[0]?.focus();
      Alert.alert('Code Sent!', 'A new verification code has been sent to your email.');
    } catch (err) {
      setError('Failed to resend. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={s.container}>

          {/* Back */}
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>

          {/* Icon */}
          <View style={s.iconWrap}>
            <Ionicons name="mail-unread" size={48} color={Colors.primary} />
          </View>

          <Text style={s.title}>Check your email</Text>
          <Text style={s.subtitle}>
            We sent a 6-digit verification code to{'\n'}
            <Text style={s.emailText}>{email}</Text>
          </Text>

          {/* OTP Boxes */}
          <View style={s.codeRow}>
            {code.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputRefs.current[i] = ref; }}
                style={[s.codeBox, digit && s.codeBoxFilled, error && s.codeBoxError]}
                value={digit}
                onChangeText={(t) => handleInput(t, i)}
                keyboardType="number-pad"
                maxLength={i === 0 ? 6 : 1}
                selectTextOnFocus
                caretHidden
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
              />
            ))}
          </View>

          {error ? <Text style={s.errorText}>{error}</Text> : null}

          {/* Verify Button */}
          <TouchableOpacity
            style={[s.verifyBtn, (isVerifying || code.join('').length < 6) && s.btnDisabled]}
            onPress={handleVerify}
            disabled={isVerifying || code.join('').length < 6}
            activeOpacity={0.85}
          >
            {isVerifying
              ? <ActivityIndicator color="#000" />
              : <Text style={s.verifyBtnText}>Verify Email</Text>}
          </TouchableOpacity>

          {/* Resend */}
          <View style={s.resendRow}>
            <Text style={s.resendLabel}>Didn't receive the code? </Text>
            <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0 || isResending}>
              {isResending
                ? <ActivityIndicator color={Colors.primary} size="small" />
                : <Text style={[s.resendLink, resendTimer > 0 && s.resendDisabled]}>
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
                  </Text>}
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, paddingHorizontal: 28, paddingTop: 16, maxWidth: 480, width: '100%', alignSelf: 'center' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 40 },
  iconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(16,185,129,0.1)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 28 },
  title: { color: '#FFF', fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  subtitle: { color: '#888', fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  emailText: { color: Colors.primary, fontWeight: '600' },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 16 },
  codeBox: {
    width: 50, height: 58, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#2A2A2A',
    backgroundColor: '#0D0D0D',
    color: '#FFF', fontSize: 24, fontWeight: '700', textAlign: 'center',
  },
  codeBoxFilled: { borderColor: Colors.primary },
  codeBoxError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 13, textAlign: 'center', marginBottom: 20 },
  verifyBtn: { backgroundColor: Colors.primary, height: 56, borderRadius: 100, justifyContent: 'center', alignItems: 'center', marginBottom: 24, marginTop: 8 },
  btnDisabled: { opacity: 0.5 },
  verifyBtnText: { color: '#000', fontSize: 17, fontWeight: '700' },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  resendLabel: { color: '#666', fontSize: 14 },
  resendLink: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
  resendDisabled: { color: '#555' },
});
