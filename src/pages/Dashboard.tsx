import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Package, Factory, CreditCard, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

  const handleSearch = () => {
    if (zipCode.trim()) {
      navigate(`/vendors?zip=${encodeURIComponent(zipCode.trim())}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">C&R Repair Solutions</h1>
        <p className="text-muted-foreground">Vendor Management System</p>
      </div>

      {/* Quick Search */}
      <Card className="border-primary/20 bg-primary/5">
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

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.vendors ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.products ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OEM Brands</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.oemBrands ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engine Brands</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.engineBrands ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Types</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.paymentTypes ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Vendors */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Vendors</CardTitle>
        </CardHeader>
        <CardContent>
          {recentVendors && recentVendors.length > 0 ? (
            <div className="space-y-4">
              {recentVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/vendors/${vendor.id}`)}
                >
                  <div>
                    <p className="font-medium">{vendor.vendor_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {[vendor.city, vendor.state].filter(Boolean).join(', ') || 'No location'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {vendor.oem && (
                      <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        OEM
                      </span>
                    )}
                    {vendor.epp && (
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        EPP
                      </span>
                    )}
                    {vendor.preference === 'Preferred' && (
                      <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Preferred
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No vendors yet. Add your first vendor to get started.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
