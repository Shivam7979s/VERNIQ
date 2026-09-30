import type React from 'react';
import { Container } from '@/components/ui/layout/Container';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/data/Card';
import { FileText, CheckCircle2, ArrowUpRight } from 'lucide-react';

interface DocSpec {
  id: string;
  title: string;
  path: string;
  category: 'System & Architecture' | 'Design & UX' | 'Data & Engineering';
  summary: string;
}

export const ArchitectureView: React.FC = () => {
  const specs: DocSpec[] = [
    {
      id: '0.1',
      title: 'Product & System Architecture',
      path: 'docs/architecture/system-architecture.md',
      category: 'System & Architecture',
      summary: 'Decoupled presentation, Supabase data plane, FastAPI AI service, and isolated Docker judge topology.',
    },
    {
      id: '0.2',
      title: 'Information Architecture',
      path: 'docs/architecture/information-architecture.md',
      category: 'System & Architecture',
      summary: 'Complete route matrix covering Public, Authenticated student workspace, and Admin operations.',
    },
    {
      id: '0.3',
      title: 'Design Philosophy',
      path: 'docs/design/design-philosophy.md',
      category: 'Design & UX',
      summary: '14 non-negotiable principles prohibiting generic "vibe-coded" SaaS templates, glowing cards, and fake metrics.',
    },
    {
      id: '0.4',
      title: 'Design Tokens',
      path: 'docs/design/design-tokens.md',
      category: 'Design & UX',
      summary: 'Centralized CSS variables for surfaces, text, borders, difficulty, elevation, and 4px spacing scale.',
    },
    {
      id: '0.5',
      title: 'Typography System',
      path: 'docs/design/typography.md',
      category: 'Design & UX',
      summary: 'Strict two-font system (Inter for interface, JetBrains Mono for code and tabular numbers).',
    },
    {
      id: '0.6',
      title: 'Color System & Palette',
      path: 'docs/design/color-system.md',
      category: 'Design & UX',
      summary: 'High-contrast Alpine Porcelain and Obsidian Slate palette meeting WCAG 2.2 AA standards.',
    },
    {
      id: '0.7',
      title: 'Component System Architecture',
      path: 'docs/design/component-system.md',
      category: 'Design & UX',
      summary: 'Atomic layout, navigation, action, form, feedback, data, and pedagogical primitives.',
    },
    {
      id: '0.8',
      title: 'Accessibility Architecture',
      path: 'docs/design/accessibility.md',
      category: 'Design & UX',
      summary: 'WCAG 2.2 AA rules, focus visibility, keyboard navigation, Monaco editor a11y, and reduced motion.',
    },
    {
      id: '0.9',
      title: 'Responsive Design Architecture',
      path: 'docs/design/responsive-design.md',
      category: 'Design & UX',
      summary: 'Mobile-first breakpoint matrix and per-module responsiveness (problem workspace, tables, DAGs).',
    },
    {
      id: '0.10',
      title: 'UX Interaction Patterns',
      path: 'docs/design/ux-patterns.md',
      category: 'Design & UX',
      summary: 'Standardized states (loading, empty, error, confirmation, unsaved changes) and spaced-repetition loops.',
    },
    {
      id: '0.11',
      title: 'Repository Architecture',
      path: 'docs/architecture/repository-structure.md',
      category: 'System & Architecture',
      summary: 'Monorepo organization (apps/web, services/ai, services/judge, supabase, docs) and module boundaries.',
    },
    {
      id: '0.12',
      title: 'Supabase Architecture & Security',
      path: 'docs/architecture/supabase-architecture.md',
      category: 'Data & Engineering',
      summary: 'Auth, PostgreSQL, Storage, Realtime, Edge Functions, pgvector, and default-deny RLS model.',
    },
    {
      id: '0.13',
      title: 'Database Conventions & Schema Standards',
      path: 'docs/database/database-conventions.md',
      category: 'Data & Engineering',
      summary: 'snake_case, UUIDs, explicit foreign keys, handle_updated_at triggers, and JSONB governance.',
    },
    {
      id: '0.14',
      title: 'Coding Conventions & Standards',
      path: 'docs/development/coding-conventions.md',
      category: 'Data & Engineering',
      summary: 'Strict TypeScript, focused React components, semantic Tailwind, Deno Edge Functions, and Git rules.',
    },
  ];

  return (
    <div className="py-8 space-y-8 text-left">
      <Container size="xl">
        <PageHeader
          badge="Documentation Suite"
          title="Architecture & Engineering Specifications"
          subtitle="Phase 0 establishes comprehensive technical contracts before implementing production features. All documents are committed in version control under docs/."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {specs.map((doc) => (
            <Card key={doc.id} className="hover:border-border-strong transition-colors flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-primary">
                    SECTION {doc.id}
                  </span>
                  <div className="flex items-center gap-1.5 text-success text-xs font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approved Baseline</span>
                  </div>
                </div>
                <CardTitle className="text-[15px] mt-1 flex items-center justify-between">
                  <span>{doc.title}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {doc.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="pt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-text-muted">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {doc.path}
                  </span>
                  <span className="text-primary font-sans flex items-center gap-0.5">
                    Spec Document <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </div>
  );
};
