import { describe, expect, test, afterEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

/**
 * Integration tests for Vendor relationship operations
 * Tests junction tables: vendor_engine_brands, vendor_oem_brands, vendor_epp_brands, vendor_products
 */

// Track created IDs for cleanup
const createdVendorIds: string[] = [];
type JunctionTable = 'vendor_engine_brands' | 'vendor_oem_brands' | 'vendor_epp_brands' | 'vendor_products';
const createdJunctionIds: { table: JunctionTable; id: string }[] = [];

// Test data factory
const createTestVendor = (overrides = {}) => ({
  vendor_name: `Test Vendor ${Date.now()}`,
  city: 'Test City',
  state: 'TX',
  ...overrides,
});

describe('Vendor Relations Integration Tests', () => {
  afterEach(async () => {
    // Clean up junction records first
    for (const { table, id } of createdJunctionIds) {
      await supabase.from(table).delete().eq('id', id);
    }
    createdJunctionIds.length = 0;

    // Clean up vendors
    for (const id of createdVendorIds) {
      await supabase.from('vendors').delete().eq('id', id);
    }
    createdVendorIds.length = 0;
  });

  describe('Vendor Engine Brands', () => {
    test('links vendor to engine brand', async () => {
      // Create vendor
      const { data: vendor } = await supabase
        .from('vendors')
        .insert(createTestVendor())
        .select()
        .single();

      if (vendor?.id) createdVendorIds.push(vendor.id);

      // Get first engine brand
      const { data: engineBrands } = await supabase
        .from('engine_brands')
        .select('id')
        .limit(1);

      if (!engineBrands?.length) {
        console.log('Skipping: no engine brands in database');
        return;
      }

      // Link vendor to engine brand
      const { data, error } = await supabase
        .from('vendor_engine_brands')
        .insert({
          vendor_id: vendor!.id,
          engine_brand_id: engineBrands[0].id,
          is_certified: true,
        })
        .select()
        .single();

      if (data?.id) createdJunctionIds.push({ table: 'vendor_engine_brands', id: data.id });

      expect(error).toBeNull();
      expect(data?.vendor_id).toBe(vendor!.id);
      expect(data?.is_certified).toBe(true);
    });

    test('reads vendor with engine brands', async () => {
      // Create vendor
      const { data: vendor } = await supabase
        .from('vendors')
        .insert(createTestVendor())
        .select()
        .single();

      if (vendor?.id) createdVendorIds.push(vendor.id);

      // Get engine brand
      const { data: engineBrands } = await supabase
        .from('engine_brands')
        .select('id, engine_brand')
        .limit(1);

      if (!engineBrands?.length) return;

      // Link vendor to engine brand
      const { data: junction } = await supabase
        .from('vendor_engine_brands')
        .insert({
          vendor_id: vendor!.id,
          engine_brand_id: engineBrands[0].id,
        })
        .select()
        .single();

      if (junction?.id) createdJunctionIds.push({ table: 'vendor_engine_brands', id: junction.id });

      // Read vendor with engine brands
      const { data, error } = await supabase
        .from('vendors')
        .select(`
          *,
          vendor_engine_brands (
            id,
            is_certified,
            engine_brands (
              id,
              engine_brand
            )
          )
        `)
        .eq('id', vendor!.id)
        .single();

      expect(error).toBeNull();
      expect(data?.vendor_engine_brands).toHaveLength(1);
      expect(data?.vendor_engine_brands[0].engine_brands?.engine_brand).toBe(
        engineBrands[0].engine_brand
      );
    });

    test('removes engine brand from vendor', async () => {
      // Create vendor
      const { data: vendor } = await supabase
        .from('vendors')
        .insert(createTestVendor())
        .select()
        .single();

      if (vendor?.id) createdVendorIds.push(vendor.id);

      // Get engine brand
      const { data: engineBrands } = await supabase
        .from('engine_brands')
        .select('id')
        .limit(1);

      if (!engineBrands?.length) return;

      // Link and then unlink
      const { data: junction } = await supabase
        .from('vendor_engine_brands')
        .insert({
          vendor_id: vendor!.id,
          engine_brand_id: engineBrands[0].id,
        })
        .select()
        .single();

      // Delete the junction
      const { error } = await supabase
        .from('vendor_engine_brands')
        .delete()
        .eq('id', junction!.id);

      expect(error).toBeNull();

      // Verify deletion
      const { data: check } = await supabase
        .from('vendor_engine_brands')
        .select('id')
        .eq('id', junction!.id)
        .single();

      expect(check).toBeNull();
    });
  });

  describe('Vendor OEM Brands', () => {
    test('links vendor to OEM brand', async () => {
      const { data: vendor } = await supabase
        .from('vendors')
        .insert(createTestVendor())
        .select()
        .single();

      if (vendor?.id) createdVendorIds.push(vendor.id);

      const { data: oemBrands } = await supabase.from('oem_brands').select('id').limit(1);

      if (!oemBrands?.length) {
        console.log('Skipping: no OEM brands in database');
        return;
      }

      const { data, error } = await supabase
        .from('vendor_oem_brands')
        .insert({
          vendor_id: vendor!.id,
          oem_brand_id: oemBrands[0].id,
        })
        .select()
        .single();

      if (data?.id) createdJunctionIds.push({ table: 'vendor_oem_brands', id: data.id });

      expect(error).toBeNull();
      expect(data?.vendor_id).toBe(vendor!.id);
    });
  });

  describe('Vendor EPP Brands', () => {
    test('links vendor to EPP brand', async () => {
      const { data: vendor } = await supabase
        .from('vendors')
        .insert(createTestVendor())
        .select()
        .single();

      if (vendor?.id) createdVendorIds.push(vendor.id);

      const { data: oemBrands } = await supabase.from('oem_brands').select('id').limit(1);

      if (!oemBrands?.length) {
        console.log('Skipping: no OEM brands in database');
        return;
      }

      const { data, error } = await supabase
        .from('vendor_epp_brands')
        .insert({
          vendor_id: vendor!.id,
          oem_brand_id: oemBrands[0].id,
        })
        .select()
        .single();

      if (data?.id) createdJunctionIds.push({ table: 'vendor_epp_brands', id: data.id });

      expect(error).toBeNull();
      expect(data?.vendor_id).toBe(vendor!.id);
    });
  });

  describe('Vendor Products', () => {
    test('links vendor to product', async () => {
      const { data: vendor } = await supabase
        .from('vendors')
        .insert(createTestVendor())
        .select()
        .single();

      if (vendor?.id) createdVendorIds.push(vendor.id);

      const { data: products } = await supabase.from('products').select('id').limit(1);

      if (!products?.length) {
        console.log('Skipping: no products in database');
        return;
      }

      const { data, error } = await supabase
        .from('vendor_products')
        .insert({
          vendor_id: vendor!.id,
          product_id: products[0].id,
        })
        .select()
        .single();

      if (data?.id) createdJunctionIds.push({ table: 'vendor_products', id: data.id });

      expect(error).toBeNull();
      expect(data?.vendor_id).toBe(vendor!.id);
    });

    test('reads vendor with products', async () => {
      const { data: vendor } = await supabase
        .from('vendors')
        .insert(createTestVendor())
        .select()
        .single();

      if (vendor?.id) createdVendorIds.push(vendor.id);

      const { data: products } = await supabase
        .from('products')
        .select('id, product')
        .limit(1);

      if (!products?.length) return;

      const { data: junction } = await supabase
        .from('vendor_products')
        .insert({
          vendor_id: vendor!.id,
          product_id: products[0].id,
        })
        .select()
        .single();

      if (junction?.id) createdJunctionIds.push({ table: 'vendor_products', id: junction.id });

      const { data, error } = await supabase
        .from('vendors')
        .select(`
          *,
          vendor_products (
            id,
            products (
              id,
              product
            )
          )
        `)
        .eq('id', vendor!.id)
        .single();

      expect(error).toBeNull();
      expect(data?.vendor_products).toHaveLength(1);
      expect(data?.vendor_products[0].products?.product).toBe(products[0].product);
    });
  });
});
