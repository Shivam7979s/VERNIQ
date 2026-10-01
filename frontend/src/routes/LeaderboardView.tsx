import React, { useState, useEffect, useMemo } from 'react';
import { Container } from '@/components/ui/layout/Container';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/data/Card';
import { Tabs } from '@/components/ui/navigation/Tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/data/Table';
import { Badge } from '@/components/ui/data/Badge';
import { Input } from '@/components/ui/forms/Input';
import { Button } from '@/components/ui/actions/Button';
import { useAuth } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
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
  Users,
} from 'lucide-react';

export const LeaderboardView: React.FC = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('global');
  const [search, setSearch] = useState('');
  const [engineers, setEngineers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const currentCollegeName = profile?.college_name || 'Independent / Not Affiliated';

  // 1. Fetch genuine user profiles from Supabase (Zero mock data)
  useEffect(() => {
    async function fetchLeaderboard() {
      if (!isSupabaseConfigured()) {
        setEngineers([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, score, problems_solved_count, current_streak, college_id, colleges:college_id(name)')
          .order('score', { ascending: false });

        if (!error && data) {
          const mapped: LeaderboardEntry[] = data.map((row: any, idx: number) => {
            const col = Array.isArray(row.colleges) ? row.colleges[0] : row.colleges;
            return {
              rank: idx + 1,
              id: row.id,
              username: row.username || 'dev',
              full_name: row.full_name || 'Developer',
              avatar_url: row.avatar_url || null,
              college_name: col?.name || 'Independent / Not Affiliated',
              college_id: row.college_id || null,
              problems_solved_count: row.problems_solved_count || 0,
              score: row.score || 0,
              current_streak: row.current_streak || 0,
            };
          });
          setEngineers(mapped);
        } else {
          setEngineers([]);
        }
      } catch (err) {
        console.warn('Leaderboard query error:', err);
        setEngineers([]);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  const globalEngineers = engineers;

  // College-Specific Standings (Only genuine peers enrolled in same college)
  const collegeEngineers = useMemo(() => {
    if (!profile?.college_id && !profile?.college_name) return [];
    const list = globalEngineers.filter(
      (e) =>
        (profile.college_id && e.college_id === profile.college_id) ||
        (profile.college_name && e.college_name === profile.college_name)
    );
    return list.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [globalEngineers, profile]);

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
    {
      id: 'college',
      label: `My College (${currentCollegeName.split(' ')[0]})`,
      icon: <GraduationCap className="w-3.5 h-3.5" />,
    },
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

  const currentUserGlobalRank = useMemo(() => {
    const me = globalEngineers.find((e) => e.id === user?.id || e.username === profile?.username);
    return me ? me.rank : 1;
  }, [globalEngineers, user?.id, profile?.username]);

  const currentUserCollegeRank = useMemo(() => {
    const me = collegeEngineers.find((e) => e.id === user?.id || e.username === profile?.username);
    return me ? me.rank : 1;
  }, [collegeEngineers, user?.id, profile?.username]);

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
                #{profile?.college_id ? currentUserCollegeRank : currentUserGlobalRank}
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                  {profile?.college_id ? 'Your College Standing' : 'Your Global Standing'}
                </p>
                <p className="text-[13px] font-semibold font-sans text-text-primary">
                  {profile?.college_id
                    ? `Rank #${currentUserCollegeRank} in ${currentCollegeName.split(' ')[0]}`
                    : `Rank #${currentUserGlobalRank} Worldwide`}
                </p>
                <p className="text-[11px] text-text-secondary font-mono">
                  {profile?.score || 0} pts • {profile?.problems_solved_count || 0} Solved
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
              {loading ? (
                <div className="py-12 text-center text-xs font-mono text-text-muted">
                  Loading verified engineer rankings...
                </div>
              ) : filteredGlobal.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-text-muted">
                  No registered engineers found.
                </div>
              ) : (
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
              )}
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
              {loading ? (
                <div className="py-12 text-center text-xs font-mono text-text-muted">
                  Loading campus peers...
                </div>
              ) : filteredCollege.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-text-muted">
                  No other engineers from {currentCollegeName} registered yet.
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 3: Campus League Standings */}
        {activeTab === 'campuses' && (
          <Card className="border-border shadow-elevation-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">All-India Campus League</CardTitle>
                  <CardDescription className="text-xs">
                    Institutional rankings aggregated across all enrolled student engineers.
                  </CardDescription>
                </div>
                <Badge variant="neutral">{filteredCampuses.length} Campuses</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">League Rank</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead>State / Region</TableHead>
                    <TableHead className="text-right">Active Students</TableHead>
                    <TableHead className="text-right">Total Score</TableHead>
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
                            <Building2 className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-semibold text-text-primary">
                              {col.name} {isMyCollege && <Badge variant="primary" className="ml-1 text-[10px]">Your Campus</Badge>}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-text-secondary text-xs">
                            {col.state || 'National'}, {col.country || 'India'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          <span className="inline-flex items-center gap-1 text-text-muted">
                            <Users className="w-3 h-3" />
                            {col.student_count}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-text-primary">
                          {col.total_score.toLocaleString()} pts
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
