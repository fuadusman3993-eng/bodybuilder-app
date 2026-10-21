/**
 * FitPulse Wallet Service
 * ---------------------------------------------------------------------------
 * Handles all wallet and coin economy operations via Supabase PostgreSQL.
 * Rate:  1 ETB = 1 FitPulse Coin
 * ---------------------------------------------------------------------------
 */

import { supabase } from './supabase';

// ── Types ──────────────────────────────────────────────────────────────────

export interface Wallet {
  user_id: string;
  balance_coins: number;
  lifetime_earnings_coins: number;
  pending_payout_etb: number;
  preferred_currency?: string;
  pro_until?: string | null;
  updated_at: string;
}

export type TxType =
  | 'topup'
  | 'spend_coach'
  | 'spend_plan'
  | 'spend_subscription'
  | 'coach_earning'
  | 'payout'
  | 'tip';

export interface CoinTransaction {
  id: string;
  user_id: string;
  type: TxType;
  amount_coins: number;
  amount_etb: number;
  currency?: string;
  payment_gateway?: string;
  related_coach_uid?: string | null;
  related_entity_id?: string | null;
  payment_method?: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  description?: string | null;
  created_at: string;
}

export interface CoinBundle {
  id: string;
  label: string;
  coins: number;
  price_etb: number;
  badge?: string; // e.g. 'Popular', 'Best Value'
}

export const COIN_BUNDLES: CoinBundle[] = [
  { id: 'starter',   label: 'Starter',      coins: 50,   price_etb: 50,  },
  { id: 'athlete',   label: 'Pro Athlete',   coins: 100,  price_etb: 100, badge: 'Popular' },
  { id: 'champion',  label: 'Champion',      coins: 250,  price_etb: 250, badge: 'Best Value' },
];

// 1 ETB = 1 Coin (as specified by user)
export const ETB_PER_COIN = 1;
export function coinsToEtb(coins: number) { return coins * ETB_PER_COIN; }
export function etbToCoins(etb: number)   { return Math.floor(etb / ETB_PER_COIN); }

// ── Fetch Wallet ──────────────────────────────────────────────────────────

export async function getWallet(uid: string): Promise<Wallet | null> {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  } catch (e) {
    console.warn('[walletService] getWallet error:', e);
    return null;
  }
}

/**
 * Ensure a wallet row exists for user (creates with 0 balance if missing).
 */
export async function ensureWallet(uid: string): Promise<Wallet | null> {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .upsert({ user_id: uid, balance_coins: 0, lifetime_earnings_coins: 0, pending_payout_etb: 0 }, {
        onConflict: 'user_id',
        ignoreDuplicates: true,
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data ?? await getWallet(uid);
  } catch (e) {
    console.warn('[walletService] ensureWallet error:', e);
    return null;
  }
}

// ── Fetch Transaction History ─────────────────────────────────────────────

export async function getTransactionHistory(uid: string, limit = 20): Promise<CoinTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('coin_transactions')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  } catch (e) {
    console.warn('[walletService] getTransactionHistory error:', e);
    return [];
  }
}

// ── Top-Up Wallet (Supports International & Local Gateways) ───────────────

export async function topupWalletWithGateway(params: {
  uid: string;
  coins: number;
  fiatAmount: number;
  currency: string;
  gateway: string;
  reference: string;
}): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('topup_user_wallet', {
      p_uid: params.uid,
      p_coins: params.coins,
      p_etb: params.fiatAmount,
      p_payment_method: `${params.gateway}:${params.currency}`,
      p_ref: params.reference,
    });

    if (error) throw error;

    const result = data as { success: boolean; new_balance: number };
    return { success: true, newBalance: result.new_balance };
  } catch (e: any) {
    console.warn('[walletService] topupWalletWithGateway error:', e);
    return { success: false, error: e?.message ?? 'Top-up failed' };
  }
}

// ── Activate Pro Subscription with Coins (Atomic) ─────────────────────────

export async function activateProWithCoins(
  uid: string,
  durationDays: number = 30,
  coinsCost: number = 500
): Promise<{ success: boolean; remainingBalance?: number; proUntil?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('activate_pro_subscription', {
      p_uid: uid,
      p_duration_days: durationDays,
      p_coins_cost: coinsCost,
    });

    if (error) throw error;

    const result = data as { success: boolean; remaining_balance?: number; pro_until?: string; error?: string };
    if (!result.success) {
      return { success: false, error: result.error ?? 'Subscription activation failed' };
    }
    return {
      success: true,
      remainingBalance: result.remaining_balance,
      proUntil: result.pro_until,
    };
  } catch (e: any) {
    console.warn('[walletService] activateProWithCoins error:', e);
    return { success: false, error: e?.message ?? 'Subscription failed' };
  }
}

