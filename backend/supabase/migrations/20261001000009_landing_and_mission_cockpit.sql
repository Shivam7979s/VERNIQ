-- ==============================================================================
-- VERNIQ Landing Page & Mission Cockpit Vault Migration
-- Migration: 20261001000009_landing_and_mission_cockpit.sql
-- ==============================================================================

-- 1. PROBLEM OF THE DAY (POTD) SCHEMA
CREATE TABLE IF NOT EXISTS public.problem_of_the_day (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL UNIQUE,
    points_bonus INTEGER NOT NULL DEFAULT 50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default POTD for today and upcoming days if problems exist
DO $$
DECLARE
    prob_record RECORD;
    idx INTEGER := 0;
BEGIN
    FOR prob_record IN (SELECT id FROM public.problems ORDER BY created_at ASC LIMIT 7) LOOP
        INSERT INTO public.problem_of_the_day (problem_id, scheduled_date, points_bonus)
        VALUES (prob_record.id, CURRENT_DATE + idx, 50)
        ON CONFLICT (scheduled_date) DO NOTHING;
        idx := idx + 1;
    END LOOP;
END $$;

-- 2. CODESPACE VAULT (SNIPPETS & SCRATCHPADS)
CREATE TABLE IF NOT EXISTS public.user_codespaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Scratchpad',
    language TEXT NOT NULL DEFAULT 'java',
    code_buffer TEXT NOT NULL DEFAULT '',
    stdin_buffer TEXT DEFAULT '',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. NOTESPACE VAULT (CONCEPT INVARIANT NOTES)
CREATE TABLE IF NOT EXISTS public.user_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES public.problems(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    markdown_content TEXT NOT NULL,
    is_starred BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_potd_date ON public.problem_of_the_day(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_user_codespaces_user ON public.user_codespaces(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notes_user ON public.user_notes(user_id, updated_at DESC);

-- Enable Row Level Security
ALTER TABLE public.problem_of_the_day ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_codespaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

-- POTD is globally readable
DROP POLICY IF EXISTS "Public read for POTD" ON public.problem_of_the_day;
CREATE POLICY "Public read for POTD" ON public.problem_of_the_day
    FOR SELECT USING (true);

-- User-owned Vault policies
DROP POLICY IF EXISTS "Users control own codespaces" ON public.user_codespaces;
CREATE POLICY "Users control own codespaces" ON public.user_codespaces
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users control own notes" ON public.user_notes;
CREATE POLICY "Users control own notes" ON public.user_notes
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Safely expose via Supabase Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'user_codespaces'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_codespaces;
    END IF;
END $$;
