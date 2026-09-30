import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/data/Card';
import { Button } from '@/components/ui/actions/Button';
import { Input } from '@/components/ui/forms/Input';
import { FormField } from '@/components/ui/forms/FormField';
import { Alert } from '@/components/ui/feedback/Alert';
import { Terminal, Mail, ArrowLeft, Send } from 'lucide-react';

export const ForgotPasswordView: React.FC = () => {
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your registered email address.');
      return;
    }

    setError(null);
    setLoading(true);

    const { error: err } = await resetPasswordForEmail(email.trim());
    setLoading(false);

    if (err) {
      setError(err.message || 'Failed to dispatch recovery link. Please try again.');
    } else {
      setSubmitted(true);
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
            Password Recovery
          </h1>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Provide the email associated with your engineer profile to receive a cryptographic reset token.
          </p>
        </div>

        {/* Card */}
        <Card className="shadow-elevation-2 border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Account Recovery</CardTitle>
            <CardDescription className="text-xs">
              Instructions will be dispatched if an active profile matches the address.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="error" title="Recovery Request Failed">
                {error}
              </Alert>
            )}

            {submitted ? (
              <div className="space-y-4 text-left">
                <Alert variant="success" title="Recovery Link Dispatched">
                  If an account exists for <span className="font-mono font-semibold">{email}</span>, a secure recovery email has been sent. Follow the instructions to reset your password.
                </Alert>
                <Link to="/login" className="block">
                  <Button variant="outline" className="w-full justify-center" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField id="recovery-email" label="Registered Email" required>
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

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center"
                  rightIcon={<Send className="w-4 h-4" />}
                  isLoading={loading}
                >
                  Send Recovery Link
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="pt-2 border-t border-border/50 justify-center">
            <Link
              to="/login"
              className="text-xs text-text-secondary hover:text-primary transition-colors flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
