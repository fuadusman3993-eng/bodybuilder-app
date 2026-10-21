-- ============================================================================
-- FitPulse International Multi-Currency & Pro Subscription Migration
-- Run this in: Supabase Dashboard > SQL Editor > Run
-- ============================================================================

-- 1. Extend Wallets with Currency & Pro Subscription Columns
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'ETB',
ADD COLUMN IF NOT EXISTS pro_until TIMESTAMPTZ;

-- 2. Extend Coin Transactions with Currency & Gateway
ALTER TABLE public.coin_transactions 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ETB',
ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'internal';

-- 3. Extend Payout Requests for Global Methods (PayPal, IBAN/SWIFT)
ALTER TABLE public.payout_requests 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ETB',
ADD COLUMN IF NOT EXISTS paypal_email TEXT,
ADD COLUMN IF NOT EXISTS iban TEXT,
ADD COLUMN IF NOT EXISTS swift_bic TEXT;

-- 4. Atomic Pro Subscription Activation (Prevents double spending with row lock)
CREATE OR REPLACE FUNCTION public.activate_pro_subscription(
    p_uid TEXT,
    p_duration_days INTEGER,
    p_coins_cost INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_balance INTEGER;
    v_current_pro TIMESTAMPTZ;
    v_new_pro TIMESTAMPTZ;
BEGIN
    -- Lock wallet row
    SELECT balance_coins, pro_until INTO v_balance, v_current_pro
    FROM public.wallets
    WHERE user_id = p_uid
    FOR UPDATE;

    IF v_balance IS NULL OR v_balance < p_coins_cost THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'INSUFFICIENT_COINS', 
            'current_balance', COALESCE(v_balance, 0)
        );
    END IF;

    -- Calculate new pro expiry date (extend if already active)
    IF v_current_pro IS NOT NULL AND v_current_pro > NOW() THEN
        v_new_pro := v_current_pro + (p_duration_days || ' days')::INTERVAL;
    ELSE
        v_new_pro := NOW() + (p_duration_days || ' days')::INTERVAL;
    END IF;

    -- Deduct coins and update pro status
    UPDATE public.wallets
    SET balance_coins = balance_coins - p_coins_cost,
        pro_until = v_new_pro,
        updated_at = NOW()
    WHERE user_id = p_uid;

    -- Record transaction
    INSERT INTO public.coin_transactions 
        (user_id, type, amount_coins, description, status, payment_gateway, currency)
    VALUES 
        (p_uid, 'spend_subscription', -p_coins_cost, 'Upgraded to FitPulse Pro (' || p_duration_days || ' days)', 'completed', 'fitpulse_coins', 'COIN');

    RETURN jsonb_build_object(
        'success', true, 
        'remaining_balance', v_balance - p_coins_cost, 
        'pro_until', v_new_pro
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Permissions
GRANT EXECUTE ON FUNCTION public.activate_pro_subscription TO anon, authenticated;
