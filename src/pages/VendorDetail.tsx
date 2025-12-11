import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
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
  Pencil,
  X,
  Save,
  Trash2,
} from 'lucide-react';
import { z } from 'zod';

const vendorSchema = z.object({
  vendor_name: z.string().min(1, 'Vendor name is required').max(200),
  poc: z.string().max(100).optional().nullable(),
  phone_no: z.string().max(20).optional().nullable(),
  fax_no: z.string().max(20).optional().nullable(),
  email_address: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(),
  zip_code: z.string().max(20).optional().nullable(),
  vendor_level: z.string().optional().nullable(),
  preference: z.string().optional().nullable(),
  hr_labour_rate: z.number().min(0).optional().nullable(),
  oem: z.boolean().default(false),
  epp: z.boolean().default(false),
  payment_type_id: z.string().uuid().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  comments: z.string().max(2000).optional().nullable(),
});

type VendorFormData = z.infer<typeof vendorSchema>;

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<VendorFormData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const { data: paymentTypes } = useQuery({
    queryKey: ['payment-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_types')
        .select('*')
        .order('payment_type');
      if (error) throw error;
      return data ?? [];
    },
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

  useEffect(() => {
    if (vendor) {
      setFormData({
        vendor_name: vendor.vendor_name,
        poc: vendor.poc,
        phone_no: vendor.phone_no,
        fax_no: vendor.fax_no,
        email_address: vendor.email_address,
        address: vendor.address,
        city: vendor.city,
        state: vendor.state,
        zip_code: vendor.zip_code,
        vendor_level: vendor.vendor_level,
        preference: vendor.preference,
        hr_labour_rate: vendor.hr_labour_rate,
        oem: vendor.oem ?? false,
        epp: vendor.epp ?? false,
        payment_type_id: vendor.payment_type_id,
        latitude: vendor.latitude,
        longitude: vendor.longitude,
        comments: vendor.comments,
      });
    }
  }, [vendor]);

  const updateVendor = useMutation({
    mutationFn: async (data: VendorFormData) => {
      const { error } = await supabase
        .from('vendors')
        .update({
          vendor_name: data.vendor_name,
          poc: data.poc || null,
          phone_no: data.phone_no || null,
          fax_no: data.fax_no || null,
          email_address: data.email_address || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          zip_code: data.zip_code || null,
          vendor_level: data.vendor_level || null,
          preference: data.preference || null,
          hr_labour_rate: data.hr_labour_rate ?? null,
          oem: data.oem,
          epp: data.epp,
          payment_type_id: data.payment_type_id || null,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          comments: data.comments || null,
        })
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', id] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast({
        title: 'Vendor updated',
        description: 'The vendor has been updated successfully.',
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: 'Error updating vendor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteVendor = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('vendors').delete().eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast({
        title: 'Vendor deleted',
        description: 'The vendor has been deleted successfully.',
      });
      navigate('/vendors');
    },
    onError: (error) => {
      toast({
        title: 'Error deleting vendor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    setErrors({});
    const validation = vendorSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    updateVendor.mutate(validation.data);
  };

  const handleCancel = () => {
    if (vendor) {
      setFormData({
        vendor_name: vendor.vendor_name,
        poc: vendor.poc,
        phone_no: vendor.phone_no,
        fax_no: vendor.fax_no,
        email_address: vendor.email_address,
        address: vendor.address,
        city: vendor.city,
        state: vendor.state,
        zip_code: vendor.zip_code,
        vendor_level: vendor.vendor_level,
        preference: vendor.preference,
        hr_labour_rate: vendor.hr_labour_rate,
        oem: vendor.oem ?? false,
        epp: vendor.epp ?? false,
        payment_type_id: vendor.payment_type_id,
        latitude: vendor.latitude,
        longitude: vendor.longitude,
        comments: vendor.comments,
      });
    }
    setErrors({});
    setIsEditing(false);
  };

  const updateField = <K extends keyof VendorFormData>(field: K, value: VendorFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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
            {isEditing ? (
              <div className="space-y-1">
                <Input
                  value={formData.vendor_name || ''}
                  onChange={(e) => updateField('vendor_name', e.target.value)}
                  className="text-2xl font-heading font-bold h-auto py-1"
                />
                {errors.vendor_name && (
                  <p className="text-sm text-destructive">{errors.vendor_name}</p>
                )}
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-heading font-bold text-foreground">{vendor.vendor_name}</h1>
                <p className="text-muted-foreground">Vendor Details</p>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isEditing && (
            <>
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
            </>
          )}
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button variant="cta" onClick={handleSave} disabled={updateVendor.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateVendor.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete <strong>{vendor.vendor_name}</strong>? This action cannot be undone
                      and will permanently remove the vendor from the system.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteVendor.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteVendor.isPending ? 'Deleting...' : 'Delete Vendor'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
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
            {/* Status Section (Edit Mode) */}
            {isEditing && (
              <>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                    Status & Classification
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Vendor Level</Label>
                      <Select
                        value={formData.vendor_level || ''}
                        onValueChange={(value) => updateField('vendor_level', value || null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Bad">Bad</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Preference</Label>
                      <Select
                        value={formData.preference || ''}
                        onValueChange={(value) => updateField('preference', value || null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select preference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Preferred">Preferred</SelectItem>
                          <SelectItem value="Do Not Use">Do Not Use</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-6 mt-4">
                    <div className="flex items-center gap-3">
                      <Switch
                        id="oem"
                        checked={formData.oem}
                        onCheckedChange={(checked) => updateField('oem', checked)}
                      />
                      <Label htmlFor="oem" className="cursor-pointer">OEM Certified</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        id="epp"
                        checked={formData.epp}
                        onCheckedChange={(checked) => updateField('epp', checked)}
                      />
                      <Label htmlFor="epp" className="cursor-pointer">EPP Certified</Label>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Contact Section */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                Contact Information
              </h3>
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="poc">Point of Contact</Label>
                    <Input
                      id="poc"
                      value={formData.poc || ''}
                      onChange={(e) => updateField('poc', e.target.value)}
                      placeholder="Contact person name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_address">Email</Label>
                    <Input
                      id="email_address"
                      type="email"
                      value={formData.email_address || ''}
                      onChange={(e) => updateField('email_address', e.target.value)}
                      placeholder="vendor@example.com"
                    />
                    {errors.email_address && (
                      <p className="text-sm text-destructive">{errors.email_address}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_no">Phone</Label>
                    <Input
                      id="phone_no"
                      value={formData.phone_no || ''}
                      onChange={(e) => updateField('phone_no', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fax_no">Fax</Label>
                    <Input
                      id="fax_no"
                      value={formData.fax_no || ''}
                      onChange={(e) => updateField('fax_no', e.target.value)}
                      placeholder="(555) 123-4568"
                    />
                  </div>
                </div>
              ) : (
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
                  {!vendor.poc && !vendor.phone_no && !vendor.fax_no && !vendor.email_address && (
                    <p className="text-muted-foreground col-span-2">No contact information provided</p>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Address Section */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                Address
              </h3>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={formData.address || ''}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city || ''}
                        onChange={(e) => updateField('city', e.target.value)}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state || ''}
                        onChange={(e) => updateField('state', e.target.value)}
                        placeholder="State"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip_code">Zip Code</Label>
                      <Input
                        id="zip_code"
                        value={formData.zip_code || ''}
                        onChange={(e) => updateField('zip_code', e.target.value)}
                        placeholder="12345"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        value={formData.latitude ?? ''}
                        onChange={(e) => updateField('latitude', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="40.7128"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        value={formData.longitude ?? ''}
                        onChange={(e) => updateField('longitude', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="-74.0060"
                      />
                    </div>
                  </div>
                </div>
              ) : fullAddress ? (
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
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hr_labour_rate">Hourly Labor Rate ($)</Label>
                    <Input
                      id="hr_labour_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.hr_labour_rate ?? ''}
                      onChange={(e) => updateField('hr_labour_rate', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="75.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_type_id">Payment Type</Label>
                    <Select
                      value={formData.payment_type_id || ''}
                      onValueChange={(value) => updateField('payment_type_id', value || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentTypes?.map((pt) => (
                          <SelectItem key={pt.id} value={pt.id}>
                            {pt.payment_type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
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
              )}
            </div>

            {/* Comments */}
            <Separator />
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                Comments
              </h3>
              {isEditing ? (
                <Textarea
                  value={formData.comments || ''}
                  onChange={(e) => updateField('comments', e.target.value)}
                  placeholder="Additional notes about this vendor..."
                  rows={4}
                />
              ) : vendor.comments ? (
                <p className="text-foreground whitespace-pre-wrap">{vendor.comments}</p>
              ) : (
                <p className="text-muted-foreground">No comments</p>
              )}
            </div>
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