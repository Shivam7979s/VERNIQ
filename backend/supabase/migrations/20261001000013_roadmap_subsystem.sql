-- ==============================================================================
-- VERNIQ Phase 5 Migration: Structured Learning Roadmap Subsystem
-- Migration: 20261001000013_roadmap_subsystem.sql
-- ==============================================================================
-- Architecture:
-- Roadmap -> Phase/Track -> Sprint -> Day -> Topic -> Learning Item -> Problem Reference (VRQ-XXXXXX)
-- Independent progress tracking and deterministic "Continue Learning" engine.
-- ==============================================================================

-- 1. ENUMS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'learning_item_type') THEN
    CREATE TYPE public.learning_item_type AS ENUM (
      'VIDEO',
      'ARTICLE',
      'CONCEPT',
      'LECTURE',
      'PRACTICE',
      'PROBLEM',
      'QUIZ',
      'PROJECT',
      'REVISION',
      'MOCK_INTERVIEW'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'roadmap_item_status') THEN
    CREATE TYPE public.roadmap_item_status AS ENUM (
      'LOCKED',
      'AVAILABLE',
      'IN_PROGRESS',
      'COMPLETED',
      'SKIPPED'
    );
  END IF;
END $$;

-- 2. EXTEND ROADMAPS TABLE
ALTER TABLE public.roadmaps
  ADD COLUMN IF NOT EXISTS estimated_duration TEXT DEFAULT '~120 Hours',
  ADD COLUMN IF NOT EXISTS total_sprints INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. ROADMAP PHASES (Optional Tracks/Phases within Roadmap)
CREATE TABLE IF NOT EXISTS public.roadmap_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug CITEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_phase_roadmap_position UNIQUE (roadmap_id, position)
);

-- 4. ROADMAP SPRINTS
CREATE TABLE IF NOT EXISTS public.roadmap_sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.roadmap_phases(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug CITEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  estimated_hours NUMERIC(5,1) DEFAULT 10.0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_sprint_roadmap_position UNIQUE (roadmap_id, position)
);

-- 5. ROADMAP DAYS
CREATE TABLE IF NOT EXISTS public.roadmap_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES public.roadmap_sprints(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  learning_objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_day_sprint_position UNIQUE (sprint_id, position)
);

-- 6. ROADMAP DAY TOPICS
CREATE TABLE IF NOT EXISTS public.roadmap_day_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.roadmap_days(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_topic_day_position UNIQUE (day_id, position)
);

-- 7. ROADMAP ITEMS
CREATE TABLE IF NOT EXISTS public.roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.roadmap_days(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.roadmap_day_topics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  item_type public.learning_item_type NOT NULL DEFAULT 'CONCEPT',
  position INTEGER NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT true,
  estimated_minutes INTEGER DEFAULT 20,
  content_url TEXT,
  content_markdown TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_item_day_position UNIQUE (day_id, position)
);

-- 8. ROADMAP PROBLEM REFERENCES
-- Stored strictly as references to permanent verniq_id (VRQ-XXXXXX)
-- No canonical problem data is duplicated!
CREATE TABLE IF NOT EXISTS public.roadmap_problem_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_item_id UUID NOT NULL REFERENCES public.roadmap_items(id) ON DELETE CASCADE,
  verniq_problem_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_item_problem UNIQUE (roadmap_item_id, verniq_problem_id)
);

-- 9. USER ROADMAP PROGRESS
CREATE TABLE IF NOT EXISTS public.user_roadmap_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  current_sprint_id UUID REFERENCES public.roadmap_sprints(id) ON DELETE SET NULL,
  current_day_id UUID REFERENCES public.roadmap_days(id) ON DELETE SET NULL,
  current_item_id UUID REFERENCES public.roadmap_items(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  completed_items_count INTEGER NOT NULL DEFAULT 0,
  total_items_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_user_roadmap UNIQUE (user_id, roadmap_id)
);

-- 10. USER ROADMAP ITEM PROGRESS
CREATE TABLE IF NOT EXISTS public.user_roadmap_item_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  roadmap_item_id UUID NOT NULL REFERENCES public.roadmap_items(id) ON DELETE CASCADE,
  status public.roadmap_item_status NOT NULL DEFAULT 'AVAILABLE',
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_user_roadmap_item UNIQUE (user_id, roadmap_item_id)
);

