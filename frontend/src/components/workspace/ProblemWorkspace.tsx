import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SplitPane } from './SplitPane';
import { TestCaseConsole, type TestCaseItem, type ExecutionVerdict } from './TestCaseConsole';
import { DifficultyBadge, type DifficultyLevel } from '@/components/learning/DifficultyBadge';
import { Badge } from '@/components/ui/data/Badge';
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
} from 'lucide-react';

interface ProblemDefinition {
  id: string;
  slug: string;
  title: string;
  difficulty: DifficultyLevel;
  acceptanceRate: number;
  tags: string[];
  description: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string[];
  invariants: string[];
  hints: string[];
  starterCodes: Record<string, string>;
  testCases: TestCaseItem[];
}

const PROBLEMS_DATA: Record<string, ProblemDefinition> = {
  'two-sum-invariants': {
    id: 'p-1',
    slug: 'two-sum-invariants',
    title: 'Optimal Two-Sum & Hash Map Invariant Analysis',
    difficulty: 'easy',
    acceptanceRate: 82.4,
    tags: ['Arrays', 'Hash Map', 'Proof-of-Work'],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order. Formulate an invariant that proves each complement lookup is safe and guarantees $O(n)$ time complexity.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
      },
      {
        input: 'nums = [3,3], target = 6',
        output: '[0,1]',
      },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    invariants: [
      'Loop Invariant: At index i, all elements in nums[0...i-1] are indexed in the hash table with their 0-based position.',
      'Uniqueness: Searching for complement = target - nums[i] in the table guarantees we only pair with previously encountered indices, preventing self-pairing.',
      'Complexity: Average lookup is O(1) amortized, resulting in strict O(n) total time and O(n) space.',
    ],
    hints: [
      'Can you avoid nested loops by trading auxiliary memory for time?',
      'Consider storing the numbers you have seen so far in a hash table mapping value -> index.',
      'As you iterate, check if (target - current_value) is already present in the map.',
    ],
    starterCodes: {
      cpp: `#include <vector>
#include <unordered_map>

class Solution {
public:
    std::vector<int> twoSum(std::vector<int>& nums, int target) {
        std::unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); ++i) {
            int complement = target - nums[i];
            if (seen.find(complement) != seen.end()) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
      python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []`,
      rust: `use std::collections::HashMap;

impl Solution {
    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
        let mut seen = HashMap::new();
        for (i, &num) in nums.iter().enumerate() {
            let complement = target - num;
            if let Some(&prev_idx) = seen.get(&complement) {
                return vec![prev_idx as i32, i as i32];
            }
            seen.insert(num, i);
        }
        vec![]
    }
}`,
      go: `package main

func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if prevIdx, found := seen[complement]; found {
            return []int{prevIdx, i}
        }
        seen[num] = i
    }
    return nil
}`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement)!, i];
    }
    seen.set(nums[i], i);
  }
  return [];
}`,
    },
    testCases: [
      {
        id: 1,
        input: 'nums = [2,7,11,15]\ntarget = 9',
        expectedOutput: '[0,1]',
      },
      {
        id: 2,
        input: 'nums = [3,2,4]\ntarget = 6',
        expectedOutput: '[1,2]',
      },
      {
        id: 3,
        input: 'nums = [3,3]\ntarget = 6',
        expectedOutput: '[0,1]',
      },
    ],
  },
  'longest-substring-without-repeating': {
    id: 'p-2',
    slug: 'longest-substring-without-repeating',
    title: 'Longest Substring via Dynamic Monotonic Window',
    difficulty: 'medium',
    acceptanceRate: 64.1,
    tags: ['Sliding Window', 'Hash Map', 'Two Pointers'],
    description: `Given a string \`s\`, find the length of the longest substring without duplicate characters.

Implement the dynamic sliding window invariant: maintain a window $[L, R]$ such that all characters within the window are strictly unique.`,
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.',
      },
      {
        input: 's = "bbbbb"',
        output: '1',
        explanation: 'The answer is "b", with the length of 1.',
      },
      {
        input: 's = "pwwkew"',
        output: '3',
        explanation: 'The answer is "wke", with the length of 3.',
      },
    ],
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.',
    ],
    invariants: [
      'Window Invariant: Substring s[L...R] contains no repeating characters at the start of each expansion step.',
      'Contraction: When character s[R] is seen at index prev >= L, update L = prev + 1 immediately without stepping one-by-one.',
    ],
    hints: [
      'Maintain an index map of the most recent position of each character.',
      'Whenever you encounter a duplicate within the current window, contract the left pointer past the previous occurrence.',
    ],
    starterCodes: {
      cpp: `#include <string>
#include <vector>
#include <algorithm>

class Solution {
public:
    int lengthOfLongestSubstring(std::string s) {
        std::vector<int> lastPos(256, -1);
        int maxLen = 0, left = 0;
        for (int right = 0; right < s.length(); ++right) {
            if (lastPos[s[right]] >= left) {
                left = lastPos[s[right]] + 1;
            }
            lastPos[s[right]] = right;
            maxLen = std::max(maxLen, right - left + 1);
        }
        return maxLen;
    }
};`,
      python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        last_pos = {}
        max_len = 0
        left = 0
        for right, ch in enumerate(s):
            if ch in last_pos and last_pos[ch] >= left:
                left = last_pos[ch] + 1
            last_pos[ch] = right
            max_len = max(max_len, right - left + 1)
        return max_len`,
      rust: `use std::collections::HashMap;

impl Solution {
    pub fn length_of_longest_substring(s: String) -> i32 {
        let mut last_pos = HashMap::new();
        let mut max_len = 0;
        let mut left = 0;
        for (right, ch) in s.chars().enumerate() {
            if let Some(&prev) = last_pos.get(&ch) {
                if prev >= left {
                    left = prev + 1;
                }
            }
            last_pos.insert(ch, right);
            max_len = max_len.max(right - left + 1);
        }
        max_len as i32
    }
}`,
      go: `package main

func lengthOfLongestSubstring(s string) int {
    lastPos := make(map[byte]int)
    maxLen, left := 0, 0
    for right := 0; right < len(s); right++ {
        ch := s[right]
        if prev, found := lastPos[ch]; found && prev >= left {
            left = prev + 1
        }
        lastPos[ch] = right
        if curr := right - left + 1; curr > maxLen {
            maxLen = curr
        }
    }
    return maxLen
}`,
      typescript: `function lengthOfLongestSubstring(s: string): number {
  const lastPos = new Map<string, number>();
  let maxLen = 0;
  let left = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (lastPos.has(ch) && lastPos.get(ch)! >= left) {
      left = lastPos.get(ch)! + 1;
    }
    lastPos.set(ch, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}`,
    },
    testCases: [
      {
        id: 1,
        input: 's = "abcabcbb"',
        expectedOutput: '3',
      },
      {
        id: 2,
        input: 's = "bbbbb"',
        expectedOutput: '1',
      },
      {
        id: 3,
        input: 's = "pwwkew"',
        expectedOutput: '3',
      },
    ],
  },
};

export const ProblemWorkspace: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const problemSlug = slug && PROBLEMS_DATA[slug] ? slug : 'two-sum-invariants';
  const problem = PROBLEMS_DATA[problemSlug];

  const [language, setLanguage] = useState<string>('cpp');
  const [code, setCode] = useState<string>(problem.starterCodes['cpp'] || '');
  const [leftTab, setLeftTab] = useState<'description' | 'invariants' | 'submissions' | 'hints'>('description');
  const [isRevisionMarked, setIsRevisionMarked] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>(problem.testCases[0]?.input || '');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Execution state
  const [verdict, setVerdict] = useState<ExecutionVerdict>('idle');
  const [runtimeMs, setRuntimeMs] = useState<number>(0);
  const [memoryMb, setMemoryMb] = useState<number>(0);
  const [stdoutLogs, setStdoutLogs] = useState<string>('');

  // Stopwatch state
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(true);

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

  // Sync starter code when language changes
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    if (problem.starterCodes[lang]) {
      setCode(problem.starterCodes[lang]);
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
        `[SANDBOX_OK] Exit status: 0\n[PROFILER] CPU time: 18ms (faster than 88.4% of C++ submissions)\n[MEMORY] Peak virtual memory: 14.8MB\nAll ${problem.testCases.length} visible test cases passed.`
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
    }, 1100);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleResetCode = () => {
    if (problem.starterCodes[language]) {
      setCode(problem.starterCodes[language]);
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
                <Badge variant="neutral">Acceptance: {problem.acceptanceRate}%</Badge>
                {problem.tags.map((tag) => (
                  <Badge key={tag} variant="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h1 className="text-xl font-bold font-mono text-text-primary">{problem.title}</h1>
            </div>

            <div className="text-sm text-text-primary leading-relaxed whitespace-pre-line font-sans">
              {problem.description}
            </div>

            {/* Examples */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted">
                Verified Examples
              </h3>
              {problem.examples.map((ex, idx) => (
                <div key={idx} className="p-3.5 rounded border border-border bg-surface-elevated space-y-2">
                  <div className="font-mono text-xs font-bold text-text-secondary">Example {idx + 1}:</div>
                  <div className="space-y-1 font-mono text-xs">
                    <div>
                      <span className="text-text-muted">Input: </span>
                      <span className="text-text-primary font-semibold">{ex.input}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Output: </span>
                      <span className="text-verdict-ac font-semibold">{ex.output}</span>
                    </div>
                    {ex.explanation && (
                      <div>
                        <span className="text-text-muted font-sans">Explanation: </span>
                        <span className="text-text-secondary font-sans">{ex.explanation}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Constraints */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted">
                Mathematical Constraints & Bounds
              </h3>
              <ul className="list-disc list-inside space-y-1 text-xs font-mono text-text-secondary bg-surface-elevated p-3 rounded border border-border">
                {problem.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
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
                {problem.invariants.map((inv, idx) => (
                  <div key={idx} className="p-3 rounded bg-surface border border-border text-xs leading-relaxed font-sans text-text-primary">
                    {inv}
                  </div>
                ))}
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
                  <tr>
                    <td className="p-2.5 text-verdict-ac font-bold">Accepted</td>
                    <td className="p-2.5">C++14</td>
                    <td className="p-2.5">24 ms</td>
                    <td className="p-2.5">16.2 MB</td>
                    <td className="p-2.5 text-text-muted">Just now</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-verdict-wa font-bold">Wrong Answer</td>
                    <td className="p-2.5">Python 3</td>
                    <td className="p-2.5">N/A</td>
                    <td className="p-2.5">N/A</td>
                    <td className="p-2.5 text-text-muted">10 mins ago</td>
                  </tr>
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
            {problem.hints.map((hint, idx) => (
              <details key={idx} className="group border border-border rounded bg-surface-elevated p-3">
                <summary className="font-mono text-xs font-bold text-text-primary cursor-pointer flex items-center justify-between">
                  <span>Hint {idx + 1}</span>
                  <span className="text-[11px] text-primary group-open:hidden">Reveal</span>
                </summary>
                <p className="mt-2 text-xs text-text-secondary leading-relaxed font-sans">{hint}</p>
              </details>
            ))}
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
            <option value="rust">Rust 1.78</option>
            <option value="go">Go 1.22</option>
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
        testCases={problem.testCases}
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
            onClick={() => setIsRevisionMarked(!isRevisionMarked)}
            className={`px-2.5 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors border ${
              isRevisionMarked
                ? 'border-warning bg-warning/10 text-warning font-bold'
                : 'border-border bg-surface text-text-muted hover:text-text-primary'
            }`}
            title="Mark this problem for spaced-repetition revision (Ebbinghaus curve)"
          >
            {isRevisionMarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {isRevisionMarked ? 'Revision Due (Day 3)' : 'Mark for Revision'}
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
