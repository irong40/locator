import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Package, Wrench, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { userRole } = useAuth();

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [vendorsResult, productsResult, brandsResult, usersResult] = await Promise.all([
        supabase.from('vendors').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('engine_brands').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }),
      ]);

      return {
        vendors: vendorsResult.count || 0,
        products: productsResult.count || 0,
        brands: brandsResult.count || 0,
        users: usersResult.count || 0,
      };
    },
  });

  // Fetch low inventory products
  const { data: lowInventory } = useQuery({
    queryKey: ['low-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('name, sku, inventory_qty, vendors(name)')
        .lte('inventory_qty', 5)
        .eq('active', true)
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const dashboardCards = [
    {
      title: 'Total Vendors',
      value: stats?.vendors || 0,
      icon: Building2,
      description: 'Active marketplace vendors',
    },
    {
      title: 'Total Products',
      value: stats?.products || 0,
      icon: Package,
      description: 'Products in catalog',
    },
    {
      title: 'Engine Brands',
      value: stats?.brands || 0,
      icon: Wrench,
      description: 'Available brands',
    },
    {
      title: 'Users',
      value: stats?.users || 0,
      icon: Users,
      description: 'Platform users',
      adminOnly: true,
    },
  ];

  return (
    <AppLayout breadcrumb={[{ name: 'Dashboard' }]}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the Engine Marketplace. Here's an overview of your system.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dashboardCards
            .filter(card => !card.adminOnly || userRole === 'Admin')
            .map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Low Inventory Alert */}
        {lowInventory && lowInventory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Low Inventory Alert
              </CardTitle>
              <CardDescription>
                Products with inventory of 5 or less
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowInventory.map((product, index) => (
                  <div key={index} className="flex justify-between items-center p-2 rounded border">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        SKU: {product.sku} • Vendor: {product.vendors?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-600">
                        {product.inventory_qty} left
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates to your marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Activity tracking will be available once you start adding data to your marketplace.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;