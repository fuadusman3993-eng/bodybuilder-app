import { supabase } from './supabase';

export interface CeoUserTxItem {
  id: string;
  type: string;
  amount_coins: number;
  amount_etb: number;
  payment_gateway?: string;
  status: string;
  description?: string;
  created_at: string;
}

export interface CeoUserErrorItem {
  id?: string;
  component?: string;
  error_message: string;
  created_at?: string;
}

export interface CeoUserItem {
  uid: string;
  name: string;
  username?: string | null;
  email?: string | null;
  role: 'user' | 'coach' | 'admin' | 'guest';
  avatar_url?: string | null;
  city?: string | null;
  country?: string | null;
  bio?: string | null;
  created_at?: string;
  updated_at?: string;
  coins: number;
  isPro: boolean;
  proUntil?: string | null;
  lifetimeSpentEtb: number;
  lifetimeCoinsBought: number;
  totalTransactionsCount: number;
  postsCount: number;
  storiesCount: number;
  followersCount: number;
  followingCount: number;
  coachRequestStatus?: string | null;
  errorCount: number;
  latestErrorMessage?: string;
  userErrors: CeoUserErrorItem[];
  userTransactions: CeoUserTxItem[];
  trustScore: number;
  trustBadge: 'Verified Human' | 'Low Activity' | 'Suspected Bot';
  trustReasons: string[];
}

const GENERIC_NAMES = new Set(['trainee', 'user', 'athlete', 'a user', 'member', 'fitpulse user']);

/**
 * Organic Authenticity & Bot Detection Algorithm:
 * A user who has PAID any amount of ETB is automatically NOT a bot.
 * Evaluates real human signals across identity, activity, and engagement.
 */
export function calculateUserTrustScore(
  profile: {
    name?: string | null;
    username?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    city?: string | null;
    bio?: string | null;
    role?: string;
    created_at?: string;
  },
  activity: {
    postsCount: number;
    storiesCount: number;
    followersCount: number;
    followingCount: number;
    hasCoachRelation: boolean;
  },
  financials: {
    coins: number;
    isPro: boolean;
    lifetimeSpentEtb: number;
  }
): { score: number; badge: 'Verified Human' | 'Low Activity' | 'Suspected Bot'; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const name = (profile.name || '').trim();
  const isGeneric = !name || GENERIC_NAMES.has(name.toLowerCase());

  // ── RULE 0: ABSOLUTE OVERRIDE ──────────────────────────────────────
  // Any user who has ever paid real money CAN'T be a bot.
  // Bank payment requires a real human with ID/biometrics.
  if (financials.lifetimeSpentEtb > 0) {
    score += 50; // Guaranteed baseline to at least "Low Activity"
    reasons.push(`✅ Verified paying customer — ${financials.lifetimeSpentEtb} ETB paid via Chapa/Bank (real human confirmed)`);
  }

  // ── 1. Real Display Name & Identity (Max 25 pts) ──────────────────
  if (!isGeneric && name.length >= 2) {
    score += 20;
    reasons.push('Custom display name set');
  } else {
    reasons.push('Generic or missing display name (e.g. "Athlete")');
  }

  if (profile.username && profile.username.trim().length >= 3) {
    score += 5;
    reasons.push(`Custom username handle (@${profile.username})`);
  }

  // ── 2. Profile Photo / Custom Avatar (Max 20 pts) ─────────────────
  const avatar = profile.avatar_url || '';
  if (avatar && !avatar.includes('dicebear') && !avatar.includes('placeholder')) {
    score += 20;
    reasons.push('Real custom profile photo uploaded');
  } else {
    reasons.push('Default or missing avatar photo');
  }

  // ── 3. Contact & Location Information (Max 20 pts) ────────────────
  const email = (profile.email || '').trim().toLowerCase();
  if (email && email.includes('@') && email.length > 5) {
    score += 15;
    reasons.push('Verified email address linked');
  } else {
    reasons.push('No email address registered');
  }

  if (profile.city || profile.bio) {
    score += 5;
    reasons.push(profile.city ? `Location: ${profile.city}` : 'Bio description filled');
  }

  // ── 4. Free App Activity & Social Engagement (Max 15 pts) ─────────
  if (activity.postsCount > 0 || activity.storiesCount > 0) {
    score += 8;
    reasons.push(`Active content creator (${activity.postsCount} posts, ${activity.storiesCount} stories)`);
  }

  if (activity.followersCount > 0 || activity.followingCount > 0 || activity.hasCoachRelation) {
    score += 7;
    reasons.push('Community connected (followers/following/coach relation)');
  }

  // ── 5. Additional Financial Confirmation (Max 10 pts bonus) ────────
  if (financials.isPro) {
    score += 10;
    reasons.push('Active Pro Membership subscriber');
  } else if (financials.coins > 0 && financials.lifetimeSpentEtb === 0) {
    // Coins without payment — could be gifted coins
    score += 5;
    reasons.push(`Holds ${financials.coins} coins in wallet`);
  }

  const finalScore = Math.min(score, 100);

  // ── Badge Tier Assignment ──────────────────────────────────────────
  // IMPORTANT: NEVER label a paying customer as Suspected Bot
  let badge: 'Verified Human' | 'Low Activity' | 'Suspected Bot';
  if (financials.lifetimeSpentEtb > 0 || finalScore >= 50) {
    // Paying customers + high-score users
    badge = finalScore >= 65 ? 'Verified Human' : 'Low Activity';
  } else if (finalScore >= 25) {
    badge = 'Low Activity';
  } else {
    badge = 'Suspected Bot';
  }

  return { score: finalScore, badge, reasons };
}

