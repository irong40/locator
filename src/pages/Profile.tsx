import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, Shield, Save } from 'lucide-react';
import { z } from 'zod';

const profileSchema = z.object({
  firstName: z.string().max(50, 'First name too long').optional(),
  lastName: z.string().max(50, 'Last name too long').optional(),
  phoneNo: z.string().max(20, 'Phone number too long').optional(),
});

type ProfileData = {
  first_name: string | null;
  last_name: string | null;
  phone_no: string | null;
};

const Profile = () => {
  const { user } = useAuth();
  const { role, isLoading: roleLoading } = useUserRole();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; phoneNo?: string }>({});

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone_no')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        }
        
        if (data) {
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
          setPhoneNo(data.phone_no || '');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = profileSchema.safeParse({
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      phoneNo: phoneNo || undefined,
    });

    if (!validation.success) {
      const fieldErrors: { firstName?: string; lastName?: string; phoneNo?: string } = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0] as keyof typeof fieldErrors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!user) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName || null,
          last_name: lastName || null,
          phone_no: phoneNo || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been saved successfully.',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'Admin': return 'destructive';
      case 'Manager': return 'default';
      case 'User': return 'secondary';
      case 'Viewer': return 'outline';
      default: return 'outline';
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>Your personal details and role</CardDescription>
            </div>
            <Badge variant={getRoleBadgeVariant(role)} className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {role || 'No Role'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="h-11 bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-foreground font-medium">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={saving}
                  className="h-11 border-input focus:border-secondary focus:ring-secondary"
                />
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-foreground font-medium">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={saving}
                  className="h-11 border-input focus:border-secondary focus:ring-secondary"
                />
                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNo" className="text-foreground font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Phone Number
              </Label>
              <Input
                id="phoneNo"
                type="tel"
                placeholder="(555) 123-4567"
                value={phoneNo}
                onChange={(e) => setPhoneNo(e.target.value)}
                disabled={saving}
                className="h-11 border-input focus:border-secondary focus:ring-secondary"
              />
              {errors.phoneNo && <p className="text-sm text-destructive">{errors.phoneNo}</p>}
            </div>

            <Button 
              type="submit" 
              variant="cta" 
              disabled={saving}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
