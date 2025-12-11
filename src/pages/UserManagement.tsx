import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { Users, Shield, UserCheck, UserX, Loader2, UserPlus, Mail } from 'lucide-react';
import type { UserRole } from '@/lib/types';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  roleId: z.string().uuid('Please select a role'),
});

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
};

const UserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [dialogAction, setDialogAction] = useState<'activate' | 'deactivate' | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', firstName: '', lastName: '', roleId: '' });
  const [inviteErrors, setInviteErrors] = useState<Record<string, string>>({});

  // Fetch all users with their roles
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get all role assignments
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

      // Merge profiles with roles
      const usersWithRoles: UserWithRole[] = profiles.map((profile) => {
        const assignment = assignments?.find((a) => a.user_id === profile.user_id);
        return {
          ...profile,
          role_name: (assignment?.user_roles?.role_name as UserRole) || null,
          role_id: assignment?.role_id || null,
        };
      });

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

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      // Check if assignment exists
      const { data: existing } = await supabase
        .from('user_role_assignments')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        // Update existing assignment
        const { error } = await supabase
          .from('user_role_assignments')
          .update({ role_id: roleId })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // Create new assignment
        const { error } = await supabase
          .from('user_role_assignments')
          .insert({ user_id: userId, role_id: roleId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Role updated', description: 'User role has been changed.' });
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

  // Send invite mutation
  const inviteMutation = useMutation({
    mutationFn: async (formData: typeof inviteForm) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        'https://zgutgcwzakyceylzwbry.supabase.co/functions/v1/send-invite',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to send invite');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Invitation Sent', description: 'User will receive an email to set up their account.' });
      setInviteOpen(false);
      setInviteForm({ email: '', firstName: '', lastName: '', roleId: '' });
      setInviteErrors({});
    },
    onError: (error) => {
      toast({ title: 'Invitation Failed', description: error.message, variant: 'destructive' });
    },
  });

  const handleRoleChange = (userId: string, roleId: string) => {
    updateRoleMutation.mutate({ userId, roleId });
  };

  const handleInviteSubmit = () => {
    const result = inviteSchema.safeParse(inviteForm);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0].toString()] = err.message;
      });
      setInviteErrors(errors);
      return;
    }
    setInviteErrors({});
    inviteMutation.mutate(inviteForm);
  };

  const handleToggleActive = () => {
    if (!selectedUser || !dialogAction) return;
    toggleActiveMutation.mutate({
      userId: selectedUser.user_id,
      isActive: dialogAction === 'activate',
    });
  };

  const getRoleBadgeVariant = (role: string | null): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case 'Admin': return 'destructive';
      case 'Manager': return 'default';
      case 'User': return 'secondary';
      case 'Viewer': return 'outline';
      default: return 'outline';
    }
  };

  const getFullName = (user: UserWithRole) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return 'No name set';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts, roles, and access permissions
          </p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an email invitation to add a new user to the system.
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
                        <Badge variant={getRoleBadgeVariant(role.role_name)}>
                          {role.role_name}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {inviteErrors.roleId && (
                  <p className="text-sm text-destructive">{inviteErrors.roleId}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteSubmit} disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            All Users ({users?.length || 0})
          </CardTitle>
          <CardDescription>
            View and manage all registered users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id} className={!user.is_active ? 'opacity-60' : ''}>
                  <TableCell className="font-medium">
                    {getFullName(user)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.phone_no || '-'}
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        <UserX className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role_id || ''}
                      onValueChange={(value) => handleRoleChange(user.user_id, value)}
                      disabled={updateRoleMutation.isPending}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue>
                          {user.role_name ? (
                            <Badge variant={getRoleBadgeVariant(user.role_name)}>
                              {user.role_name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">No role</span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {roles?.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <Badge variant={getRoleBadgeVariant(role.role_name)}>
                              {role.role_name}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.created_at 
                      ? new Date(user.created_at).toLocaleDateString() 
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.is_active ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setDialogAction('deactivate');
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setDialogAction('activate');
                        }}
                        className="text-green-600 hover:text-green-600"
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Activate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(!users || users.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!dialogAction} onOpenChange={() => setDialogAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogAction === 'deactivate' ? 'Deactivate Account?' : 'Activate Account?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogAction === 'deactivate' 
                ? `This will prevent ${getFullName(selectedUser!)} from accessing the system. You can reactivate the account later.`
                : `This will allow ${getFullName(selectedUser!)} to access the system again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleActive}
              className={dialogAction === 'deactivate' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {toggleActiveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {dialogAction === 'deactivate' ? 'Deactivate' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
