import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail } from 'lucide-react';
import { z } from 'zod';
import logoIcon from '@/assets/logo-icon.jpeg';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = emailSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setEmailSent(true);
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
            {emailSent ? 'Check Your Email' : 'Reset Password'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {emailSent 
              ? 'We sent you a password reset link' 
              : 'Enter your email to receive a reset link'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-secondary" />
              </div>
              <p className="text-muted-foreground">
                We've sent a password reset link to <strong className="text-foreground">{email}</strong>. 
                Check your inbox and follow the instructions.
              </p>
              <Link to="/">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-11 border-input focus:border-secondary focus:ring-secondary"
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <Button 
                type="submit" 
                variant="cta" 
                size="lg"
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}
          
          {!emailSent && (
            <div className="mt-6 text-center">
              <Link
                to="/"
                className="text-sm text-secondary hover:text-secondary/80 font-medium transition-colors inline-flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
