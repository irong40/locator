import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Factory, Wrench, Package, Plus, X, Shield, Loader2, Search } from 'lucide-react';

type BrandType = 'oem' | 'epp' | 'engine' | 'product';

interface VendorBrandManagerProps {
  vendorId: string;
  oemBrands: Array<{ id: string; oem_brand_id: string; oem_brands: { oem_brand: string } | null }>;
  eppBrands: Array<{ id: string; oem_brand_id: string; oem_brands: { oem_brand: string } | null }>;
  engineBrands: Array<{ id: string; engine_brand_id: string; is_certified: boolean | null; engine_brands: { engine_brand: string } | null }>;
  products: Array<{ id: string; product_id: string; products: { product: string } | null }>;
}

export function VendorBrandManager({
  vendorId,
  oemBrands,
  eppBrands,
  engineBrands,
  products,
}: VendorBrandManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeDialog, setActiveDialog] = useState<BrandType | null>(null);
  const [searchQueries, setSearchQueries] = useState<Record<BrandType, string>>({
    oem: '',
    epp: '',
    engine: '',
    product: '',
  });

  const updateSearch = (type: BrandType, value: string) => {
    setSearchQueries((prev) => ({ ...prev, [type]: value }));
  };

  const handleDialogChange = (type: BrandType, open: boolean) => {
    setActiveDialog(open ? type : null);
    if (!open) {
      updateSearch(type, '');
    }
  };

  // Fetch all available brands
  const { data: allOemBrands } = useQuery({
    queryKey: ['all-oem-brands'],
    queryFn: async () => {
      const { data, error } = await supabase.from('oem_brands').select('*').order('oem_brand');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: allEngineBrands } = useQuery({
    queryKey: ['all-engine-brands'],
    queryFn: async () => {
      const { data, error } = await supabase.from('engine_brands').select('*').order('engine_brand');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: allProducts } = useQuery({
    queryKey: ['all-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('product');
      if (error) throw error;
      return data ?? [];
    },
  });

  // Mutations for adding/removing associations
  const addOemBrand = useMutation({
    mutationFn: async (oemBrandId: string) => {
      const { error } = await supabase.from('vendor_oem_brands').insert({ vendor_id: vendorId, oem_brand_id: oemBrandId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-oem-brands', vendorId] });
      toast({ title: 'OEM brand added' });
    },
    onError: (error) => toast({ title: 'Error adding OEM brand', description: error.message, variant: 'destructive' }),
  });

  const removeOemBrand = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vendor_oem_brands').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-oem-brands', vendorId] });
      toast({ title: 'OEM brand removed' });
    },
    onError: (error) => toast({ title: 'Error removing OEM brand', description: error.message, variant: 'destructive' }),
  });

  const addEppBrand = useMutation({
    mutationFn: async (oemBrandId: string) => {
      const { error } = await supabase.from('vendor_epp_brands').insert({ vendor_id: vendorId, oem_brand_id: oemBrandId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-epp-brands', vendorId] });
      toast({ title: 'EPP brand added' });
    },
    onError: (error) => toast({ title: 'Error adding EPP brand', description: error.message, variant: 'destructive' }),
  });

  const removeEppBrand = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vendor_epp_brands').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-epp-brands', vendorId] });
      toast({ title: 'EPP brand removed' });
    },
    onError: (error) => toast({ title: 'Error removing EPP brand', description: error.message, variant: 'destructive' }),
  });

  const addEngineBrand = useMutation({
    mutationFn: async ({ engineBrandId, isCertified }: { engineBrandId: string; isCertified: boolean }) => {
      const { error } = await supabase.from('vendor_engine_brands').insert({ 
        vendor_id: vendorId, 
        engine_brand_id: engineBrandId,
        is_certified: isCertified,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-engine-brands', vendorId] });
      toast({ title: 'Engine brand added' });
    },
    onError: (error) => toast({ title: 'Error adding engine brand', description: error.message, variant: 'destructive' }),
  });

  const removeEngineBrand = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vendor_engine_brands').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-engine-brands', vendorId] });
      toast({ title: 'Engine brand removed' });
    },
    onError: (error) => toast({ title: 'Error removing engine brand', description: error.message, variant: 'destructive' }),
  });

  const updateEngineBrandCertification = useMutation({
    mutationFn: async ({ id, isCertified }: { id: string; isCertified: boolean }) => {
      const { error } = await supabase.from('vendor_engine_brands').update({ is_certified: isCertified }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-engine-brands', vendorId] });
      toast({ title: 'Certification updated' });
    },
    onError: (error) => toast({ title: 'Error updating certification', description: error.message, variant: 'destructive' }),
  });

  const addProduct = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from('vendor_products').insert({ vendor_id: vendorId, product_id: productId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products', vendorId] });
      toast({ title: 'Product added' });
    },
    onError: (error) => toast({ title: 'Error adding product', description: error.message, variant: 'destructive' }),
  });

  const removeProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vendor_products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products', vendorId] });
      toast({ title: 'Product removed' });
    },
    onError: (error) => toast({ title: 'Error removing product', description: error.message, variant: 'destructive' }),
  });

  const existingOemBrandIds = new Set(oemBrands.map((b) => b.oem_brand_id));
  const existingEppBrandIds = new Set(eppBrands.map((b) => b.oem_brand_id));
  const existingEngineBrandIds = new Set(engineBrands.map((b) => b.engine_brand_id));
  const existingProductIds = new Set(products.map((p) => p.product_id));

  const availableOemBrands = allOemBrands?.filter((b) => !existingOemBrandIds.has(b.id)) ?? [];
  const availableEppBrands = allOemBrands?.filter((b) => !existingEppBrandIds.has(b.id)) ?? [];
  const availableEngineBrands = allEngineBrands?.filter((b) => !existingEngineBrandIds.has(b.id)) ?? [];
  const availableProducts = allProducts?.filter((p) => !existingProductIds.has(p.id)) ?? [];

  // Filtered lists based on search
  const filteredOemBrands = useMemo(() => {
    const query = searchQueries.oem.toLowerCase().trim();
    if (!query) return availableOemBrands;
    return availableOemBrands.filter((b) => b.oem_brand.toLowerCase().includes(query));
  }, [availableOemBrands, searchQueries.oem]);

  const filteredEppBrands = useMemo(() => {
    const query = searchQueries.epp.toLowerCase().trim();
    if (!query) return availableEppBrands;
    return availableEppBrands.filter((b) => b.oem_brand.toLowerCase().includes(query));
  }, [availableEppBrands, searchQueries.epp]);

  const filteredEngineBrands = useMemo(() => {
    const query = searchQueries.engine.toLowerCase().trim();
    if (!query) return availableEngineBrands;
    return availableEngineBrands.filter((b) => b.engine_brand.toLowerCase().includes(query));
  }, [availableEngineBrands, searchQueries.engine]);

  const filteredProducts = useMemo(() => {
    const query = searchQueries.product.toLowerCase().trim();
    if (!query) return availableProducts;
    return availableProducts.filter((p) => p.product.toLowerCase().includes(query));
  }, [availableProducts, searchQueries.product]);

  return (
    <div className="space-y-6">
      {/* OEM Brands */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Factory className="h-4 w-4 text-secondary" />
              OEM Brands ({oemBrands.length})
            </CardTitle>
            <Dialog open={activeDialog === 'oem'} onOpenChange={(open) => handleDialogChange('oem', open)}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add OEM Brands</DialogTitle>
                </DialogHeader>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search brands..."
                    value={searchQueries.oem}
                    onChange={(e) => updateSearch('oem', e.target.value)}
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="max-h-[350px]">
                  {filteredOemBrands.length > 0 ? (
                    <div className="space-y-2 p-1">
                      {filteredOemBrands.map((brand) => (
                        <div key={brand.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                          <span>{brand.oem_brand}</span>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => addOemBrand.mutate(brand.id)}
                            disabled={addOemBrand.isPending}
                          >
                            {addOemBrand.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : searchQueries.oem ? (
                    <p className="text-muted-foreground text-center py-4">No brands match your search</p>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">All OEM brands are already assigned</p>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {oemBrands.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {oemBrands.map((item) => (
                <Badge key={item.id} variant="outline" className="flex items-center gap-1 pr-1">
                  {item.oem_brands?.oem_brand}
                  <button
                    onClick={() => removeOemBrand.mutate(item.id)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    disabled={removeOemBrand.isPending}
                  >
                    <X className="h-3 w-3" />
                  </button>
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Factory className="h-4 w-4 text-cta" />
              EPP Brands ({eppBrands.length})
            </CardTitle>
            <Dialog open={activeDialog === 'epp'} onOpenChange={(open) => handleDialogChange('epp', open)}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add EPP Brands</DialogTitle>
                </DialogHeader>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search brands..."
                    value={searchQueries.epp}
                    onChange={(e) => updateSearch('epp', e.target.value)}
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="max-h-[350px]">
                  {filteredEppBrands.length > 0 ? (
                    <div className="space-y-2 p-1">
                      {filteredEppBrands.map((brand) => (
                        <div key={brand.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                          <span>{brand.oem_brand}</span>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => addEppBrand.mutate(brand.id)}
                            disabled={addEppBrand.isPending}
                          >
                            {addEppBrand.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : searchQueries.epp ? (
                    <p className="text-muted-foreground text-center py-4">No brands match your search</p>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">All brands are already assigned as EPP</p>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {eppBrands.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {eppBrands.map((item) => (
                <Badge key={item.id} variant="outline" className="flex items-center gap-1 pr-1 border-cta text-cta">
                  {item.oem_brands?.oem_brand}
                  <button
                    onClick={() => removeEppBrand.mutate(item.id)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    disabled={removeEppBrand.isPending}
                  >
                    <X className="h-3 w-3" />
                  </button>
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="h-4 w-4 text-primary" />
              Engine Brands ({engineBrands.length})
            </CardTitle>
            <Dialog open={activeDialog === 'engine'} onOpenChange={(open) => handleDialogChange('engine', open)}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Engine Brands</DialogTitle>
                </DialogHeader>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search engine brands..."
                    value={searchQueries.engine}
                    onChange={(e) => updateSearch('engine', e.target.value)}
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="max-h-[350px]">
                  {filteredEngineBrands.length > 0 ? (
                    <div className="space-y-2 p-1">
                      {filteredEngineBrands.map((brand) => (
                        <EngineBrandAddRow
                          key={brand.id}
                          brand={brand}
                          onAdd={(isCertified) => addEngineBrand.mutate({ engineBrandId: brand.id, isCertified })}
                          isPending={addEngineBrand.isPending}
                        />
                      ))}
                    </div>
                  ) : searchQueries.engine ? (
                    <p className="text-muted-foreground text-center py-4">No engine brands match your search</p>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">All engine brands are already assigned</p>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {engineBrands.length > 0 ? (
            <div className="space-y-2">
              {engineBrands.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Badge variant={item.is_certified ? 'default' : 'secondary'} className="flex items-center gap-1">
                      {item.engine_brands?.engine_brand}
                      {item.is_certified && <Shield className="h-3 w-3" />}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`cert-${item.id}`}
                        checked={item.is_certified ?? false}
                        onCheckedChange={(checked) => updateEngineBrandCertification.mutate({ id: item.id, isCertified: checked })}
                      />
                      <Label htmlFor={`cert-${item.id}`} className="text-xs cursor-pointer">Certified</Label>
                    </div>
                    <button
                      onClick={() => removeEngineBrand.mutate(item.id)}
                      className="hover:bg-destructive/20 rounded-full p-1"
                      disabled={removeEngineBrand.isPending}
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-accent" />
              Products ({products.length})
            </CardTitle>
            <Dialog open={activeDialog === 'product'} onOpenChange={(open) => handleDialogChange('product', open)}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Products</DialogTitle>
                </DialogHeader>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQueries.product}
                    onChange={(e) => updateSearch('product', e.target.value)}
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="max-h-[350px]">
                  {filteredProducts.length > 0 ? (
                    <div className="space-y-2 p-1">
                      {filteredProducts.map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                          <span>{product.product}</span>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => addProduct.mutate(product.id)}
                            disabled={addProduct.isPending}
                          >
                            {addProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : searchQueries.product ? (
                    <p className="text-muted-foreground text-center py-4">No products match your search</p>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">All products are already assigned</p>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {products.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {products.map((item) => (
                <Badge key={item.id} variant="secondary" className="flex items-center gap-1 pr-1">
                  {item.products?.product}
                  <button
                    onClick={() => removeProduct.mutate(item.id)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    disabled={removeProduct.isPending}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No products assigned</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EngineBrandAddRow({
  brand,
  onAdd,
  isPending,
}: {
  brand: { id: string; engine_brand: string };
  onAdd: (isCertified: boolean) => void;
  isPending: boolean;
}) {
  const [isCertified, setIsCertified] = useState(false);

  return (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
      <span>{brand.engine_brand}</span>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`add-cert-${brand.id}`}
            checked={isCertified}
            onCheckedChange={(checked) => setIsCertified(checked === true)}
          />
          <Label htmlFor={`add-cert-${brand.id}`} className="text-xs cursor-pointer">Certified</Label>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onAdd(isCertified)}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
        </Button>
      </div>
    </div>
  );
}
