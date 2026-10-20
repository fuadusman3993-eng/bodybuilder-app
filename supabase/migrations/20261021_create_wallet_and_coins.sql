-- ============================================================================
-- FitPulse Wallet & Coin Economy — Supabase SQL Migration
-- Rate: 1 ETB = 1 FitPulse Coin
-- Run this in: Supabase Dashboard > SQL Editor > Run
-- ============================================================================

-- 1. Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
    user_id TEXT PRIMARY KEY,
    balance_coins INTEGER NOT NULL DEFAULT 0 CHECK (balance_coins >= 0),
    lifetime_earnings_coins INTEGER NOT NULL DEFAULT 0,
    pending_payout_etb NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Coin Transactions (Immutable Audit Ledger)
CREATE TABLE IF NOT EXISTS public.coin_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('topup', 'spend_coach', 'spend_plan', 'spend_subscription', 'coach_earning', 'payout', 'tip')),
    amount_coins INTEGER NOT NULL,
    amount_etb NUMERIC(10, 2) DEFAULT 0.00,
    related_coach_uid TEXT,
    related_entity_id TEXT,
    payment_method TEXT DEFAULT 'fitpulse_coin',
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Payout Requests (Coaches cashing out earnings)
CREATE TABLE IF NOT EXISTS public.payout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_uid TEXT NOT NULL,
    coins_deducted INTEGER NOT NULL,
    amount_etb NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('telebirr', 'cbe_birr')),
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON public.coin_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payout_requests_coach ON public.payout_requests (coach_uid, created_at DESC);

-- 5. Atomic Wallet Top-Up Function
CREATE OR REPLACE FUNCTION public.topup_user_wallet(
    p_uid TEXT,
    p_coins INTEGER,
    p_etb NUMERIC,
    p_payment_method TEXT,
    p_ref TEXT
) RETURNS JSONB AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    INSERT INTO public.wallets (user_id, balance_coins, updated_at)
    VALUES (p_uid, p_coins, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET balance_coins = public.wallets.balance_coins + p_coins,
        updated_at = NOW()
    RETURNING balance_coins INTO v_new_balance;

    INSERT INTO public.coin_transactions
        (user_id, type, amount_coins, amount_etb, payment_method, status, description)
    VALUES
        (p_uid, 'topup', p_coins, p_etb, p_payment_method, 'completed', 'Wallet Top-up: ' || p_ref);

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Atomic Coach Hire Function (Prevents double-spending with row lock)
CREATE OR REPLACE FUNCTION public.hire_coach_with_coins(
    p_trainee_uid TEXT,
    p_trainee_name TEXT,
    p_trainee_avatar TEXT,
    p_coach_uid TEXT,
    p_coach_name TEXT,
    p_coins INTEGER,
    p_message TEXT
) RETURNS JSONB AS $$
DECLARE
    v_trainee_balance INTEGER;
    v_platform_fee_percent NUMERIC := 0.10;
    v_coach_coins INTEGER;
BEGIN
    -- Lock trainee wallet row to prevent race conditions
    SELECT balance_coins INTO v_trainee_balance
    FROM public.wallets
    WHERE user_id = p_trainee_uid
    FOR UPDATE;

    IF v_trainee_balance IS NULL OR v_trainee_balance < p_coins THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INSUFFICIENT_COINS',
            'current_balance', COALESCE(v_trainee_balance, 0)
        );
    END IF;

    -- Deduct from trainee
    UPDATE public.wallets
    SET balance_coins = balance_coins - p_coins,
        updated_at = NOW()
    WHERE user_id = p_trainee_uid;

    INSERT INTO public.coin_transactions (user_id, type, amount_coins, related_coach_uid, description, status)
    VALUES (p_trainee_uid, 'spend_coach', -p_coins, p_coach_uid, 'Hired Coach ' || p_coach_name, 'completed');

    -- Credit coach (90% after 10% platform fee)
    v_coach_coins := ROUND(p_coins * (1 - v_platform_fee_percent));

    INSERT INTO public.wallets (user_id, balance_coins, lifetime_earnings_coins, updated_at)
    VALUES (p_coach_uid, v_coach_coins, v_coach_coins, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET balance_coins = public.wallets.balance_coins + v_coach_coins,
        lifetime_earnings_coins = public.wallets.lifetime_earnings_coins + v_coach_coins,
        updated_at = NOW();

    INSERT INTO public.coin_transactions (user_id, type, amount_coins, related_coach_uid, description, status)
    VALUES (p_coach_uid, 'coach_earning', v_coach_coins, p_trainee_uid, 'Client booking from ' || p_trainee_name, 'completed');

    -- Create coach_request record
    INSERT INTO public.coach_requests (trainee_uid, trainee_name, trainee_avatar, coach_uid, status, message)
    VALUES (p_trainee_uid, p_trainee_name, p_trainee_avatar, p_coach_uid, 'pending', p_message);

    RETURN jsonb_build_object(
        'success', true,
        'remaining_balance', v_trainee_balance - p_coins
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant permissions (Supabase anon + authenticated roles)
GRANT SELECT, INSERT, UPDATE ON public.wallets TO anon, authenticated;
GRANT SELECT, INSERT ON public.coin_transactions TO anon, authenticated;
GRANT SELECT, INSERT ON public.payout_requests TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.topup_user_wallet TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hire_coach_with_coins TO anon, authenticated;
