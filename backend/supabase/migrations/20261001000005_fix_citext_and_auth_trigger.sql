-- ==============================================================================
-- VERNIQ Hotfix: Fix citext resolution and robust auth user provisioning trigger
-- Migration: 20261001000005_fix_citext_and_auth_trigger.sql
--
-- RUN THIS IN YOUR SUPABASE SQL EDITOR:
-- https://supabase.com/dashboard/project/cisddayhekkktcomnqhz/sql/new
-- ==============================================================================

-- 1. Ensure citext extension is enabled (in schema extensions or public)
CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA extensions;

-- 2. Drop and recreate handle_new_user with:
--    a) TEXT variable types instead of CITEXT (eliminates SQLSTATE 42704)
--    b) Explicit search_path = public, extensions, auth
--    c) Robust college_id resolution (handles UUIDs, slugs, or names)
--    d) Safe ON CONFLICT DO UPDATE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  candidate_username TEXT;
  cleaned_username TEXT;
  final_username TEXT;
  user_fullname TEXT;
  user_avatar TEXT;
  meta_college_id TEXT;
  meta_college_name TEXT;
  resolved_college_id UUID := NULL;
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

  -- Optional college resolution if colleges table exists
  BEGIN
    meta_college_id := NEW.raw_user_meta_data->>'college_id';
    meta_college_name := NEW.raw_user_meta_data->>'college_name';

    IF meta_college_id IS NOT NULL AND meta_college_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
      SELECT id INTO resolved_college_id FROM public.colleges WHERE id = meta_college_id::UUID;
    END IF;

    IF resolved_college_id IS NULL AND meta_college_id IS NOT NULL THEN
      SELECT id INTO resolved_college_id FROM public.colleges
      WHERE slug = LOWER(REPLACE(meta_college_id, 'col-', ''))
      LIMIT 1;
    END IF;

    IF resolved_college_id IS NULL AND meta_college_name IS NOT NULL THEN
      SELECT id INTO resolved_college_id FROM public.colleges
      WHERE name = meta_college_name
      LIMIT 1;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      resolved_college_id := NULL;
  END;

  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    avatar_url,
    role,
    college_id
  ) VALUES (
    NEW.id,
    final_username,
    user_fullname,
    user_avatar,
    'student',
    resolved_college_id
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    college_id = COALESCE(public.profiles.college_id, EXCLUDED.college_id);

  RETURN NEW;
END;
$$;

-- 3. Re-attach trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Secure all other SECURITY DEFINER functions with explicit search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth;

CREATE OR REPLACE FUNCTION public.sync_college_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    IF (OLD.college_id IS DISTINCT FROM NEW.college_id) THEN
      IF OLD.college_id IS NOT NULL THEN
        UPDATE public.colleges
        SET student_count = GREATEST(student_count - 1, 0),
            total_score = GREATEST(total_score - OLD.score, 0)
        WHERE id = OLD.college_id;
      END IF;
      IF NEW.college_id IS NOT NULL THEN
        UPDATE public.colleges
        SET student_count = student_count + 1,
            total_score = total_score + NEW.score
        WHERE id = NEW.college_id;
      END IF;
    ELSIF (OLD.score IS DISTINCT FROM NEW.score AND NEW.college_id IS NOT NULL) THEN
      UPDATE public.colleges
      SET total_score = total_score + (NEW.score - OLD.score)
      WHERE id = NEW.college_id;
    END IF;
  ELSIF (TG_OP = 'INSERT') THEN
    IF NEW.college_id IS NOT NULL THEN
      UPDATE public.colleges
      SET student_count = student_count + 1,
          total_score = total_score + NEW.score
      WHERE id = NEW.college_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.college_id IS NOT NULL THEN
      UPDATE public.colleges
      SET student_count = GREATEST(student_count - 1, 0),
          total_score = GREATEST(total_score - OLD.score, 0)
      WHERE id = OLD.college_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;
