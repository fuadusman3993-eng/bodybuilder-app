import { supabase } from './supabase';

export interface CeoTransactionItem {
  id: string;
  user_id: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  userLifetimeSpentEtb?: number;
  userLifetimeCoins?: number;
  type: string;
  amount_coins: number;
  amount_etb: number;
  currency?: string;
  payment_gateway?: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  description?: string;
  created_at: string;
}

export interface TopSpenderItem {
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  totalSpentEtb: number;
  totalCoinsBought: number;
  txCount: number;
}

export interface FinancialKPIs {
  totalRevenueEtb: number;
  totalCoinsPurchased: number;
  pendingTransactionsCount: number;
  pendingAmountEtb: number;
  completedTransactionsCount: number;
  failedTransactionsCount: number;
  successRatePercent: number;
  topSpenders: TopSpenderItem[];
}

/**
 * Fetch real payment ledger directly from Supabase coin_transactions joined with user profiles
 */
export async function fetchRealPaymentLedger(limit: number = 60): Promise<CeoTransactionItem[]> {
  try {
    const { data: rawTxs, error } = await supabase
      .from('coin_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('coin_transactions fetch error:', error);
      return [];
    }

    if (!rawTxs || rawTxs.length === 0) {
      return [];
    }

    // Collect distinct user IDs to fetch profile details
    const userIds = Array.from(new Set(rawTxs.map((t: any) => t.user_id).filter(Boolean)));
    const profileMap: Record<string, { name: string; email?: string; avatar_url?: string }> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('uid, name, email, avatar_url')
        .in('uid', userIds);

      if (profiles) {
        profiles.forEach((p: any) => {
          profileMap[p.uid] = {
            name: p.name || 'Member',
            email: p.email || undefined,
            avatar_url: p.avatar_url || undefined,
          };
        });
      }
    }

    // Compute user lifetime spend map
    const userLifetimeMap: Record<string, { totalEtb: number; totalCoins: number }> = {};
    rawTxs.forEach((t: any) => {
      const uid = t.user_id;
      if (!uid) return;
      if (!userLifetimeMap[uid]) userLifetimeMap[uid] = { totalEtb: 0, totalCoins: 0 };
      if (t.status === 'completed') {
        userLifetimeMap[uid].totalEtb += t.amount_etb || 0;
        userLifetimeMap[uid].totalCoins += t.amount_coins || 0;
      }
    });

    return rawTxs.map((t: any) => {
      const p = profileMap[t.user_id] || {};
      const lt = userLifetimeMap[t.user_id] || { totalEtb: 0, totalCoins: 0 };
      return {
        id: t.id,
        user_id: t.user_id,
        userName: (p as any).name && (p as any).name.trim() ? (p as any).name : `User ${t.user_id?.slice(0, 8) || 'Unknown'}`,
        userEmail: p.email,
        userAvatar: p.avatar_url,
        userLifetimeSpentEtb: lt.totalEtb,
        userLifetimeCoins: lt.totalCoins,
        type: t.type || 'topup',
        amount_coins: t.amount_coins || 0,
        amount_etb: t.amount_etb || 0,
        currency: t.currency || 'ETB',
        payment_gateway: t.payment_gateway || 'chapa',
        status: t.status || 'completed',
        description: t.description || 'Coin Purchase',
        created_at: t.created_at || new Date().toISOString(),
      };
    });
  } catch (e) {
    console.warn('fetchRealPaymentLedger exception:', e);
    return [];
  }
}

/**
 * Calculate financial totals, conversion rates, and top paying customers
 */
export function calculateFinancialKPIs(transactions: CeoTransactionItem[]): FinancialKPIs {
  let totalRevenueEtb = 0;
  let totalCoinsPurchased = 0;
  let pendingTransactionsCount = 0;
  let pendingAmountEtb = 0;
  let completedTransactionsCount = 0;
  let failedTransactionsCount = 0;

  const spendersMap: Record<string, TopSpenderItem> = {};

  transactions.forEach((tx) => {
    if (tx.status === 'completed') {
      completedTransactionsCount++;
      totalRevenueEtb += tx.amount_etb;
      totalCoinsPurchased += tx.amount_coins;

      if (!spendersMap[tx.user_id]) {
        spendersMap[tx.user_id] = {
          userId: tx.user_id,
          userName: tx.userName || 'Member',
          userEmail: tx.userEmail,
          userAvatar: tx.userAvatar,
          totalSpentEtb: 0,
          totalCoinsBought: 0,
          txCount: 0,
        };
      }
      spendersMap[tx.user_id].totalSpentEtb += tx.amount_etb;
      spendersMap[tx.user_id].totalCoinsBought += tx.amount_coins;
      spendersMap[tx.user_id].txCount++;
    } else if (tx.status === 'pending') {
      pendingTransactionsCount++;
      pendingAmountEtb += tx.amount_etb;
    } else if (tx.status === 'failed') {
      failedTransactionsCount++;
    }
  });

  const totalFinished = completedTransactionsCount + failedTransactionsCount;
  const successRatePercent = totalFinished > 0 ? Math.round((completedTransactionsCount / totalFinished) * 100) : 100;

  // Sort top spenders descending
  const topSpenders = Object.values(spendersMap)
    .sort((a, b) => b.totalSpentEtb - a.totalSpentEtb)
    .slice(0, 5);

  return {
    totalRevenueEtb,
    totalCoinsPurchased,
    pendingTransactionsCount,
    pendingAmountEtb,
    completedTransactionsCount,
    failedTransactionsCount,
    successRatePercent,
    topSpenders,
  };
}

/**
 * Live 1-Click Chapa Payment Verifier & Manual Wallet Creditor
 */
export async function verifyAndReconcileChapaTx(
  txRef: string,
  userUid?: string,
  coins?: number
): Promise<{ success: boolean; message: string; data?: any }> {
  if (!txRef || !txRef.trim()) {
    return { success: false, message: 'Transaction reference is required.' };
  }

  try {
    const response = await fetch('/api/chapa-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tx_ref: txRef.trim(),
        uid: userUid,
        coins,
      }),
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        message: result.alreadyProcessed
          ? 'Payment was already verified and credited previously.'
          : 'Payment verified successfully! Coins credited to user wallet.',
        data: result,
      };
    } else {
      return {
        success: false,
        message: result.message || 'Payment not verified by Chapa.',
        data: result,
      };
    }
  } catch (e: any) {
    return {
      success: false,
      message: e.message || 'Network error verifying with Chapa.',
    };
  }
}
