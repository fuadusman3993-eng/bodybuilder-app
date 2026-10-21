import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import {
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  processCardPayment,
  CardDetails,
} from '../../lib/paymentGateways';
import { formatCurrency, CurrencyCode } from '../../lib/currencyService';

interface CardPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  coins: number;
  price: number;
  currency: CurrencyCode;
  onSuccess: (ref: string) => Promise<void>;
}

export default function CardPaymentModal({
  visible,
  onClose,
  coins,
  price,
  currency,
  onSuccess,
}: CardPaymentModalProps) {
  const [name, setName]         = useState('');
  const [number, setNumber]     = useState('');
  const [expiry, setExpiry]     = useState('');
  const [cvc, setCvc]           = useState('');
  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const brand = detectCardBrand(number);

  const handlePay = async () => {
    setErrorMsg('');
    const parts = expiry.split('/');
    const cardData: CardDetails = {
      cardholderName: name,
      cardNumber: number,
      expiryMonth: parts[0] || '',
      expiryYear: parts[1] || '',
      cvc,
    };

    setLoading(true);
    try {
      const res = await processCardPayment(cardData, price, currency);
      if (!res.success) {
        setErrorMsg(res.error || 'Payment failed. Please check your card.');
        return;
      }
      await onSuccess(res.reference || `Card ****${number.replace(/\D/g, '').slice(-4)}`);
      onClose();
      // Reset form
      setName('');
      setNumber('');
      setExpiry('');
      setCvc('');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Payment failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={s.sheet} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={s.handle} />

          {/* Header */}
          <View style={s.headerRow}>
            <View>
              <Text style={s.title}>Card Payment</Text>
              <Text style={s.subtitle}>
                Top up 🪙 {coins} Coins for {formatCurrency(price, currency)}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Ionicons name="close" size={22} color="#8A95A5" />
            </TouchableOpacity>
          </View>

          {/* Error Message if any */}
          {errorMsg !== '' && (
            <View style={s.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={s.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Form */}
          <View style={s.form}>
            {/* Cardholder Name */}
            <Text style={s.label}>Cardholder Name</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. John Doe"
              placeholderTextColor="#555"
              autoCapitalize="words"
            />

            {/* Card Number */}
            <Text style={s.label}>Card Number</Text>
            <View style={s.inputWithIcon}>
              <TextInput
                style={[s.input, { flex: 1, borderWidth: 0 }]}
                value={number}
                onChangeText={(t) => setNumber(formatCardNumber(t))}
                placeholder="4242 4242 4242 4242"
                placeholderTextColor="#555"
                keyboardType="numeric"
                maxLength={19}
              />
              <View style={s.brandBadge}>
                <Ionicons
                  name={brand === 'visa' || brand === 'mastercard' ? 'card' : 'card-outline'}
                  size={20}
                  color={brand === 'visa' ? '#60A5FA' : brand === 'mastercard' ? '#F87171' : Colors.primary}
                />
                <Text style={s.brandText}>{brand.toUpperCase()}</Text>
              </View>
            </View>

            {/* Expiry & CVC */}
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Expires (MM/YY)</Text>
                <TextInput
                  style={s.input}
                  value={expiry}
                  onChangeText={(t) => setExpiry(formatExpiry(t))}
                  placeholder="MM/YY"
                  placeholderTextColor="#555"
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>CVC / CVV</Text>
                <TextInput
                  style={s.input}
                  value={cvc}
                  onChangeText={(t) => setCvc(t.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  placeholderTextColor="#555"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>

            {/* Pay Button */}
            <TouchableOpacity
              style={[s.payBtn, loading && { opacity: 0.6 }]}
              onPress={handlePay}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <View style={s.payBtnInner}>
                  <Ionicons name="lock-closed" size={16} color="#000" />
                  <Text style={s.payBtnText}>
                    Pay {formatCurrency(price, currency)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Security Footer */}
            <View style={s.securityRow}>
              <Ionicons name="shield-checkmark" size={14} color="#34D399" />
              <Text style={s.securityText}>256-bit SSL Encrypted • Powered by Stripe</Text>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0F171E',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    borderWidth: 1,
    borderColor: '#1D2A36',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { fontSize: 13, color: '#8A95A5', marginTop: 2 },
  closeBtn: { padding: 4 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: { color: '#F87171', fontSize: 12.5, flex: 1 },
  form: { gap: 12 },
  label: { fontSize: 12, fontWeight: '700', color: '#8A95A5', textTransform: 'uppercase', letterSpacing: 0.6 },
  input: {
    backgroundColor: '#15212B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#223242',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15212B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#223242',
    paddingRight: 10,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1F303E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  brandText: { color: '#E2E8F0', fontSize: 10, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 12 },
  payBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  payBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  payBtnText: { color: '#000', fontSize: 15.5, fontWeight: '800' },
  securityRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 10 },
  securityText: { fontSize: 11.5, color: '#8A95A5' },
});
