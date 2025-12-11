import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Building2, User, Phone, Mail, MapPin, DollarSign, FileText } from 'lucide-react';
import { z } from 'zod';

const vendorSchema = z.object({
  vendor_name: z.string().min(1, 'Vendor name is required').max(200),
  poc: z.string().max(100).optional(),
  phone_no: z.string().max(20).optional(),
  fax_no: z.string().max(20).optional(),
  email_address: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip_code: z.string().max(20).optional(),
  vendor_level: z.string().optional(),
  preference: z.string().optional(),
  hr_labour_rate: z.number().min(0).optional(),
  oem: z.boolean().default(false),
  epp: z.boolean().default(false),
  payment_type_id: z.string().uuid().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  comments: z.string().max(2000).optional(),
});

type VendorFormData = z.infer<typeof vendorSchema>;

export default function VendorCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<VendorFormData>>({
    vendor_name: '',
    poc: '',
    phone_no: '',
    fax_no: '',
    email_address: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    vendor_level: '',
    preference: '',
    hr_labour_rate: undefined,
    oem: false,
    epp: false,
    payment_type_id: null,
    latitude: null,
    longitude: null,
    comments: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const createVendor = useMutation({
    mutationFn: async (data: VendorFormData) => {
      const { error } = await supabase.from('vendors').insert({
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
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast({
        title: 'Vendor created',
        description: 'The vendor has been created successfully.',
      });
      navigate('/vendors');
    },
    onError: (error) => {
      toast({
        title: 'Error creating vendor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

    createVendor.mutate(validation.data);
  };

  const updateField = <K extends keyof VendorFormData>(field: K, value: VendorFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/vendors')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Add New Vendor</h1>
          <p className="text-muted-foreground">Create a new vendor record</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-secondary" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vendor_name">
                  Vendor Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="vendor_name"
                  value={formData.vendor_name}
                  onChange={(e) => updateField('vendor_name', e.target.value)}
                  placeholder="Enter vendor name"
                />
                {errors.vendor_name && (
                  <p className="text-sm text-destructive">{errors.vendor_name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor_level">Vendor Level</Label>
                  <Select
                    value={formData.vendor_level || ''}
                    onValueChange={(value) => updateField('vendor_level', value)}
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
                  <Label htmlFor="preference">Preference</Label>
                  <Select
                    value={formData.preference || ''}
                    onValueChange={(value) => updateField('preference', value)}
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

              <div className="flex gap-6 pt-2">
                <div className="flex items-center gap-3">
                  <Switch
                    id="oem"
                    checked={formData.oem}
                    onCheckedChange={(checked) => updateField('oem', checked)}
                  />
                  <Label htmlFor="oem" className="cursor-pointer">
                    OEM Certified
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="epp"
                    checked={formData.epp}
                    onCheckedChange={(checked) => updateField('epp', checked)}
                  />
                  <Label htmlFor="epp" className="cursor-pointer">
                    EPP Certified
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-secondary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="poc">Point of Contact</Label>
                <Input
                  id="poc"
                  value={formData.poc}
                  onChange={(e) => updateField('poc', e.target.value)}
                  placeholder="Contact person name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_no" className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Phone
                  </Label>
                  <Input
                    id="phone_no"
                    value={formData.phone_no}
                    onChange={(e) => updateField('phone_no', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fax_no" className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Fax
                  </Label>
                  <Input
                    id="fax_no"
                    value={formData.fax_no}
                    onChange={(e) => updateField('fax_no', e.target.value)}
                    placeholder="(555) 123-4568"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_address" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email Address
                </Label>
                <Input
                  id="email_address"
                  type="email"
                  value={formData.email_address}
                  onChange={(e) => updateField('email_address', e.target.value)}
                  placeholder="vendor@example.com"
                />
                {errors.email_address && (
                  <p className="text-sm text-destructive">{errors.email_address}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-secondary" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="City"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    placeholder="State"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip_code">Zip Code</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
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
                    onChange={(e) =>
                      updateField('latitude', e.target.value ? parseFloat(e.target.value) : null)
                    }
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
                    onChange={(e) =>
                      updateField('longitude', e.target.value ? parseFloat(e.target.value) : null)
                    }
                    placeholder="-74.0060"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-secondary" />
                Business Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hr_labour_rate">Hourly Labor Rate ($)</Label>
                  <Input
                    id="hr_labour_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hr_labour_rate ?? ''}
                    onChange={(e) =>
                      updateField(
                        'hr_labour_rate',
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    placeholder="75.00"
                  />
                  {errors.hr_labour_rate && (
                    <p className="text-sm text-destructive">{errors.hr_labour_rate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_type_id" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Payment Type
                  </Label>
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

              <div className="space-y-2">
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => updateField('comments', e.target.value)}
                  placeholder="Additional notes about this vendor..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/vendors')}>
            Cancel
          </Button>
          <Button type="submit" variant="cta" disabled={createVendor.isPending}>
            {createVendor.isPending ? 'Creating...' : 'Create Vendor'}
          </Button>
        </div>
      </form>
    </div>
  );
}