import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import logoIcon from '@/assets/logo-icon.jpeg';

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
        <h1 className="text-4xl font-heading font-bold text-white mb-2">
          C&R Repair Solutions
        </h1>
        <p className="text-secondary font-sans">Vendor Management System</p>
      </div>
      <LoginForm />
    </div>
  );
};

export default Index;