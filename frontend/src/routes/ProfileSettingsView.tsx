import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/ui/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/data/Card';
import { Button } from '@/components/ui/actions/Button';
import { Input } from '@/components/ui/forms/Input';
import { FormField } from '@/components/ui/forms/FormField';
import { Combobox } from '@/components/ui/forms/Combobox';
import { SEEDED_COLLEGES } from '@/lib/colleges';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/feedback/Toast';
import { Stat } from '@/components/ui/data/Stat';
import { Badge } from '@/components/ui/data/Badge';
import { Building2, User, Trophy, Flame, CheckCircle, Save, AtSign } from 'lucide-react';
import { GithubIcon } from '@/components/ui/icons/GithubIcon';

export const ProfileSettingsView: React.FC = () => {
  const { profile, updateCollege } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [selectedCollegeId, setSelectedCollegeId] = useState(profile?.college_id || 'col-iitb');
  const [selectedCollegeName, setSelectedCollegeName] = useState(
    profile?.college_name || 'Indian Institute of Technology Bombay'
  );
  const [bio, setBio] = useState(profile?.bio || 'Systems and Algorithms Engineer @ VERNIQ');
  const [githubUser, setGithubUser] = useState(profile?.github_username || 'engineer-dev');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setSelectedCollegeId(profile.college_id || 'col-iitb');
      setSelectedCollegeName(profile.college_name || 'Indian Institute of Technology Bombay');
      setBio(profile.bio || '');
      setGithubUser(profile.github_username || '');
    }
  }, [profile]);

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
        title: 'Profile Updated',
        message: 'Your college affiliation and academic identity have been synchronized.',
      });
    }
  };

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Student Workspace', href: '/app/dashboard' },
        { label: 'Profile & Campus Affiliation' },
      ]}
    >
      <div className="space-y-6 max-w-4xl mx-auto text-left">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Stat
            label="Total Platform Score"
            value={profile?.score ? `${profile.score} pts` : '890 pts'}
            subtitle="Calculated from verified AC submissions"
            icon={<Trophy className="w-4 h-4 text-warning" />}
          />
          <Stat
            label="Problems Solved"
            value={profile?.problems_solved_count ? `${profile.problems_solved_count}` : '48'}
            subtitle="Accepted LeetCode-style test cases"
            icon={<CheckCircle className="w-4 h-4 text-success" />}
          />
          <Stat
            label="Study Streak"
            value={profile?.current_streak ? `${profile.current_streak} Days` : '5 Days'}
            subtitle="Consecutive daily algorithmic problem solves"
            icon={<Flame className="w-4 h-4 text-amber-500" />}
          />
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Academic & Campus Identity</CardTitle>
              <Badge variant="primary" className="capitalize">
                Role: {profile?.role || 'student'}
              </Badge>
            </div>
            <CardDescription>
              Your verified college entity determines your intracampus peer rankings and contributes to your institution's Campus League standings.
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
                      value={profile?.username || 'engineer_dev'}
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
                    Enrolled College / University Institution <span className="text-error ml-1">*</span>
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
                  Currently affiliated with: <strong className="text-text-primary">{selectedCollegeName}</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  leftIcon={<Save className="w-4 h-4" />}
                  isLoading={saving}
                >
                  Save Profile Settings
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
