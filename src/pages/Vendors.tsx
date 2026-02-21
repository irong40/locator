import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Building2, Phone, Mail, MapPin, FilterX, Pencil, Check, X, AlertTriangle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { QueryError } from '@/components/ui/query-error';

type OemEppFilter = 'all' | 'oem' | 'epp' | 'both' | 'none';
type ReviewFilter = 'all' | 'needs-review';
type EditingField = 'name' | 'location' | null;

type EditingState = {
  vendorId: string;
  field: EditingField;
  values: {
    vendor_name: string;
    city: string;
    state: string;
    zip_code: string;
  };
};

export default function Vendors() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [preferenceFilter, setPreferenceFilter] = useState<string>('all');
  const [vendorLevelFilter, setVendorLevelFilter] = useState<string>('all');
  const [oemEppFilter, setOemEppFilter] = useState<OemEppFilter>('all');
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');

  // Inline editing state
  const [editing, setEditing] = useState<EditingState | null>(null);

  const { data: vendors, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('vendor_name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateVendorMutation = useMutation({
    mutationFn: async (updates: { id: string; vendor_name?: string; city?: string | null; state?: string | null; zip_code?: string | null; latitude?: number | null; longitude?: number | null }) => {
      const { id, ...fields } = updates;
      const { error } = await supabase
        .from('vendors')
        .update(fields)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setEditing(null);
      toast.success('Vendor updated');
    },
    onError: () => {
      toast.error('Failed to update vendor');
    }
  });

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editing) return;

    if (editing.field === 'name') {
      if (editing.values.vendor_name.trim()) {
        updateVendorMutation.mutate({ 
          id: editing.vendorId, 
          vendor_name: editing.values.vendor_name.trim() 
        });
      }
    } else if (editing.field === 'location') {
      const zipCode = editing.values.zip_code.trim() || null;
      let latitude: number | null = null;
      let longitude: number | null = null;

      // Look up coordinates from zipcode_lists if zip code is provided
      if (zipCode) {
        const { data: zipData } = await supabase
          .from('zipcode_lists')
          .select('latitude, longitude')
          .eq('zipcode', zipCode)
          .maybeSingle();
        
        if (zipData) {
          latitude = Number(zipData.latitude);
          longitude = Number(zipData.longitude);
          toast.info('Coordinates auto-populated from zip code');
        }
      }

      updateVendorMutation.mutate({ 
        id: editing.vendorId, 
        city: editing.values.city.trim() || null,
        state: editing.values.state.trim().toUpperCase() || null,
        zip_code: zipCode,
        latitude,
        longitude,
      });
    }
  };

  const startEditing = (e: React.MouseEvent, vendor: typeof vendors[0], field: EditingField) => {
    e.stopPropagation();
    setEditing({
      vendorId: vendor.id,
      field,
      values: {
        vendor_name: vendor.vendor_name,
        city: vendor.city ?? '',
        state: vendor.state ?? '',
        zip_code: vendor.zip_code ?? '',
      }
    });
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(e as unknown as React.MouseEvent);
    } else if (e.key === 'Escape') {
      setEditing(null);
    }
  };

  const updateEditValue = (field: keyof EditingState['values'], value: string) => {
    if (!editing) return;
    setEditing({
      ...editing,
      values: { ...editing.values, [field]: value }
    });
  };

  const filteredVendors = useMemo(() => {
    return vendors?.filter((vendor) => {
      const matchesSearch =
        !searchTerm ||
        vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.zip_code?.includes(searchTerm) ||
        vendor.poc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.email_address?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPreference =
        preferenceFilter === 'all' || vendor.preference === preferenceFilter;

      const matchesLevel =
        vendorLevelFilter === 'all' || vendor.vendor_level === vendorLevelFilter;

      const matchesOemEpp = (() => {
        switch (oemEppFilter) {
          case 'all': return true;
          case 'oem': return vendor.oem === true;
          case 'epp': return vendor.epp === true;
          case 'both': return vendor.oem === true && vendor.epp === true;
          case 'none': return !vendor.oem && !vendor.epp;
          default: return true;
        }
      })();

      const matchesReview = reviewFilter === 'all' || 
        (reviewFilter === 'needs-review' && vendor.vendor_name === 'UNKNOWN - Needs Review');

      return matchesSearch && matchesPreference && matchesLevel && matchesOemEpp && matchesReview;
    });
  }, [vendors, searchTerm, preferenceFilter, vendorLevelFilter, oemEppFilter, reviewFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setPreferenceFilter('all');
    setVendorLevelFilter('all');
    setOemEppFilter('all');
    setReviewFilter('all');
  };

  const hasActiveFilters = searchTerm || preferenceFilter !== 'all' || vendorLevelFilter !== 'all' || oemEppFilter !== 'all' || reviewFilter !== 'all';

  const needsReviewCount = vendors?.filter(v => v.vendor_name === 'UNKNOWN - Needs Review').length ?? 0;

  const isEditingVendor = (vendorId: string, field: EditingField) => 
    editing?.vendorId === vendorId && editing?.field === field;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vendors</h1>
          <p className="text-muted-foreground">Manage vendor directory</p>
        </div>
        <Button onClick={() => navigate('/vendors/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      {isError && (
        <QueryError
          message={error?.message || 'Failed to load vendors.'}
          onRetry={() => refetch()}
        />
      )}

      {needsReviewCount > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300">
              {needsReviewCount} vendor{needsReviewCount > 1 ? 's' : ''} need review
            </Badge>
            <span className="text-sm text-yellow-700 dark:text-yellow-300">
              Click the pencil icon to edit vendor names
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
            onClick={() => setReviewFilter(reviewFilter === 'needs-review' ? 'all' : 'needs-review')}
          >
            {reviewFilter === 'needs-review' ? 'Show All' : 'Show Only'}
          </Button>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, POC, city, state, zip, or email..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={oemEppFilter} onValueChange={(v) => setOemEppFilter(v as OemEppFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="OEM/EPP Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  <SelectItem value="oem">OEM Only</SelectItem>
                  <SelectItem value="epp">EPP Only</SelectItem>
                  <SelectItem value="both">OEM & EPP</SelectItem>
                  <SelectItem value="none">Neither</SelectItem>
                </SelectContent>
              </Select>
              <Select value={preferenceFilter} onValueChange={setPreferenceFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Preferences</SelectItem>
                  <SelectItem value="Preferred">Preferred</SelectItem>
                  <SelectItem value="Do Not Use">Do Not Use</SelectItem>
                </SelectContent>
              </Select>
              <Select value={vendorLevelFilter} onValueChange={setVendorLevelFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Vendor Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Bad">Bad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredVendors?.length ?? 0} of {vendors?.length ?? 0} vendors
                </p>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <FilterX className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredVendors && filteredVendors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => (
                  <TableRow
                    key={vendor.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      vendor.vendor_name === 'UNKNOWN - Needs Review' && "bg-yellow-50 dark:bg-yellow-950/20"
                    )}
                    onClick={() => !editing && navigate(`/vendors/${vendor.id}`)}
                  >
                    {/* Vendor Name Cell */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        {isEditingVendor(vendor.id, 'name') ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Input
                              value={editing!.values.vendor_name}
                              onChange={(e) => updateEditValue('vendor_name', e.target.value)}
                              onKeyDown={handleKeyDown}
                              className="h-8 w-56"
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={handleSave}
                              disabled={updateVendorMutation.isPending}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={handleCancel}
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group">
                            <div>
                              <p className={cn(
                                "font-medium",
                                vendor.vendor_name === 'UNKNOWN - Needs Review' && "text-yellow-700 dark:text-yellow-400"
                              )}>
                                {vendor.vendor_name}
                              </p>
                              {vendor.poc && (
                                <p className="text-sm text-muted-foreground">POC: {vendor.poc}</p>
                              )}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 transition-opacity"
                              onClick={(e) => startEditing(e, vendor, 'name')}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Location Cell */}
                    <TableCell>
                      {isEditingVendor(vendor.id, 'location') ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <Input
                              value={editing!.values.city}
                              onChange={(e) => updateEditValue('city', e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder="City"
                              className="h-8 w-24"
                              autoFocus
                            />
                            <Input
                              value={editing!.values.state}
                              onChange={(e) => updateEditValue('state', e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder="ST"
                              className="h-8 w-14"
                              maxLength={2}
                            />
                            <Input
                              value={editing!.values.zip_code}
                              onChange={(e) => updateEditValue('zip_code', e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder="Zip"
                              className="h-8 w-20"
                              maxLength={10}
                            />
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={handleSave}
                            disabled={updateVendorMutation.isPending}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={handleCancel}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-sm group">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {[vendor.city, vendor.state].filter(Boolean).join(', ') || '-'}
                            {vendor.zip_code && (
                              <span className="text-muted-foreground ml-1">({vendor.zip_code})</span>
                            )}
                          </span>
                          {(!vendor.latitude || !vendor.longitude) && (
                            <span title="Missing coordinates" className="text-orange-500">
                              <AlertTriangle className="h-3 w-3" />
                            </span>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 h-6 w-6 transition-opacity"
                            onClick={(e) => startEditing(e, vendor, 'location')}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {vendor.phone_no && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {vendor.phone_no}
                          </div>
                        )}
                        {vendor.email_address && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {vendor.email_address}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {vendor.hr_labour_rate ? `$${vendor.hr_labour_rate}/hr` : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {vendor.preference && (
                          <Badge
                            variant={vendor.preference === 'Preferred' ? 'default' : 'destructive'}
                          >
                            {vendor.preference}
                          </Badge>
                        )}
                        {vendor.vendor_level && (
                          <Badge
                            variant={vendor.vendor_level === 'Good' ? 'outline' : 'secondary'}
                          >
                            {vendor.vendor_level}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {vendor.oem && (
                          <Badge variant="secondary" className="text-xs">
                            OEM
                          </Badge>
                        )}
                        {vendor.epp && (
                          <Badge variant="secondary" className="text-xs">
                            EPP
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No vendors found</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/vendors/create')}>
                Add Your First Vendor
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
