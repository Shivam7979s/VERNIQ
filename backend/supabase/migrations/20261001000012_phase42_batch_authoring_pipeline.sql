-- ==============================================================================
-- VERNIQ Phase 4.2 Migration: Production Batch Authoring Pipeline
-- Migration: 20261001000012_phase42_batch_authoring_pipeline.sql
-- ==============================================================================

-- 1. PROBLEM AUTHORING BATCHES TABLE
CREATE TABLE IF NOT EXISTS public.problem_authoring_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name TEXT NOT NULL UNIQUE,
  target_count INTEGER NOT NULL CHECK (target_count > 0),
  actual_count INTEGER NOT NULL DEFAULT 0,
  batch_status TEXT NOT NULL DEFAULT 'CREATED' CHECK (
    batch_status IN (
      'CREATED',
      'SELECTED',
      'AUTHORING',
      'CONTENT_REVIEW',
      'TECHNICAL_REVIEW',
      'PROVENANCE_REVIEW',
      'JUDGE_VALIDATION',
      'HUMAN_APPROVAL',
      'COMPLETED',
      'ARCHIVED'
    )
  ),
  authoring_status TEXT NOT NULL DEFAULT 'PENDING',
  review_status TEXT NOT NULL DEFAULT 'PENDING',
  completion_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  failure_count INTEGER NOT NULL DEFAULT 0,
  published_count INTEGER NOT NULL DEFAULT 0,
  selection_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ
);

-- 2. BATCH PROBLEM ITEMS (JUNCTION & LIFECYCLE ITEM TRACKER)
CREATE TABLE IF NOT EXISTS public.batch_problem_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.problem_authoring_batches(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE RESTRICT,
  item_status TEXT NOT NULL DEFAULT 'SELECTED' CHECK (
    item_status IN (
      'SELECTED',
      'AUTHORING',
      'CONTENT_REVIEW',
      'CONTENT_REVIEW_BLOCKED',
      'TECHNICAL_REVIEW',
      'TECHNICAL_REVIEW_BLOCKED',
      'PROVENANCE_REVIEW',
      'PROVENANCE_REVIEW_BLOCKED',
      'JUDGE_VALIDATION',
      'JUDGE_VALIDATION_BLOCKED',
      'HUMAN_APPROVAL',
      'APPROVED',
      'COMPLETED',
      'FAILED'
    )
  ),
  assigned_author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  failure_step TEXT CHECK (
    failure_step IS NULL OR failure_step IN (
      'CONTENT_GENERATION_FAILED',
      'TEST_GENERATION_FAILED',
      'TECHNICAL_REVIEW_FAILED',
      'JUDGE_FAILED',
      'PROVENANCE_FAILED'
    )
  ),
  failure_reason TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  content_completeness_pct INTEGER NOT NULL DEFAULT 0 CHECK (content_completeness_pct >= 0 AND content_completeness_pct <= 100),
  test_completeness_pct INTEGER NOT NULL DEFAULT 0 CHECK (test_completeness_pct >= 0 AND test_completeness_pct <= 100),
  judge_readiness_pct INTEGER NOT NULL DEFAULT 0 CHECK (judge_readiness_pct >= 0 AND judge_readiness_pct <= 100),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. LINK PROBLEMS TO ACTIVE AUTHORING BATCH
ALTER TABLE public.problems
  ADD COLUMN IF NOT EXISTS current_batch_id UUID REFERENCES public.problem_authoring_batches(id) ON DELETE SET NULL;

-- 4. CONSTRAINTS & PERFORMANCE INDEXES
-- Guard: A problem can only belong to ONE active batch at any time
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_batch_problem 
  ON public.batch_problem_items(problem_id) 
  WHERE item_status NOT IN ('COMPLETED', 'FAILED');

-- Fast lookups
CREATE INDEX IF NOT EXISTS idx_batch_items_batch_id ON public.batch_problem_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_items_problem_id ON public.batch_problem_items(problem_id);
CREATE INDEX IF NOT EXISTS idx_batch_items_status ON public.batch_problem_items(item_status);
CREATE INDEX IF NOT EXISTS idx_batches_status ON public.problem_authoring_batches(batch_status);
CREATE INDEX IF NOT EXISTS idx_problems_current_batch ON public.problems(current_batch_id);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.problem_authoring_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_problem_items ENABLE ROW LEVEL SECURITY;

-- Batches policies
DROP POLICY IF EXISTS "Public read problem authoring batches" ON public.problem_authoring_batches;
CREATE POLICY "Public read problem authoring batches" ON public.problem_authoring_batches
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated insert problem authoring batches" ON public.problem_authoring_batches;
CREATE POLICY "Authenticated insert problem authoring batches" ON public.problem_authoring_batches
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated update problem authoring batches" ON public.problem_authoring_batches;
CREATE POLICY "Authenticated update problem authoring batches" ON public.problem_authoring_batches
  FOR UPDATE TO authenticated USING (true);

-- Batch items policies
DROP POLICY IF EXISTS "Public read batch problem items" ON public.batch_problem_items;
CREATE POLICY "Public read batch problem items" ON public.batch_problem_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated insert batch problem items" ON public.batch_problem_items;
CREATE POLICY "Authenticated insert batch problem items" ON public.batch_problem_items
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated update batch problem items" ON public.batch_problem_items;
CREATE POLICY "Authenticated update batch problem items" ON public.batch_problem_items
  FOR UPDATE TO authenticated USING (true);
