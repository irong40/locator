import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Mail, Eye, Pencil, Trash2, UserCheck, UserX, RefreshCw, Users, Clock, AlertTriangle, Undo2, Copy, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { UserRole } from '@/lib/types';

// Login status types and helpers
type LoginStatus = 'pending' | 'active' | 'stale' | 'inactive';

const getLoginStatus = (lastSignIn: string | null): { status: LoginStatus; daysSince: number | null } => {
  if (!lastSignIn) return { status: 'pending', daysSince: null };
  
  const lastLogin = new Date(lastSignIn);
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSince <= 30) return { status: 'active', daysSince };
  if (daysSince <= 60) return { status: 'stale', daysSince };
  return { status: 'inactive', daysSince };
};

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-orange-500 hover:bg-orange-500 text-white', icon: Clock },
  active: { label: 'Active', className: 'bg-green-500 hover:bg-green-500 text-white', icon: UserCheck },
  stale: { label: 'Stale', className: 'bg-yellow-500 hover:bg-yellow-500 text-black', icon: AlertTriangle },
  inactive: { label: 'Inactive', className: 'bg-red-500 hover:bg-red-500 text-white', icon: UserX },
};
import { inviteSchema, profileEditSchema } from '@/lib/schemas/user';

type UserWithRole = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_no: string | null;
  is_active: boolean;
  created_at: string | null;
  role_name: UserRole | null;
  role_id: string | null;
  last_sign_in_at: string | null;
};

type DialogActionType = 'activate' | 'deactivate' | 'delete' | 'resend-invite' | null;

// Simple copy button with feedback
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
};

const UserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [dialogAction, setDialogAction] = useState<DialogActionType>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewUser, setViewUser] = useState<UserWithRole | null>(null);
  const [editUser, setEditUser] = useState<UserWithRole | null>(null);
  const [editRoleId, setEditRoleId] = useState<string>('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', firstName: '', lastName: '', roleId: '', sendInvite: true, password: '' });
  const [inviteErrors, setInviteErrors] = useState<Record<string, string>>({});
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [bulkResetDialogOpen, setBulkResetDialogOpen] = useState(false);

  // Fetch all users with their roles
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_role_assignments')
        .select(`
          user_id,
          role_id,
          user_roles!inner (
            role_name
          )
        `);

      if (assignmentsError) throw assignmentsError;

      const usersWithRoles: UserWithRole[] = await Promise.all(
        profiles.map(async (profile) => {
          const assignment = assignments?.find((a) => a.user_id === profile.user_id);
          
          // Fetch last_sign_in_at from auth.users via RPC
          const { data: lastSignIn } = await supabase.rpc('get_user_last_sign_in', { 
            _user_id: profile.user_id 
          });
          
          return {
            ...profile,
            role_name: (assignment?.user_roles?.role_name as UserRole) || null,
            role_id: assignment?.role_id || null,
            last_sign_in_at: lastSignIn || null,
          };
        })
      );

      return usersWithRoles;
    },
  });

  // Fetch available roles
  const { data: roles } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('role_name');
      if (error) throw error;
      return data;
    },
  });

  // Update user profile and role mutation
  const updateProfileMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      firstName, 
      lastName, 
      phone, 
      roleId 
    }: { 
      userId: string; 
      firstName: string; 
      lastName: string; 
      phone: string; 
      roleId: string;
    }) => {
      // Update profile fields
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_no: phone.trim() || null,
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Update role using delete + insert pattern for reliability
      // First delete any existing role assignment
      await supabase
        .from('user_role_assignments')
        .delete()
        .eq('user_id', userId);

      // Then insert the new role
      const { error: roleError } = await supabase
        .from('user_role_assignments')
        .insert({ user_id: userId, role_id: roleId });
      
      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'User Updated', description: 'Profile and role have been saved.' });
      setEditDialogOpen(false);
      setEditUser(null);
      setEditErrors({});
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Toggle user active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: isActive ? 'Account Activated' : 'Account Deactivated',
        description: isActive 
          ? 'User can now access the system.' 
          : 'User has been deactivated and cannot log in.',
      });
      setDialogAction(null);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Track pending deletions for undo functionality
  const pendingDeletions = useRef<Map<string, { timeout: NodeJS.Timeout; user: UserWithRole }>>(new Map());
  const UNDO_TIMEOUT_MS = 8000; // 8 seconds to undo

  // Actual delete mutation (called after undo window expires)
  const executeDeleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        'https://zgutgcwzakyceylzwbry.supabase.co/functions/v1/delete-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete user');
      return { userId, result };
    },
    onSuccess: ({ userId }) => {
      pendingDeletions.current.delete(userId);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error, userId) => {
      // Restore user on failure
      const pending = pendingDeletions.current.get(userId);
      if (pending) {
        const previousUsers = queryClient.getQueryData<UserWithRole[]>(['admin-users']);
        if (previousUsers) {
          queryClient.setQueryData<UserWithRole[]>(
            ['admin-users'],
            [...previousUsers, pending.user].sort((a, b) => 
              (a.email || '').localeCompare(b.email || '')
            )
          );
        }
        pendingDeletions.current.delete(userId);
      }
      toast({ title: 'Delete Failed', description: error.message, variant: 'destructive' });
    },
  });

  // Undo delete - restore user to list
  const undoDelete = useCallback((userId: string) => {
    const pending = pendingDeletions.current.get(userId);
    if (!pending) return;

    // Clear the timeout to prevent actual deletion
    clearTimeout(pending.timeout);
    
    // Restore user to the list
    const previousUsers = queryClient.getQueryData<UserWithRole[]>(['admin-users']);
    if (previousUsers) {
      queryClient.setQueryData<UserWithRole[]>(
        ['admin-users'],
        [...previousUsers, pending.user].sort((a, b) => 
          (a.email || '').localeCompare(b.email || '')
        )
      );
    }
    
    pendingDeletions.current.delete(userId);
    toast({ 
      title: 'Delete Cancelled', 
      description: `${pending.user.first_name || pending.user.email} has been restored.` 
    });
  }, [queryClient, toast]);

  // Initiate delete with undo option
  const initiateDelete = useCallback((user: UserWithRole) => {
    const userId = user.user_id;
    
    // Optimistically remove from list
    const previousUsers = queryClient.getQueryData<UserWithRole[]>(['admin-users']);
    if (previousUsers) {
      queryClient.setQueryData<UserWithRole[]>(
        ['admin-users'],
        previousUsers.filter((u) => u.user_id !== userId)
      );
    }

    // Set timeout for actual deletion
    const timeout = setTimeout(() => {
      executeDeleteMutation.mutate(userId);
    }, UNDO_TIMEOUT_MS);

    // Store pending deletion info
    pendingDeletions.current.set(userId, { timeout, user });

    // Close dialog
    setDialogAction(null);
    setSelectedUser(null);

    // Show toast with undo button
    toast({
      title: 'User Scheduled for Deletion',
      description: (
        <div className="flex items-center justify-between gap-4">
          <span>{user.first_name || user.email} will be deleted in {UNDO_TIMEOUT_MS / 1000}s</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => undoDelete(userId)}
            className="shrink-0"
          >
            <Undo2 className="h-4 w-4 mr-1" />
            Undo
          </Button>
        </div>
      ),
      duration: UNDO_TIMEOUT_MS,
    });
  }, [queryClient, toast, executeDeleteMutation, undoDelete]);

  // Send invite mutation
  const inviteMutation = useMutation({
    mutationFn: async (formData: { email: string; firstName: string; lastName: string; roleId: string }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return { ok: false as const, status: 401, error: 'Not authenticated' };
      }

      try {
        const response = await fetch(
          'https://zgutgcwzakyceylzwbry.supabase.co/functions/v1/invite-user-builtin',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(formData),
          }
        );

        const parsed = (await response.json().catch(() => null)) as unknown;
        const parsedObj = parsed as { error?: unknown; userId?: unknown } | null;

        const errorMessage =
          typeof parsedObj?.error === 'string'
            ? parsedObj.error
            : `Invite failed (HTTP ${response.status})`;

        if (!response.ok) {
          return { ok: false as const, status: response.status, error: errorMessage };
        }

        if (typeof parsedObj?.userId !== 'string' || parsedObj.userId.trim() === '') {
          return {
            ok: false as const,
            status: 500,
            error: 'Invite succeeded but response was missing userId',
          };
        }

        return { ok: true as const, userId: parsedObj.userId };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Network error';
        return { ok: false as const, status: 0, error: message };
      }
    },
    onSuccess: (result) => {
      if (!result.ok) {
        const message = result.error || 'Failed to send invitation';
        const isUserExists =
          message.toLowerCase().includes('already registered') ||
          message.toLowerCase().includes('already exists');
        const isEmailFailed =
          message.toLowerCase().includes('failed to send') &&
          message.toLowerCase().includes('email');

        if (isUserExists) {
          toast({
            title: 'User Already Exists',
            description:
              'This email is already registered. Find the user in the list and click "Resend Invite" to send a new invitation link.',
          });
        } else if (isEmailFailed) {
          toast({
            title: 'Email Delivery Failed',
            description:
              'The user was created but the invitation email failed. Use "Resend Invite" to try again.',
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Invitation Failed', description: message, variant: 'destructive' });
        }

        return;
      }

      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Invitation Sent',
        description: 'User will receive an email to set up their account.',
      });
      setInviteOpen(false);
      setInviteForm({ email: '', firstName: '', lastName: '', roleId: '', sendInvite: true, password: '' });
      setInviteErrors({});
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to send invitation';
      toast({ title: 'Invitation Failed', description: message, variant: 'destructive' });
    },
  });

  // Create user directly (without invitation email)
  const createUserMutation = useMutation({
    mutationFn: async (formData: { email: string; firstName: string; lastName: string; roleId: string; password?: string }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        'https://zgutgcwzakyceylzwbry.supabase.co/functions/v1/create-user-builtin',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create user');
      return result as { success: boolean; userId: string; password?: string; warning?: string };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      
      if (result.warning) {
        toast({
          title: 'User Created with Warning',
          description: result.warning,
          variant: 'destructive',
        });
      }

      // If password was auto-generated, show credentials
      if (result.password) {
        setCreatedCredentials({ email: inviteForm.email, password: result.password });
      } else {
        toast({
          title: 'User Created',
          description: 'User account has been created successfully.',
        });
        setInviteOpen(false);
      }
      
      setInviteForm({ email: '', firstName: '', lastName: '', roleId: '', sendInvite: true, password: '' });
      setInviteErrors({});
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      toast({ title: 'User Creation Failed', description: message, variant: 'destructive' });
    },
  });

  // Password reset mutation (uses custom edge function with Resend for proper email formatting)
  const resendInviteMutation = useMutation({
    mutationFn: async ({ userId, email }: { userId: string; email: string }) => {
      const { data, error } = await supabase.functions.invoke('reinvite-user-builtin', {
        body: { userId, email },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Password Reset Sent', description: 'User will receive an email with a link to set their password.' });
      setDialogAction(null);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({ title: 'Reset Failed', description: error.message, variant: 'destructive' });
    },
  });

  // Bulk password reset mutation for legacy users
  const bulkResetMutation = useMutation({
    mutationFn: async () => {
      // Get all active users with emails (legacy users who need password reset)
      const usersToReset = users?.filter(
        (u) => u.is_active && u.email && u.email.trim() !== ''
      ) || [];

      if (usersToReset.length === 0) {
        throw new Error('No active users with emails found');
      }

      const results = { success: 0, failed: 0, errors: [] as string[] };

      // Process sequentially to avoid rate limiting
      for (const user of usersToReset) {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(user.email!, {
            redirectTo: 'https://locator.dradamopierce.com/reset-password',
          });
          if (error) {
            results.failed++;
            results.errors.push(`${user.email}: ${error.message}`);
          } else {
            results.success++;
          }
          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (err) {
          results.failed++;
          results.errors.push(`${user.email}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setBulkResetDialogOpen(false);
      if (results.failed > 0) {
        toast({
          title: 'Bulk Reset Completed with Errors',
          description: `${results.success} sent, ${results.failed} failed. Check console for details.`,
          variant: 'destructive',
        });
        console.error('Bulk reset errors:', results.errors);
      } else {
        toast({
          title: 'Bulk Reset Complete',
          description: `Password reset emails sent to ${results.success} users.`,
        });
      }
    },
    onError: (error) => {
      toast({ title: 'Bulk Reset Failed', description: error.message, variant: 'destructive' });
    },
  });

  const handleInviteSubmit = () => {
    const result = inviteSchema.safeParse({
      email: inviteForm.email,
      firstName: inviteForm.firstName,
      lastName: inviteForm.lastName,
      roleId: inviteForm.roleId,
    });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0].toString()] = err.message;
      });
      setInviteErrors(errors);
      return;
    }

    // Validate password if creating directly (not sending invite)
    if (!inviteForm.sendInvite && inviteForm.password && inviteForm.password.length > 0 && inviteForm.password.length < 8) {
      setInviteErrors({ password: 'Password must be at least 8 characters' });
      return;
    }

    setInviteErrors({});

    if (inviteForm.sendInvite) {
      // Send invitation email
      inviteMutation.mutate({
        email: inviteForm.email,
        firstName: inviteForm.firstName,
        lastName: inviteForm.lastName,
        roleId: inviteForm.roleId,
      });
    } else {
      // Create user directly without email
      createUserMutation.mutate({
        email: inviteForm.email,
        firstName: inviteForm.firstName,
        lastName: inviteForm.lastName,
        roleId: inviteForm.roleId,
        password: inviteForm.password || undefined,
      });
    }
  };

  const handleToggleActive = () => {
    if (!selectedUser || dialogAction !== 'activate' && dialogAction !== 'deactivate') return;
    toggleActiveMutation.mutate({
      userId: selectedUser.user_id,
      isActive: dialogAction === 'activate',
    });
  };

  const handlePermanentDelete = () => {
    if (!selectedUser || dialogAction !== 'delete') return;
    initiateDelete(selectedUser);
  };

  const handleEditClick = (user: UserWithRole) => {
    setEditUser(user);
    setEditFirstName(user.first_name || '');
    setEditLastName(user.last_name || '');
    setEditPhone(user.phone_no || '');
    setEditRoleId(user.role_id || '');
    setEditErrors({});
    setEditDialogOpen(true);
  };

  const handleViewClick = (user: UserWithRole) => {
    setViewUser(user);
    setViewDialogOpen(true);
  };

  const handleEditSave = () => {
    if (!editUser) return;

    const result = profileEditSchema.safeParse({
      firstName: editFirstName,
      lastName: editLastName,
      phone: editPhone,
      roleId: editRoleId,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0].toString()] = err.message;
      });
      setEditErrors(errors);
      return;
    }

    setEditErrors({});
    updateProfileMutation.mutate({
      userId: editUser.user_id,
      firstName: editFirstName,
      lastName: editLastName,
      phone: editPhone,
      roleId: editRoleId,
    });
  };

  const handleActivateClick = (user: UserWithRole) => {
    setSelectedUser(user);
    setDialogAction('activate');
  };

  const handleDeactivateClick = (user: UserWithRole) => {
    setSelectedUser(user);
    setDialogAction('deactivate');
  };

  const handleDeleteClick = (user: UserWithRole) => {
    setSelectedUser(user);
    setDialogAction('delete');
  };

  const handleResendInviteClick = (user: UserWithRole) => {
    setSelectedUser(user);
    setDialogAction('resend-invite');
  };

  const handleResendInvite = () => {
    if (!selectedUser || dialogAction !== 'resend-invite') return;
    resendInviteMutation.mutate({
      userId: selectedUser.user_id,
      email: selectedUser.email || '',
    });
  };

  // Full name helper
  const getFullName = (user: UserWithRole) => {
    const first = user.first_name?.trim();
    const last = user.last_name?.trim();
    if (first && last) return `${first} ${last}`;
    if (last) return last;
    if (first) return first;
    return 'No name';
  };

  // Abbreviated name: First initial + Last name (e.g., "A Pierce")
  const getAbbreviatedName = (user: UserWithRole) => {
    const first = user.first_name?.trim();
    const last = user.last_name?.trim();
    if (first && last) {
      return `${first.charAt(0)} ${last}`;
    }
    if (last) return last;
    if (first) return first;
    return 'No name';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/user-management">Users</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Manage Users</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header with Invite Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-semibold text-foreground">
          Users List
        </h1>
        <div className="flex items-center gap-2">
          {/* Bulk Password Reset Dialog */}
          <AlertDialog open={bulkResetDialogOpen} onOpenChange={setBulkResetDialogOpen}>
            <Button
              variant="outline"
              onClick={() => setBulkResetDialogOpen(true)}
              disabled={bulkResetMutation.isPending}
            >
              {bulkResetMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              Bulk Password Reset
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Bulk Password Reset</AlertDialogTitle>
                <AlertDialogDescription>
                  This will send password reset emails to all {users?.filter((u) => u.is_active && u.email).length || 0} active users.
                  This is useful for legacy users who need to set their passwords.
                  <br /><br />
                  <strong>Are you sure you want to proceed?</strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => bulkResetMutation.mutate()}
                  disabled={bulkResetMutation.isPending}
                >
                  {bulkResetMutation.isPending ? 'Sending...' : 'Send Reset Emails'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={inviteOpen} onOpenChange={(open) => {
            setInviteOpen(open);
            if (!open) {
              setInviteForm({ email: '', firstName: '', lastName: '', roleId: '', sendInvite: true, password: '' });
              setInviteErrors({});
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{inviteForm.sendInvite ? 'Invite New User' : 'Create User Directly'}</DialogTitle>
                <DialogDescription>
                  {inviteForm.sendInvite 
                    ? 'Send an email invitation to add a new user to the system.'
                    : 'Create a user account directly without sending an invitation email.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={inviteForm.firstName}
                      onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                      placeholder="John"
                    />
                    {inviteErrors.firstName && (
                      <p className="text-sm text-destructive">{inviteErrors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={inviteForm.lastName}
                      onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                      placeholder="Doe"
                    />
                    {inviteErrors.lastName && (
                      <p className="text-sm text-destructive">{inviteErrors.lastName}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="john.doe@example.com"
                  />
                  {inviteErrors.email && (
                    <p className="text-sm text-destructive">{inviteErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={inviteForm.roleId}
                    onValueChange={(value) => setInviteForm({ ...inviteForm, roleId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles?.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.role_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {inviteErrors.roleId && (
                    <p className="text-sm text-destructive">{inviteErrors.roleId}</p>
                  )}
                </div>

                {/* Toggle: Send Invite vs Create Directly */}
                <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
                  <div className="space-y-0.5">
                    <Label htmlFor="send-invite" className="font-medium">Send invitation email</Label>
                    <p className="text-xs text-muted-foreground">
                      {inviteForm.sendInvite 
                        ? 'User will receive an email to set their password'
                        : 'Create account directly - share credentials manually'}
                    </p>
                  </div>
                  <Switch
                    id="send-invite"
                    checked={inviteForm.sendInvite}
                    onCheckedChange={(checked) => setInviteForm({ ...inviteForm, sendInvite: checked, password: '' })}
                  />
                </div>

                {/* Password field - only shown when creating directly */}
                {!inviteForm.sendInvite && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password (optional)</Label>
                    <Input
                      id="password"
                      type="text"
                      value={inviteForm.password}
                      onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                      placeholder="Leave blank to auto-generate"
                    />
                    {inviteErrors.password && (
                      <p className="text-sm text-destructive">{inviteErrors.password}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      If left blank, a secure password will be generated and shown after creation.
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleInviteSubmit} 
                  disabled={inviteMutation.isPending || createUserMutation.isPending}
                >
                  {(inviteMutation.isPending || createUserMutation.isPending) ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : inviteForm.sendInvite ? (
                    <Mail className="h-4 w-4 mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  {inviteForm.sendInvite ? 'Send Invitation' : 'Create User'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold uppercase text-xs tracking-wide">Name</TableHead>
              <TableHead className="font-semibold uppercase text-xs tracking-wide">Email</TableHead>
              <TableHead className="font-semibold uppercase text-xs tracking-wide">Role</TableHead>
              <TableHead className="font-semibold uppercase text-xs tracking-wide">Status</TableHead>
              <TableHead className="font-semibold uppercase text-xs tracking-wide text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id} className={!user.is_active ? 'opacity-60' : ''}>
                <TableCell className="font-medium">
                  {getAbbreviatedName(user)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.email || '-'}
                </TableCell>
                <TableCell>
                  {user.role_name || 'No role'}
                </TableCell>
                <TableCell>
                  {(() => {
                    const { status, daysSince } = getLoginStatus(user.last_sign_in_at);
                    const config = statusConfig[status];
                    const Icon = config.icon;
                    const label = status === 'inactive' && daysSince !== null
                      ? `${config.label} (${daysSince} days)`
                      : config.label;
                    return (
                      <Badge className={`${config.className} uppercase text-xs font-semibold`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {label}
                      </Badge>
                    );
                  })()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* View Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                      onClick={() => handleViewClick(user)}
                      title="View user details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {/* Edit Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
                      onClick={() => handleEditClick(user)}
                      title="Edit user role"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {/* Resend Invite Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-purple-500 text-purple-500 hover:bg-purple-50 hover:text-purple-600"
                      onClick={() => handleResendInviteClick(user)}
                      title="Resend invitation email"
                      disabled={!user.email}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    {/* Activate/Deactivate Button */}
                    {user.is_active ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                        onClick={() => handleDeactivateClick(user)}
                        title="Deactivate user"
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                        onClick={() => handleActivateClick(user)}
                        title="Activate user"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    )}
                    {/* Delete Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDeleteClick(user)}
                      title="Permanently delete user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Viewing information for {viewUser ? getFullName(viewUser) : 'this user'}.
            </DialogDescription>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">First Name</Label>
                  <p className="font-medium">{viewUser.first_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">Last Name</Label>
                  <p className="font-medium">{viewUser.last_name || '-'}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase">Email</Label>
                <p className="font-medium">{viewUser.email || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase">Phone</Label>
                <p className="font-medium">{viewUser.phone_no || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">Role</Label>
                  <p className="font-medium">{viewUser.role_name || 'No role'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">Status</Label>
                  <p className="font-medium">
                    {(() => {
                      const { status, daysSince } = getLoginStatus(viewUser.last_sign_in_at);
                      const config = statusConfig[status];
                      const Icon = config.icon;
                      const label = status === 'inactive' && daysSince !== null
                        ? `${config.label} (${daysSince} days)`
                        : config.label;
                      return (
                        <Badge className={config.className}>
                          <Icon className="h-3 w-3 mr-1" />
                          {label}
                        </Badge>
                      );
                    })()}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase">Created</Label>
                <p className="font-medium">{formatDate(viewUser.created_at)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update profile information and role for {editUser ? editUser.email : 'this user'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  placeholder="First name"
                />
                {editErrors.firstName && (
                  <p className="text-sm text-destructive">{editErrors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  placeholder="Last name"
                />
                {editErrors.lastName && (
                  <p className="text-sm text-destructive">{editErrors.lastName}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">Phone Number</Label>
              <Input
                id="editPhone"
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Phone number (optional)"
              />
              {editErrors.phone && (
                <p className="text-sm text-destructive">{editErrors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Select value={editRoleId} onValueChange={setEditRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editErrors.roleId && (
                <p className="text-sm text-destructive">{editErrors.roleId}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate/Deactivate Confirmation Dialog */}
      <AlertDialog open={dialogAction === 'activate' || dialogAction === 'deactivate'} onOpenChange={() => setDialogAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogAction === 'deactivate' ? 'Deactivate User?' : 'Activate User?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogAction === 'deactivate'
                ? `This will prevent ${selectedUser ? getAbbreviatedName(selectedUser) : 'this user'} from accessing the system. You can reactivate their account later.`
                : `This will allow ${selectedUser ? getAbbreviatedName(selectedUser) : 'this user'} to access the system again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleActive}
              className={dialogAction === 'deactivate' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {toggleActiveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {dialogAction === 'deactivate' ? 'Deactivate' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog open={dialogAction === 'delete'} onOpenChange={() => setDialogAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Permanently Delete User?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will permanently delete <strong>{selectedUser ? getFullName(selectedUser) : 'this user'}</strong> from the system.
              </p>
              <p className="text-destructive font-semibold">
                ⚠️ This action cannot be undone. All user data will be permanently removed.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resend Invite Confirmation Dialog */}
      <AlertDialog open={dialogAction === 'resend-invite'} onOpenChange={() => setDialogAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Resend Invitation?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will send a new invitation email to <strong>{selectedUser?.email}</strong> with a link to set up their password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResendInvite}>
              {resendInviteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Resend Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Created User Credentials Dialog */}
      <Dialog open={!!createdCredentials} onOpenChange={(open) => !open && setCreatedCredentials(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              User Created Successfully
            </DialogTitle>
            <DialogDescription>
              Share these credentials with the user. Make sure to copy them now - the password cannot be retrieved later.
            </DialogDescription>
          </DialogHeader>
          {createdCredentials && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Email</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background px-2 py-1 rounded text-sm font-mono">
                      {createdCredentials.email}
                    </code>
                    <CopyButton text={createdCredentials.email} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Password</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background px-2 py-1 rounded text-sm font-mono">
                      {createdCredentials.password}
                    </code>
                    <CopyButton text={createdCredentials.password} />
                  </div>
                </div>
              </div>
              <Button 
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`
                  );
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All Credentials
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreatedCredentials(null);
              setInviteOpen(false);
            }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
