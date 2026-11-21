import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { safeBack } from '../lib/navigation';
import { useUserStore } from '../store/userStore';
import { useTheme } from '../store/themeStore';
import {
  getActiveSessions,
  syncCurrentDeviceSession,
  updateDeviceName,
  terminateSession,
  terminateAllOtherSessions,
  getLocalDeviceId,
  detectClientHardware,
  DeviceSession,
} from '../lib/deviceSecurityService';

export default function SecuritySessionsScreen() {
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
    setRenameInput(cur?.deviceName || detectClientHardware().name || 'HP EliteBook 830 G6');
    setShowRenameModal(true);
  };

  const handleSaveRename = async () => {
    if (!renameInput.trim() || !user.uid) return;
    setSavingRename(true);
    try {
      const ok = await updateDeviceName(user.uid, currentDeviceId, renameInput.trim());
      if (ok) {
        setSessions((prev) =>
          prev.map((s) => (s.isCurrent ? { ...s, deviceName: renameInput.trim() } : s))
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
    location: 'Ethiopia',
    isCurrent: true,
    lastActive: null,
    createdAt: null,
  };
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  const getDeviceIcon = (type: string, name: string): keyof typeof Ionicons.glyphMap => {
    if (type === 'desktop' || /Windows|Mac|Linux|PC|Book/i.test(name)) {
      return 'laptop-outline';
    }
    if (/iPhone|iPad|Apple/i.test(name)) {
      return 'phone-portrait-outline';
    }
    return 'phone-portrait-outline';
  };

  const getCircleBg = (type: string, name: string): string => {
    if (type === 'desktop' || /Windows|PC|Book/i.test(name)) {
      return '#2AABEE'; // Telegram Blue for PC/Laptop
    }
    if (/iPhone|iPad|Apple/i.test(name)) {
      return '#3b4353'; // Dark Gray for Apple
    }
    return '#4CAF50'; // Telegram Green for Android
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      {/* Centered Telegram App Container */}
      <View style={styles.container}>
        {/* Telegram Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            onPress={() => safeBack('/general-settings')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Active sessions</Text>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            onPress={() => safeBack('/general-settings')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={22} color="#8a99a8" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2AABEE" />}
        >
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#2AABEE" />
              <Text style={styles.loadingText}>Loading sessions...</Text>
            </View>
          ) : (
            <>
              {/* ── SECTION 1: THIS DEVICE ── */}
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.telegramSectionTitle}>This device</Text>
                  <TouchableOpacity activeOpacity={0.7} onPress={handleOpenRename}>
                    <Text style={styles.renameLink}>Rename</Text>
                  </TouchableOpacity>
                </View>

                {/* Current Device Row */}
                <View style={styles.deviceRow}>
                  <View
                    style={[
                      styles.deviceCircle,
                      { backgroundColor: getCircleBg(currentSession.deviceType, currentSession.deviceName) },
                    ]}
                  >
                    {currentSession.deviceType === 'desktop' ? (
                      <Ionicons name="laptop-outline" size={24} color="#FFFFFF" />
                    ) : /Android/i.test(currentSession.deviceName) ? (
                      <Ionicons name="logo-android" size={24} color="#FFFFFF" />
                    ) : (
                      <Ionicons name="phone-portrait-outline" size={24} color="#FFFFFF" />
                    )}
                  </View>

                  <View style={styles.deviceTextWrap}>
                    <Text style={styles.deviceNameText}>{currentSession.deviceName}</Text>
                    <Text style={styles.deviceAppText}>{currentSession.clientApp || 'FitPulse Web 2.5.0 x64'}</Text>
                    <Text style={styles.deviceLocationText}>
                      {currentSession.location || 'Ethiopia'}
                      {currentSession.ip ? ` • ${currentSession.ip}` : ''}
                    </Text>
                  </View>
                </View>

                {/* Terminate all other sessions button */}
                <TouchableOpacity
                  style={styles.terminateAllRow}
                  activeOpacity={0.7}
                  onPress={handleTerminateAllOthers}
                  disabled={actionLoadingId === 'all'}
                >
                  <Ionicons name="hand-left-outline" size={20} color="#FF595A" style={styles.terminateIcon} />
                  <Text style={styles.terminateAllText}>
                    {actionLoadingId === 'all' ? 'Terminating...' : 'Terminate all other sessions'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.sectionCaption}>Logs out all devices except for this one.</Text>
              </View>

              {/* ── SECTION 2: ACTIVE DEVICES ── */}
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.telegramSectionTitle}>Active Devices</Text>
                  <Text style={styles.deviceCounterPill}>
                    {sessions.length} / 2 Connected
                  </Text>
                </View>

                {otherSessions.length === 0 ? (
                  <View style={styles.slotAvailableBox}>
                    <View style={[styles.deviceCircle, { backgroundColor: '#232e3c' }]}>
                      <Ionicons name="phone-portrait-outline" size={22} color="#708499" />
                    </View>
                    <View style={styles.deviceTextWrap}>
                      <Text style={styles.slotAvailableTitle}>Slot 2 Available (1 / 2 Devices)</Text>
                      <Text style={styles.slotAvailableDesc}>
                        No secondary phone is currently connected. To log in on a 2nd phone, enter your email and password; a 6-digit verification code will be sent to this device via FitPulse Official Chat.
                      </Text>
                    </View>
                  </View>
                ) : (
                  otherSessions.map((item) => (
                    <View key={item.deviceId} style={styles.otherDeviceRow}>
                      <View
                        style={[
                          styles.deviceCircle,
                          { backgroundColor: getCircleBg(item.deviceType, item.deviceName) },
                        ]}
                      >
                        {/Android|Samsung|Tecno|Infinix/i.test(item.deviceName) ? (
                          <Ionicons name="logo-android" size={24} color="#FFFFFF" />
                        ) : /Apple|iPhone|iPad/i.test(item.deviceName) ? (
                          <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
                        ) : (
                          <Ionicons name="phone-portrait-outline" size={24} color="#FFFFFF" />
                        )}
                      </View>

                      <View style={styles.deviceTextWrap}>
                        <Text style={styles.deviceNameText}>{item.deviceName}</Text>
                        <Text style={styles.deviceAppText}>{item.clientApp || 'FitPulse Android 2.5.0'}</Text>
                        <Text style={styles.deviceLocationText}>
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
                          <ActivityIndicator size="small" color="#FF595A" />
                        ) : (
                          <Ionicons name="close" size={20} color="#708499" />
                        )}
                      </TouchableOpacity>
                    </View>
                  ))
                )}

                <Text style={styles.sectionCaption}>
                  The official FitPulse app is available for Android, iPhone, iPad, Windows, macOS and Linux.
                </Text>
              </View>

              {/* ── SECTION 3: TERMINATE OLD SESSIONS ── */}
              <View style={styles.sectionWrap}>
                <Text style={styles.telegramSectionTitle}>Terminate old sessions</Text>

                <TouchableOpacity
                  style={styles.inactivityRow}
                  activeOpacity={0.7}
                  onPress={() => setShowPeriodModal(true)}
                >
                  <Text style={styles.inactivityLabel}>If inactive for...</Text>
                  <View style={styles.inactivityValueWrap}>
                    <Text style={styles.inactivityValue}>{inactivePeriod}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#708499" />
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>

        {/* ── RENAME DEVICE MODAL ── */}
        <Modal visible={showRenameModal} transparent animationType="fade" onRequestClose={() => setShowRenameModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Rename Device</Text>
              <Text style={styles.modalSubTitle}>
                Enter a custom name for this device (e.g. HP EliteBook 830 G6, Fuad's PC).
              </Text>

              <TextInput
                style={styles.renameTextInput}
                value={renameInput}
                onChangeText={setRenameInput}
                placeholder="Device Name"
                placeholderTextColor="#708499"
                autoFocus
                selectTextOnFocus
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  activeOpacity={0.7}
                  onPress={() => setShowRenameModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  activeOpacity={0.8}
                  onPress={handleSaveRename}
                  disabled={savingRename}
                >
                  {savingRename ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
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
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>If Inactive For...</Text>
              {['1 week', '1 month', '3 months', '6 months'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={styles.periodOption}
                  activeOpacity={0.7}
                  onPress={() => {
                    setInactivePeriod(p);
                    setShowPeriodModal(false);
                  }}
                >
                  <Text style={[styles.periodOptionText, inactivePeriod === p && { color: '#2AABEE', fontWeight: '700' }]}>
                    {p}
                  </Text>
                  {inactivePeriod === p && <Ionicons name="checkmark" size={18} color="#2AABEE" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0e1621',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: '#0e1621',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#17212b',
  },
  headerIconBtn: {
    padding: 6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginLeft: 14,
  },
  scrollBody: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#8a99a8',
    fontSize: 14,
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
  telegramSectionTitle: {
    color: '#2AABEE',
    fontSize: 14,
    fontWeight: '700',
  },
  renameLink: {
    color: '#2AABEE',
    fontSize: 14,
    fontWeight: '600',
  },
  deviceCounterPill: {
    color: '#708499',
    fontSize: 12,
    fontWeight: '600',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17212b',
    padding: 14,
    borderRadius: 12,
    gap: 14,
  },
  deviceCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceTextWrap: {
    flex: 1,
  },
  deviceNameText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  deviceAppText: {
    color: '#8a99a8',
    fontSize: 13,
    marginBottom: 2,
  },
  deviceLocationText: {
    color: '#708499',
    fontSize: 12,
  },
  terminateAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginTop: 8,
  },
  terminateIcon: {
    marginRight: 10,
  },
  terminateAllText: {
    color: '#FF595A',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionCaption: {
    color: '#708499',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    paddingHorizontal: 6,
  },
  slotAvailableBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17212b',
    padding: 14,
    borderRadius: 12,
    gap: 14,
    borderWidth: 1,
    borderColor: '#232e3c',
    borderStyle: 'dashed',
  },
  slotAvailableTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  slotAvailableDesc: {
    color: '#708499',
    fontSize: 12,
    lineHeight: 16,
  },
  otherDeviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17212b',
    padding: 14,
    borderRadius: 12,
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
    backgroundColor: '#17212b',
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  inactivityLabel: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  inactivityValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inactivityValue: {
    color: '#2AABEE',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#17212b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#232e3c',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalSubTitle: {
    color: '#8a99a8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  renameTextInput: {
    backgroundColor: '#0e1621',
    borderWidth: 1,
    borderColor: '#2AABEE',
    borderRadius: 10,
    color: '#FFFFFF',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalCancelText: {
    color: '#8a99a8',
    fontSize: 14,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: '#2AABEE',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  periodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#232e3c',
  },
  periodOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
