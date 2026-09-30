import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/actions/Button';
import { Play, Send, ChevronUp, ChevronDown, CheckCircle2, XCircle, Clock, AlertTriangle, Terminal, Code2, Database } from 'lucide-react';

export type ConsoleTab = 'testcases' | 'custom_input' | 'result';

export type ExecutionVerdict = 'idle' | 'running' | 'ac' | 'wa' | 'tle' | 'mle' | 'ce';

export interface TestCaseItem {
  id: number;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  verdict?: 'ac' | 'wa';
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
  stdoutLogs?: string;
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
  stdoutLogs = '',
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
        return {
          title: 'Accepted',
          desc: 'All test cases passed verified bounds.',
          color: 'text-[#00B8A3] bg-[#00B8A3]/10 border-[#00B8A3]/30',
          icon: <CheckCircle2 className="w-4 h-4 text-[#00B8A3]" />,
        };
      case 'wa':
        return {
          title: 'Wrong Answer',
          desc: 'Output mismatch on test vector.',
          color: 'text-[#FF375F] bg-[#FF375F]/10 border-[#FF375F]/30',
          icon: <XCircle className="w-4 h-4 text-[#FF375F]" />,
        };
      case 'tle':
        return {
          title: 'Time Limit Exceeded',
          desc: 'Execution exceeded 2000ms sandbox threshold.',
          color: 'text-[#FFC01E] bg-[#FFC01E]/10 border-[#FFC01E]/30',
          icon: <Clock className="w-4 h-4 text-[#FFC01E]" />,
        };
      case 'mle':
        return {
          title: 'Memory Limit Exceeded',
          desc: 'Heap allocation exceeded 256MB threshold.',
          color: 'text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/30',
          icon: <Database className="w-4 h-4 text-[#8B5CF6]" />,
        };
      case 'ce':
        return {
          title: 'Compilation / Runtime Error',
          desc: 'Compiler returned non-zero exit code.',
          color: 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/30',
          icon: <AlertTriangle className="w-4 h-4 text-[#F97316]" />,
        };
      case 'running':
        return {
          title: 'Executing in Sandbox...',
          desc: 'Compiling and executing against test vectors.',
          color: 'text-primary bg-primary/10 border-primary/30',
          icon: <Clock className="w-4 h-4 animate-spin text-primary" />,
        };
      default:
        return null;
    }
  };

  const verdictMeta = getVerdictDetails(verdict);

  return (
    <div
      className={cn(
        'flex flex-col border-t border-border bg-surface shadow-elevation-2 transition-all duration-150',
        isCollapsed ? 'h-11' : 'h-64 sm:h-72',
        className
      )}
    >
      {/* Console Header Bar */}
      <div className="flex items-center justify-between px-3 h-11 border-b border-border bg-surface-elevated shrink-0">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab('testcases');
            }}
            className={cn(
              'px-2.5 py-1 text-xs font-mono font-medium rounded flex items-center gap-1.5 transition-colors',
              activeTab === 'testcases' && !isCollapsed
                ? 'bg-surface text-text-primary border border-border font-semibold shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Testcase</span>
          </button>

          <button
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab('custom_input');
            }}
            className={cn(
              'px-2.5 py-1 text-xs font-mono font-medium rounded flex items-center gap-1.5 transition-colors',
              activeTab === 'custom_input' && !isCollapsed
                ? 'bg-surface text-text-primary border border-border font-semibold shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
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
                ? 'bg-surface text-text-primary border border-border font-semibold shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <span>Results</span>
            {verdict !== 'idle' && (
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  verdict === 'ac' ? 'bg-[#00B8A3]' : verdict === 'running' ? 'bg-primary' : 'bg-[#FF375F]'
                )}
              />
            )}
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors"
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
            title="Compile & run against visible test cases (Ctrl + ')"
          >
            Run
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={onSubmit}
            disabled={isExecuting}
            leftIcon={<Send className="w-3.5 h-3.5" />}
            className="h-7 text-xs font-mono"
            title="Submit solution to remote judge sandbox (Ctrl + Enter)"
          >
            Submit
          </Button>
        </div>
      </div>

      {/* Console Content Area */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-3 text-xs font-mono bg-background select-text">
          {/* TAB 1: TESTCASE */}
          {activeTab === 'testcases' && (
            <div className="space-y-3">
              {/* Case selector pills */}
              <div className="flex items-center gap-2">
                {testCases.map((tc, idx) => (
                  <button
                    key={tc.id}
                    onClick={() => setSelectedCaseIndex(idx)}
                    className={cn(
                      'px-2.5 py-1 rounded border text-xs font-mono font-medium flex items-center gap-1.5 transition-colors',
                      selectedCaseIndex === idx
                        ? 'border-border-strong bg-[#333333] text-text-primary font-bold'
                        : 'border-border bg-surface text-text-secondary hover:text-text-primary'
                    )}
                  >
                    <span>Case {idx + 1}</span>
                    {tc.verdict === 'ac' && <span className="w-1.5 h-1.5 rounded-full bg-[#00B8A3]" />}
                    {tc.verdict === 'wa' && <span className="w-1.5 h-1.5 rounded-full bg-[#FF375F]" />}
                  </button>
                ))}
              </div>

              {selectedCase && (
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-sans font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                      Input Parameters
                    </label>
                    <pre className="p-2.5 rounded bg-surface border border-border text-text-primary overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {selectedCase.input}
                    </pre>
                  </div>

                  <div>
                    <label className="text-[11px] font-sans font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                      Expected Return Value
                    </label>
                    <pre className="p-2.5 rounded bg-surface border border-border text-[#00B8A3] overflow-x-auto whitespace-pre-wrap leading-relaxed font-semibold">
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
                <span className="text-[11px] font-sans font-semibold text-text-secondary uppercase tracking-wider">
                  Interactive Custom Testcase Vector
                </span>
                <span className="text-[11px] text-text-secondary">Multi-line JSON or formatted parameters</span>
              </div>
              <textarea
                value={customInput}
                onChange={(e) => onCustomInputChange(e.target.value)}
                placeholder="Enter custom input vector (e.g. nums = [2,7,11,15], target = 9)..."
                className="w-full flex-1 p-2.5 rounded bg-surface border border-border text-text-primary font-mono text-xs resize-none focus:outline-none focus:border-border-focus"
                rows={5}
              />
            </div>
          )}

          {/* TAB 3: RESULT */}
          {activeTab === 'result' && (
            <div className="space-y-3">
              {verdictMeta ? (
                <div className={cn('p-3 rounded border flex items-start justify-between gap-3', verdictMeta.color)}>
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">{verdictMeta.icon}</div>
                    <div>
                      <h4 className="font-bold font-mono text-sm leading-tight">{verdictMeta.title}</h4>
                      <p className="text-xs font-sans opacity-90 mt-0.5">{verdictMeta.desc}</p>
                    </div>
                  </div>
                  {verdict !== 'running' && (
                    <div className="flex items-center gap-3 text-xs font-mono font-medium">
                      <span>Runtime: {runtimeMs} ms</span>
                      <span>Memory: {memoryMb} MB</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded border border-border bg-surface text-text-secondary text-center">
                  Execute your solution with "Run" or "Submit" to inspect execution results.
                </div>
              )}

              {stdoutLogs && (
                <div>
                  <label className="text-[11px] font-sans font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                    Standard Output & Diagnostics
                  </label>
                  <pre className="p-2.5 rounded bg-surface border border-border text-text-secondary overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {stdoutLogs}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
