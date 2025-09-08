import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Building2, 
  Package, 
  Wrench, 
  CreditCard, 
  Users, 
  FileText,
  LogOut,
  Store
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navigation = {
  Admin: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Vendors', href: '/vendors', icon: Building2 },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Engine Brands', href: '/engine-brands', icon: Wrench },
    { name: 'Payment Types', href: '/payment-types', icon: CreditCard },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Audit Logs', href: '/audit-logs', icon: FileText },
  ],
  VendorAdmin: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Vendor', href: '/my-vendor', icon: Store },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Engine Brands', href: '/engine-brands', icon: Wrench },
    { name: 'Team', href: '/team', icon: Users },
  ],
  Staff: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Engine Brands', href: '/engine-brands', icon: Wrench },
  ],
  Viewer: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Vendors', href: '/vendors', icon: Building2 },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Engine Brands', href: '/engine-brands', icon: Wrench },
  ],
};

export const AppSidebar = () => {
  const { userRole, signOut, userProfile } = useAuth();
  const location = useLocation();

  const menuItems = userRole ? navigation[userRole as keyof typeof navigation] || [] : [];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-3 py-2">
          <h2 className="text-lg font-semibold">Engine Marketplace</h2>
          <p className="text-sm text-muted-foreground">
            {userProfile?.first_name} {userProfile?.last_name}
          </p>
          <p className="text-xs text-muted-foreground">{userRole}</p>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.href}>
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <Button variant="ghost" onClick={signOut} className="w-full justify-start">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};