-- 11. INDEXES
CREATE INDEX IF NOT EXISTS idx_roadmap_phases_roadmap ON public.roadmap_phases(roadmap_id, position);
CREATE INDEX IF NOT EXISTS idx_roadmap_sprints_roadmap ON public.roadmap_sprints(roadmap_id, position);
CREATE INDEX IF NOT EXISTS idx_roadmap_days_sprint ON public.roadmap_days(sprint_id, position);
CREATE INDEX IF NOT EXISTS idx_roadmap_day_topics_day ON public.roadmap_day_topics(day_id, position);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_day ON public.roadmap_items(day_id, position);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_topic ON public.roadmap_items(topic_id, position);
CREATE INDEX IF NOT EXISTS idx_roadmap_problem_refs_item ON public.roadmap_problem_references(roadmap_item_id, position);
CREATE INDEX IF NOT EXISTS idx_roadmap_problem_refs_verniq_id ON public.roadmap_problem_references(verniq_problem_id);
CREATE INDEX IF NOT EXISTS idx_user_roadmap_progress_user ON public.user_roadmap_progress(user_id, roadmap_id);
CREATE INDEX IF NOT EXISTS idx_user_roadmap_item_progress_user ON public.user_roadmap_item_progress(user_id, status);

-- 12. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.roadmap_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_day_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_problem_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roadmap_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roadmap_item_progress ENABLE ROW LEVEL SECURITY;

-- Public read-only policies for curriculum structure
DROP POLICY IF EXISTS "Public read roadmap_phases" ON public.roadmap_phases;
CREATE POLICY "Public read roadmap_phases" ON public.roadmap_phases FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read roadmap_sprints" ON public.roadmap_sprints;
CREATE POLICY "Public read roadmap_sprints" ON public.roadmap_sprints FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read roadmap_days" ON public.roadmap_days;
CREATE POLICY "Public read roadmap_days" ON public.roadmap_days FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read roadmap_day_topics" ON public.roadmap_day_topics;
CREATE POLICY "Public read roadmap_day_topics" ON public.roadmap_day_topics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read roadmap_items" ON public.roadmap_items;
CREATE POLICY "Public read roadmap_items" ON public.roadmap_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read roadmap_problem_references" ON public.roadmap_problem_references;
CREATE POLICY "Public read roadmap_problem_references" ON public.roadmap_problem_references FOR SELECT USING (true);

-- User progress policies (Authenticated ownership)
DROP POLICY IF EXISTS "User select own roadmap_progress" ON public.user_roadmap_progress;
CREATE POLICY "User select own roadmap_progress" ON public.user_roadmap_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User insert own roadmap_progress" ON public.user_roadmap_progress;
CREATE POLICY "User insert own roadmap_progress" ON public.user_roadmap_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "User update own roadmap_progress" ON public.user_roadmap_progress;
CREATE POLICY "User update own roadmap_progress" ON public.user_roadmap_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User select own item_progress" ON public.user_roadmap_item_progress;
CREATE POLICY "User select own item_progress" ON public.user_roadmap_item_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User insert own item_progress" ON public.user_roadmap_item_progress;
CREATE POLICY "User insert own item_progress" ON public.user_roadmap_item_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "User update own item_progress" ON public.user_roadmap_item_progress;
CREATE POLICY "User update own item_progress" ON public.user_roadmap_item_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 13. SEED CANONICAL ROADMAP: "DSA Interview Mastery"
INSERT INTO public.roadmaps (id, title, slug, description, estimated_duration, total_sprints, icon_name, order_index, is_published)
VALUES (
  '00000000-0000-0000-0000-000000000801',
  'DSA Interview Mastery',
  'dsa-mastery',
  'A rigorous sprint-and-day structured engineering roadmap designed for top-tier software engineering interviews. Invariant-driven algorithmic progressions with verified Problem Catalog references.',
  '~120 Hours',
  12,
  'Compass',
  1,
  true
)
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    estimated_duration = EXCLUDED.estimated_duration,
    total_sprints = EXCLUDED.total_sprints;

-- Phase 1
INSERT INTO public.roadmap_phases (id, roadmap_id, title, slug, description, position)
VALUES (
  '00000000-0000-0000-0000-000000000811',
  '00000000-0000-0000-0000-000000000801',
  'Core Algorithmic Foundations',
  'core-foundations',
  'Master essential data structures, linear invariants, time complexity proofs, and basic space-time tradeoffs.',
  1
)
ON CONFLICT (roadmap_id, position) DO NOTHING;

