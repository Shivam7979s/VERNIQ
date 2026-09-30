import type React from 'react';
import { Terminal, Shield, GitBranch, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-surface text-text-secondary mt-auto">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
          {/* Brand Col */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 font-mono font-bold text-text-primary text-base mb-3">
              <div className="w-6 h-6 rounded bg-primary text-text-inverse flex items-center justify-center text-xs">
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <span>VERNIQ</span>
            </div>
            <p className="text-[12px] text-text-muted leading-relaxed mb-4">
              Production-grade engineering learning and career acceleration platform. Built on first principles of systems architecture, isolated execution, and rigorous algorithmic mastery.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
              <span className="w-2 h-2 rounded-full bg-success inline-block"></span>
              <span>Architecture v0.1.0 • Phase 0 Baseline</span>
            </div>
          </div>

          {/* Pillars Col */}
          <div>
            <h6 className="text-[12px] font-semibold uppercase tracking-wider text-text-primary mb-3">
              System Pillars
            </h6>
            <ul className="space-y-2 text-[12px]">
              <li className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span>Isolated Docker Judge</span>
              </li>
              <li className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                <span>Socratic AI Mentorship</span>
              </li>
              <li className="flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-primary" />
                <span>Directed Curriculum DAGs</span>
              </li>
            </ul>
          </div>

          {/* Standards Col */}
          <div>
            <h6 className="text-[12px] font-semibold uppercase tracking-wider text-text-primary mb-3">
              Engineering Specs
            </h6>
            <ul className="space-y-2 text-[12px] text-text-secondary">
              <li>WCAG 2.2 AA Accessibility</li>
              <li>PostgreSQL 16 Normalized Schema</li>
              <li>Row Level Security (RLS)</li>
              <li>Dual Theme (Porcelain & Obsidian)</li>
            </ul>
          </div>

          {/* Monorepo Col */}
          <div>
            <h6 className="text-[12px] font-semibold uppercase tracking-wider text-text-primary mb-3">
              Monorepo Architecture
            </h6>
            <div className="bg-surface-sunken p-3 rounded border border-border font-mono text-[11px] text-text-muted space-y-1">
              <div>apps/web (React 18 + TS)</div>
              <div>services/ai (FastAPI + RAG)</div>
              <div>services/judge (Sandboxed)</div>
              <div>supabase/ (Migrations + RLS)</div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-[12px] text-text-muted gap-2">
          <span>&copy; {new Date().getFullYear()} VERNIQ Platform. Engineering Education Foundation.</span>
          <span>Zero Vibe Coding • Systematic Design Tokens</span>
        </div>
      </div>
    </footer>
  );
};
