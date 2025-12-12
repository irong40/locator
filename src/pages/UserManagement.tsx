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
import { Loader2, UserPlus, Mail, Eye, Pencil, Trash2, UserCheck, UserX, RefreshCw } from 'lucide-react';
import type { UserRole } from '@/lib/types';
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
};

type DialogActionType = 'activate' | 'deactivate' | 'delete' | 'resend-invite' | null;

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

      // Update role
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

  // Permanently delete user mutation
  const deleteUserMutation = useMutation({
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
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ 
        title: 'User Deleted', 
        description: 'The user has been permanently deleted from the system.' 
      });
      setDialogAction(null);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({ title: 'Delete Failed', description: error.message, variant: 'destructive' });
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

  // Resend invite mutation
  const resendInviteMutation = useMutation({
    mutationFn: async ({ userId, email, firstName }: { userId: string; email: string; firstName?: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        'https://zgutgcwzakyceylzwbry.supabase.co/functions/v1/resend-invite',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId, email, firstName }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to resend invite');
      return result;
    },
    onSuccess: () => {
      toast({ title: 'Invitation Resent', description: 'User will receive a new email to set up their account.' });
      setDialogAction(null);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({ title: 'Resend Failed', description: error.message, variant: 'destructive' });
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
    if (!selectedUser || dialogAction !== 'activate' && dialogAction !== 'deactivate') return;
    toggleActiveMutation.mutate({
      userId: selectedUser.user_id,
      isActive: dialogAction === 'activate',
    });
  };

  const handlePermanentDelete = () => {
    if (!selectedUser || dialogAction !== 'delete') return;
    deleteUserMutation.mutate(selectedUser.user_id);
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
      firstName: selectedUser.first_name || undefined,
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
                    {viewUser.is_active ? (
                      <Badge className="bg-green-500 hover:bg-green-500 text-white">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
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
              {deleteUserMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete Permanently
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
    </div>
  );
};

export default UserManagement;
