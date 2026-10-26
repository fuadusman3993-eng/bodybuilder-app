import { supabase } from './supabase';

export interface CeoTransactionItem {
  id: string;
  user_id: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  type: string;
  amount_coins: number;
  amount_etb: number;
  currency?: string;
  payment_gateway?: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  description?: string;
  created_at: string;
}

export interface FinancialKPIs {
  totalRevenueEtb: number;
  totalCoinsPurchased: number;
  pendingTransactionsCount: number;
  pendingAmountEtb: number;
  completedTransactionsCount: number;
  failedTransactionsCount: number;
  successRatePercent: number;
}

/**
 * Fetch real payment ledger directly from Supabase coin_transactions joined with user profiles
 */
export async function fetchRealPaymentLedger(limit: number = 50): Promise<CeoTransactionItem[]> {
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

    return rawTxs.map((t: any) => {
      const p = profileMap[t.user_id] || {};
      return {
        id: t.id,
        user_id: t.user_id,
        userName: p.name || 'Athlete',
        userEmail: p.email,
        userAvatar: p.avatar_url,
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
 * Calculate financial totals and conversion rates
 */
export function calculateFinancialKPIs(transactions: CeoTransactionItem[]): FinancialKPIs {
  let totalRevenueEtb = 0;
  let totalCoinsPurchased = 0;
  let pendingTransactionsCount = 0;
  let pendingAmountEtb = 0;
  let completedTransactionsCount = 0;
  let failedTransactionsCount = 0;

  transactions.forEach((tx) => {
    if (tx.status === 'completed') {
      completedTransactionsCount++;
      totalRevenueEtb += tx.amount_etb;
      totalCoinsPurchased += tx.amount_coins;
    } else if (tx.status === 'pending') {
      pendingTransactionsCount++;
      pendingAmountEtb += tx.amount_etb;
    } else if (tx.status === 'failed') {
      failedTransactionsCount++;
    }
  });

  const totalFinished = completedTransactionsCount + failedTransactionsCount;
  const successRatePercent = totalFinished > 0 ? Math.round((completedTransactionsCount / totalFinished) * 100) : 100;

  return {
    totalRevenueEtb,
    totalCoinsPurchased,
    pendingTransactionsCount,
    pendingAmountEtb,
    completedTransactionsCount,
    failedTransactionsCount,
    successRatePercent,
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
