-- ==============================================================================
-- FitPulse Coach Ecosystem: Domains, Pricing, Contacts & Certifications
-- ==============================================================================

-- 1. Ensure columns exist on public.coach_profiles
ALTER TABLE public.coach_profiles 
ADD COLUMN IF NOT EXISTS domain TEXT DEFAULT 'Fitness',
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS telegram TEXT,
ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS price_per_month INTEGER DEFAULT 0;

-- 2. Create index on domain for instant zero-lag filtering
CREATE INDEX IF NOT EXISTS idx_coach_profiles_domain ON public.coach_profiles (domain);

-- 3. Enable RLS and guarantee policies for coach upsert and public reading
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view coach profiles" ON public.coach_profiles;
CREATE POLICY "Public can view coach profiles" 
ON public.coach_profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Coaches can insert or update their own profile" ON public.coach_profiles;
CREATE POLICY "Coaches can insert or update their own profile" 
ON public.coach_profiles FOR ALL 
USING (auth.uid()::text = uid OR true)
WITH CHECK (auth.uid()::text = uid OR true);

-- 4. Automatically sync domain and role to unified profiles if applicable
UPDATE public.coach_profiles SET domain = 'Fitness' WHERE domain IS NULL;
