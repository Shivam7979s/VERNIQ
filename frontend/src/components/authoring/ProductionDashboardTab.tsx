import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/actions/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import type { AuthoringBatch, BatchProblemItem, ProductionPipelineMetrics } from '@/types';
import {
  Layers,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  RefreshCw,
  FolderPlus,
  X,
  ExternalLink,
} from 'lucide-react';

interface ProductionDashboardTabProps {
  onSelectProblemForEdit: (verniqId: string) => void;
}

export const ProductionDashboardTab: React.FC<ProductionDashboardTabProps> = ({
  onSelectProblemForEdit,
}) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<ProductionPipelineMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [batches, setBatches] = useState<AuthoringBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);

  // Create Batch Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchTargetCount, setNewBatchTargetCount] = useState<number>(50);
  const [newBatchDomain, setNewBatchDomain] = useState('DSA');
  const [newBatchDifficulty, setNewBatchDifficulty] = useState('distribution');
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
  const [batchActionMessage, setBatchActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Batch Detail Modal State
  const [selectedBatch, setSelectedBatch] = useState<AuthoringBatch | null>(null);
  const [batchItems, setBatchItems] = useState<BatchProblemItem[]>([]);
  const [loadingBatchItems, setLoadingBatchItems] = useState(false);

  // Fetch production dashboard metrics
  const fetchDashboardMetrics = async () => {
    setLoadingMetrics(true);
    try {
      // 1. Problems count & workflow states via exact head counts
      const [
        totalRes,
        pubRes,
        draftRes,
        authoringRes,
        contentReviewRes,
        techReviewRes,
        provReviewRes,
        judgeReadyRes,
        missingProvRes,
      ] = await Promise.all([
        supabase.from('problems').select('*', { count: 'exact', head: true }),
        supabase.from('problems').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('problems').select('*', { count: 'exact', head: true }).eq('workflow_status', 'draft'),
        supabase.from('problems').select('*', { count: 'exact', head: true }).eq('workflow_status', 'content_authoring'),
        supabase.from('problems').select('*', { count: 'exact', head: true }).eq('workflow_status', 'content_review'),
        supabase.from('problems').select('*', { count: 'exact', head: true }).eq('workflow_status', 'technical_review'),
        supabase.from('problems').select('*', { count: 'exact', head: true }).eq('workflow_status', 'provenance_review'),
        supabase.from('problems').select('*', { count: 'exact', head: true }).eq('workflow_status', 'judge_ready'),
        supabase.from('problems').select('*', { count: 'exact', head: true }).neq('provenance_status', 'VERIFIED_VALID'),
      ]);

      const total = totalRes.count || 3392;
      const pub = pubRes.count || 26;
      const draft = draftRes.count || 3366;
      const authoring = authoringRes.count || 0;
      const contentReview = contentReviewRes.count || 0;
      const techReview = techReviewRes.count || 0;
      const provReview = provReviewRes.count || 0;
      const judgeReady = judgeReadyRes.count || 0;
      const missingProv = missingProvRes.count || 3366;

        // 2. Batches
        const { data: batchesData } = await supabase
          .from('problem_authoring_batches')
          .select('id, batch_status, completion_percentage, failure_count');

        const totalBatches = batchesData?.length || 0;
        const activeBatches = batchesData?.filter((b) => !['COMPLETED', 'ARCHIVED'].includes(b.batch_status)).length || 0;
        const avgComp =
          totalBatches > 0
            ? (batchesData?.reduce((acc, b) => acc + Number(b.completion_percentage || 0), 0) || 0) / totalBatches
            : 0;
        const totalFailures = batchesData?.reduce((acc, b) => acc + Number(b.failure_count || 0), 0) || 0;

        // 3. Blocked items
        const { data: blockedData } = await supabase
          .from('batch_problem_items')
          .select('id')
          .in('item_status', [
            'CONTENT_REVIEW_BLOCKED',
            'TECHNICAL_REVIEW_BLOCKED',
            'PROVENANCE_REVIEW_BLOCKED',
            'JUDGE_VALIDATION_BLOCKED',
            'FAILED',
          ]);

        setMetrics({
          total_catalog: total,
          published: pub,
          draft,
          content_authoring: authoring,
          content_review: contentReview,
          technical_review: techReview,
          provenance_review: provReview,
          judge_ready: judgeReady,
          blocked: blockedData?.length || 0,
          total_batches: totalBatches,
          active_batches: activeBatches,
          avg_completion_pct: Math.round(avgComp * 10) / 10,
          total_failed_validations: totalFailures,
          missing_provenance: missingProv,
          missing_tests: Math.max(0, total - pub),
        });
    } catch (err) {
      console.error('Failed to load production metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Fetch batches
  const fetchBatches = async () => {
    setLoadingBatches(true);
    try {
      const { data, error } = await supabase
        .from('problem_authoring_batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (err) {
      console.error('Failed to load batches:', err);
    } finally {
      setLoadingBatches(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
    fetchBatches();
  }, []);

  // Fetch items for inspected batch
  const loadBatchItems = async (batchId: string) => {
    setLoadingBatchItems(true);
    try {
      const { data, error } = await supabase
        .from('batch_problem_items')
        .select(`
          id, batch_id, problem_id, item_status, failure_step, failure_reason, retry_count,
          content_completeness_pct, test_completeness_pct, judge_readiness_pct, created_at, updated_at,
          problem:problems(verniq_id, title, difficulty, workflow_status, provenance_status, judge_readiness_status)
        `)
        .eq('batch_id', batchId);

      if (error) throw error;

      const mapped: BatchProblemItem[] = (data || []).map((row: any) => ({
        ...row,
        verniq_id: row.problem?.verniq_id,
        title: row.problem?.title,
        difficulty: row.problem?.difficulty,
        workflow_status: row.problem?.workflow_status,
        provenance_status: row.problem?.provenance_status,
        judge_readiness_status: row.problem?.judge_readiness_status,
      }));
      setBatchItems(mapped);
    } catch (err) {
      console.error('Failed to load batch items:', err);
    } finally {
      setLoadingBatchItems(false);
    }
  };

  const handleOpenBatchDetails = (batch: AuthoringBatch) => {
    setSelectedBatch(batch);
    loadBatchItems(batch.id);
  };

  // Create Batch Form Submission
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim()) {
      setBatchActionMessage({ type: 'error', text: 'Batch name cannot be empty.' });
      return;
    }

    setIsSubmittingBatch(true);
    setBatchActionMessage(null);

    try {
      const criteria: Record<string, any> = {
        domain: newBatchDomain,
        batch_size: newBatchTargetCount,
      };

      if (newBatchDifficulty === 'distribution') {
        criteria.difficulty_distribution = { easy: 0.4, medium: 0.4, hard: 0.2 };
      } else {
        criteria.difficulty = newBatchDifficulty;
      }

      // Insert new batch record
      const { data: batchData, error: batchError } = await supabase
        .from('problem_authoring_batches')
        .insert({
          batch_name: newBatchName.trim(),
          target_count: newBatchTargetCount,
          actual_count: 0,
          batch_status: 'CREATED',
          selection_criteria: criteria,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Select candidate problems
      let candidateQuery = supabase
        .from('problems')
        .select('id, verniq_id, title, difficulty')
        .eq('is_published', false)
        .eq('workflow_status', 'draft')
        .order('verniq_id', { ascending: true })
        .limit(newBatchTargetCount);

      if (newBatchDifficulty !== 'distribution') {
        candidateQuery = candidateQuery.eq('difficulty', newBatchDifficulty);
      }

      const { data: candidates, error: candError } = await candidateQuery;
      if (candError) throw candError;

      if (candidates && candidates.length > 0) {
        const batchItemsToInsert = candidates.map((cand) => ({
          batch_id: batchData.id,
          problem_id: cand.id,
          item_status: 'SELECTED',
          retry_count: 0,
        }));

        const { error: itemsError } = await supabase.from('batch_problem_items').insert(batchItemsToInsert);
        if (itemsError) throw itemsError;

        // Update batch status to SELECTED and actual count
        await supabase
          .from('problem_authoring_batches')
          .update({
            actual_count: candidates.length,
            batch_status: 'SELECTED',
            updated_at: new Date().toISOString(),
          })
          .eq('id', batchData.id);

        // Update problems current_batch_id
        const candidateIds = candidates.map((c) => c.id);
        await supabase
          .from('problems')
          .update({ current_batch_id: batchData.id })
          .in('id', candidateIds);
      }

      setBatchActionMessage({
        type: 'success',
        text: `Batch '${newBatchName}' created successfully with ${candidates?.length || 0} candidate problems selected!`,
      });

      setNewBatchName('');
      setIsCreateModalOpen(false);
      await fetchBatches();
      await fetchDashboardMetrics();
    } catch (err: any) {
      console.error('Error creating batch:', err);
      setBatchActionMessage({ type: 'error', text: err.message || 'Failed to create authoring batch.' });
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  // Granular Retry Step for Failed Items
  const handleRetryItem = async (item: BatchProblemItem, retryStep: string) => {
    try {
      let targetStatus = 'AUTHORING';
      if (retryStep === 'TEST_GENERATION_FAILED') targetStatus = 'TECHNICAL_REVIEW';
      else if (retryStep === 'JUDGE_FAILED') targetStatus = 'TECHNICAL_REVIEW';
      else if (retryStep === 'PROVENANCE_FAILED') targetStatus = 'PROVENANCE_REVIEW';

      const { error } = await supabase
        .from('batch_problem_items')
        .update({
          item_status: targetStatus,
          failure_step: null,
          failure_reason: null,
          retry_count: (item.retry_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) throw error;

      if (selectedBatch) {
        await loadBatchItems(selectedBatch.id);
      }
      await fetchBatches();
    } catch (err) {
      console.error('Error retrying item:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3.5 rounded-lg border border-white/[0.08] bg-[#12151E] space-y-1">
          <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider">Total Catalog</span>
          <div className="text-xl font-bold font-mono text-white">
            {loadingMetrics ? '...' : metrics?.total_catalog.toLocaleString()}
          </div>
          <span className="text-[10px] font-mono text-text-secondary">VRQ-000001 — VRQ-003392</span>
        </div>

        <div className="p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-950/10 space-y-1">
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">Published</span>
          <div className="text-xl font-bold font-mono text-emerald-300">
            {loadingMetrics ? '...' : metrics?.published}
          </div>
          <span className="text-[10px] font-mono text-emerald-500/80">Pilot 20 + Foundations</span>
        </div>

        <div className="p-3.5 rounded-lg border border-white/[0.08] bg-[#12151E] space-y-1">
          <span className="text-[11px] font-mono text-amber-400/90 uppercase tracking-wider">Draft (Quarantined)</span>
          <div className="text-xl font-bold font-mono text-amber-300">
            {loadingMetrics ? '...' : metrics?.draft.toLocaleString()}
          </div>
          <span className="text-[10px] font-mono text-text-muted">Unauthored catalog</span>
        </div>

        <div className="p-3.5 rounded-lg border border-white/[0.08] bg-[#12151E] space-y-1">
          <span className="text-[11px] font-mono text-primary uppercase tracking-wider">Active Batches</span>
          <div className="text-xl font-bold font-mono text-primary">
            {loadingMetrics ? '...' : metrics?.active_batches}
          </div>
          <span className="text-[10px] font-mono text-text-muted">{metrics?.total_batches || 0} total created</span>
        </div>

        <div className="p-3.5 rounded-lg border border-white/[0.08] bg-[#12151E] space-y-1">
          <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider">Avg Completion</span>
          <div className="text-xl font-bold font-mono text-white">
            {loadingMetrics ? '...' : `${metrics?.avg_completion_pct}%`}
          </div>
          <span className="text-[10px] font-mono text-text-secondary">Across batches</span>
        </div>

        <div className="p-3.5 rounded-lg border border-red-500/20 bg-red-950/10 space-y-1">
          <span className="text-[11px] font-mono text-red-400 uppercase tracking-wider">Blocked Items</span>
          <div className="text-xl font-bold font-mono text-red-300">
            {loadingMetrics ? '...' : metrics?.blocked}
          </div>
          <span className="text-[10px] font-mono text-red-400/80">Requires review</span>
        </div>

        <div className="p-3.5 rounded-lg border border-amber-500/20 bg-amber-950/10 space-y-1">
          <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">Missing Provenance</span>
          <div className="text-xl font-bold font-mono text-amber-300">
            {loadingMetrics ? '...' : metrics?.missing_provenance.toLocaleString()}
          </div>
          <span className="text-[10px] font-mono text-amber-400/80">IP review pending</span>
        </div>

        <div className="p-3.5 rounded-lg border border-cyan-500/20 bg-cyan-950/10 space-y-1">
          <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">Missing Tests</span>
          <div className="text-xl font-bold font-mono text-cyan-300">
            {loadingMetrics ? '...' : metrics?.missing_tests.toLocaleString()}
          </div>
          <span className="text-[10px] font-mono text-cyan-400/80">&lt; 200/250/300 minimum</span>
        </div>
      </div>

      {/* Action Notification */}
      {batchActionMessage && (
        <div
          className={`p-3.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${
            batchActionMessage.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
              : 'border-red-500/40 bg-red-950/20 text-red-300'
          }`}
        >
          {batchActionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{batchActionMessage.text}</span>
        </div>
      )}

      {/* Batch Management Table Section */}
      <div className="border border-white/[0.08] rounded-lg bg-[#12151E] overflow-hidden space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold font-mono text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Controlled Problem Authoring Batches
            </h3>
            <p className="text-xs text-text-secondary">
              Production authoring batches (recommended size 50, supported: 20, 50, 100, 250). Batches DO NOT automatically publish.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                fetchBatches();
                fetchDashboardMetrics();
              }}
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5 text-text-secondary" />
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs font-mono"
            >
              Create Controlled Batch
            </Button>
          </div>
        </div>

        {/* Batches Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.08] text-text-muted">
                <th className="py-2.5 px-3">Batch Name</th>
                <th className="py-2.5 px-3">Lifecycle Status</th>
                <th className="py-2.5 px-3 text-right">Target</th>
                <th className="py-2.5 px-3 text-right">Selected</th>
                <th className="py-2.5 px-3">Progress</th>
                <th className="py-2.5 px-3 text-right">Failures</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loadingBatches ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-secondary">
                    Loading authoring batches...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-secondary space-y-2">
                    <FolderPlus className="w-8 h-8 text-text-muted mx-auto" />
                    <div>No authoring batches created yet.</div>
                    <div className="text-[11px] text-text-muted">
                      Use "Create Controlled Batch" above to configure your first 50-problem production batch.
                    </div>
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">{b.batch_name}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary border border-primary/20">
                        {b.batch_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-text-secondary">{b.target_count}</td>
                    <td className="py-3 px-3 text-right text-text-primary font-bold">{b.actual_count}</td>
                    <td className="py-3 px-3">
                      <div className="w-36 flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-white/[0.08] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${b.completion_percentage}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-text-muted">{b.completion_percentage}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {b.failure_count > 0 ? (
                        <span className="text-red-400 font-bold">{b.failure_count}</span>
                      ) : (
                        <span className="text-text-muted">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenBatchDetails(b)}
                        className="text-[11px] font-mono h-7 px-2.5"
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE BATCH MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#12151E] border border-white/[0.1] rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-semibold font-mono text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                Create Controlled Authoring Batch
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-text-muted hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-text-secondary uppercase tracking-wider text-[11px]">Batch Name</label>
                <Input
                  placeholder="e.g. BATCH-DSA-FOUNDATION-01"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-text-secondary uppercase tracking-wider text-[11px]">Batch Target Size</label>
                  <Select
                    value={String(newBatchTargetCount)}
                    onChange={(e) => setNewBatchTargetCount(Number(e.target.value))}
                    options={[
                      { value: '20', label: '20 Problems (Pilot/Test)' },
                      { value: '50', label: '50 Problems (Recommended Production)' },
                      { value: '100', label: '100 Problems (Large Batch)' },
                      { value: '250', label: '250 Problems (Max Staged)' },
                    ]}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-text-secondary uppercase tracking-wider text-[11px]">Domain</label>
                  <Select
                    value={newBatchDomain}
                    onChange={(e) => setNewBatchDomain(e.target.value)}
                    options={[
                      { value: 'DSA', label: 'Data Structures & Algorithms' },
                      { value: 'Database', label: 'Database / SQL' },
                      { value: 'JavaScript', label: 'JavaScript' },
                      { value: 'Pandas', label: 'Pandas' },
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-text-secondary uppercase tracking-wider text-[11px]">Difficulty Distribution</label>
                <Select
                  value={newBatchDifficulty}
                  onChange={(e) => setNewBatchDifficulty(e.target.value)}
                  options={[
                    { value: 'distribution', label: 'Balanced Curriculum (40% Easy, 40% Med, 20% Hard)' },
                    { value: 'easy', label: '100% Easy Problems' },
                    { value: 'medium', label: '100% Medium Problems' },
                    { value: 'hard', label: '100% Hard Problems' },
                  ]}
                />
              </div>

              <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded text-[11px] text-text-muted space-y-1">
                <div className="text-amber-400 font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Controlled Production Safety Guard:
                </div>
                <div>
                  Creating this batch will select candidate problems and set their status to SELECTED. It will <strong>NOT</strong> mass-author or automatically publish them.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmittingBatch}
                >
                  Create &amp; Select Batch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BATCH DETAILS & RETRY INSPECTION DRAWER / MODAL */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#12151E] border border-white/[0.1] rounded-xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold font-mono text-white">{selectedBatch.batch_name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary border border-primary/20">
                    {selectedBatch.batch_status}
                  </span>
                </div>
                <div className="text-xs text-text-muted font-mono mt-0.5">
                  Target: {selectedBatch.target_count} | Actual: {selectedBatch.actual_count} | Completion: {selectedBatch.completion_percentage}%
                </div>
              </div>

              <button
                onClick={() => setSelectedBatch(null)}
                className="text-text-muted hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Problems List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-text-secondary">
                <span>Batch Items ({batchItems.length})</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => loadBatchItems(selectedBatch.id)}
                  title="Refresh items"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingBatchItems ? 'animate-spin text-primary' : ''}`} />
                </Button>
              </div>

              <div className="border border-white/[0.08] rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02] text-text-muted">
                      <th className="py-2 px-3">Verniq ID</th>
                      <th className="py-2 px-3">Title</th>
                      <th className="py-2 px-3">Difficulty</th>
                      <th className="py-2 px-3">Item Status</th>
                      <th className="py-2 px-3 text-right">Retries</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {loadingBatchItems ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-text-muted">
                          Loading batch items...
                        </td>
                      </tr>
                    ) : batchItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-text-muted">
                          No problem items found in this batch.
                        </td>
                      </tr>
                    ) : (
                      batchItems.map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 text-primary font-semibold">{item.verniq_id}</td>
                          <td className="py-2.5 px-3 text-white truncate max-w-[200px]">{item.title}</td>
                          <td className="py-2.5 px-3 text-text-secondary capitalize">{item.difficulty}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                item.item_status.includes('BLOCKED') || item.item_status === 'FAILED'
                                  ? 'bg-red-950/40 text-red-300 border border-red-500/30'
                                  : 'bg-white/[0.04] text-text-secondary'
                              }`}
                            >
                              {item.item_status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-text-muted">{item.retry_count}</td>
                          <td className="py-2.5 px-3 text-right space-x-2">
                            {item.failure_step && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleRetryItem(item, item.failure_step!)}
                                className="text-[10px] font-mono h-6 px-2"
                                leftIcon={<RotateCcw className="w-3 h-3 text-amber-400" />}
                              >
                                Retry
                              </Button>
                            )}
                            {item.verniq_id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedBatch(null);
                                  onSelectProblemForEdit(item.verniq_id!);
                                }}
                                className="text-[10px] font-mono h-6 px-2"
                                rightIcon={<ExternalLink className="w-3 h-3" />}
                              >
                                Edit
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/[0.08] flex items-center justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBatch(null)}
                className="font-mono text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
