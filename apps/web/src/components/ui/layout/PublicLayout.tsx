import type React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { CommandPalette } from '../actions/CommandPalette';

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
