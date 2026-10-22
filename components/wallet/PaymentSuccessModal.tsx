import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FitPulseCoinSvg from '../ui/FitPulseCoinSvg';

interface PaymentSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  coinsAdded?: number;
  newBalance?: number;
  paymentMethod?: string;
  txRef?: string;
  title?: string;
  subtitle?: string;
}

const { width } = Dimensions.get('window');

export default function PaymentSuccessModal({
  visible,
  onClose,
  coinsAdded = 350,
  newBalance,
  paymentMethod = 'Telebirr / CBE (Chapa)',
  txRef,
  title,
  subtitle,
}: PaymentSuccessModalProps) {
  const isPro = coinsAdded === 0;
  const displayTitle = title || (isPro ? 'FitPulse Pro Activated! ⭐' : 'Payment Successful!');
  const displaySubtitle = subtitle || (isPro ? 'Your Pro perks and golden badge are now active.' : 'Your coins have been added to your FitPulse Wallet.');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* Top Decorative Glow Dot */}
          <View style={styles.topGlow} />

          {/* Close button top-right */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color="#8A95A5" />
          </TouchableOpacity>

          {/* 3D FitPulse Coin Icon Badge */}
          <View style={styles.coinBadgeWrap}>
            {isPro ? (
              <Ionicons name="star" size={56} color="#EAB308" />
            ) : (
              <FitPulseCoinSvg size={64} />
            )}
          </View>

          {/* Title & Celebration Header */}
          <Text style={styles.titleText}>{displayTitle}</Text>
          <Text style={styles.subtitleText}>{displaySubtitle}</Text>

          {/* Coins Added Highlight Card */}
          <View style={[styles.coinsAddedCard, isPro && { backgroundColor: 'rgba(234, 179, 8, 0.12)', borderColor: 'rgba(234, 179, 8, 0.3)' }]}>
            <Text style={[styles.coinsAddedNumber, isPro && { color: '#EAB308', fontSize: 24 }]}>
              {isPro ? '⭐ PRO ACTIVATED' : `+${coinsAdded.toLocaleString()}`}
            </Text>
            <Text style={styles.coinsAddedLabel}>
              {isPro ? 'VIP Perks & Golden Badge Active' : 'FitPulse Coins Credited'}
            </Text>
          </View>

          {/* Summary Details Box */}
          <View style={styles.detailsBox}>
            {typeof newBalance === 'number' && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>New Balance</Text>
                <View style={styles.detailValueRow}>
                  <FitPulseCoinSvg size={14} />
                  <Text style={styles.detailValueBold}>
                    {newBalance.toLocaleString()} Coins
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValueText}>{paymentMethod}</Text>
            </View>

            <View style={[styles.detailRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={styles.detailLabel}>Status</Text>
              <View style={styles.statusPill}>
                <Ionicons name="checkmark-circle" size={13} color="#00E676" />
                <Text style={styles.statusPillText}>Completed</Text>
              </View>
            </View>
          </View>

          {/* Large Action Done Button */}
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
    backgroundColor: 'rgba(5, 11, 14, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 9999,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#0F1820',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 230, 118, 0.35)',
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 22,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 12,
  },
  topGlow: {
    position: 'absolute',
    top: -2,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: '#00E676',
    borderRadius: 3,
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16222D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinBadgeWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 13,
    color: '#8A95A5',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  coinsAddedCard: {
    width: '100%',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 16,
  },
  coinsAddedNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#00E676',
    letterSpacing: -0.5,
  },
  coinsAddedLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: '#0A1218',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#172530',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#121E28',
  },
  detailLabel: {
    fontSize: 12.5,
    color: '#8A95A5',
    fontWeight: '500',
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailValueBold: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailValueText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00E676',
  },
  doneBtn: {
    width: '100%',
    backgroundColor: '#00E676',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.2,
  },
});
