import { createClient } from '@supabase/supabase-js';

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-XHiEtj7PlQ76enOi1zUzPO9hR1zEmmXo';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eweoydtpchrmnoinyute.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_LKU29Jh-jtD9DnlDqE0Y0Q_rFFL_lhg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const txRef = req.query.tx_ref || req.body?.tx_ref;
  const uid = req.query.uid || req.body?.uid;
  const coinsParam = req.query.coins || req.body?.coins;

  if (!txRef) {
    return res.status(400).json({ error: 'tx_ref is required' });
  }

  try {
    // 1. Verify directly with Chapa API
    const verifyRes = await fetch(`https://api.chapa.co/v1/transaction/verify/${txRef}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
      },
    });

    const data = await verifyRes.json();

    if (data.status !== 'success' || data.data?.status !== 'success') {
      return res.status(400).json({
        success: false,
        verified: false,
        message: data.message || 'Payment not verified or not completed yet',
        details: data,
      });
    }

    const verifiedAmount = parseFloat(data.data.amount) || 0;
    const coinsToAdd = coinsParam ? parseInt(coinsParam, 10) : Math.round(verifiedAmount);

    // 2. Prevent duplicate crediting if already credited
    const { data: existingTx } = await supabase
      .from('coin_transactions')
      .select('id, status')
      .eq('description', `Chapa Ref: ${txRef}`)
      .maybeSingle();

    if (existingTx) {
      return res.status(200).json({
        success: true,
        alreadyProcessed: true,
        message: 'Payment was already processed',
        coins: coinsToAdd,
      });
    }

    // 3. Resolve Full UID (from query, body, Chapa meta, or txRef prefix lookup)
    let finalUid = uid || data.data?.meta?.uid;
    if (!finalUid && txRef) {
      const match = txRef.match(/^fp-chapa-([a-zA-Z0-9_-]+)-\d+$/);
      if (match && match[1]) {
        const candidate = match[1];
        if (candidate.length >= 20) {
          finalUid = candidate;
        } else {
          // If truncated 8-character prefix, resolve full UID from coach_profiles
          const { data: coachMatch } = await supabase
            .from('coach_profiles')
            .select('uid')
            .ilike('uid', `${candidate}%`)
            .maybeSingle();
          finalUid = coachMatch?.uid || candidate;
        }
      }
    }

    // 4. Credit coins to user wallet via Supabase RPC
    if (finalUid) {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('topup_user_wallet', {
        p_uid: finalUid,
        p_coins: coinsToAdd,
        p_etb: verifiedAmount,
        p_payment_method: 'chapa:ETB',
        p_ref: txRef,
      });

      if (rpcError) {
        console.error('[chapa-verify] RPC Error:', rpcError);
        return res.status(500).json({ error: 'Failed to credit wallet', details: rpcError });
      }

      return res.status(200).json({
        success: true,
        verified: true,
        uid: finalUid,
        newBalance: rpcResult?.new_balance,
        coins: coinsToAdd,
        amount: verifiedAmount,
        message: `Successfully added ${coinsToAdd} coins!`,
      });
    }

    return res.status(200).json({
      success: true,
      verified: true,
      coins: coinsToAdd,
      amount: verifiedAmount,
    });
  } catch (error: any) {
    console.error('[chapa-verify] Error:', error);
    return res.status(500).json({ error: error.message || 'Verification failed' });
  }
}
