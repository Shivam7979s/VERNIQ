-- ==============================================================================
-- VERNIQ Adaptive Sprint Planner, Diagnostic Engine & Dynamic Rebalancer
-- Migration: 20261001000008_adaptive_planner_engine.sql
-- ==============================================================================

-- 1. USER DIAGNOSTIC SCORES & CONFIDENCE VECTOR
CREATE TABLE IF NOT EXISTS public.user_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE SET NULL,
  tag_name TEXT NOT NULL,
  mastery_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  confidence_level TEXT NOT NULL DEFAULT 'novice' CHECK (confidence_level IN ('novice', 'intermediate', 'proficient', 'master')),
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, tag_name)
);

-- 2. STUDY SPRINTS (Weekly Milestones)
CREATE TABLE IF NOT EXISTS public.study_sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sprint_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  primary_tag_id UUID REFERENCES public.tags(id) ON DELETE SET NULL,
  primary_topic TEXT NOT NULL DEFAULT 'Arrays & Two Pointers',
  target_hours NUMERIC(5,2) NOT NULL DEFAULT 8.0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SPRINT TASKS (Daily Action Items)
CREATE TABLE IF NOT EXISTS public.sprint_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES public.study_sprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES public.problems(id) ON DELETE SET NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('learn_concept', 'practice_problem', 'spaced_revision', 'mistake_retrial', 'sprint_assessment')),
  title TEXT NOT NULL,
  estimated_minutes INTEGER NOT NULL DEFAULT 30,
  scheduled_date DATE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_user_diagnostics_user ON public.user_diagnostics(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sprints_user ON public.study_sprints(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_sprint ON public.sprint_tasks(sprint_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_user_date ON public.sprint_tasks(user_id, scheduled_date, is_completed);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.user_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own diagnostics" ON public.user_diagnostics;
CREATE POLICY "Users can manage own diagnostics"
  ON public.user_diagnostics
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own sprints" ON public.study_sprints;
CREATE POLICY "Users can manage own sprints"
  ON public.study_sprints
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own sprint tasks" ON public.sprint_tasks;
CREATE POLICY "Users can manage own sprint tasks"
  ON public.sprint_tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
