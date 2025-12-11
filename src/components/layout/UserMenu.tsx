import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium text-foreground truncate max-w-[150px]">
              {user.email}
            </span>
            {role && (
              <Badge variant={getRoleBadgeVariant(role)} className="text-xs h-5 px-1.5">
                <Shield className="h-3 w-3 mr-1" />
                {role}
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.email}</p>
            {role && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {role}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer">
            <User className="h-4 w-4 mr-2" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
