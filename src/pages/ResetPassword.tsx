import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';
import { z } from 'zod';
import logoIcon from '@/assets/logo-icon.jpeg';

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const ResetPassword = () => {
  const navigate = useNavigate();
  const { updatePassword, session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  useEffect(() => {
    // If no session (recovery mode), Supabase handles it via URL hash
    // The session will be set after successful password reset
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
        setSuccess(true);
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
            {success ? 'Password Updated' : 'Set New Password'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {success 
              ? 'Redirecting you to the dashboard...' 
              : 'Enter your new password below'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-secondary" />
              </div>
              <p className="text-muted-foreground">
                Your password has been successfully updated. You'll be redirected shortly.
              </p>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
