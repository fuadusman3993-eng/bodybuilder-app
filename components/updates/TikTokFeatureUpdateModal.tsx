import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUpdateStore } from '../../store/updateStore';
import { Colors } from '../../constants/colors';

interface TikTokFeatureUpdateModalProps {
  onDownloadPress: () => void;
  onRestartPress: () => void;
}

export default function TikTokFeatureUpdateModal({
  onDownloadPress,
  onRestartPress,
}: TikTokFeatureUpdateModalProps) {
  const {
    isModalVisible,
    status,
    progress,
    versionName,
    changelog,
    errorMessage,
    setModalVisible,
  } = useUpdateStore();

  const translateY = useRef(new Animated.Value(400)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isModalVisible) {
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 9,
        useNativeDriver: Platform.OS !== 'web',
      }).start();

      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    } else {
      Animated.timing(translateY, {
        toValue: 400,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [isModalVisible, translateY, pulseAnim]);

  if (!isModalVisible) return null;

  const isDownloading = status === 'downloading';
  const isReady = status === 'ready';

  return (
    <Modal
      transparent
      visible={isModalVisible}
      animationType="fade"
      onRequestClose={() => {
        if (!isDownloading) setModalVisible(false);
      }}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={() => {
            if (!isDownloading) setModalVisible(false);
          }}
        />

        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY }] },
          ]}
        >
          {/* Top Notch indicator */}
          <View style={styles.notch} />

          {/* Glowing Badge */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Ionicons name="sparkles" size={14} color="#000000" />
              </Animated.View>
              <Text style={styles.badgeText}>FEATURE UPDATE</Text>
            </View>
            <Text style={styles.versionText}>{versionName}</Text>
          </View>

          {/* Header Title */}
          <Text style={styles.sheetTitle}>What's New in FitPulse</Text>
          <Text style={styles.sheetSubtitle}>
            A fresh enhancement is ready to make your fitness journey smoother and faster.
          </Text>

          {/* Changelog Highlights */}
          <ScrollView
            style={styles.changelogScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.changelogContent}
          >
            {changelog.map((item) => (
              <View key={item.id} style={styles.featureItem}>
                <View style={styles.featureIconWrap}>
                  <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureDesc}>{item.description}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Error Notice if any */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Download Progress Bar */}
          {isDownloading ? (
            <View style={styles.progressSection}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Downloading update files...</Text>
                <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(8, progress))}%` }]} />
              </View>
            </View>
          ) : null}

          {/* Bottom Actions */}
          <View style={styles.actionRow}>
            {!isReady ? (
              <>
                <TouchableOpacity
                  style={styles.laterBtn}
                  activeOpacity={0.7}
                  disabled={isDownloading}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.laterBtnText}>Later</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryBtn, isDownloading && styles.btnDisabled]}
                  activeOpacity={0.85}
                  disabled={isDownloading}
                  onPress={onDownloadPress}
                >
                  <LinearGradient
                    colors={['#69F0AE', '#00E676', '#00C853']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.btnGradient}
                  >
                    <Ionicons
                      name={isDownloading ? 'cloud-download' : 'download-outline'}
                      size={18}
                      color="#000000"
                    />
                    <Text style={styles.primaryBtnText}>
                      {isDownloading ? 'Downloading...' : 'Update Now'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.restartBtn}
                activeOpacity={0.85}
                onPress={onRestartPress}
              >
                <LinearGradient
                  colors={['#69F0AE', '#00E676', '#00C853']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.btnGradient}
                >
                  <Ionicons name="refresh" size={18} color="#000000" />
                  <Text style={styles.primaryBtnText}>Restart to Apply</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0D111A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.28)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 24,
    maxHeight: '85%',
  },
  notch: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  versionText: {
    color: '#8A95A5',
    fontSize: 12,
    fontWeight: '600',
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  sheetSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  changelogScroll: {
    maxHeight: 220,
    marginBottom: 16,
  },
  changelogContent: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    color: '#8A95A5',
    fontSize: 12,
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    flex: 1,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  progressPercent: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  laterBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  laterBtnText: {
    color: '#E5E7EB',
    fontSize: 15,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 2,
    borderRadius: 24,
    overflow: 'hidden',
  },
  restartBtn: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  primaryBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
