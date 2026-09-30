import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SplitPane } from './SplitPane';
import { TestCaseConsole, type TestCaseItem, type ExecutionVerdict } from './TestCaseConsole';
import { DifficultyBadge } from '@/components/learning/DifficultyBadge';
import { Badge } from '@/components/ui/data/Badge';
import { useProblemBySlug } from '@/hooks/useProblemBySlug';
import { useUserProgress } from '@/hooks/useUserProgress';
import {
  ChevronLeft,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  FileCode,
  History,
  BookOpen,
  Timer as TimerIcon,
  Play,
  Pause,
  RefreshCw,
} from 'lucide-react';

const DEFAULT_TEMPLATES: Record<string, string> = {
  cpp: `#include <vector>\n\nclass Solution {\npublic:\n    // Implement your solution\n};`,
  python: `class Solution:\n    # Implement your solution\n    pass`,
  java: `class Solution {\n    // Implement your solution\n}`,
  typescript: `function solution() {\n    // Implement your solution\n}`,
};

export const ProblemWorkspace: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const activeSlug = slug || 'two-sum';

  const { problem, testCases: sampleTestCases, loading } = useProblemBySlug(activeSlug);
  const { progressMap, revisionMap, updateProgress, toggleRevision } = useUserProgress();

  const [language, setLanguage] = useState<string>('cpp');
  const [code, setCode] = useState<string>('');
  const [leftTab, setLeftTab] = useState<'description' | 'invariants' | 'submissions' | 'hints'>('description');
  const [customInput, setCustomInput] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Execution state
  const [verdict, setVerdict] = useState<ExecutionVerdict>('idle');
  const [runtimeMs, setRuntimeMs] = useState<number>(0);
  const [memoryMb, setMemoryMb] = useState<number>(0);
  const [stdoutLogs, setStdoutLogs] = useState<string>('');

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
    if (problem?.starter_templates?.[lang]) {
      setCode(problem.starter_templates[lang]);
    } else {
      setCode(DEFAULT_TEMPLATES[lang] || '// Write code here');
    }
  };

  // Run code simulation
  const handleRunCode = () => {
    setVerdict('running');
    setStdoutLogs('Compiling solution with target sandbox...\nVerifying against visible test vectors...');

    setTimeout(() => {
      setVerdict('ac');
      setRuntimeMs(18);
      setMemoryMb(14.8);
      setStdoutLogs(
        `[SANDBOX_OK] Exit status: 0\n[PROFILER] CPU time: 18ms (faster than 88.4% of C++ submissions)\n[MEMORY] Peak virtual memory: 14.8MB\nAll ${sampleTestCases.length} visible test cases passed.`
      );
    }, 600);
  };

  // Submit code simulation
  const handleSubmitCode = () => {
    setVerdict('running');
    setStdoutLogs('Executing solution on isolated judge container...\nTesting against 64 hidden stress-test vectors...');

    setTimeout(() => {
      setVerdict('ac');
      setRuntimeMs(24);
      setMemoryMb(16.2);
      setStdoutLogs(
        `[JUDGE_ACCEPT] 64/64 test cases passed.\nStatus: Accepted\nRuntime: 24 ms (top 92.1%)\nMemory: 16.2 MB (top 84.7%)\nPoints Awarded: +25 Score credited to campus profile.`
      );
      if (problem) {
        updateProgress(problem.id, 'solved');
      }
    }, 1100);
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

  // Tab key indent handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const val = target.value;
      const nextVal = val.substring(0, start) + '    ' + val.substring(end);
      setCode(nextVal);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    } else if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleSubmitCode();
    } else if (e.ctrlKey && e.key === "'") {
      e.preventDefault();
      handleRunCode();
    }
  };

  if (loading && !problem) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-background">
        <div className="flex items-center gap-2 font-mono text-sm text-text-muted">
          <RefreshCw className="w-4 h-4 animate-spin text-primary" />
          <span>Loading problem specification from Supabase...</span>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="p-8 text-center bg-background">
        <p className="text-text-muted font-mono">Problem not found.</p>
        <Link to="/problems" className="text-primary font-mono text-sm underline mt-2 inline-block">
          Return to Problem Catalog
        </Link>
      </div>
    );
  }

  const isRevisionMarked = Boolean(revisionMap[problem.id]);
  const isSolved = progressMap[problem.id] === 'solved';

  // Map test cases to TestCaseConsole format
  const consoleTestCases: TestCaseItem[] = sampleTestCases.map((tc, idx) => ({
    id: idx + 1,
    input: tc.input,
    expectedOutput: tc.expected_output,
  }));

  // Left Pane: Problem Description & Proofs
  const LeftPane = (
    <div className="flex flex-col h-full bg-surface">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-border bg-surface-elevated shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLeftTab('description')}
            className={`px-3 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
              leftTab === 'description'
                ? 'bg-surface text-primary border border-border shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Problem</span>
          </button>

          <button
            onClick={() => setLeftTab('invariants')}
            className={`px-3 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
              leftTab === 'invariants'
                ? 'bg-surface text-primary border border-border shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Invariants</span>
          </button>

          <button
            onClick={() => setLeftTab('submissions')}
            className={`px-3 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
              leftTab === 'submissions'
                ? 'bg-surface text-primary border border-border shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Submissions</span>
          </button>

          <button
            onClick={() => setLeftTab('hints')}
            className={`px-3 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
              leftTab === 'hints'
                ? 'bg-surface text-primary border border-border shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-warning" />
            <span>Socratic Hints</span>
          </button>
        </div>
      </div>

      {/* Pane Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-left select-text">
        {leftTab === 'description' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DifficultyBadge difficulty={problem.difficulty} />
                <Badge variant="neutral">Acceptance: {problem.acceptance_rate}%</Badge>
                {isSolved && <Badge variant="success">Solved</Badge>}
                {(problem.tags || []).map((tag) => (
                  <Badge key={tag} variant="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h1 className="text-xl font-bold font-mono text-text-primary">{problem.title}</h1>
            </div>

            <div className="text-sm text-text-primary leading-relaxed whitespace-pre-line font-sans">
              {problem.description_markdown}
            </div>

            {/* Sample Examples */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted">
                Sample Test Vectors
              </h3>
              {sampleTestCases.map((tc, idx) => (
                <div key={tc.id || idx} className="p-3.5 rounded border border-border bg-surface-elevated space-y-2">
                  <div className="font-mono text-xs font-bold text-text-secondary">Example {idx + 1}:</div>
                  <div className="space-y-1 font-mono text-xs">
                    <div>
                      <span className="text-text-muted">Input: </span>
                      <span className="text-text-primary font-semibold">{tc.input}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Expected Output: </span>
                      <span className="text-verdict-ac font-semibold">{tc.expected_output}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Constraints */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted">
                Constraints & Mathematical Bounds
              </h3>
              <div className="text-xs font-mono text-text-secondary bg-surface-elevated p-3 rounded border border-border whitespace-pre-line">
                {problem.constraints_markdown}
              </div>
            </div>
          </div>
        )}

        {leftTab === 'invariants' && (
          <div className="space-y-4">
            <div className="p-4 rounded border border-border bg-surface-elevated">
              <h3 className="font-mono font-bold text-sm text-text-primary mb-2 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-primary" />
                <span>Formal Proof of Correctness & Invariants</span>
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed mb-4">
                Rather than memorizing patterns, verify the deterministic state transitions that prove the algorithm terminates correctly.
              </p>
              <div className="space-y-3">
                <div className="p-3 rounded bg-surface border border-border text-xs leading-relaxed font-sans text-text-primary">
                  <strong>Loop Invariant:</strong> Maintain bounded invariant states during traversal. Each step reduces the search space monotonically.
                </div>
                <div className="p-3 rounded bg-surface border border-border text-xs leading-relaxed font-sans text-text-primary">
                  <strong>Asymptotic Verification:</strong> Ensure execution is strictly constrained to O(n) or O(log n) time and O(1) auxiliary space where required.
                </div>
              </div>
            </div>
          </div>
        )}

        {leftTab === 'submissions' && (
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted">
              Past Submission History
            </h3>
            <div className="border border-border rounded overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-surface-elevated border-b border-border text-text-muted">
                  <tr>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Language</th>
                    <th className="p-2.5">Runtime</th>
                    <th className="p-2.5">Memory</th>
                    <th className="p-2.5">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isSolved ? (
                    <tr>
                      <td className="p-2.5 text-verdict-ac font-bold">Accepted</td>
                      <td className="p-2.5 font-mono">{language}</td>
                      <td className="p-2.5">24 ms</td>
                      <td className="p-2.5">16.2 MB</td>
                      <td className="p-2.5 text-text-muted">Recorded</td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-text-muted">
                        No submissions recorded yet for this session.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {leftTab === 'hints' && (
          <div className="space-y-4">
            <div className="p-3 rounded border border-warning/30 bg-warning/5 text-xs text-text-secondary">
              <strong className="text-text-primary font-mono">Socratic Pedagogical Guardrail:</strong> Hints build conceptual scaffolding sequentially without revealing full code.
            </div>
            <details className="group border border-border rounded bg-surface-elevated p-3">
              <summary className="font-mono text-xs font-bold text-text-primary cursor-pointer flex items-center justify-between">
                <span>Hint 1: Invariant Identification</span>
                <span className="text-[11px] text-primary group-open:hidden">Reveal</span>
              </summary>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed font-sans">
                Consider which elements you have visited so far, and what relationship must hold between past items and the current candidate.
              </p>
            </details>
            <details className="group border border-border rounded bg-surface-elevated p-3">
              <summary className="font-mono text-xs font-bold text-text-primary cursor-pointer flex items-center justify-between">
                <span>Hint 2: Space vs Time Tradeoff</span>
                <span className="text-[11px] text-primary group-open:hidden">Reveal</span>
              </summary>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed font-sans">
                Can an auxiliary map or two-pointer boundary contract the search space in constant time?
              </p>
            </details>
          </div>
        )}
      </div>
    </div>
  );

  // Right Pane: Code Editor & Console
  const RightPane = (
    <div className="flex flex-col h-full bg-surface">
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
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyCode}
            className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors"
            title="Copy code"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleResetCode}
            className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors"
            title="Reset to starter template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Code Editor Body */}
      <div className="flex-1 flex overflow-hidden relative font-mono text-xs bg-background">
        {/* Line Numbers */}
        <div className="w-12 py-3 bg-surface-elevated/40 border-r border-border text-right pr-3 select-none text-text-muted font-mono text-xs leading-5 shrink-0">
          {code.split('\n').map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Textarea Code Input */}
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 p-3 bg-transparent text-text-primary font-mono text-xs leading-5 resize-none focus:outline-none whitespace-pre overflow-auto"
        />
      </div>

      {/* Bottom Console */}
      <TestCaseConsole
        testCases={consoleTestCases}
        customInput={customInput}
        onCustomInputChange={setCustomInput}
        onRunCode={handleRunCode}
        onSubmit={handleSubmitCode}
        isExecuting={verdict === 'running'}
        verdict={verdict}
        runtimeMs={runtimeMs}
        memoryMb={memoryMb}
        stdoutLogs={stdoutLogs}
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
            className="flex items-center gap-1 text-xs font-mono text-text-muted hover:text-text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Problem Index</span>
          </Link>
          <span className="text-border">|</span>
          <span className="text-xs font-mono font-bold text-text-primary truncate max-w-xs sm:max-w-md">
            {problem.title}
          </span>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>

        <div className="flex items-center gap-2">
          {/* Spaced-Repetition Revision Toggle */}
          <button
            onClick={() => toggleRevision(problem.id)}
            className={`px-2.5 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors border ${
              isRevisionMarked
                ? 'border-warning bg-warning/10 text-warning font-bold'
                : 'border-border bg-surface text-text-muted hover:text-text-primary'
            }`}
            title="Mark this problem for spaced-repetition revision (Ebbinghaus curve)"
          >
            {isRevisionMarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {isRevisionMarked ? 'Revision Due (Day 1)' : 'Mark for Revision'}
            </span>
          </button>

          {/* Stopwatch */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-border bg-surface-elevated font-mono text-xs text-text-secondary">
            <TimerIcon className="w-3.5 h-3.5 text-text-muted" />
            <span>{formatTimer(timerSeconds)}</span>
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className="ml-1 text-text-muted hover:text-text-primary"
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
