import { Building2, Factory, Package, CreditCard, LayoutDashboard, Wrench, MapPin, Settings, Users, History, HelpCircle, AlertCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { Badge } from '@/components/ui/badge';

const mainMenuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, managerAndAbove: true },
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

  // Fetch open ticket count for admin badge
  const { data: openTicketCount = 0 } = useQuery({
    queryKey: ['open-ticket-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('maintenance_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');
      if (error) return 0;
      return count ?? 0;
    },
    enabled: isAdmin,
    refetchInterval: 60000, // Refresh every minute
  });

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
          <div className="min-w-0 flex-1">
            <h2 className="font-heading font-semibold text-sidebar-foreground text-sm leading-tight">C&R Repair Solutions</h2>
            <p className="text-xs text-sidebar-primary">Vendor Locator</p>
          </div>
        </div>
        {role && (
          <Badge variant="outline" className="mt-2 text-xs border-sidebar-border text-sidebar-foreground bg-sidebar-accent/50">
            {role}
          </Badge>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems
                .filter((item) => !item.managerAndAbove || isAdmin || isManager)
                .map((item) => (
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
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/audit-logs')}
                    isActive={location.pathname === '/audit-logs'}
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                  >
                    <History className="h-4 w-4" />
                    <span>Audit Logs</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/trouble-tickets')}
                    isActive={location.pathname === '/trouble-tickets'}
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>Trouble Tickets</span>
                    {openTicketCount > 0 && (
                      <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0.5">
                        {openTicketCount}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Help - visible to all users */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate(isAdmin ? '/help/admin' : '/help')}
                  isActive={location.pathname.startsWith('/help')}
                  className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Help Guide</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}