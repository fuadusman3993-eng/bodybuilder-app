import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useUserStore, UserTier } from '../../store/userStore';
import { signOut } from '../../lib/authService';

interface ProfileMoreModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ProfileMoreModal({ visible, onClose }: ProfileMoreModalProps) {
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const isCoach = user.role === 'coach';

  // Theme Mode: 'auto' | 'dark' | 'light'
  const [themeMode, setThemeMode] = useState<'auto' | 'dark' | 'light'>('dark');

  // Language: 'en' | 'am'
  const [language, setLanguage] = useState<'en' | 'am'>('en');

  // Help & Support Modal State
  const [showHelp, setShowHelp] = useState(false);

  // Logout Confirm State
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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
            style={styles.sheet}
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
          >
            {/* Top Handle */}
            <View style={styles.handle} />

            {/* Header: Title + Close Button */}
            <View style={styles.headerRow}>
              <Text style={styles.sheetTitle}>More</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              {/* ── 1. SETTINGS ── */}
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>Settings</Text>

                {/* General (Account / Profile Edit) */}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => handleNavigate('/edit-profile')}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="settings-outline" size={22} color={Colors.textPrimary} />
                    <Text style={styles.menuItemText}>General</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>

                {/* Language Switcher */}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={handleToggleLanguage}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="language-outline" size={22} color={Colors.textPrimary} />
                    <Text style={styles.menuItemText}>
                      {language === 'en' ? 'English (US)' : 'አማርኛ (ET)'}
                    </Text>
                  </View>
                  <View style={styles.langPill}>
                    <Text style={styles.langPillText}>{language === 'en' ? 'EN' : 'አማ'}</Text>
                    <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
                  </View>
                </TouchableOpacity>

                {/* Dark Mode 3-Way Pill (Matches Screenshot 2) */}
                <View style={styles.menuItem}>
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="moon-outline" size={22} color={Colors.textPrimary} />
                    <Text style={styles.menuItemText}>Dark mode</Text>
                  </View>
                  <View style={styles.themePillWrap}>
                    {/* Auto */}
                    <TouchableOpacity
                      style={[styles.themePillBtn, themeMode === 'auto' && styles.themePillBtnActive]}
                      onPress={() => setThemeMode('auto')}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="phone-portrait-outline"
                        size={15}
                        color={themeMode === 'auto' ? '#FFF' : Colors.textMuted}
                      />
                    </TouchableOpacity>

                    {/* Dark */}
                    <TouchableOpacity
                      style={[styles.themePillBtn, themeMode === 'dark' && styles.themePillBtnActive]}
                      onPress={() => setThemeMode('dark')}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="moon"
                        size={15}
                        color={themeMode === 'dark' ? '#FFF' : Colors.textMuted}
                      />
                    </TouchableOpacity>

                    {/* Light */}
                    <TouchableOpacity
                      style={[styles.themePillBtn, themeMode === 'light' && styles.themePillBtnActive]}
                      onPress={() => setThemeMode('light')}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="sunny-outline"
                        size={15}
                        color={themeMode === 'light' ? '#FFF' : Colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.sectionDivider} />

              {/* ── 2. TOOLS (FitPulse Athlete & Coach Tools) ── */}
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>Tools</Text>

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
                      color={Colors.primary}
                    />
                    <Text style={styles.menuItemText}>
                      {isCoach ? 'Coach Studio & Clients' : 'My Coach & Program'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
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
                      color={Colors.textPrimary}
                    />
                    <Text style={styles.menuItemText}>
                      {isCoach ? 'Create Workout Plan' : 'Find Fitness Coaches'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>

                {/* Fitness Challenges */}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => handleNavigate('/challenge')}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="trophy-outline" size={22} color="#F59E0B" />
                    <Text style={styles.menuItemText}>Fitness Challenges</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>

                {/* Saved Posts & Workouts */}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => handleNavigate('/saved-posts')}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="bookmark-outline" size={22} color={Colors.textPrimary} />
                    <Text style={styles.menuItemText}>Saved Posts & Workouts</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.sectionDivider} />

              {/* ── 3. OTHER (Help Center & Logout) ── */}
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>Other</Text>

                {/* Help Center */}
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => setShowHelp(true)}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="document-text-outline" size={22} color={Colors.textPrimary} />
                    <Text style={styles.menuItemText}>Help Center</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
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
          <View style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="information-circle" size={24} color={Colors.primary} />
                <Text style={styles.helpTitle}>Help Center</Text>
              </View>
              <TouchableOpacity onPress={() => setShowHelp(false)}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.helpDesc}>
              Welcome to FitPulse Support. We are here to help athletes and fitness coaches succeed.
            </Text>

            <View style={styles.helpItem}>
              <Ionicons name="mail-outline" size={18} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.helpItemTitle}>Contact Support</Text>
                <Text style={styles.helpItemValue}>support@fitpulse.app</Text>
              </View>
            </View>

            <View style={styles.helpItem}>
              <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.helpItemTitle}>Community Guidelines</Text>
                <Text style={styles.helpItemValue}>Safe & empowering fitness environment</Text>
              </View>
            </View>

            <View style={styles.helpItem}>
              <Ionicons name="phone-portrait-outline" size={18} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.helpItemTitle}>FitPulse Version</Text>
                <Text style={styles.helpItemValue}>v1.0.4 (Build 2026.10)</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.helpDoneBtn}
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
          <View style={styles.logoutCard}>
            <Ionicons name="log-out-outline" size={38} color="#EF4444" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={styles.logoutTitle}>Log Out</Text>
            <Text style={styles.logoutDesc}>Are you sure you want to log out of your FitPulse account?</Text>

            <View style={styles.logoutBtnRow}>
              <TouchableOpacity
                style={styles.logoutCancelBtn}
                onPress={() => setShowLogoutConfirm(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutCancelText}>Cancel</Text>
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
    backgroundColor: '#0F141F',
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
  themePillWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 3,
    gap: 2,
  },
  themePillBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themePillBtnActive: {
    backgroundColor: '#384358',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 10,
  },

  // Help Modal styles
  helpCard: {
    backgroundColor: '#161D2A',
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
    backgroundColor: '#161D2A',
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
