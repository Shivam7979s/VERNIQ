import type React from 'react';
import { DashboardLayout } from '@/components/ui/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/data/Card';
import { Stat } from '@/components/ui/data/Stat';
import { Badge } from '@/components/ui/data/Badge';
import { EmptyState } from '@/components/ui/feedback/EmptyState';
import { Alert } from '@/components/ui/feedback/Alert';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

export const DashboardStubView: React.FC = () => {
  const isConfigured = isSupabaseConfigured();

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Student Workspace', href: '/app/dashboard' },
        { label: 'Platform Mission Control' },
      ]}
    >
      <div className="space-y-6 max-w-5xl mx-auto text-left">
        {/* Workspace Phase Notice */}
        <Alert variant="info" title="Phase 0 Engineering Baseline Active">
          This dashboard layout demonstrates the authenticated student workspace shell, persistent sidebar, breadcrumbs, and state handling. In accordance with Phase 0 rules, no fabricated user records or simulated progress metrics are displayed.
        </Alert>

        {/* Real Environment Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Stat
            label="Backend State"
            value={isConfigured ? 'Connected' : 'Local Mock'}
            subtitle={
              isConfigured
                ? 'Connected to live Supabase project'
                : 'Using local baseline schema templates'
            }
            icon={
              isConfigured ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-warning" />
              )
            }
          />
          <Stat
            label="Design Tokens"
            value="Active"
            subtitle="Centralized CSS variables & Tailwind semantic mapping"
          />
          <Stat
            label="Planned Phase 1"
            value="Identity & DB"
            subtitle="User profiles, roles, and schema migrations"
          />
        </div>

        {/* Workspace Shell Demonstration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Study Plan</CardTitle>
                <Badge variant="neutral">Phase 1 Pending</Badge>
              </div>
              <CardDescription>
                Personalized study scheduler and curriculum progress.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                title="No Study Plan Activated Yet"
                description="Study plans and algorithmic roadmaps will be activated in Phase 1 and Phase 2 after the user identity schema and curriculum tables are migrated."
                actionLabel="View System Architecture"
                onAction={() => {
                  window.location.href = '/architecture';
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Spaced Repetition</CardTitle>
                <Badge variant="neutral">0 Due</Badge>
              </div>
              <CardDescription>
                Forgetting-curve revision engine.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                title="Revision Queue Empty"
                description="When you solve problems in Phase 3, questions automatically enter your 1-3-7-21 day spaced revision queue."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};
