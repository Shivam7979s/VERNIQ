import type React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pill';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className,
}) => {
  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center gap-1 overflow-x-auto no-scrollbar',
        variant === 'underline' && 'border-b border-border',
        variant === 'pill' && 'p-1 bg-surface-subtle rounded border border-border/50',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center gap-2 text-[13px] font-medium transition-colors whitespace-nowrap select-none',
              'focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 disabled:pointer-events-none',
              variant === 'underline' && [
                'py-2.5 px-3 border-b-2 -mb-[1px]',
                isActive
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border',
              ],
              variant === 'pill' && [
                'py-1.5 px-3 rounded',
                isActive
                  ? 'bg-surface text-text-primary shadow-sm font-semibold'
                  : 'text-text-secondary hover:text-text-primary',
              ]
            )}
          >
            {tab.icon && <span className="w-4 h-4 shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[11px] font-mono tabular-nums leading-none',
                  isActive ? 'bg-primary/10 text-primary' : 'bg-surface text-text-muted'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
