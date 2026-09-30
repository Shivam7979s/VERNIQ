import React from 'react';
import { Link } from 'react-router-dom';
import { NavItem } from '../navigation/NavItem';
import {
  LayoutDashboard,
  BookOpen,
  Code2,
  CalendarCheck2,
  Repeat,
  Trophy,
  Bot,
  Settings,
  Terminal,
  PanelLeftClose,
  PanelLeftOpen,
  FolderGit2,
} from 'lucide-react';
import { IconButton } from '../actions/IconButton';

export interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
}) => {
  return (
    <aside
      className={`h-screen sticky top-0 border-r border-border bg-surface flex flex-col justify-between transition-all duration-base z-dock ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Top Branding */}
      <div>
        <div className="h-14 px-4 flex items-center justify-between border-b border-border">
          <Link to="/" className="flex items-center gap-2.5 font-mono font-bold text-text-primary">
            <div className="w-7 h-7 rounded bg-primary text-text-inverse flex items-center justify-center text-sm shrink-0">
              <Terminal className="w-4 h-4" />
            </div>
            {!collapsed && <span className="tracking-wider">VERNIQ</span>}
          </Link>
          {onToggleCollapse && !collapsed && (
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="Collapse sidebar"
              icon={<PanelLeftClose className="w-4 h-4 text-text-muted" />}
              onClick={onToggleCollapse}
            />
          )}
        </div>

        {/* Navigation Categories */}
        <div className="p-2 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
          {/* Workspace */}
          <div className="space-y-1">
            {!collapsed && (
              <span className="px-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted block mb-1.5 text-left">
                Workspace
              </span>
            )}
            <NavItem
              to="/app/dashboard"
              icon={<LayoutDashboard />}
              label="Dashboard"
              collapsed={collapsed}
            />
            <NavItem
              to="/app/learn"
              icon={<BookOpen />}
              label="Learn & Roadmaps"
              collapsed={collapsed}
            />
            <NavItem
              to="/app/practice"
              icon={<Code2 />}
              label="Practice"
              collapsed={collapsed}
            />
            <NavItem
              to="/app/revision"
              icon={<Repeat />}
              label="Revision"
              badge={2}
              badgeVariant="warning"
              collapsed={collapsed}
            />
            <NavItem
              to="/app/plan"
              icon={<CalendarCheck2 />}
              label="Study Plan"
              collapsed={collapsed}
            />
          </div>

          {/* Preparation & AI */}
          <div className="space-y-1">
            {!collapsed && (
              <span className="px-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted block mb-1.5 text-left">
                Engineering Labs
              </span>
            )}
            <NavItem
              to="/app/contests"
              icon={<Trophy />}
              label="Contests"
              collapsed={collapsed}
            />
            <NavItem
              to="/app/projects"
              icon={<FolderGit2 />}
              label="Projects"
              collapsed={collapsed}
            />
            <NavItem
              to="/app/ai-mentor"
              icon={<Bot />}
              label="AI Mentor"
              collapsed={collapsed}
            />
          </div>
        </div>
      </div>

      {/* Bottom Profile / Settings */}
      <div className="p-2 border-t border-border">
        {onToggleCollapse && collapsed && (
          <div className="flex justify-center mb-2">
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="Expand sidebar"
              icon={<PanelLeftOpen className="w-4 h-4 text-text-muted" />}
              onClick={onToggleCollapse}
            />
          </div>
        )}
        <NavItem
          to="/app/settings"
          icon={<Settings />}
          label="Settings"
          collapsed={collapsed}
        />
        <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-3 px-3 py-1.5">
          <div className="w-7 h-7 rounded-full bg-primary/20 text-primary font-mono text-xs flex items-center justify-center font-bold shrink-0">
            VN
          </div>
          {!collapsed && (
            <div className="min-w-0 text-left">
              <p className="text-[12px] font-semibold text-text-primary truncate">Engineer Account</p>
              <p className="text-[10px] text-text-muted font-mono truncate">Role: Student</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
