import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../store/userStore';
import { CurrencyCode, formatCurrency } from '../../lib/currencyService';
import FitPulseCoinSvg from '../ui/FitPulseCoinSvg';

export interface FitPulseCoinShopModalProps {
  visible: boolean;
  onClose: () => void;
  coinsBalance: number;
  initialCurrency?: CurrencyCode;
  onSelectCardPayment: (coins: number, price: number, currency: CurrencyCode) => void;
  onConfirmLocalPayment: (coins: number, price: number, currency: CurrencyCode, method: string) => Promise<void>;
  onViewHistory: () => void;
}

export interface CoinBundleItem {
  id: string;
  coins: number;
  priceUsd: number;
  priceEtb: number;
}

export const FITPULSE_COIN_BUNDLES: CoinBundleItem[] = [
  { id: '30',   coins: 30,   priceUsd: 0.32,  priceEtb: 30 },
  { id: '50',   coins: 50,   priceUsd: 0.52,  priceEtb: 50 },
  { id: '100',  coins: 100,  priceUsd: 1.05,  priceEtb: 100 },
  { id: '200',  coins: 200,  priceUsd: 2.09,  priceEtb: 200 },
  { id: '350',  coins: 350,  priceUsd: 3.65,  priceEtb: 350 },
  { id: '500',  coins: 500,  priceUsd: 5.19,  priceEtb: 500 },
  { id: '1000', coins: 1000, priceUsd: 10.39, priceEtb: 1000 },
];

