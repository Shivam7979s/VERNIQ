import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/layout/Container';
import { Badge } from '@/components/ui/data/Badge';
import { Button } from '@/components/ui/actions/Button';
import { DifficultyBadge, type DifficultyLevel } from '@/components/learning/DifficultyBadge';
import {
  ChevronDown,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Code2,
} from 'lucide-react';

interface SheetProblem {
  id: string;
  slug: string;
  title: string;
  difficulty: DifficultyLevel;
  tags: string[];
  articleUrl?: string;
  revisionDue?: boolean;
}

interface SubStep {
  id: string;
  title: string;
  description: string;
  problems: SheetProblem[];
}

interface CurriculumStep {
  stepNumber: number;
  id: string;
  title: string;
  description: string;
  subSteps: SubStep[];
}

const TUF_CURRICULUM_SHEET: CurriculumStep[] = [
  {
    stepNumber: 1,
    id: 'step-1',
    title: 'Step 1: Foundational Systems & Complexity Invariants',
    description: 'Hardware memory layout, asymptotic time/space bounds, and deterministic proofs.',
    subSteps: [
      {
        id: 'sub-1-1',
        title: '1.1 Memory Addressing, Cache Lines & Pointer Arithmetic',
        description: 'Spatial locality, cache hierarchy, stack vs heap allocation in C++ and Rust.',
        problems: [
          {
            id: 'prob-101',
            slug: 'two-sum-invariants',
            title: 'Optimal Two-Sum & Hash Map Invariant Analysis',
            difficulty: 'easy',
            tags: ['Arrays', 'Hash Map'],
            revisionDue: true,
          },
          {
            id: 'prob-102',
            slug: 'valid-parentheses-state-machine',
            title: 'Deterministic State Machine Parentheses Validator',
            difficulty: 'easy',
            tags: ['Stack', 'State Machine'],
          },
        ],
      },
      {
        id: 'sub-1-2',
        title: '1.2 Asymptotic Invariants & Amortized Analysis',
        description: 'Master theorem, potential method, and proof of dynamic array resizing O(1).',
        problems: [
          {
            id: 'prob-103',
            slug: 'lru-cache-lockfree-concurrency',
            title: 'LRU Cache with O(1) Eviction & Concurrency Controls',
            difficulty: 'medium',
            tags: ['Linked List', 'Hash Map'],
          },
        ],
      },
    ],
  },
  {
    stepNumber: 2,
    id: 'step-2',
    title: 'Step 2: Arrays & Monotonic Window Primitives',
    description: 'Two-pointer convergence proofs, sliding window boundaries, and prefix tables.',
    subSteps: [
      {
        id: 'sub-2-1',
        title: '2.1 Sliding Window & Monotonic Sequences',
        description: 'Dynamic contraction invariants, frequency maps, and window boundary proofs.',
        problems: [
          {
            id: 'prob-201',
            slug: 'longest-substring-without-repeating',
            title: 'Longest Substring via Dynamic Monotonic Window',
            difficulty: 'medium',
            tags: ['Sliding Window', 'Two Pointers'],
            revisionDue: true,
          },
          {
            id: 'prob-202',
            slug: 'trapping-rain-water-monotonic-stacks',
            title: 'Trapping Rain Water via Dual Pointer & Monotonic Stacks',
            difficulty: 'hard',
            tags: ['Arrays', 'Monotonic Stack'],
            revisionDue: true,
          },
        ],
      },
      {
        id: 'sub-2-2',
        title: '2.2 Divide & Conquer Stream Merging',
        description: 'Min-heap invariants, tournament trees, and multi-way external merges.',
        problems: [
          {
            id: 'prob-203',
            slug: 'merge-k-sorted-lists-minheap',
            title: 'Merge K Sorted Streams with Min-Heap Invariants',
            difficulty: 'hard',
            tags: ['Heap', 'Divide & Conquer'],
          },
        ],
      },
    ],
  },
  {
    stepNumber: 3,
    id: 'step-3',
    title: 'Step 3: Graph Traversal, Cycles & State Topologies',
    description: 'Directed acyclic graphs, topological ordering, strongly connected components.',
    subSteps: [
      {
        id: 'sub-3-1',
        title: '3.1 Cycle Detection & Topological Sort',
        description: 'Kahn’s in-degree queue, Tarjan’s SCC algorithm, and dependency resolution.',
        problems: [
          {
            id: 'prob-301',
            slug: 'course-schedule-cycle-detection',
            title: 'Topological Sort & Kahn’s Graph Cycle Detection',
            difficulty: 'medium',
            tags: ['Graph', 'BFS', 'Topological Sort'],
          },
        ],
      },
      {
        id: 'sub-3-2',
        title: '3.2 Pruned Backtracking & Prefix Tries',
        description: 'Lexicographical search spaces, matrix boundaries, and Trie state automata.',
        problems: [
          {
            id: 'prob-302',
            slug: 'word-search-trie-backtracking',
            title: 'Parallel Matrix Word Search via Trie & Pruned Backtracking',
            difficulty: 'hard',
            tags: ['Trie', 'Backtracking'],
          },
        ],
      },
    ],
  },
];

