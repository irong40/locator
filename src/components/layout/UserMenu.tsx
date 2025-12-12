import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, LogOut, Shield, ChevronDown } from 'lucide-react';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const { role } = useUserRole();

  if (!user) return null;

  const getInitials = () => {
    const email = user.email || '';
    return email.substring(0, 2).toUpperCase();
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-3 px-3 py-2 h-auto hover:bg-accent/50 transition-colors"
        >
          <Avatar className="h-9 w-9 ring-2 ring-border">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          {role && (
            <Badge 
              variant={getRoleBadgeVariant(role)} 
              className="hidden sm:flex text-xs h-6 px-2 gap-1"
            >
              <Shield className="h-3 w-3" />
              {role}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-t-md">
          <Avatar className="h-12 w-12 ring-2 ring-border">
            <AvatarFallback className="bg-primary text-primary-foreground text-base font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.email}</p>
            {role && (
              <Badge 
                variant={getRoleBadgeVariant(role)} 
                className="w-fit text-xs h-5 px-2 gap-1"
              >
                <Shield className="h-3 w-3" />
                {role}
              </Badge>
            )}
          </div>
        </div>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem asChild className="py-2.5 px-3 cursor-pointer">
          <Link to="/profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem 
          onClick={signOut} 
          className="py-2.5 px-3 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
