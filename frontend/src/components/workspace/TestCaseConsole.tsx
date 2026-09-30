import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/actions/Button';
import {
  Play,
  Send,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Terminal,
  Code2,
  Database,
  Cpu,
  BarChart3,
  Flame,
} from 'lucide-react';
import { SubmissionVerdict } from '@/types';

export type ConsoleTab = 'testcases' | 'custom_input' | 'result';

export type ExecutionVerdict = SubmissionVerdict | 'idle';

export interface TestCaseItem {
  id: number;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  verdict?: 'ac' | 'wa' | 'accepted' | 'wrong_answer';
}

interface TestCaseConsoleProps {
  testCases: TestCaseItem[];
  customInput: string;
  onCustomInputChange: (val: string) => void;
  onRunCode: () => void;
  onSubmit: () => void;
  isExecuting?: boolean;
  verdict?: ExecutionVerdict;
  runtimeMs?: number;
  memoryMb?: number;
  testCasesPassed?: number;
  totalTestCases?: number;
  stdoutLogs?: string;
  stderrLogs?: string;
  compileOutput?: string;
  className?: string;
}

export const TestCaseConsole: React.FC<TestCaseConsoleProps> = ({
  testCases,
  customInput,
  onCustomInputChange,
  onRunCode,
  onSubmit,
  isExecuting = false,
  verdict = 'idle',
  runtimeMs = 0,
  memoryMb = 0,
  testCasesPassed = 0,
  totalTestCases = 0,
  stdoutLogs = '',
  stderrLogs = '',
  compileOutput = '',
  className,
}) => {
  const [activeTab, setActiveTab] = useState<ConsoleTab>('testcases');
  const [selectedCaseIndex, setSelectedCaseIndex] = useState<number>(0);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Auto-switch to 'result' tab when execution triggers or finishes
  useEffect(() => {
    if (verdict !== 'idle') {
      setActiveTab('result');
      setIsCollapsed(false);
    }
  }, [verdict]);

  const selectedCase = testCases[selectedCaseIndex] || testCases[0];

  const getVerdictDetails = (v: ExecutionVerdict) => {
    switch (v) {
      case 'ac':
      case 'accepted':
        return {
          pill: 'AC',
          title: 'Accepted',
          desc: 'All test vectors verified successfully against canonical bounds.',
          color: 'text-[#00B8A3] bg-[#00B8A3]/10 border-[#00B8A3]/30',
          badgeColor: 'bg-[#00B8A3] text-black font-bold',
          icon: <CheckCircle2 className="w-5 h-5 text-[#00B8A3]" />,
          isPositive: true,
        };
      case 'wa':
      case 'wrong_answer':
        return {
          pill: 'WA',
          title: 'Wrong Answer',
          desc: 'Output mismatch on test vector evaluated against expected returns.',
          color: 'text-[#FF375F] bg-[#FF375F]/10 border-[#FF375F]/30',
          badgeColor: 'bg-[#FF375F] text-white font-bold',
          icon: <XCircle className="w-5 h-5 text-[#FF375F]" />,
          isPositive: false,
        };
      case 'tle':
      case 'time_limit_exceeded':
        return {
          pill: 'TLE',
          title: 'Time Limit Exceeded',
          desc: 'Execution exceeded 2.0s sandbox CPU threshold.',
          color: 'text-[#FFC01E] bg-[#FFC01E]/10 border-[#FFC01E]/30',
          badgeColor: 'bg-[#FFC01E] text-black font-bold',
          icon: <Clock className="w-5 h-5 text-[#FFC01E]" />,
          isPositive: false,
        };
      case 'mle':
      case 'memory_limit_exceeded':
        return {
          pill: 'MLE',
          title: 'Memory Limit Exceeded',
          desc: 'Heap memory usage exceeded 256MB threshold.',
          color: 'text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/30',
          badgeColor: 'bg-[#8B5CF6] text-white font-bold',
          icon: <Database className="w-5 h-5 text-[#8B5CF6]" />,
          isPositive: false,
        };
      case 'ce':
      case 'compilation_error':
        return {
          pill: 'CE',
          title: 'Compilation Error',
          desc: 'Compiler returned non-zero exit code during build phase.',
          color: 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/30',
          badgeColor: 'bg-[#F97316] text-white font-bold',
          icon: <AlertTriangle className="w-5 h-5 text-[#F97316]" />,
          isPositive: false,
        };
      case 're':
      case 'runtime_error':
        return {
          pill: 'RE',
          title: 'Runtime Error',
          desc: 'Process terminated unexpectedly during evaluation.',
          color: 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/30',
          badgeColor: 'bg-[#F97316] text-white font-bold',
          icon: <AlertTriangle className="w-5 h-5 text-[#F97316]" />,
          isPositive: false,
        };
      case 'running':
      case 'pending':
        return {
          pill: 'RUN',
          title: 'Executing in Isolated Sandbox...',
          desc: 'Compiling source and dispatching across worker test vectors.',
          color: 'text-primary bg-primary/10 border-primary/30',
          badgeColor: 'bg-primary text-white font-bold',
          icon: <Clock className="w-5 h-5 animate-spin text-primary" />,
          isPositive: false,
        };
      default:
        return null;
    }
  };

  const verdictMeta = getVerdictDetails(verdict);

  // Runtime comparison percentile benchmark (derived realistically from ms)
  const runtimePercentile = Math.max(12, Math.min(99, Math.round(100 - (runtimeMs / 50) * 80)));
  const memoryPercentile = Math.max(15, Math.min(98, Math.round(100 - (memoryMb / 32) * 70)));

  return (
    <div
      className={cn(
        'flex flex-col border-t border-white/[0.08] bg-[#0E1117] shadow-elevation-2 transition-all duration-150',
        isCollapsed ? 'h-11' : 'h-72 sm:h-80',
        className
      )}
    >
      {/* Console Header Bar */}
      <div className="flex items-center justify-between px-3 h-11 border-b border-white/[0.08] bg-[#12151E] shrink-0">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab('testcases');
            }}
            className={cn(
              'px-2.5 py-1 text-xs font-mono font-medium rounded flex items-center gap-1.5 transition-colors',
              activeTab === 'testcases' && !isCollapsed
                ? 'bg-[#181C28] text-white border border-white/[0.12] font-semibold'
                : 'text-neutral-400 hover:text-white'
            )}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Testcases</span>
          </button>

          <button
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab('custom_input');
            }}
            className={cn(
              'px-2.5 py-1 text-xs font-mono font-medium rounded flex items-center gap-1.5 transition-colors',
              activeTab === 'custom_input' && !isCollapsed
                ? 'bg-[#181C28] text-white border border-white/[0.12] font-semibold'
                : 'text-neutral-400 hover:text-white'
            )}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Custom Input</span>
          </button>

          <button
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab('result');
            }}
            className={cn(
              'px-2.5 py-1 text-xs font-mono font-medium rounded flex items-center gap-1.5 transition-colors relative',
              activeTab === 'result' && !isCollapsed
                ? 'bg-[#181C28] text-white border border-white/[0.12] font-semibold'
                : 'text-neutral-400 hover:text-white'
            )}
          >
            <span>Result</span>
            {verdict !== 'idle' && (
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  verdict === 'ac' || verdict === 'accepted'
                    ? 'bg-[#00B8A3]'
                    : verdict === 'running' || verdict === 'pending'
                    ? 'bg-primary'
                    : 'bg-[#FF375F]'
                )}
              />
            )}
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-colors"
            title={isCollapsed ? 'Expand Console' : 'Collapse Console'}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <Button
            size="sm"
            variant="secondary"
            onClick={onRunCode}
            disabled={isExecuting}
            leftIcon={<Play className="w-3.5 h-3.5 fill-current text-primary" />}
            className="h-7 text-xs font-mono"
            title="Compile & run against sample test cases (Ctrl + ')"
          >
            Run Code
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={onSubmit}
            disabled={isExecuting}
            leftIcon={<Send className="w-3.5 h-3.5" />}
            className="h-7 text-xs font-mono bg-blue-600 hover:bg-blue-500 text-white"
            title="Submit solution to remote judge sandbox (Ctrl + Enter)"
          >
            Submit
          </Button>
        </div>
      </div>

      {/* Console Content Area */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-3 text-xs font-mono bg-[#0B0D13] select-text">
          {/* TAB 1: TESTCASE */}
          {activeTab === 'testcases' && (
            <div className="space-y-3">
              {/* Case selector pills */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {testCases.map((tc, idx) => (
                  <button
                    key={tc.id}
                    onClick={() => setSelectedCaseIndex(idx)}
                    className={cn(
                      'px-2.5 py-1 rounded border text-xs font-mono font-medium flex items-center gap-1.5 transition-colors',
                      selectedCaseIndex === idx
                        ? 'border-white/[0.2] bg-[#1F2433] text-white font-bold'
                        : 'border-white/[0.08] bg-[#12151E] text-neutral-400 hover:text-white'
                    )}
                  >
                    <span>Case {idx + 1}</span>
                    {(tc.verdict === 'ac' || tc.verdict === 'accepted') && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00B8A3]" />
                    )}
                    {(tc.verdict === 'wa' || tc.verdict === 'wrong_answer') && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF375F]" />
                    )}
                  </button>
                ))}
              </div>

              {selectedCase && (
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-sans font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                      Input Parameters
                    </label>
                    <pre className="p-2.5 rounded bg-[#12151E] border border-white/[0.08] text-neutral-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {selectedCase.input}
                    </pre>
                  </div>

                  <div>
                    <label className="text-[11px] font-sans font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                      Expected Return Value
                    </label>
                    <pre className="p-2.5 rounded bg-[#12151E] border border-white/[0.08] text-[#00B8A3] overflow-x-auto whitespace-pre-wrap leading-relaxed font-semibold">
                      {selectedCase.expectedOutput}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CUSTOM TESTCASE */}
          {activeTab === 'custom_input' && (
            <div className="h-full flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-sans font-semibold text-neutral-400 uppercase tracking-wider">
                  Interactive Custom Testcase Vector
                </span>
                <span className="text-[11px] text-neutral-500">Passed directly to stdin</span>
              </div>
              <textarea
                value={customInput}
                onChange={(e) => onCustomInputChange(e.target.value)}
                placeholder="Enter custom input vector (e.g. nums = [2,7,11,15], target = 9)..."
                className="w-full flex-1 p-2.5 rounded bg-[#12151E] border border-white/[0.08] text-neutral-200 font-mono text-xs resize-none focus:outline-none focus:border-blue-500"
                rows={5}
              />
            </div>
          )}

          {/* TAB 3: RESULT */}
          {activeTab === 'result' && (
            <div className="space-y-3">
              {verdictMeta ? (
                <div className="space-y-3">
                  {/* Verdict Headline Banner */}
                  <div className={cn('p-3.5 rounded-lg border flex items-start justify-between gap-3', verdictMeta.color)}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{verdictMeta.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={cn('px-2 py-0.5 text-[11px] rounded font-mono', verdictMeta.badgeColor)}>
                            {verdictMeta.pill}
                          </span>
                          <h4 className="font-bold font-sans text-base leading-tight text-white">
                            {verdictMeta.title}
                          </h4>
                        </div>
                        <p className="text-xs font-sans opacity-85 mt-1">{verdictMeta.desc}</p>
                      </div>
                    </div>

                    {/* Test Cases Passed Ratio */}
                    {totalTestCases > 0 && verdict !== 'running' && verdict !== 'pending' && (
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs font-mono font-bold text-white bg-black/40 px-2.5 py-1 rounded border border-white/10">
                          {testCasesPassed}/{totalTestCases} Testcases Passed
                        </span>
                        <div className="w-24 h-1.5 bg-black/40 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all duration-500',
                              testCasesPassed === totalTestCases ? 'bg-[#00B8A3]' : 'bg-[#FF375F]'
                            )}
                            style={{ width: `${(testCasesPassed / totalTestCases) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Runtime & Memory Distribution Cards */}
                  {verdict !== 'running' && verdict !== 'pending' && runtimeMs > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Runtime Benchmark Card */}
                      <div className="p-3 rounded-lg bg-[#12151E] border border-white/[0.08] flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-2">
                          <span className="text-neutral-400 font-sans text-xs flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-warning" />
                            Runtime
                          </span>
                          <span className="text-[11px] text-[#00B8A3] font-semibold flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            Beats {runtimePercentile}%
                          </span>
                        </div>
                        <div className="text-lg font-bold font-mono text-white mb-2">
                          {runtimeMs} <span className="text-xs text-neutral-400 font-normal">ms</span>
                        </div>
                        {/* Percentile distribution bar */}
                        <div className="w-full bg-[#181C28] h-2 rounded-full overflow-hidden border border-white/[0.05]">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-[#00B8A3] rounded-full transition-all duration-500"
                            style={{ width: `${runtimePercentile}%` }}
                          />
                        </div>
                      </div>

                      {/* Memory Benchmark Card */}
                      <div className="p-3 rounded-lg bg-[#12151E] border border-white/[0.08] flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-2">
                          <span className="text-neutral-400 font-sans text-xs flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5 text-[#8B5CF6]" />
                            Memory Peak
                          </span>
                          <span className="text-[11px] text-[#8B5CF6] font-semibold flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" />
                            Beats {memoryPercentile}%
                          </span>
                        </div>
                        <div className="text-lg font-bold font-mono text-white mb-2">
                          {memoryMb.toFixed(1)} <span className="text-xs text-neutral-400 font-normal">MB</span>
                        </div>
                        {/* Percentile distribution bar */}
                        <div className="w-full bg-[#181C28] h-2 rounded-full overflow-hidden border border-white/[0.05]">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${memoryPercentile}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Compilation Output (if CE) */}
                  {compileOutput && (
                    <div>
                      <label className="text-[11px] font-sans font-semibold text-[#F97316] uppercase tracking-wider block mb-1">
                        Compilation Output
                      </label>
                      <pre className="p-2.5 rounded bg-[#181C28] border border-[#F97316]/30 text-[#F97316] overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono">
                        {compileOutput}
                      </pre>
                    </div>
                  )}

                  {/* Stderr Output (if RE / TLE) */}
                  {stderrLogs && (
                    <div>
                      <label className="text-[11px] font-sans font-semibold text-[#FF375F] uppercase tracking-wider block mb-1">
                        Error Diagnostic Logs
                      </label>
                      <pre className="p-2.5 rounded bg-[#181C28] border border-[#FF375F]/30 text-[#FF375F] overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono">
                        {stderrLogs}
                      </pre>
                    </div>
                  )}

                  {/* Stdout Output */}
                  {stdoutLogs && (
                    <div>
                      <label className="text-[11px] font-sans font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                        Standard Output
                      </label>
                      <pre className="p-2.5 rounded bg-[#12151E] border border-white/[0.08] text-neutral-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {stdoutLogs}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 rounded-lg border border-white/[0.08] bg-[#12151E] text-neutral-400 text-center flex flex-col items-center justify-center space-y-1.5">
                  <Cpu className="w-7 h-7 text-neutral-500 mb-1" />
                  <p className="text-sm font-sans font-medium text-neutral-300">Ready to Evaluate Solution</p>
                  <p className="text-xs text-neutral-500 max-w-sm">
                    Click <strong className="text-white">Run Code</strong> for visible testcases or{' '}
                    <strong className="text-blue-400">Submit</strong> to run against all hidden testcases.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
