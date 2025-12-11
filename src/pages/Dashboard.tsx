import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Package, Factory, CreditCard, MapPin, Search, TrendingUp, Users, Shield, ThumbsUp, ThumbsDown, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  muted: 'hsl(var(--muted))',
  destructive: 'hsl(var(--destructive))',
  cta: 'hsl(var(--cta))',
};

const PIE_COLORS = ['#22c55e', '#ef4444', '#6b7280'];
const BAR_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [zipCode, setZipCode] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [vendors, products, oemBrands, engineBrands, paymentTypes] = await Promise.all([
        supabase.from('vendors').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('oem_brands').select('*', { count: 'exact', head: true }),
        supabase.from('engine_brands').select('*', { count: 'exact', head: true }),
        supabase.from('payment_types').select('*', { count: 'exact', head: true }),
      ]);
      return {
        vendors: vendors.count ?? 0,
        products: products.count ?? 0,
        oemBrands: oemBrands.count ?? 0,
        engineBrands: engineBrands.count ?? 0,
        paymentTypes: paymentTypes.count ?? 0,
      };
    },
  });

  const { data: vendors } = useQuery({
    queryKey: ['all-vendors-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('vendors')
        .select('id, vendor_name, city, state, oem, epp, preference, vendor_level, created_at');
      return data ?? [];
    },
  });

  const { data: recentVendors } = useQuery({
    queryKey: ['recent-vendors'],
    queryFn: async () => {
      const { data } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  // Calculate distribution data
  const distributionData = useMemo(() => {
    if (!vendors) return { preference: [], level: [], oemEpp: [], byState: [] };

    const preferredCount = vendors.filter((v) => v.preference === 'Preferred').length;
    const doNotUseCount = vendors.filter((v) => v.preference === 'Do Not Use').length;
    const noPreferenceCount = vendors.length - preferredCount - doNotUseCount;

    const goodCount = vendors.filter((v) => v.vendor_level === 'Good').length;
    const badCount = vendors.filter((v) => v.vendor_level === 'Bad').length;
    const noLevelCount = vendors.length - goodCount - badCount;

    const oemOnlyCount = vendors.filter((v) => v.oem && !v.epp).length;
    const eppOnlyCount = vendors.filter((v) => v.epp && !v.oem).length;
    const bothCount = vendors.filter((v) => v.oem && v.epp).length;
    const neitherCount = vendors.filter((v) => !v.oem && !v.epp).length;

    // Top states
    const stateCount: Record<string, number> = {};
    vendors.forEach((v) => {
      if (v.state) {
        stateCount[v.state] = (stateCount[v.state] || 0) + 1;
      }
    });
    const byState = Object.entries(stateCount)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      preference: [
        { name: 'Preferred', value: preferredCount, fill: '#22c55e' },
        { name: 'Do Not Use', value: doNotUseCount, fill: '#ef4444' },
        { name: 'Not Set', value: noPreferenceCount, fill: '#6b7280' },
      ].filter((d) => d.value > 0),
      level: [
        { name: 'Good', value: goodCount, fill: '#22c55e' },
        { name: 'Bad', value: badCount, fill: '#ef4444' },
        { name: 'Not Set', value: noLevelCount, fill: '#6b7280' },
      ].filter((d) => d.value > 0),
      oemEpp: [
        { name: 'OEM Only', value: oemOnlyCount, fill: '#3b82f6' },
        { name: 'EPP Only', value: eppOnlyCount, fill: '#22c55e' },
        { name: 'Both', value: bothCount, fill: '#f59e0b' },
        { name: 'Neither', value: neitherCount, fill: '#6b7280' },
      ].filter((d) => d.value > 0),
      byState,
    };
  }, [vendors]);

  const handleSearch = () => {
    if (zipCode.trim()) {
      navigate(`/vendor-search?zip=${encodeURIComponent(zipCode.trim())}`);
    }
  };

  const preferredCount = vendors?.filter((v) => v.preference === 'Preferred').length ?? 0;
  const oemCount = vendors?.filter((v) => v.oem).length ?? 0;
  const eppCount = vendors?.filter((v) => v.epp).length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Vendor Management Overview</p>
      </div>

      {/* Quick Search */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Vendors by Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="zip">Zip Code</Label>
              <Input
                id="zip"
                placeholder="Enter zip code..."
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch}>
              <MapPin className="h-4 w-4 mr-2" />
              Search Vendors
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.vendors ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {preferredCount} preferred
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OEM Certified</CardTitle>
            <Factory className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{oemCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.vendors ? Math.round((oemCount / stats.vendors) * 100) : 0}% of vendors
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EPP Certified</CardTitle>
            <Shield className="h-4 w-4 text-cta" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{eppCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.vendors ? Math.round((eppCount / stats.vendors) * 100) : 0}% of vendors
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Catalog Items</CardTitle>
            <Package className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(stats?.products ?? 0) + (stats?.oemBrands ?? 0) + (stats?.engineBrands ?? 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.products} products, {stats?.oemBrands} OEM, {stats?.engineBrands} engine brands
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Preference Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ThumbsUp className="h-4 w-4" />
              Vendor Preference
            </CardTitle>
            <CardDescription>Distribution by preference status</CardDescription>
          </CardHeader>
          <CardContent>
            {distributionData.preference.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={distributionData.preference}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {distributionData.preference.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Vendor Level
            </CardTitle>
            <CardDescription>Distribution by quality level</CardDescription>
          </CardHeader>
          <CardContent>
            {distributionData.level.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={distributionData.level}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {distributionData.level.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* OEM/EPP Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Factory className="h-4 w-4" />
              OEM/EPP Status
            </CardTitle>
            <CardDescription>Certification distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {distributionData.oemEpp.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={distributionData.oemEpp}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {distributionData.oemEpp.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vendors by State & Recent Vendors */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Vendors by State */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Top Locations
            </CardTitle>
            <CardDescription>Vendors by state</CardDescription>
          </CardHeader>
          <CardContent>
            {distributionData.byState.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={distributionData.byState} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="state" width={40} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No location data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Vendors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Recent Vendors
            </CardTitle>
            <CardDescription>Latest additions to the system</CardDescription>
          </CardHeader>
          <CardContent>
            {recentVendors && recentVendors.length > 0 ? (
              <div className="space-y-3">
                {recentVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/vendors/${vendor.id}`)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{vendor.vendor_name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {[vendor.city, vendor.state].filter(Boolean).join(', ') || 'No location'}
                      </p>
                    </div>
                    <div className="flex gap-1.5 ml-2 flex-shrink-0">
                      {vendor.oem && <Badge variant="secondary" className="text-xs">OEM</Badge>}
                      {vendor.epp && <Badge variant="secondary" className="text-xs">EPP</Badge>}
                      {vendor.preference === 'Preferred' && <Badge className="text-xs">Preferred</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No vendors yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Footer */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Factory className="h-8 w-8 text-secondary" />
              <div>
                <p className="text-2xl font-bold">{stats?.oemBrands ?? 0}</p>
                <p className="text-xs text-muted-foreground">OEM Brands</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Wrench className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats?.engineBrands ?? 0}</p>
                <p className="text-xs text-muted-foreground">Engine Brands</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold">{stats?.products ?? 0}</p>
                <p className="text-xs text-muted-foreground">Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-cta" />
              <div>
                <p className="text-2xl font-bold">{stats?.paymentTypes ?? 0}</p>
                <p className="text-xs text-muted-foreground">Payment Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
