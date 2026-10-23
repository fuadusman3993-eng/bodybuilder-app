-- ============================================================================
-- FitPulse: Autonomous Self-Healing User Identity Migration & Trigger
-- Scalable to 100,000+ users without manual intervention
-- Run this script in the Supabase Dashboard -> SQL Editor
-- ============================================================================

-- 1. Explicitly heal known historical profiles
UPDATE public.profiles
SET
  name = 'fu',
  username = COALESCE(username, 'fu'),
  updated_at = now()
WHERE uid = 'BKNgBzHjApYRjeefi3OlTVzp82s1'
  AND (name IN ('Trainee', 'User', 'Athlete') OR name IS NULL);

UPDATE public.profiles
SET
  name = 'Mozart',
  username = COALESCE(username, 'mozart'),
  updated_at = now()
WHERE uid = 'Jf9J60BVErWtPKiydbdlnHA48Tw2'
  AND (name IN ('Trainee', 'User', 'Athlete') OR name IS NULL);

-- 2. Update coach_requests to fix 'Trainee' labels
UPDATE public.coach_requests
SET trainee_name = 'fu'
WHERE trainee_uid = 'BKNgBzHjApYRjeefi3OlTVzp82s1'
  AND (trainee_name = 'Trainee' OR trainee_name IS NULL);

UPDATE public.coach_requests
SET trainee_name = 'Mozart'
WHERE trainee_uid = 'Jf9J60BVErWtPKiydbdlnHA48Tw2'
  AND (trainee_name = 'Trainee' OR trainee_name IS NULL);

-- 3. Dynamic Automated Healing for ANY profile with placeholder names:
-- Extracts real name automatically from notifications ('X wants you to be their coach.')
DO $$
DECLARE
  r RECORD;
  v_real_name text;
BEGIN
  FOR r IN 
    SELECT p.uid, p.name 
    FROM public.profiles p
    WHERE p.name IN ('Trainee', 'User', 'Athlete') OR p.name IS NULL
  LOOP
    -- Check notifications table for sender's actual name
    SELECT NULLIF(trim(regexp_replace(n.message, '\s+wants you to be their coach.*', '', 'i')), '')
    INTO v_real_name
    FROM public.notifications n
    WHERE n.sender_uid = r.uid
      AND n.message ILIKE '%wants you to be their coach%'
    ORDER BY n.created_at ASC
    LIMIT 1;

    IF v_real_name IS NOT NULL AND v_real_name NOT IN ('A user', 'User', 'Trainee', 'Athlete') THEN
      UPDATE public.profiles
      SET 
        name = v_real_name,
        username = COALESCE(profiles.username, lower(regexp_replace(v_real_name, '\s+', '_', 'g'))),
        updated_at = now()
      WHERE uid = r.uid;

      UPDATE public.coach_requests
      SET trainee_name = v_real_name
      WHERE trainee_uid = r.uid AND (trainee_name IN ('Trainee', 'User') OR trainee_name IS NULL);
    END IF;
  END LOOP;
END;
$$;

-- 4. PostgreSQL Autonomous Trigger Function:
-- Runs automatically whenever a notification is created, guaranteeing
-- real identity is permanently captured in public.profiles and coach_requests
CREATE OR REPLACE FUNCTION public.fn_auto_heal_identity_on_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_extracted_name text;
BEGIN
  IF NEW.sender_uid IS NOT NULL AND NEW.message ILIKE '%wants you to be their coach%' THEN
    v_extracted_name := trim(regexp_replace(NEW.message, '\s+wants you to be their coach.*', '', 'i'));
    
    IF v_extracted_name IS NOT NULL 
       AND v_extracted_name NOT IN ('', 'A user', 'User', 'Trainee', 'Athlete') THEN
      
      -- 1. Heal public.profiles if name is missing or generic
      UPDATE public.profiles
      SET 
        name = v_extracted_name,
        username = COALESCE(profiles.username, lower(regexp_replace(v_extracted_name, '\s+', '_', 'g'))),
        updated_at = now()
      WHERE uid = NEW.sender_uid
        AND (name IN ('Trainee', 'User', 'Athlete') OR name IS NULL OR trim(name) = '');

      -- 2. Heal coach_requests if trainee_name is generic
      UPDATE public.coach_requests
      SET trainee_name = v_extracted_name
      WHERE trainee_uid = NEW.sender_uid
        AND (trainee_name IN ('Trainee', 'User', 'Athlete') OR trainee_name IS NULL);

    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_heal_identity_on_notification ON public.notifications;
CREATE TRIGGER trg_heal_identity_on_notification
  AFTER INSERT OR UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_heal_identity_on_notification();

-- 5. RPC Function callable by client to auto-heal a specific UID
CREATE OR REPLACE FUNCTION public.auto_heal_profile(p_uid text)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile public.profiles;
  v_real_name text;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE uid = p_uid;
  
  IF v_profile.uid IS NOT NULL AND (v_profile.name IN ('Trainee', 'User', 'Athlete') OR v_profile.name IS NULL) THEN
    -- Try notifications
    SELECT NULLIF(trim(regexp_replace(n.message, '\s+wants you to be their coach.*', '', 'i')), '')
    INTO v_real_name
    FROM public.notifications n
    WHERE n.sender_uid = p_uid
      AND n.message ILIKE '%wants you to be their coach%'
    ORDER BY n.created_at ASC
    LIMIT 1;

    -- Try posts
    IF v_real_name IS NULL THEN
      SELECT username INTO v_real_name FROM public.posts WHERE uid = p_uid AND username IS NOT NULL LIMIT 1;
    END IF;

    -- Try stories
    IF v_real_name IS NULL THEN
      SELECT username INTO v_real_name FROM public.stories WHERE uid = p_uid AND username IS NOT NULL LIMIT 1;
    END IF;

    IF v_real_name IS NOT NULL AND v_real_name NOT IN ('A user', 'User', 'Trainee', 'Athlete') THEN
      UPDATE public.profiles
      SET
        name = v_real_name,
        username = COALESCE(profiles.username, lower(regexp_replace(v_real_name, '\s+', '_', 'g'))),
        updated_at = now()
      WHERE uid = p_uid
      RETURNING * INTO v_profile;

      UPDATE public.coach_requests
      SET trainee_name = v_real_name
      WHERE trainee_uid = p_uid AND (trainee_name IN ('Trainee', 'User') OR trainee_name IS NULL);
    END IF;
  END IF;

  RETURN v_profile;
END;
$$;
