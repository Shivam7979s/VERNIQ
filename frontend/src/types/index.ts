/**
 * VERNIQ Foundational Domain Types (Phase 0 Baseline)
 * Aligned with PostgreSQL database conventions in docs/database/database-conventions.md
 */

export type UserRole = 'student' | 'mentor' | 'admin';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type ProgrammingLanguage = 'cpp' | 'java' | 'python' | 'typescript' | 'go';

export type SubmissionVerdict =
  | 'pending'
  | 'running'
  | 'accepted'
  | 'wrong_answer'
  | 'time_limit_exceeded'
  | 'memory_limit_exceeded'
  | 'compilation_error'
  | 'runtime_error'
  | 'internal_error'
  | 'ac'   // Accepted shorthand
  | 'wa'   // Wrong Answer shorthand
  | 'tle'  // Time Limit Exceeded shorthand
  | 'mle'  // Memory Limit Exceeded shorthand
  | 'ce'   // Compilation Error shorthand
  | 're'   // Runtime Error shorthand
  | 'pe';  // Presentation Error shorthand

export interface Submission {
  id: string;
  user_id: string;
  problem_id?: string | null;
  language: ProgrammingLanguage;
  source_code: string;
  stdin_input?: string | null;
  verdict: SubmissionVerdict;
  runtime_ms: number;
  memory_kb: number;
  stdout_output?: string | null;
  stderr_output?: string | null;
  compile_output?: string | null;
  test_cases_passed: number;
  total_test_cases: number;
  is_custom_run: boolean;
  created_at: string;
  completed_at?: string | null;
}

export type CompletionStatus = 'completed' | 'in_progress' | 'pending';

export interface College {
  id: string;
  name: string;
  slug: string;
  state?: string | null;
  country?: string | null;
  student_count: number;
  total_score: number;
  created_at?: string;
}

export interface UserProfile {
  id: string; // UUID references auth.users(id)
  username: string; // CITEXT
  full_name: string; // TEXT
  avatar_url?: string | null;
  role: UserRole; // app_role enum
  bio?: string | null;
  github_username?: string | null;
  linkedin_url?: string | null;
  leetcode_username?: string | null;
  college_id?: string | null;
  college_name?: string | null;
  preferred_language?: string | null;
  tab_size?: number;
  score: number;
  problems_solved_count: number;
  current_streak: number;
  max_streak: number;
  created_at: string; // ISO 8601
  updated_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string | null;
  college_name?: string | null;
  college_id?: string | null;
  problems_solved_count: number;
  score: number;
  current_streak?: number;
}

export interface CollegeLeaderboardEntry {
  college_rank: number;
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string | null;
  college_id: string;
  college_name: string;
  problems_solved_count: number;
  score: number;
  current_streak?: number;
}

export interface CampusLeagueEntry {
  rank: number;
  id: string;
  name: string;
  slug: string;
  state?: string | null;
  country?: string | null;
  student_count: number;
  total_score: number;
}

export interface ProblemSummary {
  id: string;
  slug: string;
  title: string;
  difficulty: DifficultyLevel;
  acceptanceRate: number;
  tags: string[];
  isPremium?: boolean;
}

export interface RoadmapMilestone {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  estimatedDuration: string;
  status: CompletionStatus;
}

export type ProblemStatus = 'todo' | 'attempted' | 'solved';

export interface ProblemTag {
  id: string;
  name: string;
  slug: string;
}

export interface TestCase {
  id: string;
  problem_id: string;
  input: string;
  expected_output: string;
  is_sample: boolean;
  order_index: number;
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: DifficultyLevel;
  acceptance_rate: number;
  description_markdown: string;
  constraints_markdown: string;
  starter_templates: Record<string, string>;
  is_premium: boolean;
  is_published: boolean;
  tags?: string[];
  status?: ProblemStatus;
  revision_due?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RoadmapTopic {
  id: string;
  step_id: string;
  title: string;
  order_index: number;
  problems?: Problem[];
}

export interface RoadmapStep {
  id: string;
  roadmap_id: string;
  title: string;
  order_index: number;
  topics?: RoadmapTopic[];
}

export interface Roadmap {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon_name?: string;
  order_index: number;
  is_published: boolean;
  steps?: RoadmapStep[];
}

export interface UserProblemProgress {
  id?: string;
  user_id: string;
  problem_id: string;
  status: ProblemStatus;
  solved_at?: string | null;
  notes?: string | null;
  is_favorite?: boolean;
}

export interface UserRevisionItem {
  id?: string;
  user_id: string;
  problem_id: string;
  interval_days: number;
  next_review_at: string;
  is_reviewed: boolean;
}

export type PlannerGoal =
  | 'product_sde'
  | 'faang_top_tier'
  | 'core_cs_foundations'
  | 'campus_placement';

export type PlanTaskStatus = 'pending' | 'completed' | 'skipped';

export interface UserStudyPlan {
  id: string;
  user_id: string;
  title: string;
  goal: PlannerGoal;
  target_date: string;
  daily_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface UserStudyPlanTask {
  id: string;
  plan_id: string;
  user_id: string;
  problem_id: string;
  scheduled_date: string; // YYYY-MM-DD
  status: PlanTaskStatus;
  completed_at?: string | null;
  order_index: number;
  problems?: {
    id: string;
    title: string;
    slug: string;
    difficulty: DifficultyLevel;
    tags?: string[];
  };
}

export interface RevisionCard {
  id: string;
  user_id: string;
  problem_id: string;
  interval_days: number;
  next_review_at: string;
  is_reviewed: boolean;
  problem?: {
    id: string;
    title: string;
    slug: string;
    difficulty: DifficultyLevel;
    description_markdown?: string;
    constraints_markdown?: string;
    tags?: string[];
  };
}


