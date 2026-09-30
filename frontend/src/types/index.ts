/**
 * VERNIQ Foundational Domain Types (Phase 0 Baseline)
 * Aligned with PostgreSQL database conventions in docs/database/database-conventions.md
 */

export type UserRole = 'student' | 'mentor' | 'admin';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type SubmissionVerdict =
  | 'ac'   // Accepted
  | 'wa'   // Wrong Answer
  | 'tle'  // Time Limit Exceeded
  | 'mle'  // Memory Limit Exceeded
  | 'ce'   // Compilation Error
  | 're'   // Runtime Error
  | 'pe';  // Presentation Error

export type CompletionStatus = 'completed' | 'in_progress' | 'pending';

export interface UserProfile {
  id: string; // UUID references auth.users(id)
  username: string; // CITEXT
  full_name: string; // TEXT
  avatar_url?: string | null;
  role: UserRole; // app_role enum
  bio?: string | null;
  github_username?: string | null;
  linkedin_url?: string | null;
  current_streak: number;
  max_streak: number;
  created_at: string; // ISO 8601
  updated_at: string;
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
