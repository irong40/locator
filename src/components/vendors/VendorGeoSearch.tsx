import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Search, X, Loader2 } from 'lucide-react';

type Props = {
  onSearch: (zipCode: string, radius: number) => void;
  onClear: () => void;
  isLoading: boolean;
  activeSearch: { zipCode: string; radius: number } | null;
};

const RADIUS_OPTIONS = [10, 25, 50, 100, 150, 200, 250];

export function VendorGeoSearch({ onSearch, onClear, isLoading, activeSearch }: Props) {
  const [zipCode, setZipCode] = useState(activeSearch?.zipCode ?? '');
  const [radius, setRadius] = useState(activeSearch?.radius?.toString() ?? '50');

  const handleSearch = () => {
    if (zipCode.trim()) {
      onSearch(zipCode.trim(), parseInt(radius, 10));
    }
  };

  const handleClear = () => {
    setZipCode('');
    setRadius('50');
    onClear();
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          Geographic Vendor Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="search-zip" className="text-sm font-medium">
              Zip Code
            </Label>
            <Input
              id="search-zip"
              placeholder="Enter zip code (e.g., 90210)"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="mt-1"
            />
          </div>
          <div className="w-full sm:w-40">
            <Label htmlFor="search-radius" className="text-sm font-medium">
              Radius (miles)
            </Label>
            <Select value={radius} onValueChange={setRadius}>
              <SelectTrigger id="search-radius" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RADIUS_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r.toString()}>
                    {r} miles
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 items-end">
            <Button onClick={handleSearch} disabled={!zipCode.trim() || isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
            {activeSearch && (
              <Button variant="outline" onClick={handleClear}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>
        {activeSearch && (
          <p className="text-sm text-muted-foreground mt-3">
            Showing vendors within {activeSearch.radius} miles of zip code {activeSearch.zipCode}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
