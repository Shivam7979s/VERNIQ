import React from 'react';
import { Container } from '@/components/ui/layout/Container';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/data/Card';
import { Badge } from '@/components/ui/data/Badge';
import { Button } from '@/components/ui/actions/Button';
import { Progress } from '@/components/ui/data/Progress';
import { Layers, Clock, Users, ArrowRight } from 'lucide-react';

export const CoursesView: React.FC = () => {
  const courses = [
    {
      id: 'course-1',
      title: 'Database Internals from First Principles',
      subtitle: 'Build a fully ACID-compliant B+ Tree storage engine in Rust with write-ahead logging (WAL) and MVCC.',
      level: 'Advanced',
      modules: 12,
      duration: '36 hours',
      students: '1,420 engineers',
      topics: ['B+ Trees', 'WAL & ARIES', 'Buffer Pool', 'MVCC Isolation'],
      progress: 35,
    },
    {
      id: 'course-2',
      title: 'Distributed Consensus: Raft & Paxos',
      subtitle: 'Implement a distributed key-value store with leader election, log replication, snapshotting, and fault injection testing.',
      level: 'Advanced',
      modules: 8,
      duration: '24 hours',
      students: '890 engineers',
      topics: ['Leader Election', 'Log Compaction', 'Network Partitions', 'Jepsen Tests'],
      progress: 0,
    },
    {
      id: 'course-3',
      title: 'High-Throughput Microservices in Go & gRPC',
      subtitle: 'Production design patterns for connection pooling, streaming protobufs, rate limiting, and zero-downtime rolling updates.',
      level: 'Intermediate',
      modules: 10,
      duration: '28 hours',
      students: '2,150 engineers',
      topics: ['Protobuf v3', 'gRPC Streams', 'Circuit Breakers', 'OpenTelemetry'],
      progress: 60,
    },
    {
      id: 'course-4',
      title: 'Compiler Construction: Lexing to LLVM IR',
      subtitle: 'Design a statically-typed language frontend with recursive descent parsing, AST semantic analysis, and LLVM code generation.',
      level: 'Advanced',
      modules: 14,
      duration: '42 hours',
      students: '640 engineers',
      topics: ['Lexical Analysis', 'Type Inference', 'CFG Optimization', 'LLVM Target'],
      progress: 10,
    },
  ];

  return (
    <div className="py-8 space-y-8 text-left">
      <Container size="xl">
        {/* Banner */}
        <div className="p-8 rounded border border-border bg-surface shadow-elevation-1 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge variant="primary">Deep-Dive Specializations</Badge>
                <Badge variant="neutral">Hands-on Lab Curricula</Badge>
              </div>
              <h1 className="text-3xl font-bold font-mono tracking-tight text-text-primary">
                Advanced Engineering Courses
              </h1>
              <p className="text-sm text-text-secondary leading-relaxed">
                Comprehensive, code-intensive masterclasses taught through real-world systems implementations, test fixtures, and architectural diagrams.
              </p>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="hover:border-border-strong transition-colors flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="neutral">{course.level}</Badge>
                  <div className="flex items-center gap-3 text-xs text-text-muted font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {course.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      {course.modules} modules
                    </span>
                  </div>
                </div>
                <CardTitle className="text-base text-text-primary">{course.title}</CardTitle>
                <CardDescription className="text-xs leading-relaxed mt-1">
                  {course.subtitle}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {course.topics.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface-subtle border border-border text-text-muted"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs text-text-muted mb-1.5 font-mono">
                    <span>Course Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} variant={course.progress > 50 ? 'success' : 'primary'} />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-text-muted font-mono flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {course.students}
                  </span>
                  <Button size="sm" variant="secondary" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    {course.progress > 0 ? 'Resume Course' : 'Enroll in Syllabus'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </div>
  );
};
