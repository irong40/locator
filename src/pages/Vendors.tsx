import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Building2, Phone, Mail, MapPin, FilterX } from 'lucide-react';
import { useState, useMemo } from 'react';

type OemEppFilter = 'all' | 'oem' | 'epp' | 'both' | 'none';

export default function Vendors() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [preferenceFilter, setPreferenceFilter] = useState<string>('all');
  const [vendorLevelFilter, setVendorLevelFilter] = useState<string>('all');
  const [oemEppFilter, setOemEppFilter] = useState<OemEppFilter>('all');

  const { data: vendors, isLoading } = useQuery({
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

      return matchesSearch && matchesPreference && matchesLevel && matchesOemEpp;
    });
  }, [vendors, searchTerm, preferenceFilter, vendorLevelFilter, oemEppFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setPreferenceFilter('all');
    setVendorLevelFilter('all');
    setOemEppFilter('all');
  };

  const hasActiveFilters = searchTerm || preferenceFilter !== 'all' || vendorLevelFilter !== 'all' || oemEppFilter !== 'all';

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
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/vendors/${vendor.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{vendor.vendor_name}</p>
                          {vendor.poc && (
                            <p className="text-sm text-muted-foreground">POC: {vendor.poc}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {[vendor.city, vendor.state].filter(Boolean).join(', ') || '-'}
                        {vendor.zip_code && (
                          <span className="text-muted-foreground ml-1">({vendor.zip_code})</span>
                        )}
                      </div>
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
