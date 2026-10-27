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
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'user' | 'coach' | 'flagged' | 'bots' | 'paying'>('all');
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
        fetchRealPaymentLedger(60),
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

  const handleResolveGroup = async (ids: string[]) => {
    await Promise.all(ids.map((id) => resolveError(id)));
    setErrorsList((prev) => prev.map((e) => (e.id && ids.includes(e.id) ? { ...e, resolved: true } : e)));
  };

  const handleDeleteError = async (id: string) => {
    await deleteErrorRecord(id);
    setErrorsList((prev) => prev.filter((e) => e.id !== id));
  };

  const handleDeleteGroup = async (ids: string[]) => {
    await Promise.all(ids.map((id) => deleteErrorRecord(id)));
    setErrorsList((prev) => prev.filter((e) => e.id && !ids.includes(e.id)));
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
  const payingUsersCount = useMemo(() => usersList.filter((u) => u.lifetimeSpentEtb > 0).length, [usersList]);

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

  // Grouped and Deduplicated Errors (prevents 9x repetition spam in Error Radar)
  const groupedFilteredErrors = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        primaryError: SystemErrorItem;
        count: number;
        allIds: string[];
        latestTime: string;
        earliestTime: string;
        allResolved: boolean;
      }
    >();

    filteredErrors.forEach((err) => {
      const groupKey = `${(err.error_message || '').trim()}_${err.component || ''}_${err.user_email || err.user_uid || ''}`;

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          key: groupKey,
          primaryError: err,
          count: 1,
          allIds: err.id ? [err.id] : [],
          latestTime: err.created_at || '',
          earliestTime: err.created_at || '',
          allResolved: !!err.resolved,
        });
      } else {
        const item = map.get(groupKey)!;
        item.count += 1;
        if (err.id) item.allIds.push(err.id);
        if (!err.resolved) item.allResolved = false;
        if (err.created_at && (!item.latestTime || new Date(err.created_at) > new Date(item.latestTime))) {
          item.latestTime = err.created_at;
        }
      }
    });

    return Array.from(map.values());
  }, [filteredErrors]);

  // Grouped user errors for the selected dossier modal
  const groupedUserErrors = useMemo(() => {
    if (!selectedUserForModal?.userErrors || selectedUserForModal.userErrors.length === 0) return [];
    const map = new Map<
      string,
      {
        errorMessage: string;
        component: string;
        count: number;
        latestTime: string;
        earliestTime: string;
      }
    >();

    selectedUserForModal.userErrors.forEach((err) => {
      const key = `${(err.error_message || '').trim()}_${err.component || ''}`;
      if (!map.has(key)) {
        map.set(key, {
          errorMessage: err.error_message,
          component: err.component || 'AppGlobal',
          count: 1,
          latestTime: err.created_at || '',
          earliestTime: err.created_at || '',
        });
      } else {
        const item = map.get(key)!;
        item.count += 1;
        if (err.created_at && (!item.latestTime || new Date(err.created_at) > new Date(item.latestTime))) {
          item.latestTime = err.created_at;
        }
      }
    });

    return Array.from(map.values());
  }, [selectedUserForModal]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      if (userRoleFilter === 'user' && u.role !== 'user') return false;
      if (userRoleFilter === 'coach' && u.role !== 'coach') return false;
      if (userRoleFilter === 'flagged' && u.errorCount === 0) return false;
      if (userRoleFilter === 'bots' && u.trustBadge !== 'Suspected Bot') return false;
      if (userRoleFilter === 'paying' && u.lifetimeSpentEtb <= 0) return false;

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
              {financialKPIs.completedTransactionsCount} Completed Txs • {payingUsersCount} Paying Users
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

            {groupedFilteredErrors.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Ionicons name="shield-checkmark" size={48} color="#00E676" />
                <Text style={styles.emptyStateTitle}>Zero Active Crashes</Text>
                <Text style={styles.emptyStateSub}>
                  No active exceptions recorded. Your mobile and web client sessions are running smoothly.
                </Text>
              </View>
            ) : (
              groupedFilteredErrors.map((group) => {
                const err = group.primaryError;
                const diagnosis = diagnoseSystemIssue(err.error_message, err.component);
                const isGroupResolved = group.allResolved;

                return (
                  <View key={group.key} style={[styles.errorCard, isGroupResolved && styles.errorCardResolved]}>
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

                        {/* Deduplication & Repetition Badge */}
                        {group.count > 1 && (
                          <View style={styles.repetitionPill}>
                            <Ionicons name="repeat" size={12} color="#EF4444" />
                            <Text style={styles.repetitionPillText}>{group.count}x Repeated</Text>
                          </View>
                        )}

                        <View style={styles.platformBadge}>
                          <Text style={styles.platformBadgeText}>{err.platform || 'Client'}</Text>
                        </View>

                        <View style={styles.componentBadge}>
                          <Text style={styles.componentBadgeText}>{err.component || 'AppGlobal'}</Text>
                        </View>
                      </View>

                      <Text style={styles.errorTime}>
                        Latest: {group.latestTime ? new Date(group.latestTime).toLocaleTimeString() : 'Just now'}
                      </Text>
                    </View>

                    <Text style={styles.errorMessageText}>{err.error_message}</Text>

                    {/* User Metadata */}
                    <View style={styles.errorUserRow}>
                      <Ionicons name="person-outline" size={13} color="#8A95A5" />
                      <Text style={styles.errorUserText}>
                        User: <Text style={{ color: '#FFF' }}>{err.user_email || err.user_uid || 'Anonymous'}</Text>
                        {group.count > 1 ? ` • Encountered ${group.count} times` : ''}
                      </Text>
                    </View>

                    {/* AI Diagnosis Box */}
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
                        style={[styles.resolveBtn, isGroupResolved && styles.resolveBtnActive]}
                        onPress={() => handleResolveGroup(group.allIds)}
                      >
                        <Ionicons
                          name={isGroupResolved ? 'checkmark-circle' : 'checkmark-circle-outline'}
                          size={15}
                          color={isGroupResolved ? '#00E676' : '#8A95A5'}
                        />
                        <Text style={[styles.resolveBtnText, isGroupResolved && { color: '#00E676' }]}>
                          {isGroupResolved ? 'Resolved' : `Resolve All (${group.count})`}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteErrorBtn}
                        onPress={() => handleDeleteGroup(group.allIds)}
                      >
                        <Ionicons name="trash-outline" size={15} color="#EF4444" />
                        <Text style={styles.deleteErrorBtnText}>Delete {group.count > 1 ? `(${group.count})` : 'Log'}</Text>
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
                <Text style={styles.sectionTitle}>Registered Users, Lifetime Purchases & Activity</Text>
                <Text style={styles.sectionSubtitle}>
                  Monitor member activity, lifetime ETB spend, authenticity signals, and click any user to inspect everything they saved.
                </Text>
              </View>
            </View>

            {/* Quick Metrics Bar */}
            <View style={styles.userSummaryBar}>
              <View style={styles.userSummaryItem}>
                <Text style={styles.userSummaryNum}>{usersList.length}</Text>
                <Text style={styles.userSummaryLabel}>Total Users</Text>
              </View>
              <View style={styles.userSummaryDivider} />
              <View style={styles.userSummaryItem}>
                <Text style={[styles.userSummaryNum, { color: '#00E676' }]}>{verifiedHumansCount}</Text>
                <Text style={styles.userSummaryLabel}>Verified Humans</Text>
              </View>
              <View style={styles.userSummaryDivider} />
              <View style={styles.userSummaryItem}>
                <Text style={[styles.userSummaryNum, { color: '#EAB308' }]}>{payingUsersCount}</Text>
                <Text style={styles.userSummaryLabel}>Paying Clients</Text>
              </View>
              <View style={styles.userSummaryDivider} />
              <View style={styles.userSummaryItem}>
                <Text style={[styles.userSummaryNum, { color: '#EF4444' }]}>{flaggedUsersCount}</Text>
                <Text style={styles.userSummaryLabel}>With Crashes</Text>
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
                  { key: 'paying', label: `💳 Paying (${payingUsersCount})` },
                  { key: 'user', label: 'Trainees' },
                  { key: 'coach', label: 'Coaches' },
                  { key: 'flagged', label: `⚠️ Crashes (${flaggedUsersCount})` },
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
                  <TouchableOpacity
                    key={user.uid}
                    style={styles.userCard}
                    onPress={() => setSelectedUserForModal(user)}
                    activeOpacity={0.8}
                  >
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
                          {user.username ? (
                            <Text style={styles.userHandleText}>@{user.username}</Text>
                          ) : null}
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
                          {user.email || 'No email registered'} {user.city ? `• 📍 ${user.city}` : ''}
                        </Text>

                        {/* Lifetime Purchases & Activity Row */}
                        <View style={styles.userSpendRow}>
                          <Text style={styles.userSpendText}>
                            💳 Lifetime: <Text style={{ color: '#00E676', fontWeight: '800' }}>{user.lifetimeSpentEtb} ETB</Text> ({user.lifetimeCoinsBought} Coins)
                          </Text>
                          <Text style={styles.userActivityText}>
                            • 📸 {user.postsCount} Posts • 👥 {user.followersCount} Followers
                          </Text>
                        </View>

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
                              name={isHuman ? 'shield-checkmark' : isBot ? 'hardware-chip' : 'person'}
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
                            <Text style={styles.coinsBadgeText}>{user.coins} Coins in Wallet</Text>
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
                    <View style={styles.inspectBtnWrap}>
                      <View style={styles.inspectUserBtn}>
                        <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                        <Text style={styles.inspectUserBtnText}>Inspect Dossier</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── TAB 3: REAL PAYMENT RADAR & TOP SPENDERS ──            */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'finance' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Chapa & Coin Financial Ledger</Text>
                <Text style={styles.sectionSubtitle}>
                  Real-time transaction stream directly from Supabase coin_transactions with user lifetime totals.
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
                <Text style={styles.kpiSub}>{financialKPIs.pendingTransactionsCount} pending checkouts</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>CHAPA SUCCESS RATE</Text>
                <Text style={styles.kpiValue}>{financialKPIs.successRatePercent}%</Text>
                <Text style={styles.kpiSub}>{financialKPIs.completedTransactionsCount} successful checkouts</Text>
              </View>
            </View>

            {/* ── TOP CUSTOMER / SPENDER RADAR ── */}
            {financialKPIs.topSpenders && financialKPIs.topSpenders.length > 0 && (
              <View style={styles.topSpendersBox}>
                <View style={styles.topSpendersHeader}>
                  <Ionicons name="trophy" size={16} color="#EAB308" />
                  <Text style={styles.topSpendersTitle}>Top Customer Radar (Highest Value Trainees)</Text>
                </View>
                <View style={styles.topSpendersGrid}>
                  {financialKPIs.topSpenders.map((sp, idx) => (
                    <View key={sp.userId} style={styles.topSpenderItem}>
                      <Text style={styles.topSpenderRank}>#{idx + 1}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.topSpenderName}>{sp.userName}</Text>
                        <Text style={styles.topSpenderSub}>{sp.txCount} transactions</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.topSpenderEtb}>{sp.totalSpentEtb} ETB</Text>
                        <Text style={styles.topSpenderCoins}>{sp.totalCoinsBought} 🪙</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

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
                      <Text style={styles.txLifetimeSubText}>
                        User Lifetime Total: <Text style={{ color: '#00E676', fontWeight: '700' }}>{tx.userLifetimeSpentEtb || tx.amount_etb} ETB</Text> ({tx.userLifetimeCoins || tx.amount_coins} Coins)
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

            {/* Bottleneck Alert */}
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
      {/* ── MODAL 1: FULL USER DOSSIER & EVERYTHING THEY STORED ──   */}
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
                    <Ionicons name="person-circle" size={24} color={Colors.primary} />
                    <Text style={styles.modalTitle}>User Dossier & Saved Data</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedUserForModal(null)}>
                    <Ionicons name="close" size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 560 }} showsVerticalScrollIndicator={false}>
                  {/* Top Profile Summary */}
                  <View style={styles.modalUserBar}>
                    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                      {selectedUserForModal.avatar_url ? (
                        <Image source={{ uri: selectedUserForModal.avatar_url }} style={styles.modalAvatarImg} />
                      ) : (
                        <View style={styles.modalAvatarPlaceholder}>
                          <Text style={styles.modalAvatarInitials}>
                            {selectedUserForModal.name.slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalUserName}>{selectedUserForModal.name}</Text>
                        {selectedUserForModal.username && (
                          <Text style={styles.modalUserHandle}>@{selectedUserForModal.username}</Text>
                        )}
                        <Text style={styles.modalUserEmail}>{selectedUserForModal.email || 'No email registered'}</Text>
                        <Text style={styles.modalUserUid}>UID: {selectedUserForModal.uid}</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      <View style={styles.roleTag}>
                        <Text style={styles.roleTagText}>{selectedUserForModal.role.toUpperCase()}</Text>
                      </View>
                      {selectedUserForModal.isPro ? (
                        <View style={styles.proTag}>
                          <Text style={styles.proTagText}>PRO ACTIVE</Text>
                        </View>
                      ) : (
                        <View style={styles.freeTag}>
                          <Text style={styles.freeTagText}>FREE MEMBER</Text>
                        </View>
                      )}
                      <View style={styles.trustBadge}>
                        <Text style={styles.trustBadgeText}>{selectedUserForModal.trustBadge} ({selectedUserForModal.trustScore}%)</Text>
                      </View>
                    </View>
                  </View>

                  {/* ── 1. USER FINANCIAL LEDGER & LIFETIME PURCHASES ── */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>💳 Financial Ledger & Lifetime Purchases</Text>
                    <View style={styles.modalKpiRow}>
                      <View style={styles.modalKpiMini}>
                        <Text style={styles.modalKpiMiniLabel}>LIFETIME SPENT</Text>
                        <Text style={[styles.modalKpiMiniValue, { color: '#00E676' }]}>
                          {selectedUserForModal.lifetimeSpentEtb} ETB
                        </Text>
                      </View>
                      <View style={styles.modalKpiMini}>
                        <Text style={styles.modalKpiMiniLabel}>COINS PURCHASED</Text>
                        <Text style={[styles.modalKpiMiniValue, { color: '#EAB308' }]}>
                          {selectedUserForModal.lifetimeCoinsBought} 🪙
                        </Text>
                      </View>
                      <View style={styles.modalKpiMini}>
                        <Text style={styles.modalKpiMiniLabel}>WALLET BALANCE</Text>
                        <Text style={styles.modalKpiMiniValue}>
                          {selectedUserForModal.coins} Coins
                        </Text>
                      </View>
                    </View>

                    {/* Transaction History for this user */}
                    <Text style={styles.modalSubheading}>Transaction Ledger ({selectedUserForModal.userTransactions.length} records):</Text>
                    {selectedUserForModal.userTransactions.length === 0 ? (
                      <Text style={styles.modalEmptyNotice}>No payments or top-ups made yet.</Text>
                    ) : (
                      selectedUserForModal.userTransactions.map((tx) => (
                        <View key={tx.id} style={styles.userTxItemRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.userTxTitle}>{tx.description}</Text>
                            <Text style={styles.userTxDate}>
                              {new Date(tx.created_at).toLocaleDateString()} • Gateway: {tx.payment_gateway}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.userTxAmount}>+{tx.amount_etb} ETB</Text>
                            <Text style={styles.userTxCoins}>+{tx.amount_coins} Coins</Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>

                  {/* ── 2. EVERYTHING SAVED & STORED IN THE APP ── */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>📂 Stored Profile & Content Attributes</Text>
                    <View style={styles.attributesGrid}>
                      <View style={styles.attributeItem}>
                        <Text style={styles.attributeLabel}>Bio / Motivation:</Text>
                        <Text style={styles.attributeValue}>{selectedUserForModal.bio || 'Not provided'}</Text>
                      </View>

                      <View style={styles.attributeItem}>
                        <Text style={styles.attributeLabel}>Location (City, Country):</Text>
                        <Text style={styles.attributeValue}>
                          {selectedUserForModal.city || 'Not set'} {selectedUserForModal.country ? `, ${selectedUserForModal.country}` : ''}
                        </Text>
                      </View>

                      <View style={styles.attributeItem}>
                        <Text style={styles.attributeLabel}>Joined Date:</Text>
                        <Text style={styles.attributeValue}>
                          {selectedUserForModal.created_at ? new Date(selectedUserForModal.created_at).toLocaleString() : 'N/A'}
                        </Text>
                      </View>

                      <View style={styles.attributeItem}>
                        <Text style={styles.attributeLabel}>Community Content:</Text>
                        <Text style={styles.attributeValue}>
                          📸 {selectedUserForModal.postsCount} Posts • 🎥 {selectedUserForModal.storiesCount} Stories
                        </Text>
                      </View>

                      <View style={styles.attributeItem}>
                        <Text style={styles.attributeLabel}>Network Social:</Text>
                        <Text style={styles.attributeValue}>
                          👥 {selectedUserForModal.followersCount} Followers • {selectedUserForModal.followingCount} Following
                        </Text>
                      </View>

                      <View style={styles.attributeItem}>
                        <Text style={styles.attributeLabel}>Coach Contract Status:</Text>
                        <Text style={styles.attributeValue}>
                          {selectedUserForModal.coachRequestStatus ? `Status: ${selectedUserForModal.coachRequestStatus.toUpperCase()}` : 'No active coach request'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* ── 3. AUTHENTICITY EVALUATION BREAKDOWN ── */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>🤖 Authenticity Signals (Human vs Bot)</Text>
                    <View style={styles.authenticityBox}>
                      <Text style={styles.authenticityScoreText}>
                        Score: {selectedUserForModal.trustScore}% ({selectedUserForModal.trustBadge})
                      </Text>
                      {selectedUserForModal.trustReasons.map((r, i) => (
                        <Text key={i} style={styles.authenticityReasonText}>• {r}</Text>
                      ))}
                    </View>
                  </View>

                  {/* ── 4. CRASH & ERROR HISTORY FOR THIS USER ── */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>
                      ⚠️ Encountered Errors & Crashes ({selectedUserForModal.errorCount})
                    </Text>

                    {groupedUserErrors.length > 0 ? (
                      groupedUserErrors.map((item, i) => {
                        const diagnosis = diagnoseSystemIssue(item.errorMessage, item.component);
                        return (
                          <View key={i} style={styles.userDossierErrorCard}>
                            <View style={styles.userDossierErrorHeader}>
                              <View style={styles.userDossierErrorTitleRow}>
                                <Ionicons name="alert-circle" size={18} color="#EF4444" />
                                <Text style={styles.userDossierErrorTitle}>
                                  {diagnosis.issueTitle}
                                </Text>
                              </View>
                              {item.count > 1 ? (
                                <View style={styles.repetitionPill}>
                                  <Text style={styles.repetitionPillText}>
                                    {item.count}x ተከስቷል
                                  </Text>
                                </View>
                              ) : null}
                            </View>

                            <View style={styles.dossierDiagnosisBox}>
                              <Text style={styles.dossierDiagRoot}>💡 <Text style={{ fontWeight: '700' }}>መንስኤ፦</Text> {diagnosis.rootCause}</Text>
                              <Text style={styles.dossierDiagImpact}>⚠️ <Text style={{ fontWeight: '700' }}>ተፅዕኖ፦</Text> ተጠቃሚው በቻት ውስጥ የድምጽ መልእክት ሲከፍት ድምጹ አይሰማም፤ በ 0:00 ላይ ቆሞ ይቀራል።</Text>
                              <Text style={styles.dossierDiagSolution}>🛠️ <Text style={{ fontWeight: '700' }}>መፍትሄ፦</Text> {diagnosis.actionableSolution}</Text>
                            </View>

                            <View style={styles.dossierErrorMetaRow}>
                              <Text style={styles.dossierErrorMetaText}>
                                Component: <Text style={{ color: '#FFF' }}>{item.component}</Text>
                              </Text>
                              <Text style={styles.dossierErrorMetaText}>
                                {item.count > 1
                                  ? `ድግግሞሽ፦ ${item.count} ጊዜ (${new Date(item.earliestTime).toLocaleTimeString()} - ${new Date(item.latestTime).toLocaleTimeString()})`
                                  : `ሰዓት፦ ${new Date(item.latestTime).toLocaleTimeString()}`}
                              </Text>
                            </View>

                            <View style={styles.dossierRawErrorBox}>
                              <Text style={styles.dossierRawErrorText}>{item.errorMessage}</Text>
                            </View>
                          </View>
                        );
                      })
                    ) : (
                      <Text style={{ color: '#00E676', fontSize: 13 }}>
                        ✅ Zero recorded crashes. User has had an optimal experience.
                      </Text>
                    )}
                  </View>

                  {/* ── 5. CEO GOODWILL COIN GRANT ── */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>🎁 CEO Goodwill Coin Grant</Text>
                    <Text style={styles.modalCompensationSub}>
                      Grant compensatory or loyalty FitPulse coins directly to this user's wallet:
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
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#FFF',
    fontSize: 15,
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
    flexWrap: 'wrap',
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  userHandleText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
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
  freeTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8A95A5',
  },
  userEmailText: {
    fontSize: 12,
    color: '#8A95A5',
  },
  userSpendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  userSpendText: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  userActivityText: {
    fontSize: 11,
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
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  trustBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00E676',
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
  inspectBtnWrap: {
    justifyContent: 'center',
  },
  inspectUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  topSpendersBox: {
    backgroundColor: '#0C161C',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    gap: 10,
    marginBottom: 6,
  },
  topSpendersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topSpendersTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EAB308',
  },
  topSpendersGrid: {
    gap: 8,
  },
  topSpenderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 10,
    borderRadius: 8,
  },
  topSpenderRank: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EAB308',
    width: 24,
  },
  topSpenderName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  topSpenderSub: {
    fontSize: 11,
    color: '#8A95A5',
  },
  topSpenderEtb: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00E676',
  },
  topSpenderCoins: {
    fontSize: 11,
    color: '#EAB308',
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
  txLifetimeSubText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 620,
    backgroundColor: '#091116',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 14,
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
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
    marginBottom: 14,
  },
  modalAvatarImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  modalAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarInitials: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  modalUserName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFF',
  },
  modalUserHandle: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
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
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 6,
  },
  modalKpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalKpiMini: {
    flex: 1,
    backgroundColor: '#0C161C',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  modalKpiMiniLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8A95A5',
  },
  modalKpiMiniValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 2,
  },
  modalSubheading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D1D5DB',
    marginTop: 6,
  },
  modalEmptyNotice: {
    fontSize: 12,
    color: '#667085',
    fontStyle: 'italic',
  },
  userTxItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    marginTop: 4,
  },
  userTxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  userTxDate: {
    fontSize: 11,
    color: '#8A95A5',
  },
  userTxAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00E676',
  },
  userTxCoins: {
    fontSize: 11,
    color: '#EAB308',
  },
  attributesGrid: {
    backgroundColor: '#0C161C',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  attributeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
    paddingBottom: 6,
  },
  attributeLabel: {
    fontSize: 12,
    color: '#8A95A5',
  },
  attributeValue: {
    fontSize: 12,
    fontWeight: '600',
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
  repetitionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  repetitionPillText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  userDossierErrorCard: {
    backgroundColor: '#0C161C',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 10,
    marginTop: 6,
  },
  userDossierErrorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  userDossierErrorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  userDossierErrorTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  dossierDiagnosisBox: {
    backgroundColor: '#111E26',
    borderRadius: 8,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.2)',
  },
  dossierDiagRoot: {
    fontSize: 12,
    color: '#E5E7EB',
    lineHeight: 18,
  },
  dossierDiagImpact: {
    fontSize: 12,
    color: '#FCD34D',
    lineHeight: 18,
  },
  dossierDiagSolution: {
    fontSize: 12,
    color: '#A7F3D0',
    lineHeight: 18,
  },
  dossierErrorMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  dossierErrorMetaText: {
    fontSize: 11,
    color: '#8A95A5',
  },
  dossierRawErrorBox: {
    backgroundColor: '#050B0E',
    borderRadius: 6,
    padding: 8,
  },
  dossierRawErrorText: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  modalCrashAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    gap: 2,
    marginTop: 4,
  },
  modalCrashCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  modalCrashMsgText: {
    fontSize: 12,
    color: '#FCA5A5',
    lineHeight: 16,
  },
  modalCrashDate: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
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
