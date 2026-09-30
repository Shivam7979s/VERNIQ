import React, { useState } from 'react';
import { Container } from '@/components/ui/layout/Container';
import { Badge } from '@/components/ui/data/Badge';
import { Button } from '@/components/ui/actions/Button';
import { TopicCard } from '@/components/learning/TopicCard';
import { RoadmapNode } from '@/components/learning/RoadmapNode';
import { Tabs } from '@/components/ui/navigation/Tabs';
import { GitBranch, Compass, Terminal, Network, Database, Brain } from 'lucide-react';

export const RoadmapsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');

  const roadmapTracks = [
    {
      id: 'dsa',
      category: 'cs-core',
      title: 'Data Structures & Algorithms',
      description: 'Master time/space complexity, arrays, trees, dynamic programming, and graph algorithms with rigorous proofs and invariant analysis.',
      totalProblems: 180,
      completedProblems: 24,
      slug: 'data-structures-and-algorithms',
      icon: <Terminal className="w-4 h-4" />,
    },
    {
      id: 'system-design',
      category: 'distributed',
      title: 'Systems & Architecture',
      description: 'Design highly available, fault-tolerant distributed backends, caching strategies, partitioning, consensus, and event streaming.',
      totalProblems: 45,
      completedProblems: 8,
      slug: 'systems-and-architecture',
      icon: <Network className="w-4 h-4" />,
    },
    {
      id: 'databases',
      category: 'cs-core',
      title: 'Database Internals & SQL',
      description: 'B-Trees, LSM trees, ACID transactions, WAL, query execution plans, indexing strategies, and PostgreSQL optimization.',
      totalProblems: 60,
      completedProblems: 12,
      slug: 'database-internals',
      icon: <Database className="w-4 h-4" />,
    },
    {
      id: 'ai-engineering',
      category: 'ai',
      title: 'AI Engineering & LLM Systems',
      description: 'Vector databases, RAG architecture, semantic caching, fine-tuning pipelines, token economics, and model evaluation.',
      totalProblems: 35,
      completedProblems: 5,
      slug: 'ai-engineering',
      icon: <Brain className="w-4 h-4" />,
    },
  ];

  const filterTabs = [
    { id: 'all', label: 'All Curricula' },
    { id: 'cs-core', label: 'Computer Science Core' },
    { id: 'distributed', label: 'Distributed Systems' },
    { id: 'ai', label: 'AI & Machine Learning' },
  ];

  const filteredTracks = activeTab === 'all'
    ? roadmapTracks
    : roadmapTracks.filter((t) => t.category === activeTab);

  return (
    <div className="py-8 space-y-10 text-left">
      <Container size="xl">
        {/* Header */}
        <div className="p-8 rounded border border-border bg-surface shadow-elevation-1 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge variant="primary">Curriculum Tracks</Badge>
                <Badge variant="neutral">Pedagogical Directed Graph</Badge>
              </div>
              <h1 className="text-3xl font-bold font-mono tracking-tight text-text-primary">
                Engineering Roadmaps
              </h1>
              <p className="text-sm text-text-secondary leading-relaxed">
                Structured sequence of computer science principles, algorithmic problem sets, and systems engineering milestones designed to build deep mental models.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="md" leftIcon={<Compass className="w-4 h-4" />}>
                Curriculum Syllabus
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="mb-6">
          <Tabs
            tabs={filterTabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Tracks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {filteredTracks.map((track) => (
            <TopicCard
              key={track.id}
              title={track.title}
              description={track.description}
              totalProblems={track.totalProblems}
              completedProblems={track.completedProblems}
              slug={track.slug}
              icon={track.icon}
            />
          ))}
        </div>

        {/* Exemplary Roadmap Node Sequence */}
        <div className="p-6 rounded border border-border bg-surface shadow-elevation-1">
          <div className="mb-6">
            <h2 className="text-lg font-bold font-mono text-text-primary flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary" />
              <span>Core Track Progression Walkthrough: Arrays & Invariants</span>
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Linear milestone sequence illustrating prerequisite verification, status badges, and duration estimates.
            </p>
          </div>

          <div className="max-w-2xl">
            <RoadmapNode
              stepNumber={1}
              title="Memory Layout & Contiguous Allocation"
              description="Cache lines, memory addressing, spatial locality, and primitive pointer arithmetic across C++ and Rust."
              status="completed"
              duration="2 hrs"
            />
            <RoadmapNode
              stepNumber={2}
              title="Two-Pointer & Sliding Window Techniques"
              description="Invariant formulation, window boundary contraction, monotonic queues, and linear-scan proofs."
              status="in_progress"
              duration="4 hrs"
            />
            <RoadmapNode
              stepNumber={3}
              title="Binary Search Invariants & Monotonic Spaces"
              description="Defining monotonic search spaces, lower-bound vs upper-bound predicates, and overflow-safe midpoint calculation."
              status="pending"
              duration="3 hrs"
            />
            <RoadmapNode
              stepNumber={4}
              title="Prefix Sums & 2D Range Query Optimization"
              description="Cumulative frequency tables, difference arrays, and constant-time submatrix query structures."
              status="pending"
              duration="2.5 hrs"
              isLast={true}
            />
          </div>
        </div>
      </Container>
    </div>
  );
};
