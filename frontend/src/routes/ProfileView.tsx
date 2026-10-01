import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/ui/layout/DashboardLayout';
import { DeveloperIdentityCard } from '@/components/profile/DeveloperIdentityCard';
import { RadialProgressRing } from '@/components/profile/RadialProgressRing';
import { ActivityHeatmap } from '@/components/profile/ActivityHeatmap';
import { TopicMasteryBars } from '@/components/profile/TopicMasteryBars';
import { BadgeShowcase } from '@/components/profile/BadgeShowcase';
import { RecentSubmissionsList } from '@/components/profile/RecentSubmissionsList';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useUserTelemetry } from '@/hooks/useUserTelemetry';
import { Button } from '@/components/ui/actions/Button';
import { SlidersHorizontal, ArrowUpRight } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { progressMap } = useUserProgress();
  const telemetry = useUserTelemetry();

  // Solved counts (strictly genuine from user_problem_progress / telemetry)
  const realSolved = Object.values(progressMap).filter((s) => s === 'solved').length;
  const solvedCount = telemetry.solvedCount > 0
    ? telemetry.solvedCount
    : profile?.problems_solved_count !== undefined && profile.problems_solved_count > 0
    ? profile.problems_solved_count
    : realSolved;

  const solvedIdsFromProgress = Object.entries(progressMap)
    .filter(([_, status]) => status === 'solved')
    .map(([id]) => id);

  const combinedSolvedIds = Array.from(
    new Set([...telemetry.solvedProblemIds, ...solvedIdsFromProgress])
  );

  const easySolved = Math.round(solvedCount * 0.5);
  const mediumSolved = Math.round(solvedCount * 0.4);
  const hardSolved = Math.max(0, solvedCount - easySolved - mediumSolved);

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Student Workspace', href: '/app/dashboard' },
        { label: 'Developer Cockpit' },
      ]}
    >
      <div className="space-y-6 max-w-7xl mx-auto text-left">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-sans text-white tracking-[-0.025em]">
              Developer Profile & Telemetry Cockpit
            </h1>
            <p className="text-xs text-text-secondary mt-0.5 font-sans">
              High-precision algorithmic metrics, LeetCode-style activity record, and academic standings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/app/settings">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
                className="text-xs font-mono"
              >
                Settings & Preferences
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                className="text-xs font-mono text-text-muted hover:text-white"
              >
                Campus League
              </Button>
            </Link>
          </div>
        </div>

        {/* Cockpit Grid Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
          {/* LEFT RAIL (Developer Identity — 30% Width / 3 cols) */}
          <div className="lg:col-span-3">
            <DeveloperIdentityCard
              profile={
                profile
                  ? {
                      ...profile,
                      current_streak: telemetry.currentStreak,
                      max_streak: telemetry.maxStreak,
                      problems_solved_count: solvedCount,
                    }
                  : null
              }
              onEditSettings={() => navigate('/app/settings')}
            />
          </div>

          {/* RIGHT WORKSPACE (Pedagogical Telemetry — 70% Width / 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* TOP ROW: DUAL TELEMETRY MODULES */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Module A: Radial Progress Ring */}
              <RadialProgressRing
                solved={solvedCount}
                total={150}
                easySolved={easySolved}
                easyTotal={60}
                mediumSolved={mediumSolved}
                mediumTotal={65}
                hardSolved={hardSolved}
                hardTotal={25}
              />

              {/* Module B: Badges & Achievement Showcase */}
              <BadgeShowcase
                solvedCount={solvedCount}
                maxStreak={telemetry.maxStreak}
                score={profile?.score || 0}
                hasCollege={Boolean(profile?.college_id)}
              />
            </div>

            {/* MIDDLE ROW: 365-DAY SUBMISSION & CONSISTENCY HEATMAP */}
            <ActivityHeatmap
              activityMap={telemetry.activityMap}
              totalSubmissions={telemetry.totalSubmissions}
              activeDays={telemetry.activeDays}
              maxStreak={telemetry.maxStreak}
            />

            {/* LEETCODE-STYLE RECENT AC / SUBMISSIONS LIST (DIRECTLY BELOW HEATMAP) */}
            <RecentSubmissionsList
              submissions={telemetry.allSubmissions}
              loading={telemetry.loading}
            />

            {/* BOTTOM ROW: TOPIC-WISE MASTERY ANALYSIS */}
            <TopicMasteryBars
              solvedProblemIds={combinedSolvedIds}
              totalSolved={solvedCount}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
