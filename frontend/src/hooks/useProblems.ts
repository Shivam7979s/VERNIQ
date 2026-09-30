import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { FALLBACK_PROBLEMS } from '@/lib/curriculumData';
import type { Problem } from '@/types';

interface ProblemTagRow {
  tags: {
    name: string;
  } | null;
}

interface SupabaseProblemRow {
  id: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  acceptance_rate: number | null;
  description_markdown: string;
  constraints_markdown: string;
  starter_templates: Record<string, string>;
  is_premium: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
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
      const { data, error: sbError } = await supabase
        .from('problems')
        .select(`
          id,
          title,
          slug,
          difficulty,
          acceptance_rate,
          description_markdown,
          constraints_markdown,
          starter_templates,
          is_premium,
          is_published,
          created_at,
          updated_at,
          problem_tags (
            tags (
              name
            )
          )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: true });

      if (sbError) {
        throw sbError;
      }

      if (data && data.length > 0) {
        const mapped: Problem[] = (data as unknown as SupabaseProblemRow[]).map((row) => {
          const tags: string[] = [];
          if (row.problem_tags) {
            row.problem_tags.forEach((pt) => {
              if (pt.tags?.name) tags.push(pt.tags.name);
            });
          }

          return {
            id: row.id,
            title: row.title,
            slug: row.slug,
            difficulty: row.difficulty,
            acceptance_rate: Number(row.acceptance_rate || 0),
            description_markdown: row.description_markdown,
            constraints_markdown: row.constraints_markdown,
            starter_templates: row.starter_templates || {},
            is_premium: row.is_premium,
            is_published: row.is_published,
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
