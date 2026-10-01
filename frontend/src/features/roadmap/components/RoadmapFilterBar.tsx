import { ChevronDown, ChevronUp } from 'lucide-react';

interface RoadmapFilterBarProps {
  filter: 'all' | 'active' | 'completed';
  onFilterChange: (filter: 'all' | 'active' | 'completed') => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  totalItems: number;
  completedItems: number;
}

export const RoadmapFilterBar: React.FC<RoadmapFilterBarProps> = ({
  filter,
  onFilterChange,
  onExpandAll,
  onCollapseAll,
  totalItems,
  completedItems,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
      {/* Left: Filter Buttons */}
      <div className="flex items-center gap-1.5 p-1 rounded-lg bg-surface border border-border">
        <button
          onClick={() => onFilterChange('all')}
          className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
            filter === 'all'
              ? 'bg-surface-elevated text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          All Sprints
        </button>
        <button
          onClick={() => onFilterChange('active')}
          className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
            filter === 'active'
              ? 'bg-surface-elevated text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Active Sprint
        </button>
        <button
          onClick={() => onFilterChange('completed')}
          className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-surface-elevated text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Right: Expand / Collapse and Metrics */}
      <div className="flex items-center gap-3 self-end sm:self-auto">
        <div className="text-xs font-mono text-text-muted hidden md:block">
          <span className="text-text-secondary font-medium">{completedItems}</span> / {totalItems} items completed
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExpandAll}
            className="text-xs font-mono text-text-secondary hover:text-text-primary px-2.5 py-1 rounded hover:bg-surface-elevated transition-colors flex items-center gap-1"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span>Expand All</span>
          </button>
          <span className="text-border">|</span>
          <button
            onClick={onCollapseAll}
            className="text-xs font-mono text-text-secondary hover:text-text-primary px-2.5 py-1 rounded hover:bg-surface-elevated transition-colors flex items-center gap-1"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Collapse All</span>
          </button>
        </div>
      </div>
    </div>
  );
};
