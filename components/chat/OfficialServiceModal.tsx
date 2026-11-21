import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BrandLogo from '../ui/BrandLogo';
import { useTheme } from '../../store/themeStore';
import { Colors } from '../../constants/colors';

interface OfficialServiceModalProps {
  visible: boolean;
  onClose: () => void;
  onMessagePress?: () => void;
}

export default function OfficialServiceModal({
  visible,
  onClose,
  onMessagePress,
}: OfficialServiceModalProps) {
  const { colors } = useTheme();
  const [isMuted, setIsMuted] = useState(false);

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    const msg = isMuted
      ? 'Notifications from FitPulse Official are now enabled.'
      : 'Notifications from FitPulse Official have been muted.';
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Notifications', msg);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = 'https://bodybuilder-app-phi.vercel.app/chat';
      await Share.share({
        title: 'FitPulse Official Service',
        message: 'FitPulse Official Service & Verification Board: ' + shareUrl,
        url: shareUrl,
      });
    } catch (_) {}
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Top Close Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            activeOpacity={0.7}
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Telegram-Style Centered Circular Avatar */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
              <BrandLogo size="medium" customScale={0.9} showText={false} iconColor="#000000" />
            </View>
          </View>

          {/* Title & Verified Checkmark */}
          <View style={styles.titleRow}>
            <Text style={[styles.titleText, { color: colors.textPrimary }]}>
              FitPulse
            </Text>
            <View style={styles.verifiedCheckCircle}>
              <Ionicons name="checkmark-circle" size={19} color="#00E676" />
            </View>
          </View>

          {/* Subtitle */}
          <Text style={[styles.subtitleText, { color: colors.textMuted }]}>
            service notifications
          </Text>

          {/* Telegram-Style Quick Action Buttons: Message | Mute | Share */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionItem}
              activeOpacity={0.7}
              onPress={() => {
                onClose();
                onMessagePress?.();
              }}
            >
              <View style={[styles.actionIconBtn, { backgroundColor: colors.surfaceLight }]}>
                <Ionicons name="chatbubble" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              activeOpacity={0.7}
              onPress={handleToggleMute}
            >
              <View style={[styles.actionIconBtn, { backgroundColor: colors.surfaceLight }]}>
                <Ionicons
                  name={isMuted ? 'notifications-off' : 'notifications'}
                  size={18}
                  color={isMuted ? colors.textMuted : colors.primary}
                />
              </View>
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
                {isMuted ? 'Unmute' : 'Mute'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              activeOpacity={0.7}
              onPress={handleShare}
            >
              <View style={[styles.actionIconBtn, { backgroundColor: colors.surfaceLight }]}>
                <Ionicons name="arrow-redo" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Share</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Service Details Section */}
          <View style={styles.detailsBlock}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Account Type</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                Official System Service
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Channel ID</Text>
              <Text style={[styles.infoValue, { color: colors.primary }]}>
                @fitpulse_official
              </Text>
            </View>

            <View style={styles.descriptionBox}>
              <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                Official automated service notifications from FitPulse. We dispatch athlete safety updates,
                coach verification notifications, and critical security notices through this verified channel.
              </Text>
            </View>
          </View>

          {/* Verified Badge Guarantee Footer */}
          <View style={[styles.verifiedBanner, { backgroundColor: 'rgba(0, 230, 118, 0.08)', borderColor: 'rgba(0, 230, 118, 0.25)' }]}>
            <Ionicons name="shield-checkmark" size={16} color="#00E676" />
            <Text style={styles.verifiedBannerText}>
              Verified by FitPulse Mission Control & Sports Board
            </Text>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  avatarContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  verifiedCheckCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitleText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
    width: '100%',
    marginBottom: 16,
  },
  actionItem: {
    alignItems: 'center',
    gap: 6,
  },
  actionIconBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    width: '100%',
    height: 1,
    marginVertical: 12,
  },
  detailsBlock: {
    width: '100%',
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  descriptionBox: {
    marginTop: 4,
    paddingTop: 8,
  },
  descriptionText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '400',
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
    justifyContent: 'center',
  },
  verifiedBannerText: {
    color: '#00E676',
    fontSize: 11.5,
    fontWeight: '700',
  },
});
