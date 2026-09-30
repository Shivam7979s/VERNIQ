import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/layout/Container';
import { Badge } from '@/components/ui/data/Badge';
import { Button } from '@/components/ui/actions/Button';
import { DifficultyBadge } from '@/components/learning/DifficultyBadge';
import { useRoadmap } from '@/hooks/useRoadmap';
import { useUserProgress } from '@/hooks/useUserProgress';
import {
  ChevronDown,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Code2,
  RefreshCw,
} from 'lucide-react';

export const RoadmapsView: React.FC = () => {
  const { roadmap, loading, refetch } = useRoadmap('dsa-problem-solving');
  const { progressMap, revisionMap, updateProgress, toggleRevision } = useUserProgress();

  // Expanded steps state: open by default
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: prev[stepId] === undefined ? false : !prev[stepId],
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    (roadmap.steps || []).forEach((s) => {
      next[s.id] = true;
    });
    setExpandedSteps(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    (roadmap.steps || []).forEach((s) => {
      next[s.id] = false;
    });
    setExpandedSteps(next);
  };

  // Calculations
  const allProblems = useMemo(() => {
    return (roadmap.steps || []).flatMap((step) =>
      (step.topics || []).flatMap((sub) => sub.problems || [])
    );
  }, [roadmap]);

  const totalProblemsCount = allProblems.length;
  const completedProblemsCount = allProblems.filter((p) => progressMap[p.id] === 'solved').length;
  const overallPercentage = totalProblemsCount > 0 ? Math.round((completedProblemsCount / totalProblemsCount) * 100) : 0;
  const revisionActiveCount = allProblems.filter((p) => Boolean(revisionMap[p.id])).length;

  return (
    <div className="py-8 space-y-8 text-left">
      <Container size="xl">
        {/* Header Banner */}
        <div className="p-8 rounded border border-border bg-surface shadow-elevation-1 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge variant="primary">Supabase Curriculum Tree</Badge>
                <Badge variant="neutral">TUF Invariant Hierarchy</Badge>
              </div>
              <h1 className="text-3xl font-bold font-mono tracking-tight text-text-primary">
                {roadmap.title}
              </h1>
              <p className="text-sm text-text-secondary leading-relaxed">
                {roadmap.description}
              </p>
            </div>

            {/* Overall Progress Gauge */}
            <div className="p-4 rounded border border-border bg-surface-elevated w-full md:w-72 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-medium">
                <span className="text-text-muted">Total Completion</span>
                <span className="text-primary font-bold">
                  {completedProblemsCount} / {totalProblemsCount} ({overallPercentage}%)
                </span>
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
                  {revisionActiveCount} In Revision
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stepper Controls */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="text-xs font-mono font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <span>Curriculum Hierarchy (Step → Topic → Problem Nodes)</span>
            {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="text-xs font-mono text-text-muted hover:text-text-primary px-2 py-1 rounded hover:bg-surface-elevated transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Sync</span>
            </button>
            <span className="text-border">|</span>
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
          {(roadmap.steps || []).map((step) => {
            const stepProblems = (step.topics || []).flatMap((t) => t.problems || []);
            const stepCompletedCount = stepProblems.filter((p) => progressMap[p.id] === 'solved').length;
            const stepPercentage =
              stepProblems.length > 0 ? Math.round((stepCompletedCount / stepProblems.length) * 100) : 0;
            const isExpanded = expandedSteps[step.id] !== false; // expanded by default

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
                        {stepPercentage === 100 && stepProblems.length > 0 && (
                          <CheckCircle2 className="w-4 h-4 text-verdict-ac" />
                        )}
                      </h2>
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
                    {(step.topics || []).map((topic) => (
                      <div key={topic.id} className="p-4 space-y-3">
                        {/* Topic Title */}
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-mono font-semibold text-xs text-primary uppercase tracking-wider">
                              {topic.title}
                            </h3>
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
                              {(topic.problems || []).map((prob) => {
                                const isDone = progressMap[prob.id] === 'solved';
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
                                        onChange={() =>
                                          updateProgress(prob.id, isDone ? 'todo' : 'solved')
                                        }
                                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                                        title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                                      />
                                    </td>

                                    {/* Title & Link */}
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
                                        {(prob.tags || ['Core']).map((t) => (
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
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          toggleRevision(prob.id);
                                        }}
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
