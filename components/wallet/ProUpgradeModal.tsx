import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useUserStore, UserTier } from '../../store/userStore';
import { activateProWithCoins } from '../../lib/walletService';

interface ProUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  coinsBalance: number;
  onSuccess: (newBalance: number) => void;
  onOpenTopup: () => void;
}

export default function ProUpgradeModal({
  visible,
  onClose,
  coinsBalance,
  onSuccess,
  onOpenTopup,
}: ProUpgradeModalProps) {
  const { user, setTier } = useUserStore();
  const [selectedPlan, setSelectedPlan] = useState<'month' | 'year'>('month');
  const [loading, setLoading] = useState(false);

  const cost = selectedPlan === 'month' ? 500 : 4800;
  const durationDays = selectedPlan === 'month' ? 30 : 365;
  const hasEnoughCoins = coinsBalance >= cost;

  const handleUpgrade = async () => {
    if (!user.uid) return;
    if (!hasEnoughCoins) {
      onClose();
      onOpenTopup();
      return;
    }

    setLoading(true);
    try {
      const res = await activateProWithCoins(user.uid, durationDays, cost);
      if (!res.success) {
        Alert.alert('Upgrade Failed', res.error || 'Failed to activate Pro membership.');
        return;
      }

      setTier(UserTier.PREMIUM);
      onSuccess(res.remainingBalance ?? coinsBalance - cost);
      onClose();

      const msg = `🎉 Congratulations! You are now a FitPulse Pro member!\nYour Pro perks and golden badge are active.`;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('⭐ FitPulse Pro Active!', msg);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not complete upgrade.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={s.sheet} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={s.handle} />

          {/* Close button */}
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color="#8A95A5" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
            {/* Crown Hero Icon */}
            <View style={s.iconWrap}>
              <Ionicons name="star" size={36} color="#EAB308" />
            </View>

            <Text style={s.title}>FitPulse Pro ⭐</Text>
            <Text style={s.subtitle}>Unlock your ultimate fitness potential</Text>

            {/* Perks List */}
            <View style={s.perksCard}>
              <PerkRow icon="ribbon" text="Golden Pro Badge across your profile & feed" />
              <PerkRow icon="barbell" text="Full access to master workout programs & meal plans" />
              <PerkRow icon="sparkles" text="Unlimited AI workout & form video analysis" />
              <PerkRow icon="chatbubble-ellipses" text="Priority direct messaging with Certified Coaches" />
              <PerkRow icon="gift" text="10% bonus coins on all future wallet top-ups" />
            </View>

            {/* Plan Selector */}
            <Text style={s.sectionTitle}>Select Plan</Text>
            <View style={s.plansRow}>
              {/* 1 Month */}
              <TouchableOpacity
                style={[s.planCard, selectedPlan === 'month' && s.planCardActive]}
                activeOpacity={0.8}
                onPress={() => setSelectedPlan('month')}
              >
                <Text style={s.planDuration}>1 Month</Text>
                <Text style={s.planCoins}>🪙 500</Text>
                <Text style={s.planSub}>Coins / month</Text>
              </TouchableOpacity>

              {/* 1 Year */}
              <TouchableOpacity
                style={[s.planCard, selectedPlan === 'year' && s.planCardActive]}
                activeOpacity={0.8}
                onPress={() => setSelectedPlan('year')}
              >
                <View style={s.discountBadge}>
                  <Text style={s.discountText}>SAVE 20%</Text>
                </View>
                <Text style={s.planDuration}>1 Year</Text>
                <Text style={s.planCoins}>🪙 4,800</Text>
                <Text style={s.planSub}>🪙 400 / month</Text>
              </TouchableOpacity>
            </View>

            {/* Current Balance */}
            <View style={s.balanceRow}>
              <Text style={s.balanceLabel}>Your Balance:</Text>
              <Text style={[s.balanceValue, { color: hasEnoughCoins ? '#00E676' : '#F87171' }]}>
                🪙 {coinsBalance.toLocaleString()} Coins
                {hasEnoughCoins ? ' (Sufficient)' : ' (Needs Top-Up)'}
              </Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[s.upgradeBtn, loading && { opacity: 0.6 }]}
              activeOpacity={0.85}
              onPress={handleUpgrade}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={s.upgradeBtnText}>
                  {hasEnoughCoins ? `Activate with 🪙 ${cost} Coins` : `Top Up Coins to Activate`}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function PerkRow({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={s.perkRow}>
      <View style={s.perkIconWrap}>
        <Ionicons name={icon} size={15} color="#EAB308" />
      </View>
      <Text style={s.perkText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0F171E',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 16,
    paddingHorizontal: 22,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderWidth: 1,
    borderColor: '#1D2A36',
    maxHeight: '90%',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: 8,
  },
  closeBtn: { alignSelf: 'flex-end', padding: 4 },
  content: { paddingBottom: 20 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(234, 179, 8, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#8A95A5', textAlign: 'center', marginTop: 4, marginBottom: 18 },
  perksCard: {
    backgroundColor: '#15212B',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#223242',
    marginBottom: 18,
  },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  perkIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  perkText: { fontSize: 13, color: '#E2E8F0', flex: 1, fontWeight: '500' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#8A95A5', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  plansRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  planCard: {
    flex: 1,
    backgroundColor: '#15212B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#223242',
    alignItems: 'center',
    position: 'relative',
  },
  planCardActive: {
    borderColor: '#EAB308',
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
  },
  discountBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: '#EAB308',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: { color: '#000', fontSize: 9, fontWeight: '800' },
  planDuration: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  planCoins: { fontSize: 20, fontWeight: '800', color: '#EAB308' },
  planSub: { fontSize: 11, color: '#8A95A5', marginTop: 2 },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1B2733',
    marginBottom: 12,
  },
  balanceLabel: { fontSize: 13, color: '#8A95A5' },
  balanceValue: { fontSize: 13, fontWeight: '700' },
  upgradeBtn: {
    backgroundColor: '#EAB308',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  upgradeBtnText: { color: '#000', fontSize: 15.5, fontWeight: '800' },
});
