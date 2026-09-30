import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/ui/layout/AppShell';
import { PublicLayout } from '@/components/ui/layout/PublicLayout';
import { FoundationView } from '@/routes/FoundationView';
import { ArchitectureView } from '@/routes/ArchitectureView';
import { RoadmapsView } from '@/routes/RoadmapsView';
import { ProblemsView } from '@/routes/ProblemsView';
import { CoursesView } from '@/routes/CoursesView';
import { LoginView } from '@/routes/LoginView';
import { RegisterView } from '@/routes/RegisterView';
import { ForgotPasswordView } from '@/routes/ForgotPasswordView';
import { DashboardStubView } from '@/routes/DashboardStubView';
import { WorkspaceSubView } from '@/routes/WorkspaceSubView';
import { NotFoundView } from '@/routes/NotFoundView';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          {/* Public Routes with Global PublicLayout */}
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
                <RoadmapsView />
              </PublicLayout>
            }
          />
          <Route
            path="/roadmaps/:slug"
            element={
              <PublicLayout>
                <RoadmapsView />
              </PublicLayout>
            }
          />
          <Route
            path="/problems"
            element={
              <PublicLayout>
                <ProblemsView />
              </PublicLayout>
            }
          />
          <Route
            path="/courses"
            element={
              <PublicLayout>
                <CoursesView />
              </PublicLayout>
            }
          />

          {/* Authentication Routes */}
          <Route
            path="/login"
            element={
              <PublicLayout>
                <LoginView />
              </PublicLayout>
            }
          />
          <Route
            path="/register"
            element={
              <PublicLayout>
                <RegisterView />
              </PublicLayout>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicLayout>
                <ForgotPasswordView />
              </PublicLayout>
            }
          />

          {/* Direct Protected Shortcuts with returnTo support */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Navigate to="/app/dashboard" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plan"
            element={
              <ProtectedRoute>
                <Navigate to="/app/plan" replace />
              </ProtectedRoute>
            }
          />

          {/* Authenticated Student Workspace Routes */}
          <Route
            path="/app/dashboard"
            element={
              <ProtectedRoute>
                <DashboardStubView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/learn"
            element={
              <ProtectedRoute>
                <WorkspaceSubView
                  title="Learn & Roadmaps"
                  moduleName="Curriculum"
                  phaseTarget="Phase 2"
                  description="Personalized learning path and interactive syllabus graph."
                  emptyTitle="Curriculum Sync In Progress"
                  emptyDescription="Curriculum graph will load active modules when Phase 2 schema is deployed."
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/practice"
            element={
              <ProtectedRoute>
                <WorkspaceSubView
                  title="Practice Environment"
                  moduleName="Judge Sandbox"
                  phaseTarget="Phase 3"
                  description="Isolated WebWorker Monaco editor with remote container judge execution."
                  emptyTitle="Code Judge Standby"
                  emptyDescription="Isolated execution sandbox container will be linked during Phase 3."
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/revision"
            element={
              <ProtectedRoute>
                <WorkspaceSubView
                  title="Spaced Repetition"
                  moduleName="Spaced Repetition"
                  phaseTarget="Phase 3"
                  description="Ebbinghaus forgetting curve scheduling for algorithmic patterns."
                  emptyTitle="Revision Queue Empty"
                  emptyDescription="Solve questions in practice mode to schedule 1-3-7-21 day automated reviews."
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/plan"
            element={
              <ProtectedRoute>
                <WorkspaceSubView
                  title="Study Plan"
                  moduleName="Scheduler"
                  phaseTarget="Phase 1"
                  description="Automated time budgeting and technical interview deadlines."
                  emptyTitle="No Active Plan"
                  emptyDescription="Configure target company and interview timeline during Phase 1 onboarding."
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/contests"
            element={
              <ProtectedRoute>
                <WorkspaceSubView
                  title="Engineering Contests"
                  moduleName="Real-Time Contests"
                  phaseTarget="Phase 4"
                  description="Live competitive programming rounds with anti-cheat telemetry."
                  emptyTitle="No Live Contests"
                  emptyDescription="Next scheduled algorithmic round will be announced in Phase 4."
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/projects"
            element={
              <ProtectedRoute>
                <WorkspaceSubView
                  title="Production Systems Projects"
                  moduleName="Systems Labs"
                  phaseTarget="Phase 4"
                  description="End-to-end fullstack and distributed systems capstone portfolio projects."
                  emptyTitle="Capstone Projects Locked"
                  emptyDescription="Project specifications and verification suites will unlock in Phase 4."
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/ai-mentor"
            element={
              <ProtectedRoute>
                <WorkspaceSubView
                  title="Socratic AI Mentor"
                  moduleName="AI Service"
                  phaseTarget="Phase 5"
                  description="FastAPI + pgvector RAG mentor delivering targeted conceptual hints without giving code away."
                  emptyTitle="AI Service Standby"
                  emptyDescription="FastAPI microservice endpoints will be connected during Phase 5."
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/settings"
            element={
              <ProtectedRoute>
                <WorkspaceSubView
                  title="Account & Preferences"
                  moduleName="Profile Settings"
                  phaseTarget="Phase 1"
                  description="Manage authentication, GitHub link, notification channels, and UI tokens."
                  emptyTitle="Preferences Baseline Active"
                  emptyDescription="Account persistence and Supabase Auth session settings will be active in Phase 1."
                />
              </ProtectedRoute>
            }
          />

          {/* Admin Clearance Route */}
          <Route
            path="/app/admin"
            element={
              <AdminRoute>
                <WorkspaceSubView
                  title="Operational Administration"
                  moduleName="Admin Control Plane"
                  phaseTarget="Phase 1"
                  description="Administrative telemetry, role elevation, and system health monitoring."
                  emptyTitle="Platform Telemetry Nominal"
                  emptyDescription="No critical administrative alerts active."
                />
              </AdminRoute>
            }
          />

          {/* Catch-all 404 */}
          <Route
            path="*"
            element={
              <PublicLayout>
                <NotFoundView />
              </PublicLayout>
            }
          />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
};
