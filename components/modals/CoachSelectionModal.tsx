import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const { height } = Dimensions.get('window');

interface CoachSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: 'AI_COACH' | 'REAL_COACH') => void;
}

export default function CoachSelectionModal({ visible, onClose, onSelect }: CoachSelectionModalProps) {
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
          
          <Text style={styles.title}>Choose Your Experience</Text>
          <Text style={styles.subtitle}>Select how you want to achieve your fitness goals today.</Text>
          
          <View style={styles.optionsContainer}>
            {/* Option 1: AI Coach */}
            <TouchableOpacity 
              style={styles.optionCard} 
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                onSelect('AI_COACH');
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 230, 118, 0.15)' }]}>
                <Ionicons name="hardware-chip-outline" size={24} color="#00E676" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>AI Coach</Text>
                <Text style={styles.optionSubtitle}>Instant personalized guidance & smart analytics.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>

            {/* Option 2: Real Coach */}
            <TouchableOpacity 
              style={styles.optionCard} 
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                onSelect('REAL_COACH');
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
                <Ionicons name="person-outline" size={24} color="#D4AF37" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Real Human Coach</Text>
                <Text style={styles.optionSubtitle}>1-on-1 coaching with certified personal trainers.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  bottomSheet: {
    backgroundColor: '#0C0C0C', // Dark theme surface
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: height * 0.8,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAA',
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#AAA',
    lineHeight: 16,
  },
});
