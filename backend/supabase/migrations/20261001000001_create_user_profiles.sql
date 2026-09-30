-- ==============================================================================
-- VERNIQ Phase 1 Database Migration: User Profiles Schema, RLS, and Auth Trigger
-- Migration: 20261001000001_create_user_profiles.sql
-- ==============================================================================

-- 1. Create Profiles Table Linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username CITEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role public.app_role NOT NULL DEFAULT 'student',
  bio TEXT,
  github_username TEXT,
  linkedin_url TEXT,
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  max_streak INTEGER NOT NULL DEFAULT 0 CHECK (max_streak >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT username_format_check CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$')
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. Automatic updated_at Trigger
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enforce Role Immutability: Standard users cannot elevate their own role
CREATE OR REPLACE FUNCTION public.prevent_profile_role_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.role() <> 'service_role' AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) <> 'admin' THEN
      RAISE EXCEPTION 'Modifying profile role is prohibited';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_profile_role_immutability ON public.profiles;
CREATE TRIGGER enforce_profile_role_immutability
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_update();

-- 5. Row Level Security (RLS) Configuration
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5.1 Public Read: Any authenticated or unauthenticated client can read profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- 5.2 Insert: Users can only create their own profile row matching auth.uid()
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 5.3 Update: Users can update only their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 6. Trigger to automatically provision public.profiles upon auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  candidate_username TEXT;
  cleaned_username TEXT;
  final_username CITEXT;
  user_fullname TEXT;
  user_avatar TEXT;
BEGIN
  -- Extract full name
  user_fullname := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1),
    'Engineer'
  );

  -- Extract avatar
  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- Extract candidate username from metadata or email prefix
  candidate_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'user_name',
    NEW.raw_user_meta_data->>'preferred_username',
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Sanitize username characters to match ^[a-zA-Z0-9_]{3,20}$
  cleaned_username := REGEXP_REPLACE(candidate_username, '[^a-zA-Z0-9_]', '_', 'g');
  IF LENGTH(cleaned_username) < 3 THEN
    cleaned_username := cleaned_username || '_dev';
  END IF;
  cleaned_username := SUBSTRING(cleaned_username FROM 1 FOR 14);

  -- Ensure uniqueness
  final_username := cleaned_username;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) THEN
    final_username := cleaned_username || '_' || SUBSTRING(REPLACE(NEW.id::text, '-', '') FROM 1 FOR 5);
  END IF;

  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    avatar_url,
    role
  ) VALUES (
    NEW.id,
    final_username,
    user_fullname,
    user_avatar,
    'student'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
