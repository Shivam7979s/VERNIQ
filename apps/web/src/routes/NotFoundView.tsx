import React from 'react';
import { Container } from '@/components/ui/layout/Container';
import { EmptyState } from '@/components/ui/feedback/EmptyState';
import { useNavigate } from 'react-router-dom';

export const NotFoundView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="py-20 flex-1 flex items-center justify-center">
      <Container size="md">
        <EmptyState
          title="404 — Route Not Found"
          description="The requested route does not exist in the VERNIQ route matrix."
          actionLabel="Return to Foundation Overview"
          onAction={() => navigate('/')}
        />
      </Container>
    </div>
  );
};
