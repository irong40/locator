import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { Wrench } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="mb-8 text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
          <Wrench className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2">C&R Repair Solutions</h1>
        <p className="text-muted-foreground">Vendor Management System</p>
      </div>
      <LoginForm />
    </div>
  );
};

export default Index;
