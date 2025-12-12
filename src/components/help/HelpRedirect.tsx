import { Navigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

export function HelpRedirect() {
  const { role, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Admins and Managers go to admin help guide
  if (role === 'Admin' || role === 'Manager') {
    return <Navigate to="/help/admin" replace />;
  }

  // Users and Viewers go to user help guide
  return <Navigate to="/help/user" replace />;
}
