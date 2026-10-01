import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/data/Card';
import { Button } from '@/components/ui/actions/Button';
import { Input } from '@/components/ui/forms/Input';
import { FormField } from '@/components/ui/forms/FormField';
import { Alert } from '@/components/ui/feedback/Alert';
import { Badge } from '@/components/ui/data/Badge';
import { GithubIcon } from '@/components/ui/icons/GithubIcon';
import { Combobox } from '@/components/ui/forms/Combobox';
import { SEEDED_COLLEGES } from '@/lib/colleges';
import { Terminal, Mail, Lock, User, AtSign, ArrowRight, Building2 } from 'lucide-react';

export const RegisterView: React.FC = () => {
  const { signUpWithEmail, signInWithGitHub, isConfigured } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [collegeId, setCollegeId] = useState('187ea122-3e85-443a-8f01-b774389852a0');
  const [collegeName, setCollegeName] = useState('Indian Institute of Technology Bombay');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !username.trim() || !email.trim() || !password) {
      setError('All fields are required.');
      return;
    }

    // Auto-sanitize username in case browser autofilled email or special characters
    let cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.includes('@')) {
      cleanUsername = cleanUsername.split('@')[0];
    }
    cleanUsername = cleanUsername.replace(/[^a-zA-Z0-9_]/g, '_');
    if (cleanUsername.length > 20) {
      cleanUsername = cleanUsername.slice(0, 20);
    }

    if (!USERNAME_REGEX.test(cleanUsername)) {
      setError('Username must be 3-20 characters consisting of letters, digits, and underscores (e.g. shivam79).');
      return;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    setError(null);
    setLoading(true);

    const { error: err } = await signUpWithEmail(
      email.trim(),
      password,
      cleanUsername,
      fullName.trim(),
      collegeId,
      collegeName
    );
    setLoading(false);

    if (err) {
      setError(err.message || 'Registration failed. Please review your details.');
    } else {
      setSuccessNotice('Account created successfully! Redirecting...');
      navigate('/app/dashboard', { replace: true });
    }
  };

  const handleGitHubLogin = async () => {
    setError(null);
    setOauthLoading(true);
    const { error: err } = await signInWithGitHub();
    setOauthLoading(false);
    if (err) {
      setError(err.message || 'GitHub OAuth failed.');
    } else if (!isConfigured) {
      navigate('/app/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded bg-primary text-text-inverse font-mono font-bold text-base shadow-sm">
            <Terminal className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-text-primary">
            Create Engineer Account
          </h1>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Establish your identity, track streak consistency, and unlock isolated code judge submissions.
          </p>
        </div>

        {/* Register Card */}
        <Card className="shadow-elevation-2 border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Engineer Enrollment</CardTitle>
              <Badge variant={isConfigured ? 'primary' : 'neutral'} className="text-[10px]">
                {isConfigured ? 'PostgreSQL RLS' : 'Local Sandbox'}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Direct email registration or instant GitHub authentication.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="error" title="Registration Error">
                {error}
              </Alert>
            )}

            {successNotice && (
              <Alert variant="success" title="Verification Dispatched">
                {successNotice}
              </Alert>
            )}

            {/* GitHub OAuth Button */}
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-center"
              leftIcon={<GithubIcon className="w-4 h-4" />}
              isLoading={oauthLoading}
              onClick={handleGitHubLogin}
            >
              Sign Up with GitHub
            </Button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-3 text-[11px] font-mono uppercase text-text-muted">
                or manual credentials
              </span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField id="register-fullname" label="Full Name" required>
                {({ id, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid }) => (
                  <Input
                    id={id}
                    placeholder="Grace Hopper"
                    leftIcon={<User className="w-4 h-4" />}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    aria-describedby={ariaDescribedBy}
                    aria-invalid={ariaInvalid}
                    autoComplete="name"
                  />
                )}
              </FormField>

              <div className="space-y-1.5 text-left">
                <label className="text-[12px] font-medium text-text-primary tracking-wide flex items-center justify-between">
                  <span>
                    College / University Institution <span className="text-error ml-1">*</span>
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">Campus League</span>
                </label>
                <Combobox
                  options={SEEDED_COLLEGES.map((c) => ({
                    value: c.id,
                    label: c.name,
                    subtitle: `${c.state || ''}, ${c.country} • ${c.student_count} Students`,
                  }))}
                  value={collegeId}
                  onChange={(val, opt) => {
                    setCollegeId(val);
                    if (opt) setCollegeName(opt.label);
                  }}
                  placeholder="Select or enter your engineering college..."
                  leftIcon={<Building2 className="w-4 h-4" />}
                />
              </div>

              <FormField
                id="register-username"
                label="Username"
                required
                helperText="3-20 characters: letters, numbers, and underscores"
              >
                {({ id, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid }) => (
                  <Input
                    id={id}
                    placeholder="shivam79"
                    leftIcon={<AtSign className="w-4 h-4" />}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    aria-describedby={ariaDescribedBy}
                    aria-invalid={ariaInvalid}
                    autoComplete="nickname"
                  />
                )}
              </FormField>

              <FormField id="register-email" label="Email Address" required>
                {({ id, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid }) => (
                  <Input
                    id={id}
                    type="email"
                    placeholder="grace@verniq.io"
                    leftIcon={<Mail className="w-4 h-4" />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-describedby={ariaDescribedBy}
                    aria-invalid={ariaInvalid}
                    autoComplete="email"
                  />
                )}
              </FormField>

              <FormField id="register-password" label="Password" required helperText="Minimum 8 characters">
                {({ id, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid }) => (
                  <Input
                    id={id}
                    type="password"
                    placeholder="••••••••••••"
                    leftIcon={<Lock className="w-4 h-4" />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-describedby={ariaDescribedBy}
                    aria-invalid={ariaInvalid}
                    autoComplete="new-password"
                  />
                )}
              </FormField>

              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                isLoading={loading}
              >
                Complete Registration
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pt-2 border-t border-border/50 justify-center">
            <p className="text-xs text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
