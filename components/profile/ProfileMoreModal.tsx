import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useUserStore, UserTier } from '../../store/userStore';
import { signOut } from '../../lib/authService';
import { getWallet } from '../../lib/walletService';
import { useThemeStore, useTheme } from '../../store/themeStore';
import ThemeSelectorModal from '../theme/ThemeSelectorModal';

interface ProfileMoreModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ProfileMoreModal({ visible, onClose }: ProfileMoreModalProps) {
  const router = useRouter();
  const { user, setUser, updateCoins } = useUserStore();
  const { theme, colors } = useTheme();
  const isCoach = user.role === 'coach';
  const coinsBalance = user.coinsBalance ?? 0;

  // Active theme & Theme Selector Modal State
  const activeTheme = useThemeStore((s) => s.getActiveTheme());
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Language: 'en' | 'am'
  const [language, setLanguage] = useState<'en' | 'am'>('en');

  // Help & Support Modal State
  const [showHelp, setShowHelp] = useState(false);

  // Logout Confirm State
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Load coins when modal opens
  useEffect(() => {
    if (visible && user.uid) {
      import('../../lib/walletService').then(({ getWallet }) => {
        getWallet(user.uid!).then((w) => {
          if (w) updateCoins(w.balance_coins);
        });
      });
    }
  }, [visible, user.uid]);

  const handleNavigate = (path: any) => {
    onClose();
    setTimeout(() => {
      router.push(path);
    }, 200);
  };

