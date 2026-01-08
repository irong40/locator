import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useRecoveryRedirect } from '@/hooks/useRecoveryRedirect';
import { AppLayout } from '@/components/layout/AppLayout';
import { AccessDenied } from '@/components/auth/AccessDenied';
import { MaintenanceErrorBoundary, ReportIssueButton } from '@/components/maintenance';
import { maintenanceAgent } from '@/lib/maintenance-agent';
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
import DataMigration from './pages/DataMigration';
import HelpGuideUser from './pages/HelpGuideUser';
import HelpGuideAdmin from './pages/HelpGuideAdmin';
import { HelpRedirect } from './components/help/HelpRedirect';
import TroubleTickets from './pages/TroubleTickets';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

// Configure maintenance agent for Mission Control
maintenanceAgent.configure({
  supabaseUrl: 'https://zgutgcwzakyceylzwbry.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpndXRnY3d6YWt5Y2V5bHp3YnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTEyNjYsImV4cCI6MjA3MjkyNzI2Nn0.da-8PwDuznS_-4eG74Jry8rqV2oM_f6nV3tcKQGPclY',
});

// Component that handles recovery redirect detection
function RecoveryRedirectHandler() {
  useRecoveryRedirect();
  return null;
}

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
    <>
      <RecoveryRedirectHandler />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
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
      <Route
        path="/data-migration"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <DataMigration />
          </ProtectedRoute>
        }
      />
      <Route
        path="/help"
        element={
          <ProtectedRoute>
            <HelpRedirect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/help/user"
        element={
          <ProtectedRoute>
            <HelpGuideUser />
          </ProtectedRoute>
        }
      />
      <Route
        path="/help/admin"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
            <HelpGuideAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trouble-tickets"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <TroubleTickets />
          </ProtectedRoute>
        }
      />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <MaintenanceErrorBoundary>
            <AppRoutes />
            <ReportIssueButton />
          </MaintenanceErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
