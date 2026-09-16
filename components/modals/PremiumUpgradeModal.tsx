import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useUserStore, UserTier } from '../../store/userStore';

const { height } = Dimensions.get('window');

interface PremiumUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PremiumUpgradeModal({ visible, onClose }: PremiumUpgradeModalProps) {
  const { setUser, user } = useUserStore();

  const handleUpgrade = () => {
    // Simulate upgrading to Premium
    setUser({ ...user, tier: UserTier.PREMIUM });
    onClose();
    alert("Welcome to Premium! All features unlocked.");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.bottomSheet}>
          <View style={styles.dragIndicator} />
          
          <View style={styles.iconContainer}>
            <Ionicons name="star" size={48} color="#D4AF37" />
          </View>

          <Text style={styles.title}>Unlock Premium</Text>
          <Text style={styles.subtitle}>Get 1-on-1 coaching with certified personal trainers and full access to all features.</Text>
          
          <View style={styles.featuresList}>
            <FeatureItem text="Real Human Personal Trainer" />
            <FeatureItem text="Custom Meal Plans" />
            <FeatureItem text="Advanced Analytics & Tracking" />
            <FeatureItem text="Ad-free Experience" />
          </View>

          <TouchableOpacity style={styles.upgradeButton} activeOpacity={0.8} onPress={handleUpgrade}>
            <Text style={styles.upgradeButtonText}>Upgrade Now - $9.99/mo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cancelButton} activeOpacity={0.8} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  bottomSheet: {
    backgroundColor: '#0C0C0C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    marginBottom: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  featuresList: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  featureText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },
  upgradeButton: {
    backgroundColor: '#D4AF37', // Gold for premium
    width: '100%',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    width: '100%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
