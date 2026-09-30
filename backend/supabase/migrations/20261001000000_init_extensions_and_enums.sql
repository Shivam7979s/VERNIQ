-- ==============================================================================
-- VERNIQ PostgreSQL Base Migration: Extensions, Enums, and Shared Utility Triggers
-- Migration: 20261001000000_init_extensions_and_enums.sql
-- ==============================================================================

-- 1. Essential Core Extensions
CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- 2. Application Role Domain Enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('student', 'mentor', 'admin');
  END IF;
END $$;

-- 3. Generic updated_at Timestamp Synchronization Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
