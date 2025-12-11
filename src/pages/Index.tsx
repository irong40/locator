import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import logoIcon from '@/assets/logo-icon.jpeg';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type LoginErrors = { email?: string; password?: string };
type RegisterErrors = { firstName?: string; lastName?: string; email?: string; password?: string; confirmPassword?: string };

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  
  // Register state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerErrors, setRegisterErrors] = useState<RegisterErrors>({});

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});

    const validation = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!validation.success) {
      const fieldErrors: LoginErrors = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setLoginErrors(fieldErrors);
      return;
    }

    setLoginLoading(true);

    try {
      const { error } = await signIn(loginEmail, loginPassword);
      if (error) {
        toast({
          title: 'Login failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        navigate('/dashboard');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterErrors({});

    const validation = registerSchema.safeParse({
      firstName, lastName, email: registerEmail, password: registerPassword, confirmPassword
    });
    
    if (!validation.success) {
      const fieldErrors: RegisterErrors = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0] as keyof RegisterErrors;
        fieldErrors[field] = err.message;
      });
      setRegisterErrors(fieldErrors);
      return;
    }

    setRegisterLoading(true);

    try {
      const { error } = await signUp(registerEmail, registerPassword, {
        first_name: firstName,
        last_name: lastName,
      });
      
      if (error) {
        toast({
          title: 'Registration failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Check your email',
          description: 'We sent you a confirmation link. Please check your email to verify your account.',
        });
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-dark">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary" />
      </div>
    );
  }

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
        <p className="text-secondary font-sans">Vendor Management System</p>
      </div>

      <Card className="w-full max-w-md border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
        <Tabs defaultValue="login" className="w-full">
          <CardHeader className="space-y-1 pb-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="login" className="mt-0">
              <div className="space-y-1 mb-4">
                <CardTitle className="text-2xl font-heading font-bold text-foreground">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Enter your credentials to access the system
                </CardDescription>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-foreground font-medium">
                    Email
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={loginLoading}
                    className="h-11 border-input focus:border-secondary focus:ring-secondary"
                  />
                  {loginErrors.email && <p className="text-sm text-destructive">{loginErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-foreground font-medium">
                    Password
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={loginLoading}
                    className="h-11 border-input focus:border-secondary focus:ring-secondary"
                  />
                  {loginErrors.password && <p className="text-sm text-destructive">{loginErrors.password}</p>}
                </div>
                <Button 
                  type="submit" 
                  variant="cta" 
                  size="lg"
                  className="w-full" 
                  disabled={loginLoading}
                >
                  {loginLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <Link
                  to="/forgot-password"
                  className="text-sm text-secondary hover:text-secondary/80 font-medium transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <div className="space-y-1 mb-4">
                <CardTitle className="text-2xl font-heading font-bold text-foreground">
                  Create Account
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Enter your information to get started
                </CardDescription>
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-foreground font-medium">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={registerLoading}
                      className="h-11 border-input focus:border-secondary focus:ring-secondary"
                    />
                    {registerErrors.firstName && <p className="text-sm text-destructive">{registerErrors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-foreground font-medium">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={registerLoading}
                      className="h-11 border-input focus:border-secondary focus:ring-secondary"
                    />
                    {registerErrors.lastName && <p className="text-sm text-destructive">{registerErrors.lastName}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-foreground font-medium">
                    Email
                  </Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="you@example.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    disabled={registerLoading}
                    className="h-11 border-input focus:border-secondary focus:ring-secondary"
                  />
                  {registerErrors.email && <p className="text-sm text-destructive">{registerErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-foreground font-medium">
                    Password
                  </Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    disabled={registerLoading}
                    className="h-11 border-input focus:border-secondary focus:ring-secondary"
                  />
                  {registerErrors.password && <p className="text-sm text-destructive">{registerErrors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={registerLoading}
                    className="h-11 border-input focus:border-secondary focus:ring-secondary"
                  />
                  {registerErrors.confirmPassword && <p className="text-sm text-destructive">{registerErrors.confirmPassword}</p>}
                </div>
                <Button 
                  type="submit" 
                  variant="cta" 
                  size="lg"
                  className="w-full" 
                  disabled={registerLoading}
                >
                  {registerLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Index;
