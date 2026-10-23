-- ============================================================================
-- FitPulse: Fix Supabase Security Linter Warnings (Function Search Path Mutable)
-- Run this in Supabase Dashboard -> SQL Editor
-- This resolves all 8 Security Linter warnings and sets search_path = public, pg_temp
-- ============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public, pg_temp;', r.proname, r.args);
      RAISE NOTICE 'Secured function public.%(%)', r.proname, r.args;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped public.%(%): %', r.proname, r.args, SQLERRM;
    END;
  END LOOP;
END;
$$;
