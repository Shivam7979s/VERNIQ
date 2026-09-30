-- ==============================================================================
-- VERNIQ Phase 1 Extension: College Entity, Profiles Integration, and Leaderboards
-- Migration: 20261001000002_create_colleges_and_leaderboards.sql
-- ==============================================================================

-- 1. Create Colleges Table
CREATE TABLE IF NOT EXISTS public.colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name CITEXT UNIQUE NOT NULL,
  slug CITEXT UNIQUE NOT NULL,
  state TEXT,
  country TEXT DEFAULT 'India',
  student_count INTEGER DEFAULT 0 CHECK (student_count >= 0),
  total_score BIGINT DEFAULT 0 CHECK (total_score >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for colleges lookup and leaderboard queries
CREATE INDEX IF NOT EXISTS idx_colleges_slug ON public.colleges(slug);
CREATE INDEX IF NOT EXISTS idx_colleges_total_score ON public.colleges(total_score DESC);

-- Enable RLS on Colleges
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Colleges are viewable by everyone" ON public.colleges;
CREATE POLICY "Colleges are viewable by everyone"
  ON public.colleges
  FOR SELECT
  USING (true);

-- Allow authenticated users to suggest / insert colleges if not present
DROP POLICY IF EXISTS "Authenticated users can add college" ON public.colleges;
CREATE POLICY "Authenticated users can add college"
  ON public.colleges
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 2. Seed Initial Prominent Indian Engineering Colleges
INSERT INTO public.colleges (name, slug, state, country, student_count, total_score)
VALUES
  ('Indian Institute of Technology Bombay', 'iit-bombay', 'Maharashtra', 'India', 38, 14250),
  ('Indian Institute of Technology Delhi', 'iit-delhi', 'Delhi', 'India', 35, 13800),
  ('Indian Institute of Technology Madras', 'iit-madras', 'Tamil Nadu', 'India', 32, 12900),
  ('Indian Institute of Technology Kanpur', 'iit-kanpur', 'Uttar Pradesh', 'India', 28, 11400),
  ('Indian Institute of Technology Kharagpur', 'iit-kharagpur', 'West Bengal', 'India', 29, 10850),
  ('Indian Institute of Technology Roorkee', 'iit-roorkee', 'Uttarakhand', 'India', 25, 9600),
  ('Birla Institute of Technology and Science, Pilani', 'bits-pilani', 'Rajasthan', 'India', 30, 11950),
  ('National Institute of Technology Tiruchirappalli', 'nit-trichy', 'Tamil Nadu', 'India', 24, 8900),
  ('National Institute of Technology Karnataka, Surathkal', 'nit-surathkal', 'Karnataka', 'India', 22, 8450),
  ('National Institute of Technology Warangal', 'nit-warangal', 'Telangana', 'India', 20, 7800),
  ('International Institute of Information Technology, Hyderabad', 'iiit-hyderabad', 'Telangana', 'India', 31, 13200),
  ('International Institute of Information Technology, Bangalore', 'iiit-bangalore', 'Karnataka', 'India', 19, 7500),
  ('Delhi Technological University', 'dtu-delhi', 'Delhi', 'India', 26, 9200),
  ('Netaji Subhas University of Technology', 'nsut-delhi', 'Delhi', 'India', 21, 7900),
  ('Vellore Institute of Technology, Vellore', 'vit-vellore', 'Tamil Nadu', 'India', 42, 10400),
  ('Jadavpur University', 'jadavpur-university', 'West Bengal', 'India', 18, 7100),
  ('Rajiv Gandhi Proudyogiki Vishwavidyalaya, Bhopal', 'rgpv-bhopal', 'Madhya Pradesh', 'India', 27, 8150),
  ('College of Engineering, Pune', 'coep-pune', 'Maharashtra', 'India', 17, 6950),
  ('PSG College of Technology', 'psg-tech', 'Tamil Nadu', 'India', 16, 6400),
  ('Thapar Institute of Engineering and Technology', 'thapar-patiala', 'Punjab', 'India', 19, 7250)
ON CONFLICT (slug) DO NOTHING;

-- 3. Profile Schema Integration
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0),
  ADD COLUMN IF NOT EXISTS problems_solved_count INTEGER NOT NULL DEFAULT 0 CHECK (problems_solved_count >= 0);

CREATE INDEX IF NOT EXISTS idx_profiles_score ON public.profiles(score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_college_score ON public.profiles(college_id, score DESC);

-- Automatic synchronization of college aggregate student count and score
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_college_stats ON public.profiles;
CREATE TRIGGER trigger_sync_college_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_college_stats();

-- 4. Leaderboard Analytical Views

-- 4.1 Global Leaderboard View
CREATE OR REPLACE VIEW public.view_global_leaderboard AS
SELECT
  DENSE_RANK() OVER (ORDER BY p.score DESC, p.problems_solved_count DESC, p.created_at ASC) AS rank,
  p.id,
  p.username,
  p.full_name,
  p.avatar_url,
  c.name AS college_name,
  p.college_id,
  p.problems_solved_count,
  p.score,
  p.current_streak
FROM public.profiles p
LEFT JOIN public.colleges c ON p.college_id = c.id;

-- 4.2 College-Specific Leaderboard View
CREATE OR REPLACE VIEW public.view_college_leaderboard AS
SELECT
  DENSE_RANK() OVER (
    PARTITION BY p.college_id
    ORDER BY p.score DESC, p.problems_solved_count DESC, p.created_at ASC
  ) AS college_rank,
  p.id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.college_id,
  c.name AS college_name,
  p.problems_solved_count,
  p.score,
  p.current_streak
FROM public.profiles p
INNER JOIN public.colleges c ON p.college_id = c.id;

-- 4.3 Campus League (Top Colleges) View
CREATE OR REPLACE VIEW public.view_top_colleges AS
SELECT
  DENSE_RANK() OVER (ORDER BY c.total_score DESC, c.student_count DESC, c.name ASC) AS rank,
  c.id,
  c.name,
  c.slug,
  c.state,
  c.country,
  c.student_count,
  c.total_score
FROM public.colleges c;
