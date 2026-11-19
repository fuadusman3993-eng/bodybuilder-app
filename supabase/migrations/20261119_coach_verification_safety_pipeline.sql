-- ==============================================================================
-- FitPulse Coach Verification & Athlete Safety Pipeline Migration
-- ==============================================================================

-- 1. Add verification and credential columns to public.coach_profiles
ALTER TABLE public.coach_profiles 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS certificate_url TEXT,
ADD COLUMN IF NOT EXISTS id_card_url TEXT,
ADD COLUMN IF NOT EXISTS institution_name TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS has_first_aid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS safety_agreement_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Index on verification_status for high-performance filtering
CREATE INDEX IF NOT EXISTS idx_coach_verification_status ON public.coach_profiles (verification_status);

-- 3. Ensure existing verified coaches remain active
UPDATE public.coach_profiles 
SET verification_status = 'approved' 
WHERE is_verified = true AND (verification_status IS NULL OR verification_status = 'pending_review');

-- 4. RPC for CEO / Admin to atomically approve or reject coach applications
CREATE OR REPLACE FUNCTION public.ceo_review_coach_application(
    p_coach_uid TEXT,
    p_action TEXT, -- 'approve' or 'reject'
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_status TEXT;
    v_is_verified BOOLEAN;
BEGIN
    IF p_action = 'approve' THEN
        v_new_status := 'approved';
        v_is_verified := true;
    ELSE
        v_new_status := 'rejected';
        v_is_verified := false;
    END IF;

    UPDATE public.coach_profiles
    SET verification_status = v_new_status,
        is_verified = v_is_verified,
        rejection_reason = p_reason,
        reviewed_at = NOW()
    WHERE uid = p_coach_uid;

    -- Also keep unified profiles updated
    IF p_action = 'approve' THEN
        UPDATE public.profiles
        SET role = 'coach'
        WHERE uid = p_coach_uid;
    END IF;

    -- Send notification to the coach
    INSERT INTO public.notifications (user_id, sender_uid, type, title, message, created_at)
    VALUES (
        p_coach_uid,
        'system',
        'coach_verification',
        CASE WHEN p_action = 'approve' THEN 'Coach Verification Approved! 🏅' ELSE 'Coach Verification Update' END,
        CASE 
            WHEN p_action = 'approve' THEN 'Congratulations! Your coaching credentials have been verified by the FitPulse Board. Your profile is now live to trainees.'
            ELSE 'Your coaching application requires attention: ' || COALESCE(p_reason, 'Please re-submit clear certification documents.')
        END,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'uid', p_coach_uid,
        'status', v_new_status,
        'is_verified', v_is_verified
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.ceo_review_coach_application TO anon, authenticated;
