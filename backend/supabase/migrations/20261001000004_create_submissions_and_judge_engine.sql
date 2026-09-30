-- ==============================================================================
-- VERNIQ Phase 3 Migration: Submissions Schema, Realtime Telemetry, and Online Judge Engine
-- Migration: 20261001000004_create_submissions_and_judge_engine.sql
-- ==============================================================================

-- 1. DOMAIN ENUMS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_verdict') THEN
    CREATE TYPE public.submission_verdict AS ENUM (
      'pending',
      'running',
      'accepted',
      'wrong_answer',
      'time_limit_exceeded',
      'memory_limit_exceeded',
      'compilation_error',
      'runtime_error',
      'internal_error'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'programming_language') THEN
    CREATE TYPE public.programming_language AS ENUM (
      'cpp',
      'java',
      'python',
      'typescript',
      'go'
    );
  END IF;
END $$;

-- 2. SUBMISSIONS SCHEMA
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES public.problems(id) ON DELETE SET NULL, -- NULL for standalone /ide executions
  language public.programming_language NOT NULL,
  source_code TEXT NOT NULL,
  stdin_input TEXT, -- for standalone /ide executions or custom testcases
  verdict public.submission_verdict NOT NULL DEFAULT 'pending',
  runtime_ms INTEGER DEFAULT 0,
  memory_kb INTEGER DEFAULT 0,
  stdout_output TEXT,
  stderr_output TEXT,
  compile_output TEXT,
  test_cases_passed INTEGER DEFAULT 0,
  total_test_cases INTEGER DEFAULT 0,
  is_custom_run BOOLEAN NOT NULL DEFAULT false, -- true for "Run Code", false for "Submit"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_submissions_user_problem 
  ON public.submissions(user_id, problem_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_submissions_verdict 
  ON public.submissions(verdict);

CREATE INDEX IF NOT EXISTS idx_submissions_pending_queue 
  ON public.submissions(created_at ASC) 
  WHERE verdict = 'pending';

-- 3. AUTOMATED TELEMETRY TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_submission_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_difficulty public.difficulty_level;
  v_score_delta INTEGER := 0;
  v_prev_status public.problem_status;
  v_college_id UUID;
BEGIN
  -- Auto-populate completed_at on terminal verdicts
  IF NEW.verdict NOT IN ('pending', 'running') AND NEW.completed_at IS NULL THEN
    NEW.completed_at := NOW();
  END IF;

  -- Telemetry trigger: only runs when transitioning to 'accepted' on an official submission
  IF NEW.verdict = 'accepted' AND (TG_OP = 'INSERT' OR OLD.verdict IS DISTINCT FROM NEW.verdict) THEN
    IF NEW.problem_id IS NOT NULL AND NEW.is_custom_run = false THEN

      -- 1. Check if user already previously solved this problem
      SELECT status INTO v_prev_status
      FROM public.user_problem_progress
      WHERE user_id = NEW.user_id AND problem_id = NEW.problem_id;

      -- 2. Upsert user_problem_progress
      INSERT INTO public.user_problem_progress (user_id, problem_id, status, solved_at)
      VALUES (NEW.user_id, NEW.problem_id, 'solved', NOW())
      ON CONFLICT (user_id, problem_id)
      DO UPDATE SET status = 'solved', solved_at = NOW();

      -- 3. Increment profile score & solved count (only once per unique problem)
      IF v_prev_status IS NULL OR v_prev_status <> 'solved' THEN
        SELECT difficulty INTO v_difficulty
        FROM public.problems
        WHERE id = NEW.problem_id;

        -- Difficulty-based scoring: Easy (+20 pts), Medium (+40 pts), Hard (+80 pts)
        IF v_difficulty = 'easy' THEN
          v_score_delta := 20;
        ELSIF v_difficulty = 'hard' THEN
          v_score_delta := 80;
        ELSE
          v_score_delta := 40; -- medium default
        END IF;

        -- Update user profiles
        UPDATE public.profiles
        SET problems_solved_count = problems_solved_count + 1,
            score = score + v_score_delta,
            updated_at = NOW()
        WHERE id = NEW.user_id
        RETURNING college_id INTO v_college_id;

        -- Fallback: If trigger trigger_sync_college_stats is not installed, sync college score directly
        IF v_college_id IS NOT NULL AND NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_sync_college_stats'
        ) THEN
          UPDATE public.colleges
          SET total_score = total_score + v_score_delta
          WHERE id = v_college_id;
        END IF;
      END IF;

      -- 4. Auto-enroll into user_revision_queue (spaced repetition curve)
      INSERT INTO public.user_revision_queue (user_id, problem_id, interval_days, next_review_at, is_reviewed)
      VALUES (NEW.user_id, NEW.problem_id, 1, NOW() + INTERVAL '1 day', false)
      ON CONFLICT (user_id, problem_id)
      DO UPDATE SET
        interval_days = 1,
        next_review_at = NOW() + INTERVAL '1 day',
        is_reviewed = false;

    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_submission_completion ON public.submissions;
CREATE TRIGGER trg_submission_completion
  BEFORE INSERT OR UPDATE OF verdict ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_submission_completion();

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 4.1 Users can view their own submissions
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.submissions;
CREATE POLICY "Users can view their own submissions"
  ON public.submissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4.2 Users can insert their own submissions
DROP POLICY IF EXISTS "Users can insert their own submissions" ON public.submissions;
CREATE POLICY "Users can insert their own submissions"
  ON public.submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4.3 Only service_role (Judge Worker) can update verdicts and execution telemetry
DROP POLICY IF EXISTS "Judge worker can update submissions" ON public.submissions;
CREATE POLICY "Judge worker can update submissions"
  ON public.submissions
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5. REALTIME REPLICATION PUBLICATION
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
