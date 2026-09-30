import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/layout/Container';
import { DifficultyBadge, type DifficultyLevel } from '@/components/learning/DifficultyBadge';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { Badge } from '@/components/ui/data/Badge';
import { Button } from '@/components/ui/actions/Button';
import {
  Search,
  CheckCircle2,
  Clock,
  Circle,
  Bookmark,
  BookmarkCheck,
  ArrowUpDown,
  BookOpen,
  Code2,
  Sparkles,
} from 'lucide-react';

interface ProblemItem {
  id: string;
  slug: string;
  title: string;
  difficulty: DifficultyLevel;
  acceptanceRate: number;
  tags: string[];
  status: 'solved' | 'attempted' | 'todo';
  revisionDue?: boolean;
}

export const ProblemsView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [revisionOnly, setRevisionOnly] = useState<boolean>(false);
  const [sortField, setSortField] = useState<'title' | 'acceptance' | 'difficulty'>('title');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Revision state map
  const [revisionMap, setRevisionMap] = useState<Record<string, boolean>>({
    'p-1': true,
    'p-4': true,
  });

  const [problems] = useState<ProblemItem[]>([
    {
      id: 'p-1',
      slug: 'two-sum-invariants',
      title: 'Optimal Two-Sum & Hash Map Invariant Analysis',
      difficulty: 'easy',
      acceptanceRate: 82.4,
      tags: ['Arrays', 'Hash Map', 'Proof-of-Work'],
      status: 'solved',
      revisionDue: true,
    },
    {
      id: 'p-2',
      slug: 'longest-substring-without-repeating',
      title: 'Longest Substring via Dynamic Monotonic Window',
      difficulty: 'medium',
      acceptanceRate: 64.1,
      tags: ['Sliding Window', 'Hash Map', 'Two Pointers'],
      status: 'solved',
    },
    {
      id: 'p-3',
      slug: 'lru-cache-lockfree-concurrency',
      title: 'LRU Cache with O(1) Eviction & Concurrency Controls',
      difficulty: 'medium',
      acceptanceRate: 48.7,
      tags: ['Hash Map', 'Linked List', 'System Design'],
      status: 'attempted',
    },
    {
      id: 'p-4',
      slug: 'trapping-rain-water-monotonic-stacks',
      title: 'Trapping Rain Water via Dual Pointer & Monotonic Stacks',
      difficulty: 'hard',
      acceptanceRate: 38.2,
      tags: ['Arrays', 'Two Pointers', 'Monotonic Stack'],
      status: 'todo',
      revisionDue: true,
    },
    {
      id: 'p-5',
      slug: 'merge-k-sorted-lists-minheap',
      title: 'Merge K Sorted Streams with Min-Heap Invariants',
      difficulty: 'hard',
      acceptanceRate: 41.5,
      tags: ['Heap', 'Linked List', 'Divide & Conquer'],
      status: 'todo',
    },
    {
      id: 'p-6',
      slug: 'valid-parentheses-state-machine',
      title: 'Deterministic State Machine Parentheses Validator',
      difficulty: 'easy',
      acceptanceRate: 89.2,
      tags: ['Stack', 'State Machine', 'Parsing'],
      status: 'solved',
    },
    {
      id: 'p-7',
      slug: 'course-schedule-cycle-detection',
      title: 'Topological Sort & Kahn’s Graph Cycle Detection',
      difficulty: 'medium',
      acceptanceRate: 52.8,
      tags: ['Graph', 'BFS', 'Topological Sort'],
      status: 'todo',
    },
    {
      id: 'p-8',
      slug: 'word-search-trie-backtracking',
      title: 'Parallel Matrix Word Search via Trie & Pruned Backtracking',
      difficulty: 'hard',
      acceptanceRate: 31.6,
      tags: ['Trie', 'Backtracking', 'DFS'],
      status: 'todo',
    },
  ]);

  const toggleRevision = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setRevisionMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredProblems = useMemo(() => {
    let result = problems.filter((prob) => {
      const matchesSearch =
        prob.title.toLowerCase().includes(search.toLowerCase()) ||
        prob.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesDifficulty =
        selectedDifficulty === 'all' || prob.difficulty === selectedDifficulty;
      const matchesStatus =
        selectedStatus === 'all' || prob.status === selectedStatus;
      const matchesTag =
        selectedTag === 'all' || prob.tags.includes(selectedTag);
      const matchesRevision = !revisionOnly || Boolean(revisionMap[prob.id]);

      return matchesSearch && matchesDifficulty && matchesStatus && matchesTag && matchesRevision;
    });

    result.sort((a, b) => {
      if (sortField === 'title') {
        return sortAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      }
      if (sortField === 'acceptance') {
        return sortAsc ? a.acceptanceRate - b.acceptanceRate : b.acceptanceRate - a.acceptanceRate;
      }
      if (sortField === 'difficulty') {
        const order = { easy: 1, medium: 2, hard: 3 };
        return sortAsc
          ? order[a.difficulty] - order[b.difficulty]
          : order[b.difficulty] - order[a.difficulty];
      }
      return 0;
    });

    return result;
  }, [problems, search, selectedDifficulty, selectedStatus, selectedTag, revisionOnly, revisionMap, sortField, sortAsc]);

  const solvedCount = problems.filter((p) => p.status === 'solved').length;
  const revisionCount = Object.values(revisionMap).filter(Boolean).length;

  return (
    <div className="py-8 space-y-8 text-left">
      <Container size="xl">
        {/* Banner */}
        <div className="p-8 rounded border border-border bg-surface shadow-elevation-1 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge variant="primary">Algorithmic Problem Set</Badge>
                <Badge variant="neutral">Verified Test Suite</Badge>
              </div>
              <h1 className="text-3xl font-bold font-mono tracking-tight text-text-primary">
                Engineering Problems & Challenges
              </h1>
              <p className="text-sm text-text-secondary leading-relaxed">
                Dense LeetCode-standard indexed problem repository with mathematical invariant proofs, multi-language sandbox, and spaced-repetition revision cycles.
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-4 bg-surface-elevated p-4 rounded border border-border">
              <div className="text-center px-3 border-r border-border">
                <div className="text-xl font-bold font-mono text-text-primary">{problems.length}</div>
                <div className="text-[11px] text-text-muted uppercase tracking-wider">Total</div>
              </div>
              <div className="text-center px-3 border-r border-border">
                <div className="text-xl font-bold font-mono text-verdict-ac">{solvedCount}</div>
                <div className="text-[11px] text-text-muted uppercase tracking-wider">Solved</div>
              </div>
              <div className="text-center px-3">
                <div className="text-xl font-bold font-mono text-warning">{revisionCount}</div>
                <div className="text-[11px] text-text-muted uppercase tracking-wider">Revision Due</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dense Filters Bar */}
        <div className="p-4 rounded border border-border bg-surface flex flex-col md:flex-row items-center gap-3 justify-between">
          <div className="w-full md:w-80">
            <Input
              placeholder="Search problems by name or tag..."
              leftIcon={<Search className="w-4 h-4 text-text-muted" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Difficulty Selector */}
            <div className="w-36">
              <Select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                options={[
                  { value: 'all', label: 'All Difficulties' },
                  { value: 'easy', label: 'Easy' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'hard', label: 'Hard' },
                ]}
              />
            </div>

            {/* Status Selector */}
            <div className="w-36">
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'solved', label: 'Solved' },
                  { value: 'attempted', label: 'Attempted' },
                  { value: 'todo', label: 'Todo' },
                ]}
              />
            </div>

            {/* Tag Selector */}
            <div className="w-40">
              <Select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                options={[
                  { value: 'all', label: 'All Topics' },
                  { value: 'Arrays', label: 'Arrays' },
                  { value: 'Hash Map', label: 'Hash Map' },
                  { value: 'Sliding Window', label: 'Sliding Window' },
                  { value: 'Monotonic Stack', label: 'Monotonic Stack' },
                  { value: 'Graph', label: 'Graph' },
                  { value: 'Trie', label: 'Trie' },
                  { value: 'System Design', label: 'System Design' },
                ]}
              />
            </div>

            {/* Revision Toggle */}
            <Button
              size="sm"
              variant={revisionOnly ? 'primary' : 'secondary'}
              onClick={() => setRevisionOnly(!revisionOnly)}
              leftIcon={<Bookmark className="w-3.5 h-3.5" />}
              className="text-xs font-mono"
            >
              Revision Queue ({revisionCount})
            </Button>
          </div>
        </div>

        {/* Dense Table View */}
        <div className="border border-border rounded bg-surface overflow-hidden shadow-elevation-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-surface-elevated border-b border-border text-text-muted">
                  <th className="py-3 px-4 w-12 text-center">Status</th>
                  <th className="py-3 px-4">
                    <button
                      onClick={() => {
                        if (sortField === 'title') setSortAsc(!sortAsc);
                        else {
                          setSortField('title');
                          setSortAsc(true);
                        }
                      }}
                      className="flex items-center gap-1.5 hover:text-text-primary uppercase tracking-wider font-semibold"
                    >
                      <span>Title</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 w-36">
                    <button
                      onClick={() => {
                        if (sortField === 'acceptance') setSortAsc(!sortAsc);
                        else {
                          setSortField('acceptance');
                          setSortAsc(false);
                        }
                      }}
                      className="flex items-center gap-1.5 hover:text-text-primary uppercase tracking-wider font-semibold"
                    >
                      <span>Acceptance</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 w-28">
                    <button
                      onClick={() => {
                        if (sortField === 'difficulty') setSortAsc(!sortAsc);
                        else {
                          setSortField('difficulty');
                          setSortAsc(true);
                        }
                      }}
                      className="flex items-center gap-1.5 hover:text-text-primary uppercase tracking-wider font-semibold"
                    >
                      <span>Difficulty</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 hidden md:table-cell">Topic Tags</th>
                  <th className="py-3 px-4 w-36 text-center">Revision</th>
                  <th className="py-3 px-4 w-24 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProblems.length > 0 ? (
                  filteredProblems.map((prob) => {
                    const isMarked = Boolean(revisionMap[prob.id]);
                    return (
                      <tr
                        key={prob.id}
                        className="hover:bg-surface-elevated/60 transition-colors group"
                      >
                        {/* Status Icon */}
                        <td className="py-3 px-4 text-center">
                          {prob.status === 'solved' && (
                            <CheckCircle2 className="w-4 h-4 text-verdict-ac inline" title="Solved" />
                          )}
                          {prob.status === 'attempted' && (
                            <Clock className="w-4 h-4 text-warning inline" title="Attempted" />
                          )}
                          {prob.status === 'todo' && (
                            <Circle className="w-4 h-4 text-text-muted inline" title="Todo" />
                          )}
                        </td>

                        {/* Title & Editorial Link */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/problems/${prob.slug}`}
                              className="font-sans font-medium text-text-primary group-hover:text-primary transition-colors text-sm hover:underline"
                            >
                              {prob.title}
                            </Link>
                            <Link
                              to={`/problems/${prob.slug}`}
                              title="View formal invariant proof & editorial"
                              className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-primary transition-opacity"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>

                        {/* Acceptance Rate with Mini Progress Bar */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-12 bg-surface-subtle h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-primary h-full"
                                style={{ width: `${prob.acceptanceRate}%` }}
                              />
                            </div>
                            <span className="text-text-secondary">{prob.acceptanceRate}%</span>
                          </div>
                        </td>

                        {/* Difficulty */}
                        <td className="py-3 px-4">
                          <DifficultyBadge difficulty={prob.difficulty} />
                        </td>

                        {/* Tags */}
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {prob.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 rounded border border-border bg-surface-elevated text-[11px] text-text-secondary"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Revision Badge Button */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={(e) => toggleRevision(prob.id, e)}
                            className={`px-2 py-1 rounded text-[11px] font-mono flex items-center justify-center gap-1 mx-auto transition-colors border ${
                              isMarked
                                ? 'border-warning/40 bg-warning/10 text-warning font-semibold'
                                : 'border-transparent text-text-muted hover:border-border hover:bg-surface-elevated'
                            }`}
                            title="Spaced repetition: review after 1, 3, 7, 21 days"
                          >
                            {isMarked ? (
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

                        {/* Action Link */}
                        <td className="py-3 px-4 text-right">
                          <Link to={`/problems/${prob.slug}`}>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-7 px-2.5 text-xs font-mono"
                              leftIcon={<Code2 className="w-3 h-3" />}
                            >
                              Solve
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-text-muted">
                      No problems match your current search and filter parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Container>
    </div>
  );
};
