import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Container } from '@/components/ui/layout/Container';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { DifficultyBadge } from '@/components/learning/DifficultyBadge';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { Button } from '@/components/ui/actions/Button';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import type {
  Problem,
  ProblemWorkflowStatus,
  ProblemContentRevision,
  ProblemProvenanceSource,
  ProblemTechnicalReview,
} from '@/types';
import {
  Search,
  CheckCircle2,
  ShieldCheck,
  History,
  Sparkles,
  ExternalLink,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Save,
  Check,
  XCircle,
  Cpu,
  RefreshCw,
  BarChart3,
  ListFilter,
  Edit3,
} from 'lucide-react';
import { ProductionDashboardTab } from '@/components/authoring/ProductionDashboardTab';
import { AuthoringQueueTab } from '@/components/authoring/AuthoringQueueTab';

const WORKFLOW_STEPS: Array<{ id: ProblemWorkflowStatus; label: string; desc: string }> = [
  { id: 'draft', label: '1. Draft', desc: 'Quarantined catalog index' },
  { id: 'content_authoring', label: '2. Authoring', desc: 'Formulating original statement' },
  { id: 'content_review', label: '3. Content Review', desc: 'Pedagogical & editorial review' },
  { id: 'technical_review', label: '4. Tech Review', desc: '9-point invariant verification' },
  { id: 'provenance_review', label: '5. Provenance', desc: 'IP & license verification' },
  { id: 'judge_ready', label: '6. Judge Ready', desc: 'Sandbox assets verified' },
  { id: 'published', label: '7. Published', desc: 'Active in production catalog' },
];

