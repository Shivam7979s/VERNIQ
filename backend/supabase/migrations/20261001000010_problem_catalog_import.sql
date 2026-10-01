-- ==============================================================================
-- VERNIQ Phase 3 Migration: Problem Catalog & Taxonomy Architecture
-- Migration: 20261001000010_problem_catalog_import.sql
-- ==============================================================================

-- 1. DOMAIN ENUMS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'problem_workflow_status') THEN
    CREATE TYPE public.problem_workflow_status AS ENUM (
      'draft',
      'content_review',
      'technical_review',
      'ready',
      'published',
      'archived'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'topic_role') THEN
    CREATE TYPE public.topic_role AS ENUM (
      'primary',
      'secondary',
      'algorithm',
      'pattern'
    );
  END IF;
END $$;

-- 2. DOMAINS TABLE
CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name CITEXT UNIQUE NOT NULL,
  slug CITEXT UNIQUE NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. HIERARCHICAL TOPICS TABLE
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name CITEXT UNIQUE NOT NULL,
  slug CITEXT UNIQUE NOT NULL,
  parent_topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  domain_id UUID REFERENCES public.domains(id) ON DELETE SET NULL,
  source_topic TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. UPDATE PROBLEMS TABLE
ALTER TABLE public.problems
  ADD COLUMN IF NOT EXISTS verniq_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS domain_id UUID REFERENCES public.domains(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS workflow_status public.problem_workflow_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Default existing 6 published problems to 'published' workflow status
UPDATE public.problems
SET workflow_status = 'published'
WHERE is_published = true AND workflow_status = 'draft';

-- 5. PROBLEM TOPICS JUNCTION TABLE
CREATE TABLE IF NOT EXISTS public.problem_topics (
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  role public.topic_role NOT NULL DEFAULT 'secondary',
  PRIMARY KEY (problem_id, topic_id)
);

-- 6. PROBLEM PROVENANCE & SOURCES TABLE
CREATE TABLE IF NOT EXISTS public.problem_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'catalog_index',
  source_name TEXT NOT NULL DEFAULT 'verniq_all_3392_with_topics.csv',
  source_url TEXT,
  license TEXT,
  license_url TEXT,
  attribution_required BOOLEAN NOT NULL DEFAULT false,
  commercial_use_allowed BOOLEAN NOT NULL DEFAULT false,
  provenance_status TEXT NOT NULL DEFAULT 'PROVENANCE_REVIEW_REQUIRED',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 7. AUDIT & STAGING TABLES
CREATE TABLE IF NOT EXISTS public.problem_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,
  source_version TEXT,
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  invalid_rows INTEGER NOT NULL DEFAULT 0,
  duplicate_rows INTEGER NOT NULL DEFAULT 0,
  imported_rows INTEGER NOT NULL DEFAULT 0,
  review_rows INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.problem_import_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_batch_id UUID REFERENCES public.problem_import_batches(id) ON DELETE CASCADE,
  source_row_id INTEGER NOT NULL,
  source_verniq_id TEXT NOT NULL,
  raw_title TEXT NOT NULL,
  raw_difficulty TEXT NOT NULL,
  raw_topics TEXT NOT NULL,
  raw_companies TEXT,
  raw_records TEXT,
  normalized_title TEXT,
  normalized_difficulty TEXT,
  validation_status TEXT NOT NULL DEFAULT 'valid',
  validation_errors JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 8. PERFORMANCE & SEARCH INDEXES
CREATE INDEX IF NOT EXISTS idx_problems_verniq_id ON public.problems(verniq_id);
CREATE INDEX IF NOT EXISTS idx_problems_workflow_status ON public.problems(workflow_status);
CREATE INDEX IF NOT EXISTS idx_problems_domain_id ON public.problems(domain_id);
CREATE INDEX IF NOT EXISTS idx_topics_domain_id ON public.topics(domain_id);
CREATE INDEX IF NOT EXISTS idx_topics_parent_topic ON public.topics(parent_topic_id);
CREATE INDEX IF NOT EXISTS idx_problem_topics_topic ON public.problem_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_problem_sources_problem ON public.problem_sources(problem_id);
CREATE INDEX IF NOT EXISTS idx_import_staging_batch ON public.problem_import_staging(import_batch_id);

-- Trigram index for fuzzy title search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_problems_title_trgm ON public.problems USING gin (title gin_trgm_ops);

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_import_staging ENABLE ROW LEVEL SECURITY;

-- Public read-only policies
DROP POLICY IF EXISTS "Public read-only domains" ON public.domains;
CREATE POLICY "Public read-only domains" ON public.domains FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read-only topics" ON public.topics;
CREATE POLICY "Public read-only topics" ON public.topics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read-only problem_topics" ON public.problem_topics;
CREATE POLICY "Public read-only problem_topics" ON public.problem_topics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read-only problem_sources" ON public.problem_sources;
CREATE POLICY "Public read-only problem_sources" ON public.problem_sources FOR SELECT USING (true);

-- Update problems policy so public users can discover catalog problems in DRAFT / REVIEW
DROP POLICY IF EXISTS "Public read-only problems" ON public.problems;
DROP POLICY IF EXISTS "Public read problems" ON public.problems;
CREATE POLICY "Public read problems" ON public.problems FOR SELECT USING (true);

-- Staging & Batches are service_role and authenticated read-only
DROP POLICY IF EXISTS "Authenticated read problem_import_batches" ON public.problem_import_batches;
CREATE POLICY "Authenticated read problem_import_batches" ON public.problem_import_batches
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read problem_import_staging" ON public.problem_import_staging;
CREATE POLICY "Authenticated read problem_import_staging" ON public.problem_import_staging
  FOR SELECT TO authenticated USING (true);
