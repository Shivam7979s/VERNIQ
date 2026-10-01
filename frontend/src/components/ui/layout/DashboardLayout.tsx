import React, { useContext } from 'react';
import { Breadcrumbs, type BreadcrumbItem } from '../navigation/Breadcrumbs';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, Bell } from 'lucide-react';
import { IconButton } from '../actions/IconButton';
import { AppLayout, AppLayoutContext } from './AppLayout';

export interface DashboardLayoutProps {
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  breadcrumbs = [{ label: 'App', href: '/app/dashboard' }, { label: 'Workspace' }],
  children,
}) => {
  const { insideAppLayout } = useContext(AppLayoutContext);
  const { theme, toggleTheme } = useTheme();

  // If already rendered inside the unified AppLayout shell, avoid duplicate sidebar!
  if (insideAppLayout) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Horizon Bar with Breadcrumbs */}
        <header className="h-14 border-b border-white/[0.08] bg-[#0D0F15] px-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl">
          <Breadcrumbs items={breadcrumbs} />

          <div className="flex items-center gap-2">
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="View notifications"
              icon={<Bell className="w-4 h-4 text-neutral-400" />}
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
    );
  }

  // Standalone fallback: wrap inside AppLayout
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      {children}
    </AppLayout>
  );
};

export default DashboardLayout;
