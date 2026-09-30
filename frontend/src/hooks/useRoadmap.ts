import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { FALLBACK_ROADMAP } from '@/lib/curriculumData';
import type { Roadmap, RoadmapStep, RoadmapTopic, Problem } from '@/types';

interface SupabaseTopicProblemRow {
  order_index: number;
  problems: {
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
  } | null;
}

interface SupabaseTopicRow {
  id: string;
  step_id: string;
  title: string;
  order_index: number;
  topic_problems?: SupabaseTopicProblemRow[];
}

interface SupabaseStepRow {
  id: string;
  roadmap_id: string;
  title: string;
  order_index: number;
  roadmap_topics?: SupabaseTopicRow[];
}

interface SupabaseRoadmapRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon_name: string | null;
  order_index: number;
  is_published: boolean;
  roadmap_steps?: SupabaseStepRow[];
}

export const useRoadmap = (slug = 'dsa-problem-solving') => {
  const [roadmap, setRoadmap] = useState<Roadmap>(FALLBACK_ROADMAP);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoadmap = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      setRoadmap(FALLBACK_ROADMAP);
      setLoading(false);
      return;
    }

    try {
      const { data, error: sbError } = await supabase
        .from('roadmaps')
        .select(`
          id,
          title,
          slug,
          description,
          icon_name,
          order_index,
          is_published,
          roadmap_steps (
            id,
            roadmap_id,
            title,
            order_index,
            roadmap_topics (
              id,
              step_id,
              title,
              order_index,
              topic_problems (
                order_index,
                problems (
                  id,
                  title,
                  slug,
                  difficulty,
                  acceptance_rate,
                  description_markdown,
                  constraints_markdown,
                  starter_templates,
                  is_premium,
                  is_published
                )
              )
            )
          )
        `)
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (sbError) throw sbError;

      if (data) {
        const rRow = data as unknown as SupabaseRoadmapRow;

        const steps: RoadmapStep[] = (rRow.roadmap_steps || [])
          .sort((a, b) => a.order_index - b.order_index)
          .map((step) => {
            const topics: RoadmapTopic[] = (step.roadmap_topics || [])
              .sort((a, b) => a.order_index - b.order_index)
              .map((top) => {
                const problems: Problem[] = (top.topic_problems || [])
                  .sort((a, b) => a.order_index - b.order_index)
                  .filter((tp) => tp.problems !== null)
                  .map((tp) => ({
                    id: tp.problems!.id,
                    title: tp.problems!.title,
                    slug: tp.problems!.slug,
                    difficulty: tp.problems!.difficulty,
                    acceptance_rate: Number(tp.problems!.acceptance_rate || 0),
                    description_markdown: tp.problems!.description_markdown,
                    constraints_markdown: tp.problems!.constraints_markdown,
                    starter_templates: tp.problems!.starter_templates || {},
                    is_premium: tp.problems!.is_premium,
                    is_published: tp.problems!.is_published,
                    tags: ['Core'],
                  }));

                return {
                  id: top.id,
                  step_id: top.step_id,
                  title: top.title,
                  order_index: top.order_index,
                  problems,
                };
              });

            return {
              id: step.id,
              roadmap_id: step.roadmap_id,
              title: step.title,
              order_index: step.order_index,
              topics,
            };
          });

        setRoadmap({
          id: rRow.id,
          title: rRow.title,
          slug: rRow.slug,
          description: rRow.description,
          icon_name: rRow.icon_name || 'Terminal',
          order_index: rRow.order_index,
          is_published: rRow.is_published,
          steps,
        });
      } else {
        setRoadmap(FALLBACK_ROADMAP);
      }
    } catch (err: unknown) {
      console.warn('Failed to load roadmap from Supabase, using fallback:', err);
      setRoadmap(FALLBACK_ROADMAP);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchRoadmap();
  }, [fetchRoadmap]);

  return {
    roadmap,
    loading,
    error,
    refetch: fetchRoadmap,
  };
};
