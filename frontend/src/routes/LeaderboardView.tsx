import React, { useState, useMemo } from 'react';
import { Container } from '@/components/ui/layout/Container';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/data/Card';
import { Tabs } from '@/components/ui/navigation/Tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/data/Table';
import { Badge } from '@/components/ui/data/Badge';
import { Input } from '@/components/ui/forms/Input';
import { Button } from '@/components/ui/actions/Button';
import { useAuth } from '@/hooks/useAuth';
import { SEEDED_COLLEGES } from '@/lib/colleges';
import type { LeaderboardEntry, CampusLeagueEntry } from '@/types';
import {
  Trophy,
  Medal,
  Award,
  Building2,
  Search,
  Flame,
  CheckCircle2,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export const LeaderboardView: React.FC = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('global');
  const [search, setSearch] = useState('');

  const currentCollegeName = profile?.college_name || 'Indian Institute of Technology Bombay';

  // Seeded Global Engineers Data
  const globalEngineers: LeaderboardEntry[] = useMemo(() => [
    {
      rank: 1,
      id: 'eng-1',
      username: 'aditya_verma',
      full_name: 'Aditya Verma',
      avatar_url: null,
      college_name: 'Indian Institute of Technology Bombay',
      college_id: 'col-iitb',
      problems_solved_count: 182,
      score: 3640,
      current_streak: 42,
    },
    {
      rank: 2,
      id: 'eng-2',
      username: 'sneha_mukherjee',
      full_name: 'Sneha Mukherjee',
      avatar_url: null,
      college_name: 'International Institute of Information Technology, Hyderabad',
      college_id: 'col-iiith',
      problems_solved_count: 165,
      score: 3300,
      current_streak: 28,
    },
    {
      rank: 3,
      id: 'eng-3',
      username: 'rohan_gupta',
      full_name: 'Rohan Gupta',
      avatar_url: null,
      college_name: 'Indian Institute of Technology Delhi',
      college_id: 'col-iitd',
      problems_solved_count: 154,
      score: 3080,
      current_streak: 35,
    },
    {
      rank: 4,
      id: 'eng-4',
      username: 'priya_nair',
      full_name: 'Priya Nair',
      avatar_url: null,
      college_name: 'Birla Institute of Technology and Science, Pilani',
      college_id: 'col-bits',
      problems_solved_count: 142,
      score: 2840,
      current_streak: 19,
    },
    {
      rank: 5,
      id: 'eng-5',
      username: 'arjun_patel',
      full_name: 'Arjun Patel',
      avatar_url: null,
      college_name: 'Indian Institute of Technology Madras',
      college_id: 'col-iitm',
      problems_solved_count: 138,
      score: 2760,
      current_streak: 24,
    },
    {
      rank: 6,
      id: 'eng-6',
      username: 'kavya_s',
      full_name: 'Kavya Srinivasan',
      avatar_url: null,
      college_name: 'National Institute of Technology Tiruchirappalli',
      college_id: 'col-nitt',
      problems_solved_count: 126,
      score: 2520,
      current_streak: 15,
    },
    {
      rank: 7,
      id: 'eng-7',
      username: 'vikram_singh',
      full_name: 'Vikram Singh',
      avatar_url: null,
      college_name: 'Delhi Technological University',
      college_id: 'col-dtu',
      problems_solved_count: 118,
      score: 2360,
      current_streak: 21,
    },
    {
      rank: 8,
      id: 'eng-8',
      username: 'ananya_das',
      full_name: 'Ananya Das',
      avatar_url: null,
      college_name: 'Indian Institute of Technology Kharagpur',
      college_id: 'col-iitkgp',
      problems_solved_count: 110,
      score: 2200,
      current_streak: 14,
    },
    {
      rank: 9,
      id: 'eng-9',
      username: 'manish_kumar',
      full_name: 'Manish Kumar',
      avatar_url: null,
      college_name: 'National Institute of Technology Karnataka, Surathkal',
      college_id: 'col-nitk',
      problems_solved_count: 98,
      score: 1960,
      current_streak: 12,
    },
    {
      rank: 10,
      id: 'eng-10',
      username: 'tanya_sharma',
      full_name: 'Tanya Sharma',
      avatar_url: null,
      college_name: 'Vellore Institute of Technology, Vellore',
      college_id: 'col-vit',
      problems_solved_count: 92,
      score: 1840,
      current_streak: 9,
    },
    // Include current user in standings
    {
      rank: 14,
      id: user?.id || 'current-user',
      username: profile?.username || 'you_engineer',
      full_name: profile?.full_name || 'You (Current Engineer)',
      avatar_url: profile?.avatar_url || null,
      college_name: currentCollegeName,
      college_id: profile?.college_id || 'col-iitb',
      problems_solved_count: profile?.problems_solved_count || 48,
      score: profile?.score || 890,
      current_streak: profile?.current_streak || 5,
    },
    {
      rank: 15,
      id: 'eng-12',
      username: 'rahul_deshmukh',
      full_name: 'Rahul Deshmukh',
      avatar_url: null,
      college_name: 'College of Engineering, Pune',
      college_id: 'col-coep',
      problems_solved_count: 45,
      score: 870,
      current_streak: 7,
    },
  ], [user?.id, profile, currentCollegeName]);

  // College-Specific Standings
  const collegeEngineers = useMemo(() => {
    const list = globalEngineers.filter(
      (e) => e.college_name === currentCollegeName
    );
    // Recalculate rank within college
    return list.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [globalEngineers, currentCollegeName]);

  // Campus League
  const campusLeague: CampusLeagueEntry[] = useMemo(() => {
    return [...SEEDED_COLLEGES]
      .sort((a, b) => b.total_score - a.total_score)
      .map((col, idx) => ({
        rank: idx + 1,
        id: col.id,
        name: col.name,
        slug: col.slug,
        state: col.state,
        country: col.country,
        student_count: col.student_count,
        total_score: col.total_score,
      }));
  }, []);

  const tabs = [
    { id: 'global', label: 'Global Standings', icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: 'college', label: `My College (${currentCollegeName.split(' ')[0]})`, icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { id: 'campuses', label: 'Campus League', icon: <Building2 className="w-3.5 h-3.5" /> },
  ];

  // Filtering
  const filteredGlobal = useMemo(() => {
    if (!search.trim()) return globalEngineers;
    const lower = search.toLowerCase();
    return globalEngineers.filter(
      (e) =>
        e.full_name.toLowerCase().includes(lower) ||
        e.username.toLowerCase().includes(lower) ||
        (e.college_name && e.college_name.toLowerCase().includes(lower))
    );
  }, [globalEngineers, search]);

  const filteredCollege = useMemo(() => {
    if (!search.trim()) return collegeEngineers;
    const lower = search.toLowerCase();
    return collegeEngineers.filter(
      (e) =>
        e.full_name.toLowerCase().includes(lower) ||
        e.username.toLowerCase().includes(lower)
    );
  }, [collegeEngineers, search]);

  const filteredCampuses = useMemo(() => {
    if (!search.trim()) return campusLeague;
    const lower = search.toLowerCase();
    return campusLeague.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        (c.state && c.state.toLowerCase().includes(lower))
    );
  }, [campusLeague, search]);

  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-400">
          <Medal className="w-4 h-4 text-amber-400" /> #1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-300">
          <Medal className="w-4 h-4 text-slate-300" /> #2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-600">
          <Award className="w-4 h-4 text-amber-600" /> #3
        </span>
      );
    }
    return <span className="font-mono text-text-muted">#{rank}</span>;
  };

  const currentUserCollegeRank = collegeEngineers.find(
    (e) => e.username === (profile?.username || 'you_engineer')
  )?.rank || 3;

  return (
    <div className="py-8 space-y-8 text-left">
      <Container size="xl">
        {/* Standardized Sleek Page Header */}
        <PageHeader
          badge="Campus Identity & Rankings"
          title="Engineering Leaderboards"
          subtitle="Rankings calculated from verified algorithmic test-case executions, problem solving velocity, and daily streak commitments."
          actions={
            <div className="p-3.5 rounded-lg border border-primary/30 bg-[#181C28] flex items-center gap-3.5 shrink-0 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-mono font-bold text-sm">
                #{currentUserCollegeRank}
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                  Your College Standing
                </p>
                <p className="text-[13px] font-semibold font-sans text-text-primary">
                  Rank #{currentUserCollegeRank} in {currentCollegeName.split(' ')[0]}
                </p>
                <p className="text-[11px] text-text-secondary font-mono">
                  {profile?.score || 890} pts • {profile?.problems_solved_count || 48} Solved
                </p>
              </div>
            </div>
          }
        />

        {/* Tab Selection & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          <div className="w-full sm:w-72">
            <Input
              placeholder={activeTab === 'campuses' ? 'Search college or state...' : 'Search engineer or college...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-text-muted" />}
            />
          </div>
        </div>

        {/* TAB 1: Global Standings */}
        {activeTab === 'global' && (
          <Card className="border-border shadow-elevation-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Global Engineer Standings</CardTitle>
                  <CardDescription className="text-xs">
                    All registered software engineers ranked by algorithmic problem score and verified AC submissions.
                  </CardDescription>
                </div>
                <Badge variant="neutral">{filteredGlobal.length} Engineers</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Software Engineer</TableHead>
                    <TableHead>Affiliated Institution</TableHead>
                    <TableHead className="text-right">Solved</TableHead>
                    <TableHead className="text-right">Streak</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGlobal.map((eng) => {
                    const isMe = eng.id === user?.id || eng.username === profile?.username;
                    return (
                      <TableRow
                        key={eng.id}
                        className={isMe ? 'bg-primary/10 border-l-2 border-primary' : undefined}
                      >
                        <TableCell className="font-semibold font-mono">
                          {renderRankBadge(eng.rank)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-surface-elevated border border-border text-primary font-mono text-xs flex items-center justify-center font-bold">
                              {eng.full_name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .substring(0, 2)
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-text-primary block truncate">
                                {eng.full_name} {isMe && <Badge variant="primary" className="ml-1 text-[10px]">You</Badge>}
                              </span>
                              <span className="text-[11px] font-mono text-text-muted block truncate">
                                @{eng.username}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-text-secondary text-xs flex items-center gap-1.5 truncate">
                            <GraduationCap className="w-3.5 h-3.5 text-text-muted shrink-0" />
                            {eng.college_name || 'Independent Engineer'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          <span className="inline-flex items-center gap-1 text-emerald-500">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {eng.problems_solved_count}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {eng.current_streak ? (
                            <span className="inline-flex items-center gap-1 text-amber-500">
                              <Flame className="w-3.5 h-3.5" />
                              {eng.current_streak}d
                            </span>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-text-primary">
                          {eng.score.toLocaleString()} pts
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* TAB 2: College Standings */}
        {activeTab === 'college' && (
          <Card className="border-border shadow-elevation-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Campus Leaderboard: {currentCollegeName}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Intracampus rankings among fellow engineers at your enrolled institution.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="primary">{filteredCollege.length} Active Peers</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      window.location.href = '/app/settings';
                    }}
                  >
                    Change College
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Campus Rank</TableHead>
                    <TableHead>Peer Engineer</TableHead>
                    <TableHead className="text-right">Problems Solved</TableHead>
                    <TableHead className="text-right">Active Streak</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCollege.map((eng) => {
                    const isMe = eng.id === user?.id || eng.username === profile?.username;
                    return (
                      <TableRow
                        key={eng.id}
                        className={isMe ? 'bg-primary/10 border-l-2 border-primary' : undefined}
                      >
                        <TableCell className="font-semibold font-mono">
                          {renderRankBadge(eng.rank)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-surface-elevated border border-border text-primary font-mono text-xs flex items-center justify-center font-bold">
                              {eng.full_name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .substring(0, 2)
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-text-primary block truncate">
                                {eng.full_name} {isMe && <Badge variant="primary" className="ml-1 text-[10px]">You</Badge>}
                              </span>
                              <span className="text-[11px] font-mono text-text-muted block truncate">
                                @{eng.username}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          <span className="inline-flex items-center gap-1 text-emerald-500">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {eng.problems_solved_count}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {eng.current_streak ? (
                            <span className="inline-flex items-center gap-1 text-amber-500">
                              <Flame className="w-3.5 h-3.5" />
                              {eng.current_streak}d
                            </span>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-text-primary">
                          {eng.score.toLocaleString()} pts
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* TAB 3: Campus League */}
        {activeTab === 'campuses' && (
          <Card className="border-border shadow-elevation-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Campus League (Intercollegiate Rankings)</CardTitle>
                  <CardDescription className="text-xs">
                    Engineering colleges and institutes ranked by cumulative student score and active problem solvers.
                  </CardDescription>
                </div>
                <Badge variant="neutral">{filteredCampuses.length} Institutions</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead>Region / State</TableHead>
                    <TableHead className="text-right">Enrolled Students</TableHead>
                    <TableHead className="text-right">Aggregate Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampuses.map((col) => {
                    const isMyCollege = col.name === currentCollegeName;
                    return (
                      <TableRow
                        key={col.id}
                        className={isMyCollege ? 'bg-primary/10 border-l-2 border-primary' : undefined}
                      >
                        <TableCell className="font-semibold font-mono">
                          {renderRankBadge(col.rank)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Building2 className="w-4 h-4 text-text-muted shrink-0" />
                            <div className="min-w-0">
                              <span className="font-semibold text-text-primary block truncate">
                                {col.name}
                              </span>
                              {isMyCollege && (
                                <span className="text-[10px] text-primary font-mono font-semibold">
                                  Your Enrolled Campus
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-text-secondary">
                            {col.state}, {col.country}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {col.student_count.toLocaleString()} engineers
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-text-primary">
                          <span className="inline-flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            {col.total_score.toLocaleString()} pts
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </Container>
    </div>
  );
};
