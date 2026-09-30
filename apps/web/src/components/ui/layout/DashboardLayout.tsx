import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { CommandPalette } from '../actions/CommandPalette';
import { Breadcrumbs, type BreadcrumbItem } from '../navigation/Breadcrumbs';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, Bell } from 'lucide-react';
import { IconButton } from '../actions/IconButton';

export interface DashboardLayoutProps {
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  breadcrumbs = [{ label: 'App', href: '/app/dashboard' }, { label: 'Workspace' }],
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex bg-background text-text-primary">
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((p) => !p)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-surface px-6 flex items-center justify-between sticky top-0 z-dock">
          <Breadcrumbs items={breadcrumbs} />

          <div className="flex items-center gap-2">
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="View notifications"
              icon={<Bell className="w-4 h-4 text-text-muted" />}
            />
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="Toggle theme"
              icon={theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
              onClick={toggleTheme}
            />
          </div>
        </header>

        {/* Content Viewport */}
        <main id="main-content" className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      <CommandPalette />
    </div>
  );
};