-- Sprint 1: Arrays, Two Pointers & Invariants
INSERT INTO public.roadmap_sprints (id, roadmap_id, phase_id, title, slug, description, position, estimated_hours)
VALUES (
  '00000000-0000-0000-0000-000000000821',
  '00000000-0000-0000-0000-000000000801',
  '00000000-0000-0000-0000-000000000811',
  'Sprint 1 — Arrays, Two Pointers & Invariants',
  'sprint-1-arrays-two-pointers',
  'Master linear scans, hash table lookups, sliding windows, and invariant proofs on contiguous sequences.',
  1,
  12.0
)
ON CONFLICT (roadmap_id, position) DO NOTHING;

-- Sprint 2: Stacks, Queues & Monotonic Sequences
INSERT INTO public.roadmap_sprints (id, roadmap_id, phase_id, title, slug, description, position, estimated_hours)
VALUES (
  '00000000-0000-0000-0000-000000000822',
  '00000000-0000-0000-0000-000000000801',
  '00000000-0000-0000-0000-000000000811',
  'Sprint 2 — Stacks, Queues & Monotonic Sequences',
  'sprint-2-stacks-queues',
  'Understand lifo invariants, parentheses parsing, and monotonic stack boundary sweeps.',
  2,
  10.0
)
ON CONFLICT (roadmap_id, position) DO NOTHING;

-- Sprint 3: Intervals, Hash Maps & Caching Systems
INSERT INTO public.roadmap_sprints (id, roadmap_id, phase_id, title, slug, description, position, estimated_hours)
VALUES (
  '00000000-0000-0000-0000-000000000823',
  '00000000-0000-0000-0000-000000000801',
  '00000000-0000-0000-0000-000000000811',
  'Sprint 3 — Intervals, Hash Maps & Caching Systems',
  'sprint-3-intervals-caching',
  'Interval scheduling, segment merging, and combined linked-list hash map architectures.',
  3,
  14.0
)
ON CONFLICT (roadmap_id, position) DO NOTHING;

-- Days for Sprint 1
-- Day 1
INSERT INTO public.roadmap_days (id, sprint_id, day_number, title, description, learning_objectives, position)
VALUES (
  '00000000-0000-0000-0000-000000000831',
  '00000000-0000-0000-0000-000000000821',
  1,
  'Linear Search, Hashing & Complement Invariants',
  'Formulate formal loop invariants for complement lookups and prove O(n) worst-case time complexity.',
  '["Understand complement hashing pattern", "Prove O(n) single-pass safety", "Formulate loop invariant"]'::jsonb,
  1
)
ON CONFLICT (sprint_id, position) DO NOTHING;

-- Day 2
INSERT INTO public.roadmap_days (id, sprint_id, day_number, title, description, learning_objectives, position)
VALUES (
  '00000000-0000-0000-0000-000000000832',
  '00000000-0000-0000-0000-000000000821',
  2,
  'Window Expansion & Dynamic Two Pointers',
  'Build shrinking and expanding window invariants to guarantee subsegment correctness.',
  '["Master shrinking window conditions", "Handle non-negative arrays", "Identify monotonic window boundaries"]'::jsonb,
  2
)
ON CONFLICT (sprint_id, position) DO NOTHING;

-- Day 3 (Sprint 2)
INSERT INTO public.roadmap_days (id, sprint_id, day_number, title, description, learning_objectives, position)
VALUES (
  '00000000-0000-0000-0000-000000000833',
  '00000000-0000-0000-0000-000000000822',
  3,
  'Balanced Sequences & Monotonic Stack',
  'Master balanced matching invariants and monotonic boundary reduction for elevation histograms.',
  '["Recognize lifo matching invariants", "Maintain monotonic stack order", "Calculate bounded histogram areas"]'::jsonb,
  1
)
ON CONFLICT (sprint_id, position) DO NOTHING;

-- Day 4 (Sprint 3)
INSERT INTO public.roadmap_days (id, sprint_id, day_number, title, description, learning_objectives, position)
VALUES (
  '00000000-0000-0000-0000-000000000834',
  '00000000-0000-0000-0000-000000000823',
  4,
  'Interval Merging & Cache Eviction Topology',
  'Master sorted interval sweep line invariants and O(1) eviction mechanics.',
  '["Sort-and-merge sweep invariant", "O(1) doubly linked list + map synchronization", "Evict least recently used entries safely"]'::jsonb,
  1
)
ON CONFLICT (sprint_id, position) DO NOTHING;

