import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface FitPulseConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function FitPulseConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  icon,
  loading = false,
  onConfirm,
  onCancel,
}: FitPulseConfirmModalProps) {
  if (!visible) return null;

  const isDanger = type === 'danger';
  const isWarning = type === 'warning';

  const defaultIcon: keyof typeof Ionicons.glyphMap = isDanger
    ? 'trash-outline'
    : isWarning
    ? 'alert-circle-outline'
    : 'information-circle-outline';

  const resolvedIcon = icon || defaultIcon;

  const iconColor = isDanger ? '#EF4444' : isWarning ? '#F59E0B' : '#00E676';
  const iconBg = isDanger
    ? 'rgba(239, 68, 68, 0.12)'
    : isWarning
    ? 'rgba(245, 158, 11, 0.12)'
    : 'rgba(0, 230, 118, 0.12)';

  const confirmBtnBg = isDanger ? '#EF4444' : isWarning ? '#F59E0B' : '#00E676';
  const confirmBtnTextColor = isDanger || isWarning ? '#FFFFFF' : '#050B0E';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={s.overlay}>
        <TouchableOpacity
          style={s.backdropDismiss}
          activeOpacity={1}
          onPress={onCancel}
        />

        <View style={s.card}>
          {/* Icon Badge */}
          <View style={[s.iconBadge, { backgroundColor: iconBg }]}>
            <Ionicons name={resolvedIcon} size={28} color={iconColor} />
          </View>

          {/* Title & Message */}
          <Text style={s.title}>{title}</Text>
          <Text style={s.message}>{message}</Text>

          {/* Actions Row */}
          <View style={s.btnRow}>
            <TouchableOpacity
              style={s.cancelBtn}
              activeOpacity={0.8}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={s.cancelBtnText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.confirmBtn, { backgroundColor: confirmBtnBg }]}
              activeOpacity={0.85}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={confirmBtnTextColor} />
              ) : (
                <Text style={[s.confirmBtnText, { color: confirmBtnTextColor }]}>
                  {confirmText}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 9999,
  },
  backdropDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F1A24',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#1C2C3D',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 12,
  },
  iconBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    color: '#8A95A5',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#162330',
    borderWidth: 1,
    borderColor: '#223447',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#A0ABBA',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
