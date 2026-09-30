import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/layout/Container';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { Button } from '@/components/ui/actions/Button';
import { DifficultyBadge } from '@/components/learning/DifficultyBadge';
import { useRoadmap } from '@/hooks/useRoadmap';
import { useUserProgress } from '@/hooks/useUserProgress';
import {
  ChevronDown,
  ChevronRight,
  Star,
  CheckCircle2,
  Code2,
  RefreshCw,
  Layers,
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
    <div className="py-8 space-y-8 text-left bg-background min-h-screen text-text-primary">
      <Container size="xl">
        {/* Header Banner */}
        {/* Standardized Sleek Page Header */}
        <PageHeader
          badge="Curriculum Directed Acyclic Graph"
          title={roadmap.title}
          subtitle={roadmap.description}
          actions={
            <div className="p-3.5 rounded-lg border border-white/[0.08] bg-[#181C28] w-full md:w-72 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-medium">
                <span className="text-text-secondary">Total Completion</span>
                <span className="text-[#00B8A3] font-bold tabular-nums">
                  {completedProblemsCount} / {totalProblemsCount} ({overallPercentage}%)
                </span>
              </div>
              <div className="w-full bg-[#1C212E] h-2 rounded-full overflow-hidden border border-white/[0.04]">
                <div
                  className="bg-[#00B8A3] h-full transition-all duration-300"
                  style={{ width: `${overallPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-text-secondary font-mono">
                <span>Ebbinghaus Revision</span>
                <span className="text-[#FFC01E] tabular-nums font-semibold">
                  {revisionActiveCount} Active
                </span>
              </div>
            </div>
          }
        />

        {/* Stepper Controls */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="text-xs font-mono font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span>TUF Curriculum Hierarchy (Step → Sub-step / Topic → Problem Nodes)</span>
            {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="text-xs font-mono text-text-secondary hover:text-text-primary px-2.5 py-1 rounded hover:bg-surface-elevated transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Sync</span>
            </button>
            <span className="text-border">|</span>
            <button
              onClick={expandAll}
              className="text-xs font-mono text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-surface-elevated transition-colors"
            >
              Expand All
            </button>
            <span className="text-border">|</span>
            <button
              onClick={collapseAll}
              className="text-xs font-mono text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-surface-elevated transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* TakeUForward A2Z Sheet Tree */}
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
                className="border border-border rounded-lg bg-surface overflow-hidden shadow-elevation-1"
              >
                {/* Step Accordion Header */}
                <div
                  onClick={() => toggleStep(step.id)}
                  className="p-4 bg-surface-elevated cursor-pointer hover:bg-surface-subtle/60 transition-colors flex items-center justify-between gap-4 select-none"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-text-secondary hover:text-text-primary">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <div>
                      <h2 className="font-sans font-semibold tracking-[-0.02em] text-sm sm:text-base text-text-primary flex items-center gap-2">
                        <span>{step.title}</span>
                        {stepPercentage === 100 && stepProblems.length > 0 && (
                          <CheckCircle2 className="w-4 h-4 text-[#00B8A3]" />
                        )}
                      </h2>
                    </div>
                  </div>

                  {/* Step Progress Fraction & Mini Bar */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:block text-right">
                      <div className="text-xs font-mono font-semibold text-text-primary">
                        {stepCompletedCount} / {stepProblems.length} Solved
                      </div>
                      <div className="text-[11px] text-text-secondary font-mono">{stepPercentage}% Complete</div>
                    </div>
                    <div className="w-20 bg-surface-subtle h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#00B8A3] h-full transition-all duration-300"
                        style={{ width: `${stepPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Sub-steps & Problem Nodes */}
                {isExpanded && (
                  <div className="divide-y divide-border">
                    {(step.topics || []).map((topic) => (
                      <div key={topic.id} className="p-4 space-y-3 bg-surface/50">
                        {/* Topic Header */}
                        <div className="flex items-center justify-between">
                          <h3 className="font-sans font-semibold tracking-[-0.015em] text-xs text-primary uppercase flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span>{topic.title}</span>
                          </h3>
                        </div>

                        {/* Dense Problem Table */}
                        <div className="border border-border rounded-lg overflow-hidden bg-surface">
                          <table className="w-full text-left text-xs font-mono border-collapse">
                            <thead>
                              <tr className="bg-surface-elevated/70 border-b border-border text-text-secondary h-10">
                                <th className="py-2 px-3 w-10 text-center">Done</th>
                                <th className="py-2 px-3">Problem Title</th>
                                <th className="py-2 px-3 w-28">Difficulty</th>
                                <th className="py-2 px-3 hidden md:table-cell">Tags</th>
                                <th className="py-2 px-3 w-24 text-center">Revision</th>
                                <th className="py-2 px-3 w-24 text-right">Practice</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {(topic.problems || []).map((prob) => {
                                const isDone = progressMap[prob.id] === 'solved';
                                const isRevision = Boolean(revisionMap[prob.id]);

                                return (
                                  <tr
                                    key={prob.id}
                                    className={`h-11 hover:bg-surface-elevated/60 transition-colors ${
                                      isDone ? 'bg-[#00B8A3]/5' : ''
                                    }`}
                                  >
                                    {/* Completion Checkbox */}
                                    <td className="py-2 px-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={isDone}
                                        onChange={() =>
                                          updateProgress(prob.id, isDone ? 'todo' : 'solved')
                                        }
                                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-[#00B8A3]"
                                        title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                                      />
                                    </td>

                                    {/* Title & Link (hover:text-blue-400) */}
                                    <td className="py-2 px-3">
                                      <div className="flex items-center gap-2">
                                        <Link
                                          to={`/problems/${prob.slug}`}
                                          className={`font-sans font-medium hover:text-blue-400 transition-colors text-xs ${
                                            isDone
                                              ? 'line-through text-text-secondary'
                                              : 'text-text-primary'
                                          }`}
                                        >
                                          {prob.title}
                                        </Link>
                                      </div>
                                    </td>

                                    {/* Difficulty Pill */}
                                    <td className="py-2 px-3">
                                      <DifficultyBadge difficulty={prob.difficulty} />
                                    </td>

                                    {/* Tags */}
                                    <td className="py-2 px-3 hidden md:table-cell">
                                      <div className="flex gap-1.5">
                                        {(prob.tags || ['Core']).map((t) => (
                                          <span
                                            key={t}
                                            className="bg-[#333333] text-gray-300 text-[11px] px-2 py-0.5 rounded font-mono"
                                          >
                                            {t}
                                          </span>
                                        ))}
                                      </div>
                                    </td>

                                    {/* Revision Star Action */}
                                    <td className="py-2 px-3 text-center">
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          toggleRevision(prob.id);
                                        }}
                                        className="p-1 rounded hover:bg-surface-elevated transition-colors"
                                        title={isRevision ? 'In Revision Queue (Click to remove)' : 'Mark for Revision'}
                                      >
                                        <Star
                                          className={`w-3.5 h-3.5 transition-colors ${
                                            isRevision
                                              ? 'fill-[#FFC01E] text-[#FFC01E]'
                                              : 'text-text-secondary hover:text-[#FFC01E]'
                                          }`}
                                        />
                                      </button>
                                    </td>

                                    {/* Action Solve */}
                                    <td className="py-2 px-3 text-right">
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
