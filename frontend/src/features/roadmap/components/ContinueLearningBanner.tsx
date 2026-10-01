import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/actions/Button';
import { DifficultyBadge } from '@/components/learning/DifficultyBadge';
import {
  Sparkles,
  ArrowRight,
  Clock,
  BookOpen,
  Code2,
  Video,
  FileText,
  RotateCcw,
  CheckCircle2,
  Check,
} from 'lucide-react';
import type { ContinueLearningTarget } from '../types';

interface ContinueLearningBannerProps {
  target: ContinueLearningTarget | null;
  onMarkComplete?: (itemId: string) => void;
  isAllCompleted?: boolean;
}

export const ContinueLearningBanner: React.FC<ContinueLearningBannerProps> = ({
  target,
  onMarkComplete,
  isAllCompleted = false,
}) => {
  if (isAllCompleted) {
    return (
      <div className="rounded-lg border border-[#00B8A3]/30 bg-[#00B8A3]/[0.05] p-5 shadow-elevation-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00B8A3]/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-[#00B8A3]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              Roadmap Completed!
            </h3>
            <p className="text-sm text-text-secondary mt-0.5">
              You have completed all required learning items in this track. Time to practice mock interviews or explore advanced tracks.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!target) {
    return null;
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'PROBLEM':
        return <Code2 className="w-4 h-4 text-primary" />;
      case 'VIDEO':
      case 'LECTURE':
        return <Video className="w-4 h-4 text-blue-400" />;
      case 'ARTICLE':
        return <FileText className="w-4 h-4 text-purple-400" />;
      case 'REVISION':
        return <RotateCcw className="w-4 h-4 text-[#FFC01E]" />;
      default:
        return <BookOpen className="w-4 h-4 text-emerald-400" />;
    }
  };

  const isProblem = target.itemType === 'PROBLEM' && target.problemSlug;

  return (
    <div className="rounded-lg border border-primary/30 bg-surface-elevated p-5 relative overflow-hidden shadow-elevation-2">
      {/* Subtle indicator bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-[#00B8A3]" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left Side: Context & Next Action */}
        <div className="space-y-2">
          {/* Track Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3 h-3" />
              CONTINUE LEARNING
            </span>
            <span className="text-xs font-mono text-text-muted">
              {target.sprintTitle}
            </span>
            <span className="text-text-muted">·</span>
            <span className="text-xs font-mono font-medium text-text-secondary">
              Day {target.dayNumber}: {target.dayTitle}
            </span>
          </div>

          {/* Next Item Title */}
          <div>
            <div className="text-xs font-mono text-text-muted uppercase tracking-wider">
              Next Up
            </div>
            <div className="flex items-center gap-2.5 mt-0.5">
              <span className="p-1 rounded bg-white/[0.04] border border-white/[0.06]">
                {getItemIcon(target.itemType)}
              </span>
              <h3 className="text-base sm:text-lg font-semibold text-text-primary tracking-[-0.01em]">
                {target.itemTitle}
              </h3>
            </div>
          </div>

          {/* Metadata: Duration & Problem details */}
          <div className="flex items-center gap-3 text-xs text-text-secondary flex-wrap">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-text-muted" />
              ~{target.estimatedMinutes} min
            </span>

            {target.verniqProblemId && (
              <>
                <span className="text-border">|</span>
                <span className="font-mono text-primary font-semibold">
                  {target.verniqProblemId}
                </span>
              </>
            )}

            {target.problemDifficulty && (
              <DifficultyBadge difficulty={target.problemDifficulty} />
            )}
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="shrink-0 flex items-center gap-3">
          {onMarkComplete && (
            <Button
              variant="outline"
              size="md"
              onClick={() => onMarkComplete(target.itemId)}
              className="text-xs font-mono"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Mark Done
            </Button>
          )}

          {isProblem ? (
            <Link to={`/problems/${target.problemSlug}`}>
              <Button variant="primary" size="md" className="font-mono text-xs shadow-md">
                <span>Solve Problem</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => onMarkComplete?.(target.itemId)}
              className="font-mono text-xs shadow-md"
            >
              <span>Continue Learning</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