export const ProblemAuthoringView: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialVrq = searchParams.get('vrq') || '';

  // Top-level Navigation Mode: Dashboard | Queue | Studio
  const [viewMode, setViewMode] = useState<'dashboard' | 'queue' | 'studio'>(
    initialVrq ? 'studio' : 'dashboard'
  );

  // Problem Catalog Selection State
  const [searchQuery, setSearchQuery] = useState(initialVrq);
  const [selectedWorkflowFilter, setSelectedWorkflowFilter] = useState<string>('all');
  const [problemList, setProblemList] = useState<Problem[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
  const [loadingProblem, setLoadingProblem] = useState<boolean>(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'content' | 'provenance' | 'technical' | 'revisions'>('content');

  // Related Entities State
  const [revisions, setRevisions] = useState<ProblemContentRevision[]>([]);
  const [provenanceSources, setProvenanceSources] = useState<ProblemProvenanceSource[]>([]);
  const [technicalReviews, setTechnicalReviews] = useState<ProblemTechnicalReview[]>([]);

  // Draft Editing State
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [draftConstraints, setDraftConstraints] = useState('');
  const [draftInputFormat, setDraftInputFormat] = useState('');
  const [draftOutputFormat, setDraftOutputFormat] = useState('');
  const [draftTimeLimit, setDraftTimeLimit] = useState(2000);
  const [draftMemoryLimit, setDraftMemoryLimit] = useState(256);
  const [draftAuthorType, setDraftAuthorType] = useState<'human' | 'ai_assisted' | 'community'>('human');
  const [draftAiGenerated, setDraftAiGenerated] = useState(false);
  const [draftHumanReviewed, setDraftHumanReviewed] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');
  const [isSavingRevision, setIsSavingRevision] = useState(false);

  // Technical Review Checklist State
  const [checklist, setChecklist] = useState({
    statement_consistent: false,
    examples_correct: false,
    constraints_consistent: false,
    edge_cases_covered: false,
    solution_logic_valid: false,
    starter_templates_compile: false,
    canonical_tests_valid: false,
    expected_outputs_correct: false,
    languages_compatible: false,
  });
  const [techReviewNotes, setTechReviewNotes] = useState('');
  const [isSubmittingTechReview, setIsSubmittingTechReview] = useState(false);

  // Provenance Form State
  const [provSourceType, setProvSourceType] = useState('verniq_original');
  const [provSourceName, setProvSourceName] = useState('Verniq Original Content Team');
  const [provSourceUrl, setProvSourceUrl] = useState('');
  const [provLicense, setProvLicense] = useState('Proprietary / Verniq Original');
  const [provCommercialAllowed, setProvCommercialAllowed] = useState(true);
  const [provDerivativeAllowed, setProvDerivativeAllowed] = useState(true);
  const [provStatus, setProvStatus] = useState<'pending_review' | 'verified_valid' | 'rejected'>('pending_review');
  const [provNotes, setProvNotes] = useState('');
  const [isSavingProvenance, setIsSavingProvenance] = useState(false);

  // Action / Transition Message
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch catalog problems for sidebar selector
  const fetchProblems = useCallback(async () => {
    setLoadingList(true);
    try {
      let query = supabase
        .from('problems')
        .select('id, verniq_id, title, slug, difficulty, workflow_status, provenance_status, judge_readiness_status, is_published, domain:domains(name)')
        .order('verniq_id', { ascending: true })
        .limit(100);

      if (selectedWorkflowFilter !== 'all') {
        query = query.eq('workflow_status', selectedWorkflowFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        const mapped = data.map((row: any) => ({
          ...row,
          domain: row.domain?.name || 'DSA',
        }));
        setProblemList(mapped);

        // If no active problem, pick first
        if (!activeProblem && mapped.length > 0) {
          loadProblemDetails(mapped[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load problem list:', err);
    } finally {
      setLoadingList(false);
    }
  }, [selectedWorkflowFilter]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  // Load complete problem details by ID or Verniq ID
  const loadProblemDetails = async (identifier: string) => {
    setLoadingProblem(true);
    setStatusMessage(null);
    try {
      const isUuid = identifier.includes('-');
      let query = supabase
        .from('problems')
        .select(`
          id, verniq_id, title, slug, difficulty, acceptance_rate,
          description_markdown, constraints_markdown, starter_templates,
          input_format, output_format, edge_cases, hints, time_limit_ms,
          memory_limit_mb, supported_languages, author_type, generated_with_ai,
          human_reviewed, provenance_status, judge_readiness_status,
          workflow_status, is_published, metadata,
          domain:domains(name)
        `);

      if (isUuid && identifier.length === 36) {
        query = query.eq('id', identifier);
      } else {
        query = query.or(`verniq_id.eq.${identifier},slug.eq.${identifier}`);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;

      if (data) {
        const prob: Problem = {
          ...data,
          is_premium: false,
          domain: (data as any).domain?.name || 'DSA',
        };
        setActiveProblem(prob);
        setDraftTitle(prob.title || '');
        setDraftDesc(prob.description_markdown || '');
        setDraftConstraints(prob.constraints_markdown || '');
        setDraftInputFormat(prob.input_format || '');
        setDraftOutputFormat(prob.output_format || '');
        setDraftTimeLimit(prob.time_limit_ms || 2000);
        setDraftMemoryLimit(prob.memory_limit_mb || 256);
        setDraftAuthorType((prob.author_type as any) || 'human');
        setDraftAiGenerated(Boolean(prob.generated_with_ai));
        setDraftHumanReviewed(Boolean(prob.human_reviewed));

        // Update URL param
        if (prob.verniq_id) {
          setSearchParams({ vrq: prob.verniq_id });
        }

        // Fetch Revisions, Provenance, Technical Reviews
        await Promise.all([
          fetchRevisions(prob.id),
          fetchProvenance(prob.id),
          fetchTechnicalReviews(prob.id),
        ]);
      }
    } catch (err: any) {
      console.error('Failed to load problem details:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Error loading problem.' });
    } finally {
      setLoadingProblem(false);
    }
  };

  const fetchRevisions = async (probId: string) => {
    const { data } = await supabase
      .from('problem_content_revisions')
      .select('*')
      .eq('problem_id', probId)
      .order('revision_number', { ascending: false });
    setRevisions((data as ProblemContentRevision[]) || []);
  };

  const fetchProvenance = async (probId: string) => {
    const { data } = await supabase
      .from('problem_sources')
      .select('*')
      .eq('problem_id', probId)
      .order('created_at', { ascending: false });
    setProvenanceSources((data as ProblemProvenanceSource[]) || []);
  };

  const fetchTechnicalReviews = async (probId: string) => {
    const { data } = await supabase
      .from('problem_technical_reviews')
      .select('*')
      .eq('problem_id', probId)
      .order('created_at', { ascending: false });
    const reviews = (data as ProblemTechnicalReview[]) || [];
    setTechnicalReviews(reviews);
    if (reviews.length > 0 && reviews[0].checklist) {
      setChecklist(reviews[0].checklist);
    }
  };

  // Filtered problem list
  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return problemList;
    return problemList.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.verniq_id && p.verniq_id.toLowerCase().includes(q)) ||
        p.slug.toLowerCase().includes(q)
    );
  }, [problemList, searchQuery]);

  // Save new Revision Handler
  const handleSaveRevision = async () => {
    if (!activeProblem) return;
    setIsSavingRevision(true);
    setStatusMessage(null);

    try {
      const nextRev = revisions.length > 0 ? Math.max(...revisions.map((r) => r.revision_number)) + 1 : 1;
      const snapshot = {
        title: draftTitle,
        description_markdown: draftDesc,
        constraints_markdown: draftConstraints,
        input_format: draftInputFormat,
        output_format: draftOutputFormat,
        time_limit_ms: draftTimeLimit,
        memory_limit_mb: draftMemoryLimit,
        starter_templates: activeProblem.starter_templates || {},
      };

      // 1. Insert revision
      const { error: revErr } = await supabase.from('problem_content_revisions').insert({
        problem_id: activeProblem.id,
        revision_number: nextRev,
        author_id: user?.id || null,
        author_type: draftAuthorType,
        generated_with_ai: draftAiGenerated,
        human_reviewed: draftHumanReviewed,
        change_summary: changeSummary || `Revision #${nextRev} saved via Authoring Studio`,
        content_snapshot: snapshot,
        review_status: 'draft',
      });

      if (revErr) throw revErr;

      // 2. Update problem working fields
      const { error: probErr } = await supabase
        .from('problems')
        .update({
          title: draftTitle,
          description_markdown: draftDesc,
          constraints_markdown: draftConstraints,
          input_format: draftInputFormat,
          output_format: draftOutputFormat,
          time_limit_ms: draftTimeLimit,
          memory_limit_mb: draftMemoryLimit,
          author_type: draftAuthorType,
          generated_with_ai: draftAiGenerated,
          human_reviewed: draftHumanReviewed,
          workflow_status:
            activeProblem.workflow_status === 'draft' ? 'content_authoring' : activeProblem.workflow_status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeProblem.id);

      if (probErr) throw probErr;

      setStatusMessage({ type: 'success', text: `Revision #${nextRev} successfully created and applied!` });
      setChangeSummary('');
      await loadProblemDetails(activeProblem.id);
    } catch (err: any) {
      console.error('Failed to save revision:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Error saving revision.' });
    } finally {
      setIsSavingRevision(false);
    }
  };

  // Record Provenance Source Handler
  const handleSaveProvenance = async () => {
    if (!activeProblem) return;
    setIsSavingProvenance(true);
    setStatusMessage(null);

    try {
      const { error } = await supabase.from('problem_sources').insert({
        problem_id: activeProblem.id,
        source_type: provSourceType,
        source_name: provSourceName,
        source_url: provSourceUrl || null,
        license: provLicense || null,
        commercial_use_allowed: provCommercialAllowed,
        derivative_work_allowed: provDerivativeAllowed,
        provenance_status: provStatus === 'verified_valid' ? 'VERIFIED_VALID' : 'PROVENANCE_REVIEW_REQUIRED',
        verification_status: provStatus,
        verified_at: provStatus === 'verified_valid' ? new Date().toISOString() : null,
        verified_by: user?.id || null,
        notes: provNotes || null,
      });

      if (error) throw error;

      // Update problem level provenance status
      const probStatusVal = provStatus === 'verified_valid' ? 'VERIFIED_VALID' : 'PROVENANCE_REVIEW_REQUIRED';
      await supabase.from('problems').update({ provenance_status: probStatusVal }).eq('id', activeProblem.id);

      setStatusMessage({ type: 'success', text: 'Provenance source record logged successfully!' });
      setProvNotes('');
      await loadProblemDetails(activeProblem.id);
    } catch (err: any) {
      console.error('Failed to log provenance:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Error saving provenance.' });
    } finally {
      setIsSavingProvenance(false);
    }
  };

  // Submit Technical Review Handler
  const handleSubmitTechnicalReview = async (decision: 'passed' | 'failed') => {
    if (!activeProblem) return;
    setIsSubmittingTechReview(true);
    setStatusMessage(null);

    try {
      const isComplete = Object.values(checklist).every(Boolean);
      if (decision === 'passed' && !isComplete) {
        throw new Error('All 9 technical checkpoints must be verified before passing technical review.');
      }

      const { error } = await supabase.from('problem_technical_reviews').insert({
        problem_id: activeProblem.id,
        status: decision,
        reviewer_id: user?.id || null,
        reviewed_at: new Date().toISOString(),
        checklist,
        review_notes: techReviewNotes || `Technical review evaluated as ${decision}.`,
      });

      if (error) throw error;

      setStatusMessage({
        type: 'success',
        text: `Technical review decision recorded: ${decision.toUpperCase()}.`,
      });
      await loadProblemDetails(activeProblem.id);
    } catch (err: any) {
      console.error('Failed to submit technical review:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Error recording technical review.' });
    } finally {
      setIsSubmittingTechReview(false);
    }
  };

  // Workflow Transition Gate Execution
  const handleTransitionWorkflow = async (target: ProblemWorkflowStatus) => {
    if (!activeProblem) return;
    setStatusMessage(null);

    try {
      // Client-side Gate Enforcement
      if (target === 'judge_ready') {
        const passedTech = technicalReviews.some((r) => r.status === 'passed');
        if (!passedTech) {
          throw new Error('Gate Blocked: Cannot promote to JUDGE_READY without a PASSED technical review.');
        }
      }

      if (target === 'published') {
        if (activeProblem.workflow_status !== 'judge_ready') {
          throw new Error('Gate Blocked: Problem must be JUDGE_READY before publishing.');
        }
        if (activeProblem.provenance_status !== 'VERIFIED_VALID') {
          throw new Error('Gate Blocked: Provenance must be VERIFIED_VALID before publishing.');
        }
        if (!activeProblem.human_reviewed) {
          throw new Error('Gate Blocked: Human review must be explicitly confirmed before publishing.');
        }
      }

      const isPub = target === 'published';
      const judgeStatus = target === 'judge_ready' || target === 'published' ? 'JUDGE_READY' : activeProblem.judge_readiness_status;

      const { error } = await supabase
        .from('problems')
        .update({
          workflow_status: target,
          is_published: isPub,
          judge_readiness_status: judgeStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeProblem.id);

      if (error) throw error;

      setStatusMessage({
        type: 'success',
        text: `Workflow transitioned successfully to ${target.toUpperCase()}!`,
      });
      await loadProblemDetails(activeProblem.id);
    } catch (err: any) {
      console.error('Workflow transition error:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to transition workflow state.' });
    }
  };

  return (
    <div className="py-6 space-y-6 text-left bg-background min-h-screen text-text-primary">
      <Container size="xl">
        <PageHeader
          badge="Content Pipeline"
          title="Problem Content Authoring & Provenance Studio"
          subtitle="Phase 4 controlled content lifecycle: authoring, immutable revisions, 9-point technical quality verification, and intellectual property provenance gating."
          actions={
            <div className="flex items-center gap-3">
              <Link to="/problems">
                <Button size="sm" variant="ghost" className="text-xs font-mono">
                  Catalog View
                </Button>
              </Link>
              {activeProblem && (
                <Link to={`/problems/${activeProblem.slug}`} target="_blank">
                  <Button size="sm" variant="secondary" className="text-xs font-mono" leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                    Open Live Problem
                  </Button>
                </Link>
              )}
            </div>
          }
        />

        {/* Status Alerts */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                : 'border-red-500/40 bg-red-950/20 text-red-300'
            }`}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Phase 4.2 Production Pipeline Navigation */}
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'dashboard'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            1. Production Dashboard
          </button>
          <button
            onClick={() => setViewMode('queue')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'queue'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            2. Authoring Queue
          </button>
          <button
            onClick={() => setViewMode('studio')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'studio'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            3. Problem Studio &amp; Review
          </button>
        </div>

        {/* View Mode Switching */}
        {viewMode === 'dashboard' && (
          <ProductionDashboardTab
            onSelectProblemForEdit={(vrqId) => {
              loadProblemDetails(vrqId);
              setViewMode('studio');
            }}
          />
        )}

        {viewMode === 'queue' && (
          <AuthoringQueueTab
            onSelectProblemForEdit={(vrqId) => {
              loadProblemDetails(vrqId);
              setViewMode('studio');
            }}
          />
        )}

        {viewMode === 'studio' && (
          /* Master Authoring Layout: Left Problem Selector + Right Editor/Review Studio */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Problem Index & Verniq ID Finder (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-lg border border-white/[0.08] bg-[#12151E] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-text-secondary uppercase tracking-wider">
                  Catalog Index Navigator
                </span>
                <span className="text-[11px] font-mono text-text-muted">
                  {filteredList.length} matching
                </span>
              </div>

              {/* Verniq ID Search */}
              <Input
                placeholder="Search Verniq ID (e.g. VRQ-000001)..."
                leftIcon={<Search className="w-3.5 h-3.5 text-text-secondary" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {/* Workflow Status Filter */}
              <div className="flex items-center gap-2">
                <Select
                  value={selectedWorkflowFilter}
                  onChange={(e) => setSelectedWorkflowFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Lifecycle States' },
                    { value: 'draft', label: '1. Draft (Quarantined)' },
                    { value: 'content_authoring', label: '2. Content Authoring' },
                    { value: 'content_review', label: '3. Content Review' },
                    { value: 'technical_review', label: '4. Technical Review' },
                    { value: 'provenance_review', label: '5. Provenance Review' },
                    { value: 'judge_ready', label: '6. Judge Ready' },
                    { value: 'published', label: '7. Published' },
                  ]}
                />
                <Button size="sm" variant="ghost" onClick={fetchProblems} title="Refresh list" className="h-9 px-2">
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin text-primary' : 'text-text-secondary'}`} />
                </Button>
              </div>
            </div>

            {/* Problem List Items */}
            <div className="border border-white/[0.08] rounded-lg bg-[#12151E] max-h-[640px] overflow-y-auto divide-y divide-white/[0.04]">
              {loadingList ? (
                <div className="p-6 text-center text-xs font-mono text-text-secondary">Loading catalog index...</div>
              ) : filteredList.length > 0 ? (
                filteredList.map((prob) => {
                  const isSelected = activeProblem?.id === prob.id;
                  return (
                    <button
                      key={prob.id}
                      onClick={() => loadProblemDetails(prob.id)}
                      className={`w-full text-left p-3 transition-colors flex items-start justify-between gap-2 ${
                        isSelected ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[11px] text-text-secondary bg-white/[0.04] px-1 rounded">
                            {prob.verniq_id}
                          </span>
                          <span className={`text-[10px] font-mono px-1 rounded ${
                            prob.workflow_status === 'published'
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                              : 'bg-amber-950/40 text-amber-400 border border-amber-800/40'
                          }`}>
                            {prob.workflow_status?.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs font-sans font-medium text-white truncate max-w-[200px]">
                          {prob.title}
                        </div>
                      </div>
                      <DifficultyBadge difficulty={prob.difficulty} />
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs font-mono text-text-secondary">No problems matched query.</div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Authoring & Review Studio Workspace (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {loadingProblem ? (
              <div className="p-12 text-center border border-white/[0.08] rounded-lg bg-[#12151E] flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                <span className="text-xs font-mono text-neutral-400">Loading problem specification...</span>
              </div>
            ) : activeProblem ? (
              <>
                {/* Active Problem Overview Card */}
                <div className="p-5 rounded-lg border border-white/[0.08] bg-[#12151E] space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-white/[0.06] text-blue-400 font-mono text-xs px-2 py-0.5 rounded border border-blue-500/20 font-bold">
                          {activeProblem.verniq_id}
                        </span>
                        <DifficultyBadge difficulty={activeProblem.difficulty} />
                        <span className="text-xs font-mono text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
                          {activeProblem.domain}
                        </span>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                          activeProblem.provenance_status === 'VERIFIED_VALID'
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                            : 'bg-amber-950/40 text-amber-400 border border-amber-800/40'
                        }`}>
                          {activeProblem.provenance_status}
                        </span>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                          activeProblem.judge_readiness_status === 'JUDGE_READY'
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {activeProblem.judge_readiness_status}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold font-sans text-white tracking-[-0.02em]">
                        {activeProblem.title}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-text-secondary">
                        Slug: <code className="text-white">/problems/{activeProblem.slug}</code>
                      </span>
                    </div>
                  </div>

                  {/* Visual Pipeline Stepper */}
                  <div className="pt-2 border-t border-white/[0.06] overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-1 min-w-[680px]">
                      {WORKFLOW_STEPS.map((step, idx) => {
                        const isCurrent = activeProblem.workflow_status === step.id;
                        const isPast =
                          WORKFLOW_STEPS.findIndex((s) => s.id === activeProblem.workflow_status) > idx;

                        return (
                          <div key={step.id} className="flex items-center gap-1 flex-1">
                            <div
                              className={`p-2 rounded border text-left flex-1 transition-colors ${
                                isCurrent
                                  ? 'border-primary bg-primary/10 text-white'
                                  : isPast
                                  ? 'border-emerald-500/30 bg-emerald-950/10 text-emerald-400'
                                  : 'border-white/[0.04] bg-white/[0.01] text-text-muted'
                              }`}
                            >
                              <div className="font-mono text-[10px] font-bold flex items-center gap-1">
                                {isPast && <Check className="w-3 h-3 text-emerald-400" />}
                                <span>{step.label}</span>
                              </div>
                              <div className="text-[9px] text-text-secondary truncate">{step.desc}</div>
                            </div>
                            {idx < WORKFLOW_STEPS.length - 1 && (
                              <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stage Transition Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.04]">
                    <span className="text-xs font-mono text-text-secondary mr-2">Transition State:</span>
                    {activeProblem.workflow_status === 'draft' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleTransitionWorkflow('content_authoring')}
                        className="text-xs font-mono"
                        leftIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        Start Content Authoring
                      </Button>
                    )}
                    {activeProblem.workflow_status === 'content_authoring' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleTransitionWorkflow('content_review')}
                        className="text-xs font-mono"
                        leftIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        Submit for Content Review
                      </Button>
                    )}
                    {activeProblem.workflow_status === 'content_review' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleTransitionWorkflow('technical_review')}
                        className="text-xs font-mono"
                        leftIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        Submit for Technical Review
                      </Button>
                    )}
                    {activeProblem.workflow_status === 'technical_review' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleTransitionWorkflow('provenance_review')}
                        className="text-xs font-mono"
                        leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                      >
                        Submit for Provenance Audit
                      </Button>
                    )}
                    {activeProblem.workflow_status === 'provenance_review' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleTransitionWorkflow('judge_ready')}
                        className="text-xs font-mono"
                        leftIcon={<Cpu className="w-3.5 h-3.5" />}
                      >
                        Promote to Judge Ready
                      </Button>
                    )}
                    {activeProblem.workflow_status === 'judge_ready' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleTransitionWorkflow('published')}
                        className="text-xs font-mono bg-emerald-600 hover:bg-emerald-500 text-white"
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Publish Problem Catalog Item
                      </Button>
                    )}
                    {activeProblem.workflow_status !== 'archived' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleTransitionWorkflow('archived')}
                        className="text-xs font-mono text-red-400 hover:text-red-300 ml-auto"
                      >
                        Archive
                      </Button>
                    )}
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-1 border-b border-white/[0.08] px-1">
                  <button
                    onClick={() => setActiveTab('content')}
                    className={`px-4 py-2 text-xs font-mono font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                      activeTab === 'content'
                        ? 'border-primary text-white'
                        : 'border-transparent text-text-secondary hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Content Draft & Specs</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('provenance')}
                    className={`px-4 py-2 text-xs font-mono font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                      activeTab === 'provenance'
                        ? 'border-primary text-white'
                        : 'border-transparent text-text-secondary hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Provenance & IP Rights ({provenanceSources.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('technical')}
                    className={`px-4 py-2 text-xs font-mono font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                      activeTab === 'technical'
                        ? 'border-primary text-white'
                        : 'border-transparent text-text-secondary hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Technical Review Gate ({technicalReviews.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('revisions')}
                    className={`px-4 py-2 text-xs font-mono font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                      activeTab === 'revisions'
                        ? 'border-primary text-white'
                        : 'border-transparent text-text-secondary hover:text-white'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Audit Revisions ({revisions.length})</span>
                  </button>
                </div>

                {/* TAB 1: CONTENT DRAFT & EDITOR */}
                {activeTab === 'content' && (
                  <div className="p-5 rounded-lg border border-white/[0.08] bg-[#12151E] space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-sans font-semibold text-white">Author Problem Specification</h3>
                      <span className="text-xs font-mono text-text-secondary">
                        Permanent ID: <strong className="text-blue-400">{activeProblem.verniq_id}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono text-text-secondary block mb-1">Title</label>
                        <Input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-mono text-text-secondary block mb-1">Time Limit (ms)</label>
                          <Input
                            type="number"
                            value={draftTimeLimit}
                            onChange={(e) => setDraftTimeLimit(Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-mono text-text-secondary block mb-1">Memory Limit (MB)</label>
                          <Input
                            type="number"
                            value={draftMemoryLimit}
                            onChange={(e) => setDraftMemoryLimit(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-mono text-text-secondary block mb-1">
                        Problem Statement (Markdown)
                      </label>
                      <textarea
                        rows={8}
                        value={draftDesc}
                        onChange={(e) => setDraftDesc(e.target.value)}
                        className="w-full p-3 rounded border border-white/[0.08] bg-[#0E1117] text-text-primary text-xs font-mono focus:outline-none focus:border-primary"
                        placeholder="Draft the complete, original Verniq problem specification..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-mono text-text-secondary block mb-1">
                        Constraints & Mathematical Bounds (Markdown)
                      </label>
                      <textarea
                        rows={4}
                        value={draftConstraints}
                        onChange={(e) => setDraftConstraints(e.target.value)}
                        className="w-full p-3 rounded border border-white/[0.08] bg-[#0E1117] text-text-primary text-xs font-mono focus:outline-none focus:border-primary"
                        placeholder="- 1 <= nums.length <= 10^5\n- Input bounds..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono text-text-secondary block mb-1">Input Format Specification</label>
                        <Input
                          value={draftInputFormat}
                          onChange={(e) => setDraftInputFormat(e.target.value)}
                          placeholder="e.g. nums: List[int], target: int"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-mono text-text-secondary block mb-1">Output Format Specification</label>
                        <Input
                          value={draftOutputFormat}
                          onChange={(e) => setDraftOutputFormat(e.target.value)}
                          placeholder="e.g. List[int] containing two 0-indexed indices"
                        />
                      </div>
                    </div>

                    {/* Authorship Attribution & Audit Metadata */}
                    <div className="p-3.5 rounded border border-white/[0.04] bg-white/[0.01] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                      <div>
                        <label className="text-text-secondary block mb-1">Author Type</label>
                        <Select
                          value={draftAuthorType}
                          onChange={(e) => setDraftAuthorType(e.target.value as any)}
                          options={[
                            { value: 'human', label: 'Human Author' },
                            { value: 'ai_assisted', label: 'AI Assisted' },
                            { value: 'community', label: 'Community Contribution' },
                          ]}
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id="ai_gen"
                          checked={draftAiGenerated}
                          onChange={(e) => setDraftAiGenerated(e.target.checked)}
                          className="rounded border-white/[0.2] bg-surface"
                        />
                        <label htmlFor="ai_gen" className="text-text-secondary cursor-pointer">
                          Generated with AI Assistance
                        </label>
                      </div>

                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id="human_rev"
                          checked={draftHumanReviewed}
                          onChange={(e) => setDraftHumanReviewed(e.target.checked)}
                          className="rounded border-white/[0.2] bg-surface"
                        />
                        <label htmlFor="human_rev" className="text-text-secondary cursor-pointer">
                          Human Review Completed
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-mono text-text-secondary block mb-1">
                        Revision Change Summary (Audit Trail)
                      </label>
                      <Input
                        value={changeSummary}
                        onChange={(e) => setChangeSummary(e.target.value)}
                        placeholder="e.g. Formulated original statement and tightened time bounds to 2000ms"
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="primary"
                        onClick={handleSaveRevision}
                        disabled={isSavingRevision}
                        leftIcon={<Save className="w-3.5 h-3.5" />}
                        className="text-xs font-mono"
                      >
                        {isSavingRevision ? 'Recording Immutable Revision...' : 'Save Immutable Revision'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* TAB 2: PROVENANCE & IP RIGHTS */}
                {activeTab === 'provenance' && (
                  <div className="p-5 rounded-lg border border-white/[0.08] bg-[#12151E] space-y-5">
                    <div>
                      <h3 className="text-sm font-sans font-semibold text-white mb-1">
                        Intellectual Property & Provenance Records
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Every Verniq problem must have explicit provenance verification. Third-party expressive content is strictly protected; rights must be audited before publication.
                      </p>
                    </div>

                    {/* Recorded Provenance Table */}
                    <div className="border border-white/[0.06] rounded overflow-hidden">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-[#181C26] text-text-secondary border-b border-white/[0.06]">
                          <tr>
                            <th className="p-2.5">Source Type</th>
                            <th className="p-2.5">Name</th>
                            <th className="p-2.5">License</th>
                            <th className="p-2.5">Commercial Use</th>
                            <th className="p-2.5">Verification</th>
                            <th className="p-2.5">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {provenanceSources.length > 0 ? (
                            provenanceSources.map((src) => (
                              <tr key={src.id} className="hover:bg-white/[0.02]">
                                <td className="p-2.5 font-bold text-white">{src.source_type}</td>
                                <td className="p-2.5 text-text-secondary">{src.source_name}</td>
                                <td className="p-2.5 text-text-secondary">{src.license || 'Unspecified'}</td>
                                <td className="p-2.5">
                                  {src.commercial_use_allowed ? (
                                    <span className="text-emerald-400">Yes</span>
                                  ) : (
                                    <span className="text-amber-400">No / Pending</span>
                                  )}
                                </td>
                                <td className="p-2.5">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                                      src.verification_status === 'verified_valid'
                                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                                        : 'bg-amber-950/40 text-amber-400 border border-amber-800/40'
                                    }`}
                                  >
                                    {src.verification_status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="p-2.5 text-text-muted">
                                  {new Date(src.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-text-muted">
                                No provenance sources logged yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Record New Provenance Audit Form */}
                    <div className="p-4 rounded border border-white/[0.04] bg-white/[0.01] space-y-3">
                      <h4 className="text-xs font-mono font-semibold uppercase text-text-secondary">
                        Audit & Record New Provenance Source
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                        <div>
                          <label className="text-text-secondary block mb-1">Source Type</label>
                          <Select
                            value={provSourceType}
                            onChange={(e) => setProvSourceType(e.target.value)}
                            options={[
                              { value: 'verniq_original', label: 'Verniq Original (Self-Authored)' },
                              { value: 'licensed', label: 'Licensed Third-Party' },
                              { value: 'open_license', label: 'Open License (MIT / CC-BY / BSD)' },
                              { value: 'community_contributed', label: 'Community Contributed' },
                              { value: 'external_reference', label: 'External Algorithm Reference Only' },
                            ]}
                          />
                        </div>

                        <div>
                          <label className="text-text-secondary block mb-1">Source Name / Author</label>
                          <Input value={provSourceName} onChange={(e) => setProvSourceName(e.target.value)} />
                        </div>

                        <div>
                          <label className="text-text-secondary block mb-1">Source URL (optional)</label>
                          <Input value={provSourceUrl} onChange={(e) => setProvSourceUrl(e.target.value)} />
                        </div>

                        <div>
                          <label className="text-text-secondary block mb-1">License & Terms</label>
                          <Input value={provLicense} onChange={(e) => setProvLicense(e.target.value)} />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-5 text-xs font-mono pt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-text-secondary">
                          <input
                            type="checkbox"
                            checked={provCommercialAllowed}
                            onChange={(e) => setProvCommercialAllowed(e.target.checked)}
                          />
                          Commercial Use Confirmed
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-text-secondary">
                          <input
                            type="checkbox"
                            checked={provDerivativeAllowed}
                            onChange={(e) => setProvDerivativeAllowed(e.target.checked)}
                          />
                          Derivative Works Confirmed
                        </label>

                        <div className="ml-auto flex items-center gap-2">
                          <span className="text-text-secondary">Verification Status:</span>
                          <Select
                            value={provStatus}
                            onChange={(e) => setProvStatus(e.target.value as any)}
                            options={[
                              { value: 'pending_review', label: 'Pending Review' },
                              { value: 'verified_valid', label: 'Verified Valid' },
                              { value: 'rejected', label: 'Rejected' },
                            ]}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-mono text-text-secondary block mb-1">Provenance Audit Notes</label>
                        <Input
                          value={provNotes}
                          onChange={(e) => setProvNotes(e.target.value)}
                          placeholder="Document the legal rationale, licensing verification, or original authorship proof..."
                        />
                      </div>

                      <div className="pt-2 flex justify-end">
                        <Button
                          variant="secondary"
                          onClick={handleSaveProvenance}
                          disabled={isSavingProvenance}
                          className="text-xs font-mono"
                          leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                        >
                          {isSavingProvenance ? 'Logging Provenance...' : 'Log Provenance Audit'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: TECHNICAL REVIEW GATE */}
                {activeTab === 'technical' && (
                  <div className="p-5 rounded-lg border border-white/[0.08] bg-[#12151E] space-y-5">
                    <div>
                      <h3 className="text-sm font-sans font-semibold text-white mb-1">
                        9-Point Technical Quality Gate
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Rigorous technical verification ensuring formal correctness, invariant preservation, and language compatibility before sandbox activation.
                      </p>
                    </div>

                    {/* 9-Point Verification Checklist */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      {[
                        { key: 'statement_consistent', label: '1. Statement is internally consistent' },
                        { key: 'examples_correct', label: '2. Examples & explanations are mathematically correct' },
                        { key: 'constraints_consistent', label: '3. Constraints & bounds are well-defined' },
                        { key: 'edge_cases_covered', label: '4. Critical edge cases are covered' },
                        { key: 'solution_logic_valid', label: '5. Algorithmic solution logic is valid' },
                        { key: 'starter_templates_compile', label: '6. Starter templates compile cleanly' },
                        { key: 'canonical_tests_valid', label: '7. Canonical test vectors are valid' },
                        { key: 'expected_outputs_correct', label: '8. Expected outputs are verified' },
                        { key: 'languages_compatible', label: '9. All supported languages behave consistently' },
                      ].map((item) => {
                        const checked = (checklist as any)[item.key];
                        return (
                          <label
                            key={item.key}
                            className={`p-3 rounded border flex items-center gap-2.5 cursor-pointer transition-colors ${
                              checked
                                ? 'border-emerald-500/40 bg-emerald-950/20 text-white'
                                : 'border-white/[0.06] bg-white/[0.01] text-text-secondary'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }))
                              }
                              className="rounded border-white/[0.2]"
                            />
                            <span>{item.label}</span>
                          </label>
                        );
                      })}
                    </div>

                    <div>
                      <label className="text-xs font-mono text-text-secondary block mb-1">
                        Technical Review Evaluation Notes
                      </label>
                      <textarea
                        rows={3}
                        value={techReviewNotes}
                        onChange={(e) => setTechReviewNotes(e.target.value)}
                        className="w-full p-3 rounded border border-white/[0.08] bg-[#0E1117] text-text-primary text-xs font-mono focus:outline-none focus:border-primary"
                        placeholder="Summarize verification outcome, complexity validation, and runtime bounds..."
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-white/[0.04]">
                      <div className="text-xs font-mono text-text-secondary">
                        Completed:{' '}
                        <strong className="text-white">
                          {Object.values(checklist).filter(Boolean).length}/9
                        </strong>{' '}
                        checkpoints
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => handleSubmitTechnicalReview('failed')}
                          disabled={isSubmittingTechReview}
                          className="text-xs font-mono text-red-400 hover:text-red-300"
                        >
                          Mark Revisions Needed
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => handleSubmitTechnicalReview('passed')}
                          disabled={isSubmittingTechReview || !Object.values(checklist).every(Boolean)}
                          className="text-xs font-mono bg-emerald-600 hover:bg-emerald-500 text-white"
                          leftIcon={<Check className="w-3.5 h-3.5" />}
                        >
                          Pass Technical Review Gate
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: AUDIT REVISIONS */}
                {activeTab === 'revisions' && (
                  <div className="p-5 rounded-lg border border-white/[0.08] bg-[#12151E] space-y-4">
                    <h3 className="text-sm font-sans font-semibold text-white">Immutable Version History</h3>

                    <div className="border border-white/[0.06] rounded overflow-hidden">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-[#181C26] text-text-secondary border-b border-white/[0.06]">
                          <tr>
                            <th className="p-2.5">Rev #</th>
                            <th className="p-2.5">Author</th>
                            <th className="p-2.5">AI Flag</th>
                            <th className="p-2.5">Human Reviewed</th>
                            <th className="p-2.5">Summary</th>
                            <th className="p-2.5">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {revisions.length > 0 ? (
                            revisions.map((rev) => (
                              <tr key={rev.id} className="hover:bg-white/[0.02]">
                                <td className="p-2.5 font-bold text-blue-400">#{rev.revision_number}</td>
                                <td className="p-2.5 text-white">{rev.author_type}</td>
                                <td className="p-2.5">
                                  {rev.generated_with_ai ? (
                                    <span className="text-amber-400 flex items-center gap-1">
                                      <Sparkles className="w-3 h-3" /> Yes
                                    </span>
                                  ) : (
                                    <span className="text-text-muted">No</span>
                                  )}
                                </td>
                                <td className="p-2.5">
                                  {rev.human_reviewed ? (
                                    <span className="text-emerald-400">Yes</span>
                                  ) : (
                                    <span className="text-text-muted">No</span>
                                  )}
                                </td>
                                <td className="p-2.5 text-text-secondary truncate max-w-xs">
                                  {rev.change_summary || 'No summary'}
                                </td>
                                <td className="p-2.5 text-text-muted">
                                  {new Date(rev.created_at).toLocaleString()}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-text-muted">
                                No revisions recorded yet for this problem.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center border border-white/[0.08] rounded-lg bg-[#12151E] text-text-secondary font-mono">
                Select a problem from the catalog index on the left to start authoring or review.
              </div>
            )}
          </div>
        </div>
      )}
      </Container>
    </div>
  );
};
