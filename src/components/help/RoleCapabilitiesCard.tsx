import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, UserCircle } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

type Capability = {
  label: string;
  allowed: boolean;
};

export function RoleCapabilitiesCard() {
  const { role, isAdmin, isManager, canEdit, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardContent className="py-6">
          <div className="animate-pulse flex items-center gap-4">
            <div className="h-10 w-10 bg-muted rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-32"></div>
              <div className="h-3 bg-muted rounded w-48"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const capabilities: Capability[] = isAdmin 
    ? [
        { label: 'View all vendors and data', allowed: true },
        { label: 'Edit vendor information', allowed: true },
        { label: 'Create new vendors', allowed: true },
        { label: 'Delete vendors', allowed: true },
        { label: 'Manage users', allowed: true },
        { label: 'Manage catalog items', allowed: true },
        { label: 'View audit logs', allowed: true },
      ]
    : isManager
    ? [
        { label: 'View all vendors and data', allowed: true },
        { label: 'Edit vendor information', allowed: true },
        { label: 'Create new vendors', allowed: true },
        { label: 'Delete vendors', allowed: true },
        { label: 'Manage catalog items', allowed: true },
        { label: 'Manage users', allowed: false },
        { label: 'View audit logs', allowed: false },
      ]
    : canEdit // User role
    ? [
        { label: 'View all vendors and data', allowed: true },
        { label: 'Edit vendor information', allowed: true },
        { label: 'Add brands/products to vendors', allowed: true },
        { label: 'Create new vendors', allowed: false },
        { label: 'Delete vendors', allowed: false },
      ]
    : [ // Viewer role
        { label: 'View all vendors and data', allowed: true },
        { label: 'Search vendors by location', allowed: true },
        { label: 'Edit vendor information', allowed: false },
        { label: 'Create or delete vendors', allowed: false },
      ];

  const roleColor = isAdmin 
    ? 'bg-primary text-primary-foreground' 
    : isManager 
    ? 'bg-blue-500 text-white'
    : canEdit 
    ? 'bg-green-500 text-white'
    : 'bg-muted text-muted-foreground';

  return (
    <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCircle className="h-5 w-5 text-primary" />
            Your Capabilities
          </CardTitle>
          <Badge className={roleColor}>{role || 'Unknown'}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {capabilities.map((cap) => (
            <div key={cap.label} className="flex items-center gap-2 text-sm">
              {cap.allowed ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
              )}
              <span className={cap.allowed ? 'text-foreground' : 'text-muted-foreground'}>
                {cap.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
