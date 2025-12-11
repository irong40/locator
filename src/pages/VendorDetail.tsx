import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  User,
  DollarSign,
  FileText,
  Factory,
  Wrench,
  Package,
  Shield,
} from 'lucide-react';

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: vendor, isLoading: vendorLoading } = useQuery({
    queryKey: ['vendor', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: oemBrands } = useQuery({
    queryKey: ['vendor-oem-brands', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_oem_brands')
        .select('*, oem_brands(oem_brand)')
        .eq('vendor_id', id!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: eppBrands } = useQuery({
    queryKey: ['vendor-epp-brands', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_epp_brands')
        .select('*, oem_brands(oem_brand)')
        .eq('vendor_id', id!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: engineBrands } = useQuery({
    queryKey: ['vendor-engine-brands', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_engine_brands')
        .select('*, engine_brands(engine_brand)')
        .eq('vendor_id', id!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: products } = useQuery({
    queryKey: ['vendor-products', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_products')
        .select('*, products(product)')
        .eq('vendor_id', id!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: paymentType } = useQuery({
    queryKey: ['payment-type', vendor?.payment_type_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_types')
        .select('payment_type')
        .eq('id', vendor!.payment_type_id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!vendor?.payment_type_id,
  });

  if (vendorLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Vendor Not Found</h2>
        <p className="text-muted-foreground mb-4">The vendor you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/vendors')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vendors
        </Button>
      </div>
    );
  }

  const fullAddress = [vendor.address, vendor.city, vendor.state, vendor.zip_code]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/vendors')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">{vendor.vendor_name}</h1>
            <p className="text-muted-foreground">Vendor Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {vendor.preference && (
            <Badge variant={vendor.preference === 'Preferred' ? 'default' : 'destructive'} className="text-sm">
              {vendor.preference}
            </Badge>
          )}
          {vendor.vendor_level && (
            <Badge variant="outline" className="text-sm">
              {vendor.vendor_level}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-secondary" />
              Vendor Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact Section */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendor.poc && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Point of Contact</p>
                      <p className="font-medium">{vendor.poc}</p>
                    </div>
                  </div>
                )}
                {vendor.phone_no && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{vendor.phone_no}</p>
                    </div>
                  </div>
                )}
                {vendor.fax_no && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fax</p>
                      <p className="font-medium">{vendor.fax_no}</p>
                    </div>
                  </div>
                )}
                {vendor.email_address && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a href={`mailto:${vendor.email_address}`} className="font-medium text-secondary hover:underline">
                        {vendor.email_address}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Address Section */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                Address
              </h3>
              {fullAddress ? (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p>{fullAddress}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No address provided</p>
              )}
            </div>

            <Separator />

            {/* Business Details */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                Business Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Hourly Rate</p>
                    <p className="font-medium">
                      {vendor.hr_labour_rate ? `$${vendor.hr_labour_rate}/hr` : 'Not specified'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Type</p>
                    <p className="font-medium">{paymentType?.payment_type || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Certifications</p>
                    <div className="flex gap-1 mt-1">
                      {vendor.oem && <Badge variant="secondary">OEM</Badge>}
                      {vendor.epp && <Badge variant="secondary">EPP</Badge>}
                      {!vendor.oem && !vendor.epp && <span className="text-muted-foreground">None</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments */}
            {vendor.comments && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                    Comments
                  </h3>
                  <p className="text-foreground whitespace-pre-wrap">{vendor.comments}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sidebar with Related Data */}
        <div className="space-y-6">
          {/* OEM Brands */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Factory className="h-4 w-4 text-secondary" />
                OEM Brands ({oemBrands?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {oemBrands && oemBrands.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {oemBrands.map((item) => (
                    <Badge key={item.id} variant="outline">
                      {item.oem_brands?.oem_brand}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No OEM brands assigned</p>
              )}
            </CardContent>
          </Card>

          {/* EPP Brands */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Factory className="h-4 w-4 text-cta" />
                EPP Brands ({eppBrands?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eppBrands && eppBrands.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {eppBrands.map((item) => (
                    <Badge key={item.id} variant="outline" className="border-cta text-cta">
                      {item.oem_brands?.oem_brand}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No EPP brands assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Engine Brands */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wrench className="h-4 w-4 text-primary" />
                Engine Brands ({engineBrands?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {engineBrands && engineBrands.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {engineBrands.map((item) => (
                    <Badge 
                      key={item.id} 
                      variant={item.is_certified ? 'default' : 'secondary'}
                      className="flex items-center gap-1"
                    >
                      {item.engine_brands?.engine_brand}
                      {item.is_certified && <Shield className="h-3 w-3" />}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No engine brands assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-accent" />
                Products ({products?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {products && products.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {products.map((item) => (
                    <Badge key={item.id} variant="secondary">
                      {item.products?.product}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No products assigned</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}