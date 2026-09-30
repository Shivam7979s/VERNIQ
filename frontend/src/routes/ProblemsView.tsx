import React, { useState, useMemo } from 'react';
import { Container } from '@/components/ui/layout/Container';
import { ProblemCard } from '@/components/learning/ProblemCard';
import { DifficultyBadge, type DifficultyLevel } from '@/components/learning/DifficultyBadge';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { Badge } from '@/components/ui/data/Badge';
import { Search } from 'lucide-react';

interface ProblemItem {
  id: string;
  slug: string;
  title: string;
  difficulty: DifficultyLevel;
  acceptanceRate: number;
  tags: string[];
  status: 'completed' | 'in_progress' | 'pending';
}

export const ProblemsView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const problems: ProblemItem[] = [
    {
      id: 'p-1',
      slug: 'two-sum-invariants',
      title: 'Optimal Two-Sum & Hash Map Invariant Analysis',
      difficulty: 'easy',
      acceptanceRate: 82.4,
      tags: ['Arrays', 'Hash Map', 'Proof-of-Work'],
      status: 'completed',
    },
    {
      id: 'p-2',
      slug: 'longest-substring-without-repeating',
      title: 'Longest Substring via Dynamic Monotonic Window',
      difficulty: 'medium',
      acceptanceRate: 64.1,
      tags: ['Sliding Window', 'Hash Map', 'Two Pointers'],
      status: 'completed',
    },
    {
      id: 'p-3',
      slug: 'lru-cache-lockfree-concurrency',
      title: 'LRU Cache with O(1) Eviction & Concurrency Controls',
      difficulty: 'medium',
      acceptanceRate: 48.7,
      tags: ['Hash Map', 'Linked List', 'System Design'],
      status: 'in_progress',
    },
    {
      id: 'p-4',
      slug: 'trapping-rain-water-monotonic-stacks',
      title: 'Trapping Rain Water via Dual Pointer & Monotonic Stacks',
      difficulty: 'hard',
      acceptanceRate: 38.2,
      tags: ['Arrays', 'Two Pointers', 'Monotonic Stack'],
      status: 'pending',
    },
    {
      id: 'p-5',
      slug: 'merge-k-sorted-lists-minheap',
      title: 'Merge K Sorted Streams with Min-Heap Invariants',
      difficulty: 'hard',
      acceptanceRate: 41.5,
      tags: ['Heap', 'Linked List', 'Divide & Conquer'],
      status: 'pending',
    },
    {
      id: 'p-6',
      slug: 'valid-parentheses-state-machine',
      title: 'Deterministic State Machine Parentheses Validator',
      difficulty: 'easy',
      acceptanceRate: 89.2,
      tags: ['Stack', 'State Machine', 'Parsing'],
      status: 'completed',
    },
    {
      id: 'p-7',
      slug: 'course-schedule-cycle-detection',
      title: 'Topological Sort & Kahn’s Graph Cycle Detection',
      difficulty: 'medium',
      acceptanceRate: 52.8,
      tags: ['Graph', 'BFS', 'Topological Sort'],
      status: 'pending',
    },
    {
      id: 'p-8',
      slug: 'word-search-trie-backtracking',
      title: 'Parallel Matrix Word Search via Trie & Pruned Backtracking',
      difficulty: 'hard',
      acceptanceRate: 31.6,
      tags: ['Trie', 'Backtracking', 'DFS'],
      status: 'pending',
    },
  ];

  const filteredProblems = useMemo(() => {
    return problems.filter((prob) => {
      const matchesSearch =
        prob.title.toLowerCase().includes(search.toLowerCase()) ||
        prob.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesDifficulty =
        selectedDifficulty === 'all' || prob.difficulty === selectedDifficulty;
      const matchesTag =
        selectedTag === 'all' || prob.tags.includes(selectedTag);

      return matchesSearch && matchesDifficulty && matchesTag;
    });
  }, [problems, search, selectedDifficulty, selectedTag]);

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
                Problems curated with strict execution timeouts, multi-language support (C++, Rust, Go, Python, TypeScript), and Socratic hints.
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex gap-2">
                <DifficultyBadge difficulty="easy" />
                <DifficultyBadge difficulty="medium" />
                <DifficultyBadge difficulty="hard" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-4 rounded border border-border bg-surface flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="w-full md:w-96">
            <Input
              placeholder="Search problems by name or tag..."
              leftIcon={<Search className="w-4 h-4 text-text-muted" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-40">
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

            <div className="w-48">
              <Select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                options={[
                  { value: 'all', label: 'All Topic Tags' },
                  { value: 'Arrays', label: 'Arrays' },
                  { value: 'Hash Map', label: 'Hash Map' },
                  { value: 'Sliding Window', label: 'Sliding Window' },
                  { value: 'Graph', label: 'Graph' },
                  { value: 'Trie', label: 'Trie' },
                  { value: 'System Design', label: 'System Design' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Problems List */}
        <div className="space-y-3">
          {filteredProblems.length > 0 ? (
            filteredProblems.map((prob) => (
              <ProblemCard
                key={prob.id}
                title={prob.title}
                slug={prob.slug}
                difficulty={prob.difficulty}
                acceptanceRate={prob.acceptanceRate}
                tags={prob.tags}
                status={prob.status}
              />
            ))
          ) : (
            <div className="p-12 text-center border border-border rounded bg-surface">
              <p className="text-text-muted text-sm font-mono">No problems match your current filter parameters.</p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};
