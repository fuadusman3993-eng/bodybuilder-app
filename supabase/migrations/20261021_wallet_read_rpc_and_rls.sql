-- ============================================================================
-- FitPulse Wallet Read Functions & RLS Policies
-- Run this in: Supabase Dashboard > SQL Editor > Run
-- ============================================================================

-- 1. Permissive Read Policy for public.wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'wallets' AND policyname = 'Allow public read wallets'
    ) THEN
        CREATE POLICY "Allow public read wallets" ON public.wallets FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'wallets' AND policyname = 'Allow public update wallets'
    ) THEN
        CREATE POLICY "Allow public update wallets" ON public.wallets FOR UPDATE USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'wallets' AND policyname = 'Allow public insert wallets'
    ) THEN
        CREATE POLICY "Allow public insert wallets" ON public.wallets FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- 2. Permissive Read Policy for public.coin_transactions
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'coin_transactions' AND policyname = 'Allow public read coin_transactions'
    ) THEN
        CREATE POLICY "Allow public read coin_transactions" ON public.coin_transactions FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'coin_transactions' AND policyname = 'Allow public insert coin_transactions'
    ) THEN
        CREATE POLICY "Allow public insert coin_transactions" ON public.coin_transactions FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- 3. Security Definer RPC: get_user_wallet
-- Guarantees wallet retrieval even if RLS blocks anonymous SELECT
CREATE OR REPLACE FUNCTION public.get_user_wallet(p_uid TEXT)
RETURNS JSONB AS $$
DECLARE
    v_wallet RECORD;
BEGIN
    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_uid;
    IF NOT FOUND THEN
        INSERT INTO public.wallets (user_id, balance_coins, lifetime_earnings_coins, pending_payout_etb, updated_at)
        VALUES (p_uid, 0, 0, 0.00, NOW())
        RETURNING * INTO v_wallet;
    END IF;
    RETURN to_jsonb(v_wallet);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Security Definer RPC: get_user_coin_transactions
-- Guarantees transaction history retrieval regardless of RLS
CREATE OR REPLACE FUNCTION public.get_user_coin_transactions(p_uid TEXT, p_limit INT DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
    v_txs JSONB;
BEGIN
    SELECT jsonb_agg(t) INTO v_txs
    FROM (
        SELECT 
            id,
            user_id,
            type,
            amount_coins,
            amount_etb,
            currency,
            payment_gateway,
            related_coach_uid,
            related_entity_id,
            payment_method,
            status,
            description,
            created_at
        FROM public.coin_transactions
        WHERE user_id = p_uid
        ORDER BY created_at DESC
        LIMIT p_limit
    ) t;
    RETURN COALESCE(v_txs, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant Permissions
GRANT EXECUTE ON FUNCTION public.get_user_wallet TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_coin_transactions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.wallets TO anon, authenticated;
GRANT SELECT, INSERT ON public.coin_transactions TO anon, authenticated;
