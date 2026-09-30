import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/layout/Container';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { DifficultyBadge } from '@/components/learning/DifficultyBadge';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { Button } from '@/components/ui/actions/Button';
import { useProblems } from '@/hooks/useProblems';
import { useUserProgress } from '@/hooks/useUserProgress';
import {
  Search,
  CheckCircle2,
  Star,
  ArrowUpDown,
  BookOpen,
  Code2,
  RefreshCw,
} from 'lucide-react';

export const ProblemsView: React.FC = () => {
  const { problems, loading, refetch } = useProblems();
  const { progressMap, revisionMap, toggleRevision } = useUserProgress();

  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [revisionOnly, setRevisionOnly] = useState<boolean>(false);
  const [sortField, setSortField] = useState<'title' | 'acceptance' | 'difficulty'>('title');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Dynamically extract all available tags from the problem set
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    problems.forEach((p) => {
      (p.tags || []).forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [problems]);

  const filteredProblems = useMemo(() => {
    let result = problems.filter((prob) => {
      const status = progressMap[prob.id] || 'todo';
      const isRevision = Boolean(revisionMap[prob.id]);

      const matchesSearch =
        prob.title.toLowerCase().includes(search.toLowerCase()) ||
        (prob.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()));

      const matchesDifficulty =
        selectedDifficulty === 'all' || prob.difficulty === selectedDifficulty;

      const matchesStatus =
        selectedStatus === 'all' || status === selectedStatus;

      const matchesTag =
        selectedTag === 'all' || (prob.tags || []).includes(selectedTag);

      const matchesRevision = !revisionOnly || isRevision;

      return matchesSearch && matchesDifficulty && matchesStatus && matchesTag && matchesRevision;
    });

    result.sort((a, b) => {
      if (sortField === 'title') {
        return sortAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      }
      if (sortField === 'acceptance') {
        return sortAsc
          ? a.acceptance_rate - b.acceptance_rate
          : b.acceptance_rate - a.acceptance_rate;
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
  }, [
    problems,
    progressMap,
    revisionMap,
    search,
    selectedDifficulty,
    selectedStatus,
    selectedTag,
    revisionOnly,
    sortField,
    sortAsc,
  ]);

  const solvedCount = problems.filter((p) => progressMap[p.id] === 'solved').length;
  const revisionCount = problems.filter((p) => Boolean(revisionMap[p.id])).length;

  return (
    <div className="py-8 space-y-8 text-left bg-background min-h-screen text-text-primary">
      <Container size="xl">
        {/* Standardized Sleek Page Header */}
        <PageHeader
          badge="Problem Catalog"
          title="Engineering Problems & Challenges"
          subtitle="Dense LeetCode-standard indexed problem repository with mathematical invariant proofs, multi-language sandbox, and spaced-repetition revision cycles."
          actions={
            <div className="flex items-center gap-4 bg-[#181C28] p-3 rounded-lg border border-white/[0.08]">
              <div className="text-center px-4 border-r border-white/[0.08]">
                <div className="text-xl font-bold font-mono text-white tabular-nums">{problems.length}</div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider font-mono">Total</div>
              </div>
              <div className="text-center px-4 border-r border-white/[0.08]">
                <div className="text-xl font-bold font-mono text-[#00B8A3] tabular-nums">{solvedCount}</div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider font-mono">Solved</div>
              </div>
              <div className="text-center px-4">
                <div className="text-xl font-bold font-mono text-[#FFC01E] tabular-nums">{revisionCount}</div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider font-mono">Revision Due</div>
              </div>
            </div>
          }
        />

        {/* Dense Filters Bar */}
        <div className="p-4 rounded-lg border border-white/[0.08] bg-[#12151E] flex flex-col md:flex-row items-center gap-3 justify-between">
          <div className="w-full md:w-80">
            <Input
              placeholder="Search problems by name or tag..."
              leftIcon={<Search className="w-4 h-4 text-text-secondary" />}
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
                  ...availableTags.map((tag) => ({ value: tag, label: tag })),
                ]}
              />
            </div>

            {/* Revision Toggle */}
            <Button
              size="sm"
              variant={revisionOnly ? 'primary' : 'secondary'}
              onClick={() => setRevisionOnly(!revisionOnly)}
              leftIcon={<Star className="w-3.5 h-3.5 text-[#FFC01E]" />}
              className="text-xs font-mono"
            >
              Revision Queue ({revisionCount})
            </Button>

            {/* Refetch */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => refetch()}
              title="Refresh from Supabase"
              className="h-8 px-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : 'text-text-secondary'}`} />
            </Button>
          </div>
        </div>

        {/* Dense Table View - LeetCode Style */}
        <div className="border border-border rounded-lg bg-surface overflow-hidden shadow-elevation-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-surface-elevated border-b border-border text-text-secondary h-11">
                  <th className="py-2.5 px-4 w-12 text-center">Status</th>
                  <th className="py-2.5 px-4">
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
                  <th className="py-2.5 px-4 w-36">
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
                  <th className="py-2.5 px-4 w-28">
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
                  <th className="py-2.5 px-4 hidden md:table-cell">Topic Tags</th>
                  <th className="py-2.5 px-4 w-24 text-center">Revision</th>
                  <th className="py-2.5 px-4 w-24 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProblems.length > 0 ? (
                  filteredProblems.map((prob) => {
                    const status = progressMap[prob.id] || 'todo';
                    const isMarked = Boolean(revisionMap[prob.id]);

                    return (
                      <tr
                        key={prob.id}
                        className="h-11 hover:bg-white/[0.02] bg-[#12151E] transition-colors group"
                      >
                        {/* Status Checkmark */}
                        <td className="py-2 px-4 text-center">
                          {status === 'solved' && (
                            <span title="Solved">
                              <CheckCircle2 className="w-4 h-4 text-[#00B8A3] inline" />
                            </span>
                          )}
                          {status === 'attempted' && (
                            <span title="Attempted" className="inline-flex items-center justify-center">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#FFC01E]" />
                            </span>
                          )}
                          {status === 'todo' && (
                            <span title="Todo" className="text-text-muted font-bold text-sm inline-block select-none">
                              -
                            </span>
                          )}
                        </td>

                        {/* Title (hover:text-blue-400) */}
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/problems/${prob.slug}`}
                              className="font-sans font-medium text-text-primary hover:text-blue-400 transition-colors text-sm hover:underline truncate max-w-md"
                            >
                              {prob.title}
                            </Link>
                            <Link
                              to={`/problems/${prob.slug}`}
                              title="View formal invariant proof & editorial"
                              className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-blue-400 transition-opacity"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>

                        {/* Acceptance Rate (JetBrains Mono tabular-nums) */}
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-12 bg-surface-subtle h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-primary h-full"
                                style={{ width: `${Math.min(100, Math.max(0, prob.acceptance_rate))}%` }}
                              />
                            </div>
                            <span className="font-mono tabular-nums text-text-secondary">{prob.acceptance_rate}%</span>
                          </div>
                        </td>

                        {/* Difficulty Pill */}
                        <td className="py-2 px-4">
                          <DifficultyBadge difficulty={prob.difficulty} />
                        </td>

                        {/* Topic Tags (bg-[#1E2330] text-[#8F96A8] text-xs px-2 py-0.5 rounded font-mono) */}
                        <td className="py-2 px-4 hidden md:table-cell">
                          <div className="flex flex-wrap gap-1.5">
                            {(prob.tags || []).map((tag) => (
                              <span
                                key={tag}
                                className="bg-[#1E2330] text-[#8F96A8] text-xs px-2 py-0.5 rounded font-mono border border-white/[0.04]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Revision Star Action */}
                        <td className="py-2 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleRevision(prob.id);
                            }}
                            className="p-1 rounded hover:bg-surface-elevated transition-colors"
                            title={isMarked ? 'In Revision Queue (Click to remove)' : 'Mark for Spaced Repetition Revision'}
                          >
                            <Star
                              className={`w-4 h-4 transition-colors ${
                                isMarked
                                  ? 'fill-[#FFC01E] text-[#FFC01E]'
                                  : 'text-text-secondary hover:text-[#FFC01E]'
                              }`}
                            />
                          </button>
                        </td>

                        {/* Action Solve Link */}
                        <td className="py-2 px-4 text-right">
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
                    <td colSpan={7} className="p-8 text-center text-text-secondary font-mono">
                      {loading ? 'Loading problems from Supabase...' : 'No problems match your current search and filter parameters.'}
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