export const RoadmapsView: React.FC = () => {
  // Completion tracking state: set of problem IDs marked completed
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({
    'prob-101': true,
    'prob-102': true,
    'prob-201': true,
  });

  // Revision toggle state
  const [revisionMap, setRevisionMap] = useState<Record<string, boolean>>({
    'prob-101': true,
    'prob-201': true,
    'prob-202': true,
  });

  // Expanded steps state: all open by default
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({
    'step-1': true,
    'step-2': true,
    'step-3': true,
  });

  const toggleProblemCompletion = (probId: string) => {
    setCompletedMap((prev) => ({
      ...prev,
      [probId]: !prev[probId],
    }));
  };

  const toggleRevision = (probId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setRevisionMap((prev) => ({
      ...prev,
      [probId]: !prev[probId],
    }));
  };

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const expandAll = () => {
    setExpandedSteps({
      'step-1': true,
      'step-2': true,
      'step-3': true,
    });
  };

  const collapseAll = () => {
    setExpandedSteps({});
  };

  // Calculations
  const allProblems = useMemo(() => {
    return TUF_CURRICULUM_SHEET.flatMap((step) =>
      step.subSteps.flatMap((sub) => sub.problems)
    );
  }, []);

  const totalProblemsCount = allProblems.length;
  const completedProblemsCount = allProblems.filter((p) => completedMap[p.id]).length;
  const overallPercentage = Math.round((completedProblemsCount / totalProblemsCount) * 100) || 0;

  return (
    <div className="py-8 space-y-8 text-left">
      <Container size="xl">
        {/* Header Banner */}
        <div className="p-8 rounded border border-border bg-surface shadow-elevation-1 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge variant="primary">TUF Curriculum Hierarchy</Badge>
                <Badge variant="neutral">Invariant Stepper Tree</Badge>
              </div>
              <h1 className="text-3xl font-bold font-mono tracking-tight text-text-primary">
                A-to-Z Algorithmic Syllabus Sheet
              </h1>
              <p className="text-sm text-text-secondary leading-relaxed">
                Step-by-step hierarchical curriculum model inspired by TakeUForward. Track progress with real-time checkbox completion and spaced-repetition revision cycles.
              </p>
            </div>

            {/* Overall Progress Gauge */}
            <div className="p-4 rounded border border-border bg-surface-elevated w-full md:w-72 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-medium">
                <span className="text-text-muted">Total Completion</span>
                <span className="text-primary font-bold">{completedProblemsCount} / {totalProblemsCount} ({overallPercentage}%)</span>
              </div>
              <div className="w-full bg-surface-subtle h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${overallPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-text-muted">
                <span>Ebbinghaus Active</span>
                <span className="text-warning font-mono">
                  {Object.values(revisionMap).filter(Boolean).length} In Revision
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stepper Controls */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="text-xs font-mono font-semibold text-text-secondary uppercase tracking-wider">
            Curriculum Hierarchy (Step → Sub-step → Problem Nodes)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="text-xs font-mono text-text-muted hover:text-text-primary px-2 py-1 rounded hover:bg-surface-elevated transition-colors"
            >
              Expand All
            </button>
            <span className="text-border">|</span>
            <button
              onClick={collapseAll}
              className="text-xs font-mono text-text-muted hover:text-text-primary px-2 py-1 rounded hover:bg-surface-elevated transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Stepper Sheet Tree */}
        <div className="space-y-6">
          {TUF_CURRICULUM_SHEET.map((step) => {
            const stepProblems = step.subSteps.flatMap((s) => s.problems);
            const stepCompletedCount = stepProblems.filter((p) => completedMap[p.id]).length;
            const stepPercentage = Math.round((stepCompletedCount / stepProblems.length) * 100) || 0;
            const isExpanded = Boolean(expandedSteps[step.id]);

            return (
              <div
                key={step.id}
                className="border border-border rounded bg-surface overflow-hidden shadow-elevation-1"
              >
                {/* Step Header */}
                <div
                  onClick={() => toggleStep(step.id)}
                  className="p-4 bg-surface-elevated cursor-pointer hover:bg-surface-subtle/50 transition-colors flex items-center justify-between gap-4 select-none"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-text-muted hover:text-text-primary">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <div>
                      <h2 className="font-mono font-bold text-sm sm:text-base text-text-primary flex items-center gap-2">
                        <span>{step.title}</span>
                        {stepPercentage === 100 && (
                          <CheckCircle2 className="w-4 h-4 text-verdict-ac" />
                        )}
                      </h2>
                      <p className="text-xs text-text-secondary mt-0.5 font-sans">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Step Progress */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:block text-right">
                      <div className="text-xs font-mono font-semibold text-text-primary">
                        {stepCompletedCount} / {stepProblems.length} Solved
                      </div>
                      <div className="text-[11px] text-text-muted">{stepPercentage}% Complete</div>
                    </div>
                    <div className="w-16 bg-surface-subtle h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${stepPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Sub-steps & Problem Nodes */}
                {isExpanded && (
                  <div className="divide-y divide-border">
                    {step.subSteps.map((subStep) => (
                      <div key={subStep.id} className="p-4 space-y-3">
                        {/* Sub-step Title */}
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-mono font-semibold text-xs text-primary uppercase tracking-wider">
                              {subStep.title}
                            </h3>
                            <p className="text-xs text-text-muted mt-0.5">{subStep.description}</p>
                          </div>
                        </div>

                        {/* Problem Nodes Table */}
                        <div className="border border-border rounded overflow-hidden">
                          <table className="w-full text-left text-xs font-mono border-collapse">
                            <thead>
                              <tr className="bg-surface-elevated/70 border-b border-border text-text-muted">
                                <th className="py-2.5 px-3 w-10 text-center">Done</th>
                                <th className="py-2.5 px-3">Problem Title</th>
                                <th className="py-2.5 px-3 w-28">Difficulty</th>
                                <th className="py-2.5 px-3 hidden md:table-cell">Tags</th>
                                <th className="py-2.5 px-3 w-36 text-center">Spaced Repetition</th>
                                <th className="py-2.5 px-3 w-24 text-right">Practice</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {subStep.problems.map((prob) => {
                                const isDone = Boolean(completedMap[prob.id]);
                                const isRevision = Boolean(revisionMap[prob.id]);

                                return (
                                  <tr
                                    key={prob.id}
                                    className={`hover:bg-surface-elevated/40 transition-colors ${
                                      isDone ? 'bg-verdict-ac/5' : ''
                                    }`}
                                  >
                                    {/* Completion Checkbox */}
                                    <td className="py-2.5 px-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={isDone}
                                        onChange={() => toggleProblemCompletion(prob.id)}
                                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                                        title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                                      />
                                    </td>

                                    {/* Title & Editorial Link */}
                                    <td className="py-2.5 px-3">
                                      <div className="flex items-center gap-2">
                                        <Link
                                          to={`/problems/${prob.slug}`}
                                          className={`font-sans font-medium hover:text-primary transition-colors text-xs ${
                                            isDone
                                              ? 'line-through text-text-muted'
                                              : 'text-text-primary'
                                          }`}
                                        >
                                          {prob.title}
                                        </Link>
                                      </div>
                                    </td>

                                    {/* Difficulty */}
                                    <td className="py-2.5 px-3">
                                      <DifficultyBadge difficulty={prob.difficulty} />
                                    </td>

                                    {/* Tags */}
                                    <td className="py-2.5 px-3 hidden md:table-cell">
                                      <div className="flex gap-1">
                                        {prob.tags.map((t) => (
                                          <span
                                            key={t}
                                            className="px-1.5 py-0.2 rounded border border-border bg-surface-elevated text-[10px] text-text-secondary"
                                          >
                                            {t}
                                          </span>
                                        ))}
                                      </div>
                                    </td>

                                    {/* Revision Badge Toggle */}
                                    <td className="py-2.5 px-3 text-center">
                                      <button
                                        onClick={(e) => toggleRevision(prob.id, e)}
                                        className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center justify-center gap-1 mx-auto transition-colors border ${
                                          isRevision
                                            ? 'border-warning/40 bg-warning/10 text-warning font-semibold'
                                            : 'border-transparent text-text-muted hover:border-border hover:bg-surface-elevated'
                                        }`}
                                      >
                                        {isRevision ? (
                                          <>
                                            <BookmarkCheck className="w-3 h-3" />
                                            <span>Revision Due</span>
                                          </>
                                        ) : (
                                          <>
                                            <Bookmark className="w-3 h-3" />
                                            <span>Review</span>
                                          </>
                                        )}
                                      </button>
                                    </td>

                                    {/* Action Solve */}
                                    <td className="py-2.5 px-3 text-right">
                                      <Link to={`/problems/${prob.slug}`}>
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          className="h-6 px-2 text-[11px] font-mono"
                                          leftIcon={<Code2 className="w-3 h-3" />}
                                        >
                                          Solve
                                        </Button>
                                      </Link>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </div>
  );
};
