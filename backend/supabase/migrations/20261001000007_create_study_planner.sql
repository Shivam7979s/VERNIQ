-- ==============================================================================
-- VERNIQ Phase 4 Migration: Personalized Study Planner & Schedule Architecture
-- Migration: 20261001000007_create_study_planner.sql
-- ==============================================================================

-- 1. DOMAIN ENUMS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'planner_goal') THEN
    CREATE TYPE public.planner_goal AS ENUM (
      'product_sde',
      'faang_top_tier',
      'core_cs_foundations',
      'campus_placement'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_task_status') THEN
    CREATE TYPE public.plan_task_status AS ENUM (
      'pending',
      'completed',
      'skipped'
    );
  END IF;
END $$;

-- 2. STUDY PLANS TABLE
CREATE TABLE IF NOT EXISTS public.user_study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  goal public.planner_goal NOT NULL DEFAULT 'product_sde',
  target_date DATE NOT NULL,
  daily_minutes INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. STUDY PLAN TASKS TABLE
CREATE TABLE IF NOT EXISTS public.user_study_plan_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.user_study_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  status public.plan_task_status NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_user_study_plans_user ON public.user_study_plans(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_study_plan_tasks_plan ON public.user_study_plan_tasks(plan_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_user_study_plan_tasks_user_date ON public.user_study_plan_tasks(user_id, scheduled_date, status);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.user_study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_study_plan_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own study plans" ON public.user_study_plans;
CREATE POLICY "Users can manage own study plans"
  ON public.user_study_plans
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own study plan tasks" ON public.user_study_plan_tasks;
CREATE POLICY "Users can manage own study plan tasks"
  ON public.user_study_plan_tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