/**
 * Fetch all registered users with complete financial totals, saved items, and crash logs
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
      .select('user_id, balance_coins, pro_until, updated_at');

    const walletMap: Record<string, { balance_coins: number; pro_until: string | null }> = {};
    if (wallets) {
      wallets.forEach((w: any) => {
        if (w.user_id) walletMap[w.user_id] = w;
      });
    }

    // 3. Fetch all coin transactions to calculate lifetime spend per user
    const { data: allTxs } = await supabase
      .from('coin_transactions')
      .select('id, user_id, type, amount_coins, amount_etb, payment_gateway, status, description, created_at')
      .order('created_at', { ascending: false });

    const userSpendMap: Record<
      string,
      { totalSpentEtb: number; totalCoinsBought: number; count: number; txs: CeoUserTxItem[] }
    > = {};

    if (allTxs) {
      allTxs.forEach((tx: any) => {
        const uid = tx.user_id;
        if (!uid) return;
        if (!userSpendMap[uid]) {
          userSpendMap[uid] = { totalSpentEtb: 0, totalCoinsBought: 0, count: 0, txs: [] };
        }
        userSpendMap[uid].count++;
        userSpendMap[uid].txs.push({
          id: tx.id,
          type: tx.type || 'topup',
          amount_coins: tx.amount_coins || 0,
          amount_etb: tx.amount_etb || 0,
          payment_gateway: tx.payment_gateway || 'chapa',
          status: tx.status || 'completed',
          description: tx.description || 'Coin Bundle Purchase',
          created_at: tx.created_at || new Date().toISOString(),
        });

        if (tx.status === 'completed') {
          userSpendMap[uid].totalSpentEtb += tx.amount_etb || 0;
          if (tx.type === 'topup') {
            userSpendMap[uid].totalCoinsBought += tx.amount_coins || 0;
          }
        }
      });
    }

    // 4. Fetch activity data: posts, stories, follows, coach_requests
    const [postsRes, storiesRes, followsRes, coachReqsRes] = await Promise.all([
      supabase.from('posts').select('id, uid').limit(300),
      supabase.from('stories').select('id, uid').limit(150),
      supabase.from('follows').select('follower_uid, following_uid'),
      supabase.from('coach_requests').select('trainee_uid, coach_uid, status'),
    ]);

    const postsCountMap: Record<string, number> = {};
    if (postsRes.data) {
      postsRes.data.forEach((p: any) => {
        if (p.uid) postsCountMap[p.uid] = (postsCountMap[p.uid] || 0) + 1;
      });
    }

    const storiesCountMap: Record<string, number> = {};
    if (storiesRes.data) {
      storiesRes.data.forEach((s: any) => {
        if (s.uid) storiesCountMap[s.uid] = (storiesCountMap[s.uid] || 0) + 1;
      });
    }

    const followersCountMap: Record<string, number> = {};
    const followingCountMap: Record<string, number> = {};
    if (followsRes.data) {
      followsRes.data.forEach((f: any) => {
        if (f.following_uid) followersCountMap[f.following_uid] = (followersCountMap[f.following_uid] || 0) + 1;
        if (f.follower_uid) followingCountMap[f.follower_uid] = (followingCountMap[f.follower_uid] || 0) + 1;
      });
    }

    const coachRelationMap: Record<string, string> = {};
    if (coachReqsRes.data) {
      coachReqsRes.data.forEach((cr: any) => {
        if (cr.trainee_uid) coachRelationMap[cr.trainee_uid] = cr.status || 'pending';
      });
    }

    // 5. Fetch system errors per user
    const { data: errors } = await supabase
      .from('system_errors')
      .select('id, user_uid, user_email, error_message, component, created_at')
      .order('created_at', { ascending: false })
      .limit(300);

    const userErrorsMap: Record<string, CeoUserErrorItem[]> = {};
    if (errors) {
      errors.forEach((err: any) => {
        const uid = err.user_uid;
        if (uid && uid !== 'anonymous') {
          if (!userErrorsMap[uid]) userErrorsMap[uid] = [];
          userErrorsMap[uid].push({
            id: err.id,
            component: err.component,
            error_message: err.error_message,
            created_at: err.created_at,
          });
        }
      });
    }

    // 6. Build the comprehensive CeoUserItem list
    const items: CeoUserItem[] = (profiles || []).map((p: any) => {
      const wallet = walletMap[p.uid] || null;
      const coins = wallet?.balance_coins || 0;
      const isPro = !!(wallet?.pro_until && new Date(wallet.pro_until) > new Date());
      const proUntil = wallet?.pro_until || null;

      const spend = userSpendMap[p.uid] || { totalSpentEtb: 0, totalCoinsBought: 0, count: 0, txs: [] };
      const postsCount = postsCountMap[p.uid] || 0;
      const storiesCount = storiesCountMap[p.uid] || 0;
      const followersCount = followersCountMap[p.uid] || 0;
      const followingCount = followingCountMap[p.uid] || 0;
      const coachRelation = coachRelationMap[p.uid] || null;

      const userErrors = userErrorsMap[p.uid] || [];
      const errorCount = userErrors.length;
      const latestMsg = userErrors[0]?.error_message || undefined;

      const { score, badge, reasons } = calculateUserTrustScore(
        p,
        {
          postsCount,
          storiesCount,
          followersCount,
          followingCount,
          hasCoachRelation: !!coachRelation,
        },
        {
          coins,
          isPro,
          lifetimeSpentEtb: spend.totalSpentEtb,
        }
      );

      return {
        uid: p.uid,
        name: p.name || 'Member',
        username: p.username || null,
        email: p.email || null,
        role: (p.role as any) || 'user',
        avatar_url: p.avatar_url || null,
        city: p.city || null,
        country: p.country || null,
        bio: p.bio || null,
        created_at: p.created_at || undefined,
        updated_at: p.updated_at || undefined,
        coins,
        isPro,
        proUntil,
        lifetimeSpentEtb: spend.totalSpentEtb,
        lifetimeCoinsBought: spend.totalCoinsBought,
        totalTransactionsCount: spend.count,
        postsCount,
        storiesCount,
        followersCount,
        followingCount,
        coachRequestStatus: coachRelation,
        errorCount,
        latestErrorMessage: latestMsg,
        userErrors,
        userTransactions: spend.txs,
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
