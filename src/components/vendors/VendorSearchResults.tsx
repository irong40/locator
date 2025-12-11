import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Mail, Navigation } from 'lucide-react';
import type { VendorWithDistance } from '@/hooks/useVendorSearch';

type Props = {
  vendors: VendorWithDistance[];
  onSelectVendor?: (vendor: VendorWithDistance) => void;
};

export function VendorSearchResults({ vendors, onSelectVendor }: Props) {
  if (vendors.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            No vendors found within the specified radius.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Try increasing the search radius or entering a different zip code.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Found {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
      </p>
      {vendors.map((vendor) => (
        <Card
          key={vendor.id}
          className="hover:bg-accent/50 cursor-pointer transition-colors"
          onClick={() => onSelectVendor?.(vendor)}
        >
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground truncate">
                    {vendor.vendor_name}
                  </h3>
                  {vendor.oem && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      OEM
                    </Badge>
                  )}
                  {vendor.epp && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      EPP
                    </Badge>
                  )}
                  {vendor.preference === 'Preferred' && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Preferred
                    </Badge>
                  )}
                  {vendor.preference === 'Do Not Use' && (
                    <Badge variant="destructive">Do Not Use</Badge>
                  )}
                </div>
                
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {vendor.address && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">
                        {[vendor.address, vendor.city, vendor.state, vendor.zip_code]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </p>
                  )}
                  {vendor.phone_no && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                      {vendor.phone_no}
                    </p>
                  )}
                  {vendor.email_address && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{vendor.email_address}</span>
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-primary font-medium sm:text-right">
                <Navigation className="h-4 w-4" />
                <span>{vendor.distance.toFixed(1)} mi</span>
              </div>
            </div>
            
            {vendor.hr_labour_rate > 0 && (
              <p className="mt-2 text-sm">
                <span className="text-muted-foreground">Labor Rate:</span>{' '}
                <span className="font-medium">${vendor.hr_labour_rate}/hr</span>
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
