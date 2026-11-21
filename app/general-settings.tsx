import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { useUserStore, UserTier } from '../store/userStore';
import { useTheme } from '../store/themeStore';
import { signOut } from '../lib/authService';

export default function GeneralSettingsScreen() {
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const { colors } = useTheme();

  const [profile, setProfile] = useState<any>(null);
  const [isVerifiedCoach, setIsVerifiedCoach] = useState(false);

  // Active sub-modal state (for items with interactive preferences)
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Load authoritative profile and verified coach status
  React.useEffect(() => {
    if (user.uid) {
      import('../lib/profileService').then(({ getProfile }) => {
        getProfile(user.uid!).then((p) => {
          if (p) setProfile(p);
        });
      });
      import('../lib/supabase').then(({ supabase }) => {
        supabase
          .from('coach_profiles')
          .select('is_verified, verification_status')
          .eq('uid', user.uid)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.is_verified || data?.verification_status === 'approved') {
              setIsVerifiedCoach(true);
            } else {
              setIsVerifiedCoach(false);
            }
          });
      });
    }
  }, [user.uid]);

  const displayName = profile?.name || user.name || 'FitPulse Athlete';
  const displayEmail = profile?.email || user.email || 'athlete@fitpulse.app';
  const roleText = isVerifiedCoach ? 'Verified Coach' : 'Athlete';

  // Notification Preferences State
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifWorkouts, setNotifWorkouts] = useState(true);
  const [notifSecurity, setNotifSecurity] = useState(true);
  const [notifCoach, setNotifCoach] = useState(true);

  // Content Preferences State
  const [autoplayVideos, setAutoplayVideos] = useState(true);
  const [showCoachReels, setShowCoachReels] = useState(true);

  // Screen Time State
  const [screenTimeLimit, setScreenTimeLimit] = useState('60 min');
  const [breakReminders, setBreakReminders] = useState(true);

  // Accessibility State
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [largeRepCounters, setLargeRepCounters] = useState(true);

  // Ads & Rewards State
  const [personalizedAds, setPersonalizedAds] = useState(false);
  const [rewardBonusCoins, setRewardBonusCoins] = useState(true);

  // Family Pairing State
  const [familyCode, setFamilyCode] = useState('FP-' + Math.floor(100000 + Math.random() * 900000));
  const [familyPaired, setFamilyPaired] = useState(false);

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        await signOut();
        setUser({ uid: '', name: '', tier: UserTier.FREE });
        router.replace('/login');
      } catch (err) {
        Alert.alert('Error', 'Failed to log out. Please try again.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out of FitPulse?')) {
        await doLogout();
      }
    } else {
      Alert.alert(
        'Log Out',
        'Are you sure you want to log out of FitPulse on this device?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log Out', style: 'destructive', onPress: doLogout },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background || '#000000' }]} edges={['top', 'bottom']}>
      <View style={styles.appCardContainer}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border || '#202020' }]}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary || '#FFFFFF'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary || '#FFFFFF' }]}>Settings & Privacy</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {/* User Card */}
          <View style={[styles.userCard, { backgroundColor: colors.surface || '#121212', borderColor: colors.border || '#202020' }]}>
            <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.userAvatarText}>
                {displayName ? displayName.slice(0, 2).toUpperCase() : 'FP'}
              </Text>
            </View>
            <View style={styles.userCardInfo}>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>{displayName}</Text>
              <Text style={[styles.userEmail, { color: colors.textMuted }]}>{displayEmail}</Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}>
              <Text style={[styles.roleBadgeText, { color: colors.primary }]}>
                {roleText}
              </Text>
            </View>
          </View>

        {/* ── 8 MAIN SETTINGS ITEMS FROM USER IMAGE ── */}
        <View style={[styles.menuContainer, { backgroundColor: colors.surface || '#121212', borderColor: colors.border || '#202020' }]}>
          {/* 1. Manage account (highlighted red/accent) */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => router.push('/edit-profile')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                <Ionicons name="person-outline" size={20} color="#EF4444" />
              </View>
              <Text style={[styles.menuLabel, { color: '#EF4444', fontWeight: '700' }]}>
                Manage account
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border || '#202020' }]} />

          {/* 2. Privacy (Security, Sessions, 2FA) */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => router.push('/security-sessions')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textPrimary} />
              </View>
              <View>
                <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Privacy & Security</Text>
                <Text style={[styles.menuSubLabel, { color: colors.textMuted }]}>
                  Active Sessions • 2-Device Limit • Chat 2FA
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border || '#202020' }]} />

          {/* 3. Push notifications */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => setActiveModal('notifications')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}>
                <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Push notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border || '#202020' }]} />

          {/* 4. Ads */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => setActiveModal('ads')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}>
                <Ionicons name="megaphone-outline" size={20} color={colors.textPrimary} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Ads & Rewards</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border || '#202020' }]} />

          {/* 5. Screen time */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => setActiveModal('screentime')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}>
                <Ionicons name="hourglass-outline" size={20} color={colors.textPrimary} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Screen time</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border || '#202020' }]} />

          {/* 6. Content preferences */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => setActiveModal('content')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}>
                <Ionicons name="videocam-outline" size={20} color={colors.textPrimary} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Content preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border || '#202020' }]} />

          {/* 7. Family Pairing */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => setActiveModal('family')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}>
                <Ionicons name="home-outline" size={20} color={colors.textPrimary} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Family Pairing</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border || '#202020' }]} />

          {/* 8. Accessibility */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => setActiveModal('accessibility')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}>
                <Ionicons name="accessibility-outline" size={20} color={colors.textPrimary} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Accessibility</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.textMuted }]}>
          FitPulse v2.5.0 (Build 2026.11) • International Edition
        </Text>
      </ScrollView>
      </View>

      {/* ── MODALS FOR DETAILED PREFERENCES ── */}

      {/* Push Notifications Modal */}
      <Modal visible={activeModal === 'notifications'} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface || '#161616' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Push Notifications</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Direct Chat Messages</Text>
                <Text style={[styles.toggleSubLabel, { color: colors.textMuted }]}>Get notified for new trainee & coach messages</Text>
              </View>
              <Switch value={notifMessages} onValueChange={setNotifMessages} trackColor={{ false: '#333', true: colors.primary }} />
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Workout Reminders</Text>
                <Text style={[styles.toggleSubLabel, { color: colors.textMuted }]}>Daily notifications to log your sets and reps</Text>
              </View>
              <Switch value={notifWorkouts} onValueChange={setNotifWorkouts} trackColor={{ false: '#333', true: colors.primary }} />
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Security & Login Alerts</Text>
                <Text style={[styles.toggleSubLabel, { color: colors.textMuted }]}>Alerts for new device authorizations and 2FA</Text>
              </View>
              <Switch value={notifSecurity} onValueChange={setNotifSecurity} trackColor={{ false: '#333', true: colors.primary }} />
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Coach Verification Updates</Text>
                <Text style={[styles.toggleSubLabel, { color: colors.textMuted }]}>Official Sports Board credential reviews</Text>
              </View>
              <Switch value={notifCoach} onValueChange={setNotifCoach} trackColor={{ false: '#333', true: colors.primary }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Ads & Rewards Modal */}
      <Modal visible={activeModal === 'ads'} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface || '#161616' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Ads & Coin Rewards</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Workout Completion Coin Rewards</Text>
                <Text style={[styles.toggleSubLabel, { color: colors.textMuted }]}>Earn 🪙 25 coins for every logged workout session</Text>
              </View>
              <Switch value={rewardBonusCoins} onValueChange={setRewardBonusCoins} trackColor={{ false: '#333', true: colors.primary }} />
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Personalized Gym Gear Offers</Text>
                <Text style={[styles.toggleSubLabel, { color: colors.textMuted }]}>Special discounts from certified partner gyms</Text>
              </View>
              <Switch value={personalizedAds} onValueChange={setPersonalizedAds} trackColor={{ false: '#333', true: colors.primary }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Screen Time Modal */}
      <Modal visible={activeModal === 'screentime'} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface || '#161616' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Screen Time & Rest</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Daily Workout Screen Limit</Text>
                <Text style={[styles.toggleSubLabel, { color: colors.textMuted }]}>Current target: {screenTimeLimit}</Text>
              </View>
              <TouchableOpacity
                style={[styles.smallPill, { backgroundColor: colors.primary + '20' }]}
                onPress={() => setScreenTimeLimit((prev) => (prev === '60 min' ? '90 min' : '60 min'))}
              >
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>{screenTimeLimit}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Post-Set Rest Timer Reminders</Text>
                <Text style={[styles.toggleSubLabel, { color: colors.textMuted }]}>Audio alerts when rest periods finish</Text>
              </View>
              <Switch value={breakReminders} onValueChange={setBreakReminders} trackColor={{ false: '#333', true: colors.primary }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Content Preferences Modal */}
      <Modal visible={activeModal === 'content'} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface || '#161616' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Content Preferences</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Auto-Play Exercise Technique Videos</Text>
                <Text style={[styles.toggleSubLabel, { color: colors.textMuted }]}>Instantly preview exercise form in workout lists</Text>
              </View>
              <Switch value={autoplayVideos} onValueChange={setAutoplayVideos} trackColor={{ false: '#333', true: colors.primary }} />
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Show Certified Coach Reels</Text>
                <Text style={[styles.toggleSubLabel, { color: colors.textMuted }]}>Feature certified coach tips in your daily feed</Text>
              </View>
              <Switch value={showCoachReels} onValueChange={setShowCoachReels} trackColor={{ false: '#333', true: colors.primary }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Family Pairing Modal */}
      <Modal visible={activeModal === 'family'} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface || '#161616' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Family & Buddy Pairing</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDesc, { color: colors.textMuted }]}>
              Pair with your gym buddy or family member to track shared workout milestones and motivate each other.
            </Text>

            <View style={[styles.pairBox, { backgroundColor: colors.surfaceLight || '#222' }]}>
              <Text style={[styles.pairLabel, { color: colors.textMuted }]}>Your Pairing Code:</Text>
              <Text style={[styles.pairCode, { color: colors.primary }]}>{familyCode}</Text>
            </View>

            <TouchableOpacity
              style={[styles.pairActionBtn, { backgroundColor: colors.primary }]}
              onPress={() => setFamilyPaired((p) => !p)}
            >
              <Text style={styles.pairActionBtnText}>
                {familyPaired ? 'Unlink Current Buddy' : 'Link Gym Buddy Device'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Accessibility Modal */}
      <Modal visible={activeModal === 'accessibility'} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface || '#161616' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Accessibility</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Haptic Feedback on Rep Counters</Text>
                <Text style={[styles.toggleSubLabel, { color: colors.textMuted }]}>Vibrate slightly when completing a set</Text>
              </View>
              <Switch value={hapticFeedback} onValueChange={setHapticFeedback} trackColor={{ false: '#333', true: colors.primary }} />
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>High Contrast Workout Numbers</Text>
                <Text style={[styles.toggleSubLabel, { color: colors.textMuted }]}>Maximize legibility during intense gym sets</Text>
              </View>
              <Switch value={highContrast} onValueChange={setHighContrast} trackColor={{ false: '#333', true: colors.primary }} />
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Large Rep & Timer Digits</Text>
                <Text style={[styles.toggleSubLabel, { color: colors.textMuted }]}>Enlarge digits on the workout active screen</Text>
              </View>
              <Switch value={largeRepCounters} onValueChange={setLargeRepCounters} trackColor={{ false: '#333', true: colors.primary }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appCardContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    gap: 14,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '800',
  },
  userCardInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  menuContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  menuSubLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  toggleSubLabel: {
    fontSize: 11,
  },
  smallPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pairBox: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  pairLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  pairCode: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
  },
  pairActionBtn: {
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pairActionBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
});
