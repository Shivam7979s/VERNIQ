import type React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { CommandPalette } from '../actions/CommandPalette';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from './AppLayout';

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // If authenticated, automatically render inside the unified AppLayout sidebar shell!
  // This retires the legacy detached top navbar for authenticated sessions.
  if (user) {
    return <AppLayout>{children}</AppLayout>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <Header />
      <main id="main-content" className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />
      <CommandPalette />
    </div>
  );
};

export default PublicLayout;