export default function FitPulseCoinShopModal({
  visible,
  onClose,
  coinsBalance,
  initialCurrency = 'USD',
  onSelectCardPayment,
  onConfirmLocalPayment,
  onViewHistory,
}: FitPulseCoinShopModalProps) {
  const { user } = useUserStore();

  const [currency, setCurrency] = useState<CurrencyCode>(initialCurrency);
  const [selectedBundleId, setSelectedBundleId] = useState<string>('350');
  const [customCoins, setCustomCoins] = useState<string>('');
  const [isCustomSelected, setIsCustomSelected] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'telebirr' | 'cbe_birr' | 'chapa'>(
    initialCurrency === 'ETB' ? 'telebirr' : 'card'
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Switch payment method when currency changes
  const handleToggleCurrency = (newCurr: CurrencyCode) => {
    setCurrency(newCurr);
    if (newCurr === 'ETB') {
      setPaymentMethod('telebirr');
    } else {
      setPaymentMethod('card');
    }
  };

  // Calculate current coins and price
  let currentCoins = 350;
  let currentPrice = currency === 'ETB' ? 350 : 3.65;

  if (isCustomSelected) {
    const parsed = parseInt(customCoins, 10) || 0;
    currentCoins = parsed;
    currentPrice = currency === 'ETB' ? parsed : Number((parsed * 0.0104).toFixed(2));
  } else {
    const found = FITPULSE_COIN_BUNDLES.find((b) => b.id === selectedBundleId);
    if (found) {
      currentCoins = found.coins;
      currentPrice = currency === 'ETB' ? found.priceEtb : found.priceUsd;
    }
  }

  const handleSelectBundle = (id: string) => {
    setIsCustomSelected(false);
    setSelectedBundleId(id);
  };

  const handleSelectCustom = () => {
    setIsCustomSelected(true);
    if (!customCoins) setCustomCoins('100');
  };

  const handlePayNow = async () => {
    if (isCustomSelected && currentCoins < 30) {
      Alert.alert('Minimum Coins', 'Minimum recharge amount is 30 coins.');
      return;
    }

    if (paymentMethod === 'card') {
      onClose();
      onSelectCardPayment(currentCoins, currentPrice, currency);
      return;
    }

    setIsProcessing(true);
    try {
      await onConfirmLocalPayment(currentCoins, currentPrice, currency, paymentMethod);
      onClose();
    } catch (e: any) {
      Alert.alert('Payment Error', e?.message || 'Could not complete recharge.');
    } finally {
      setIsProcessing(false);
    }
  };

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Athlete')}&background=00E676&color=000&size=150`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheetContainer}>
          {/* Header Row */}
          <View style={s.headerRow}>
            <View style={s.headerTitleWrap}>
              <Text style={s.headerTitle}>FitPulse Coin Shop</Text>
              <Text style={s.headerSub}>Instant in-app credit</Text>
            </View>

            <View style={s.headerRightActions}>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onViewHistory();
                }}
                style={s.historyLink}
              >
                <Text style={s.historyLinkText}>History</Text>
                <Ionicons name="time-outline" size={15} color="#8A95A5" />
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                <Ionicons name="close" size={22} color="#8A95A5" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollBody}>
            {/* User Account Card */}
            <View style={s.accountCard}>
              <Image source={{ uri: user.avatar || defaultAvatar }} style={s.accountAvatar} />
              <View style={s.accountDetails}>
                <Text style={s.accountUsername} numberOfLines={1}>
                  {user.name || user.email?.split('@')[0] || 'FitPulse Athlete'}
                </Text>
                <View style={s.accountBalancePill}>
                  <FitPulseCoinSvg size={13} />
                  <Text style={s.accountBalanceText}>{coinsBalance.toLocaleString()} Coins</Text>
                </View>
              </View>

              {/* Currency Toggle Switcher */}
              <View style={s.currencyToggle}>
                <TouchableOpacity
                  style={[s.currencyBtn, currency === 'USD' && s.currencyBtnActive]}
                  onPress={() => handleToggleCurrency('USD')}
                >
                  <Text style={[s.currencyBtnText, currency === 'USD' && s.currencyBtnTextActive]}>
                    🇺🇸 USD
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.currencyBtn, currency === 'ETB' && s.currencyBtnActive]}
                  onPress={() => handleToggleCurrency('ETB')}
                >
                  <Text style={[s.currencyBtnText, currency === 'ETB' && s.currencyBtnTextActive]}>
                    🇪🇹 ETB
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Promo Banner */}
            <View style={s.promoBanner}>
              <Ionicons name="flash" size={16} color="#00E676" />
              <Text style={s.promoText}>
                <Text style={s.promoHighlight}>Recharge:</Text> Save around 25% with direct in-app recharge & zero third-party service fees.
              </Text>
            </View>

            {/* 8-Card Bundle Grid */}
            <View style={s.bundlesGrid}>
              {FITPULSE_COIN_BUNDLES.map((bundle) => {
                const isSelected = !isCustomSelected && selectedBundleId === bundle.id;
                const priceFormatted =
                  currency === 'ETB'
                    ? `${bundle.priceEtb} ETB`
                    : `$${bundle.priceUsd.toFixed(2)}`;

                return (
                  <TouchableOpacity
                    key={bundle.id}
                    style={[s.bundleBox, isSelected && s.bundleBoxActive]}
                    activeOpacity={0.82}
                    onPress={() => handleSelectBundle(bundle.id)}
                  >
                    <View style={s.bundleCoinRow}>
                      <FitPulseCoinSvg size={18} />
                      <Text style={s.bundleCoinNum}>{bundle.coins}</Text>
                    </View>
                    <Text style={s.bundlePrice}>{priceFormatted}</Text>
                  </TouchableOpacity>
                );
              })}

              {/* 8th Card: Custom Amount */}
              <TouchableOpacity
                style={[s.bundleBox, isCustomSelected && s.bundleBoxActive]}
                activeOpacity={0.82}
                onPress={handleSelectCustom}
              >
                {isCustomSelected ? (
                  <View style={s.customInputBox}>
                    <View style={s.bundleCoinRow}>
                      <FitPulseCoinSvg size={16} />
                      <TextInput
                        style={s.customTextInput}
                        value={customCoins}
                        onChangeText={setCustomCoins}
                        keyboardType="numeric"
                        placeholder="30+"
                        placeholderTextColor="#555"
                        autoFocus
                      />
                    </View>
                    <Text style={s.customMinText}>
                      {currentCoins < 30 ? '⚠ Min 30' : formatCurrency(currentPrice, currency)}
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={s.bundleCoinRow}>
                      <FitPulseCoinSvg size={18} />
                      <Text style={s.bundleCoinNum}>Custom</Text>
                    </View>
                    <Text style={s.bundleCustomSub}>Any amount</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Special Cashback Offer */}
            <View style={s.cashbackCard}>
              <View style={s.cashbackBadge}>
                <Text style={s.cashbackBadgeText}>5%</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cashbackTitle}>Recharge once to unlock 5% bonus coins</Text>
                <Text style={s.cashbackSub}>Bonus coins will be credited automatically to your wallet</Text>
              </View>
              <Ionicons name="checkmark-circle" size={18} color="#00E676" />
            </View>

            {/* Payment Method Section */}
            <Text style={s.sectionHeader}>Payment Method</Text>

            <View style={s.paymentMethodContainer}>
              {currency === 'USD' ? (
                <>
                  {/* Credit or Debit Card */}
                  <TouchableOpacity
                    style={[s.methodRow, paymentMethod === 'card' && s.methodRowActive]}
                    activeOpacity={0.8}
                    onPress={() => setPaymentMethod('card')}
                  >
                    <View style={s.radioOuter}>
                      {paymentMethod === 'card' && <View style={s.radioInner} />}
                    </View>
                    <Text style={s.methodName}>Credit Or Debit Card</Text>
                    <View style={s.cardIconsRow}>
                      <Text style={s.cardBrandPill}>VISA</Text>
                      <Text style={s.cardBrandPill}>MC</Text>
                      <Text style={s.cardBrandPill}>AMEX</Text>
                    </View>
                  </TouchableOpacity>

                  {/* PayPal */}
                  <TouchableOpacity
                    style={[s.methodRow, paymentMethod === 'paypal' && s.methodRowActive]}
                    activeOpacity={0.8}
                    onPress={() => setPaymentMethod('paypal')}
                  >
                    <View style={s.radioOuter}>
                      {paymentMethod === 'paypal' && <View style={s.radioInner} />}
                    </View>
                    <Text style={s.methodName}>PayPal</Text>
                    <Ionicons name="logo-paypal" size={20} color="#60A5FA" />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Telebirr */}
                  <TouchableOpacity
                    style={[s.methodRow, paymentMethod === 'telebirr' && s.methodRowActive]}
                    activeOpacity={0.8}
                    onPress={() => setPaymentMethod('telebirr')}
                  >
                    <View style={s.radioOuter}>
                      {paymentMethod === 'telebirr' && <View style={s.radioInner} />}
                    </View>
                    <Text style={s.methodName}>Telebirr Mobile Money</Text>
                    <Text style={s.localPill}>📱 Telebirr</Text>
                  </TouchableOpacity>

                  {/* CBE Birr */}
                  <TouchableOpacity
                    style={[s.methodRow, paymentMethod === 'cbe_birr' && s.methodRowActive]}
                    activeOpacity={0.8}
                    onPress={() => setPaymentMethod('cbe_birr')}
                  >
                    <View style={s.radioOuter}>
                      {paymentMethod === 'cbe_birr' && <View style={s.radioInner} />}
                    </View>
                    <Text style={s.methodName}>CBE Birr / CBE Bank</Text>
                    <Text style={s.localPill}>🏦 CBE</Text>
                  </TouchableOpacity>

                  {/* Chapa */}
                  <TouchableOpacity
                    style={[s.methodRow, paymentMethod === 'chapa' && s.methodRowActive]}
                    activeOpacity={0.8}
                    onPress={() => setPaymentMethod('chapa')}
                  >
                    <View style={s.radioOuter}>
                      {paymentMethod === 'chapa' && <View style={s.radioInner} />}
                    </View>
                    <Text style={s.methodName}>Chapa (All Cards & Mobile)</Text>
                    <Text style={s.localPill}>💳 Chapa</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Order Summary Footer */}
            <View style={s.summaryContainer}>
              <View style={s.summaryTotalRow}>
                <Text style={s.summaryLabel}>
                  Total <Text style={{ color: '#8A95A5', fontSize: 13 }}>({currentCoins} Coins)</Text>
                </Text>
                <Text style={s.summaryAmount}>{formatCurrency(currentPrice, currency)}</Text>
              </View>

              <Text style={s.disclaimerText}>
                By tapping Pay, you agree to our <Text style={{ color: '#A0B0C0' }}>Virtual Items Policy</Text>. By using any amount of Coins, you acknowledge and confirm that you will no longer be eligible for a refund.
              </Text>

              {/* Pay Now Button */}
              <TouchableOpacity
                style={[s.payNowBtn, isProcessing && { opacity: 0.6 }]}
                activeOpacity={0.88}
                onPress={handlePayNow}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={s.payNowBtnText}>
                    {paymentMethod === 'card'
                      ? `Pay ${formatCurrency(currentPrice, currency)} with Card`
                      : `Recharge ${formatCurrency(currentPrice, currency)}`}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0A1318',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: '#182733',
    maxHeight: '94%',
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#14222D',
  },
  headerTitleWrap: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 12,
    color: '#8A95A5',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#101B24',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#192A38',
  },
  historyLinkText: {
    fontSize: 12,
    color: '#8A95A5',
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Account Card
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101C26',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1A2C3B',
    marginBottom: 12,
    gap: 12,
  },
  accountAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
  },
  accountDetails: {
    flex: 1,
  },
  accountUsername: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  accountBalancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  accountBalanceText: {
    fontSize: 12.5,
    color: '#00E676',
    fontWeight: '700',
  },

  // Currency Toggle
  currencyToggle: {
    flexDirection: 'row',
    backgroundColor: '#0A1319',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1D3040',
  },
  currencyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
  },
  currencyBtnActive: {
    backgroundColor: '#00E676',
  },
  currencyBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#8A95A5',
  },
  currencyBtnTextActive: {
    color: '#000',
  },

  // Promo Banner
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.22)',
    marginBottom: 16,
  },
  promoText: {
    fontSize: 12,
    color: '#A0B0C0',
    flex: 1,
    lineHeight: 16,
  },
  promoHighlight: {
    color: '#00E676',
    fontWeight: '700',
  },

  // 8-Card Grid (4 per row on desktop, 2-3 on mobile)
  bundlesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  bundleBox: {
    width: Platform.OS === 'web' ? '23.5%' : '31%',
    backgroundColor: '#101C26',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#192C3C',
    overflow: 'hidden',
    minHeight: 76,
    justifyContent: 'center',
  },
  bundleBoxActive: {
    borderColor: '#00E676',
    backgroundColor: 'rgba(0, 230, 118, 0.09)',
  },
  bundleCoinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  bundleCoinNum: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  bundlePrice: {
    fontSize: 12,
    color: '#8A95A5',
    fontWeight: '600',
    textAlign: 'center',
  },
  bundleCustomSub: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  customInputBox: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },
  customTextInput: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#00E676',
    paddingVertical: 2,
    width: '80%',
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  customMinText: {
    fontSize: 10,
    color: '#8A95A5',
    marginTop: 4,
    textAlign: 'center',
  },

  // Cashback card
  cashbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1A22',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#192835',
    marginBottom: 18,
  },
  cashbackBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cashbackBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00E676',
  },
  cashbackTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cashbackSub: {
    fontSize: 11,
    color: '#8A95A5',
    marginTop: 2,
  },

  // Payment Methods
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A95A5',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  paymentMethodContainer: {
    gap: 8,
    marginBottom: 16,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101C26',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#192C3C',
    gap: 12,
  },
  methodRowActive: {
    borderColor: '#00E676',
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#8A95A5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#00E676',
  },
  methodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  cardIconsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  cardBrandPill: {
    backgroundColor: '#1A2C3B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 9.5,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  localPill: {
    fontSize: 12,
    color: '#8A95A5',
    fontWeight: '600',
  },

  // Order Summary Footer
  summaryContainer: {
    borderTopWidth: 1,
    borderTopColor: '#14222D',
    paddingTop: 16,
    gap: 12,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#00E676',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#6B7A8A',
    lineHeight: 16,
  },
  payNowBtn: {
    backgroundColor: '#00E676',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  payNowBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#000000',
  },
});
