import React from 'react';
import { cn } from '@/lib/utils';
import {
  Layers,
  GitCommit,
  Search,
  Cpu,
  FolderTree,
  Network,
  ListOrdered,
  Maximize2,
} from 'lucide-react';

export interface TopicStat {
  id: string;
  name: string;
  solved: number;
  total: number;
  icon: React.ReactNode;
  color: string;
}

export interface TopicMasteryBarsProps {
  className?: string;
  customStats?: TopicStat[];
}

const DEFAULT_TOPIC_STATS: TopicStat[] = [
  {
    id: 'arrays',
    name: 'Arrays',
    solved: 24,
    total: 28,
    icon: <Layers className="w-4 h-4" />,
    color: '#00B8A3',
  },
  {
    id: 'two-pointers',
    name: 'Two Pointers',
    solved: 14,
    total: 18,
    icon: <GitCommit className="w-4 h-4" />,
    color: '#3B82F6',
  },
  {
    id: 'binary-search',
    name: 'Binary Search',
    solved: 12,
    total: 16,
    icon: <Search className="w-4 h-4" />,
    color: '#8B5CF6',
  },
  {
    id: 'sliding-window',
    name: 'Sliding Window',
    solved: 9,
    total: 12,
    icon: <Maximize2 className="w-4 h-4" />,
    color: '#06B6D4',
  },
  {
    id: 'stack-queue',
    name: 'Stack & Queue',
    solved: 12,
    total: 15,
    icon: <ListOrdered className="w-4 h-4" />,
    color: '#F59E0B',
  },
  {
    id: 'trees',
    name: 'Trees & BST',
    solved: 10,
    total: 20,
    icon: <FolderTree className="w-4 h-4" />,
    color: '#10B981',
  },
  {
    id: 'graphs',
    name: 'Graphs & BFS/DFS',
    solved: 6,
    total: 18,
    icon: <Network className="w-4 h-4" />,
    color: '#EC4899',
  },
  {
    id: 'dp',
    name: 'Dynamic Programming',
    solved: 8,
    total: 22,
    icon: <Cpu className="w-4 h-4" />,
    color: '#FF375F',
  },
];

export const TopicMasteryBars: React.FC<TopicMasteryBarsProps> = ({
  className,
  customStats = DEFAULT_TOPIC_STATS,
}) => {
  return (
    <div
      className={cn(
        'p-5 rounded-lg border border-white/[0.08] bg-surface space-y-4 shadow-elevation-1',
        className
      )}
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div>
          <h4 className="text-base font-semibold font-sans text-white tracking-[-0.015em]">
            Topic-Wise Algorithmic Mastery
          </h4>
          <p className="text-xs text-text-muted mt-0.5">
            TakeUForward structured sheet progression and category coverage
          </p>
        </div>
        <span className="text-xs font-mono text-text-secondary bg-[#181C28] px-2.5 py-1 rounded border border-white/[0.08]">
          {customStats.reduce((acc, t) => acc + t.solved, 0)} /{' '}
          {customStats.reduce((acc, t) => acc + t.total, 0)} Solved Overall
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5">
        {customStats.map((topic) => {
          const percent = topic.total > 0 ? Math.round((topic.solved / topic.total) * 100) : 0;

          return (
            <div key={topic.id} className="space-y-1.5 group">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-text-primary">
                  <span className="text-text-muted group-hover:text-primary transition-colors">
                    {topic.icon}
                  </span>
                  <span className="font-medium text-[13px]">{topic.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary tabular-nums">
                    <strong className="text-text-primary">{topic.solved}</strong> / {topic.total}
                  </span>
                  <span
                    className="text-[11px] font-bold px-1.5 py-0.2 rounded"
                    style={{ color: topic.color, backgroundColor: `${topic.color}1A` }}
                  >
                    {percent}%
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full bg-[#1C212E] h-2 rounded-full overflow-hidden border border-white/[0.04]">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: topic.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
