import React, { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container } from '@/components/ui/layout/Container';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { Button } from '@/components/ui/actions/Button';
import { DifficultyBadge } from '@/components/learning/DifficultyBadge';
import { useRoadmap as useLegacyRoadmap } from '@/hooks/useRoadmap';
import { useUserProgress } from '@/hooks/useUserProgress';
import { RoadmapOverviewPage } from '@/features/roadmap';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
  Layers,
  Compass,
} from 'lucide-react';

export const RoadmapsView: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const activeSlug = slug || 'dsa-mastery';

  // If the user selected the sprint-based DSA Mastery track (default)
  if (activeSlug !== 'dsa-problem-solving') {
    return (
      <div>
        {/* Track Switcher Navigation Bar */}
        <div className="border-b border-border bg-surface-elevated/40">
          <Container size="xl">
            <div className="flex items-center gap-6 text-xs font-mono py-2.5">
              <span className="text-text-muted">CURRICULUM TRACKS:</span>
              <Link
                to="/roadmaps/dsa-mastery"
                className={`flex items-center gap-1.5 pb-1 border-b-2 transition-colors ${
                  activeSlug === 'dsa-mastery'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>DSA Interview Mastery (Sprints & Days)</span>
              </Link>
              <Link
                to="/roadmaps/dsa-problem-solving"
                className={`flex items-center gap-1.5 pb-1 border-b-2 transition-colors ${
                  activeSlug === 'dsa-problem-solving'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Topic Graph Index (Legacy A2Z)</span>
              </Link>
            </div>
          </Container>
        </div>

        {/* Structured Roadmap Engine */}
        <RoadmapOverviewPage slug={activeSlug} />
      </div>
    );
  }

  // Legacy A2Z View (dsa-problem-solving)
  return <LegacyRoadmapView />;
};

const LegacyRoadmapView: React.FC = () => {
  const { roadmap, loading, refetch } = useLegacyRoadmap('dsa-problem-solving');
  const { progressMap, revisionMap, updateProgress } = useUserProgress();

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

  const allProblems = useMemo(() => {
    return (roadmap.steps || []).flatMap((step) =>
      (step.topics || []).flatMap((sub) => sub.problems || [])
    );
  }, [roadmap]);

  const totalProblemsCount = allProblems.length;
  const completedProblemsCount = allProblems.filter((p) => progressMap[p.id] === 'solved').length;
  const overallPercentage =
    totalProblemsCount > 0 ? Math.round((completedProblemsCount / totalProblemsCount) * 100) : 0;
  const revisionActiveCount = allProblems.filter((p) => Boolean(revisionMap[p.id])).length;

  return (
    <div className="text-left bg-background min-h-screen text-text-primary">
      {/* Track Switcher Navigation Bar */}
      <div className="border-b border-border bg-surface-elevated/40">
        <Container size="xl">
          <div className="flex items-center gap-6 text-xs font-mono py-2.5">
            <span className="text-text-muted">CURRICULUM TRACKS:</span>
            <Link
              to="/roadmaps/dsa-mastery"
              className="flex items-center gap-1.5 pb-1 border-b-2 border-transparent text-text-secondary hover:text-text-primary transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>DSA Interview Mastery (Sprints & Days)</span>
            </Link>
            <Link
              to="/roadmaps/dsa-problem-solving"
              className="flex items-center gap-1.5 pb-1 border-b-2 border-primary text-primary font-bold"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Topic Graph Index (Legacy A2Z)</span>
            </Link>
          </div>
        </Container>
      </div>

      <div className="py-8 space-y-8">
        <Container size="xl">
          {/* Header Banner */}
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
              <span>Topic Graph Tree (Step → Topic → Problem Nodes)</span>
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

          {/* Sheet Tree */}
          <div className="space-y-6">
            {(roadmap.steps || []).map((step) => {
              const stepProblems = (step.topics || []).flatMap((t) => t.problems || []);
              const stepCompletedCount = stepProblems.filter(
                (p) => progressMap[p.id] === 'solved'
              ).length;
              const isExpanded = expandedSteps[step.id] !== false;

              return (
                <div
                  key={step.id}
                  className="border border-border rounded-lg bg-surface overflow-hidden shadow-elevation-1"
                >
                  <div
                    onClick={() => toggleStep(step.id)}
                    className="p-4 bg-surface-elevated cursor-pointer hover:bg-surface-subtle/60 transition-colors flex items-center justify-between gap-4 select-none"
                  >
                    <div className="flex items-center gap-3">
                      <button className="text-text-secondary hover:text-text-primary">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                      <h2 className="font-sans font-semibold text-sm sm:text-base text-text-primary">
                        {step.title}
                      </h2>
                    </div>
                    <span className="text-xs font-mono text-text-muted">
                      {stepCompletedCount} / {stepProblems.length} solved
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="p-4 space-y-4">
                      {(step.topics || []).map((topic) => (
                        <div key={topic.id} className="space-y-2">
                          <h3 className="text-xs font-mono uppercase text-text-muted">
                            {topic.title}
                          </h3>
                          <div className="space-y-1">
                            {(topic.problems || []).map((prob) => (
                              <div
                                key={prob.id}
                                className="flex items-center justify-between p-2 rounded bg-surface-elevated/50 hover:bg-surface-elevated"
                              >
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      updateProgress(
                                        prob.id,
                                        progressMap[prob.id] === 'solved' ? 'todo' : 'solved'
                                      )
                                    }
                                    className="text-text-muted hover:text-[#00B8A3]"
                                  >
                                    <CheckCircle2
                                      className={`w-4 h-4 ${
                                        progressMap[prob.id] === 'solved' ? 'text-[#00B8A3]' : ''
                                      }`}
                                    />
                                  </button>
                                  <span className="text-xs font-medium text-text-primary">
                                    {prob.title}
                                  </span>
                                  <DifficultyBadge difficulty={prob.difficulty} />
                                </div>
                                <Link to={`/problems/${prob.slug}`}>
                                  <Button size="sm" variant="secondary" className="h-6 text-[11px]">
                                    Solve
                                  </Button>
                                </Link>
                              </div>
                            ))}
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
    </div>
  );
};
