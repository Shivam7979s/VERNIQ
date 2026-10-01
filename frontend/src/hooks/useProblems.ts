import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { FALLBACK_PROBLEMS } from '@/lib/curriculumData';
import type { Problem } from '@/types';

interface ProblemTagRow {
  tags: {
    name: string;
  } | null;
}

interface ProblemTopicRow {
  topic: {
    name: string;
  } | null;
}

interface SupabaseProblemRow {
  id: string;
  verniq_id?: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  acceptance_rate: number | null;
  is_premium: boolean;
  is_published: boolean;
  workflow_status?: 'draft' | 'content_review' | 'technical_review' | 'ready' | 'published' | 'archived';
  domain?: {
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
  problem_topics?: ProblemTopicRow[];
  problem_tags?: ProblemTagRow[];
}

export const useProblems = () => {
  const [problems, setProblems] = useState<Problem[]>(FALLBACK_PROBLEMS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      setProblems(FALLBACK_PROBLEMS);
      setLoading(false);
      return;
    }

    try {
      // Parallel batch fetch across all 3,392 problem records
      const fetchBatch = (offset: number) =>
        supabase
          .from('problems')
          .select(`
            id,
            verniq_id,
            title,
            slug,
            difficulty,
            acceptance_rate,
            is_premium,
            is_published,
            workflow_status,
            created_at,
            updated_at,
            domain:domains (
              name
            ),
            problem_topics (
              topic:topics (
                name
              )
            ),
            problem_tags (
              tags (
                name
              )
            )
          `)
          .order('verniq_id', { ascending: true })
          .range(offset, offset + 999);

      const [b1, b2, b3, b4] = await Promise.all([
        fetchBatch(0),
        fetchBatch(1000),
        fetchBatch(2000),
        fetchBatch(3000),
      ]);

      const data: SupabaseProblemRow[] = [
        ...((b1.data as unknown as SupabaseProblemRow[]) || []),
        ...((b2.data as unknown as SupabaseProblemRow[]) || []),
        ...((b3.data as unknown as SupabaseProblemRow[]) || []),
        ...((b4.data as unknown as SupabaseProblemRow[]) || []),
      ];

      if (data && data.length > 0) {
        const mapped: Problem[] = data.map((row) => {
          const tags: string[] = [];
          if (row.problem_topics && row.problem_topics.length > 0) {
            row.problem_topics.forEach((pt) => {
              if (pt.topic?.name) tags.push(pt.topic.name);
            });
          } else if (row.problem_tags) {
            row.problem_tags.forEach((pt) => {
              if (pt.tags?.name) tags.push(pt.tags.name);
            });
          }

          return {
            id: row.id,
            verniq_id: row.verniq_id,
            title: row.title,
            slug: row.slug,
            difficulty: row.difficulty,
            acceptance_rate: Number(row.acceptance_rate || 0),
            description_markdown: '',
            constraints_markdown: '',
            starter_templates: {},
            is_premium: row.is_premium,
            is_published: row.is_published,
            workflow_status: row.workflow_status || (row.is_published ? 'published' : 'draft'),
            domain: row.domain?.name || 'DSA',
            tags: tags.length > 0 ? tags : ['General'],
            created_at: row.created_at,
            updated_at: row.updated_at,
          };
        });

        setProblems(mapped);
      } else {
        setProblems(FALLBACK_PROBLEMS);
      }
    } catch (err: unknown) {
      console.warn('Failed to query Supabase problems, falling back to local dataset:', err);
      setProblems(FALLBACK_PROBLEMS);
      setError(err instanceof Error ? err.message : 'Unknown error fetching problems');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  return {
    problems,
    loading,
    error,
    refetch: fetchProblems,
  };
};
