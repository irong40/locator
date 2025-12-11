import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { UserRole } from '@/lib/types';

type UserRoleData = {
  role: UserRole | null;
  isAdmin: boolean;
  isManager: boolean;
  canEdit: boolean;
  canView: boolean;
  isLoading: boolean;
  error: Error | null;
};

export function useUserRole(): UserRoleData {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_role_assignments')
        .select(`
          role_id,
          user_roles!inner (
            role_name
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      // Handle the nested structure from the join
      const roleName = data?.user_roles?.role_name as UserRole | null;
      return roleName;
    },
    enabled: !!user?.id,
  });

  const role = data ?? null;

  return {
    role,
    isAdmin: role === 'Admin',
    isManager: role === 'Manager',
    canEdit: role === 'Admin' || role === 'Manager' || role === 'User',
    canView: true, // All authenticated users can view
    isLoading,
    error: error as Error | null,
  };
}
