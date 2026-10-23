import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FitPulseCoinSvg from '../ui/FitPulseCoinSvg';
import { CoinTransaction } from '../../lib/walletService';
import { CurrencyCode, coinsToFiat, formatCurrency } from '../../lib/currencyService';

interface TransactionReceiptModalProps {
  visible: boolean;
  tx: CoinTransaction | null;
  onClose: () => void;
  currency?: CurrencyCode;
}

const { width } = Dimensions.get('window');

export default function TransactionReceiptModal({
  visible,
  tx,
  onClose,
  currency = 'ETB',
}: TransactionReceiptModalProps) {
  const [copied, setCopied] = useState(false);

  if (!tx) return null;

  const isCredit = tx.amount_coins > 0;
  const absCoins = Math.abs(tx.amount_coins);

  // Extract reference ID from description if present
  let refId = tx.id;
  if (tx.description && tx.description.includes(':')) {
    const parts = tx.description.split(':');
    if (parts[1]?.trim()) {
      refId = parts[1].trim();
    }
  }

  // Friendly Title & Category
  let displayTitle = 'Transaction';
  let categoryLabel = 'Transfer';
  let paymentMethod = tx.payment_method || (isCredit ? 'Telebirr / CBE (Chapa)' : 'FitPulse Coins');

  if (tx.type === 'topup' || tx.description?.toLowerCase().includes('top-up')) {
    displayTitle = 'Wallet Top-up';
    categoryLabel = 'Deposit';
    paymentMethod = tx.payment_gateway ? tx.payment_gateway.toUpperCase() : 'Telebirr / CBE (Chapa)';
  } else if (tx.type === 'spend_subscription' || tx.description?.toLowerCase().includes('fitpulse pro')) {
    displayTitle = 'FitPulse Pro Upgrade';
    categoryLabel = 'Subscription';
    paymentMethod = 'FitPulse Coins';
  } else if (tx.type === 'spend_coach') {
    displayTitle = 'Coach Session Payment';
    categoryLabel = 'Coach Service';
    paymentMethod = 'FitPulse Coins';
  } else if (tx.type === 'spend_plan') {
    displayTitle = 'Workout Plan Purchase';
    categoryLabel = 'Training Plan';
    paymentMethod = 'FitPulse Coins';
  } else if (tx.type === 'payout') {
    displayTitle = 'Coach Withdrawal';
    categoryLabel = 'Payout';
    paymentMethod = tx.payment_method || 'Bank Transfer';
  } else if (tx.type === 'coach_earning') {
    displayTitle = 'Coaching Earnings';
    categoryLabel = 'Income';
    paymentMethod = 'FitPulse System';
  }

  // Format Date and Time
  const d = new Date(tx.created_at);
  const formattedDate = d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const handleCopyRef = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(refId);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* Top Decorative Glow Dot */}
          <View style={[styles.topGlow, { backgroundColor: isCredit ? '#00E676' : '#F59E0B' }]} />

          {/* Close button top-right */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color="#8A95A5" />
          </TouchableOpacity>

          {/* Icon Badge */}
          <View
            style={[
              styles.iconBadgeWrap,
              isCredit ? styles.iconBadgeCredit : styles.iconBadgeDebit,
            ]}
          >
            <Ionicons
              name={isCredit ? 'checkmark-circle' : 'receipt-outline'}
              size={36}
              color={isCredit ? '#00E676' : '#F59E0B'}
            />
          </View>

          {/* Title & Status */}
          <Text style={styles.titleText}>{displayTitle}</Text>
          <View style={styles.statusPill}>
            <Ionicons name="checkmark-circle" size={13} color="#00E676" />
            <Text style={styles.statusPillText}>Completed</Text>
          </View>

          {/* Amount Hero Card */}
          <View
            style={[
              styles.amountCard,
              isCredit ? styles.amountCardCredit : styles.amountCardDebit,
            ]}
          >
            <View style={styles.amountCoinRow}>
              <FitPulseCoinSvg size={24} />
              <Text
                style={[
                  styles.amountNumber,
                  { color: isCredit ? '#00E676' : '#F59E0B' },
                ]}
              >
                {isCredit ? '+' : '-'}{absCoins.toLocaleString()}
              </Text>
              <Text style={styles.amountCoinsLabel}>Coins</Text>
            </View>
            <Text style={styles.amountFiatSubtext}>
              ≈ {formatCurrency(coinsToFiat(absCoins, currency), currency)}
            </Text>
          </View>

          {/* Summary Details Box */}
          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValueText}>
                {formattedDate} • {formattedTime}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValueText}>{categoryLabel}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValueText}>{paymentMethod}</Text>
            </View>

            <View style={[styles.detailRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={styles.detailLabel}>Reference ID</Text>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={handleCopyRef}
                activeOpacity={0.7}
              >
                <Text style={styles.refIdText} numberOfLines={1}>
                  {refId.length > 20 ? `${refId.slice(0, 10)}...${refId.slice(-8)}` : refId}
                </Text>
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={14}
                  color={copied ? '#00E676' : '#8A95A5'}
                />
                {copied && <Text style={styles.copiedText}>Copied</Text>}
              </TouchableOpacity>
            </View>
          </View>

          {/* Done Button */}
          <TouchableOpacity
            style={styles.doneBtn}
            activeOpacity={0.88}
            onPress={onClose}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 14, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardContainer: {
    width: Math.min(width - 32, 400),
    backgroundColor: '#0A1318',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#15242D',
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    width: 60,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadgeWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  iconBadgeCredit: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  iconBadgeDebit: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 18,
  },
  statusPillText: {
    color: '#00E676',
    fontSize: 12,
    fontWeight: '700',
  },
  amountCard: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
  },
  amountCardCredit: {
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderColor: 'rgba(0, 230, 118, 0.20)',
  },
  amountCardDebit: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.20)',
  },
  amountCoinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountNumber: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  amountCoinsLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#A0B0C0',
  },
  amountFiatSubtext: {
    fontSize: 12.5,
    color: '#8A95A5',
    marginTop: 2,
    fontWeight: '500',
  },
  detailsBox: {
    width: '100%',
    backgroundColor: '#0E1922',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  detailLabel: {
    fontSize: 13,
    color: '#8A95A5',
    fontWeight: '500',
  },
  detailValueText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  refIdText: {
    fontSize: 12,
    color: '#A0B0C0',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    maxWidth: 130,
  },
  copiedText: {
    fontSize: 11,
    color: '#00E676',
    fontWeight: '700',
  },
  doneBtn: {
    width: '100%',
    backgroundColor: '#00E676',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  doneBtnText: {
    color: '#050B0E',
    fontSize: 15,
    fontWeight: '800',
  },
});
