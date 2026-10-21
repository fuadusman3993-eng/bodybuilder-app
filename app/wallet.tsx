import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TextInput,
  Platform,
  Alert,
  RefreshControl,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/colors';
import { useUserStore } from '../store/userStore';
import {
  CurrencyCode,
  CURRENCIES,
  detectDefaultCurrency,
  coinsToFiat,
  formatCurrency,
  getRateDisplay,
  getCoinBundles,
  InternationalCoinBundle,
} from '../lib/currencyService';
import {
  getWallet,
  getTransactionHistory,
  topupWalletWithGateway,
  requestCoachPayout,
  Wallet,
  CoinTransaction,
} from '../lib/walletService';
import CardPaymentModal from '../components/wallet/CardPaymentModal';
import ProUpgradeModal from '../components/wallet/ProUpgradeModal';
import FitPulseCoinSvg from '../components/ui/FitPulseCoinSvg';
import FitPulseCoinShopModal from '../components/wallet/FitPulseCoinShopModal';

const { width } = Dimensions.get('window');

export default function WalletScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    chapa_status?: string;
    tx_ref?: string;
    coins?: string;
    amount?: string;
  }>();
  const { user, updateCoins } = useUserStore();

  const [wallet, setWallet]         = useState<Wallet | null>(null);
  const [txs, setTxs]               = useState<CoinTransaction[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active Currency
  const [currency, setCurrency] = useState<CurrencyCode>('ETB');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  // Top-Up Modal
  const [showTopup, setShowTopup] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<InternationalCoinBundle>(
    getCoinBundles('ETB')[1]
  );
  const [selectedMethod, setSelectedMethod] = useState<'telebirr' | 'cbe_birr' | 'chapa' | 'card' | 'paypal'>('telebirr');
  const [phoneOrAccount, setPhoneOrAccount] = useState('');
  const [toppingUp, setToppingUp] = useState(false);

  // Card Payment Modal
  const [showCardModal, setShowCardModal] = useState(false);
  const [checkoutCoins, setCheckoutCoins] = useState<number>(350);
  const [checkoutPrice, setCheckoutPrice] = useState<number>(3.65);
  const [checkoutCurrency, setCheckoutCurrency] = useState<CurrencyCode>('USD');

  // Pro Upgrade Modal
  const [showProModal, setShowProModal] = useState(false);

  // Coach Payout Modal
  const [showPayout, setShowPayout] = useState(false);
  const [payoutCoins, setPayoutCoins] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'telebirr' | 'cbe_birr' | 'paypal' | 'bank_wire'>('telebirr');
  const [payoutAccount, setPayoutAccount] = useState('');
  const [payoutName, setPayoutName] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);

  // Auto-detect currency on first load
  useEffect(() => {
    const defaultCurr = detectDefaultCurrency(user.country);
    setCurrency(defaultCurr);
    setSelectedBundle(getCoinBundles(defaultCurr)[1]);
    if (defaultCurr === 'ETB') {
      setSelectedMethod('telebirr');
      setPayoutMethod('telebirr');
    } else {
      setSelectedMethod('card');
      setPayoutMethod('paypal');
    }
  }, [user.country]);

  // When currency changes, update selected bundle
  const handleSelectCurrency = (code: CurrencyCode) => {
    setCurrency(code);
    setSelectedBundle(getCoinBundles(code)[1]);
    if (code === 'ETB') {
      setSelectedMethod('telebirr');
      setPayoutMethod('telebirr');
    } else {
      setSelectedMethod('card');
      setPayoutMethod('paypal');
    }
    setShowCurrencyModal(false);
  };

  const fetchAll = useCallback(async () => {
    if (!user.uid) return;
    try {
      const [w, t] = await Promise.all([
        getWallet(user.uid),
        getTransactionHistory(user.uid, 30),
      ]);
      setWallet(w);
      setTxs(t);
      if (w) updateCoins(w.balance_coins);
    } catch (e) {
      console.warn('[WalletScreen] fetchAll error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.uid]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, [fetchAll]);

  // ── Auto-Verify Chapa Payment on Return from Checkout ────────────────────
  useEffect(() => {
    if (params.chapa_status === 'verify' && params.tx_ref && user.uid) {
      async function verifyChapa() {
        try {
          const verifyRes = await fetch(
            `/api/chapa-verify?tx_ref=${params.tx_ref}&uid=${user.uid}&coins=${params.coins || ''}`
          );
          const data = await verifyRes.json();

          if (data.success && data.verified) {
            const addedCoins = data.coins || parseInt(params.coins || '0', 10);
            const newBal = data.newBalance ?? ((wallet?.balance_coins ?? 0) + addedCoins);
            setWallet((prev) => (prev ? { ...prev, balance_coins: newBal } : null));
            updateCoins(newBal);
            const msg = `🎉 Payment Successful!\n${addedCoins.toLocaleString()} FitPulse Coins added to your wallet.\nNew Balance: 🪙 ${newBal.toLocaleString()}`;
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert('Payment Successful', msg);
            fetchAll();
          } else if (data.alreadyProcessed) {
            fetchAll();
          } else {
            const failMsg = data.message || 'Chapa payment could not be verified.';
            if (Platform.OS === 'web') window.alert(`Payment Status: ${failMsg}`);
            else Alert.alert('Payment Status', failMsg);
          }
        } catch (e: any) {
          console.warn('[Chapa Verification error]:', e);
        } finally {
          // Clean URL params to avoid re-triggering on page refresh
          router.replace('/wallet');
        }
      }
      verifyChapa();
    }
  }, [params.chapa_status, params.tx_ref, user.uid]);

  // ── Top-Up Handlers ────────────────────────────────────────────────────────

  const handleStartTopup = () => {
    if (selectedMethod === 'card') {
      setShowTopup(false);
      setShowCardModal(true);
      return;
    }
    handleConfirmLocalTopup();
  };

  const handleConfirmLocalTopup = async () => {
    if (!user.uid) return;
    setToppingUp(true);
    try {
      const ref = `${selectedMethod.toUpperCase()}-${Date.now()}`;
      const res = await topupWalletWithGateway({
        uid: user.uid,
        coins: selectedBundle.coins,
        fiatAmount: selectedBundle.price,
        currency,
        gateway: selectedMethod,
        reference: ref,
      });

      if (res.success) {
        const newBal = res.newBalance ?? (wallet?.balance_coins ?? 0) + selectedBundle.coins;
        setWallet((prev) => (prev ? { ...prev, balance_coins: newBal } : null));
        updateCoins(newBal);
        setShowTopup(false);
        const msg = `✅ ${selectedBundle.coins} Coins added!\nNew Balance: 🪙 ${newBal.toLocaleString()}`;
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Top-Up Successful', msg);
        fetchAll();
      } else {
        Alert.alert('Top-Up Failed', res.error || 'Please try again.');
      }
    } finally {
      setToppingUp(false);
    }
  };

  const handleCardSuccess = async (ref: string) => {
    if (!user.uid) return;
    const res = await topupWalletWithGateway({
      uid: user.uid,
      coins: checkoutCoins,
      fiatAmount: checkoutPrice,
      currency: checkoutCurrency,
      gateway: 'stripe_card',
      reference: ref,
    });

    if (res.success) {
      const newBal = res.newBalance ?? (wallet?.balance_coins ?? 0) + checkoutCoins;
      setWallet((prev) => (prev ? { ...prev, balance_coins: newBal } : null));
      updateCoins(newBal);
      setShowCardModal(false);
      const msg = `✅ ${checkoutCoins.toLocaleString()} Coins added successfully via Card!\nNew Balance: 🪙 ${newBal.toLocaleString()}`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Payment Successful', msg);
      fetchAll();
    }
  };

  const handleConfirmShopRecharge = async (
    coins: number,
    price: number,
    curr: CurrencyCode,
    method: string
  ) => {
    if (!user.uid) {
      Alert.alert('Sign In Required', 'Please sign in to top up coins.');
      return;
    }

    // ── Live Chapa Gateway for ETB (Telebirr, CBE Birr, Chapa) ───────────────
    if (curr === 'ETB' || method === 'telebirr' || method === 'cbe_birr' || method === 'chapa') {
      try {
        const initRes = await fetch('/api/chapa-initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user.uid,
            coins,
            amount: price,
            email: user.email || 'athlete@fitpulse.app',
            firstName: user.name?.split(' ')[0] || 'FitPulse',
            lastName: user.name?.split(' ')[1] || 'Athlete',
            phone: (user as any).phone || undefined,
          }),
        });

        const initData = await initRes.json();

        if (initData.success && initData.checkoutUrl) {
          setShowTopup(false);
          if (Platform.OS === 'web') {
            window.location.href = initData.checkoutUrl;
            return;
          } else {
            Linking.openURL(initData.checkoutUrl);
            return;
          }
        } else {
          throw new Error(initData.error || 'Failed to start Chapa checkout');
        }
      } catch (err: any) {
        console.error('[Chapa Checkout Error]:', err);
        throw new Error(err?.message || 'Could not connect to Chapa payment gateway.');
      }
    }

    // ── Fallback / Sandbox top-up for local dev ──────────────────────────────
    const ref = `${method.toUpperCase()}-${Date.now()}`;
    const res = await topupWalletWithGateway({
      uid: user.uid,
      coins,
      fiatAmount: price,
      currency: curr,
      gateway: method,
      reference: ref,
    });

    if (res.success) {
      const newBal = res.newBalance ?? (wallet?.balance_coins ?? 0) + coins;
      setWallet((prev) => (prev ? { ...prev, balance_coins: newBal } : null));
      updateCoins(newBal);
      setShowTopup(false);
      const msg = `✅ ${coins.toLocaleString()} Coins added!\nNew Balance: 🪙 ${newBal.toLocaleString()}`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Top-Up Successful', msg);
      fetchAll();
    } else {
      throw new Error(res.error || 'Failed to complete recharge.');
    }
  };

  // ── Coach Payout Handler ───────────────────────────────────────────────────

  const handlePayout = async () => {
    const coins = parseInt(payoutCoins, 10);
    const bal = wallet?.balance_coins ?? 0;
    if (!coins || coins <= 0 || !payoutAccount.trim() || !payoutName.trim()) {
      Alert.alert('Incomplete Form', 'Please fill in all payout fields.');
      return;
    }
    if (coins > bal) {
      Alert.alert('Insufficient Balance', 'You do not have enough coins for this payout.');
      return;
    }

    setPayoutLoading(true);
    try {
      const fiat = coinsToFiat(coins, currency);
      const res = await requestCoachPayout({
        coachUid: user.uid!,
        coins,
        amountFiat: fiat,
        currency,
        method: payoutMethod,
        accountDetails: {
          accountNumber: payoutAccount,
          accountName: payoutName,
          paypalEmail: payoutMethod === 'paypal' ? payoutAccount : undefined,
          iban: payoutMethod === 'bank_wire' ? payoutAccount : undefined,
        },
      });

      if (res.success) {
        setShowPayout(false);
        setPayoutCoins('');
        setPayoutAccount('');
        setPayoutName('');
        const msg = `✅ Withdrawal of ${formatCurrency(fiat, currency)} requested!\nOur team will process your payout within 24 hours.`;
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Payout Requested', msg);
        fetchAll();
      } else {
        Alert.alert('Payout Failed', res.error || 'Please try again.');
      }
    } finally {
      setPayoutLoading(false);
    }
  };

  // ── Derived Values ─────────────────────────────────────────────────────────

  const balance = wallet?.balance_coins ?? 0;
  const lifetimeEarnings = wallet?.lifetime_earnings_coins ?? 0;
  const isCoach = user.role === 'coach';
  const availableBundles = getCoinBundles(currency);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ── TOP HEADER (Matching Image Header) ─────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>

            {/* Glowing Green Rounded-Square Wallet Badge */}
            <View style={styles.walletHeaderIconWrap}>
              <Ionicons name="wallet" size={22} color="#00E676" />
            </View>

            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Wallet</Text>
              <Text style={styles.headerSubtitle}>Manage your FitPulse coins and earnings</Text>
            </View>
          </View>

          {/* Currency Rate Pill Badge */}
          <TouchableOpacity
            style={styles.currencyPill}
            activeOpacity={0.8}
            onPress={() => setShowCurrencyModal(true)}
          >
            <Text style={styles.currencyPillText}>{getRateDisplay(currency)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your FitPulse Wallet...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        >
          <View style={styles.pageInner}>
            {/* ── HERO BALANCE CARD (Matching Reference Image) ─────────────── */}
          <View style={styles.heroCard}>
            {/* Background Athlete Illustration */}
            <Image
              source={require('../assets/images/wallet-hero-athlete.png')}
              style={styles.heroBgAthlete}
              contentFit="cover"
            />

            {/* Gradient shadow to guarantee crisp text readability */}
            <View style={styles.heroShadowOverlay} />

            {/* Top Left Coin Badge & Balance */}
            <View style={styles.heroTopRow}>
              {/* 3D Gold FitPulse Coin Badge (SVG - no black box) */}
              <FitPulseCoinSvg size={52} />

              <View style={styles.heroBalanceTextWrap}>
                <Text style={styles.heroCoinLabel}>FitPulse Coins</Text>
                <Text style={styles.heroBalanceNumber}>{balance.toLocaleString()}</Text>
                <Text style={styles.heroEquivalentText}>
                  ≈ {formatCurrency(coinsToFiat(balance, currency), currency)}
                </Text>

                {/* 7-Day Trend Pill */}
                <View style={styles.trendPill}>
                  <Ionicons name="arrow-up" size={11} color="#00E676" />
                  <Text style={styles.trendPercent}>0.00%</Text>
                  <Text style={styles.trendArrow}>→</Text>
                  <Text style={styles.trendLabel}>vs last 7 days</Text>
                </View>
              </View>
            </View>

            {/* Bottom Dual Action Buttons */}
            <View style={styles.heroActionRow}>
              {/* Top Up Coins (Vibrant Neon Green) */}
              <TouchableOpacity
                style={styles.topUpBtn}
                activeOpacity={0.88}
                onPress={() => setShowTopup(true)}
              >
                <View style={styles.topUpIconCircle}>
                  <Ionicons name="add" size={18} color="#000" />
                </View>
                <View style={styles.actionBtnTextWrap}>
                  <Text style={styles.topUpBtnTitle}>Top Up Coins</Text>
                  <Text style={styles.topUpBtnSub}>Add coins to your wallet</Text>
                </View>
              </TouchableOpacity>

              {/* Withdraw (Dark Outline with Green Border) */}
              <TouchableOpacity
                style={styles.withdrawBtn}
                activeOpacity={0.88}
                onPress={() => setShowPayout(true)}
              >
                <View style={styles.withdrawIconCircle}>
                  <Ionicons name="arrow-up" size={16} color="#00E676" />
                </View>
                <View style={styles.actionBtnTextWrap}>
                  <Text style={styles.withdrawBtnTitle}>Withdraw</Text>
                  <Text style={styles.withdrawBtnSub}>Transfer your earnings</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── COACH EARNINGS SECTION (Matching Reference Image) ────────── */}
          <View style={styles.coachCard}>
            <View style={styles.coachHeaderRow}>
              <View style={styles.coachIconWrap}>
                <Ionicons name="trending-up" size={20} color="#00E676" />
              </View>
              <View>
                <Text style={styles.coachTitle}>Coach Earnings</Text>
                <Text style={styles.coachSubtitle}>Your total earnings from coaching and activities.</Text>
              </View>
            </View>

            {/* 4-Column Grid */}
            <View style={styles.metricsGrid}>
              {/* 1. Lifetime Coins Earned */}
              <View style={styles.metricCol}>
                <View style={[styles.metricCircle, { backgroundColor: 'rgba(0, 230, 118, 0.15)' }]}>
                  <Ionicons name="cash" size={16} color="#00E676" />
                </View>
                <Text style={styles.metricValue}>{lifetimeEarnings.toLocaleString()}</Text>
                <Text style={styles.metricLabel}>Lifetime Coins Earned</Text>
              </View>

              {/* 2. Available Balance */}
              <View style={styles.metricCol}>
                <View style={[styles.metricCircle, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                  <Ionicons name="ellipse" size={14} color="#A855F7" />
                </View>
                <Text style={styles.metricValue}>{balance.toLocaleString()}</Text>
                <Text style={styles.metricLabel}>Available Balance</Text>
              </View>

              {/* 3. Equivalent Currency */}
              <View style={styles.metricCol}>
                <View style={[styles.metricCircle, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                  <Ionicons name="card" size={15} color="#EAB308" />
                </View>
                <Text style={styles.metricValue}>
                  {coinsToFiat(balance, currency).toLocaleString()}
                </Text>
                <Text style={styles.metricLabel}>Equivalent {currency}</Text>
              </View>

              {/* 4. Pending Payout */}
              <View style={styles.metricCol}>
                <View style={[styles.metricCircle, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
                  <Ionicons name="calendar" size={15} color="#34D399" />
                </View>
                <Text style={styles.metricValue}>
                  {(wallet?.pending_payout_etb ?? 0).toFixed(2)}
                </Text>
                <Text style={styles.metricLabel}>Pending Payout</Text>
              </View>
            </View>
          </View>

          {/* ── PRO TIER CALLOUT BANNER (Matching Reference Image) ───────── */}
          <TouchableOpacity
            style={styles.proCalloutBanner}
            activeOpacity={0.85}
            onPress={() => setShowProModal(true)}
          >
            <View style={styles.proCalloutLeft}>
              <Ionicons name="information-circle-outline" size={20} color="#8A95A5" />
              <Text style={styles.proCalloutText}>
                Use coins to hire coaches, buy workout plans, or upgrade to{' '}
                <Text style={styles.proHighlight}>FitPulse Pro</Text>.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8A95A5" />
          </TouchableOpacity>

          {/* ── RECENT TRANSACTIONS (Matching Reference Image) ───────────── */}
          <View style={styles.txSection}>
            <View style={styles.txHeaderRow}>
              <Text style={styles.txSectionTitle}>Recent Transactions</Text>
              <TouchableOpacity style={styles.viewAllPill} activeOpacity={0.7}>
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="chevron-forward" size={13} color="#8A95A5" />
              </TouchableOpacity>
            </View>

            {txs.length === 0 ? (
              /* Pixel-Perfect Sparkle Wallet Empty State */
              <View style={styles.emptyCard}>
                <Text style={styles.emptySparkleWallet}>✨👛</Text>
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptySubtitle}>Your recent transactions will appear here</Text>
              </View>
            ) : (
              /* Real Populated Transactions List */
              <View style={styles.txListContainer}>
                {txs.map((tx) => {
                  const isCredit = tx.amount_coins > 0;
                  return (
                    <View key={tx.id} style={styles.txRow}>
                      <View style={[styles.txIconBadge, isCredit ? styles.txBadgeCredit : styles.txBadgeDebit]}>
                        <Ionicons
                          name={isCredit ? 'add-circle' : 'person-circle'}
                          size={20}
                          color={isCredit ? '#00E676' : '#F59E0B'}
                        />
                      </View>
                      <View style={styles.txDetails}>
                        <Text style={styles.txDesc} numberOfLines={1}>
                          {tx.description ?? tx.type}
                        </Text>
                        <Text style={styles.txDate}>{formatDate(tx.created_at)}</Text>
                      </View>
                      <Text style={[styles.txAmount, isCredit ? styles.txAmountCredit : styles.txAmountDebit]}>
                        {isCredit ? '+' : ''}{tx.amount_coins} 🪙
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      )}

      {/* ── CURRENCY SELECTOR MODAL ────────────────────────────────────── */}
      <Modal visible={showCurrencyModal} transparent animationType="slide" onRequestClose={() => setShowCurrencyModal(false)}>
        <TouchableOpacity style={mStyles.overlay} activeOpacity={1} onPress={() => setShowCurrencyModal(false)}>
          <TouchableOpacity style={mStyles.sheet} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={mStyles.handle} />
            <Text style={mStyles.title}>Select Currency</Text>
            <Text style={mStyles.subtitle}>FitPulse automatically converts coins to your preferred currency</Text>

            <View style={mStyles.currencyList}>
              {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => {
                const c = CURRENCIES[code];
                const isSelected = currency === code;
                return (
                  <TouchableOpacity
                    key={code}
                    style={[mStyles.currencyOption, isSelected && mStyles.currencyOptionActive]}
                    activeOpacity={0.8}
                    onPress={() => handleSelectCurrency(code)}
                  >
                    <Text style={mStyles.currencyFlag}>{c.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={mStyles.currencyName}>{c.name} ({c.code})</Text>
                      <Text style={mStyles.currencyRate}>{getRateDisplay(code)}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── FITPULSE COIN SHOP MODAL (TikTok-Style Recharge) ───────────── */}
      <FitPulseCoinShopModal
        visible={showTopup}
        onClose={() => setShowTopup(false)}
        coinsBalance={balance}
        initialCurrency={currency}
        onSelectCardPayment={(coins, price, curr) => {
          setCheckoutCoins(coins);
          setCheckoutPrice(price);
          setCheckoutCurrency(curr);
          setShowCardModal(true);
        }}
        onConfirmLocalPayment={handleConfirmShopRecharge}
        onViewHistory={() => {}}
      />

      {/* ── CREDIT CARD PAYMENT MODAL ──────────────────────────────────── */}
      <CardPaymentModal
        visible={showCardModal}
        onClose={() => setShowCardModal(false)}
        coins={checkoutCoins}
        price={checkoutPrice}
        currency={checkoutCurrency}
        onSuccess={handleCardSuccess}
      />

      {/* ── FITPULSE PRO UPGRADE MODAL ─────────────────────────────────── */}
      <ProUpgradeModal
        visible={showProModal}
        onClose={() => setShowProModal(false)}
        coinsBalance={balance}
        onSuccess={(newBal) => {
          setWallet((prev) => (prev ? { ...prev, balance_coins: newBal } : null));
          updateCoins(newBal);
        }}
        onOpenTopup={() => setShowTopup(true)}
      />

      {/* ── COACH WITHDRAWAL MODAL ─────────────────────────────────────── */}
      <Modal visible={showPayout} transparent animationType="slide" onRequestClose={() => setShowPayout(false)}>
        <TouchableOpacity style={mStyles.overlay} activeOpacity={1} onPress={() => setShowPayout(false)}>
          <TouchableOpacity style={mStyles.sheet} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={mStyles.handle} />
            <Text style={mStyles.title}>Withdraw Earnings</Text>
            <Text style={mStyles.subtitle}>
              Available Balance: 🪙 {balance.toLocaleString()} Coins (
              {formatCurrency(coinsToFiat(balance, currency), currency)})
            </Text>

            <Text style={mStyles.sectionLabel}>Coins to Withdraw</Text>
            <TextInput
              style={mStyles.input}
              value={payoutCoins}
              onChangeText={setPayoutCoins}
              keyboardType="numeric"
              placeholder={`Max: ${balance} coins`}
              placeholderTextColor="#555"
            />
            {payoutCoins !== '' && (
              <Text style={mStyles.inputHint}>
                = {formatCurrency(coinsToFiat(parseInt(payoutCoins) || 0, currency), currency)}
              </Text>
            )}

            <Text style={mStyles.sectionLabel}>Withdrawal Method</Text>
            <View style={mStyles.methodRow}>
              {currency === 'ETB' ? (
                <>
                  <MethodPill
                    label="📱 Telebirr"
                    selected={payoutMethod === 'telebirr'}
                    onPress={() => setPayoutMethod('telebirr')}
                  />
                  <MethodPill
                    label="🏦 CBE Birr"
                    selected={payoutMethod === 'cbe_birr'}
                    onPress={() => setPayoutMethod('cbe_birr')}
                  />
                </>
              ) : (
                <>
                  <MethodPill
                    label="🅿️ PayPal"
                    selected={payoutMethod === 'paypal'}
                    onPress={() => setPayoutMethod('paypal')}
                  />
                  <MethodPill
                    label="🏦 Bank Wire (IBAN)"
                    selected={payoutMethod === 'bank_wire'}
                    onPress={() => setPayoutMethod('bank_wire')}
                  />
                </>
              )}
            </View>

            <Text style={mStyles.sectionLabel}>
              {payoutMethod === 'paypal' ? 'PayPal Email' : 'Account / Phone Number'}
            </Text>
            <TextInput
              style={mStyles.input}
              value={payoutAccount}
              onChangeText={setPayoutAccount}
              placeholder={payoutMethod === 'paypal' ? 'you@example.com' : 'e.g. 0911223344 or IBAN'}
              placeholderTextColor="#555"
              autoCapitalize="none"
            />

            <Text style={mStyles.sectionLabel}>Account Holder Name</Text>
            <TextInput
              style={mStyles.input}
              value={payoutName}
              onChangeText={setPayoutName}
              placeholder="Your full legal name"
              placeholderTextColor="#555"
            />

            <TouchableOpacity
              style={[mStyles.confirmBtn, payoutLoading && { opacity: 0.6 }]}
              activeOpacity={0.88}
              onPress={handlePayout}
              disabled={payoutLoading}
            >
              {payoutLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={mStyles.confirmBtnText}>Request Withdrawal</Text>
              )}
            </TouchableOpacity>

            <Text style={[mStyles.sandboxNote, { color: '#60A5FA' }]}>
              ℹ️ Payouts are verified and sent to your account within 24 hours.
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function MethodPill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[mStyles.methodBtn, selected && mStyles.methodBtnActive]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Text style={[mStyles.methodBtnText, selected && mStyles.methodBtnTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Pixel-Perfect Styles (Matching Reference Design 299e33ea.png) ───────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050B0E', // Deep charcoal background from reference
  },

  // Header matching image
  header: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#0E1922',
  },
  headerInner: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pageInner: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  walletHeaderIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 230, 118, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  headerTextWrap: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: '#8A95A5',
    marginTop: 2,
  },
  currencyPill: {
    backgroundColor: '#0B151C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  currencyPillText: {
    color: '#00E676',
    fontSize: 12,
    fontWeight: '700',
  },

  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#8A95A5',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // ── Hero Balance Card ───────────────────────────────────────────────────────
  heroCard: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 14,
    borderRadius: 22,
    backgroundColor: '#0A1318',
    borderWidth: 1,
    borderColor: '#15242D',
    overflow: 'hidden',
    position: 'relative',
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  heroBgAthlete: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 260,
    maxWidth: '52%',
    height: '100%',
    opacity: 0.88,
  },
  heroShadowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 19, 24, 0.45)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    zIndex: 2,
  },
  coin3dBadge: {
    width: 52,
    height: 52,
    marginTop: 2,
  },
  heroBalanceTextWrap: {
    zIndex: 2,
  },
  heroCoinLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0B0C0',
  },
  heroBalanceNumber: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginTop: -2,
  },
  heroEquivalentText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00E676',
    marginTop: 1,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  trendPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00E676',
  },
  trendArrow: {
    fontSize: 11,
    color: '#00E676',
  },
  trendLabel: {
    fontSize: 11,
    color: '#8A95A5',
  },

  // Dual Action Buttons inside Hero Card
  heroActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    zIndex: 2,
  },
  topUpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#00E676',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  topUpIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnTextWrap: {
    flex: 1,
  },
  topUpBtnTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#000000',
  },
  topUpBtnSub: {
    fontSize: 10.5,
    color: 'rgba(0, 0, 0, 0.75)',
    fontWeight: '600',
    marginTop: 1,
  },
  withdrawBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#091319',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#00E676',
  },
  withdrawIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  withdrawBtnTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  withdrawBtnSub: {
    fontSize: 10.5,
    color: '#8A95A5',
    marginTop: 1,
  },

  // ── Coach Earnings Section ─────────────────────────────────────────────────
  coachCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#0B151C',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#14222C',
  },
  coachHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  coachIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  coachSubtitle: {
    fontSize: 12,
    color: '#8A95A5',
    marginTop: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  metricCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  metricLabel: {
    fontSize: 9.5,
    color: '#8A95A5',
    marginTop: 3,
    textAlign: 'center',
    lineHeight: 13,
  },

  // ── Pro Callout Banner ─────────────────────────────────────────────────────
  proCalloutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#0B151C',
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#14222C',
  },
  proCalloutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  proCalloutText: {
    fontSize: 12.5,
    color: '#8A95A5',
    lineHeight: 17,
    flex: 1,
  },
  proHighlight: {
    color: '#00E676',
    fontWeight: '700',
  },

  // ── Recent Transactions ────────────────────────────────────────────────────
  txSection: {
    paddingHorizontal: 16,
    marginTop: 2,
  },
  txHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  txSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  viewAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F1A22',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1A2935',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A95A5',
  },

  // Empty State matching image
  emptyCard: {
    backgroundColor: '#0B151C',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#14222C',
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptySparkleWallet: {
    fontSize: 38,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#8A95A5',
  },

  // Populated Transaction List
  txListContainer: {
    backgroundColor: '#0B151C',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#14222C',
    paddingHorizontal: 14,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#121E27',
  },
  txIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txBadgeCredit: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  txBadgeDebit: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  txDetails: {
    flex: 1,
  },
  txDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  txDate: {
    fontSize: 11.5,
    color: '#8A95A5',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  txAmountCredit: {
    color: '#00E676',
  },
  txAmountDebit: {
    color: '#F87171',
  },
});

const mStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0F171E',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    borderWidth: 1,
    borderColor: '#1B2733',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#8A95A5',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#8A95A5',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 14,
  },

  // Bundles
  bundleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bundleCard: {
    flex: 1,
    backgroundColor: '#15212B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#223242',
    alignItems: 'center',
    position: 'relative',
  },
  bundleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0,230,118,0.08)',
  },
  bundleBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bundleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
  },
  bundleCoins: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 6,
  },
  bundleLabel: {
    fontSize: 11,
    color: '#8A95A5',
    marginTop: 3,
  },
  bundlePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 5,
  },

  // Method selector
  methodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#223242',
    backgroundColor: '#15212B',
    alignItems: 'center',
  },
  methodBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0,230,118,0.1)',
  },
  methodBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#8A95A5',
  },
  methodBtnTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#8A95A5',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  confirmBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 15,
  },
  sandboxNote: {
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
  },

  input: {
    backgroundColor: '#15212B',
    borderWidth: 1,
    borderColor: '#223242',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
  },
  inputHint: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },

  // Currency modal
  currencyList: {
    gap: 10,
    marginTop: 10,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#15212B',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#223242',
  },
  currencyOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0,230,118,0.08)',
  },
  currencyFlag: {
    fontSize: 26,
  },
  currencyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  currencyRate: {
    fontSize: 12,
    color: '#8A95A5',
    marginTop: 2,
  },
});
