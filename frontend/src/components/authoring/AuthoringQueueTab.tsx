import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DifficultyBadge } from '@/components/learning/DifficultyBadge';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { Button } from '@/components/ui/actions/Button';
import type { AuthoringQueueItem } from '@/types';
import {
  Search,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface AuthoringQueueTabProps {
  onSelectProblemForEdit: (verniqId: string) => void;
}

export const AuthoringQueueTab: React.FC<AuthoringQueueTabProps> = ({
  onSelectProblemForEdit,
}) => {
  const [search, setSearch] = useState('');
  const [workflowFilter, setWorkflowFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [sortBy] = useState('verniq_id');
  const [sortAsc] = useState(true);

  const [items, setItems] = useState<AuthoringQueueItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('problems')
        .select(
          `
          id, verniq_id, title, slug, difficulty, workflow_status, provenance_status,
          judge_readiness_status, is_published, generated_with_ai, human_reviewed,
          domain:domains(name),
          current_batch:problem_authoring_batches(id, batch_name),
          test_cases(count)
        `,
          { count: 'exact' }
        );

      if (workflowFilter !== 'all') {
        query = query.eq('workflow_status', workflowFilter);
      }
      if (difficultyFilter !== 'all') {
        query = query.eq('difficulty', difficultyFilter);
      }
      if (search.trim()) {
        const clean = search.trim();
        query = query.or(`verniq_id.ilike.%${clean}%,title.ilike.%${clean}%`);
      }

      // Sort
      query = query.order(sortBy, { ascending: sortAsc });

      // Range for pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      setTotalCount(count || 0);

      if (data) {
        const mapped: AuthoringQueueItem[] = data.map((row: any) => {
          const diff = row.difficulty || 'easy';
          const minTests = diff === 'hard' ? 300 : diff === 'medium' ? 250 : 200;
          const tcCount = row.test_cases?.[0]?.count || 0;
          const testComp = Math.min(100, Math.round((tcCount / minTests) * 100));

          const contentComp = ['technical_review', 'provenance_review', 'judge_ready', 'published'].includes(
            row.workflow_status
          )
            ? 100
            : row.workflow_status === 'content_review'
            ? 50
            : row.workflow_status === 'content_authoring'
            ? 25
            : 0;

          return {
            id: row.id,
            verniq_id: row.verniq_id || 'VRQ-UNKNOWN',
            title: row.title || 'Untitled',
            difficulty: row.difficulty,
            domain: row.domain?.name || 'DSA',
            topics: [],
            workflow_status: row.workflow_status || 'draft',
            provenance_status: row.provenance_status || 'PROVENANCE_REVIEW_REQUIRED',
            content_completeness: contentComp,
            test_completeness: testComp,
            test_case_count: tcCount,
            min_tests_required: minTests,
            judge_readiness: row.judge_readiness_status || 'NOT_READY',
            assigned_batch_id: row.current_batch?.id,
            assigned_batch_name: row.current_batch?.batch_name,
            ai_assisted: Boolean(row.generated_with_ai),
            human_reviewed: Boolean(row.human_reviewed),
            is_published: Boolean(row.is_published),
          };
        });

        setItems(mapped);
      }
    } catch (err) {
      console.error('Failed to load authoring queue:', err);
    } finally {
      setLoading(false);
    }
  }, [workflowFilter, difficultyFilter, search, sortBy, sortAsc, page]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* Search and Filters Bar */}
      <div className="p-4 rounded-lg border border-white/[0.08] bg-[#12151E] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Input
              placeholder="Search Verniq ID (e.g. VRQ-000008) or Title..."
              leftIcon={<Search className="w-3.5 h-3.5 text-text-muted" />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Workflow Filter */}
          <div className="w-44">
            <Select
              value={workflowFilter}
              onChange={(e) => {
                setWorkflowFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All Lifecycle States' },
                { value: 'draft', label: 'Draft (Quarantined)' },
                { value: 'content_authoring', label: 'Content Authoring' },
                { value: 'content_review', label: 'Content Review' },
                { value: 'technical_review', label: 'Technical Review' },
                { value: 'provenance_review', label: 'Provenance Review' },
                { value: 'judge_ready', label: 'Judge Ready' },
                { value: 'published', label: 'Published' },
              ]}
            />
          </div>

          {/* Difficulty Filter */}
          <div className="w-32">
            <Select
              value={difficultyFilter}
              onChange={(e) => {
                setDifficultyFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All Difficulties' },
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' },
              ]}
            />
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={fetchQueue}
            title="Refresh queue"
            className="h-9 px-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : 'text-text-muted'}`} />
          </Button>
        </div>
      </div>

      {/* Queue Table */}
      <div className="border border-white/[0.08] rounded-lg bg-[#12151E] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-text-muted uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Verniq ID</th>
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3">Difficulty</th>
                <th className="py-2.5 px-3">Domain</th>
                <th className="py-2.5 px-3">Lifecycle State</th>
                <th className="py-2.5 px-3">Provenance</th>
                <th className="py-2.5 px-3">Content</th>
                <th className="py-2.5 px-3">Tests (Canonical)</th>
                <th className="py-2.5 px-3">Assigned Batch</th>
                <th className="py-2.5 px-3 text-center">Flags</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-text-muted">
                    Loading authoring queue...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-text-muted">
                    No catalog items match current filter criteria.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Verniq ID */}
                    <td className="py-2.5 px-3 font-semibold text-primary">{item.verniq_id}</td>

                    {/* Title */}
                    <td className="py-2.5 px-3 font-medium text-white max-w-[200px] truncate" title={item.title}>
                      {item.title}
                    </td>

                    {/* Difficulty */}
                    <td className="py-2.5 px-3">
                      <DifficultyBadge difficulty={item.difficulty} />
                    </td>

                    {/* Domain */}
                    <td className="py-2.5 px-3 text-text-secondary">{item.domain}</td>

                    {/* Workflow Status */}
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          item.workflow_status === 'published'
                            ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                            : item.workflow_status === 'judge_ready'
                            ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-500/30'
                            : item.workflow_status === 'draft'
                            ? 'bg-white/[0.04] text-text-muted border border-white/[0.06]'
                            : 'bg-primary/10 text-primary border border-primary/20'
                        }`}
                      >
                        {item.workflow_status}
                      </span>
                    </td>

                    {/* Provenance Status */}
                    <td className="py-2.5 px-3">
                      {item.provenance_status === 'VERIFIED_VALID' ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                          <ShieldCheck className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400/80">
                          <ShieldAlert className="w-3 h-3" />
                          Review Req
                        </span>
                      )}
                    </td>

                    {/* Content Completeness */}
                    <td className="py-2.5 px-3">
                      <div className="w-20 flex items-center gap-1.5">
                        <div className="h-1 flex-1 bg-white/[0.08] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.content_completeness === 100 ? 'bg-emerald-400' : 'bg-primary'
                            }`}
                            style={{ width: `${item.content_completeness}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-text-muted">{item.content_completeness}%</span>
                      </div>
                    </td>

                    {/* Canonical Test Count */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-semibold ${
                            item.test_case_count >= item.min_tests_required ? 'text-emerald-400' : 'text-text-muted'
                          }`}
                        >
                          {item.test_case_count}
                        </span>
                        <span className="text-text-muted text-[10px]">/ {item.min_tests_required}</span>
                      </div>
                    </td>

                    {/* Assigned Batch */}
                    <td className="py-2.5 px-3">
                      {item.assigned_batch_name ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.05] text-white border border-white/[0.1] truncate max-w-[120px] inline-block">
                          {item.assigned_batch_name}
                        </span>
                      ) : (
                        <span className="text-text-muted text-[10px]">Unassigned</span>
                      )}
                    </td>

                    {/* Flags */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {item.ai_assisted && (
                          <span title="AI Assisted Draft" className="text-primary">
                            <Sparkles className="w-3 h-3" />
                          </span>
                        )}
                        {item.human_reviewed && (
                          <span title="Human Approved" className="text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onSelectProblemForEdit(item.verniq_id)}
                        className="text-[10px] font-mono h-6 px-2"
                        rightIcon={<ExternalLink className="w-3 h-3" />}
                      >
                        Open Studio
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-white/[0.08] flex items-center justify-between text-text-muted">
          <span>
            Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} of {totalCount.toLocaleString()} catalog problems
          </span>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="ghost"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 px-2"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