/**
 * Simulated top-up — credits coins instantly (sandbox mode).
 * In production, replace with real Chapa/Telebirr webhook confirmation.
 */
export async function topupWalletSandbox(
  uid: string,
  bundle: CoinBundle,
  method: 'telebirr' | 'cbe_birr' | 'chapa' = 'telebirr',
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    const ref = `SANDBOX-${Date.now()}-${uid.slice(0, 6)}`;

    const { data, error } = await supabase.rpc('topup_user_wallet', {
      p_uid: uid,
      p_coins: bundle.coins,
      p_etb: bundle.price_etb,
      p_payment_method: method,
      p_ref: ref,
    });

    if (error) throw error;

    const result = data as { success: boolean; new_balance: number };
    return { success: true, newBalance: result.new_balance };
  } catch (e: any) {
    console.warn('[walletService] topupWalletSandbox error:', e);
    return { success: false, error: e?.message ?? 'Top-up failed' };
  }
}

// ── Hire Coach with Coins (Atomic) ────────────────────────────────────────

export async function hireCoachWithCoins(params: {
  traineeUid: string;
  traineeName: string;
  traineeAvatar: string;
  coachUid: string;
  coachName: string;
  coins: number;
  message: string;
}): Promise<{ success: boolean; remainingBalance?: number; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('hire_coach_with_coins', {
      p_trainee_uid:    params.traineeUid,
      p_trainee_name:   params.traineeName,
      p_trainee_avatar: params.traineeAvatar,
      p_coach_uid:      params.coachUid,
      p_coach_name:     params.coachName,
      p_coins:          params.coins,
      p_message:        params.message,
    });

    if (error) throw error;

    const result = data as { success: boolean; remaining_balance?: number; error?: string };
    if (!result.success) {
      return { success: false, error: result.error ?? 'Transaction failed' };
    }
    return { success: true, remainingBalance: result.remaining_balance };
  } catch (e: any) {
    console.warn('[walletService] hireCoachWithCoins error:', e);
    return { success: false, error: e?.message ?? 'Coach hiring failed' };
  }
}

// ── Request Coach Payout (for coaches) ────────────────────────────────────

export async function requestCoachPayout(params: {
  coachUid: string;
  coins: number;
  amountFiat: number;
  currency: string;
  method: 'telebirr' | 'cbe_birr' | 'paypal' | 'bank_wire';
  accountDetails: {
    accountNumber?: string;
    accountName?: string;
    paypalEmail?: string;
    iban?: string;
    swiftBic?: string;
  };
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Deduct from wallet
    const { data: walletData } = await supabase
      .from('wallets')
      .select('balance_coins')
      .eq('user_id', params.coachUid)
      .single();

    if (!walletData || walletData.balance_coins < params.coins) {
      return { success: false, error: 'INSUFFICIENT_COINS' };
    }

    // Deduct coins
    const { error: deductErr } = await supabase
      .from('wallets')
      .update({
        balance_coins: walletData.balance_coins - params.coins,
        pending_payout_etb: params.currency === 'ETB' ? params.amountFiat : 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', params.coachUid);

    if (deductErr) throw deductErr;

    const accIdentifier = params.accountDetails.paypalEmail ||
      params.accountDetails.accountNumber ||
      params.accountDetails.iban ||
      'Account';

    // Insert payout request
    const { error: reqErr } = await supabase
      .from('payout_requests')
      .insert({
        coach_uid:      params.coachUid,
        coins_deducted: params.coins,
        amount_etb:     params.amountFiat,
        currency:       params.currency,
        payment_method: params.method,
        account_number: params.accountDetails.accountNumber || '',
        account_name:   params.accountDetails.accountName || '',
        paypal_email:   params.accountDetails.paypalEmail || null,
        iban:           params.accountDetails.iban || null,
        swift_bic:      params.accountDetails.swiftBic || null,
        status:         'pending',
      });

    if (reqErr) throw reqErr;

    // Record transaction
    await supabase.from('coin_transactions').insert({
      user_id:        params.coachUid,
      type:           'payout',
      amount_coins:   -params.coins,
      amount_etb:     params.amountFiat,
      currency:       params.currency,
      payment_method: params.method,
      status:         'pending',
      description:    `Payout via ${params.method.toUpperCase()} (${accIdentifier})`,
    });

    return { success: true };
  } catch (e: any) {
    console.warn('[walletService] requestCoachPayout error:', e);
    return { success: false, error: e?.message ?? 'Payout request failed' };
  }
}
