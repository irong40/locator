import { Building2, Factory, Package, CreditCard, LayoutDashboard, Wrench, MapPin, Settings, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import logoIcon from '@/assets/logo-icon.jpeg';
import { useUserRole } from '@/hooks/useUserRole';
import { Badge } from '@/components/ui/badge';

const mainMenuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Find Vendors', url: '/vendor-search', icon: MapPin },
  { title: 'Vendors', url: '/vendors', icon: Building2 },
];

const catalogMenuItems = [
  { title: 'OEM Brands', url: '/oem-brands', icon: Factory },
  { title: 'Engine Brands', url: '/engine-brands', icon: Wrench },
  { title: 'Products', url: '/products', icon: Package },
  { title: 'Payment Types', url: '/payment-types', icon: CreditCard, adminOnly: true },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, isAdmin, isManager } = useUserRole();

  const canSeeCatalog = isAdmin || isManager;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg overflow-hidden">
            <img 
              src={logoIcon} 
              alt="C&R Logo" 
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-sidebar-foreground">C&R Repair</h2>
            <p className="text-xs text-sidebar-primary">Vendor Management</p>
          </div>
        </div>
        {role && (
          <Badge variant="outline" className="mt-2 text-xs">
            {role}
          </Badge>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    isActive={location.pathname === item.url || location.pathname.startsWith(item.url + '/')}
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {canSeeCatalog && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/70">
              <Settings className="h-3 w-3 mr-1 inline" />
              Catalog Management
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {catalogMenuItems
                  .filter((item) => !item.adminOnly || isAdmin)
                  .map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        onClick={() => navigate(item.url)}
                        isActive={location.pathname === item.url}
                        className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/70">
              <Users className="h-3 w-3 mr-1 inline" />
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/user-management')}
                    isActive={location.pathname === '/user-management'}
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                  >
                    <Users className="h-4 w-4" />
                    <span>User Management</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}