-- Topics for Day 1
INSERT INTO public.roadmap_day_topics (id, day_id, title, description, position)
VALUES (
  '00000000-0000-0000-0000-000000000841',
  '00000000-0000-0000-0000-000000000831',
  'Complement Lookups & Hash Mapping',
  'Algorithmic formulations for pairing elements with zero quadratic overhead.',
  1
)
ON CONFLICT (day_id, position) DO NOTHING;

-- Topics for Day 2
INSERT INTO public.roadmap_day_topics (id, day_id, title, description, position)
VALUES (
  '00000000-0000-0000-0000-000000000842',
  '00000000-0000-0000-0000-000000000832',
  'Sliding Window & Substring Bounds',
  'Two-pointer window expansion and contraction logic.',
  1
)
ON CONFLICT (day_id, position) DO NOTHING;

-- Topics for Day 3
INSERT INTO public.roadmap_day_topics (id, day_id, title, description, position)
VALUES (
  '00000000-0000-0000-0000-000000000843',
  '00000000-0000-0000-0000-000000000833',
  'Lifo Evaluation & Monotonic Stack',
  'Stack frame state evaluation and monotonic height boundaries.',
  1
)
ON CONFLICT (day_id, position) DO NOTHING;

-- Topics for Day 4
INSERT INTO public.roadmap_day_topics (id, day_id, title, description, position)
VALUES (
  '00000000-0000-0000-0000-000000000844',
  '00000000-0000-0000-0000-000000000834',
  'Interval Sweep & LRU Eviction',
  'Sweep line algorithms and composite data structures.',
  1
)
ON CONFLICT (day_id, position) DO NOTHING;

-- Items for Day 1
INSERT INTO public.roadmap_items (id, day_id, topic_id, title, description, item_type, position, required, estimated_minutes)
VALUES
(
  '00000000-0000-0000-0000-000000000851',
  '00000000-0000-0000-0000-000000000831',
  '00000000-0000-0000-0000-000000000841',
  'Concept: Invariant Formulation for Array Complement Lookups',
  'Formal definition of the complement invariant: for any index i, table contains all elements in 0..i-1.',
  'CONCEPT',
  1,
  true,
  15
),
(
  '00000000-0000-0000-0000-000000000852',
  '00000000-0000-0000-0000-000000000831',
  '00000000-0000-0000-0000-000000000841',
  'Lecture: Safe Hash Table Lookups & Memory Bounds',
  'Deep dive into collision handling, load factors, and cache locality for associative lookups.',
  'LECTURE',
  2,
  false,
  20
),
(
  '00000000-0000-0000-0000-000000000853',
  '00000000-0000-0000-0000-000000000831',
  '00000000-0000-0000-0000-000000000841',
  'Practice: Solve Two Sum',
  'Implement the canonical single-pass hash map solution and submit to the VERNIQ execution judge.',
  'PROBLEM',
  3,
  true,
  25
),
(
  '00000000-0000-0000-0000-000000000854',
  '00000000-0000-0000-0000-000000000831',
  '00000000-0000-0000-0000-000000000841',
  'Revision: Single-Pass vs Two-Pass Space Tradeoffs',
  'Review memory footprints and early-exit termination conditions.',
  'REVISION',
  4,
  false,
  10
)
ON CONFLICT (day_id, position) DO NOTHING;

-- Items for Day 2
INSERT INTO public.roadmap_items (id, day_id, topic_id, title, description, item_type, position, required, estimated_minutes)
VALUES
(
  '00000000-0000-0000-0000-000000000855',
  '00000000-0000-0000-0000-000000000832',
  '00000000-0000-0000-0000-000000000842',
  'Concept: Monotonic Sliding Window Conditions',
  'Establishing left and right boundary rules and frequency map invariant updates.',
  'CONCEPT',
  1,
  true,
  15
),
(
  '00000000-0000-0000-0000-000000000856',
  '00000000-0000-0000-0000-000000000832',
  '00000000-0000-0000-0000-000000000842',
  'Practice: Longest Substring Without Repeating Characters',
  'Apply dynamic sliding window with character last-seen index tracking.',
  'PROBLEM',
  2,
  true,
  35
),
(
  '00000000-0000-0000-0000-000000000857',
  '00000000-0000-0000-0000-000000000832',
  '00000000-0000-0000-0000-000000000842',
  'Practice: Best Time to Buy and Sell Stock',
  'Formulate single-pass minimum valley tracking invariant.',
  'PROBLEM',
  3,
  true,
  20
)
ON CONFLICT (day_id, position) DO NOTHING;

