const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-XHiEtj7PlQ76enOi1zUzPO9hR1zEmmXo';

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { uid, coins, amount, email, firstName, lastName, phone, returnUrl } = req.body;

    if (!uid || !coins || !amount) {
      return res.status(400).json({ error: 'Missing required fields: uid, coins, amount' });
    }

    const safeUid = String(uid).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    const txRef = `fp-chapa-${safeUid}-${Date.now()}`;

    const baseUrl = req.headers.origin || 'https://bodybuilder-app-phi.vercel.app';
    const finalReturnUrl = returnUrl || `${baseUrl}/wallet?chapa_status=verify&tx_ref=${txRef}&coins=${coins}&amount=${amount}`;
    const callbackUrl = `${baseUrl}/api/chapa-webhook`;

    const chapaPayload = {
      amount: String(amount),
      currency: 'ETB',
      email: email || 'athlete@fitpulse.app',
      first_name: firstName || 'FitPulse',
      last_name: lastName || 'Athlete',
      phone_number: phone || undefined,
      tx_ref: txRef,
      callback_url: callbackUrl,
      return_url: finalReturnUrl,
      customization: {
        title: 'FitPulse Coins',
        description: `Purchase of ${coins} FitPulse Coins`,
      },
    };

    const chapaRes = await fetch('https://api.chapa.co/v1/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chapaPayload),
    });

    const data = await chapaRes.json();

    if (data.status !== 'success' || !data.data?.checkout_url) {
      return res.status(400).json({
        error: data.message || 'Failed to initialize Chapa transaction',
        details: data,
      });
    }

    return res.status(200).json({
      success: true,
      checkoutUrl: data.data.checkout_url,
      txRef,
    });
  } catch (error: any) {
    console.error('[chapa-initialize] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
