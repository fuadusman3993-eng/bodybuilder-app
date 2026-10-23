-- ============================================================================
-- FitPulse: Unified Profiles & Single Source of Truth Migration (Fixed)
-- Run this script in the Supabase Dashboard -> SQL Editor
-- ============================================================================

-- 1. Create the central profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  uid text PRIMARY KEY,
  name text NOT NULL DEFAULT 'User',
  username text,
  email text,
  avatar_url text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'coach')),
  city text,
  country text DEFAULT 'Ethiopia',
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. Row Level Security policies (Public read, open upsert)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
CREATE POLICY "Allow public read access to profiles"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert on profiles" ON public.profiles;
CREATE POLICY "Allow insert on profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on profiles" ON public.profiles;
CREATE POLICY "Allow update on profiles"
  ON public.profiles FOR UPDATE
  USING (true);

-- 4. Unified Sync RPC Function (Security Definer - bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.sync_user_profile(
  p_uid text,
  p_name text,
  p_email text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_role text DEFAULT 'user',
  p_city text DEFAULT NULL,
  p_country text DEFAULT 'Ethiopia'
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile public.profiles;
BEGIN
  INSERT INTO public.profiles (uid, name, email, avatar_url, role, city, country, updated_at)
  VALUES (
    p_uid,
    COALESCE(NULLIF(p_name, ''), 'User'),
    p_email,
    p_avatar_url,
    COALESCE(p_role, 'user'),
    p_city,
    COALESCE(p_country, 'Ethiopia'),
    now()
  )
  ON CONFLICT (uid) DO UPDATE
  SET
    name = CASE WHEN EXCLUDED.name IS NOT NULL AND EXCLUDED.name <> 'User' THEN EXCLUDED.name ELSE profiles.name END,
    email = COALESCE(EXCLUDED.email, profiles.email),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    role = COALESCE(EXCLUDED.role, profiles.role),
    city = COALESCE(EXCLUDED.city, profiles.city),
    country = COALESCE(EXCLUDED.country, profiles.country),
    updated_at = now()
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

-- 5. HISTORICAL BACKFILL: Populate profiles using DISTINCT ON (uid) to guarantee 1 row per UID
-- 5a. From coach_profiles:
INSERT INTO public.profiles (uid, name, avatar_url, role, bio)
SELECT DISTINCT ON (uid) uid, name, avatar_url, 'coach', bio
FROM public.coach_profiles
WHERE uid IS NOT NULL
ORDER BY uid
ON CONFLICT (uid) DO UPDATE
SET
  name = EXCLUDED.name,
  avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
  role = 'coach',
  bio = COALESCE(EXCLUDED.bio, profiles.bio);

-- 5b. From posts:
INSERT INTO public.profiles (uid, name, username, avatar_url)
SELECT DISTINCT ON (uid) uid, username, username, avatar_url
FROM public.posts
WHERE uid IS NOT NULL
ORDER BY uid, created_at DESC
ON CONFLICT (uid) DO UPDATE
SET
  name = COALESCE(profiles.name, EXCLUDED.name),
  username = COALESCE(profiles.username, EXCLUDED.username),
  avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url);

-- 5c. From stories:
INSERT INTO public.profiles (uid, name, username, avatar_url)
SELECT DISTINCT ON (uid) uid, username, username, avatar_url
FROM public.stories
WHERE uid IS NOT NULL
ORDER BY uid, created_at DESC
ON CONFLICT (uid) DO UPDATE
SET
  name = COALESCE(profiles.name, EXCLUDED.name),
  username = COALESCE(profiles.username, EXCLUDED.username),
  avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url);

-- 5d. From coach_requests (Trainees who hired coaches):
INSERT INTO public.profiles (uid, name, avatar_url)
SELECT DISTINCT ON (trainee_uid) trainee_uid, COALESCE(trainee_name, 'Trainee'), trainee_avatar
FROM public.coach_requests
WHERE trainee_uid IS NOT NULL
ORDER BY trainee_uid, created_at DESC
ON CONFLICT (uid) DO UPDATE
SET
  name = CASE WHEN EXCLUDED.name <> 'Trainee' THEN EXCLUDED.name ELSE profiles.name END,
  avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);

-- 5e. From wallets:
INSERT INTO public.profiles (uid, name)
SELECT DISTINCT user_id, 'Athlete'
FROM public.wallets
WHERE user_id IS NOT NULL
ON CONFLICT (uid) DO NOTHING;
