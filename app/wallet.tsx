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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { useUserStore } from '../store/userStore';
import {
  getWallet,
  getTransactionHistory,
  topupWalletSandbox,
  requestCoachPayout,
  Wallet,
  CoinTransaction,
  CoinBundle,
  COIN_BUNDLES,
  coinsToEtb,
} from '../lib/walletService';

const { width } = Dimensions.get('window');

// ── Helper Components ──────────────────────────────────────────────────────

function RoleBadge({ role, tier, isVerified }: { role?: string; tier: string; isVerified?: boolean }) {
  if (tier === 'premium') {
    return (
      <View style={[badge.wrap, { backgroundColor: 'rgba(234, 179, 8, 0.15)', borderColor: 'rgba(234, 179, 8, 0.5)' }]}>
        <Ionicons name="star" size={12} color="#EAB308" />
        <Text style={[badge.text, { color: '#EAB308' }]}>FitPulse Pro</Text>
      </View>
    );
  }
  if (role === 'coach') {
    return (
      <View style={[badge.wrap, { backgroundColor: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.4)' }]}>
        <Ionicons name={isVerified ? 'shield-checkmark' : 'stopwatch'} size={12} color={isVerified ? '#60A5FA' : '#3B82F6'} />
        <Text style={[badge.text, { color: '#60A5FA' }]}>{isVerified ? 'Certified Coach' : 'Coach'}</Text>
      </View>
    );
  }
  return (
    <View style={[badge.wrap, { backgroundColor: 'rgba(0,230,118,0.10)', borderColor: 'rgba(0,230,118,0.25)' }]}>
      <Ionicons name="person" size={12} color={Colors.primary} />
      <Text style={[badge.text, { color: Colors.primary }]}>Athlete</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  text: { fontSize: 11, fontWeight: '700' },
});

function TxIcon({ type }: { type: string }) {
  const map: Record<string, { name: any; color: string; bg: string }> = {
    topup:              { name: 'add-circle',           color: '#00E676', bg: 'rgba(0,230,118,0.12)' },
    spend_coach:        { name: 'person-circle',        color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    spend_plan:         { name: 'barbell',              color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
    spend_subscription: { name: 'star',                 color: '#EAB308', bg: 'rgba(234,179,8,0.12)' },
    coach_earning:      { name: 'trending-up',          color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
    payout:             { name: 'arrow-up-circle',      color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
    tip:                { name: 'gift',                 color: '#F472B6', bg: 'rgba(244,114,182,0.12)' },
  };
  const m = map[type] ?? { name: 'cash', color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' };
  return (
    <View style={[txStyles.iconWrap, { backgroundColor: m.bg }]}>
      <Ionicons name={m.name} size={20} color={m.color} />
    </View>
  );
}

const txStyles = StyleSheet.create({
  iconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});

// ── Main Wallet Screen ──────────────────────────────────────────────────────

export default function WalletScreen() {
  const router = useRouter();
  const { user, updateCoins } = useUserStore();

  const [wallet, setWallet]       = useState<Wallet | null>(null);
  const [txs, setTxs]             = useState<CoinTransaction[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Top-up modal
  const [showTopup, setShowTopup]         = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<CoinBundle>(COIN_BUNDLES[1]);
  const [selectedMethod, setSelectedMethod] = useState<'telebirr' | 'cbe_birr' | 'chapa'>('telebirr');
  const [toppingUp, setToppingUp]         = useState(false);

  // Payout modal (coaches)
  const [showPayout, setShowPayout]     = useState(false);
  const [payoutCoins, setPayoutCoins]   = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'telebirr' | 'cbe_birr'>('telebirr');
  const [payoutAccount, setPayoutAccount] = useState('');
  const [payoutName, setPayoutName]     = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);

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

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, [fetchAll]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleTopup = async () => {
    if (!user.uid) return;
    setToppingUp(true);
    try {
      const res = await topupWalletSandbox(user.uid, selectedBundle, selectedMethod);
      if (res.success) {
        const newBal = res.newBalance ?? (wallet?.balance_coins ?? 0) + selectedBundle.coins;
        setWallet(prev => prev ? { ...prev, balance_coins: newBal } : null);
        updateCoins(newBal);
        setShowTopup(false);
        const msg = `✅ ${selectedBundle.coins} Coins added!\nNew Balance: ${newBal} Coins`;
        if (Platform.OS === 'web') { window.alert(msg); } else { Alert.alert('Top-Up Successful', msg); }
        fetchAll();
      } else {
        const msg = `Top-up failed: ${res.error}`;
        if (Platform.OS === 'web') { window.alert(msg); } else { Alert.alert('Error', msg); }
      }
    } finally {
      setToppingUp(false);
    }
  };

  const handlePayout = async () => {
    const coins = parseInt(payoutCoins, 10);
    if (!coins || coins <= 0 || !payoutAccount.trim() || !payoutName.trim()) {
      const msg = 'Please fill in all payout fields.';
      if (Platform.OS === 'web') { window.alert(msg); } else { Alert.alert('Error', msg); }
      return;
    }
    const bal = wallet?.balance_coins ?? 0;
    if (coins > bal) {
      const msg = 'You do not have enough coins for this payout.';
      if (Platform.OS === 'web') { window.alert(msg); } else { Alert.alert('Insufficient Coins', msg); }
      return;
    }
    setPayoutLoading(true);
    try {
      const res = await requestCoachPayout({
        coachUid: user.uid!,
        coins,
        amountEtb: coinsToEtb(coins),
        method: payoutMethod,
        accountNumber: payoutAccount,
        accountName: payoutName,
      });
      if (res.success) {
        setShowPayout(false);
        setPayoutCoins('');
        setPayoutAccount('');
        setPayoutName('');
        const msg = `✅ Payout of ${coinsToEtb(coins)} ETB requested!\nWe will process it within 24 hours.`;
        if (Platform.OS === 'web') { window.alert(msg); } else { Alert.alert('Payout Requested', msg); }
        fetchAll();
      } else {
        const msg = res.error === 'INSUFFICIENT_COINS' ? 'Not enough coins in your wallet.' : (res.error ?? 'Payout failed.');
        if (Platform.OS === 'web') { window.alert(msg); } else { Alert.alert('Payout Failed', msg); }
      }
    } finally {
      setPayoutLoading(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-ET', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const balance = wallet?.balance_coins ?? 0;
  const lifetimeEarnings = wallet?.lifetime_earnings_coins ?? 0;
  const isCoach = user.role === 'coach';

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FitPulse Wallet</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {/* ── Hero Balance Card ─────────────────────────────── */}
          <View style={styles.heroCard}>
            {/* Top role badge row */}
            <View style={styles.heroTopRow}>
              <RoleBadge role={user.role} tier={user.tier} isVerified={user.isCoachVerified} />
              <View style={styles.coinRateTag}>
                <Text style={styles.coinRateText}>1 Coin = 1 ETB</Text>
              </View>
            </View>

            {/* Balance */}
            <View style={styles.balanceRow}>
              <Text style={styles.coinEmoji}>🪙</Text>
              <Text style={styles.balanceNum}>{balance.toLocaleString()}</Text>
            </View>
            <Text style={styles.balanceLabel}>FitPulse Coins</Text>
            <Text style={styles.balanceEtb}>≈ {coinsToEtb(balance).toLocaleString()} ETB</Text>

            {/* Action Buttons */}
            <View style={styles.actionBtnRow}>
              <TouchableOpacity style={styles.primaryActionBtn} activeOpacity={0.85} onPress={() => setShowTopup(true)}>
                <Ionicons name="add-circle" size={20} color="#000" />
                <Text style={styles.primaryActionBtnText}>Top Up Coins</Text>
              </TouchableOpacity>
              {isCoach && (
                <TouchableOpacity style={styles.secondaryActionBtn} activeOpacity={0.85} onPress={() => setShowPayout(true)}>
                  <Ionicons name="arrow-up-circle-outline" size={20} color={Colors.primary} />
                  <Text style={styles.secondaryActionBtnText}>Withdraw</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── Coach Earnings Summary (Coaches Only) ─────────── */}
          {isCoach && (
            <View style={styles.coachEarningsCard}>
              <View style={styles.coachEarningsHeader}>
                <Ionicons name="trending-up" size={18} color="#34D399" />
                <Text style={styles.coachEarningsTitle}>Coach Earnings</Text>
              </View>
              <View style={styles.coachStatsRow}>
                <View style={styles.coachStat}>
                  <Text style={styles.coachStatValue}>{lifetimeEarnings.toLocaleString()}</Text>
                  <Text style={styles.coachStatLabel}>Lifetime Coins Earned</Text>
                </View>
                <View style={styles.coachStatDivider} />
                <View style={styles.coachStat}>
                  <Text style={styles.coachStatValue}>{coinsToEtb(lifetimeEarnings).toLocaleString()}</Text>
                  <Text style={styles.coachStatLabel}>Equivalent ETB</Text>
                </View>
                <View style={styles.coachStatDivider} />
                <View style={styles.coachStat}>
                  <Text style={styles.coachStatValue}>{(wallet?.pending_payout_etb ?? 0).toFixed(2)}</Text>
                  <Text style={styles.coachStatLabel}>Pending Payout</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Spending Note ─────────────────────────────────── */}
          <View style={styles.spendingNote}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.spendingNoteText}>
              Use coins to hire coaches, buy workout plans, or upgrade to{' '}
              <Text style={{ color: '#EAB308', fontWeight: '700' }}>FitPulse Pro</Text>.
            </Text>
          </View>

          {/* ── Transaction History ───────────────────────────── */}
          <View style={styles.txSection}>
            <Text style={styles.txSectionTitle}>Recent Transactions</Text>
            {txs.length === 0 ? (
              <View style={styles.emptyTx}>
                <Ionicons name="receipt-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyTxText}>No transactions yet</Text>
                <Text style={styles.emptyTxSub}>Top up coins to get started!</Text>
              </View>
            ) : (
              txs.map((tx) => {
                const isCredit = tx.amount_coins > 0;
                return (
                  <View key={tx.id} style={styles.txRow}>
                    <TxIcon type={tx.type} />
                    <View style={styles.txInfo}>
                      <Text style={styles.txDesc} numberOfLines={1}>{tx.description ?? tx.type}</Text>
                      <Text style={styles.txDate}>{formatDate(tx.created_at)}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: isCredit ? '#00E676' : '#F87171' }]}>
                      {isCredit ? '+' : ''}{tx.amount_coins} 🪙
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* ── TOP-UP MODAL ─────────────────────────────────────────── */}
      <Modal visible={showTopup} transparent animationType="slide" onRequestClose={() => setShowTopup(false)}>
        <TouchableOpacity style={modalS.overlay} activeOpacity={1} onPress={() => setShowTopup(false)}>
          <TouchableOpacity style={modalS.sheet} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={modalS.handle} />
            <Text style={modalS.title}>Top Up Coins</Text>
            <Text style={modalS.subtitle}>1 ETB = 1 FitPulse Coin</Text>

            {/* Coin Bundles */}
            <Text style={modalS.sectionLabel}>Choose Bundle</Text>
            <View style={modalS.bundleRow}>
              {COIN_BUNDLES.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[modalS.bundleCard, selectedBundle.id === b.id && modalS.bundleCardActive]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedBundle(b)}
                >
                  {b.badge && (
                    <View style={modalS.badgePill}>
                      <Text style={modalS.badgePillText}>{b.badge}</Text>
                    </View>
                  )}
                  <Text style={modalS.bundleCoins}>🪙 {b.coins}</Text>
                  <Text style={modalS.bundleLabel}>{b.label}</Text>
                  <Text style={modalS.bundlePrice}>{b.price_etb} ETB</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Payment Method */}
            <Text style={modalS.sectionLabel}>Payment Method</Text>
            <View style={modalS.methodRow}>
              {(['telebirr', 'cbe_birr', 'chapa'] as const).map((m) => {
                const labels: Record<string, string> = { telebirr: '📱 Telebirr', cbe_birr: '🏦 CBE Birr', chapa: '💳 Chapa' };
                return (
                  <TouchableOpacity
                    key={m}
                    style={[modalS.methodBtn, selectedMethod === m && modalS.methodBtnActive]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedMethod(m)}
                  >
                    <Text style={[modalS.methodBtnText, selectedMethod === m && modalS.methodBtnTextActive]}>
                      {labels[m]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Summary */}
            <View style={modalS.summaryRow}>
              <Text style={modalS.summaryLabel}>You pay:</Text>
              <Text style={modalS.summaryValue}>{selectedBundle.price_etb} ETB</Text>
            </View>
            <View style={modalS.summaryRow}>
              <Text style={modalS.summaryLabel}>You get:</Text>
              <Text style={[modalS.summaryValue, { color: Colors.primary }]}>🪙 {selectedBundle.coins} Coins</Text>
            </View>

            <TouchableOpacity
              style={[modalS.confirmBtn, toppingUp && { opacity: 0.6 }]}
              activeOpacity={0.85}
              onPress={handleTopup}
              disabled={toppingUp}
            >
              {toppingUp ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={modalS.confirmBtnText}>Pay {selectedBundle.price_etb} ETB & Get {selectedBundle.coins} Coins</Text>
              )}
            </TouchableOpacity>

            <Text style={modalS.sandboxNote}>🧪 Sandbox Mode — No real money is charged</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── PAYOUT MODAL (Coaches Only) ──────────────────────────── */}
      {isCoach && (
        <Modal visible={showPayout} transparent animationType="slide" onRequestClose={() => setShowPayout(false)}>
          <TouchableOpacity style={modalS.overlay} activeOpacity={1} onPress={() => setShowPayout(false)}>
            <TouchableOpacity style={modalS.sheet} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={modalS.handle} />
              <Text style={modalS.title}>Withdraw Earnings</Text>
              <Text style={modalS.subtitle}>Available: 🪙 {balance} Coins ({coinsToEtb(balance)} ETB)</Text>

              <Text style={modalS.sectionLabel}>Coins to Withdraw</Text>
              <TextInput
                style={modalS.input}
                value={payoutCoins}
                onChangeText={setPayoutCoins}
                keyboardType="numeric"
                placeholder={`Max: ${balance} coins`}
                placeholderTextColor="#555"
              />
              {payoutCoins !== '' && (
                <Text style={modalS.inputHint}>= {coinsToEtb(parseInt(payoutCoins) || 0)} ETB</Text>
              )}

              <Text style={modalS.sectionLabel}>Cash Out Method</Text>
              <View style={modalS.methodRow}>
                {(['telebirr', 'cbe_birr'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[modalS.methodBtn, payoutMethod === m && modalS.methodBtnActive]}
                    onPress={() => setPayoutMethod(m)}
                    activeOpacity={0.8}
                  >
                    <Text style={[modalS.methodBtnText, payoutMethod === m && modalS.methodBtnTextActive]}>
                      {m === 'telebirr' ? '📱 Telebirr' : '🏦 CBE Birr'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={modalS.sectionLabel}>Account Number</Text>
              <TextInput
                style={modalS.input}
                value={payoutAccount}
                onChangeText={setPayoutAccount}
                keyboardType="phone-pad"
                placeholder="e.g. 0911223344"
                placeholderTextColor="#555"
              />

              <Text style={modalS.sectionLabel}>Account Holder Name</Text>
              <TextInput
                style={modalS.input}
                value={payoutName}
                onChangeText={setPayoutName}
                placeholder="Your full name"
                placeholderTextColor="#555"
              />

              <TouchableOpacity
                style={[modalS.confirmBtn, payoutLoading && { opacity: 0.6 }]}
                activeOpacity={0.85}
                onPress={handlePayout}
                disabled={payoutLoading}
              >
                {payoutLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={modalS.confirmBtnText}>Request Withdrawal</Text>
                )}
              </TouchableOpacity>

              <Text style={[modalS.sandboxNote, { color: '#60A5FA' }]}>
                ℹ️ Payouts are processed within 24 hours by the FitPulse team.
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080808' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#666', fontSize: 14 },
  scrollContent: { paddingBottom: 48 },

  // Hero Card
  heroCard: {
    margin: 16,
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(0,230,118,0.18)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  coinRateTag: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  coinRateText: { color: '#666', fontSize: 11, fontWeight: '600' },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  coinEmoji: { fontSize: 32 },
  balanceNum: { fontSize: 48, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 },
  balanceLabel: { color: '#9CA3AF', fontSize: 15, fontWeight: '600', marginTop: 2 },
  balanceEtb: { color: Colors.primary, fontSize: 14, fontWeight: '600', marginTop: 4 },
  actionBtnRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  primaryActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.primary, paddingVertical: 13, borderRadius: 14,
  },
  primaryActionBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
  secondaryActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: 'rgba(0,230,118,0.1)', paddingVertical: 13, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(0,230,118,0.25)',
  },
  secondaryActionBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },

  // Coach Earnings Card
  coachEarningsCard: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#111', borderRadius: 18,
    padding: 18, borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)',
  },
  coachEarningsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  coachEarningsTitle: { fontSize: 15, fontWeight: '700', color: '#34D399' },
  coachStatsRow: { flexDirection: 'row', alignItems: 'center' },
  coachStat: { flex: 1, alignItems: 'center' },
  coachStatValue: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  coachStatLabel: { fontSize: 10, color: '#6B7280', marginTop: 3, textAlign: 'center' },
  coachStatDivider: { width: 1, height: 30, backgroundColor: '#222' },

  // Spending Note
  spendingNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: '#111', padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#1e1e1e',
  },
  spendingNoteText: { flex: 1, fontSize: 12.5, color: '#9CA3AF', lineHeight: 18 },

  // Transaction History
  txSection: { paddingHorizontal: 16 },
  txSectionTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 },
  emptyTx: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTxText: { color: '#6B7280', fontSize: 15, fontWeight: '600' },
  emptyTxSub: { color: '#4B5563', fontSize: 13 },
  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#161616',
  },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontWeight: '500', color: '#E5E7EB' },
  txDate: { fontSize: 11.5, color: '#6B7280', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '800' },
});

const modalS = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#111', borderTopLeftRadius: 26, borderTopRightRadius: 26,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    borderWidth: 1, borderColor: '#1e1e1e',
  },
  handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  sectionLabel: { fontSize: 11.5, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 14 },

  bundleRow: { flexDirection: 'row', gap: 10 },
  bundleCard: {
    flex: 1, backgroundColor: '#1a1a1a', borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#262626', alignItems: 'center', position: 'relative',
  },
  bundleCardActive: { borderColor: Colors.primary, backgroundColor: 'rgba(0,230,118,0.08)' },
  badgePill: {
    position: 'absolute', top: -1, right: -1,
    backgroundColor: Colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
  },
  badgePillText: { fontSize: 9, fontWeight: '800', color: '#000' },
  bundleCoins: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginTop: 6 },
  bundleLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 3 },
  bundlePrice: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginTop: 5 },

  methodRow: { flexDirection: 'row', gap: 10 },
  methodBtn: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#2a2a2a', backgroundColor: '#1a1a1a', alignItems: 'center',
  },
  methodBtnActive: { borderColor: Colors.primary, backgroundColor: 'rgba(0,230,118,0.08)' },
  methodBtnText: { fontSize: 12.5, fontWeight: '600', color: '#9CA3AF' },
  methodBtnTextActive: { color: Colors.primary },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  summaryLabel: { fontSize: 13, color: '#9CA3AF' },
  summaryValue: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  confirmBtn: {
    backgroundColor: Colors.primary, paddingVertical: 15, borderRadius: 16,
    alignItems: 'center', marginTop: 18,
  },
  confirmBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
  sandboxNote: { fontSize: 11.5, color: '#4B5563', textAlign: 'center', marginTop: 10 },

  input: {
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#FFFFFF',
  },
  inputHint: { fontSize: 12, color: Colors.primary, marginTop: 4, fontWeight: '600' },
});
