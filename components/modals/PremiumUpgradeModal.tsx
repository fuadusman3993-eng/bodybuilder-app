import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '../ui/BottomSheet';
import Badge from '../ui/Badge';
import { Colors } from '../../constants/colors';
import { useUserStore, UserTier } from '../../store/userStore';

interface PremiumUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  featureTitle?: string;
  featureDescription?: string;
}

const PREMIUM_PERKS = [
  {
    icon: 'person-outline' as const,
    color: '#D4AF37',
    title: 'Real Human Personal Trainer',
    desc: 'Your coach builds your weekly routine, reviews your form via video, and keeps you accountable every day.',
  },
  {
    icon: 'nutrition-outline' as const,
    color: Colors.primary,
    title: 'Custom Meal Plans',
    desc: 'Personalized nutrition plans based on your goals, body type, and food preferences — updated weekly.',
  },
  {
    icon: 'trending-up-outline' as const,
    color: '#818CF8',
    title: 'Advanced Progress Analytics',
    desc: 'See your strength trends, body composition changes, and performance improvements over time with detailed charts.',
  },
  {
    icon: 'videocam-outline' as const,
    color: '#F59E0B',
    title: 'Live Video Coaching Sessions',
    desc: 'Book 1-on-1 video calls with certified trainers to review your technique and adjust your program in real time.',
  },
];

export default function PremiumUpgradeModal({
  visible,
  onClose,
  featureTitle = 'Real Human Coach',
  featureDescription = 'Your personal coach can build your weekly routine, review your progress, and guide you through every training session.',
}: PremiumUpgradeModalProps) {
  const { setUser, user } = useUserStore();

  const handleUpgrade = () => {
    setUser({ ...user, tier: UserTier.PREMIUM });
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      snapHeight={0.92}
    >
      <View style={styles.container}>
        {/* Crown icon */}
        <View style={styles.crownBox}>
          <Ionicons name="star" size={36} color="#D4AF37" />
        </View>

        <Badge label="Premium Feature" variant="premium" style={styles.badge} />

        {/* Feature explanation - NOT just "Premium Required" */}
        <Text style={styles.featureTitle}>{featureTitle}</Text>
        <Text style={styles.featureDescription}>{featureDescription}</Text>

        {/* Why Premium */}
        <View style={styles.unlockWithPremium}>
          <Ionicons name="lock-open-outline" size={14} color="#D4AF37" />
          <Text style={styles.unlockText}>Unlock this with <Text style={styles.unlockHighlight}>Premium</Text></Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />
        <Text style={styles.perksTitle}>Everything included in Premium:</Text>

        {/* Perks */}
        {PREMIUM_PERKS.map((perk, i) => (
          <View key={i} style={styles.perkRow}>
            <View style={[styles.perkIcon, { backgroundColor: `${perk.color}18` }]}>
              <Ionicons name={perk.icon} size={20} color={perk.color} />
            </View>
            <View style={styles.perkText}>
              <Text style={styles.perkTitle}>{perk.title}</Text>
              <Text style={styles.perkDesc}>{perk.desc}</Text>
            </View>
          </View>
        ))}

        {/* After upgrade note */}
        <View style={styles.afterBox}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
          <Text style={styles.afterText}>
            After upgrading, your coach is assigned within 24 hours and your first session is free.
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade} activeOpacity={0.85}>
          <Ionicons name="star" size={18} color="#000" />
          <Text style={styles.upgradeBtnText}>Upgrade to Premium — $9.99/mo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.laterBtn} onPress={onClose}>
          <Text style={styles.laterText}>Maybe Later</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 8,
    alignItems: 'center',
  },
  crownBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212,175,55,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  badge: { marginBottom: 14 },
  featureTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  unlockWithPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  unlockText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  unlockHighlight: {
    color: '#D4AF37',
    fontWeight: '700',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16,
  },
  perksTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    width: '100%',
    marginBottom: 14,
  },
  perkIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  perkText: { flex: 1 },
  perkTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  perkDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  afterBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(16,185,129,0.07)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.18)',
    width: '100%',
    marginBottom: 20,
    marginTop: 4,
    alignItems: 'flex-start',
  },
  afterText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  upgradeBtn: {
    backgroundColor: '#D4AF37',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    marginBottom: 12,
  },
  upgradeBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  laterBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  laterText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
});
