import { supabase } from './supabase';

export interface CeoUserItem {
  uid: string;
  name: string;
  username?: string | null;
  email?: string | null;
  role: 'user' | 'coach' | 'admin' | 'guest';
  avatar_url?: string | null;
  city?: string | null;
  created_at?: string;
  coins: number;
  isPro: boolean;
  errorCount: number;
  latestErrorMessage?: string;
  trustScore: number;
  trustBadge: 'Verified Human' | 'Low Activity' | 'Suspected Bot';
  trustReasons: string[];
}

const GENERIC_NAMES = new Set(['trainee', 'user', 'athlete', 'a user', 'member', 'fitpulse user']);

/**
 * Calculate authenticity and bot probability score (0 - 100)
 */
export function calculateUserTrustScore(
  profile: { name?: string | null; email?: string | null; avatar_url?: string | null; city?: string | null; role?: string },
  wallet?: { balance_coins?: number; pro_until?: string | null } | null,
  errorCount: number = 0
): { score: number; badge: 'Verified Human' | 'Low Activity' | 'Suspected Bot'; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const name = (profile.name || '').trim();
  const isGeneric = !name || GENERIC_NAMES.has(name.toLowerCase());

  // 1. Name Check (Max 25 pts)
  if (!isGeneric && name.length >= 3) {
    score += 25;
    reasons.push('Real custom display name set');
  } else {
    reasons.push('Default/generic account name detected');
  }

  // 2. Avatar Check (Max 25 pts)
  const avatar = profile.avatar_url || '';
  if (avatar && !avatar.includes('dicebear') && !avatar.includes('placeholder')) {
    score += 25;
    reasons.push('Custom profile picture uploaded');
  } else {
    reasons.push('Default or missing profile photo');
  }

  // 3. Email Validity (Max 20 pts)
  const email = (profile.email || '').trim().toLowerCase();
  if (email && email.includes('@') && email.length > 5) {
    score += 20;
    reasons.push('Verified email address linked');
  } else {
    reasons.push('No email address bound');
  }

  // 4. Wallet / Coins / Pro Status (Max 20 pts)
  const coins = wallet?.balance_coins || 0;
  const isPro = !!(wallet?.pro_until && new Date(wallet.pro_until) > new Date());
  if (isPro) {
    score += 20;
    reasons.push('Active Pro Membership subscriber');
  } else if (coins > 0) {
    score += 15;
    reasons.push(`Active coin balance (${coins} coins)`);
  }

  // 5. Profile Enrichment (Max 10 pts)
  if (profile.city || profile.role === 'coach') {
    score += 10;
    reasons.push(profile.role === 'coach' ? 'Registered Coach profile' : `Location specified (${profile.city})`);
  }

  // Determine Badge Tier
  let badge: 'Verified Human' | 'Low Activity' | 'Suspected Bot';
  if (score >= 65) {
    badge = 'Verified Human';
  } else if (score >= 35) {
    badge = 'Low Activity';
  } else {
    badge = 'Suspected Bot';
  }

  return { score, badge, reasons };
}

/**
 * Fetch all registered users with real-time error counts, coin balances, and bot detection
 */
export async function fetchAllUsersWithMetrics(): Promise<CeoUserItem[]> {
  try {
    // 1. Fetch profiles
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (pErr) {
      console.warn('Profiles fetch error:', pErr);
      return [];
    }

    // 2. Fetch wallets
    const { data: wallets } = await supabase
      .from('wallets')
      .select('user_id, balance_coins, pro_until');

    const walletMap: Record<string, { balance_coins: number; pro_until: string | null }> = {};
    if (wallets) {
      wallets.forEach((w: any) => {
        if (w.user_id) walletMap[w.user_id] = w;
      });
    }

    // 3. Fetch recent system errors to map crash counts per user
    const { data: errors } = await supabase
      .from('system_errors')
      .select('user_uid, user_email, error_message, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    const errorCountMap: Record<string, number> = {};
    const latestErrorMap: Record<string, string> = {};

    if (errors) {
      errors.forEach((err: any) => {
        const uid = err.user_uid;
        if (uid && uid !== 'anonymous') {
          errorCountMap[uid] = (errorCountMap[uid] || 0) + 1;
          if (!latestErrorMap[uid]) {
            latestErrorMap[uid] = err.error_message;
          }
        }
      });
    }

    // 4. Combine and compute trust metrics
    const items: CeoUserItem[] = (profiles || []).map((p: any) => {
      const wallet = walletMap[p.uid] || null;
      const coins = wallet?.balance_coins || 0;
      const isPro = !!(wallet?.pro_until && new Date(wallet.pro_until) > new Date());
      const errCount = errorCountMap[p.uid] || 0;
      const latestMsg = latestErrorMap[p.uid] || undefined;

      const { score, badge, reasons } = calculateUserTrustScore(p, wallet, errCount);

      return {
        uid: p.uid,
        name: p.name || 'Member',
        username: p.username || null,
        email: p.email || null,
        role: (p.role as any) || 'user',
        avatar_url: p.avatar_url || null,
        city: p.city || null,
        created_at: p.created_at || undefined,
        coins,
        isPro,
        errorCount: errCount,
        latestErrorMessage: latestMsg,
        trustScore: score,
        trustBadge: badge,
        trustReasons: reasons,
      };
    });

    return items;
  } catch (e) {
    console.warn('fetchAllUsersWithMetrics exception:', e);
    return [];
  }
}

/**
 * CEO Goodwill Action: Grant compensatory FitPulse coins directly to a user affected by errors
 */
export async function grantCompensationCoins(
  userUid: string,
  amountCoins: number,
  reason: string = 'CEO Service Goodwill'
): Promise<{ success: boolean; message: string }> {
  if (!userUid || amountCoins <= 0) {
    return { success: false, message: 'Invalid UID or coin amount.' };
  }

  try {
    // 1. Attempt RPC first
    const { error: rpcErr } = await supabase.rpc('topup_user_wallet', {
      p_user_id: userUid,
      p_coins: amountCoins,
      p_etb_amount: 0,
      p_currency: 'ETB',
      p_gateway: 'CEO_DIRECT_CREDIT',
      p_description: `CEO Goodwill Compensation: ${reason}`,
    });

    if (!rpcErr) {
      return { success: true, message: `Successfully credited ${amountCoins} coins to user.` };
    }

    // 2. Fallback direct update to wallets table
    const { data: curWallet } = await supabase
      .from('wallets')
      .select('balance_coins')
      .eq('user_id', userUid)
      .maybeSingle();

    const newBal = (curWallet?.balance_coins || 0) + amountCoins;
    const { error: upsertErr } = await supabase.from('wallets').upsert({
      user_id: userUid,
      balance_coins: newBal,
      updated_at: new Date().toISOString(),
    });

    if (upsertErr) {
      return { success: false, message: upsertErr.message };
    }

    // Also record transaction in coin_transactions
    await supabase.from('coin_transactions').insert([
      {
        user_id: userUid,
        type: 'topup',
        amount_coins: amountCoins,
        amount_etb: 0,
        currency: 'ETB',
        payment_gateway: 'CEO_DIRECT_CREDIT',
        status: 'completed',
        description: `CEO Goodwill Compensation: ${reason}`,
      },
    ]);

    return { success: true, message: `Successfully credited ${amountCoins} coins to user.` };
  } catch (e: any) {
    return { success: false, message: e.message || 'Failed to grant compensation coins.' };
  }
}
