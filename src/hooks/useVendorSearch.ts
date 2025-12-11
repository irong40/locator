import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateDistance } from '@/lib/geo';
import type { Vendor } from '@/lib/types';

export type VendorWithDistance = Vendor & { distance: number };

type SearchParams = {
  zipCode: string;
  radius: number;
};

export function useVendorSearch() {
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);

  const { data: zipCodeData, isLoading: isLoadingZip, error: zipError } = useQuery({
    queryKey: ['zipcode-lookup', searchParams?.zipCode],
    queryFn: async () => {
      if (!searchParams?.zipCode) return null;
      const { data, error } = await supabase
        .from('zipcode_lists')
        .select('*')
        .eq('zipcode', searchParams.zipCode)
        .single();
      
      if (error) throw new Error(`Zip code "${searchParams.zipCode}" not found`);
      return data;
    },
    enabled: !!searchParams?.zipCode,
  });

  const { data: vendors, isLoading: isLoadingVendors, error: vendorsError } = useQuery({
    queryKey: ['vendors-geo-search', zipCodeData?.latitude, zipCodeData?.longitude, searchParams?.radius],
    queryFn: async () => {
      if (!zipCodeData) return [];
      
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
      
      if (error) throw error;
      if (!data) return [];

      const centerLat = Number(zipCodeData.latitude);
      const centerLng = Number(zipCodeData.longitude);
      const radiusMiles = searchParams?.radius ?? 50;

      const vendorsWithDistance: VendorWithDistance[] = data
        .map((vendor) => ({
          ...vendor,
          distance: calculateDistance(
            centerLat,
            centerLng,
            Number(vendor.latitude),
            Number(vendor.longitude)
          ),
        }))
        .filter((v) => v.distance <= radiusMiles)
        .sort((a, b) => a.distance - b.distance) as VendorWithDistance[];

      return vendorsWithDistance;
    },
    enabled: !!zipCodeData,
  });

  const search = (zipCode: string, radius: number) => {
    setSearchParams({ zipCode: zipCode.trim(), radius });
  };

  const clear = () => {
    setSearchParams(null);
  };

  return {
    search,
    clear,
    searchParams,
    zipCodeData,
    vendors: vendors ?? [],
    isLoading: isLoadingZip || isLoadingVendors,
    error: zipError || vendorsError,
  };
}
