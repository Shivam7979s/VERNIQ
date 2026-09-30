import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { FALLBACK_PROBLEMS, FALLBACK_SAMPLE_TEST_CASES } from '@/lib/curriculumData';
import type { Problem, TestCase } from '@/types';

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

export const useProblemBySlug = (slug: string) => {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProblem = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    // Fallback locator
    const fallbackProb =
      FALLBACK_PROBLEMS.find((p) => p.slug === slug) || FALLBACK_PROBLEMS[0];
    const fallbackTCs =
      FALLBACK_SAMPLE_TEST_CASES[slug] ||
      FALLBACK_SAMPLE_TEST_CASES[fallbackProb.slug] ||
      [];

    if (!isSupabaseConfigured()) {
      setProblem(fallbackProb);
      setTestCases(fallbackTCs);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch Problem
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
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (sbError) throw sbError;

      if (data) {
        const row = data as unknown as SupabaseProblemRow;
        const tags: string[] = [];
        if (row.problem_tags) {
          row.problem_tags.forEach((pt) => {
            if (pt.tags?.name) tags.push(pt.tags.name);
          });
        }

        const mappedProblem: Problem = {
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

        setProblem(mappedProblem);

        // 2. Fetch Sample Test Cases
        const { data: tcData, error: tcError } = await supabase
          .from('test_cases')
          .select('id, problem_id, input, expected_output, is_sample, order_index')
          .eq('problem_id', row.id)
          .eq('is_sample', true)
          .order('order_index', { ascending: true });

        if (!tcError && tcData && tcData.length > 0) {
          setTestCases(tcData as TestCase[]);
        } else {
          setTestCases(fallbackTCs);
        }
      } else {
        setProblem(fallbackProb);
        setTestCases(fallbackTCs);
      }
    } catch (err: unknown) {
      console.warn('Failed to fetch problem by slug from Supabase, using fallback:', err);
      setProblem(fallbackProb);
      setTestCases(fallbackTCs);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProblem();
  }, [fetchProblem]);

  return {
    problem,
    testCases,
    loading,
    error,
    refetch: fetchProblem,
  };
};
