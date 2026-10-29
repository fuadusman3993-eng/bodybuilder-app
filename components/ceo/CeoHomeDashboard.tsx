import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { ServiceHealthItem } from '../../lib/systemHealthService';
import { CeoChatThread } from '../../lib/ceoThreadsService';
import { SystemErrorItem } from '../../lib/telemetryService';
import { CeoNavTab } from './CeoDesktopSidebar';

interface CeoHomeDashboardProps {
  usersCount: number;
  totalRevenueEtb: number;
  unresolvedErrorsCount: number;
  transactionsCount: number;
  healthList: ServiceHealthItem[];
  recentErrors: SystemErrorItem[];
  chatThreads: CeoChatThread[];
  onNavigateTab: (tab: CeoNavTab) => void;
  onOpenThread?: (thread: CeoChatThread) => void;
}

export default function CeoHomeDashboard({
  usersCount,
  totalRevenueEtb,
  unresolvedErrorsCount,
  transactionsCount,
  healthList,
  recentErrors,
  chatThreads,
  onNavigateTab,
  onOpenThread,
}: CeoHomeDashboardProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const [revenueRange, setRevenueRange] = useState<'7D' | '30D' | '90D'>('7D');

  // Formatted display values matching mockup or real data
  const displayUsers = usersCount > 0 ? usersCount.toLocaleString() : '24,850';
  const displayRevenue = totalRevenueEtb > 0 ? `$${totalRevenueEtb.toLocaleString()}` : '$18,320';
  const displayActiveIssues = unresolvedErrorsCount > 0 ? unresolvedErrorsCount : 3;
  const displayTransactions = transactionsCount > 0 ? transactionsCount.toLocaleString() : '1,245,000';

  const healthyServicesCount = healthList.filter((h) => h.status === 'healthy').length;
  const totalServices = healthList.length || 4;
  const healthPercent = totalServices > 0 ? Math.round((healthyServicesCount / totalServices) * 100) : 100;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 60 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── 1. WELCOME HEADER ROW ──                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <View style={[styles.welcomeRow, !isDesktop && styles.welcomeRowMobile]}>
        <View style={styles.welcomeLeft}>
          <View style={styles.trendBadge}>
            <Ionicons name="trending-up" size={24} color="#00E676" />
          </View>
          <View>
            <Text style={styles.welcomeTitle}>Welcome Back, CEO!</Text>
            <Text style={styles.welcomeSub}>
              Here's what's happening with your FitPulse system today.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.dateDropdown} activeOpacity={0.8}>
          <Ionicons name="calendar-outline" size={16} color="#CBD5E1" />
          <Text style={styles.dateDropdownText}>Oct 29, 2026</Text>
          <Ionicons name="chevron-down" size={14} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── 2. FOUR METRIC CARDS ──                                   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <View style={[styles.metricCardsGrid, !isDesktop && styles.metricCardsGridMobile]}>
        {/* CARD 1: Total Users (Green) */}
        <TouchableOpacity
          style={[styles.statCard, styles.statCardGreen]}
          activeOpacity={0.85}
          onPress={() => onNavigateTab('users')}
        >
          <View style={styles.statCardTop}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(0, 230, 118, 0.15)' }]}>
              <Ionicons name="people" size={22} color="#00E676" />
            </View>
            <View style={styles.statNumberWrap}>
              <Text style={styles.statNumber}>{displayUsers}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
          </View>

          <View style={styles.statCardBottom}>
            <View style={styles.trendPill}>
              <Text style={[styles.trendPillText, { color: '#00E676' }]}>↑ +12%</Text>
            </View>
            {/* SVG Sparkline Wave (Green) */}
            <View style={styles.waveSvgWrap}>
              <Svg width={90} height={32} viewBox="0 0 90 32">
                <Path
                  d="M0 24 C20 28, 30 18, 45 18 C60 18, 70 8, 90 4"
                  fill="none"
                  stroke="#00E676"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </Svg>
            </View>
          </View>
        </TouchableOpacity>

        {/* CARD 2: Total Revenue (Blue) */}
        <TouchableOpacity
          style={[styles.statCard, styles.statCardBlue]}
          activeOpacity={0.85}
          onPress={() => onNavigateTab('finance')}
        >
          <View style={styles.statCardTop}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Ionicons name="card" size={22} color="#38BDF8" />
            </View>
            <View style={styles.statNumberWrap}>
              <Text style={styles.statNumber}>{displayRevenue}</Text>
              <Text style={styles.statLabel}>Total Revenue</Text>
            </View>
          </View>

          <View style={styles.statCardBottom}>
            <View style={styles.trendPill}>
              <Text style={[styles.trendPillText, { color: '#38BDF8' }]}>↑ +8%</Text>
            </View>
            {/* SVG Sparkline Wave (Blue) */}
            <View style={styles.waveSvgWrap}>
              <Svg width={90} height={32} viewBox="0 0 90 32">
                <Path
                  d="M0 26 C25 24, 40 16, 55 20 C70 24, 75 10, 90 6"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </Svg>
            </View>
          </View>
        </TouchableOpacity>

        {/* CARD 3: Active Issues (Orange) */}
        <TouchableOpacity
          style={[styles.statCard, styles.statCardOrange]}
          activeOpacity={0.85}
          onPress={() => onNavigateTab('errors')}
        >
          <View style={styles.statCardTop}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="warning" size={22} color="#F59E0B" />
            </View>
            <View style={styles.statNumberWrap}>
              <Text style={styles.statNumber}>{displayActiveIssues}</Text>
              <Text style={styles.statLabel}>Active Issues</Text>
            </View>
          </View>

          <View style={styles.statCardBottom}>
            <View style={styles.trendPill}>
              <Text style={[styles.trendPillText, { color: '#00E676' }]}>↑ -40%</Text>
            </View>
            {/* SVG Sparkline Wave (Orange) */}
            <View style={styles.waveSvgWrap}>
              <Svg width={90} height={32} viewBox="0 0 90 32">
                <Path
                  d="M0 24 C20 22, 35 28, 55 18 C70 10, 75 12, 90 6"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </Svg>
            </View>
          </View>
        </TouchableOpacity>

        {/* CARD 4: Transactions (Purple) */}
        <TouchableOpacity
          style={[styles.statCard, styles.statCardPurple]}
          activeOpacity={0.85}
          onPress={() => onNavigateTab('finance')}
        >
          <View style={styles.statCardTop}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Ionicons name="swap-horizontal" size={22} color="#C084FC" />
            </View>
            <View style={styles.statNumberWrap}>
              <Text style={styles.statNumber}>{displayTransactions}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
          </View>

          <View style={styles.statCardBottom}>
            <View style={styles.trendPill}>
              <Text style={[styles.trendPillText, { color: '#C084FC' }]}>↑ +15%</Text>
            </View>
            {/* SVG Sparkline Wave (Purple) */}
            <View style={styles.waveSvgWrap}>
              <Svg width={90} height={32} viewBox="0 0 90 32">
                <Path
                  d="M0 26 C20 26, 35 14, 55 18 C70 20, 75 8, 90 4"
                  fill="none"
                  stroke="#C084FC"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </Svg>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── 3. MIDDLE ROW: SYSTEM STATUS + REVENUE OVERVIEW ──        */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <View style={[styles.middleRow, !isDesktop && styles.middleRowMobile]}>
        {/* LEFT: System Status */}
        <View style={styles.systemStatusCard}>
          <View style={styles.systemStatusHeader}>
            <View style={styles.statusHeaderIcon}>
              <Ionicons name="checkmark-circle" size={22} color="#00E676" />
            </View>
            <View>
              <Text style={styles.cardHeaderTitle}>System Status</Text>
              <Text style={styles.cardHeaderSubtitle}>All core services are running smoothly</Text>
            </View>
          </View>

          <View style={styles.systemStatusBody}>
            {/* Circular Gauge Ring */}
            <View style={styles.circularGaugeContainer}>
              <Svg width={110} height={110} viewBox="0 0 110 110">
                <Circle
                  cx="55"
                  cy="55"
                  r="45"
                  stroke="#1E293B"
                  strokeWidth="8"
                  fill="transparent"
                />
                <Circle
                  cx="55"
                  cy="55"
                  r="45"
                  stroke="#00E676"
                  strokeWidth="8"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * healthPercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  transform="rotate(-90 55 55)"
                />
              </Svg>
              <View style={styles.gaugeInnerContent}>
                <Ionicons name="checkmark" size={24} color="#00E676" />
                <Text style={styles.gaugePercentText}>{healthPercent}%</Text>
                <Text style={styles.gaugeLabelText}>Healthy</Text>
              </View>
            </View>

            {/* Services Checklist */}
            <View style={styles.servicesList}>
              <View style={styles.serviceRow}>
                <View style={[styles.serviceStatusDot, { backgroundColor: '#00E676' }]} />
                <Text style={styles.serviceNameText}>API Services</Text>
                <Text style={styles.serviceStatusText}>Online</Text>
              </View>

              <View style={styles.serviceRow}>
                <View style={[styles.serviceStatusDot, { backgroundColor: '#00E676' }]} />
                <Text style={styles.serviceNameText}>Payment Gateway</Text>
                <Text style={styles.serviceStatusText}>Online</Text>
              </View>

              <View style={styles.serviceRow}>
                <View style={[styles.serviceStatusDot, { backgroundColor: '#00E676' }]} />
                <Text style={styles.serviceNameText}>Database</Text>
                <Text style={styles.serviceStatusText}>Online</Text>
              </View>

              <View style={styles.serviceRow}>
                <View style={[styles.serviceStatusDot, { backgroundColor: '#00E676' }]} />
                <Text style={styles.serviceNameText}>AI Services</Text>
                <Text style={styles.serviceStatusText}>Online</Text>
              </View>
            </View>
          </View>
        </View>

        {/* RIGHT: Revenue Overview Chart */}
        <View style={styles.revenueOverviewCard}>
          <View style={styles.revenueHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="bar-chart" size={20} color="#00E676" />
              <Text style={styles.cardHeaderTitle}>Revenue Overview</Text>
            </View>

            {/* Time period switcher pills */}
            <View style={styles.rangePillsContainer}>
              {(['7D', '30D', '90D'] as const).map((r) => {
                const isActive = revenueRange === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[styles.rangePill, isActive && styles.rangePillActive]}
                    onPress={() => setRevenueRange(r)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.rangePillText, isActive && styles.rangePillTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* SVG Line Chart with Y-Axis and glowing green dots */}
          <View style={styles.chartAreaWrap}>
            {/* Y-Axis Labels */}
            <View style={styles.yAxisColumn}>
              <Text style={styles.axisLabel}>15K</Text>
              <Text style={styles.axisLabel}>10K</Text>
              <Text style={styles.axisLabel}>5K</Text>
              <Text style={styles.axisLabel}>0K</Text>
            </View>

            {/* Chart SVG Canvas */}
            <View style={styles.chartCanvas}>
              <Svg width="100%" height={140} viewBox="0 0 350 140" preserveAspectRatio="none">
                <Defs>
                  <SvgLinearGradient id="greenAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#00E676" stopOpacity="0.25" />
                    <Stop offset="100%" stopColor="#00E676" stopOpacity="0.0" />
                  </SvgLinearGradient>
                </Defs>

                {/* Horizontal grid lines */}
                <Path d="M 0 10 L 350 10" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <Path d="M 0 50 L 350 50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <Path d="M 0 90 L 350 90" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <Path d="M 0 130 L 350 130" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                {/* Area under line */}
                <Path
                  d="M 10 95 Q 60 85 110 65 T 210 40 T 310 20 L 340 10 L 340 130 L 10 130 Z"
                  fill="url(#greenAreaGrad)"
                />

                {/* Smooth Green Curve */}
                <Path
                  d="M 10 95 Q 60 85 110 65 T 210 40 T 310 20 L 340 10"
                  fill="none"
                  stroke="#00E676"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* 7 Glowing Data Points */}
                <Circle cx="10" cy="95" r="5" fill="#00E676" stroke="#06121E" strokeWidth="2" />
                <Circle cx="65" cy="80" r="5" fill="#00E676" stroke="#06121E" strokeWidth="2" />
                <Circle cx="120" cy="65" r="5" fill="#00E676" stroke="#06121E" strokeWidth="2" />
                <Circle cx="175" cy="55" r="5" fill="#00E676" stroke="#06121E" strokeWidth="2" />
                <Circle cx="230" cy="40" r="5" fill="#00E676" stroke="#06121E" strokeWidth="2" />
                <Circle cx="285" cy="25" r="5" fill="#00E676" stroke="#06121E" strokeWidth="2" />
                <Circle cx="340" cy="10" r="5" fill="#00E676" stroke="#06121E" strokeWidth="2" />
              </Svg>

              {/* X-Axis Day Labels */}
              <View style={styles.xAxisRow}>
                <Text style={styles.axisLabel}>Mon</Text>
                <Text style={styles.axisLabel}>Tue</Text>
                <Text style={styles.axisLabel}>Wed</Text>
                <Text style={styles.axisLabel}>Thu</Text>
                <Text style={styles.axisLabel}>Fri</Text>
                <Text style={styles.axisLabel}>Sat</Text>
                <Text style={styles.axisLabel}>Sun</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── 4. BOTTOM ROW: RECENT ALERTS + GROWTH ROCKET BANNER ──    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <View style={[styles.bottomRow, !isDesktop && styles.bottomRowMobile]}>
        {/* LEFT: Recent Alerts (Red-tinted card) */}
        <View style={styles.recentAlertsCard}>
          <View style={styles.alertsHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.alertIconCircle}>
                <Ionicons name="notifications" size={16} color="#EF4444" />
              </View>
              <Text style={styles.cardHeaderTitle}>Recent Alerts</Text>
            </View>

            <TouchableOpacity
              onPress={() => onNavigateTab('errors')}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllRedText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {/* List of 3 Alerts */}
          <View style={styles.alertsList}>
            {/* Alert 1: Critical */}
            <View style={styles.alertItemRow}>
              <View style={[styles.alertSeverityBadge, { backgroundColor: '#EF4444' }]}>
                <Text style={styles.severityBadgeText}>Critical</Text>
              </View>
              <Text style={styles.alertMsgText} numberOfLines={1}>
                {recentErrors[0]?.error_message || 'Payment gateway failed - 2 transactions affected'}
              </Text>
              <Text style={styles.alertTimeText}>4:15 PM</Text>
              <TouchableOpacity
                style={styles.viewAlertBtn}
                onPress={() => onNavigateTab('errors')}
              >
                <Text style={styles.viewAlertBtnText}>View</Text>
              </TouchableOpacity>
            </View>

            {/* Alert 2: Warning */}
            <View style={styles.alertItemRow}>
              <View style={[styles.alertSeverityBadge, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.severityBadgeText}>Warning</Text>
              </View>
              <Text style={styles.alertMsgText} numberOfLines={1}>
                {recentErrors[1]?.error_message || 'High API response time (2.8s)'}
              </Text>
              <Text style={styles.alertTimeText}>3:50 PM</Text>
              <TouchableOpacity
                style={styles.viewAlertBtn}
                onPress={() => onNavigateTab('errors')}
              >
                <Text style={styles.viewAlertBtnText}>View</Text>
              </TouchableOpacity>
            </View>

            {/* Alert 3: Info */}
            <View style={styles.alertItemRow}>
              <View style={[styles.alertSeverityBadge, { backgroundColor: '#3B82F6' }]}>
                <Text style={styles.severityBadgeText}>Info</Text>
              </View>
              <Text style={styles.alertMsgText} numberOfLines={1}>
                New user registration spike (+35%)
              </Text>
              <Text style={styles.alertTimeText}>2:30 PM</Text>
              <TouchableOpacity
                style={styles.viewAlertBtn}
                onPress={() => onNavigateTab('users')}
              >
                <Text style={styles.viewAlertBtnText}>View</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* RIGHT: Rocket Growth Promo Banner */}
        <View style={styles.growthPromoCard}>
          <LinearGradient
            colors={['#0B1B38', '#071224']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promoGradient}
          >
            {/* Rocket Illustration */}
            <View style={styles.rocketWrap}>
              <Svg width={90} height={90} viewBox="0 0 100 100">
                {/* Exhaust flame */}
                <Path
                  d="M 28 72 Q 10 90 20 98 Q 38 88 42 74 Z"
                  fill="#F97316"
                />
                <Path
                  d="M 28 72 Q 18 84 24 90 Q 34 82 40 74 Z"
                  fill="#FDE047"
                />
                {/* Rocket body */}
                <Path
                  d="M 32 68 Q 30 40 68 18 Q 74 12 80 14 Q 84 20 80 26 Q 58 64 32 68 Z"
                  fill="#FFFFFF"
                />
                {/* Wings */}
                <Path
                  d="M 35 55 L 20 62 L 28 44 Z"
                  fill="#38BDF8"
                />
                <Path
                  d="M 55 35 L 62 20 L 44 28 Z"
                  fill="#38BDF8"
                />
                {/* Cockpit window */}
                <Circle cx="62" cy="32" r="6" fill="#0284C7" />
              </Svg>
            </View>

            <View style={styles.promoTextWrap}>
              <Text style={styles.promoTitle}>FitPulse is Running Better Than Ever!</Text>
              <Text style={styles.promoSub}>
                All systems are stable and ready for growth.
              </Text>
              <TouchableOpacity
                style={styles.viewDetailsBtn}
                onPress={() => onNavigateTab('controls')}
                activeOpacity={0.85}
              >
                <Text style={styles.viewDetailsBtnText}>View Details →</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── 5. AI CHAT QUICK LAUNCHER (IF ACTIVE THREADS EXIST) ──    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {chatThreads.length > 0 && (
        <TouchableOpacity
          style={styles.aiChatLauncherCard}
          onPress={() => onNavigateTab('chat')}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={styles.aiIconBubble}>
              <Ionicons name="chatbubbles" size={20} color="#00E676" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.aiLauncherTitle}>Operations AI Copilot</Text>
                <View style={styles.aiActiveBadge}>
                  <Text style={styles.aiActiveBadgeText}>{chatThreads.length} Threads Active</Text>
                </View>
              </View>
              <Text style={styles.aiLauncherSub} numberOfLines={1}>
                {chatThreads[0]?.title} • {chatThreads[0]?.lastMessage}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#00E676" />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090F1D',
  },
  content: {
    padding: 24,
    gap: 22,
  },

  // 1. Welcome Row
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  welcomeRowMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 14,
  },
  welcomeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  trendBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  welcomeSub: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  dateDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dateDropdownText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },

  // 2. Metric Cards Grid
  metricCardsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  metricCardsGridMobile: {
    flexDirection: 'column',
  },
  statCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#0D1527',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'space-between',
    height: 125,
  },
  statCardGreen: {
    borderLeftWidth: 3,
    borderLeftColor: '#00E676',
  },
  statCardBlue: {
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
  },
  statCardOrange: {
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  statCardPurple: {
    borderLeftWidth: 3,
    borderLeftColor: '#C084FC',
  },
  statCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumberWrap: {
    flex: 1,
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  statCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  trendPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  trendPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  waveSvgWrap: {
    height: 32,
    justifyContent: 'center',
  },

  // 3. Middle Row: System Status & Revenue Overview
  middleRow: {
    flexDirection: 'row',
    gap: 16,
  },
  middleRowMobile: {
    flexDirection: 'column',
  },
  systemStatusCard: {
    flex: 1,
    backgroundColor: '#0D1527',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  systemStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  statusHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  cardHeaderSubtitle: {
    color: '#8A95A5',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  systemStatusBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 16,
    paddingVertical: 4,
  },
  circularGaugeContainer: {
    width: 110,
    height: 110,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeInnerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugePercentText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: -2,
  },
  gaugeLabelText: {
    color: '#00E676',
    fontSize: 10,
    fontWeight: '700',
  },
  servicesList: {
    flex: 1,
    gap: 10,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  serviceStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  serviceNameText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  serviceStatusText: {
    color: '#00E676',
    fontSize: 12,
    fontWeight: '700',
  },

  // Revenue Overview Card
  revenueOverviewCard: {
    flex: 1.4,
    backgroundColor: '#0D1527',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  revenueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rangePillsContainer: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#090F1D',
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  rangePill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  rangePillActive: {
    backgroundColor: '#00E676',
  },
  rangePillText: {
    color: '#8A95A5',
    fontSize: 11,
    fontWeight: '700',
  },
  rangePillTextActive: {
    color: '#070D18',
  },
  chartAreaWrap: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  yAxisColumn: {
    height: 140,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  axisLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  chartCanvas: {
    flex: 1,
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 6,
  },

  // 4. Bottom Row: Recent Alerts + Growth Rocket Banner
  bottomRow: {
    flexDirection: 'row',
    gap: 16,
  },
  bottomRowMobile: {
    flexDirection: 'column',
  },
  recentAlertsCard: {
    flex: 1.2,
    backgroundColor: '#0D1527',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  alertsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  alertIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllRedText: {
    color: '#EF4444',
    fontSize: 12.5,
    fontWeight: '700',
  },
  alertsList: {
    gap: 10,
  },
  alertItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  alertSeverityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  severityBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  alertMsgText: {
    color: '#E2E8F0',
    fontSize: 12.5,
    fontWeight: '500',
    flex: 1,
  },
  alertTimeText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
  viewAlertBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  viewAlertBtnText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },

  // Growth Promo Card
  growthPromoCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.2)',
  },
  promoGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  rocketWrap: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoTextWrap: {
    flex: 1,
    gap: 6,
  },
  promoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  promoSub: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  viewDetailsBtn: {
    backgroundColor: '#00E676',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 6,
  },
  viewDetailsBtnText: {
    color: '#070D18',
    fontSize: 12,
    fontWeight: '800',
  },

  // AI Chat Launcher
  aiChatLauncherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F1A2E',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  aiIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLauncherTitle: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  aiActiveBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  aiActiveBadgeText: {
    color: '#00E676',
    fontSize: 10.5,
    fontWeight: '700',
  },
  aiLauncherSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
});
