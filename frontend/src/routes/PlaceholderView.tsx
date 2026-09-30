import type React from 'react';
import { Container } from '@/components/ui/layout/Container';
import { EmptyState } from '@/components/ui/feedback/EmptyState';
import { Badge } from '@/components/ui/data/Badge';
import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';

export interface PlaceholderViewProps {
  title: string;
  phase: string;
  description: string;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({
  title,
  phase,
  description,
}) => {
  const navigate = useNavigate();

  return (
    <div className="py-16 text-center">
      <Container size="md">
        <div className="mb-4">
          <Badge variant="primary">{phase}</Badge>
        </div>
        <h1 className="text-2xl font-bold font-mono text-text-primary mb-2">
          {title}
        </h1>
        <p className="text-sm text-text-secondary max-w-md mx-auto mb-8">
          {description}
        </p>

        <EmptyState
          icon={<Compass className="w-5 h-5 text-primary" />}
          title="Feature Scheduled for Upcoming Phase"
          description="In strict adherence to Phase 0 rules, future feature logic and fake mock screens are withheld until the foundational baseline is reviewed and approved."
          actionLabel="Return to Foundation Explorer"
          onAction={() => navigate('/')}
        />
      </Container>
    </div>
  );
};
