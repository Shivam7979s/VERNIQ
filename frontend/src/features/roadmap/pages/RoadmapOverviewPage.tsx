import React, { useState, useMemo } from 'react';
import { Container } from '@/components/ui/layout/Container';
import { RoadmapHeader } from '../components/RoadmapHeader';
import { ContinueLearningBanner } from '../components/ContinueLearningBanner';
import { RoadmapFilterBar } from '../components/RoadmapFilterBar';
import { SprintAccordion } from '../components/SprintAccordion';
import { useRoadmap } from '../hooks/useRoadmap';
import { useContinueLearning } from '../hooks/useContinueLearning';
import { RefreshCw, AlertCircle, Compass } from 'lucide-react';

interface RoadmapOverviewPageProps {
  slug?: string;
}

export const RoadmapOverviewPage: React.FC<RoadmapOverviewPageProps> = ({
  slug = 'dsa-mastery',
}) => {
  const {
    roadmap,
    progressMap,
    progressSummary,
    loading,
    error,
    refetch,
    toggleItemCompleted,
  } = useRoadmap(slug);

  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [expandAllSignal, setExpandAllSignal] = useState<number>(0);
  const [collapseAllSignal, setCollapseAllSignal] = useState<number>(0);

  const continueTarget = useContinueLearning(roadmap, progressMap);
  const isAllCompleted =
    progressSummary.totalItems > 0 &&
    progressSummary.completedItems === progressSummary.totalItems;

  // Filtered sprints
  const filteredSprints = useMemo(() => {
    if (!roadmap) return [];
    if (filter === 'active') {
      return roadmap.sprints.filter((s) => s.status === 'IN_PROGRESS' || s.status === 'AVAILABLE');
    }
    if (filter === 'completed') {
      return roadmap.sprints.filter((s) => s.status === 'COMPLETED');
    }
    return roadmap.sprints;
  }, [roadmap, filter]);

  if (loading && !roadmap) {
    return (
      <div className="py-16 flex flex-col items-center justify-center space-y-3 min-h-[60vh] text-text-secondary">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="font-mono text-xs">Loading VERNIQ Engineering Roadmap...</span>
      </div>
    );
  }

  if (error && !roadmap) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto min-h-[60vh]">
        <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-text-primary">Failed to load roadmap</h3>
        <p className="text-xs text-text-secondary">{error}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded bg-surface-elevated hover:bg-surface-subtle border border-border text-xs font-mono text-text-primary transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!roadmap) {
    return null;
  }

  return (
    <div className="py-8 space-y-8 text-left bg-background min-h-screen text-text-primary">
      <Container size="xl">
        <div className="space-y-6">
          {/* Roadmap Header Banner with High-Level Progress */}
          <RoadmapHeader
            roadmap={roadmap}
            progressSummary={progressSummary}
            loading={loading}
            onRefresh={refetch}
          />

          {/* Continue Learning Next Action Banner */}
          <ContinueLearningBanner
            target={continueTarget}
            onMarkComplete={toggleItemCompleted}
            isAllCompleted={isAllCompleted}
          />

          {/* Sprints Filter & Stepper Controls */}
          <RoadmapFilterBar
            filter={filter}
            onFilterChange={setFilter}
            onExpandAll={() => setExpandAllSignal((prev) => prev + 1)}
            onCollapseAll={() => setCollapseAllSignal((prev) => prev + 1)}
            totalItems={progressSummary.totalItems}
            completedItems={progressSummary.completedItems}
          />

          {/* Sprints and Days Progression Hierarchy */}
          <div className="space-y-5" key={`sprints-${expandAllSignal}-${collapseAllSignal}`}>
            {filteredSprints.map((sprint, idx) => (
              <SprintAccordion
                key={sprint.id}
                sprint={sprint}
                isDefaultExpanded={
                  collapseAllSignal > expandAllSignal
                    ? false
                    : expandAllSignal > 0
                    ? true
                    : idx === 0 || sprint.status === 'IN_PROGRESS'
                }
                onToggleComplete={toggleItemCompleted}
              />
            ))}

            {filteredSprints.length === 0 && (
              <div className="py-12 text-center rounded-lg border border-dashed border-border bg-surface/30">
                <Compass className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-sm font-medium text-text-secondary">
                  No sprints match the selected filter.
                </p>
                <button
                  onClick={() => setFilter('all')}
                  className="mt-2 text-xs font-mono text-primary hover:underline"
                >
                  Show all sprints
                </button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};
