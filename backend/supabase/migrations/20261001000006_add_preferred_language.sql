-- ==============================================================================
-- VERNIQ Migration: Add preferred_language and editor preferences to profiles
-- Migration: 20261001000006_add_preferred_language.sql
-- ==============================================================================

-- 1. Add preferred_language and preferences to public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'java',
  ADD COLUMN IF NOT EXISTS leetcode_username TEXT,
  ADD COLUMN IF NOT EXISTS tab_size INTEGER NOT NULL DEFAULT 4;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
