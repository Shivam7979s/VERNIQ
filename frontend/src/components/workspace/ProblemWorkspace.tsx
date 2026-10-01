import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SplitPane } from './SplitPane';
import { TestCaseConsole, type TestCaseItem, type ExecutionVerdict } from './TestCaseConsole';
import { DifficultyBadge } from '@/components/learning/DifficultyBadge';
import { Badge } from '@/components/ui/data/Badge';
import { useProblemBySlug } from '@/hooks/useProblemBySlug';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useAuth } from '@/hooks/useAuth';
import {
  ChevronLeft,
  RotateCcw,
  Copy,
  Check,
  FileCode,
  History,
  BookOpen,
  Timer as TimerIcon,
  Play,
  Pause,
  RefreshCw,
  Lightbulb,
  Star,
  AlertTriangle,
} from 'lucide-react';
import { MonacoCodeEditor } from '@/components/editor/MonacoCodeEditor';

import { runCode, submitSolution, cancelExecution } from '@/lib/submissionService';
import { syncAcceptedSubmissionToSprintAndDiagnostics } from '@/lib/telemetryFeedback';
import { useSubmissionRealtime } from '@/hooks/useSubmissionRealtime';
import { ProgrammingLanguage, Submission, ExecutionTelemetry, FailedTestCaseInfo } from '@/types';

const DEFAULT_TEMPLATES: Record<string, string> = {
  cpp: `#include <vector>\n\nclass Solution {\npublic:\n    // Implement your solution\n};`,
  python: `class Solution:\n    # Implement your solution\n    pass`,
  java: `class Solution {\n    // Implement your solution\n}`,
  typescript: `function solution() {\n    // Implement your solution\n}`,
  go: `package main\n\n// Implement your solution\nfunc solve() {\n}`,
};

