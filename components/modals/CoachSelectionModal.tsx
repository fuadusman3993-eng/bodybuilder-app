import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '../ui/BottomSheet';
import { Colors } from '../../constants/colors';

interface CoachSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: 'AI_COACH' | 'REAL_COACH') => void;
}

const OPTIONS = [
  {
    key: 'AI_COACH' as const,
    icon: 'hardware-chip-outline' as const,
    iconColor: Colors.primary,
    iconBg: 'rgba(16,185,129,0.12)',
    label: 'AI Coach',
    tag: 'Free',
    tagColor: Colors.primary,
    description:
      'Get instant, science-backed workout plans and 24/7 guidance from your AI coach. It learns your performance and adapts your plan every week.',
    highlight: 'Best for: getting started fast with a smart plan.',
  },
  {
    key: 'REAL_COACH' as const,
    icon: 'person-outline' as const,
    iconColor: '#D4AF37',
    iconBg: 'rgba(212,175,55,0.12)',
    label: 'Real Human Coach',
    tag: 'Premium',
    tagColor: '#D4AF37',
    description:
      'Work with a certified personal trainer who reviews your form, builds your program from scratch, and holds you accountable with weekly check-ins.',
    highlight: 'Best for: serious athletes who want expert accountability.',
  },
];

export default function CoachSelectionModal({ visible, onClose, onSelect }: CoachSelectionModalProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Choose Your Experience"
      subtitle="Select how you want to reach your fitness goals. You can always switch later."
      snapHeight={0.78}
    >
      <View style={styles.container}>
        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => {
              onClose();
              onSelect(opt.key);
            }}
          >
            <View style={styles.cardTop}>
              <View style={[styles.iconBox, { backgroundColor: opt.iconBg }]}>
                <Ionicons name={opt.icon} size={26} color={opt.iconColor} />
              </View>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>{opt.label}</Text>
                <View style={[styles.tag, { backgroundColor: `${opt.tagColor}1A` }]}>
                  <Text style={[styles.tagText, { color: opt.tagColor }]}>{opt.tag}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </View>
            <Text style={styles.cardDescription}>{opt.description}</Text>
            <View style={styles.highlightRow}>
              <Ionicons name="checkmark-circle" size={14} color={opt.iconColor} />
              <Text style={[styles.highlightText, { color: opt.iconColor }]}>{opt.highlight}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  highlightText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
