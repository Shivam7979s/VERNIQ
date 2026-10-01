-- ==============================================================================
-- VERNIQ Phase 4 Migration: Problem Content Authoring & Provenance Architecture
-- Migration: 20261001000011_problem_content_authoring_pipeline.sql
-- ==============================================================================

-- 1. EXTEND WORKFLOW ENUM
-- Add content_authoring, provenance_review, and judge_ready if not present
DO $$
BEGIN
  ALTER TYPE public.problem_workflow_status ADD VALUE IF NOT EXISTS 'content_authoring' BEFORE 'content_review';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE public.problem_workflow_status ADD VALUE IF NOT EXISTS 'provenance_review' AFTER 'technical_review';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE public.problem_workflow_status ADD VALUE IF NOT EXISTS 'judge_ready' BEFORE 'published';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. EXTEND PROBLEMS TABLE WITH AUTHORING, CONTENT & EXECUTION ATTRIBUTES
ALTER TABLE public.problems
  ADD COLUMN IF NOT EXISTS input_format TEXT,
  ADD COLUMN IF NOT EXISTS output_format TEXT,
  ADD COLUMN IF NOT EXISTS edge_cases JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS hints JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS time_limit_ms INTEGER NOT NULL DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS memory_limit_mb INTEGER NOT NULL DEFAULT 256,
  ADD COLUMN IF NOT EXISTS supported_languages JSONB NOT NULL DEFAULT '["cpp", "python", "java", "typescript", "go"]'::jsonb,
  ADD COLUMN IF NOT EXISTS author_type TEXT NOT NULL DEFAULT 'imported',
  ADD COLUMN IF NOT EXISTS generated_with_ai BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS human_reviewed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS provenance_status TEXT NOT NULL DEFAULT 'PROVENANCE_REVIEW_REQUIRED',
  ADD COLUMN IF NOT EXISTS judge_readiness_status TEXT NOT NULL DEFAULT 'NOT_READY';

-- Update the 6 canonical published problems to have verified status
UPDATE public.problems
SET judge_readiness_status = 'JUDGE_READY',
    provenance_status = 'VERIFIED_VALID',
    human_reviewed = true,
    author_type = 'verniq_original'
WHERE is_published = true;

-- 3. EXTEND PROBLEM SOURCES WITH PROVENANCE FIELDS
ALTER TABLE public.problem_sources
  ADD COLUMN IF NOT EXISTS derivative_work_allowed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_identifier TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 4. PROBLEM CONTENT REVISIONS TABLE (AUDIT TRAIL & VERSION HISTORY)
CREATE TABLE IF NOT EXISTS public.problem_content_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_type TEXT NOT NULL DEFAULT 'human',
  generated_with_ai BOOLEAN NOT NULL DEFAULT false,
  human_reviewed BOOLEAN NOT NULL DEFAULT false,
  source_reference TEXT,
  change_summary TEXT,
  content_snapshot JSONB NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  UNIQUE (problem_id, revision_number)
);

-- 5. PROBLEM TECHNICAL REVIEWS TABLE (QUALITY & VALIDATION GATE)
CREATE TABLE IF NOT EXISTS public.problem_technical_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  revision_id UUID REFERENCES public.problem_content_revisions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  checklist JSONB NOT NULL DEFAULT '{
    "statement_consistent": false,
    "examples_correct": false,
    "constraints_consistent": false,
    "edge_cases_covered": false,
    "solution_logic_valid": false,
    "starter_templates_compile": false,
    "canonical_tests_valid": false,
    "expected_outputs_correct": false,
    "languages_compatible": false
  }'::jsonb,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 6. EXTEND TEST CASES WITH CATEGORIZATION
ALTER TABLE public.test_cases
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'sample',
  ADD COLUMN IF NOT EXISTS explanation TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Update existing test cases categories
UPDATE public.test_cases
SET category = CASE WHEN is_sample = true THEN 'sample' ELSE 'hidden' END
WHERE category = 'sample' AND is_sample = false;

-- 7. PERFORMANCE & AUDIT INDEXES
CREATE INDEX IF NOT EXISTS idx_content_revisions_problem ON public.problem_content_revisions(problem_id);
CREATE INDEX IF NOT EXISTS idx_content_revisions_review ON public.problem_content_revisions(review_status);
CREATE INDEX IF NOT EXISTS idx_technical_reviews_problem ON public.problem_technical_reviews(problem_id);
CREATE INDEX IF NOT EXISTS idx_technical_reviews_status ON public.problem_technical_reviews(status);
CREATE INDEX IF NOT EXISTS idx_test_cases_problem_cat ON public.test_cases(problem_id, category);
CREATE INDEX IF NOT EXISTS idx_problems_judge_ready ON public.problems(judge_readiness_status);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.problem_content_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_technical_reviews ENABLE ROW LEVEL SECURITY;

-- Content revisions policies
DROP POLICY IF EXISTS "Public read approved revisions" ON public.problem_content_revisions;
CREATE POLICY "Public read approved revisions" ON public.problem_content_revisions
  FOR SELECT USING (review_status = 'approved');

DROP POLICY IF EXISTS "Authenticated read all revisions" ON public.problem_content_revisions;
CREATE POLICY "Authenticated read all revisions" ON public.problem_content_revisions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated insert revisions" ON public.problem_content_revisions;
CREATE POLICY "Authenticated insert revisions" ON public.problem_content_revisions
  FOR INSERT TO authenticated WITH CHECK (true);

-- Technical reviews policies
DROP POLICY IF EXISTS "Public read passed reviews" ON public.problem_technical_reviews;
CREATE POLICY "Public read passed reviews" ON public.problem_technical_reviews
  FOR SELECT USING (status = 'passed');

DROP POLICY IF EXISTS "Authenticated read technical reviews" ON public.problem_technical_reviews;
CREATE POLICY "Authenticated read technical reviews" ON public.problem_technical_reviews
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated insert technical reviews" ON public.problem_technical_reviews;
CREATE POLICY "Authenticated insert technical reviews" ON public.problem_technical_reviews
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated update technical reviews" ON public.problem_technical_reviews;
CREATE POLICY "Authenticated update technical reviews" ON public.problem_technical_reviews
  FOR UPDATE TO authenticated USING (true);
