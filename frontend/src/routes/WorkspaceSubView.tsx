import React from 'react';
import { DashboardLayout } from '@/components/ui/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/data/Card';
import { Badge } from '@/components/ui/data/Badge';
import { EmptyState } from '@/components/ui/feedback/EmptyState';
import { Alert } from '@/components/ui/feedback/Alert';

interface WorkspaceSubViewProps {
  title: string;
  moduleName: string;
  phaseTarget: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
}

export const WorkspaceSubView: React.FC<WorkspaceSubViewProps> = ({
  title,
  moduleName,
  phaseTarget,
  description,
  emptyTitle,
  emptyDescription,
}) => {
  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Student Workspace', href: '/app/dashboard' },
        { label: title },
      ]}
    >
      <div className="space-y-6 max-w-5xl mx-auto text-left">
        <Alert variant="info" title={`${moduleName} Module Baseline`}>
          {description} In compliance with Phase 0 architectural standards, real production states will bind to PostgreSQL schema in {phaseTarget}.
        </Alert>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{title}</CardTitle>
              <Badge variant="neutral">{phaseTarget} Feature</Badge>
            </div>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              title={emptyTitle}
              description={emptyDescription}
              actionLabel="Return to Platform Overview"
              onAction={() => {
                window.location.href = '/';
              }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
