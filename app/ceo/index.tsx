import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import BrandLogo from '../../components/ui/BrandLogo';
import { isCeoAuthenticated, logoutCeo } from '../../lib/ceoAuthService';
import {
  fetchRecentErrors,
  resolveError,
  deleteErrorRecord,
  clearResolvedErrors,
  SystemErrorItem,
} from '../../lib/telemetryService';
import {
  checkAllServicesHealth,
  diagnoseSystemIssue,
  fetchSystemConfig,
  updateSystemConfig,
  ServiceHealthItem,
  SystemRemoteConfig,
} from '../../lib/systemHealthService';
import { supabase } from '../../lib/supabase';

type CeoTab = 'errors' | 'finance' | 'health' | 'controls';

export default function CeoDashboardScreen() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<CeoTab>('errors');
  const [refreshing, setRefreshing] = useState(false);

  // Data States
  const [errorsList, setErrorsList] = useState<SystemErrorItem[]>([]);
  const [healthList, setHealthList] = useState<ServiceHealthItem[]>([]);
  const [remoteConfig, setRemoteConfig] = useState<SystemRemoteConfig>({
    voice_coach_enabled: true,
    maintenance_mode: false,
    chapa_payments_enabled: true,
  });
  const [transactionsList, setTransactionsList] = useState<any[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [onlyUnresolved, setOnlyUnresolved] = useState(true);
  const [updatingConfig, setUpdatingConfig] = useState(false);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>('');

  // 1. Enforce Authentication
  useEffect(() => {
    isCeoAuthenticated().then((authenticated) => {
      if (!authenticated) {
        router.replace('/ceo/login');
      } else {
        setCheckingAuth(false);
      }
    });
  }, [router]);

  // 2. Load all dashboard metrics
  const loadDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);

      const [errors, health, config, txRes, usersCountRes] = await Promise.all([
        fetchRecentErrors(50),
        checkAllServicesHealth(),
        fetchSystemConfig(),
        (async () => {
          try {
            return await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(25);
          } catch {
            return { data: [] };
          }
        })(),
        (async () => {
          try {
            return await supabase.from('profiles').select('*', { count: 'exact', head: true });
          } catch {
            return { count: 0 };
          }
        })(),
      ]);

      setErrorsList(errors);
      setHealthList(health);
      setRemoteConfig(config);
      setTransactionsList((txRes as any)?.data || []);
      setTotalUsersCount((usersCountRes as any)?.count || 0);
      setLastRefreshedTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn('Dashboard sync error:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!checkingAuth) {
      loadDashboardData();
      // Auto-refresh every 30 seconds
      const interval = setInterval(loadDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [checkingAuth, loadDashboardData]);

  // Handle Logout
  const handleLogout = async () => {
    await logoutCeo();
    router.replace('/ceo/login');
  };

  // Actions for Errors
  const handleResolveError = async (id: string) => {
    await resolveError(id);
    setErrorsList((prev) => prev.map((e) => (e.id === id ? { ...e, resolved: true } : e)));
  };

  const handleDeleteError = async (id: string) => {
    await deleteErrorRecord(id);
    setErrorsList((prev) => prev.filter((e) => e.id !== id));
  };

  const handleClearResolved = async () => {
    await clearResolvedErrors();
    setErrorsList((prev) => prev.filter((e) => !e.resolved));
  };

  // Actions for Config Switches
  const handleToggleConfig = async (key: keyof SystemRemoteConfig, val: boolean) => {
    setUpdatingConfig(true);
    setRemoteConfig((prev) => ({ ...prev, [key]: val }));
    await updateSystemConfig(key, val);
    setUpdatingConfig(false);
  };

  // Calculate High-level System Status
  const hasDownService = healthList.some((h) => h.status === 'down');
  const hasDegradedService = healthList.some((h) => h.status === 'degraded');
  const unresolvedErrorsCount = errorsList.filter((e) => !e.resolved).length;

  const systemStatusPill = hasDownService
    ? { text: 'CRITICAL ALERT', color: '#EF4444', icon: 'alert-circle' }
    : hasDegradedService
    ? { text: 'DEGRADED PERFORMANCE', color: '#EAB308', icon: 'warning' }
    : { text: 'ALL SYSTEMS OPERATIONAL', color: '#00E676', icon: 'checkmark-circle' };

  if (checkingAuth) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const displayedErrors = onlyUnresolved ? errorsList.filter((e) => !e.resolved) : errorsList;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* ── TOP HEADER ── */}
      <View style={styles.header}>
        <View style={styles.brandGroup}>
          <BrandLogo size="small" showText={false} />
          <View style={styles.brandTitleWrap}>
            <View style={styles.titleRow}>
              <Text style={styles.brandTitle}>FitPulse</Text>
              <View style={styles.ceoBadge}>
                <Text style={styles.ceoBadgeText}>MISSION CONTROL</Text>
              </View>
            </View>
            <Text style={styles.brandSubtitle}>Executive Operations & Health Dashboard</Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.refreshIconBtn}
            onPress={loadDashboardData}
            activeOpacity={0.7}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="refresh" size={17} color="#FFF" />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={17} color="#EF4444" />
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadDashboardData} tintColor={Colors.primary} />
        }
      >
        {/* ── SYSTEM STATUS BANNER ── */}
        <View style={styles.statusBanner}>
          <View style={styles.statusLeft}>
            <Ionicons name={systemStatusPill.icon as any} size={18} color={systemStatusPill.color} />
            <Text style={[styles.statusBannerTitle, { color: systemStatusPill.color }]}>
              {systemStatusPill.text}
            </Text>
          </View>
          <Text style={styles.statusLastSync}>
            Synced: {lastRefreshedTime || 'Just now'} • Auto-refresh: 30s
          </Text>
        </View>

        {/* ── QUICK METRICS GRID ── */}
        <View style={styles.metricsGrid}>
          {/* Metric 1: Unresolved Errors */}
          <View style={[styles.metricCard, unresolvedErrorsCount > 0 && styles.metricCardAlert]}>
            <View style={styles.metricCardHeader}>
              <Text style={styles.metricLabel}>ACTIVE ERRORS</Text>
              <Ionicons
                name="bug"
                size={16}
                color={unresolvedErrorsCount > 0 ? '#EF4444' : Colors.primary}
              />
            </View>
            <Text style={[styles.metricValue, unresolvedErrorsCount > 0 && { color: '#EF4444' }]}>
              {unresolvedErrorsCount}
            </Text>
            <Text style={styles.metricSub}>
              {errorsList.length} total captured logs
            </Text>
          </View>

          {/* Metric 2: Registered Athletes & Coaches */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <Text style={styles.metricLabel}>REGISTERED USERS</Text>
              <Ionicons name="people" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.metricValue}>{totalUsersCount}</Text>
            <Text style={styles.metricSub}>Athletes, Coaches & Guests</Text>
          </View>

          {/* Metric 3: Recent Transactions */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <Text style={styles.metricLabel}>PAYMENT RADAR</Text>
              <Ionicons name="card" size={16} color="#EAB308" />
            </View>
            <Text style={styles.metricValue}>{transactionsList.length}</Text>
            <Text style={styles.metricSub}>Recent Chapa & Coins logs</Text>
          </View>

          {/* Metric 4: Cloud Health */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <Text style={styles.metricLabel}>CORE SERVICES</Text>
              <Ionicons name="server" size={16} color="#00E676" />
            </View>
            <Text style={styles.metricValue}>
              {healthList.filter((h) => h.status === 'healthy').length}/{healthList.length || 4}
            </Text>
            <Text style={styles.metricSub}>APIs Online & Monitored</Text>
          </View>
        </View>

        {/* ── NAVIGATION TABS ── */}
        <View style={styles.navTabsWrap}>
          {[
            { key: 'errors', label: 'Error Radar', icon: 'alert-circle', count: unresolvedErrorsCount },
            { key: 'finance', label: 'Payment Radar', icon: 'wallet', count: transactionsList.length },
            { key: 'health', label: 'Infrastructure', icon: 'pulse' },
            { key: 'controls', label: 'Remote Controls', icon: 'toggle' },
          ].map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.navTabBtn, active && styles.navTabBtnActive]}
                onPress={() => setActiveTab(tab.key as CeoTab)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={active ? '#000' : '#8A95A5'}
                />
                <Text style={[styles.navTabText, active && styles.navTabTextActive]}>
                  {tab.label}
                </Text>
                {tab.count !== undefined && tab.count > 0 ? (
                  <View
                    style={[
                      styles.tabCountBadge,
                      tab.key === 'errors' && unresolvedErrorsCount > 0 && { backgroundColor: '#EF4444' },
                    ]}
                  >
                    <Text style={styles.tabCountBadgeText}>{tab.count}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── TAB 1: ERROR RADAR ── */}
        {activeTab === 'errors' && (
          <View style={styles.tabSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Real-time Error & Crash Stream</Text>
                <Text style={styles.sectionSubtitle}>
                  Errors captured silently on user devices with automated diagnostic resolutions.
                </Text>
              </View>

              <View style={styles.errorFilterActions}>
                <TouchableOpacity
                  style={[styles.filterChip, onlyUnresolved && styles.filterChipActive]}
                  onPress={() => setOnlyUnresolved(!onlyUnresolved)}
                >
                  <Text style={[styles.filterChipText, onlyUnresolved && styles.filterChipTextActive]}>
                    {onlyUnresolved ? 'Unresolved Only' : 'Showing All'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.clearBtn} onPress={handleClearResolved}>
                  <Text style={styles.clearBtnText}>Purge Resolved</Text>
                </TouchableOpacity>
              </View>
            </View>

            {displayedErrors.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-done-circle" size={54} color="#00E676" />
                <Text style={styles.emptyTitle}>Zero Active Errors</Text>
                <Text style={styles.emptySubtitle}>
                  All systems operating cleanly. User app telemetry is running smoothly with no reported crashes.
                </Text>
              </View>
            ) : (
              displayedErrors.map((item) => {
                const diag = diagnoseSystemIssue(item.error_message, item.component);
                return (
                  <View key={item.id} style={[styles.errorCard, item.resolved && styles.errorCardResolved]}>
                    <View style={styles.errorCardTop}>
                      <View style={styles.errorBadgesRow}>
                        <View
                          style={[
                            styles.severityBadge,
                            item.severity === 'critical'
                              ? styles.badgeCritical
                              : styles.badgeWarning,
                          ]}
                        >
                          <Text style={styles.severityBadgeText}>
                            {(item.severity || 'warning').toUpperCase()}
                          </Text>
                        </View>

                        <View style={styles.platformBadge}>
                          <Ionicons name="phone-portrait-outline" size={11} color="#8A95A5" />
                          <Text style={styles.platformBadgeText}>{item.platform || 'Client'}</Text>
                        </View>

                        <View style={styles.componentBadge}>
                          <Text style={styles.componentBadgeText}>{item.component || 'App'}</Text>
                        </View>
                      </View>

                      <Text style={styles.errorTime}>
                        {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent'}
                      </Text>
                    </View>

                    <Text style={styles.errorMessageText}>{item.error_message}</Text>

                    {item.user_email && item.user_email !== 'unknown' ? (
                      <Text style={styles.errorUserMeta}>
                        User Affected: <Text style={{ color: '#FFF' }}>{item.user_email}</Text> ({item.user_uid?.slice(0, 8)}...)
                      </Text>
                    ) : null}

                    {/* Proactive Diagnosis Box */}
                    <View style={styles.diagnosisBox}>
                      <View style={styles.diagnosisHeader}>
                        <Ionicons name="sparkles" size={13} color="#EAB308" />
                        <Text style={styles.diagnosisTitle}>PROACTIVE DIAGNOSTIC & SOLUTION</Text>
                      </View>
                      <Text style={styles.diagCause}>
                        <Text style={{ fontWeight: '700', color: '#FFF' }}>ምክንያት፦ </Text>
                        {diag.rootCause}
                      </Text>
                      <Text style={styles.diagSolution}>
                        <Text style={{ fontWeight: '700', color: '#00E676' }}>መፍትሔ፦ </Text>
                        {diag.actionableSolution}
                      </Text>
                      {diag.actionCodeSnippet ? (
                        <View style={styles.codeSnippetBox}>
                          <Text style={styles.codeSnippetText}>{diag.actionCodeSnippet}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.errorCardActions}>
                      {!item.resolved ? (
                        <TouchableOpacity
                          style={styles.resolveBtn}
                          onPress={() => item.id && handleResolveError(item.id)}
                        >
                          <Ionicons name="checkmark" size={14} color="#000" />
                          <Text style={styles.resolveBtnText}>Mark Resolved</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.resolvedPill}>
                          <Ionicons name="checkmark-circle" size={13} color="#00E676" />
                          <Text style={styles.resolvedPillText}>Resolved</Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={styles.deleteErrorBtn}
                        onPress={() => item.id && handleDeleteError(item.id)}
                      >
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ── TAB 2: PAYMENT & CHAPA RADAR ── */}
        {activeTab === 'finance' && (
          <View style={styles.tabSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Chapa & Coin Transaction Feed</Text>
                <Text style={styles.sectionSubtitle}>
                  Monitor digital payments, coin purchases, and pending bank clearances.
                </Text>
              </View>
            </View>

            {transactionsList.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="card-outline" size={50} color="#8A95A5" />
                <Text style={styles.emptyTitle}>No Recorded Transactions</Text>
                <Text style={styles.emptySubtitle}>
                  Transactions made via Chapa checkout or coin gifts will display live here.
                </Text>
              </View>
            ) : (
              transactionsList.map((tx: any, idx) => (
                <View key={tx.id || idx} style={styles.transactionCard}>
                  <View style={styles.txLeft}>
                    <View style={styles.txIconCircle}>
                      <Ionicons
                        name={tx.type === 'coin_purchase' ? 'cash' : 'arrow-up-circle'}
                        size={18}
                        color={Colors.primary}
                      />
                    </View>
                    <View>
                      <Text style={styles.txTitle}>{tx.description || tx.type || 'Transaction'}</Text>
                      <Text style={styles.txMeta}>
                        Ref: {tx.tx_ref || tx.reference || tx.id?.slice(0, 10)} •{' '}
                        {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'Recent'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.txRight}>
                    <Text style={styles.txAmount}>
                      {tx.amount ? `${tx.amount} ETB` : `${tx.coins || 0} Coins`}
                    </Text>
                    <View
                      style={[
                        styles.txStatusBadge,
                        tx.status === 'completed' || tx.status === 'success'
                          ? styles.txStatusSuccess
                          : styles.txStatusPending,
                      ]}
                    >
                      <Text style={styles.txStatusText}>
                        {(tx.status || 'completed').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── TAB 3: INFRASTRUCTURE HEARTBEAT ── */}
        {activeTab === 'health' && (
          <View style={styles.tabSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Cloud Services & API Heartbeat</Text>
                <Text style={styles.sectionSubtitle}>
                  Live latency metrics and endpoint ping checks across external providers.
                </Text>
              </View>
            </View>

            <View style={styles.healthCardsGrid}>
              {healthList.map((item, index) => {
                const isHealthy = item.status === 'healthy';
                const isDegraded = item.status === 'degraded';
                const statusColor = isHealthy ? '#00E676' : isDegraded ? '#EAB308' : '#EF4444';
                return (
                  <View key={index} style={styles.serviceHealthCard}>
                    <View style={styles.serviceCardTop}>
                      <Text style={styles.serviceName}>{item.name}</Text>
                      <View style={[styles.healthDot, { backgroundColor: statusColor }]} />
                    </View>

                    <View style={styles.serviceLatencyRow}>
                      <Ionicons name="speedometer-outline" size={15} color="#8A95A5" />
                      <Text style={styles.serviceLatencyText}>{item.latencyMs} ms</Text>
                      <Text style={[styles.serviceStatusText, { color: statusColor }]}>
                        • {item.status.toUpperCase()}
                      </Text>
                    </View>

                    <Text style={styles.serviceMessage}>{item.message}</Text>
                    <Text style={styles.serviceChecked}>Last checked: {item.lastChecked}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── TAB 4: REMOTE CONTROLS & AI SETTINGS ── */}
        {activeTab === 'controls' && (
          <View style={styles.tabSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>System Switches & Remote Feature Flags</Text>
                <Text style={styles.sectionSubtitle}>
                  Change live application behavior remotely without redeploying code.
                </Text>
              </View>
            </View>

            <View style={styles.switchesContainer}>
              {/* Switch 1: AI Voice Coach */}
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <View style={styles.switchTitleRow}>
                    <Ionicons name="mic-outline" size={18} color={Colors.primary} />
                    <Text style={styles.switchTitle}>Voice Coach AI Engine</Text>
                  </View>
                  <Text style={styles.switchSubtitle}>
                    Enables motivational real-time spoken coaching audio during user workouts.
                  </Text>
                </View>
                <Switch
                  value={remoteConfig.voice_coach_enabled}
                  onValueChange={(val) => handleToggleConfig('voice_coach_enabled', val)}
                  trackColor={{ false: '#263442', true: '#00E676' }}
                  thumbColor="#FFF"
                  disabled={updatingConfig}
                />
              </View>

              {/* Switch 2: Chapa Payments Gateway */}
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <View style={styles.switchTitleRow}>
                    <Ionicons name="card-outline" size={18} color="#EAB308" />
                    <Text style={styles.switchTitle}>Chapa Payment Gateway</Text>
                  </View>
                  <Text style={styles.switchSubtitle}>
                    When disabled, users see a gentle maintenance notice when attempting coin recharges.
                  </Text>
                </View>
                <Switch
                  value={remoteConfig.chapa_payments_enabled}
                  onValueChange={(val) => handleToggleConfig('chapa_payments_enabled', val)}
                  trackColor={{ false: '#263442', true: '#00E676' }}
                  thumbColor="#FFF"
                  disabled={updatingConfig}
                />
              </View>

              {/* Switch 3: Emergency Maintenance Mode */}
              <View style={[styles.switchRow, remoteConfig.maintenance_mode && styles.switchRowAlert]}>
                <View style={styles.switchInfo}>
                  <View style={styles.switchTitleRow}>
                    <Ionicons name="warning-outline" size={18} color="#EF4444" />
                    <Text style={[styles.switchTitle, remoteConfig.maintenance_mode && { color: '#EF4444' }]}>
                      Emergency Maintenance Mode
                    </Text>
                  </View>
                  <Text style={styles.switchSubtitle}>
                    Locks the mobile app and displays a maintenance message to all non-admin users.
                  </Text>
                </View>
                <Switch
                  value={remoteConfig.maintenance_mode}
                  onValueChange={(val) => handleToggleConfig('maintenance_mode', val)}
                  trackColor={{ false: '#263442', true: '#EF4444' }}
                  thumbColor="#FFF"
                  disabled={updatingConfig}
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050B0E',
  },
  centerLoading: {
    flex: 1,
    backgroundColor: '#050B0E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#0B131B',
    borderBottomWidth: 1,
    borderBottomColor: '#172430',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandTitleWrap: {
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  ceoBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.35)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ceoBadgeText: {
    color: '#00E676',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    color: '#8A95A5',
    fontSize: 11,
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#15222E',
    borderWidth: 1,
    borderColor: '#223647',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingBottom: 60,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0D1722',
    borderWidth: 1,
    borderColor: '#182A3A',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 14,
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 6,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusLastSync: {
    color: '#8A95A5',
    fontSize: 11,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#0D161F',
    borderWidth: 1,
    borderColor: '#192C3C',
    borderRadius: 16,
    padding: 16,
  },
  metricCardAlert: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    color: '#8A95A5',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 2,
  },
  metricSub: {
    color: '#64748B',
    fontSize: 11,
  },
  navTabsWrap: {
    flexDirection: 'row',
    backgroundColor: '#0B131B',
    borderWidth: 1,
    borderColor: '#172430',
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
    gap: 4,
    flexWrap: 'wrap',
  },
  navTabBtn: {
    flex: 1,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  navTabBtnActive: {
    backgroundColor: '#00E676',
  },
  navTabText: {
    color: '#8A95A5',
    fontSize: 12.5,
    fontWeight: '700',
  },
  navTabTextActive: {
    color: '#000000',
  },
  tabCountBadge: {
    backgroundColor: '#1E2D3D',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabCountBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  tabSection: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#8A95A5',
    fontSize: 12,
    marginTop: 2,
  },
  errorFilterActions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#15222E',
    borderWidth: 1,
    borderColor: '#223647',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterChipActive: {
    borderColor: '#00E676',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
  },
  filterChipText: {
    color: '#8A95A5',
    fontSize: 11.5,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#00E676',
  },
  clearBtn: {
    backgroundColor: '#15222E',
    borderWidth: 1,
    borderColor: '#223647',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearBtnText: {
    color: '#EF4444',
    fontSize: 11.5,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    backgroundColor: '#0D161F',
    borderWidth: 1,
    borderColor: '#192C3C',
    borderRadius: 18,
    gap: 8,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: '#8A95A5',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 400,
  },
  errorCard: {
    backgroundColor: '#0D161F',
    borderWidth: 1,
    borderColor: '#192C3C',
    borderRadius: 16,
    padding: 16,
  },
  errorCardResolved: {
    opacity: 0.55,
  },
  errorCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorBadgesRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeCritical: {
    backgroundColor: '#EF4444',
  },
  badgeWarning: {
    backgroundColor: '#EAB308',
  },
  severityBadgeText: {
    color: '#000',
    fontSize: 9.5,
    fontWeight: '900',
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15222E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  platformBadgeText: {
    color: '#8A95A5',
    fontSize: 10.5,
  },
  componentBadge: {
    backgroundColor: '#15222E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  componentBadgeText: {
    color: '#00E676',
    fontSize: 10.5,
    fontWeight: '700',
  },
  errorTime: {
    color: '#64748B',
    fontSize: 11,
  },
  errorMessageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  errorUserMeta: {
    color: '#8A95A5',
    fontSize: 12,
    marginBottom: 10,
  },
  diagnosisBox: {
    backgroundColor: '#121E2B',
    borderLeftWidth: 3,
    borderLeftColor: '#EAB308',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  diagnosisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  diagnosisTitle: {
    color: '#EAB308',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  diagCause: {
    color: '#CBD5E1',
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 4,
  },
  diagSolution: {
    color: '#E2E8F0',
    fontSize: 12.5,
    lineHeight: 18,
  },
  codeSnippetBox: {
    backgroundColor: '#050B0E',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  codeSnippetText: {
    color: '#00E676',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  errorCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00E676',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  resolveBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  resolvedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  resolvedPillText: {
    color: '#00E676',
    fontSize: 11.5,
    fontWeight: '700',
  },
  deleteErrorBtn: {
    padding: 6,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0D161F',
    borderWidth: 1,
    borderColor: '#192C3C',
    borderRadius: 14,
    padding: 14,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#15222E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  txTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  txMeta: {
    color: '#8A95A5',
    fontSize: 11.5,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    color: '#00E676',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  txStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  txStatusSuccess: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  txStatusPending: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
  },
  txStatusText: {
    color: '#FFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  healthCardsGrid: {
    gap: 12,
  },
  serviceHealthCard: {
    backgroundColor: '#0D161F',
    borderWidth: 1,
    borderColor: '#192C3C',
    borderRadius: 16,
    padding: 16,
  },
  serviceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  serviceName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  healthDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  serviceLatencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  serviceLatencyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  serviceStatusText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  serviceMessage: {
    color: '#CBD5E1',
    fontSize: 12.5,
    marginBottom: 4,
  },
  serviceChecked: {
    color: '#64748B',
    fontSize: 11,
  },
  switchesContainer: {
    gap: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0D161F',
    borderWidth: 1,
    borderColor: '#192C3C',
    borderRadius: 16,
    padding: 18,
    gap: 14,
  },
  switchRowAlert: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  switchInfo: {
    flex: 1,
  },
  switchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  switchTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  switchSubtitle: {
    color: '#8A95A5',
    fontSize: 12.5,
    lineHeight: 18,
  },
});