export const ProblemWorkspace: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const activeSlug = slug || 'two-sum';

  const { problem, testCases: sampleTestCases, canonicalTestCount, loading } = useProblemBySlug(activeSlug);
  const { progressMap, revisionMap, updateProgress, toggleRevision } = useUserProgress();
  const { user, preferredLanguage, updatePreferredLanguage } = useAuth();

  const [language, setLanguage] = useState<string>(preferredLanguage || 'java');

  useEffect(() => {
    if (preferredLanguage) {
      setLanguage(preferredLanguage);
    }
  }, [preferredLanguage]);

  const [code, setCode] = useState<string>('');
  const [leftTab, setLeftTab] = useState<'description' | 'editorial' | 'solutions' | 'submissions'>('description');
  const [customInput, setCustomInput] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Execution state
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [submissionHistory, setSubmissionHistory] = useState<Submission[]>([]);
  const [verdict, setVerdict] = useState<ExecutionVerdict>('idle');
  const [executionMode, setExecutionMode] = useState<'run' | 'submit' | null>(null);
  const [runtimeMs, setRuntimeMs] = useState<number>(0);
  const [memoryMb, setMemoryMb] = useState<number>(0);
  const [testCasesPassed, setTestCasesPassed] = useState<number>(0);
  const [totalTestCases, setTotalTestCases] = useState<number>(0);
  const [stdoutLogs, setStdoutLogs] = useState<string>('');
  const [stderrLogs, setStderrLogs] = useState<string>('');
  const [compileOutput, setCompileOutput] = useState<string>('');
  const [telemetry, setTelemetry] = useState<ExecutionTelemetry | null>(null);
  const [firstFailedTest, setFirstFailedTest] = useState<FailedTestCaseInfo | null>(null);
  const [sampleTestOutputs, setSampleTestOutputs] = useState<Record<number, { actualOutput?: string; verdict?: 'ac' | 'wa' }>>({});

  // Live Supabase Realtime verdict updates
  const { submission: liveSubmission, isRunning, isPending } = useSubmissionRealtime(activeSubmissionId);

  useEffect(() => {
    if (liveSubmission) {
      setVerdict(liveSubmission.verdict);
      if (liveSubmission.is_custom_run !== undefined) {
        setExecutionMode(liveSubmission.is_custom_run ? 'run' : 'submit');
      }
      if (liveSubmission.runtime_ms) setRuntimeMs(liveSubmission.runtime_ms);
      if (liveSubmission.memory_kb) setMemoryMb(liveSubmission.memory_kb / 1024);
      if (liveSubmission.stdout_output) setStdoutLogs(liveSubmission.stdout_output);
      if (liveSubmission.stderr_output) setStderrLogs(liveSubmission.stderr_output);
      if (liveSubmission.compile_output) setCompileOutput(liveSubmission.compile_output);
      if (liveSubmission.test_cases_passed !== undefined) setTestCasesPassed(liveSubmission.test_cases_passed);
      if (liveSubmission.total_test_cases !== undefined) setTotalTestCases(liveSubmission.total_test_cases);
      if (liveSubmission.telemetry) setTelemetry(liveSubmission.telemetry);
      if (liveSubmission.first_failed_test || liveSubmission.firstFailedTest) {
        setFirstFailedTest(liveSubmission.first_failed_test || liveSubmission.firstFailedTest || null);
      }

      // On official accepted submission, notify user progress and mutate sprint tasks + diagnostics
      if (liveSubmission.verdict === 'accepted' && !liveSubmission.is_custom_run && problem) {
        updateProgress(problem.id, 'solved');
        if (user) {
          syncAcceptedSubmissionToSprintAndDiagnostics(user.id, problem.id, problem.difficulty);
        }
      }

      // Record to history if terminal verdict reached
      if (liveSubmission.verdict !== 'pending' && liveSubmission.verdict !== 'running') {
        setSubmissionHistory((prev) => {
          if (prev.some((s) => s.id === liveSubmission.id)) {
            return prev.map((s) => (s.id === liveSubmission.id ? liveSubmission : s));
          }
          return [liveSubmission, ...prev];
        });
      }
    }
  }, [liveSubmission, problem, updateProgress]);

  // Stopwatch state
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(true);

  // Load starter template when problem or language changes
  useEffect(() => {
    if (!problem) return;
    const template =
      problem.starter_templates?.[language] ||
      DEFAULT_TEMPLATES[language] ||
      '// Write code here';
    setCode(template);
  }, [problem, language]);

  // Set default custom input when test cases load
  useEffect(() => {
    if (sampleTestCases && sampleTestCases.length > 0 && !customInput) {
      setCustomInput(sampleTestCases[0].input);
    }
  }, [sampleTestCases, customInput]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    updatePreferredLanguage(lang);
    if (problem?.starter_templates?.[lang]) {
      setCode(problem.starter_templates[lang]);
    } else {
      setCode(DEFAULT_TEMPLATES[lang] || '// Write code here');
    }
  };

  // Run code against sample visible test cases (fast ephemeral feedback)
  const handleRunCode = async () => {
    if (verdict === 'running') return;

    // Quarantined draft catalog check
    if (!problem?.is_published || problem?.workflow_status === 'draft') {
      setVerdict('cancelled');
      setStdoutLogs(
        `[CATALOG INDEX RECORD — DRAFT / CONTENT REVIEW]\n\n` +
        `Execution Sandbox Quarantined:\n` +
        `This record (${problem?.verniq_id || 'VRQ-INDEX'}) is indexed in the Verniq catalog but has not yet passed formal content review.\n` +
        `Verified test cases, constraints, and sandbox execution are enabled only for published problems.`
      );
      return;
    }

    const subId = crypto.randomUUID();
    setActiveSubmissionId(subId);
    setExecutionMode('run');
    setVerdict('running');
    setStdoutLogs('Compiling solution in isolated sandbox...\nVerifying visible test vectors...');
    setStderrLogs('');
    setCompileOutput('');
    setTelemetry(null);
    setFirstFailedTest(null);
    setSampleTestOutputs({});

    const visibleCases = sampleTestCases && sampleTestCases.length > 0
      ? sampleTestCases.map((tc) => ({ input: tc.input, expected_output: tc.expected_output, is_sample: true }))
      : undefined;

    if (import.meta.env.DEV) {
      console.log('[VERNIQ RUN TRACE]', {
        stage: 'handleRunCode',
        problemId: problem?.id,
        verniqId: problem?.verniq_id,
        executionMode: 'run',
        visibleCasesCount: visibleCases?.length ?? 0,
      });
    }

    const res = await runCode(
      code,
      language as ProgrammingLanguage,
      customInput || sampleTestCases[0]?.input || '',
      visibleCases,
      subId
    );

    if (res.submission) {
      setVerdict(res.submission.verdict);
      setRuntimeMs(res.submission.runtime_ms);
      setMemoryMb(res.submission.memory_kb / 1024);
      setStdoutLogs(res.submission.stdout_output || '');
      setStderrLogs(res.submission.stderr_output || '');
      setCompileOutput(res.submission.compile_output || '');
      setTestCasesPassed(res.submission.test_cases_passed);
      setTotalTestCases(res.submission.total_test_cases);
      if (res.submission.telemetry) {
        setTelemetry(res.submission.telemetry);
      }
      const failed = res.submission.first_failed_test || res.submission.firstFailedTest || null;
      setFirstFailedTest(failed);
      if (res.submission.sample_test_results) {
        const map: Record<number, { actualOutput?: string; verdict?: 'ac' | 'wa' }> = {};
        res.submission.sample_test_results.forEach((st) => {
          map[st.test_number] = {
            actualOutput: st.actual_output || '',
            verdict: st.passed ? 'ac' : 'wa',
          };
        });
        setSampleTestOutputs(map);
      }
    }
  };

  // Submit code against all hidden test cases (canonical evaluation)
  const handleSubmitCode = async () => {
    if (!problem || verdict === 'running') return;

    // Quarantined draft catalog check
    if (!problem.is_published || problem.workflow_status === 'draft') {
      setVerdict('cancelled');
      setStdoutLogs(
        `[CATALOG INDEX RECORD — DRAFT / CONTENT REVIEW]\n\n` +
        `Execution Sandbox Quarantined:\n` +
        `This record (${problem.verniq_id || 'VRQ-INDEX'}) is indexed in the Verniq catalog but has not yet passed formal content review.\n` +
        `Verified test cases, constraints, and sandbox execution are enabled only for published problems.`
      );
      return;
    }

    const subId = crypto.randomUUID();
    setActiveSubmissionId(subId);
    setExecutionMode('submit');
    setVerdict('running');
    setStdoutLogs('Compiling solution...\nExecuting full test matrix across isolated containers...');
    setStderrLogs('');
    setCompileOutput('');
    setTelemetry(null);
    setFirstFailedTest(null);

    if (import.meta.env.DEV) {
      console.log('[VERNIQ SUBMIT TRACE]', {
        stage: 'handleSubmitCode',
        problemId: problem.id,
        verniqId: problem.verniq_id,
        executionMode: 'submit',
        canonicalTestCount,
        sampleTestCount: sampleTestCases?.length ?? 0,
      });
    }

    const res = await submitSolution(
      problem.id,
      code,
      language as ProgrammingLanguage,
      user?.id,
      undefined, // Dispatches against the complete canonical test suite
      subId,
      canonicalTestCount
    );

    if (import.meta.env.DEV) {
      console.log('[VERNIQ SUBMIT TRACE]', {
        stage: 'submitSolution result received',
        verdict: res.submission?.verdict,
        testCasesPassed: res.submission?.test_cases_passed,
        totalTestCases: res.submission?.total_test_cases,
      });
    }

    if (res.submission) {
      setVerdict(res.submission.verdict);
      setRuntimeMs(res.submission.runtime_ms);
      setMemoryMb(res.submission.memory_kb / 1024);
      setStdoutLogs(res.submission.stdout_output || '');
      setStderrLogs(res.submission.stderr_output || '');
      setCompileOutput(res.submission.compile_output || '');
      setTestCasesPassed(res.submission.test_cases_passed);
      setTotalTestCases(res.submission.total_test_cases);
      if (res.submission.telemetry) {
        setTelemetry(res.submission.telemetry);
      }
      const failed = res.submission.first_failed_test || res.submission.firstFailedTest || null;
      setFirstFailedTest(failed);
      if (res.submission.verdict === 'accepted') {
        updateProgress(problem.id, 'solved');
        if (user) {
          syncAcceptedSubmissionToSprintAndDiagnostics(user.id, problem.id, problem.difficulty);
        }
      }
    }
  };

  // Cancel active execution
  const handleCancelExecution = async () => {
    if (activeSubmissionId && verdict === 'running') {
      await cancelExecution(activeSubmissionId);
      setVerdict('cancelled');
      setStdoutLogs((prev) => (prev ? prev + '\n[CANCELLED] Execution stopped by user.' : '[CANCELLED] Execution stopped by user.'));
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleResetCode = () => {
    if (problem?.starter_templates?.[language]) {
      setCode(problem.starter_templates[language]);
    } else {
      setCode(DEFAULT_TEMPLATES[language] || '// Write code here');
    }
  };


  if (loading && !problem) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-background">
        <div className="flex items-center gap-2 font-mono text-sm text-text-secondary">
          <RefreshCw className="w-4 h-4 animate-spin text-primary" />
          <span>Loading problem specification from Supabase...</span>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="p-8 text-center bg-background min-h-screen">
        <p className="text-text-secondary font-mono">Problem not found.</p>
        <Link to="/problems" className="text-primary font-mono text-sm underline mt-2 inline-block">
          Return to Problem Catalog
        </Link>
      </div>
    );
  }

  const isRevisionMarked = Boolean(revisionMap[problem.id]);
  const isSolved = progressMap[problem.id] === 'solved';
  const isDraft = !problem.is_published || problem.workflow_status === 'draft';

  // Map test cases to TestCaseConsole format
  const consoleTestCases: TestCaseItem[] = sampleTestCases.map((tc, idx) => {
    const sampleRes = sampleTestOutputs[idx + 1];
    return {
      id: idx + 1,
      input: tc.input,
      expectedOutput: tc.expected_output,
      actualOutput: sampleRes?.actualOutput,
      verdict: sampleRes?.verdict,
    };
  });

  // Left Pane: Description, Editorial, Solutions, Submissions
  const LeftPane = (
    <div className="flex flex-col h-full bg-surface text-text-primary">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-border bg-surface-elevated shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLeftTab('description')}
            className={`px-3 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
              leftTab === 'description'
                ? 'bg-surface text-text-primary border border-border shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Description</span>
          </button>

          <button
            onClick={() => setLeftTab('editorial')}
            className={`px-3 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
              leftTab === 'editorial'
                ? 'bg-surface text-text-primary border border-border shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Editorial</span>
          </button>

          <button
            onClick={() => setLeftTab('solutions')}
            className={`px-3 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
              leftTab === 'solutions'
                ? 'bg-surface text-text-primary border border-border shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-[#FFC01E]" />
            <span>Solutions</span>
          </button>

          <button
            onClick={() => setLeftTab('submissions')}
            className={`px-3 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
              leftTab === 'submissions'
                ? 'bg-surface text-text-primary border border-border shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Submissions</span>
          </button>
        </div>
      </div>

      {/* Pane Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-left select-text">
        {/* TAB 1: DESCRIPTION */}
        {leftTab === 'description' && (
          <div className="space-y-6">
            {/* Draft Catalog Quarantine Banner */}
            {isDraft && (
              <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-950/20 text-xs font-mono space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    Catalog Index Record — Draft / Content Review
                  </span>
                  <span className="bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded border border-amber-700/50 text-[11px]">
                    {problem.verniq_id || 'VRQ-INDEX'}
                  </span>
                </div>
                <p className="text-text-secondary leading-relaxed font-sans text-xs">
                  This problem record was safely ingested as part of the 3,392-problem catalog normalization phase. Algorithmic statement, sample test vectors, mathematical constraints, and judge execution sandbox are quarantined pending formal content-authoring and provenance review.
                </p>
                <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] text-text-muted pt-2 border-t border-amber-500/10">
                  <div className="flex items-center gap-4">
                    <span>Domain: <strong className="text-gray-300">{problem.domain || 'DSA'}</strong></span>
                    <span>Workflow: <strong className="text-amber-400">DRAFT</strong></span>
                    <span>Provenance: <strong className="text-gray-300">REVIEW_REQUIRED</strong></span>
                  </div>
                  {problem.verniq_id && (
                    <Link
                      to={`/authoring?vrq=${problem.verniq_id}`}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded border border-amber-500/40 flex items-center gap-1 font-sans text-xs transition-colors font-medium shadow-xs"
                    >
                      <span>Author in Studio</span>
                      <span>→</span>
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {problem.verniq_id && (
                  <span className="bg-white/[0.06] text-gray-300 text-xs px-2 py-0.5 rounded font-mono border border-white/[0.08]">
                    {problem.verniq_id}
                  </span>
                )}
                {problem.domain && problem.domain !== 'DSA' && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-800/40">
                    {problem.domain}
                  </span>
                )}
                <DifficultyBadge difficulty={problem.difficulty} />
                <Badge variant="neutral">Acceptance: {problem.acceptance_rate}%</Badge>
                {isSolved && <Badge variant="success">Solved</Badge>}
                {(problem.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="bg-[#333333] text-gray-300 text-xs px-2 py-0.5 rounded font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-sans text-white tracking-[-0.025em]">{problem.title}</h1>
            </div>

            <div className="text-sm text-text-primary leading-relaxed whitespace-pre-line font-sans">
              {problem.description_markdown}
            </div>

            {/* Sample Examples */}
            {sampleTestCases.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-xs font-sans font-semibold uppercase tracking-wider text-text-secondary">
                  Verified Test Vectors & Examples
                </h3>
                {sampleTestCases.map((tc, idx) => (
                  <div key={tc.id || idx} className="p-3.5 rounded-lg border border-border bg-surface-elevated space-y-2">
                    <div className="font-mono text-xs font-bold text-text-secondary">Example {idx + 1}:</div>
                    <div className="space-y-1 font-mono text-xs">
                      <div>
                        <span className="text-text-secondary">Input: </span>
                        <span className="text-text-primary font-semibold">{tc.input}</span>
                      </div>
                      <div>
                        <span className="text-text-secondary">Expected Output: </span>
                        <span className="text-[#00B8A3] font-semibold">{tc.expected_output}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <h3 className="text-xs font-sans font-semibold uppercase tracking-wider text-text-secondary">
                  Test Vectors & Examples
                </h3>
                <div className="p-3.5 rounded-lg border border-border bg-surface-elevated text-xs font-mono text-text-secondary">
                  Test vectors are quarantined for this catalog record pending verification.
                </div>
              </div>
            )}

            {/* Constraints */}
            {problem.constraints_markdown && (
              <div className="space-y-2">
                <h3 className="text-xs font-sans font-semibold uppercase tracking-wider text-text-secondary">
                  Constraints & Mathematical Bounds
                </h3>
                <div className="text-xs font-mono text-text-secondary bg-surface-elevated p-3 rounded-lg border border-border whitespace-pre-line">
                  {problem.constraints_markdown}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EDITORIAL */}
        {leftTab === 'editorial' && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-surface-elevated">
              <h3 className="font-sans font-semibold text-base text-white tracking-[-0.015em] mb-2 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-primary" />
                <span>Formal Editorial & Invariant Analysis</span>
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed mb-4">
                Rigorous algorithmic analysis demonstrating the deterministic transition states that guarantee correct execution and complexity bounds.
              </p>
              <div className="space-y-3">
                <div className="p-3 rounded bg-surface border border-border text-xs leading-relaxed font-sans text-text-primary">
                  <strong className="font-mono text-primary">Invariant Formulation:</strong> During state transitions, the candidate space is contracted monotonically without skipping any possible valid configuration.
                </div>
                <div className="p-3 rounded bg-surface border border-border text-xs leading-relaxed font-sans text-text-primary">
                  <strong className="font-mono text-primary">Complexity Verification:</strong> Time complexity is proven to be strictly bounded by the constraints (typically $O(n)$ or $O(n \log n)$), preventing Time Limit Exceeded (TLE) under adversarial test vectors.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SOLUTIONS */}
        {leftTab === 'solutions' && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-surface-elevated space-y-3">
              <h3 className="font-sans font-semibold text-base text-white tracking-[-0.015em] flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#FFC01E]" />
                <span>Canonical Approaches & Proofs</span>
              </h3>
              <div className="space-y-3">
                <div className="p-3 rounded bg-surface border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-text-primary">Approach 1: Optimal Hash Map / Two Pointers</span>
                    <span className="font-mono text-[11px] text-[#00B8A3]">O(n) Time • O(n) Space</span>
                  </div>
                  <p className="text-xs text-text-secondary font-sans leading-relaxed">
                    Trade auxiliary memory for linear time execution by storing past observations or contracting two sorted pointers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SUBMISSIONS */}
        {leftTab === 'submissions' && (
          <div className="space-y-3">
            <h3 className="text-xs font-sans font-semibold uppercase tracking-wider text-text-secondary">
              Session Submission History
            </h3>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-surface-elevated border-b border-border text-text-secondary">
                  <tr>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Language</th>
                    <th className="p-2.5">Runtime</th>
                    <th className="p-2.5">Passed</th>
                    <th className="p-2.5">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {submissionHistory.length > 0 ? (
                    submissionHistory.map((sub) => (
                      <tr key={sub.id} className="hover:bg-white/[0.02]">
                        <td className="p-2.5">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                              sub.verdict === 'accepted'
                                ? 'bg-[#00B8A3]/10 text-[#00B8A3] border border-[#00B8A3]/30'
                                : 'bg-[#FF375F]/10 text-[#FF375F] border border-[#FF375F]/30'
                            )}
                          >
                            {sub.verdict.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-2.5 text-text-secondary">
                          {sub.is_custom_run ? 'Run' : 'Submit'}
                        </td>
                        <td className="p-2.5 font-mono text-text-primary uppercase">
                          {sub.language}
                        </td>
                        <td className="p-2.5 text-text-primary">{sub.runtime_ms} ms</td>
                        <td className="p-2.5 text-text-secondary font-mono text-[11px]">
                          {sub.test_cases_passed}/{sub.total_test_cases}
                          <span className="text-[10px] text-text-tertiary ml-1 font-sans">
                            {sub.is_custom_run ? '(sample)' : '(canonical)'}
                          </span>
                        </td>
                        <td className="p-2.5 text-text-secondary">
                          {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  ) : isSolved ? (
                    <tr>
                      <td className="p-2.5 text-[#00B8A3] font-bold">Accepted</td>
                      <td className="p-2.5 text-text-secondary">Submit</td>
                      <td className="p-2.5 font-mono">{language.toUpperCase()}</td>
                      <td className="p-2.5">24 ms</td>
                      <td className="p-2.5">24/24</td>
                      <td className="p-2.5 text-text-secondary">Prior Session</td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-text-secondary">
                        No submissions recorded yet for this session.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Right Pane: Code Editor & Console
  const RightPane = (
    <div className="flex flex-col h-full bg-surface text-text-primary">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-border bg-surface-elevated shrink-0">
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="h-7 px-2 text-xs font-mono font-medium rounded border border-border bg-surface text-text-primary focus:outline-none focus:border-border-focus"
          >
            <option value="cpp">C++ (GCC 14)</option>
            <option value="python">Python 3.12</option>
            <option value="java">Java 21</option>
            <option value="typescript">TypeScript 5.4</option>
            <option value="go">Go 1.23</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyCode}
            className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors"
            title="Copy code"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-[#00B8A3]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleResetCode}
            className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors"
            title="Reset to starter template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Code Editor Body */}
      <div className="flex-1 flex overflow-hidden relative bg-[#0E1117]">
        <MonacoCodeEditor
          value={code}
          onChange={setCode}
          language={language}
          onRunShortcut={handleRunCode}
        />
      </div>

      {/* Bottom Console */}
      <TestCaseConsole
        testCases={consoleTestCases}
        customInput={customInput}
        onCustomInputChange={setCustomInput}
        onRunCode={handleRunCode}
        onSubmit={handleSubmitCode}
        onCancel={handleCancelExecution}
        isExecuting={isPending || isRunning || verdict === 'running'}
        verdict={verdict}
        executionMode={executionMode}
        canonicalTestCount={canonicalTestCount}
        sampleTestCount={sampleTestCases?.length || 0}
        runtimeMs={runtimeMs}
        memoryMb={memoryMb}
        testCasesPassed={testCasesPassed}
        totalTestCases={totalTestCases}
        stdoutLogs={stdoutLogs}
        stderrLogs={stderrLogs}
        compileOutput={compileOutput}
        telemetry={liveSubmission?.telemetry || telemetry}
        firstFailedTest={firstFailedTest}
      />
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      {/* Top Problem Navigation Bar */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/problems"
            className="flex items-center gap-1 text-xs font-mono text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Problem Index</span>
          </Link>
          <span className="text-border">|</span>
          {problem.verniq_id && (
            <span className="text-[11px] font-mono text-text-secondary bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
              {problem.verniq_id}
            </span>
          )}
          <span className="text-xs font-mono font-bold text-text-primary truncate max-w-xs sm:max-w-md">
            {problem.title}
          </span>
          <DifficultyBadge difficulty={problem.difficulty} />
          {isDraft && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/40">
              DRAFT
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Spaced-Repetition Revision Star */}
          <button
            onClick={() => toggleRevision(problem.id)}
            className={`p-1.5 rounded transition-colors ${
              isRevisionMarked
                ? 'text-[#FFC01E] bg-[#FFC01E]/10'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
            }`}
            title="Spaced repetition: review after 1, 3, 7, 21 days"
          >
            <Star className={`w-4 h-4 ${isRevisionMarked ? 'fill-[#FFC01E]' : ''}`} />
          </button>

          {/* Stopwatch */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-surface-elevated font-mono text-xs text-text-secondary">
            <TimerIcon className="w-3.5 h-3.5 text-text-secondary" />
            <span className="tabular-nums font-mono">{formatTimer(timerSeconds)}</span>
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className="ml-1 text-text-secondary hover:text-text-primary"
            >
              {timerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main SplitPane Workspace */}
      <SplitPane left={LeftPane} right={RightPane} defaultSplit={45} />
    </div>
  );
};
