import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eweoydtpchrmnoinyute.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_LKU29Jh-jtD9DnlDqE0Y0Q_rFFL_lhg';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-XHiEtj7PlQ76enOi1zUzPO9hR1zEmmXo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    const txRef = payload?.tx_ref;

    if (!txRef) {
      return res.status(400).json({ error: 'tx_ref missing from webhook' });
    }

    // Verify with Chapa API
    const verifyRes = await fetch(`https://api.chapa.co/v1/transaction/verify/${txRef}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
      },
    });

    const verifyData = await verifyRes.json();

    if (verifyData.status !== 'success' || verifyData.data?.status !== 'success') {
      return res.status(400).json({ error: 'Transaction not verified' });
    }

    const amount = parseFloat(verifyData.data.amount) || 0;
    const coins = Math.round(amount);

    // Prevent duplicate crediting if already processed by chapa-verify
    const { data: existingTx } = await supabase
      .from('coin_transactions')
      .select('id')
      .ilike('description', `%${txRef}%`)
      .limit(1);

    if (existingTx && existingTx.length > 0) {
      return res.status(200).json({ received: true, alreadyProcessed: true });
    }

    // Extract uid from tx_ref: fp-[safeUid]-[timestamp] or fp-chapa-[safeUid]-[timestamp]
    const match = txRef.match(/^fp(?:-chapa)?-([a-zA-Z0-9_-]+)-\d+$/);
    const safeUid = match ? match[1] : null;

    if (safeUid) {
      // Find matching user in wallets table
      const { data: matchedWallet } = await supabase
        .from('wallets')
        .select('user_id')
        .ilike('user_id', `${safeUid}%`)
        .maybeSingle();

      if (matchedWallet) {
        await supabase.rpc('topup_user_wallet', {
          p_uid: matchedWallet.user_id,
          p_coins: coins,
          p_etb: amount,
          p_payment_method: 'chapa_webhook:ETB',
          p_ref: txRef,
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[chapa-webhook] Error:', error);
    return res.status(500).json({ error: error.message || 'Webhook processing failed' });
  }
}