-- Items for Day 3
INSERT INTO public.roadmap_items (id, day_id, topic_id, title, description, item_type, position, required, estimated_minutes)
VALUES
(
  '00000000-0000-0000-0000-000000000858',
  '00000000-0000-0000-0000-000000000833',
  '00000000-0000-0000-0000-000000000843',
  'Concept: Bracket Matching Invariant & Depth Counters',
  'Proving grammar nesting correctness using LIFO stack state machines.',
  'CONCEPT',
  1,
  true,
  15
),
(
  '00000000-0000-0000-0000-000000000859',
  '00000000-0000-0000-0000-000000000833',
  '00000000-0000-0000-0000-000000000843',
  'Practice: Valid Parentheses',
  'Solve delimiter matching with map lookup and early-fail guards.',
  'PROBLEM',
  2,
  true,
  20
),
(
  '00000000-0000-0000-0000-000000000860',
  '00000000-0000-0000-0000-000000000833',
  '00000000-0000-0000-0000-000000000843',
  'Practice: Trapping Rain Water',
  'Compute volumetric retention using two pointers or monotonic decreasing stack.',
  'PROBLEM',
  3,
  true,
  45
)
ON CONFLICT (day_id, position) DO NOTHING;

-- Items for Day 4
INSERT INTO public.roadmap_items (id, day_id, topic_id, title, description, item_type, position, required, estimated_minutes)
VALUES
(
  '00000000-0000-0000-0000-000000000861',
  '00000000-0000-0000-0000-000000000834',
  '00000000-0000-0000-0000-000000000844',
  'Concept: Sweep-Line Invariant for Interval Overlaps',
  'Sorting start boundaries and expanding end boundaries iteratively.',
  'CONCEPT',
  1,
  true,
  20
),
(
  '00000000-0000-0000-0000-000000000862',
  '00000000-0000-0000-0000-000000000834',
  '00000000-0000-0000-0000-000000000844',
  'Practice: Merge Intervals',
  'Sort by starting coordinate and greedily absorb overlapping intervals.',
  'PROBLEM',
  2,
  true,
  30
),
(
  '00000000-0000-0000-0000-000000000863',
  '00000000-0000-0000-0000-000000000834',
  '00000000-0000-0000-0000-000000000844',
  'Practice: LRU Cache Design',
  'Build combined Doubly Linked List and Hash Map with O(1) get and put operations.',
  'PROBLEM',
  3,
  true,
  45
)
ON CONFLICT (day_id, position) DO NOTHING;

-- Problem References
-- Connecting Roadmap Items to Problem Catalog via permanent verniq_id (VRQ-XXXXXX)
INSERT INTO public.roadmap_problem_references (roadmap_item_id, verniq_problem_id, position, required, notes)
VALUES
  ('00000000-0000-0000-0000-000000000853', 'VRQ-000001', 1, true, 'Two Sum - Invariant: complement lookup in single-pass hash map.'),
  ('00000000-0000-0000-0000-000000000856', 'VRQ-000005', 1, true, 'Longest Substring Without Repeating Characters - Invariant: window [L, R] has unique characters.'),
  ('00000000-0000-0000-0000-000000000857', 'VRQ-000006', 1, true, 'Best Time to Buy and Sell Stock - Invariant: min_price tracks lowest point in 0..i.'),
  ('00000000-0000-0000-0000-000000000859', 'VRQ-000004', 1, true, 'Valid Parentheses - Invariant: stack top matches closing delimiter.'),
  ('00000000-0000-0000-0000-000000000860', 'VRQ-000010', 1, true, 'Trapping Rain Water - Invariant: bounded by min(maxLeft, maxRight).'),
  ('00000000-0000-0000-0000-000000000862', 'VRQ-000003', 1, true, 'Merge Intervals - Invariant: current[0] <= prev[1] indicates overlap.'),
  ('00000000-0000-0000-0000-000000000863', 'VRQ-000002', 1, true, 'LRU Cache - Invariant: head points to most recent, tail to least recent.')
ON CONFLICT (roadmap_item_id, verniq_problem_id) DO NOTHING;
