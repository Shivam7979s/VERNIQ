import React, { useState } from 'react';
import { DashboardLayout } from '@/components/ui/layout/DashboardLayout';
import { DeveloperIdentityCard } from '@/components/profile/DeveloperIdentityCard';
import { RadialProgressRing } from '@/components/profile/RadialProgressRing';
import { ActivityHeatmap } from '@/components/profile/ActivityHeatmap';
import { TopicMasteryBars } from '@/components/profile/TopicMasteryBars';
import { BadgeShowcase } from '@/components/profile/BadgeShowcase';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { SEEDED_COLLEGES } from '@/lib/colleges';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/data/Card';
import { Button } from '@/components/ui/actions/Button';
import { Input } from '@/components/ui/forms/Input';
import { FormField } from '@/components/ui/forms/FormField';
import { Combobox } from '@/components/ui/forms/Combobox';
import { useToast } from '@/components/ui/feedback/Toast';
import {
  Building2,
  User,
  Save,
  AtSign,
  ArrowLeft,
  SlidersHorizontal,
  Code2,
  Layers,
} from 'lucide-react';
import { GithubIcon } from '@/components/ui/icons/GithubIcon';

export const ProfileView: React.FC = () => {
  const { profile, updateCollege } = useAuth();
  const { progressMap } = useUserProgress();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'cockpit' | 'settings'>('cockpit');

  // Form states for settings
  const [fullName, setFullName] = useState(profile?.full_name || 'Shivam Sharma');
  const [selectedCollegeId, setSelectedCollegeId] = useState(profile?.college_id || 'col-rgpv');
  const [selectedCollegeName, setSelectedCollegeName] = useState(
    profile?.college_name || 'Rajiv Gandhi Proudyogiki Vishwavidyalaya'
  );
  const [bio, setBio] = useState(
    profile?.bio ||
      'Distributed Systems & Algorithmic Engineering @ VERNIQ. Specializing in high-throughput query engines and concurrent data structures.'
  );
  const [githubUser, setGithubUser] = useState(profile?.github_username || 'Shivam7979s');
  const [linkedinUrl, setLinkedinUrl] = useState(
    profile?.linkedin_url || 'https://linkedin.com/in/shivam-sharma'
  );
  const [leetcodeUser, setLeetcodeUser] = useState(profile?.leetcode_username || 'shivam7979');
  const [saving, setSaving] = useState(false);

  // Solved counts (real or fallbacks)
  const realSolved = Object.values(progressMap).filter((s) => s === 'solved').length;
  const solvedCount = Math.max(realSolved, profile?.problems_solved_count || 74);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await updateCollege(selectedCollegeId, selectedCollegeName);
    setSaving(false);

    if (error) {
      toast({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Could not update college affiliation.',
      });
    } else {
      toast({
        type: 'success',
        title: 'Profile Synchronized',
        message: 'Your developer identity and institutional rankings are now active.',
      });
      setActiveTab('cockpit');
    }
  };

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Student Workspace', href: '/app/dashboard' },
        { label: activeTab === 'cockpit' ? 'Developer Cockpit' : 'Profile Settings' },
      ]}
    >
      <div className="space-y-6 max-w-7xl mx-auto text-left">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
          <div>
            <h1 className="text-2xl font-bold font-mono text-text-primary tracking-tight">
              Developer Profile & Telemetry Cockpit
            </h1>
            <p className="text-xs text-text-secondary mt-0.5 font-sans">
              High-precision algorithmic metrics, TakeUForward sheet coverage, and academic standings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'cockpit' ? 'primary' : 'secondary'}
              size="sm"
              leftIcon={<Layers className="w-3.5 h-3.5" />}
              onClick={() => setActiveTab('cockpit')}
              className="text-xs font-mono"
            >
              Cockpit View
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'primary' : 'secondary'}
              size="sm"
              leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              onClick={() => setActiveTab('settings')}
              className="text-xs font-mono"
            >
              Edit Identity & Affiliation
            </Button>
          </div>
        </div>

        {/* TAB 1: COCKPIT OVERVIEW */}
        {activeTab === 'cockpit' ? (
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
            {/* LEFT RAIL (Developer Identity — 30% Width / 3 cols) */}
            <div className="lg:col-span-3">
              <DeveloperIdentityCard
                profile={profile}
                onEditSettings={() => setActiveTab('settings')}
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
                  easySolved={42}
                  easyTotal={60}
                  mediumSolved={26}
                  mediumTotal={65}
                  hardSolved={6}
                  hardTotal={25}
                />

                {/* Module B: Badges & Achievement Showcase */}
                <BadgeShowcase />
              </div>

              {/* MIDDLE ROW: 365-DAY SUBMISSION & CONSISTENCY HEATMAP */}
              <ActivityHeatmap
                totalSubmissions={482}
                activeDays={184}
                maxStreak={28}
              />

              {/* BOTTOM ROW: TOPIC-WISE MASTERY ANALYSIS */}
              <TopicMasteryBars />
            </div>
          </div>
        ) : (
          /* TAB 2: EDIT SETTINGS & AFFILIATION */
          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Academic & Campus Identity Configuration</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                    onClick={() => setActiveTab('cockpit')}
                    className="text-xs font-mono"
                  >
                    Back to Cockpit
                  </Button>
                </div>
                <CardDescription>
                  Your verified institution dictates your intra-campus peer rankings and contributes to your university's position on the Campus League leaderboards.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSave} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField id="profile-fullname" label="Full Name">
                      {({ id }) => (
                        <Input
                          id={id}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          leftIcon={<User className="w-4 h-4" />}
                        />
                      )}
                    </FormField>

                    <FormField id="profile-username" label="Username (Read-Only)">
                      {({ id }) => (
                        <Input
                          id={id}
                          value={profile?.username || 'shivam7979'}
                          disabled
                          leftIcon={<AtSign className="w-4 h-4" />}
                        />
                      )}
                    </FormField>
                  </div>

                  {/* College Selection Combobox */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-text-primary tracking-wide flex items-center justify-between">
                      <span>
                        Enrolled College / University Institution{' '}
                        <span className="text-error ml-1">*</span>
                      </span>
                      <span className="text-[10px] text-text-muted font-mono">
                        Affects Campus Leaderboard
                      </span>
                    </label>
                    <Combobox
                      options={SEEDED_COLLEGES.map((c) => ({
                        value: c.id,
                        label: c.name,
                        subtitle: `${c.state || ''}, ${c.country} • ${c.student_count} Students`,
                      }))}
                      value={selectedCollegeId}
                      onChange={(val, opt) => {
                        setSelectedCollegeId(val);
                        if (opt) setSelectedCollegeName(opt.label);
                      }}
                      placeholder="Search and select your engineering college..."
                      leftIcon={<Building2 className="w-4 h-4" />}
                    />
                    <p className="text-[11px] text-text-muted">
                      Currently affiliated with:{' '}
                      <strong className="text-text-primary">{selectedCollegeName}</strong>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField id="profile-github" label="GitHub Username">
                      {({ id }) => (
                        <Input
                          id={id}
                          placeholder="github-handle"
                          value={githubUser}
                          onChange={(e) => setGithubUser(e.target.value)}
                          leftIcon={<GithubIcon className="w-4 h-4" />}
                        />
                      )}
                    </FormField>

                    <FormField id="profile-leetcode" label="LeetCode Handle">
                      {({ id }) => (
                        <Input
                          id={id}
                          placeholder="leetcode-handle"
                          value={leetcodeUser}
                          onChange={(e) => setLeetcodeUser(e.target.value)}
                          leftIcon={<Code2 className="w-4 h-4 text-[#FFA116]" />}
                        />
                      )}
                    </FormField>

                    <FormField id="profile-linkedin" label="LinkedIn URL">
                      {({ id }) => (
                        <Input
                          id={id}
                          placeholder="linkedin.com/in/username"
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                        />
                      )}
                    </FormField>
                  </div>

                  <FormField id="profile-bio" label="Headline / Bio">
                    {({ id }) => (
                      <Input
                        id={id}
                        placeholder="E.g. Computer Science @ IIT Bombay"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                      />
                    )}
                  </FormField>

                  <div className="pt-2 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setActiveTab('cockpit')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      leftIcon={<Save className="w-4 h-4" />}
                      isLoading={saving}
                    >
                      Save Profile Affiliation
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
