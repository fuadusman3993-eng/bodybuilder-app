import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  TextInput,
  Modal,
  Image,
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
  explainInfrastructureBottleneck,
  fetchSystemConfig,
  updateSystemConfig,
  ServiceHealthItem,
  SystemRemoteConfig,
  BottleneckAnalysis,
} from '../../lib/systemHealthService';
import {
  fetchAllUsersWithMetrics,
  grantCompensationCoins,
  CeoUserItem,
} from '../../lib/ceoUserService';
import {
  fetchRealPaymentLedger,
  calculateFinancialKPIs,
  verifyAndReconcileChapaTx,
  CeoTransactionItem,
  FinancialKPIs,
} from '../../lib/ceoFinanceService';

type CeoTab = 'errors' | 'users' | 'finance' | 'health' | 'controls';

export default function CeoDashboardScreen() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<CeoTab>('errors');
  const [refreshing, setRefreshing] = useState(false);

  // Data States
  const [errorsList, setErrorsList] = useState<SystemErrorItem[]>([]);
  const [usersList, setUsersList] = useState<CeoUserItem[]>([]);
  const [transactionsList, setTransactionsList] = useState<CeoTransactionItem[]>([]);
  const [healthList, setHealthList] = useState<ServiceHealthItem[]>([]);
  const [remoteConfig, setRemoteConfig] = useState<SystemRemoteConfig>({
    voice_coach_enabled: true,
    maintenance_mode: false,
    chapa_payments_enabled: true,
  });

  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>('');
  const [updatingConfig, setUpdatingConfig] = useState(false);

  // Search & Filter States
  const [errorSearchQuery, setErrorSearchQuery] = useState('');
  const [errorFilterSeverity, setErrorFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'unresolved'>('unresolved');

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'user' | 'coach' | 'flagged' | 'bots'>('all');
  const [selectedUserForModal, setSelectedUserForModal] = useState<CeoUserItem | null>(null);
  const [grantingCoins, setGrantingCoins] = useState(false);

  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [txStatusFilter, setTxStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [manualTxRefInput, setManualTxRefInput] = useState('');
  const [verifyingTx, setVerifyingTx] = useState(false);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);

  // 1. Enforce CEO Authentication Gate
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

      const [errors, users, txs, health, config] = await Promise.all([
        fetchRecentErrors(100),
        fetchAllUsersWithMetrics(),
        fetchRealPaymentLedger(50),
        checkAllServicesHealth(),
        fetchSystemConfig(),
      ]);

      setErrorsList(errors);
      setUsersList(users);
      setTransactionsList(txs);
      setHealthList(health);
      setRemoteConfig(config);
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
      const interval = setInterval(loadDashboardData, 30000); // Auto-refresh every 30s
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

  // Actions for Remote Config Switches
  const handleToggleConfig = async (key: keyof SystemRemoteConfig, val: boolean) => {
    setUpdatingConfig(true);
    setRemoteConfig((prev) => ({ ...prev, [key]: val }));
    await updateSystemConfig(key, val);
    setUpdatingConfig(false);
  };

  // Actions for Granting Compensation Coins
  const handleGrantCompensationCoins = async (uid: string, amount: number) => {
    try {
      setGrantingCoins(true);
      const res = await grantCompensationCoins(uid, amount, 'CEO Goodwill Support');
      if (res.success) {
        Alert.alert('Coins Granted! 🪙', `${amount} coins have been successfully added to the user's wallet.`);
        // Refresh users
        const updatedUsers = await fetchAllUsersWithMetrics();
        setUsersList(updatedUsers);
        if (selectedUserForModal && selectedUserForModal.uid === uid) {
          const fresh = updatedUsers.find((u) => u.uid === uid);
          if (fresh) setSelectedUserForModal(fresh);
        }
      } else {
        Alert.alert('Grant Failed', res.message);
      }
    } finally {
      setGrantingCoins(false);
    }
  };

  // Actions for Manual Chapa Payment Verification
  const handleVerifyManualTx = async () => {
    if (!manualTxRefInput.trim()) {
      Alert.alert('Input Required', 'Please enter a valid Chapa transaction reference.');
      return;
    }

    try {
      setVerifyingTx(true);
      const res = await verifyAndReconcileChapaTx(manualTxRefInput.trim());
      if (res.success) {
        Alert.alert('Verification Success ✅', res.message);
        setVerifyModalVisible(false);
        setManualTxRefInput('');
        loadDashboardData();
      } else {
        Alert.alert('Verification Issue', res.message);
      }
    } finally {
      setVerifyingTx(false);
    }
  };

  // ── Derived Calculations ──
  const unresolvedErrorsCount = useMemo(() => errorsList.filter((e) => !e.resolved).length, [errorsList]);
  const flaggedUsersCount = useMemo(() => usersList.filter((u) => u.errorCount > 0).length, [usersList]);
  const suspectedBotsCount = useMemo(() => usersList.filter((u) => u.trustBadge === 'Suspected Bot').length, [usersList]);
  const verifiedHumansCount = useMemo(() => usersList.filter((u) => u.trustBadge === 'Verified Human').length, [usersList]);

  const financialKPIs: FinancialKPIs = useMemo(
    () => calculateFinancialKPIs(transactionsList),
    [transactionsList]
  );

  const infrastructureBottlenecks: BottleneckAnalysis[] = useMemo(
    () => explainInfrastructureBottleneck(healthList),
    [healthList]
  );

  const hasDownService = healthList.some((h) => h.status === 'down');
  const hasDegradedService = healthList.some((h) => h.status === 'degraded');

  const systemStatusPill = hasDownService
    ? { text: 'CRITICAL ALERT', color: '#EF4444', icon: 'alert-circle' }
    : hasDegradedService
    ? { text: 'DEGRADED PERFORMANCE', color: '#EAB308', icon: 'warning' }
    : { text: 'ALL SYSTEMS OPERATIONAL', color: '#00E676', icon: 'checkmark-circle' };

  // Filtered Errors
  const filteredErrors = useMemo(() => {
    return errorsList.filter((err) => {
      if (errorFilterSeverity === 'unresolved' && err.resolved) return false;
      if (errorFilterSeverity === 'critical' && err.severity !== 'critical') return false;
      if (errorFilterSeverity === 'warning' && err.severity !== 'warning') return false;

      if (errorSearchQuery.trim()) {
        const q = errorSearchQuery.toLowerCase();
        const matchesMsg = err.error_message?.toLowerCase().includes(q);
        const matchesComp = err.component?.toLowerCase().includes(q);
        const matchesUser = err.user_email?.toLowerCase().includes(q) || err.user_uid?.toLowerCase().includes(q);
        return matchesMsg || matchesComp || matchesUser;
      }
      return true;
    });
  }, [errorsList, errorFilterSeverity, errorSearchQuery]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      if (userRoleFilter === 'user' && u.role !== 'user') return false;
      if (userRoleFilter === 'coach' && u.role !== 'coach') return false;
      if (userRoleFilter === 'flagged' && u.errorCount === 0) return false;
      if (userRoleFilter === 'bots' && u.trustBadge !== 'Suspected Bot') return false;

      if (userSearchQuery.trim()) {
        const q = userSearchQuery.toLowerCase();
        const matchesName = u.name?.toLowerCase().includes(q);
        const matchesEmail = u.email?.toLowerCase().includes(q);
        const matchesUid = u.uid?.toLowerCase().includes(q);
        const matchesCity = u.city?.toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesUid || matchesCity;
      }
      return true;
    });
  }, [usersList, userRoleFilter, userSearchQuery]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactionsList.filter((tx) => {
      if (txStatusFilter !== 'all' && tx.status !== txStatusFilter) return false;

      if (txSearchQuery.trim()) {
        const q = txSearchQuery.toLowerCase();
        const matchesRef = tx.description?.toLowerCase().includes(q) || tx.id?.toLowerCase().includes(q);
        const matchesName = tx.userName?.toLowerCase().includes(q);
        const matchesEmail = tx.userEmail?.toLowerCase().includes(q);
        return matchesRef || matchesName || matchesEmail;
      }
      return true;
    });
  }, [transactionsList, txStatusFilter, txSearchQuery]);

  if (checkingAuth) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Verifying CEO Master Credentials...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      {/* ── TOP EXECUTIVE APP BAR ── */}
      <View style={styles.executiveHeader}>
        <View style={styles.headerLeft}>
          <BrandLogo size="small" showText={false} />
          <View style={styles.headerTitles}>
            <View style={styles.brandRow}>
              <Text style={styles.brandTitle}>FitPulse</Text>
              <View style={styles.ceoBadge}>
                <Text style={styles.ceoBadgeText}>MISSION CONTROL</Text>
              </View>
            </View>
            <Text style={styles.brandSubtitle}>Executive Operations & Intelligence Cockpit</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.refreshBtn}
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
        {/* ── HIGH-LEVEL SYSTEM STATUS BANNER ── */}
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

        {/* ── TOP 4 METRIC RADAR CARDS ── */}
        <View style={styles.metricsGrid}>
          {/* Card 1: Active Errors */}
          <TouchableOpacity
            style={[styles.metricCard, unresolvedErrorsCount > 0 && styles.metricCardAlert]}
            onPress={() => setActiveTab('errors')}
            activeOpacity={0.8}
          >
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
          </TouchableOpacity>

          {/* Card 2: Registered Users */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => setActiveTab('users')}
            activeOpacity={0.8}
          >
            <View style={styles.metricCardHeader}>
              <Text style={styles.metricLabel}>REGISTERED USERS</Text>
              <Ionicons name="people" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.metricValue}>{usersList.length}</Text>
            <Text style={styles.metricSub}>
              {verifiedHumansCount} Humans • {flaggedUsersCount > 0 ? `⚠️ ${flaggedUsersCount} Errors` : '0 Errors'}
            </Text>
          </TouchableOpacity>

          {/* Card 3: Payment Radar */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => setActiveTab('finance')}
            activeOpacity={0.8}
          >
            <View style={styles.metricCardHeader}>
              <Text style={styles.metricLabel}>PAYMENT RADAR</Text>
              <Ionicons name="wallet" size={16} color="#EAB308" />
            </View>
            <Text style={styles.metricValue}>{financialKPIs.totalRevenueEtb} ETB</Text>
            <Text style={styles.metricSub}>
              {financialKPIs.completedTransactionsCount} Completed Txs
            </Text>
          </TouchableOpacity>

          {/* Card 4: Infrastructure */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => setActiveTab('health')}
            activeOpacity={0.8}
          >
            <View style={styles.metricCardHeader}>
              <Text style={styles.metricLabel}>CORE SERVICES</Text>
              <Ionicons name="server" size={16} color="#00E676" />
            </View>
            <Text style={styles.metricValue}>
              {healthList.filter((h) => h.status === 'healthy').length}/{healthList.length || 4}
            </Text>
            <Text style={styles.metricSub}>APIs Online & Monitored</Text>
          </TouchableOpacity>
        </View>

        {/* ── 5 DEDICATED NAVIGATION TABS ── */}
        <View style={styles.navTabsWrap}>
          {[
            { key: 'errors', label: 'Error Radar', icon: 'alert-circle', count: unresolvedErrorsCount },
            { key: 'users', label: 'Users & Bots', icon: 'people', alertCount: flaggedUsersCount },
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

                {tab.alertCount !== undefined && tab.alertCount > 0 ? (
                  <View style={[styles.tabCountBadge, { backgroundColor: '#EAB308' }]}>
                    <Text style={[styles.tabCountBadgeText, { color: '#000' }]}>⚠️ {tab.alertCount}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── TAB 1: ERROR RADAR & AI DIAGNOSTICS ──                   */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'errors' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Real-Time User Crash & Error Telemetry</Text>
                <Text style={styles.sectionSubtitle}>
                  Autonomous error stream from mobile & web clients with instant AI root-cause diagnostics.
                </Text>
              </View>
              {errorsList.some((e) => e.resolved) && (
                <TouchableOpacity style={styles.clearBtn} onPress={handleClearResolved}>
                  <Ionicons name="trash-bin-outline" size={14} color="#8A95A5" />
                  <Text style={styles.clearBtnText}>Wipe Resolved</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Error Filters & Search Bar */}
            <View style={styles.filterBarRow}>
              <View style={styles.searchBoxWrap}>
                <Ionicons name="search" size={16} color="#8A95A5" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search error message, component, or user..."
                  placeholderTextColor="#667085"
                  value={errorSearchQuery}
                  onChangeText={setErrorSearchQuery}
                />
                {errorSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setErrorSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color="#8A95A5" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.pillGroup}>
                {[
                  { key: 'unresolved', label: `Unresolved (${unresolvedErrorsCount})` },
                  { key: 'all', label: `All (${errorsList.length})` },
                  { key: 'critical', label: 'Critical' },
                  { key: 'warning', label: 'Warning' },
                ].map((pill) => (
                  <TouchableOpacity
                    key={pill.key}
                    style={[
                      styles.filterPill,
                      errorFilterSeverity === pill.key && styles.filterPillActive,
                    ]}
                    onPress={() => setErrorFilterSeverity(pill.key as any)}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        errorFilterSeverity === pill.key && styles.filterPillTextActive,
                      ]}
                    >
                      {pill.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {filteredErrors.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Ionicons name="shield-checkmark" size={48} color="#00E676" />
                <Text style={styles.emptyStateTitle}>Zero Active Crashes</Text>
                <Text style={styles.emptyStateSub}>
                  No active exceptions recorded. Your mobile and web client sessions are running smoothly.
                </Text>
              </View>
            ) : (
              filteredErrors.map((err) => {
                const diagnosis = diagnoseSystemIssue(err.error_message, err.component);
                return (
                  <View key={err.id} style={[styles.errorCard, err.resolved && styles.errorCardResolved]}>
                    <View style={styles.errorCardTop}>
                      <View style={styles.errorBadgesRow}>
                        <View
                          style={[
                            styles.severityPill,
                            {
                              backgroundColor:
                                err.severity === 'critical'
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : 'rgba(234, 179, 8, 0.15)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.severityPillText,
                              { color: err.severity === 'critical' ? '#EF4444' : '#EAB308' },
                            ]}
                          >
                            {(err.severity || 'warning').toUpperCase()}
                          </Text>
                        </View>

                        <View style={styles.platformBadge}>
                          <Text style={styles.platformBadgeText}>{err.platform || 'Client'}</Text>
                        </View>

                        <View style={styles.componentBadge}>
                          <Text style={styles.componentBadgeText}>{err.component || 'AppGlobal'}</Text>
                        </View>
                      </View>

                      <Text style={styles.errorTime}>
                        {err.created_at ? new Date(err.created_at).toLocaleString() : 'Just now'}
                      </Text>
                    </View>

                    <Text style={styles.errorMessageText}>{err.error_message}</Text>

                    {/* User Metadata */}
                    <View style={styles.errorUserRow}>
                      <Ionicons name="person-outline" size={13} color="#8A95A5" />
                      <Text style={styles.errorUserText}>
                        User: <Text style={{ color: '#FFF' }}>{err.user_email || err.user_uid || 'Anonymous'}</Text>
                      </Text>
                    </View>

                    {/* ── AI PROACTIVE DIAGNOSIS BOX ── */}
                    <View style={styles.aiDiagnosisBox}>
                      <View style={styles.aiDiagnosisHeader}>
                        <Ionicons name="sparkles" size={15} color={Colors.primary} />
                        <Text style={styles.aiDiagnosisTitle}>AI Autonomous Diagnosis & Solution</Text>
                      </View>

                      <Text style={styles.aiIssueTitle}>{diagnosis.issueTitle}</Text>
                      <Text style={styles.aiRootCauseText}>💡 {diagnosis.rootCause}</Text>
                      <Text style={styles.aiSolutionText}>🛠️ {diagnosis.actionableSolution}</Text>

                      {diagnosis.actionCodeSnippet ? (
                        <View style={styles.codeSnippetBox}>
                          <Text style={styles.codeSnippetText}>{diagnosis.actionCodeSnippet}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.errorActionsRow}>
                      <TouchableOpacity
                        style={[styles.resolveBtn, err.resolved && styles.resolveBtnActive]}
                        onPress={() => err.id && handleResolveError(err.id)}
                      >
                        <Ionicons
                          name={err.resolved ? 'checkmark-circle' : 'checkmark-circle-outline'}
                          size={15}
                          color={err.resolved ? '#00E676' : '#8A95A5'}
                        />
                        <Text style={[styles.resolveBtnText, err.resolved && { color: '#00E676' }]}>
                          {err.resolved ? 'Resolved' : 'Mark Resolved'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteErrorBtn}
                        onPress={() => err.id && handleDeleteError(err.id)}
                      >
                        <Ionicons name="trash-outline" size={15} color="#EF4444" />
                        <Text style={styles.deleteErrorBtnText}>Delete Log</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── TAB 2: REGISTERED USERS & BOT DETECTOR ──                */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Registered Users & Bot Detector</Text>
                <Text style={styles.sectionSubtitle}>
                  Monitor member activity, evaluate authenticity (Real vs Bot), and identify users who hit app errors.
                </Text>
              </View>
            </View>

            {/* Quick Metrics Bar */}
            <View style={styles.userSummaryBar}>
              <View style={styles.userSummaryItem}>
                <Text style={styles.userSummaryNum}>{usersList.length}</Text>
                <Text style={styles.userSummaryLabel}>Total Registered</Text>
              </View>
              <View style={styles.userSummaryDivider} />
              <View style={styles.userSummaryItem}>
                <Text style={[styles.userSummaryNum, { color: '#00E676' }]}>{verifiedHumansCount}</Text>
                <Text style={styles.userSummaryLabel}>Verified Humans</Text>
              </View>
              <View style={styles.userSummaryDivider} />
              <View style={styles.userSummaryItem}>
                <Text style={[styles.userSummaryNum, { color: '#EF4444' }]}>{flaggedUsersCount}</Text>
                <Text style={styles.userSummaryLabel}>Users With Crashes</Text>
              </View>
              <View style={styles.userSummaryDivider} />
              <View style={styles.userSummaryItem}>
                <Text style={[styles.userSummaryNum, { color: '#8A95A5' }]}>{suspectedBotsCount}</Text>
                <Text style={styles.userSummaryLabel}>Suspected Bots</Text>
              </View>
            </View>

            {/* User Search & Filter */}
            <View style={styles.filterBarRow}>
              <View style={styles.searchBoxWrap}>
                <Ionicons name="search" size={16} color="#8A95A5" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search user by name, email, UID, or city..."
                  placeholderTextColor="#667085"
                  value={userSearchQuery}
                  onChangeText={setUserSearchQuery}
                />
                {userSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setUserSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color="#8A95A5" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.pillGroup}>
                {[
                  { key: 'all', label: `All (${usersList.length})` },
                  { key: 'user', label: 'Trainees' },
                  { key: 'coach', label: 'Coaches' },
                  { key: 'flagged', label: `⚠️ Hit Errors (${flaggedUsersCount})` },
                  { key: 'bots', label: `🤖 Suspected Bots (${suspectedBotsCount})` },
                ].map((pill) => (
                  <TouchableOpacity
                    key={pill.key}
                    style={[
                      styles.filterPill,
                      userRoleFilter === pill.key && styles.filterPillActive,
                    ]}
                    onPress={() => setUserRoleFilter(pill.key as any)}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        userRoleFilter === pill.key && styles.filterPillTextActive,
                      ]}
                    >
                      {pill.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {filteredUsers.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Ionicons name="people-outline" size={48} color="#8A95A5" />
                <Text style={styles.emptyStateTitle}>No Users Found</Text>
                <Text style={styles.emptyStateSub}>No users match the active search or filter criteria.</Text>
              </View>
            ) : (
              filteredUsers.map((user) => {
                const isHuman = user.trustBadge === 'Verified Human';
                const isBot = user.trustBadge === 'Suspected Bot';

                return (
                  <View key={user.uid} style={styles.userCard}>
                    <View style={styles.userCardMain}>
                      {/* Avatar */}
                      <View style={styles.avatarWrap}>
                        {user.avatar_url ? (
                          <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
                        ) : (
                          <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarInitials}>
                              {user.name.slice(0, 2).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        {user.role === 'coach' && (
                          <View style={styles.coachBadgeDot}>
                            <Ionicons name="ribbon" size={10} color="#000" />
                          </View>
                        )}
                      </View>

                      {/* User Info */}
                      <View style={styles.userInfoWrap}>
                        <View style={styles.userNameRow}>
                          <Text style={styles.userNameText}>{user.name}</Text>
                          <View style={styles.roleTag}>
                            <Text style={styles.roleTagText}>{user.role.toUpperCase()}</Text>
                          </View>
                          {user.isPro && (
                            <View style={styles.proTag}>
                              <Text style={styles.proTagText}>PRO</Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.userEmailText}>
                          {user.email || 'No email registered'} {user.city ? `• ${user.city}` : ''}
                        </Text>

                        {/* Badges Row */}
                        <View style={styles.userBadgesRow}>
                          {/* Trust Badge */}
                          <View
                            style={[
                              styles.trustBadge,
                              {
                                backgroundColor: isHuman
                                  ? 'rgba(0, 230, 118, 0.12)'
                                  : isBot
                                  ? 'rgba(239, 68, 68, 0.12)'
                                  : 'rgba(234, 179, 8, 0.12)',
                              },
                            ]}
                          >
                            <Ionicons
                              name={isHuman ? 'shield-checkmark' : isBot ? 'hardware-chip' : 'help-circle'}
                              size={12}
                              color={isHuman ? '#00E676' : isBot ? '#EF4444' : '#EAB308'}
                            />
                            <Text
                              style={[
                                styles.trustBadgeText,
                                { color: isHuman ? '#00E676' : isBot ? '#EF4444' : '#EAB308' },
                              ]}
                            >
                              {user.trustBadge} ({user.trustScore}%)
                            </Text>
                          </View>

                          {/* Coins */}
                          <View style={styles.coinsBadge}>
                            <Ionicons name="cash" size={12} color="#EAB308" />
                            <Text style={styles.coinsBadgeText}>{user.coins} Coins</Text>
                          </View>

                          {/* Error Flag Alert */}
                          {user.errorCount > 0 && (
                            <View style={styles.errorFlagBadge}>
                              <Ionicons name="warning" size={12} color="#EF4444" />
                              <Text style={styles.errorFlagBadgeText}>
                                ⚠️ {user.errorCount} Crashes
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Inspect Button */}
                    <TouchableOpacity
                      style={styles.inspectUserBtn}
                      onPress={() => setSelectedUserForModal(user)}
                    >
                      <Ionicons name="information-circle-outline" size={15} color={Colors.primary} />
                      <Text style={styles.inspectUserBtnText}>Inspect & Support</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── TAB 3: REAL PAYMENT RADAR & CHAPA RECONCILIATION ──     */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'finance' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Chapa & Coin Financial Ledger</Text>
                <Text style={styles.sectionSubtitle}>
                  Real-time transaction stream directly from Supabase coin_transactions with 1-click verification.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.verifyModalTriggerBtn}
                onPress={() => setVerifyModalVisible(true)}
              >
                <Ionicons name="checkmark-done" size={14} color="#000" />
                <Text style={styles.verifyModalTriggerBtnText}>Verify Tx with Chapa</Text>
              </TouchableOpacity>
            </View>

            {/* Financial KPI Banner */}
            <View style={styles.financialKpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>TOTAL REVENUE</Text>
                <Text style={[styles.kpiValue, { color: '#00E676' }]}>
                  {financialKPIs.totalRevenueEtb} ETB
                </Text>
                <Text style={styles.kpiSub}>Completed fiat payments</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>COINS SOLD</Text>
                <Text style={[styles.kpiValue, { color: '#EAB308' }]}>
                  {financialKPIs.totalCoinsPurchased} 🪙
                </Text>
                <Text style={styles.kpiSub}>Credits circulating</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>PENDING VOLUME</Text>
                <Text style={[styles.kpiValue, { color: financialKPIs.pendingAmountEtb > 0 ? '#EF4444' : '#FFF' }]}>
                  {financialKPIs.pendingAmountEtb} ETB
                </Text>
                <Text style={styles.kpiSub}>{financialKPIs.pendingTransactionsCount} pending bank checkouts</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>CHAPA SUCCESS RATE</Text>
                <Text style={styles.kpiValue}>{financialKPIs.successRatePercent}%</Text>
                <Text style={styles.kpiSub}>{financialKPIs.completedTransactionsCount} successful checkouts</Text>
              </View>
            </View>

            {/* Filters & Search */}
            <View style={styles.filterBarRow}>
              <View style={styles.searchBoxWrap}>
                <Ionicons name="search" size={16} color="#8A95A5" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search transaction ref, user name, or email..."
                  placeholderTextColor="#667085"
                  value={txSearchQuery}
                  onChangeText={setTxSearchQuery}
                />
                {txSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setTxSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color="#8A95A5" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.pillGroup}>
                {[
                  { key: 'all', label: `All (${transactionsList.length})` },
                  { key: 'completed', label: 'Completed' },
                  { key: 'pending', label: 'Pending' },
                  { key: 'failed', label: 'Failed' },
                ].map((pill) => (
                  <TouchableOpacity
                    key={pill.key}
                    style={[
                      styles.filterPill,
                      txStatusFilter === pill.key && styles.filterPillActive,
                    ]}
                    onPress={() => setTxStatusFilter(pill.key as any)}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        txStatusFilter === pill.key && styles.filterPillTextActive,
                      ]}
                    >
                      {pill.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {filteredTransactions.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Ionicons name="card-outline" size={48} color="#8A95A5" />
                <Text style={styles.emptyStateTitle}>No Transactions Recorded</Text>
                <Text style={styles.emptyStateSub}>
                  No payment entries match the criteria. New Chapa checkouts will appear here instantly.
                </Text>
              </View>
            ) : (
              filteredTransactions.map((tx) => (
                <View key={tx.id} style={styles.txCard}>
                  <View style={styles.txCardLeft}>
                    <View style={styles.txIconWrap}>
                      <Ionicons
                        name={tx.status === 'completed' ? 'checkmark' : tx.status === 'pending' ? 'time' : 'close'}
                        size={18}
                        color={tx.status === 'completed' ? '#00E676' : tx.status === 'pending' ? '#EAB308' : '#EF4444'}
                      />
                    </View>
                    <View style={styles.txInfoWrap}>
                      <Text style={styles.txTitleText}>{tx.description || 'Coin Bundle Purchase'}</Text>
                      <Text style={styles.txUserSubText}>
                        {tx.userName} {tx.userEmail ? `(${tx.userEmail})` : ''} • Gateway: {tx.payment_gateway?.toUpperCase()}
                      </Text>
                      <Text style={styles.txTimeText}>
                        {tx.created_at ? new Date(tx.created_at).toLocaleString() : ''}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.txCardRight}>
                    <Text style={styles.txAmountText}>
                      +{tx.amount_etb} ETB
                    </Text>
                    <Text style={styles.txCoinsSubText}>+{tx.amount_coins} Coins</Text>
                    <View
                      style={[
                        styles.txStatusPill,
                        {
                          backgroundColor:
                            tx.status === 'completed'
                              ? 'rgba(0, 230, 118, 0.15)'
                              : tx.status === 'pending'
                              ? 'rgba(234, 179, 8, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.txStatusPillText,
                          {
                            color:
                              tx.status === 'completed'
                                ? '#00E676'
                                : tx.status === 'pending'
                                ? '#EAB308'
                                : '#EF4444',
                          },
                        ]}
                      >
                        {tx.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── TAB 4: INFRASTRUCTURE & DEEP BOTTLENECK ANALYSIS ──     */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'health' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Cloud Services & Deep Infrastructure Heartbeat</Text>
                <Text style={styles.sectionSubtitle}>
                  Real-time latency metrics and automated root-cause bottleneck diagnostics.
                </Text>
              </View>
            </View>

            {/* ── AUTOMATED BOTTLENECK DIAGNOSTICS ALERT (IN AMHARIC) ── */}
            {infrastructureBottlenecks.length > 0 ? (
              <View style={styles.bottleneckAlertCard}>
                <View style={styles.bottleneckAlertHeader}>
                  <Ionicons name="warning" size={20} color="#EAB308" />
                  <Text style={styles.bottleneckAlertTitle}>
                    የሲስተም መዘግየት ትንተና (System Bottleneck Analysis)
                  </Text>
                </View>

                {infrastructureBottlenecks.map((b, idx) => (
                  <View key={idx} style={styles.bottleneckItemBox}>
                    <Text style={styles.bottleneckItemTitle}>🚨 {b.amharicTitle} ({b.latencyMs} ms)</Text>
                    <Text style={styles.bottleneckExplanation}>💡 <Text style={{ fontWeight: '700' }}>ምክንያት፦</Text> {b.amharicExplanation}</Text>
                    <Text style={styles.bottleneckImpact}>⚠️ <Text style={{ fontWeight: '700' }}>ተፅዕኖ፦</Text> {b.impactOnUsers}</Text>
                    <Text style={styles.bottleneckAction}>🛠️ <Text style={{ fontWeight: '700' }}>የሚመከር እርምጃ፦</Text> {b.recommendedAction}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.optimalHealthCard}>
                <Ionicons name="shield-checkmark" size={22} color="#00E676" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.optimalHealthTitle}>ሁሉም ሰርቨሮች በከፍተኛ ፍጥነት በመስራት ላይ ናቸው</Text>
                  <Text style={styles.optimalHealthSub}>
                    የ Supabase ዳታቤዝ፣ የ Firebase መለያ፣ የ Chapa ክፍያ እና የ Agora ድምጽ ሞተር በሙሉ በጥሩ ጤንነት ላይ ናቸው።
                  </Text>
                </View>
              </View>
            )}

            {/* Live Service Cards */}
            <View style={styles.serviceCardsGrid}>
              {healthList.map((service, idx) => {
                const isHealthy = service.status === 'healthy';
                const isDegraded = service.status === 'degraded';
                const statusColor = isHealthy ? '#00E676' : isDegraded ? '#EAB308' : '#EF4444';

                return (
                  <View key={idx} style={styles.serviceCard}>
                    <View style={styles.serviceCardHeader}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    </View>

                    <View style={styles.latencyRow}>
                      <Ionicons name="speedometer-outline" size={16} color={statusColor} />
                      <Text style={[styles.latencyText, { color: statusColor }]}>
                        {service.latencyMs} ms
                      </Text>
                      <Text style={styles.statusLabelText}>• {service.status.toUpperCase()}</Text>
                    </View>

                    <Text style={styles.serviceMessage}>{service.message}</Text>
                    {service.details && (
                      <Text style={styles.serviceDetails}>{service.details}</Text>
                    )}
                    <Text style={styles.serviceCheckedTime}>
                      Last checked: {service.lastChecked}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── TAB 5: REMOTE SWITCHES & SYSTEM KILLSWITCHES ──          */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'controls' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Emergency Remote Switches</Text>
                <Text style={styles.sectionSubtitle}>
                  Instantly toggle features across all user devices in real-time.
                </Text>
              </View>
            </View>

            <View style={styles.switchGroup}>
              {/* Switch 1: AI Voice Coach */}
              <View style={styles.switchCard}>
                <View style={styles.switchInfo}>
                  <View style={styles.switchTitleRow}>
                    <Ionicons name="mic" size={18} color={Colors.primary} />
                    <Text style={styles.switchTitle}>Voice Coach AI Engine</Text>
                  </View>
                  <Text style={styles.switchSub}>
                    Toggle real-time Gemini/OpenAI voice feedback in user workouts. Turn off in case of upstream API quota issues.
                  </Text>
                </View>
                <Switch
                  value={remoteConfig.voice_coach_enabled}
                  onValueChange={(val) => handleToggleConfig('voice_coach_enabled', val)}
                  trackColor={{ false: '#2C3440', true: Colors.primary }}
                  thumbColor="#FFF"
                  disabled={updatingConfig}
                />
              </View>

              {/* Switch 2: Emergency Maintenance Mode */}
              <View style={styles.switchCard}>
                <View style={styles.switchInfo}>
                  <View style={styles.switchTitleRow}>
                    <Ionicons name="construct" size={18} color="#EF4444" />
                    <Text style={styles.switchTitle}>Emergency Maintenance Mode</Text>
                  </View>
                  <Text style={styles.switchSub}>
                    Block incoming trainee requests and display a graceful maintenance screen across the app.
                  </Text>
                </View>
                <Switch
                  value={remoteConfig.maintenance_mode}
                  onValueChange={(val) => handleToggleConfig('maintenance_mode', val)}
                  trackColor={{ false: '#2C3440', true: '#EF4444' }}
                  thumbColor="#FFF"
                  disabled={updatingConfig}
                />
              </View>

              {/* Switch 3: Chapa Payments */}
              <View style={styles.switchCard}>
                <View style={styles.switchInfo}>
                  <View style={styles.switchTitleRow}>
                    <Ionicons name="card" size={18} color="#EAB308" />
                    <Text style={styles.switchTitle}>Chapa Checkout Flow</Text>
                  </View>
                  <Text style={styles.switchSub}>
                    Permit coin bundle purchases and bank transfers. Freeze in case of bank network downtime.
                  </Text>
                </View>
                <Switch
                  value={remoteConfig.chapa_payments_enabled}
                  onValueChange={(val) => handleToggleConfig('chapa_payments_enabled', val)}
                  trackColor={{ false: '#2C3440', true: '#EAB308' }}
                  thumbColor="#FFF"
                  disabled={updatingConfig}
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 1: USER INSPECTION & COMPENSATION COIN TOOL ──     */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={!!selectedUserForModal}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedUserForModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedUserForModal && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="person-circle-outline" size={24} color={Colors.primary} />
                    <Text style={styles.modalTitle}>Member Intelligence & Support</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedUserForModal(null)}>
                    <Ionicons name="close" size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
                  {/* User Profile Bar */}
                  <View style={styles.modalUserBar}>
                    <Text style={styles.modalUserName}>{selectedUserForModal.name}</Text>
                    <Text style={styles.modalUserEmail}>{selectedUserForModal.email || 'No email'}</Text>
                    <Text style={styles.modalUserUid}>UID: {selectedUserForModal.uid}</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <View style={styles.roleTag}>
                        <Text style={styles.roleTagText}>{selectedUserForModal.role.toUpperCase()}</Text>
                      </View>
                      <View style={styles.coinsBadge}>
                        <Ionicons name="cash" size={12} color="#EAB308" />
                        <Text style={styles.coinsBadgeText}>{selectedUserForModal.coins} Coins</Text>
                      </View>
                    </View>
                  </View>

                  {/* Authenticity Breakdown */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>🤖 Authenticity & Bot Evaluation</Text>
                    <View style={styles.authenticityBox}>
                      <Text style={styles.authenticityScoreText}>
                        Trust Score: {selectedUserForModal.trustScore}% ({selectedUserForModal.trustBadge})
                      </Text>
                      {selectedUserForModal.trustReasons.map((r, i) => (
                        <Text key={i} style={styles.authenticityReasonText}>• {r}</Text>
                      ))}
                    </View>
                  </View>

                  {/* Crash History For This User */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>⚠️ Encountered Errors & Crashes</Text>
                    {selectedUserForModal.errorCount > 0 ? (
                      <View style={styles.modalCrashAlert}>
                        <Text style={styles.modalCrashCountText}>
                          This user has encountered {selectedUserForModal.errorCount} system crash(es).
                        </Text>
                        {selectedUserForModal.latestErrorMessage ? (
                          <Text style={styles.modalCrashMsgText}>
                            Latest Error: {selectedUserForModal.latestErrorMessage}
                          </Text>
                        ) : null}
                      </View>
                    ) : (
                      <Text style={{ color: '#00E676', fontSize: 13 }}>
                        ✅ Zero recorded crashes. User has had a clean experience.
                      </Text>
                    )}
                  </View>

                  {/* CEO Goodwill Compensation Tool */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>🎁 CEO Goodwill Coin Grant</Text>
                    <Text style={styles.modalCompensationSub}>
                      If this user suffered an app error, grant compensatory FitPulse coins directly to their wallet:
                    </Text>

                    <View style={styles.coinGrantBtnRow}>
                      <TouchableOpacity
                        style={styles.grantCoinBtn}
                        onPress={() => handleGrantCompensationCoins(selectedUserForModal.uid, 25)}
                        disabled={grantingCoins}
                      >
                        <Text style={styles.grantCoinBtnText}>+25 Coins</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.grantCoinBtn, { backgroundColor: '#EAB308' }]}
                        onPress={() => handleGrantCompensationCoins(selectedUserForModal.uid, 50)}
                        disabled={grantingCoins}
                      >
                        <Text style={[styles.grantCoinBtnText, { color: '#000' }]}>+50 Coins</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.grantCoinBtn, { backgroundColor: Colors.primary }]}
                        onPress={() => handleGrantCompensationCoins(selectedUserForModal.uid, 100)}
                        disabled={grantingCoins}
                      >
                        <Text style={[styles.grantCoinBtnText, { color: '#000' }]}>+100 Coins</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 2: 1-CLICK CHAPA MANUAL TX VERIFIER ──             */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={verifyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVerifyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="card" size={22} color="#EAB308" />
                <Text style={styles.modalTitle}>Chapa Payment Verifier</Text>
              </View>
              <TouchableOpacity onPress={() => setVerifyModalVisible(false)}>
                <Ionicons name="close" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.verifyModalSub}>
              Enter a Chapa transaction reference (e.g., fp-chapa-1729...) to query Chapa directly, verify bank confirmation, and automatically credit the user's wallet.
            </Text>

            <TextInput
              style={styles.verifyModalInput}
              placeholder="e.g. fp-chapa-172986283742"
              placeholderTextColor="#667085"
              value={manualTxRefInput}
              onChangeText={setManualTxRefInput}
            />

            <TouchableOpacity
              style={styles.verifySubmitBtn}
              onPress={handleVerifyManualTx}
              disabled={verifyingTx}
            >
              {verifyingTx ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={17} color="#000" />
                  <Text style={styles.verifySubmitBtnText}>Verify & Credit Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#050B0E',
  },
  centerLoading: {
    flex: 1,
    backgroundColor: '#050B0E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8A95A5',
    marginTop: 14,
    fontSize: 14,
  },

  // Executive Top Header
  executiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#091116',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitles: {
    gap: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  ceoBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  ceoBadgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#8A95A5',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },

  scrollBody: {
    padding: 20,
    paddingBottom: 60,
  },

  // Status Banner
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusLastSync: {
    fontSize: 12,
    color: '#8A95A5',
  },

  // 4 Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 22,
  },
  metricCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#0C161C',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  metricCardAlert: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A95A5',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  metricSub: {
    fontSize: 11,
    color: '#8A95A5',
  },

  // Navigation Tabs
  navTabsWrap: {
    flexDirection: 'row',
    backgroundColor: '#0C161C',
    borderRadius: 12,
    padding: 4,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    overflow: 'hidden',
  },
  navTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  navTabBtnActive: {
    backgroundColor: Colors.primary,
  },
  navTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A95A5',
  },
  navTabTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  tabCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabCountBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // Tab Content Container
  tabContent: {
    gap: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#8A95A5',
    marginTop: 2,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  clearBtnText: {
    color: '#8A95A5',
    fontSize: 12,
  },

  // Filter Bar
  filterBarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
    marginBottom: 6,
  },
  searchBoxWrap: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C161C',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
    padding: 0,
  },
  pillGroup: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderColor: Colors.primary,
  },
  filterPillText: {
    color: '#8A95A5',
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },

  // Empty State
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#0C161C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 6,
  },
  emptyStateSub: {
    fontSize: 12,
    color: '#8A95A5',
    textAlign: 'center',
    maxWidth: 380,
  },

  // Error Card
  errorCard: {
    backgroundColor: '#0C161C',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  errorCardResolved: {
    opacity: 0.6,
  },
  errorCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  severityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  severityPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  platformBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  platformBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  componentBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  componentBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  errorTime: {
    fontSize: 11,
    color: '#667085',
  },
  errorMessageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    lineHeight: 20,
  },
  errorUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorUserText: {
    fontSize: 12,
    color: '#8A95A5',
  },

  // AI Proactive Diagnosis Box
  aiDiagnosisBox: {
    backgroundColor: '#111E26',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
    gap: 6,
  },
  aiDiagnosisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiDiagnosisTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  aiIssueTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  aiRootCauseText: {
    fontSize: 12,
    color: '#D1D5DB',
    lineHeight: 18,
  },
  aiSolutionText: {
    fontSize: 12,
    color: '#A7F3D0',
    lineHeight: 18,
  },
  codeSnippetBox: {
    backgroundColor: '#050B0E',
    borderRadius: 6,
    padding: 10,
    marginTop: 6,
  },
  codeSnippetText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#F9FAFB',
    lineHeight: 16,
  },
  errorActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  resolveBtnActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  resolveBtnText: {
    fontSize: 12,
    color: '#8A95A5',
    fontWeight: '600',
  },
  deleteErrorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  deleteErrorBtnText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },

  // ── Users Tab Styles ──
  userSummaryBar: {
    flexDirection: 'row',
    backgroundColor: '#0C161C',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  userSummaryItem: {
    alignItems: 'center',
  },
  userSummaryNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  userSummaryLabel: {
    fontSize: 11,
    color: '#8A95A5',
    marginTop: 2,
  },
  userSummaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  userCard: {
    backgroundColor: '#0C161C',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  userCardMain: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flex: 1,
    minWidth: 260,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  coachBadgeDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoWrap: {
    flex: 1,
    gap: 3,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  roleTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8A95A5',
  },
  proTag: {
    backgroundColor: '#EAB308',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
  },
  userEmailText: {
    fontSize: 12,
    color: '#8A95A5',
  },
  userBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trustBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  coinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coinsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EAB308',
  },
  errorFlagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  errorFlagBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
  },
  inspectUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  inspectUserBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Payment Radar Styles ──
  financialKpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 6,
  },
  kpiCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#0C161C',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A95A5',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: '#8A95A5',
  },
  verifyModalTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAB308',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  verifyModalTriggerBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  txCard: {
    backgroundColor: '#0C161C',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  txCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  txIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfoWrap: {
    flex: 1,
    gap: 2,
  },
  txTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  txUserSubText: {
    fontSize: 12,
    color: '#8A95A5',
  },
  txTimeText: {
    fontSize: 11,
    color: '#667085',
  },
  txCardRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  txAmountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#00E676',
  },
  txCoinsSubText: {
    fontSize: 11,
    color: '#EAB308',
    fontWeight: '600',
  },
  txStatusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  txStatusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // ── Infrastructure & Bottleneck Styles ──
  bottleneckAlertCard: {
    backgroundColor: '#16190D',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAB308',
    gap: 12,
  },
  bottleneckAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottleneckAlertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EAB308',
  },
  bottleneckItemBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  bottleneckItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  bottleneckExplanation: {
    fontSize: 12,
    color: '#E5E7EB',
    lineHeight: 18,
  },
  bottleneckImpact: {
    fontSize: 12,
    color: '#FCD34D',
    lineHeight: 18,
  },
  bottleneckAction: {
    fontSize: 12,
    color: '#A7F3D0',
    lineHeight: 18,
  },
  optimalHealthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  optimalHealthTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  optimalHealthSub: {
    fontSize: 12,
    color: '#A7F3D0',
    marginTop: 2,
  },
  serviceCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  serviceCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#0C161C',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    gap: 6,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  latencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  latencyText: {
    fontSize: 14,
    fontWeight: '800',
  },
  statusLabelText: {
    fontSize: 12,
    color: '#8A95A5',
    fontWeight: '600',
  },
  serviceMessage: {
    fontSize: 12,
    color: '#8A95A5',
  },
  serviceDetails: {
    fontSize: 11,
    color: '#667085',
  },
  serviceCheckedTime: {
    fontSize: 10,
    color: '#475569',
    marginTop: 4,
  },

  // ── Remote Controls Styles ──
  switchGroup: {
    gap: 14,
  },
  switchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0C161C',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    gap: 16,
  },
  switchInfo: {
    flex: 1,
    gap: 4,
  },
  switchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  switchSub: {
    fontSize: 12,
    color: '#8A95A5',
    lineHeight: 18,
  },

  // ── Modals Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 550,
    backgroundColor: '#091116',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    marginLeft: 8,
  },
  modalUserBar: {
    backgroundColor: '#0C161C',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 2,
    marginBottom: 14,
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  modalUserEmail: {
    fontSize: 13,
    color: '#8A95A5',
  },
  modalUserUid: {
    fontSize: 11,
    color: '#667085',
  },
  modalSection: {
    gap: 8,
    marginBottom: 14,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  authenticityBox: {
    backgroundColor: '#0C161C',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  authenticityScoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  authenticityReasonText: {
    fontSize: 12,
    color: '#8A95A5',
  },
  modalCrashAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    gap: 4,
  },
  modalCrashCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  modalCrashMsgText: {
    fontSize: 12,
    color: '#FCA5A5',
    lineHeight: 16,
  },
  modalCompensationSub: {
    fontSize: 12,
    color: '#8A95A5',
  },
  coinGrantBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  grantCoinBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grantCoinBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },

  // Modal 2 Verifier
  verifyModalSub: {
    fontSize: 13,
    color: '#8A95A5',
    lineHeight: 18,
  },
  verifyModalInput: {
    backgroundColor: '#0C161C',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#FFF',
    fontSize: 14,
  },
  verifySubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00E676',
    borderRadius: 8,
    paddingVertical: 12,
  },
  verifySubmitBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
});