  const handleToggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'am' : 'en'));
  };

  const performLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      setUser({
        tier: UserTier.GUEST,
        uid: undefined,
        name: undefined,
        email: undefined,
        avatar: undefined,
        role: undefined,
        city: undefined,
      });
      setShowLogoutConfirm(false);
      onClose();
      router.replace('/login');
    } catch (e: any) {
      console.warn('Logout error:', e);
      if (Platform.OS === 'web') {
        window.alert('Error logging out: ' + (e.message || 'Please try again.'));
      } else {
        Alert.alert('Logout Error', e.message || 'Please try again.');
      }
    } finally {
      setLoggingOut(false);
    }
  };

  const onLogoutPress = () => {
    if (Platform.OS === 'web') {
      setShowLogoutConfirm(true);
    } else {
      Alert.alert(
        'Log Out',
        'Are you sure you want to log out of FitPulse?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log Out', style: 'destructive', onPress: performLogout },
        ]
      );
    }
  };

  return (
    <>
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
            style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
          >
            {/* Top Handle */}
            <View style={styles.handle} />

            {/* Header: Title + Close Button */}
            <View style={styles.headerRow}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>More</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              {/* ── 1. SETTINGS ── */}
              <View style={styles.sectionWrap}>
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Settings</Text>

                {/* FitPulse Wallet & Coins */}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => handleNavigate('/wallet')}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="wallet-outline" size={22} color={colors.primary} />
                    <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>FitPulse Wallet & Coins</Text>
                  </View>
                  <View style={[styles.coinBadgePill, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '30' }]}>
                    <Text style={[styles.coinBadgePillText, { color: colors.primary }]}>🪙 {coinsBalance}</Text>
                  </View>
                </TouchableOpacity>

                {/* General (Account / Profile Edit) */}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => handleNavigate('/edit-profile')}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
                    <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>General</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Language Switcher */}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={handleToggleLanguage}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="language-outline" size={22} color={colors.textPrimary} />
                    <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>
                      {language === 'en' ? 'English (US)' : 'አማርኛ (ET)'}
                    </Text>
                  </View>
                  <View style={[styles.langPill, { backgroundColor: colors.surfaceLight }]}>
                    <Text style={[styles.langPillText, { color: colors.textMuted }]}>{language === 'en' ? 'EN' : 'አማ'}</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                  </View>
                </TouchableOpacity>

                {/* Theme Selector (Replaces Dark mode, opens Telegram-style Themes Modal) */}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => setShowThemeModal(true)}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="color-palette-outline" size={22} color={colors.primary} />
                    <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Theme</Text>
                  </View>
                  <View style={[styles.themePill, { backgroundColor: colors.surfaceLight }]}>
                    <View style={[styles.themeColorDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.themePillText, { color: colors.textSecondary }]}>{activeTheme.label}</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />

              {/* ── 2. TOOLS (FitPulse Athlete & Coach Tools) ── */}
              <View style={styles.sectionWrap}>
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Tools</Text>

                {/* Coach Dashboard / My Coach */}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => handleNavigate(isCoach ? '/coach-dashboard' : '/my-coach')}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons
                      name={isCoach ? 'analytics-outline' : 'person-circle-outline'}
                      size={22}
                      color={colors.primary}
                    />
                    <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>
                      {isCoach ? 'Coach Studio & Clients' : 'My Coach & Program'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Workout Plans / Find Coaches */}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => handleNavigate(isCoach ? '/create-plan' : '/coaches')}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons
                      name={isCoach ? 'create-outline' : 'search-outline'}
                      size={22}
                      color={colors.textPrimary}
                    />
                    <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>
                      {isCoach ? 'Create Workout Plan' : 'Find Fitness Coaches'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Fitness Challenges */}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => handleNavigate('/challenge')}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="trophy-outline" size={22} color="#F59E0B" />
                    <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Fitness Challenges</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Saved Posts & Workouts */}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => handleNavigate('/saved-posts')}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="bookmark-outline" size={22} color={colors.textPrimary} />
                    <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Saved Posts & Workouts</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />

              {/* ── 3. OTHER (Help Center & Logout) ── */}
              <View style={styles.sectionWrap}>
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Other</Text>

                {/* Help Center */}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => setShowHelp(true)}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="document-text-outline" size={22} color={colors.textPrimary} />
                    <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Help Center</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Log Out */}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={onLogoutPress}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                    <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Log out</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── HELP CENTER MODAL ── */}
      <Modal
        visible={showHelp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHelp(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowHelp(false)}
        >
          <View style={[styles.helpCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.helpHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="information-circle" size={24} color={colors.primary} />
                <Text style={[styles.helpTitle, { color: colors.textPrimary }]}>Help Center</Text>
              </View>
              <TouchableOpacity onPress={() => setShowHelp(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.helpDesc, { color: colors.textMuted }]}>
              Welcome to FitPulse Support. We are here to help athletes and fitness coaches succeed.
            </Text>

            <View style={[styles.helpItem, { borderBottomColor: colors.border }]}>
              <Ionicons name="mail-outline" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.helpItemTitle, { color: colors.textMuted }]}>Contact Support</Text>
                <Text style={[styles.helpItemValue, { color: colors.textPrimary }]}>support@fitpulse.app</Text>
              </View>
            </View>

            <View style={[styles.helpItem, { borderBottomColor: colors.border }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.helpItemTitle, { color: colors.textMuted }]}>Community Guidelines</Text>
                <Text style={[styles.helpItemValue, { color: colors.textPrimary }]}>Safe & empowering fitness environment</Text>
              </View>
            </View>

            <View style={[styles.helpItem, { borderBottomColor: colors.border }]}>
              <Ionicons name="phone-portrait-outline" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.helpItemTitle, { color: colors.textMuted }]}>FitPulse Version</Text>
                <Text style={[styles.helpItemValue, { color: colors.textPrimary }]}>v1.0.4 (Build 2026.10)</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.helpDoneBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowHelp(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.helpDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── LOGOUT CONFIRMATION MODAL (Web & Mobile) ── */}
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowLogoutConfirm(false)}
        >
          <View style={[styles.logoutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="log-out-outline" size={38} color="#EF4444" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[styles.logoutTitle, { color: colors.textPrimary }]}>Log Out</Text>
            <Text style={[styles.logoutDesc, { color: colors.textMuted }]}>Are you sure you want to log out of your FitPulse account?</Text>

            <View style={styles.logoutBtnRow}>
              <TouchableOpacity
                style={[styles.logoutCancelBtn, { backgroundColor: colors.surfaceLight }]}
                onPress={() => setShowLogoutConfirm(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.logoutCancelText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutConfirmBtn}
                onPress={performLogout}
                disabled={loggingOut}
                activeOpacity={0.8}
              >
                {loggingOut ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.logoutConfirmText}>Log Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Telegram-style Theme Selector Modal */}
      <ThemeSelectorModal
        visible={showThemeModal}
        onClose={() => setShowThemeModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionWrap: {
    paddingVertical: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A95A5',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    paddingLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  langPillText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  themePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  themeColorDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  themePillText: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 10,
  },
  coinBadgePill: {
    backgroundColor: 'rgba(0,230,118,0.12)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,230,118,0.25)',
  },
  coinBadgePillText: {
    color: Colors.primary, fontSize: 12.5, fontWeight: '700',
  },

  // Help Modal styles
  helpCard: {
    backgroundColor: Colors.surfaceLight,
    width: '90%',
    maxWidth: 420,
    alignSelf: 'center',
    marginBottom: 'auto',
    marginTop: 'auto',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  helpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  helpDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: 18,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  helpItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  helpItemValue: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  helpDoneBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  helpDoneText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },

  // Logout Confirmation styles
  logoutCard: {
    backgroundColor: Colors.surfaceLight,
    width: '85%',
    maxWidth: 380,
    alignSelf: 'center',
    marginBottom: 'auto',
    marginTop: 'auto',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  logoutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  logoutDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 22,
  },
  logoutBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  logoutCancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  logoutConfirmBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
