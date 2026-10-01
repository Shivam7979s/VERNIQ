import React, { useState, createContext, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { CommandPalette } from '../actions/CommandPalette';
import { Breadcrumbs, type BreadcrumbItem } from '../navigation/Breadcrumbs';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, Bell } from 'lucide-react';
import { IconButton } from '../actions/IconButton';

export interface AppLayoutContextType {
  insideAppLayout: boolean;
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AppLayoutContext = createContext<AppLayoutContextType>({
  insideAppLayout: false,
  collapsed: false,
  setCollapsed: () => {},
});

export const useAppLayout = () => useContext(AppLayoutContext);

export interface AppLayoutProps {
  breadcrumbs?: BreadcrumbItem[];
  children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  breadcrumbs,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <AppLayoutContext.Provider value={{ insideAppLayout: true, collapsed, setCollapsed }}>
      <div className="min-h-screen flex bg-[#08090C] text-text-primary">
        {/* Left Utility Rail */}
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((p) => !p)} />

        {/* Center / Content Stage */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#08090C]">
          {/* Top Bar (Optional if breadcrumbs provided) */}
          {breadcrumbs && breadcrumbs.length > 0 && (
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
          )}

          {/* Content Viewport */}
          <main id="main-content" className="flex-1 overflow-y-auto">
            {children ? children : <Outlet />}
          </main>
        </div>

        <CommandPalette />
      </div>
    </AppLayoutContext.Provider>
  );
};

export default AppLayout;
