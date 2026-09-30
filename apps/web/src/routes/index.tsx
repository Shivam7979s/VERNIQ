import type React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PublicLayout } from '@/components/ui/layout/PublicLayout';
import { FoundationView } from './FoundationView';
import { ArchitectureView } from './ArchitectureView';
import { DashboardStubView } from './DashboardStubView';
import { PlaceholderView } from './PlaceholderView';
import { NotFoundView } from './NotFoundView';
import { DashboardLayout } from '@/components/ui/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/data/Card';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/actions/Button';
import { Sun, Moon, Database } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

const SettingsView: React.FC = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  const configured = isSupabaseConfigured();

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Student Workspace', href: '/app/dashboard' },
        { label: 'Platform Settings' },
      ]}
    >
      <div className="space-y-6 max-w-3xl mx-auto text-left">
        <div>
          <h2 className="text-xl font-bold font-mono text-text-primary">Platform Settings</h2>
          <p className="text-xs text-text-secondary mt-1">
            Configure appearance, themes, and check backend environment connectivity.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appearance & Theme</CardTitle>
            <CardDescription>
              Toggle between Alpine Porcelain (Light) and Obsidian Slate (Dark) palettes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-[13px] font-semibold text-text-primary">Color Theme</h5>
                <p className="text-[12px] text-text-muted">
                  Current: <span className="font-mono font-medium text-primary capitalize">{theme}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={theme === 'light' ? 'primary' : 'secondary'}
                  size="sm"
                  leftIcon={<Sun className="w-3.5 h-3.5" />}
                  onClick={() => setTheme('light')}
                >
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'primary' : 'secondary'}
                  size="sm"
                  leftIcon={<Moon className="w-3.5 h-3.5" />}
                  onClick={() => setTheme('dark')}
                >
                  Dark
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                >
                  Toggle
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supabase Backend Connectivity</CardTitle>
            <CardDescription>
              Verification of environment variables and public API connectivity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded border border-border bg-surface-subtle">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono">VITE_SUPABASE_URL</span>
              </div>
              <span className="text-xs font-mono text-text-muted">
                {import.meta.env.VITE_SUPABASE_URL || 'Not Set'}
              </span>
            </div>
            <div className="p-3 rounded border border-border bg-surface-subtle flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">Connection Status</span>
              <span className={`text-xs font-mono font-bold ${configured ? 'text-success' : 'text-warning'}`}>
                {configured ? 'CONFIGURED' : 'UNCONFIGURED (Baseline Mock)'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route
        path="/"
        element={
          <PublicLayout>
            <FoundationView />
          </PublicLayout>
        }
      />
      <Route
        path="/architecture"
        element={
          <PublicLayout>
            <ArchitectureView />
          </PublicLayout>
        }
      />
      <Route
        path="/roadmaps"
        element={
          <PublicLayout>
            <PlaceholderView
              title="Curriculum Roadmaps"
              phase="Phase 2 Milestone"
              description="Interactive Directed Acyclic Graphs (DAGs) covering Backend, Distributed Systems, DSA, and Full-Stack Engineering."
            />
          </PublicLayout>
        }
      />
      <Route
        path="/problems"
        element={
          <PublicLayout>
            <PlaceholderView
              title="Algorithmic Problem Practice"
              phase="Phase 3 Milestone"
              description="Algorithmic challenges evaluated against an isolated online code judge with hidden test suites."
            />
          </PublicLayout>
        }
      />
      <Route
        path="/courses"
        element={
          <PublicLayout>
            <PlaceholderView
              title="Masterclasses & Courses"
              phase="Phase 4 Milestone"
              description="Deep dive video and interactive coding masterclasses for production engineering."
            />
          </PublicLayout>
        }
      />

      {/* Authenticated Zone */}
      <Route path="/app/dashboard" element={<DashboardStubView />} />
      <Route path="/app/settings" element={<SettingsView />} />
      <Route
        path="/app/learn"
        element={
          <DashboardLayout breadcrumbs={[{ label: 'App', href: '/app/dashboard' }, { label: 'Learn' }]}>
            <PlaceholderView
              title="Active Learning Roadmaps"
              phase="Phase 2 Milestone"
              description="Enrolled curriculum tracks and DAG progression."
            />
          </DashboardLayout>
        }
      />
      <Route
        path="/app/practice"
        element={
          <DashboardLayout breadcrumbs={[{ label: 'App', href: '/app/dashboard' }, { label: 'Practice' }]}>
            <PlaceholderView
              title="Student Problem Solving Workspace"
              phase="Phase 3 Milestone"
              description="Monaco editor integration, code execution, and test cases."
            />
          </DashboardLayout>
        }
      />
      <Route
        path="/app/revision"
        element={
          <DashboardLayout breadcrumbs={[{ label: 'App', href: '/app/dashboard' }, { label: 'Revision' }]}>
            <PlaceholderView
              title="Active Spaced Repetition"
              phase="Phase 3 Milestone"
              description="Reviewing solved algorithmic questions at calculated memory decay intervals."
            />
          </DashboardLayout>
        }
      />
      <Route
        path="/app/plan"
        element={
          <DashboardLayout breadcrumbs={[{ label: 'App', href: '/app/dashboard' }, { label: 'Study Plan' }]}>
            <PlaceholderView
              title="Dynamic Learning Plan"
              phase="Phase 2 Milestone"
              description="Target milestone scheduling and capacity balancing."
            />
          </DashboardLayout>
        }
      />
      <Route
        path="/app/contests"
        element={
          <DashboardLayout breadcrumbs={[{ label: 'App', href: '/app/dashboard' }, { label: 'Contests' }]}>
            <PlaceholderView
              title="Engineering Contests"
              phase="Phase 5 Milestone"
              description="Timed algorithmic challenges with global rating recalculation."
            />
          </DashboardLayout>
        }
      />
      <Route
        path="/app/projects"
        element={
          <DashboardLayout breadcrumbs={[{ label: 'App', href: '/app/dashboard' }, { label: 'Projects' }]}>
            <PlaceholderView
              title="Real-World Portfolio Projects"
              phase="Phase 6 Milestone"
              description="Production engineering labs: HTTP/2 servers, Raft consensus, and distributed databases."
            />
          </DashboardLayout>
        }
      />
      <Route
        path="/app/ai-mentor"
        element={
          <DashboardLayout breadcrumbs={[{ label: 'App', href: '/app/dashboard' }, { label: 'AI Mentor' }]}>
            <PlaceholderView
              title="Socratic AI Mentor"
              phase="Phase 4 Milestone"
              description="Context-aware mentorship via FastAPI microservice and RAG vector store."
            />
          </DashboardLayout>
        }
      />

      {/* 404 Fallback */}
      <Route
        path="*"
        element={
          <PublicLayout>
            <NotFoundView />
          </PublicLayout>
        }
      />
    </Routes>
  );
};
