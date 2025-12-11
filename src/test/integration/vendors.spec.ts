import { describe, expect, test, beforeAll, afterAll, afterEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

/**
 * Integration tests for Vendor CRUD operations
 * These tests interact with the actual Supabase database
 * Per T-3: Separated from unit tests since they touch DB
 */

// Track created vendor IDs for cleanup
const createdVendorIds: string[] = [];

// Test data factory
const createTestVendor = (overrides = {}) => ({
  vendor_name: `Test Vendor ${Date.now()}`,
  city: 'Test City',
  state: 'TX',
  zip_code: '75001',
  phone_no: '555-0100',
  email_address: 'test@example.com',
  oem: false,
  epp: false,
  hr_labour_rate: 75,
  ...overrides,
});

describe('Vendor CRUD Integration Tests', () => {
  afterEach(async () => {
    // Clean up created vendors after each test
    for (const id of createdVendorIds) {
      await supabase.from('vendors').delete().eq('id', id);
    }
    createdVendorIds.length = 0;
  });

  describe('CREATE', () => {
    test('creates a vendor with required fields', async () => {
      const vendorData = createTestVendor();

      const { data, error } = await supabase
        .from('vendors')
        .insert(vendorData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.vendor_name).toBe(vendorData.vendor_name);
      expect(data?.city).toBe(vendorData.city);
      expect(data?.id).toBeDefined();

      if (data?.id) createdVendorIds.push(data.id);
    });

    test('creates a vendor with all optional fields', async () => {
      const vendorData = createTestVendor({
        poc: 'John Doe',
        address: '123 Main St',
        fax_no: '555-0101',
        comments: 'Test comments',
        vendor_level: 'Good',
        preference: 'Preferred',
        latitude: 32.7767,
        longitude: -96.797,
      });

      const { data, error } = await supabase
        .from('vendors')
        .insert(vendorData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.poc).toBe('John Doe');
      expect(data?.vendor_level).toBe('Good');
      expect(data?.latitude).toBe(32.7767);

      if (data?.id) createdVendorIds.push(data.id);
    });

    test('fails when vendor_name is missing', async () => {
      const { vendor_name, ...vendorDataWithoutName } = createTestVendor();

      const { data, error } = await supabase
        .from('vendors')
        .insert(vendorDataWithoutName as never)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(data).toBeNull();
    });
  });

  describe('READ', () => {
    test('reads a single vendor by id', async () => {
      // Create a vendor first
      const vendorData = createTestVendor();
      const { data: created } = await supabase
        .from('vendors')
        .insert(vendorData)
        .select()
        .single();

      if (created?.id) createdVendorIds.push(created.id);

      // Read the vendor
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', created!.id)
        .single();

      expect(error).toBeNull();
      expect(data?.vendor_name).toBe(vendorData.vendor_name);
    });

    test('reads vendors with filters', async () => {
      // Create vendors with different states
      const vendor1 = createTestVendor({ state: 'TX', vendor_name: 'TX Vendor 1' });
      const vendor2 = createTestVendor({ state: 'CA', vendor_name: 'CA Vendor 1' });

      const { data: created1 } = await supabase.from('vendors').insert(vendor1).select().single();
      const { data: created2 } = await supabase.from('vendors').insert(vendor2).select().single();

      if (created1?.id) createdVendorIds.push(created1.id);
      if (created2?.id) createdVendorIds.push(created2.id);

      // Filter by state
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('state', 'TX')
        .in('id', [created1!.id, created2!.id]);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0].state).toBe('TX');
    });

    test('reads vendors with ordering', async () => {
      const vendor1 = createTestVendor({ vendor_name: 'AAA Vendor' });
      const vendor2 = createTestVendor({ vendor_name: 'ZZZ Vendor' });

      const { data: created1 } = await supabase.from('vendors').insert(vendor1).select().single();
      const { data: created2 } = await supabase.from('vendors').insert(vendor2).select().single();

      if (created1?.id) createdVendorIds.push(created1.id);
      if (created2?.id) createdVendorIds.push(created2.id);

      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .in('id', [created1!.id, created2!.id])
        .order('vendor_name', { ascending: true });

      expect(error).toBeNull();
      expect(data?.[0].vendor_name).toBe('AAA Vendor');
      expect(data?.[1].vendor_name).toBe('ZZZ Vendor');
    });
  });

  describe('UPDATE', () => {
    test('updates vendor fields', async () => {
      // Create a vendor
      const vendorData = createTestVendor();
      const { data: created } = await supabase
        .from('vendors')
        .insert(vendorData)
        .select()
        .single();

      if (created?.id) createdVendorIds.push(created.id);

      // Update the vendor
      const { data, error } = await supabase
        .from('vendors')
        .update({ city: 'Updated City', hr_labour_rate: 100 })
        .eq('id', created!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.city).toBe('Updated City');
      expect(data?.hr_labour_rate).toBe(100);
      // Original field should be unchanged
      expect(data?.vendor_name).toBe(vendorData.vendor_name);
    });

    test('updates vendor oem/epp flags', async () => {
      const vendorData = createTestVendor({ oem: false, epp: false });
      const { data: created } = await supabase
        .from('vendors')
        .insert(vendorData)
        .select()
        .single();

      if (created?.id) createdVendorIds.push(created.id);

      const { data, error } = await supabase
        .from('vendors')
        .update({ oem: true, epp: true })
        .eq('id', created!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.oem).toBe(true);
      expect(data?.epp).toBe(true);
    });

    test('updates vendor level and preference', async () => {
      const vendorData = createTestVendor();
      const { data: created } = await supabase
        .from('vendors')
        .insert(vendorData)
        .select()
        .single();

      if (created?.id) createdVendorIds.push(created.id);

      const { data, error } = await supabase
        .from('vendors')
        .update({ vendor_level: 'Bad', preference: 'Do Not Use' })
        .eq('id', created!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.vendor_level).toBe('Bad');
      expect(data?.preference).toBe('Do Not Use');
    });

    test('clears optional fields with null', async () => {
      const vendorData = createTestVendor({ comments: 'Initial comment' });
      const { data: created } = await supabase
        .from('vendors')
        .insert(vendorData)
        .select()
        .single();

      if (created?.id) createdVendorIds.push(created.id);

      const { data, error } = await supabase
        .from('vendors')
        .update({ comments: null })
        .eq('id', created!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.comments).toBeNull();
    });
  });

  describe('DELETE', () => {
    test('deletes a vendor', async () => {
      const vendorData = createTestVendor();
      const { data: created } = await supabase
        .from('vendors')
        .insert(vendorData)
        .select()
        .single();

      // Delete the vendor
      const { error: deleteError } = await supabase
        .from('vendors')
        .delete()
        .eq('id', created!.id);

      expect(deleteError).toBeNull();

      // Verify deletion
      const { data: found, error: selectError } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', created!.id)
        .single();

      expect(selectError).not.toBeNull(); // Should error because not found
      expect(found).toBeNull();
    });

    test('delete is idempotent (no error when deleting non-existent)', async () => {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', '00000000-0000-0000-0000-000000000000');

      // Should not error, just delete 0 rows
      expect(error).toBeNull();
    });
  });

  describe('Coordinate Auto-population', () => {
    test('populates coordinates from zipcode on insert', async () => {
      // First check if zipcode 75001 exists in zipcode_lists
      const { data: zipData } = await supabase
        .from('zipcode_lists')
        .select('latitude, longitude')
        .eq('zipcode', '75001')
        .single();

      if (!zipData) {
        // Skip test if zipcode not in database
        console.log('Skipping: zipcode 75001 not in database');
        return;
      }

      const vendorData = createTestVendor({ zip_code: '75001', latitude: null, longitude: null });
      const { data, error } = await supabase
        .from('vendors')
        .insert(vendorData)
        .select()
        .single();

      if (data?.id) createdVendorIds.push(data.id);

      expect(error).toBeNull();
      // Trigger should populate coordinates
      expect(data?.latitude).toBe(zipData.latitude);
      expect(data?.longitude).toBe(zipData.longitude);
    });
  });
});
