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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { useUserStore } from '../store/userStore';
import { useTheme } from '../store/themeStore';
import {
  getActiveSessions,
  terminateSession,
  terminateAllOtherSessions,
  getLocalDeviceId,
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

  const currentDeviceId = getLocalDeviceId();

  const loadSessions = useCallback(async () => {
    if (!user.uid) {
      setLoading(false);
      return;
    }
    try {
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
      Alert.alert('No other sessions', 'You only have this current device logged in.');
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

  const getDeviceIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'desktop':
        return 'laptop-outline';
      case 'tablet':
        return 'tablet-portrait-outline';
      default:
        return 'phone-portrait-outline';
    }
  };

  const currentSession = sessions.find((s) => s.isCurrent) || {
    deviceId: currentDeviceId,
    deviceName: 'This Device (Current Session)',
    deviceType: 'mobile',
    location: 'Current Location',
    isCurrent: true,
  };
  const otherSessions = sessions.filter((s) => !s.isCurrent);
  const activeCount = sessions.length > 0 ? sessions.length : 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background || '#000000' }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border || '#202020' }]}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary || '#FFFFFF'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary || '#FFFFFF' }]}>Active Sessions</Text>
        <TouchableOpacity style={styles.refreshBtn} activeOpacity={0.7} onPress={loadSessions} disabled={loading}>
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Policy Summary Card */}
        <View style={[styles.policyCard, { backgroundColor: colors.surface || '#121212', borderColor: colors.border || '#222222' }]}>
          <View style={styles.policyHeader}>
            <View style={[styles.policyIconBox, { backgroundColor: '#000000', borderColor: colors.primary }]}>
              <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
            </View>
            <View style={styles.policyTitleWrap}>
              <Text style={[styles.policyTitle, { color: colors.textPrimary }]}>Device Security & Limits</Text>
              <Text style={[styles.policySubtitle, { color: colors.textMuted }]}>
                Strict 2-Device Policy: Max 2 authorized devices per account
              </Text>
            </View>
          </View>

          <View style={styles.policyDivider} />

          <View style={styles.counterRow}>
            <View style={styles.counterLeft}>
              <Text style={[styles.counterLabel, { color: colors.textMuted }]}>Authorized Devices:</Text>
              <Text style={[styles.counterValue, { color: colors.textPrimary }]}>
                {activeCount} / 2 Connected
              </Text>
            </View>
            <View
              style={[
                styles.badgePill,
                {
                  backgroundColor: activeCount >= 2 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                  borderColor: activeCount >= 2 ? '#F59E0B' : colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgePillText,
                  { color: activeCount >= 2 ? '#F59E0B' : colors.primary },
                ]}
              >
                {activeCount >= 2 ? 'Limit Reached (2/2)' : '1 Slot Available (1/2)'}
              </Text>
            </View>
          </View>

          <View style={[styles.tipBox, { backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}>
            <Ionicons name="chatbubbles-outline" size={16} color={colors.primary} style={{ marginTop: 2 }} />
            <Text style={[styles.tipText, { color: colors.textMuted }]}>
              When logging in on a second phone, FitPulse dispatches a 6-digit verification code directly into your{' '}
              <Text style={{ color: colors.primary, fontWeight: '700' }}>FitPulse Official Chat</Text>.
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Checking active sessions...</Text>
          </View>
        ) : (
          <>
            {/* CURRENT DEVICE SECTION */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>CURRENT DEVICE</Text>

              <View style={[styles.sessionCard, styles.currentCard, { backgroundColor: colors.surface || '#121212', borderColor: colors.primary }]}>
                <View style={styles.sessionMain}>
                  <View style={[styles.deviceIconBox, { backgroundColor: 'rgba(0, 230, 118, 0.12)' }]}>
                    <Ionicons name={getDeviceIcon(currentSession.deviceType)} size={26} color={colors.primary} />
                  </View>
                  <View style={styles.deviceInfo}>
                    <View style={styles.deviceNameRow}>
                      <Text style={[styles.deviceName, { color: colors.textPrimary }]}>
                        {currentSession.deviceName}
                      </Text>
                      <View style={[styles.nowBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.nowBadgeText}>Active Now</Text>
                      </View>
                    </View>

                    <Text style={[styles.deviceMeta, { color: colors.textMuted }]}>
                      📍 {currentSession.location}
                    </Text>
                    <Text style={[styles.deviceSubMeta, { color: colors.textMuted }]}>
                      This Phone • ID: {currentSession.deviceId.slice(0, 14)}...
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* OTHER AUTHORIZED SESSIONS */}
            <View style={styles.sectionWrap}>
              <View style={styles.headingRow}>
                <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>OTHER AUTHORIZED DEVICES</Text>
                {otherSessions.length > 0 && (
                  <TouchableOpacity
                    onPress={handleTerminateAllOthers}
                    disabled={actionLoadingId === 'all'}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.terminateAllText, { color: '#EF4444' }]}>
                      {actionLoadingId === 'all' ? 'Terminating...' : 'Terminate All Others'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {otherSessions.length === 0 ? (
                <View style={[styles.emptySlotCard, { backgroundColor: colors.surface || '#121212', borderColor: colors.border || '#222222' }]}>
                  <View style={[styles.emptyIconBox, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                    <Ionicons name="phone-portrait-outline" size={24} color={colors.textMuted} />
                  </View>
                  <View style={styles.emptySlotInfo}>
                    <Text style={[styles.emptySlotTitle, { color: colors.textPrimary }]}>
                      Slot 2 Available
                    </Text>
                    <Text style={[styles.emptySlotSubtitle, { color: colors.textMuted }]}>
                      No secondary phone is currently connected. You can log in on 1 additional device.
                    </Text>
                  </View>
                </View>
              ) : (
                otherSessions.map((item) => (
                  <View
                    key={item.deviceId}
                    style={[styles.sessionCard, { backgroundColor: colors.surface || '#121212', borderColor: colors.border || '#222222' }]}
                  >
                    <View style={styles.sessionMain}>
                      <View style={[styles.deviceIconBox, { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}>
                        <Ionicons name={getDeviceIcon(item.deviceType)} size={26} color={colors.textPrimary} />
                      </View>
                      <View style={styles.deviceInfo}>
                        <Text style={[styles.deviceName, { color: colors.textPrimary }]}>
                          {item.deviceName}
                        </Text>
                        <Text style={[styles.deviceMeta, { color: colors.textMuted }]}>
                          📍 {item.location}
                        </Text>
                        <Text style={[styles.deviceSubMeta, { color: colors.textMuted }]}>
                          Device 2 • ID: {item.deviceId.slice(0, 14)}...
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.terminateBtn}
                      activeOpacity={0.7}
                      onPress={() => handleTerminateSession(item)}
                      disabled={actionLoadingId === item.deviceId}
                    >
                      {actionLoadingId === item.deviceId ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <>
                          <Ionicons name="log-out-outline" size={16} color="#EF4444" />
                          <Text style={styles.terminateBtnText}>Terminate Session</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* Security Notice */}
            <View style={styles.noticeBox}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
              <Text style={[styles.noticeText, { color: colors.textMuted }]}>
                If you see an unfamiliar device, terminate its session immediately and update your password in Manage Account.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  refreshBtn: {
    padding: 6,
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 40,
  },
  policyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  policyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  policyTitleWrap: {
    flex: 1,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  policySubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  policyDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    marginVertical: 14,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  counterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  counterLabel: {
    fontSize: 13,
  },
  counterValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tipBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  sectionWrap: {
    marginBottom: 24,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  terminateAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sessionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  currentCard: {
    borderWidth: 1.5,
  },
  sessionMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  deviceIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '700',
  },
  nowBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  nowBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '800',
  },
  deviceMeta: {
    fontSize: 12,
    marginBottom: 2,
  },
  deviceSubMeta: {
    fontSize: 11,
  },
  terminateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  terminateBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  emptySlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 16,
  },
  emptyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySlotInfo: {
    flex: 1,
  },
  emptySlotTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  emptySlotSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
});
