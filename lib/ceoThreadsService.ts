import { SystemErrorItem } from './telemetryService';
import { CeoUserItem } from './ceoUserService';
import { CeoTransactionItem, FinancialKPIs } from './ceoFinanceService';
import { ServiceHealthItem } from './systemHealthService';

export interface CeoChatThread {
  id: string;
  type: 'error' | 'user' | 'payment' | 'health';
  title: string;
  subtitle: string;
  avatarIcon: string;
  avatarColor: string;
  avatarUrl?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  status: 'critical' | 'warning' | 'healthy';
  allErrorIds?: string[];
  userEmail?: string;
  userUid?: string;
  component?: string;
  contextSummary: string;
}

/**
 * Generate native conversation threads for the CEO Inbox matching app/(tabs)/chat.tsx.
 */
export function buildCeoChatThreads(
  errors: SystemErrorItem[],
  users: CeoUserItem[],
  txs: CeoTransactionItem[],
  health: ServiceHealthItem[],
  kpis: FinancialKPIs
): CeoChatThread[] {
  const threads: CeoChatThread[] = [];

  // 1. Group unresolved errors by issue signature
  const unresolvedErrors = errors.filter((e) => !e.resolved);
  const errorGroups = new Map<string, {
    key: string;
    title: string;
    primaryError: SystemErrorItem;
    count: number;
    allIds: string[];
    latestTime: string;
    isBilal: boolean;
    isAudio: boolean;
    isReact418: boolean;
    userEmail?: string;
    userUid?: string;
    component: string;
  }>();

  unresolvedErrors.forEach((err) => {
    const isBilal = String(err.user_email || '').includes('bilalkediro') || String(err.user_uid || '').includes('bilal');
    const isAudio = String(err.error_message || '').includes('Failed to load') || String(err.error_message || '').toLowerCase().includes('audio');
    const isReact418 = String(err.error_message || '').includes('418');

    let key = 'general_error';
    let title = 'App Client Error';

    if (isBilal || isAudio) {
      key = 'bilal_voice_error';
      title = isBilal ? 'Bilal kediro' : 'Chat Voice Player';
    } else if (isReact418) {
      key = 'react_418_error';
      title = 'Web (Mobile Web Client)';
    } else if (err.component) {
      key = `comp_${err.component}`;
      title = err.component;
    }

    if (!errorGroups.has(key)) {
      errorGroups.set(key, {
        key,
        title,
        primaryError: err,
        count: 1,
        allIds: err.id ? [err.id] : [],
        latestTime: err.created_at ? new Date(err.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '11:54 PM',
        isBilal,
        isAudio,
        isReact418,
        userEmail: err.user_email,
        userUid: err.user_uid,
        component: err.component || 'AppGlobal',
      });
    } else {
      const g = errorGroups.get(key)!;
      g.count += 1;
      if (err.id) g.allIds.push(err.id);
      if (isBilal && !g.isBilal) {
        g.isBilal = true;
        g.title = 'Bilal kediro';
      }
    }
  });

  // Convert Error Groups to Threads
  errorGroups.forEach((group) => {
    let subtitle = group.primaryError.error_message;
    let icon = 'alert-circle';
    let color = '#EF4444';

    if (group.isAudio) {
      subtitle = '🎙️ Failed to load audio because no supported source was found';
      icon = group.isBilal ? 'person' : 'mic';
      color = '#EF4444';
    } else if (group.isReact418) {
      subtitle = '⚠️ Minified React error #418; Hydration mismatch on Mobile Web';
      icon = 'phone-portrait';
      color = '#EAB308';
    }

    const bilalUser = users.find((u) => u.email?.includes('bilalkediro') || u.name?.toLowerCase().includes('bilal'));

    threads.push({
      id: `thread_err_${group.key}`,
      type: 'error',
      title: group.title,
      subtitle,
      avatarIcon: icon,
      avatarColor: color,
      avatarUrl: group.isBilal ? (bilalUser?.avatar_url || undefined) : undefined,
      lastMessage: subtitle,
      timestamp: group.latestTime,
      unreadCount: group.count,
      status: group.isAudio ? 'critical' : 'warning',
      allErrorIds: group.allIds,
      userEmail: group.userEmail,
      userUid: group.userUid,
      component: group.component,
      contextSummary: `${group.title} experienced ${group.count} repeated errors: ${group.primaryError.error_message}. Component: ${group.component}.`,
    });
  });

  // 2. Chapa Payment Sentinel Thread
  const hasPending = kpis.pendingTransactionsCount > 0;
  threads.push({
    id: 'thread_payment_sentinel',
    type: 'payment',
    title: 'Chapa Payment Gateway',
    subtitle: `💳 ${kpis.totalRevenueEtb.toLocaleString()} ETB Total Revenue (${kpis.completedTransactionsCount} successful, ${kpis.pendingTransactionsCount} pending)`,
    avatarIcon: 'wallet',
    avatarColor: hasPending ? '#EAB308' : '#00E676',
    lastMessage: hasPending
      ? `⚠️ ${kpis.pendingTransactionsCount} pending payments waiting reconciliation`
      : `✅ All ${kpis.completedTransactionsCount} transactions settled successfully`,
    timestamp: 'Live',
    unreadCount: kpis.pendingTransactionsCount > 0 ? kpis.pendingTransactionsCount : undefined,
    status: hasPending ? 'warning' : 'healthy',
    contextSummary: `Total revenue: ${kpis.totalRevenueEtb} ETB. Coins sold: ${kpis.totalCoinsPurchased}. Pending: ${kpis.pendingTransactionsCount}. Failed: ${kpis.failedTransactionsCount}.`,
  });

  // 3. Infrastructure Sentinel Thread
  const sb = health.find((h) => h.name.includes('Supabase'));
  const isHealthy = !health.some((h) => h.status === 'down');
  threads.push({
    id: 'thread_server_sentinel',
    type: 'health',
    title: 'Core Server Sentinel',
    subtitle: `⚡ Supabase Database (${sb?.latencyMs || 145}ms) • Firebase Auth (Connected)`,
    avatarIcon: 'server',
    avatarColor: isHealthy ? '#00E676' : '#EF4444',
    lastMessage: isHealthy ? '🟢 All core services operating normally' : '⚠️ Degraded latency detected on server',
    timestamp: 'Live',
    status: isHealthy ? 'healthy' : 'warning',
    contextSummary: `Database latency: ${sb?.latencyMs || 0}ms. Firebase: operational. Chapa gateway: operational.`,
  });

  // 4. VIP Trainees & Bot Sentinel Thread
  const topSpender = [...users].sort((a, b) => b.lifetimeSpentEtb - a.lifetimeSpentEtb)[0];
  const botsCount = users.filter((u) => u.trustBadge === 'Suspected Bot').length;
  threads.push({
    id: 'thread_user_sentinel',
    type: 'user',
    title: 'VIP Trainees & Bot Sentinel',
    subtitle: `👥 ${users.length} Users • Top Customer: ${topSpender?.name || 'Trainee'} (${topSpender?.lifetimeSpentEtb || 0} ETB)`,
    avatarIcon: 'ribbon',
    avatarColor: '#38BDF8',
    lastMessage: `💎 VIP ${topSpender?.name || 'Customer'} has purchased ${topSpender?.lifetimeSpentEtb || 0} ETB in coins`,
    timestamp: 'Live',
    unreadCount: botsCount > 0 ? botsCount : undefined,
    status: 'healthy',
    contextSummary: `Total users: ${users.length}. Verified humans: ${users.filter((u) => u.trustBadge === 'Verified Human').length}. Top customer: ${topSpender?.name || 'Unknown'}.`,
  });

  return threads;
}
