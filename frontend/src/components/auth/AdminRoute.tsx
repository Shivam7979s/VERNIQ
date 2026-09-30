import type React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/feedback/Skeleton';
import { Container } from '@/components/ui/layout/Container';
import { ErrorState } from '@/components/ui/feedback/ErrorState';

export interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { session, user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!session || !user) {
    return (
      <Navigate
        to="/login"
        state={{ returnTo: location.pathname + location.search }}
        replace
      />
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Container size="md">
          <ErrorState
            title="403 — Unauthorized Administrative Access"
            message={`Your authenticated role is '${profile?.role || 'student'}'. Administrative clearance is required to view this operational zone.`}
            errorCode="CLEARANCE_REQUIRED"
            onRetry={() => {
              window.location.href = '/app/dashboard';
            }}
          />
        </Container>
      </div>
    );
  }

  return <>{children}</>;
};
