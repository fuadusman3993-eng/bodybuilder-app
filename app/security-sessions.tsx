import React, { useState, useEffect, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUserStore } from '../store/userStore';
import { useTheme } from '../store/themeStore';
import Skeleton from '../components/ui/Skeleton';
import { safeBack } from '../lib/navigation';
import {
  getActiveSessions,
  syncCurrentDeviceSession,
  updateDeviceName,
  terminateSession,
  terminateAllOtherSessions,
  getLocalDeviceId,
  resolveRealDeviceName,
  detectClientHardware,
  DeviceSession,
} from '../lib/deviceSecurityService';

function SecuritySessionsContent() {
  const router = useRouter();
  const { user } = useUserStore();
  const { colors } = useTheme();

  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Rename Device Modal State
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [savingRename, setSavingRename] = useState(false);

  // Inactive period selector
  const [inactivePeriod, setInactivePeriod] = useState('6 months');
  const [showPeriodModal, setShowPeriodModal] = useState(false);

  const currentDeviceId = getLocalDeviceId();

  const loadSessions = useCallback(async () => {
    if (!user.uid) {
      setLoading(false);
      return;
    }
    try {
      // 1. Ensure current session is synced with real client hardware and real IP
      await syncCurrentDeviceSession(user.uid);
      // 2. Fetch all active sessions
      const data = await getActiveSessions(user.uid);
      setSessions(data);
    } catch (err) {
      console.warn('Failed to load active sessions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.uid]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };

  const handleOpenRename = () => {
    const cur = sessions.find((s) => s.isCurrent);
    setRenameInput(cur?.deviceName || detectClientHardware().name || 'Authorized Device');
    setShowRenameModal(true);
  };

  const handleSaveRename = async (customName?: string) => {
    const nameToSave = (customName || renameInput).trim();
    if (!nameToSave || !user.uid) return;
    setSavingRename(true);
    try {
      const ok = await updateDeviceName(user.uid, currentDeviceId, nameToSave);
      if (ok) {
        setSessions((prev) =>
          prev.map((s) => (s.isCurrent ? { ...s, deviceName: nameToSave } : s))
        );
        setShowRenameModal(false);
      } else {
        Alert.alert('Error', 'Failed to update device name.');
      }
    } catch (_) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSavingRename(false);
    }
  };

  const handleTerminateSession = (targetSession: DeviceSession) => {
    const doTerminate = async () => {
      setActionLoadingId(targetSession.deviceId);
      try {
        const ok = await terminateSession(user.uid!, targetSession.deviceId);
        if (ok) {
          setSessions((prev) => prev.filter((s) => s.deviceId !== targetSession.deviceId));
        } else {
          Alert.alert('Error', 'Could not terminate the session. Please try again.');
        }
      } catch (err) {
        Alert.alert('Error', 'An unexpected error occurred.');
      } finally {
        setActionLoadingId(null);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Terminate session on ${targetSession.deviceName}? It will be logged out immediately.`)) {
        doTerminate();
      }
    } else {
      Alert.alert(
        'Terminate Session',
        `Are you sure you want to log out ${targetSession.deviceName} (${targetSession.location})?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Terminate', style: 'destructive', onPress: doTerminate },
        ]
      );
    }
  };

  const handleTerminateAllOthers = () => {
    const doTerminateAll = async () => {
      setActionLoadingId('all');
      try {
        const ok = await terminateAllOtherSessions(user.uid!);
        if (ok) {
          setSessions((prev) => prev.filter((s) => s.deviceId === currentDeviceId));
        } else {
          Alert.alert('Error', 'Could not terminate sessions.');
        }
      } catch (err) {
        Alert.alert('Error', 'An unexpected error occurred.');
      } finally {
        setActionLoadingId(null);
      }
    };

    const count = sessions.filter((s) => !s.isCurrent).length;
    if (count === 0) {
      Alert.alert('No other sessions', 'There are no other active sessions to terminate.');
      return;
    }

    if (Platform.OS === 'web') {
      if (window.confirm(`Log out all ${count} other active device(s)? Only this device will remain connected.`)) {
        doTerminateAll();
      }
    } else {
      Alert.alert(
        'Terminate All Other Sessions',
        `Log out all ${count} other active device(s)? Only this device will remain signed in.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log Out Others', style: 'destructive', onPress: doTerminateAll },
        ]
      );
    }
  };

  const currentSession = sessions.find((s) => s.isCurrent) || {
    deviceId: currentDeviceId,
    deviceName: detectClientHardware().name,
    deviceType: detectClientHardware().type,
    clientApp: detectClientHardware().clientApp,
    location: 'Awasa, Ethiopia',
    isCurrent: true,
    lastActive: null,
    createdAt: null,
  };
  const otherSessions = sessions.filter((s) => !s.isCurrent);
  const totalConnected = Math.max(1, sessions.length);

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: colors.background || '#000000' }]} edges={['top', 'bottom']}>
      {/* Centered App Container */}
      <View style={[styles.container, { backgroundColor: colors.background || '#000000' }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border || '#1f1f1f' }]}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            onPress={() => safeBack('/general-settings')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary || '#FFFFFF'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary || '#FFFFFF' }]}>Active sessions</Text>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            onPress={() => safeBack('/general-settings')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={22} color={colors.textMuted || '#8a99a8'} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {loading ? (
            /* FitPulse Native Shimmer Skeleton Loader */
            <View style={styles.skeletonWrap}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Skeleton width={90} height={18} borderRadius={6} />
                <Skeleton width={60} height={18} borderRadius={6} />
              </View>
              <View style={[styles.deviceRow, { backgroundColor: colors.surface || '#121212', borderColor: colors.border || '#222', borderWidth: 1 }]}>
                <Skeleton width={48} height={48} borderRadius={24} />
                <View style={{ flex: 1, gap: 8, marginLeft: 14 }}>
                  <Skeleton width="65%" height={16} borderRadius={4} />
                  <Skeleton width="45%" height={13} borderRadius={4} />
                  <Skeleton width="35%" height={12} borderRadius={4} />
                </View>
              </View>
              <View style={{ marginTop: 16 }}>
                <Skeleton width="100%" height={46} borderRadius={12} />
              </View>
              <View style={{ marginTop: 24 }}>
                <Skeleton width={110} height={18} borderRadius={6} style={{ marginBottom: 12 }} />
                <Skeleton width="100%" height={76} borderRadius={14} />
              </View>
            </View>
          ) : (
            <>
              {/* ── SECTION 1: THIS DEVICE ── */}
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.primary }]}>This device</Text>
                  <TouchableOpacity activeOpacity={0.7} onPress={handleOpenRename}>
                    <Text style={[styles.renameLink, { color: colors.primary }]}>Rename</Text>
                  </TouchableOpacity>
                </View>

                {/* Current Device Row */}
                <View style={[styles.deviceRow, { backgroundColor: colors.surface || '#121212', borderColor: colors.border || '#222' }]}>
                  <View
                    style={[
                      styles.deviceCircle,
                      {
                        backgroundColor: colors.surfaceLight || '#1c1c1e',
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    {currentSession.deviceType === 'desktop' ? (
                      <Ionicons name="laptop-outline" size={24} color={colors.primary} />
                    ) : /Android/i.test(currentSession.deviceName) ? (
                      <Ionicons name="logo-android" size={24} color={colors.primary} />
                    ) : (
                      <Ionicons name="phone-portrait-outline" size={24} color={colors.primary} />
                    )}
                  </View>

                  <View style={styles.deviceTextWrap}>
                    <Text style={[styles.deviceNameText, { color: colors.textPrimary || '#FFFFFF' }]}>
                      {currentSession.deviceName}
                    </Text>
                    <Text style={[styles.deviceAppText, { color: colors.textMuted || '#8a99a8' }]}>
                      {currentSession.clientApp || 'FitPulse Web 2.5.0 x64'}
                    </Text>
                    <Text style={[styles.deviceLocationText, { color: colors.textMuted || '#708499' }]}>
                      {currentSession.location || 'Awasa, Ethiopia'}
                      {currentSession.ip ? ` • ${currentSession.ip}` : ''}
                    </Text>
                  </View>
                </View>

                {/* Terminate all other sessions button */}
                <TouchableOpacity
                  style={[styles.terminateAllRow, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}
                  activeOpacity={0.7}
                  onPress={handleTerminateAllOthers}
                  disabled={actionLoadingId === 'all'}
                >
                  <Ionicons name="hand-left-outline" size={20} color="#EF4444" style={styles.terminateIcon} />
                  <Text style={styles.terminateAllText}>
                    {actionLoadingId === 'all' ? 'Terminating...' : 'Terminate all other sessions'}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.sectionCaption, { color: colors.textMuted || '#708499' }]}>
                  Logs out all devices except for this one.
                </Text>
              </View>

              {/* ── SECTION 2: ACTIVE DEVICES ── */}
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.primary }]}>Active Devices</Text>
                  <Text style={[styles.deviceCounterPill, { color: colors.textMuted }]}>
                    {totalConnected} / 2 Connected
                  </Text>
                </View>

                {otherSessions.length === 0 ? (
                  <View style={[styles.slotAvailableBox, { backgroundColor: colors.surface || '#121212', borderColor: colors.border || '#262626' }]}>
                    <View style={[styles.deviceCircle, { backgroundColor: colors.surfaceLight || '#1c1c1e', borderColor: colors.border || '#333' }]}>
                      <Ionicons name="phone-portrait-outline" size={22} color={colors.textMuted || '#708499'} />
                    </View>
                    <View style={styles.deviceTextWrap}>
                      <Text style={[styles.slotAvailableTitle, { color: colors.textPrimary || '#FFFFFF' }]}>
                        Slot 2 Available (1 / 2 Devices)
                      </Text>
                      <Text style={[styles.slotAvailableDesc, { color: colors.textMuted || '#708499' }]}>
                        No secondary phone is currently connected. When logging in on a 2nd phone, a 6-digit verification code will be sent to this device via FitPulse Official Chat.
                      </Text>
                    </View>
                  </View>
                ) : (
                  otherSessions.map((item) => (
                    <View
                      key={item.deviceId}
                      style={[styles.otherDeviceRow, { backgroundColor: colors.surface || '#121212', borderColor: colors.border || '#222' }]}
                    >
                      <View
                        style={[
                          styles.deviceCircle,
                          {
                            backgroundColor: colors.surfaceLight || '#1c1c1e',
                            borderColor: colors.primary,
                          },
                        ]}
                      >
                        {/Android|Samsung|Tecno|Infinix/i.test(item.deviceName) ? (
                          <Ionicons name="logo-android" size={24} color={colors.primary} />
                        ) : /Apple|iPhone|iPad/i.test(item.deviceName) ? (
                          <Ionicons name="logo-apple" size={24} color={colors.primary} />
                        ) : (
                          <Ionicons name="phone-portrait-outline" size={24} color={colors.primary} />
                        )}
                      </View>

                      <View style={styles.deviceTextWrap}>
                        <Text style={[styles.deviceNameText, { color: colors.textPrimary || '#FFFFFF' }]}>
                          {item.deviceName}
                        </Text>
                        <Text style={[styles.deviceAppText, { color: colors.textMuted || '#8a99a8' }]}>
                          {item.clientApp || 'FitPulse Android 2.5.0'}
                        </Text>
                        <Text style={[styles.deviceLocationText, { color: colors.textMuted || '#708499' }]}>
                          {item.location} • Active
                        </Text>
                      </View>

                      {/* Right ✕ button to terminate this session */}
                      <TouchableOpacity
                        style={styles.closeBtn}
                        activeOpacity={0.7}
                        onPress={() => handleTerminateSession(item)}
                        disabled={actionLoadingId === item.deviceId}
                      >
                        {actionLoadingId === item.deviceId ? (
                          <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                          <Ionicons name="close" size={20} color={colors.textMuted || '#708499'} />
                        )}
                      </TouchableOpacity>
                    </View>
                  ))
                )}

                <Text style={[styles.sectionCaption, { color: colors.textMuted || '#708499' }]}>
                  The official FitPulse app is available for Android, iPhone, iPad, Windows, macOS and Linux.
                </Text>
              </View>

              {/* ── SECTION 3: TERMINATE OLD SESSIONS ── */}
              <View style={styles.sectionWrap}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Terminate old sessions</Text>

                <TouchableOpacity
                  style={[styles.inactivityRow, { backgroundColor: colors.surface || '#121212', borderColor: colors.border || '#222' }]}
                  activeOpacity={0.7}
                  onPress={() => setShowPeriodModal(true)}
                >
                  <Text style={[styles.inactivityLabel, { color: colors.textPrimary || '#FFFFFF' }]}>If inactive for...</Text>
                  <View style={styles.inactivityValueWrap}>
                    <Text style={[styles.inactivityValue, { color: colors.primary }]}>{inactivePeriod}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted || '#708499'} />
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>

        {/* ── RENAME DEVICE MODAL (FitPulse Theme Adapted) ── */}
        <Modal visible={showRenameModal} transparent animationType="fade" onRequestClose={() => setShowRenameModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface || '#161616', borderColor: colors.border || '#2c2c2e' }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary || '#FFFFFF' }]}>Rename Device</Text>
              <Text style={[styles.modalSubTitle, { color: colors.textMuted || '#8a99a8' }]}>
                Set your exact device name so it is recognized across your active sessions.
              </Text>

              {/* 1-Tap Quick Suggestions */}
              <View style={styles.suggestionsRow}>
                {(() => {
                  const cur = sessions.find((s) => s.isCurrent);
                  const isMobile = cur?.deviceType === 'mobile' || (typeof navigator !== 'undefined' && /Mobile|Android|iPhone/i.test(navigator.userAgent));
                  const detected = cur?.deviceName || detectClientHardware().name;
                  const suggestions = isMobile
                    ? [detected, 'My Phone', 'Work Phone']
                    : [detected, 'My Laptop', 'Work PC'];
                  return Array.from(new Set(suggestions.filter(Boolean))).map((sug) => (
                    <TouchableOpacity
                      key={sug}
                      style={[styles.suggestionPill, { backgroundColor: colors.surfaceLight || '#222', borderColor: colors.border || '#333' }]}
                      activeOpacity={0.7}
                      onPress={() => setRenameInput(sug)}
                    >
                      <Text style={[styles.suggestionText, { color: colors.primary }]}>{sug}</Text>
                    </TouchableOpacity>
                  ));
                })()}
              </View>

              <TextInput
                style={[
                  styles.renameTextInput,
                  {
                    backgroundColor: colors.background || '#000000',
                    borderColor: colors.primary,
                    color: colors.textPrimary || '#FFFFFF',
                  },
                ]}
                value={renameInput}
                onChangeText={setRenameInput}
                placeholder="Device Name (e.g. My Phone)"
                placeholderTextColor={colors.textMuted || '#708499'}
                autoFocus
                selectTextOnFocus
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  activeOpacity={0.7}
                  onPress={() => setShowRenameModal(false)}
                >
                  <Text style={[styles.modalCancelText, { color: colors.textMuted || '#8a99a8' }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                  onPress={() => handleSaveRename()}
                  disabled={savingRename}
                >
                  {savingRename ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <Text style={styles.modalSaveText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ── INACTIVITY PERIOD MODAL ── */}
        <Modal visible={showPeriodModal} transparent animationType="fade" onRequestClose={() => setShowPeriodModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface || '#161616', borderColor: colors.border || '#2c2c2e' }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary || '#FFFFFF' }]}>If Inactive For...</Text>
              {['1 week', '1 month', '3 months', '6 months'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodOption, { borderBottomColor: colors.border || '#262626' }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setInactivePeriod(p);
                    setShowPeriodModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.periodOptionText,
                      { color: inactivePeriod === p ? colors.primary : colors.textPrimary || '#FFFFFF' },
                      inactivePeriod === p && { fontWeight: '700' },
                    ]}
                  >
                    {p}
                  </Text>
                  {inactivePeriod === p && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function SecuritySessionsFallback({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: colors.background || '#000000' }]} edges={['top', 'bottom']}>
      <View style={[styles.container, { backgroundColor: colors.background || '#000000' }]}>
        <View style={[styles.header, { borderBottomColor: colors.border || '#1f1f1f' }]}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            onPress={() => safeBack('/general-settings')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary || '#FFFFFF'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary || '#FFFFFF' }]}>Active sessions</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="shield-checkmark-outline" size={56} color={colors.primary} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary || '#FFFFFF', marginBottom: 8, textAlign: 'center' }}>
            Active Sessions Protected
          </Text>
          <Text style={{ fontSize: 13, color: colors.textMuted || '#8a99a8', textAlign: 'center', marginBottom: 24, lineHeight: 18, maxWidth: 300 }}>
            Unable to connect to active sessions at this moment. Please check your internet connection and try again.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
            activeOpacity={0.8}
            onPress={resetErrorBoundary}
          >
            <Text style={{ color: '#000000', fontWeight: '700', fontSize: 14 }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function SecuritySessionsScreen() {
  return (
    <ErrorBoundary FallbackComponent={SecuritySessionsFallback}>
      <SecuritySessionsContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  container: {
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
  headerIconBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginLeft: 10,
  },
  scrollBody: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  skeletonWrap: {
    paddingVertical: 8,
  },
  sectionWrap: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  renameLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  deviceCounterPill: {
    fontSize: 12,
    fontWeight: '600',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  deviceCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceTextWrap: {
    flex: 1,
  },
  deviceNameText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  deviceAppText: {
    fontSize: 13,
    marginBottom: 2,
  },
  deviceLocationText: {
    fontSize: 12,
  },
  terminateAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  terminateIcon: {
    marginRight: 10,
  },
  terminateAllText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionCaption: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
    paddingHorizontal: 6,
  },
  slotAvailableBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  slotAvailableTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  slotAvailableDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  otherDeviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
    marginBottom: 10,
  },
  closeBtn: {
    padding: 8,
  },
  inactivityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  inactivityLabel: {
    fontSize: 14,
  },
  inactivityValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inactivityValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalSubTitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  suggestionPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  renameTextInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalSaveBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalSaveText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
  periodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  periodOptionText: {
    fontSize: 14,
  },
});
