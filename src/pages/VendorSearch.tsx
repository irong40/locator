import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { VendorGeoSearch } from '@/components/vendors/VendorGeoSearch';
import { VendorSearchResults } from '@/components/vendors/VendorSearchResults';
import { useVendorSearch } from '@/hooks/useVendorSearch';

export default function VendorSearch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { search, clear, searchParams: activeSearch, vendors, isLoading, error } = useVendorSearch();

  // Auto-search if URL has zip parameter
  useEffect(() => {
    const zipFromUrl = searchParams.get('zip');
    const radiusFromUrl = searchParams.get('radius');
    if (zipFromUrl && !activeSearch) {
      search(zipFromUrl, radiusFromUrl ? parseInt(radiusFromUrl, 10) : 50);
    }
  }, [searchParams, activeSearch, search]);

  const handleSearch = (zipCode: string, radius: number) => {
    search(zipCode, radius);
    // Update URL params for bookmarking/sharing
    const params = new URLSearchParams();
    params.set('zip', zipCode);
    params.set('radius', radius.toString());
    navigate(`/vendor-search?${params.toString()}`, { replace: true });
  };

  const handleClear = () => {
    clear();
    navigate('/vendor-search', { replace: true });
  };

  const handleSelectVendor = (vendor: { id: string }) => {
    navigate(`/vendors/${vendor.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Find Vendors</h1>
        <p className="text-muted-foreground">
          Search for vendors within a specified radius using the Haversine formula
        </p>
      </div>

      <VendorGeoSearch
        onSearch={handleSearch}
        onClear={handleClear}
        isLoading={isLoading}
        activeSearch={activeSearch}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'An error occurred while searching'}
          </AlertDescription>
        </Alert>
      )}

      {activeSearch && !isLoading && !error && (
        <VendorSearchResults vendors={vendors} onSelectVendor={handleSelectVendor} />
      )}
    </div>
  );
}
