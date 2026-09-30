import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/data/Card';
import { Button } from '@/components/ui/actions/Button';
import { Input } from '@/components/ui/forms/Input';
import { FormField } from '@/components/ui/forms/FormField';
import { Alert } from '@/components/ui/feedback/Alert';
import { Badge } from '@/components/ui/data/Badge';
import { GithubIcon } from '@/components/ui/icons/GithubIcon';
import { Terminal, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { signInWithEmail, signInWithGitHub, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnTo = (location.state as { returnTo?: string })?.returnTo || '/app/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both your registered email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    const { error: err } = await signInWithEmail(email, password);
    setLoading(false);

    if (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } else {
      navigate(returnTo, { replace: true });
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
      navigate(returnTo, { replace: true });
    }
  };

  const handleAutoFillDemo = (role: 'student' | 'admin') => {
    if (role === 'admin') {
      setEmail('admin@verniq.io');
      setPassword('admin_secure_pass');
    } else {
      setEmail('student@verniq.io');
      setPassword('student_secure_pass');
    }
    setError(null);
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
            Sign In to VERNIQ
          </h1>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Access your engineering workspace, algorithmic progress, and code judge environment.
          </p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-elevation-2 border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Identity Verification</CardTitle>
              <Badge variant={isConfigured ? 'primary' : 'neutral'} className="text-[10px]">
                {isConfigured ? 'Supabase Live' : 'Dev Simulation'}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Enter your credentials or authenticate via GitHub.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="error" title="Authentication Error">
                {error}
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
              Continue with GitHub
            </Button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-3 text-[11px] font-mono uppercase text-text-muted">
                or email
              </span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField id="login-email" label="Email Address" required>
                {({ id, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid }) => (
                  <Input
                    id={id}
                    type="email"
                    placeholder="engineer@verniq.io"
                    leftIcon={<Mail className="w-4 h-4" />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-describedby={ariaDescribedBy}
                    aria-invalid={ariaInvalid}
                    autoComplete="email"
                  />
                )}
              </FormField>

              <FormField id="login-password" label="Password" required>
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
                    autoComplete="current-password"
                  />
                )}
              </FormField>

              <div className="flex items-center justify-between text-xs">
                <Link
                  to="/forgot-password"
                  className="text-text-secondary hover:text-primary transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                isLoading={loading}
              >
                Sign In
              </Button>
            </form>

            {/* Dev Helper if Supabase is offline */}
            {!isConfigured && (
              <div className="pt-3 border-t border-border/60 text-left space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span>Dev Presets:</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAutoFillDemo('student')}
                    className="px-2 py-1 rounded text-[11px] font-mono border border-border bg-surface-subtle hover:text-primary transition-colors"
                  >
                    Student Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoFillDemo('admin')}
                    className="px-2 py-1 rounded text-[11px] font-mono border border-border bg-surface-subtle hover:text-primary transition-colors"
                  >
                    Admin Demo
                  </button>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-2 border-t border-border/50 justify-center">
            <p className="text-xs text-text-secondary">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Create an account
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
