import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { AppLayout } from '@/components/layout/AppLayout';
import { AccessDenied } from '@/components/auth/AccessDenied';
import type { UserRole } from '@/lib/types';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import VendorDetail from './pages/VendorDetail';
import VendorCreate from './pages/VendorCreate';
import VendorSearch from './pages/VendorSearch';
import OemBrands from './pages/OemBrands';
import EngineBrands from './pages/EngineBrands';
import Products from './pages/Products';
import PaymentTypes from './pages/PaymentTypes';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import UserManagement from './pages/UserManagement';
import AuditLogs from './pages/AuditLogs';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { role, isLoading: roleLoading } = useUserRole();

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check role-based access if allowedRoles is specified
  if (allowedRoles && allowedRoles.length > 0) {
    if (!role || !allowedRoles.includes(role)) {
      return <AppLayout><AccessDenied /></AppLayout>;
    }
  }

  return <AppLayout>{children}</AppLayout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendors"
        element={
          <ProtectedRoute>
            <Vendors />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor-search"
        element={
          <ProtectedRoute>
            <VendorSearch />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendors/:id"
        element={
          <ProtectedRoute>
            <VendorDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendors/create"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager', 'User']}>
            <VendorCreate />
          </ProtectedRoute>
        }
      />
      {/* Catalog Management - Admin & Manager only */}
      <Route
        path="/oem-brands"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
            <OemBrands />
          </ProtectedRoute>
        }
      />
      <Route
        path="/engine-brands"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
            <EngineBrands />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
            <Products />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment-types"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
            <PaymentTypes />
          </ProtectedRoute>
        }
      />
      {/* Admin only */}
      <Route
        path="/user-management"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AuditLogs />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
