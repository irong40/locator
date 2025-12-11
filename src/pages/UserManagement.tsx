import { useState } from 'react';
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
import { Loader2, UserPlus, Mail, Eye, Pencil, Trash2 } from 'lucide-react';
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserWithRole | null>(null);
  const [editRoleId, setEditRoleId] = useState<string>('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', firstName: '', lastName: '', roleId: '' });
  const [inviteErrors, setInviteErrors] = useState<Record<string, string>>({});

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
      const { data: existing } = await supabase
        .from('user_role_assignments')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_role_assignments')
          .update({ role_id: roleId })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_role_assignments')
          .insert({ user_id: userId, role_id: roleId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Role updated', description: 'User role has been changed.' });
      setEditDialogOpen(false);
      setEditUser(null);
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

  const handleEditClick = (user: UserWithRole) => {
    setEditUser(user);
    setEditRoleId(user.role_id || '');
    setEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (!editUser || !editRoleId) return;
    updateRoleMutation.mutate({ userId: editUser.user_id, roleId: editRoleId });
  };

  const handleDeleteClick = (user: UserWithRole) => {
    setSelectedUser(user);
    setDialogAction('deactivate');
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
                        {role.role_name}
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
                  {user.is_active ? (
                    <Badge className="bg-green-500 hover:bg-green-500 text-white uppercase text-xs font-semibold">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="uppercase text-xs font-semibold">
                      Inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
                      onClick={() => handleEditClick(user)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDeleteClick(user)}
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

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the role for {editUser ? getAbbreviatedName(editUser) : 'this user'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={updateRoleMutation.isPending}>
              {updateRoleMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate/Activate Confirmation Dialog */}
      <AlertDialog open={!!dialogAction} onOpenChange={() => setDialogAction(null)}>
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
    </div>
  );
};

export default UserManagement;
