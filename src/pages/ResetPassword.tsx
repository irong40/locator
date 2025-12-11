import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { z } from 'zod';
import logoIcon from '@/assets/logo-icon.jpeg';

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SessionState = 'loading' | 'ready' | 'expired' | 'success';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { updatePassword, session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sessionState, setSessionState] = useState<SessionState>('loading');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  useEffect(() => {
    const hash = window.location.hash;
    const hasRecoveryTokens = hash.includes('type=recovery') || hash.includes('access_token');

    // If we already have a session, we're ready
    if (session) {
      setSessionState('ready');
      return;
    }

    // If we have recovery tokens but no session yet, wait for Supabase to process them
    if (hasRecoveryTokens) {
      const timeout = setTimeout(() => {
        // After timeout, if still no session, tokens are likely expired
        if (!session) {
          setSessionState('expired');
        }
      }, 5000);
      
      return () => clearTimeout(timeout);
    }

    // No tokens and no session = invalid access
    setSessionState('expired');
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = passwordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      const fieldErrors: { password?: string; confirmPassword?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === 'password') fieldErrors.password = err.message;
        if (err.path[0] === 'confirmPassword') fieldErrors.confirmPassword = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(password);
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setSessionState('success');
        toast({
          title: 'Password Updated',
          description: 'Your password has been successfully updated.',
        });
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (sessionState) {
      case 'loading':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            </div>
            <p className="text-muted-foreground">
              Verifying your reset link...
            </p>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <p className="text-foreground font-medium">
                Reset Link Expired or Invalid
              </p>
              <p className="text-muted-foreground text-sm">
                This password reset link has expired or is invalid. Please request a new one.
              </p>
            </div>
            <Link to="/forgot-password">
              <Button variant="cta" className="w-full mt-4">
                Request New Reset Link
              </Button>
            </Link>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-secondary" />
            </div>
            <p className="text-muted-foreground">
              Your password has been successfully updated. You'll be redirected shortly.
            </p>
          </div>
        );

      case 'ready':
        return (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="h-11 border-input focus:border-secondary focus:ring-secondary"
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="h-11 border-input focus:border-secondary focus:ring-secondary"
              />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
            </div>
            <Button 
              type="submit" 
              variant="cta" 
              size="lg"
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        );
    }
  };

  const getTitle = () => {
    switch (sessionState) {
      case 'loading': return 'Verifying Link';
      case 'expired': return 'Link Expired';
      case 'success': return 'Password Updated';
      case 'ready': return 'Set New Password';
    }
  };

  const getDescription = () => {
    switch (sessionState) {
      case 'loading': return 'Please wait while we verify your reset link...';
      case 'expired': return 'Your password reset link is no longer valid';
      case 'success': return 'Redirecting you to the dashboard...';
      case 'ready': return 'Enter your new password below';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-dark p-4">
      <div className="mb-8 text-center">
        <div className="h-20 w-20 rounded-2xl overflow-hidden mx-auto mb-4 shadow-lg">
          <img 
            src={logoIcon} 
            alt="C&R Repair Solutions Logo" 
            className="h-full w-full object-cover"
          />
        </div>
        <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-2">
          C&R Repair Solutions
        </h1>
      </div>

      <Card className="w-full max-w-md border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-2xl font-heading font-bold text-foreground">
            {getTitle()}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {getDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
