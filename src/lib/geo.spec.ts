import { describe, expect, test } from 'vitest';
import { calculateDistance, filterVendorsWithinRadius } from './geo';
import type { Vendor } from './types';

describe('calculateDistance', () => {
  test('returns 0 for same coordinates', () => {
    const result = calculateDistance(40.7128, -74.006, 40.7128, -74.006);
    expect(result).toBe(0);
  });

  test('calculates distance between NYC and LA correctly', () => {
    // NYC: 40.7128, -74.0060
    // LA: 34.0522, -118.2437
    // Expected: ~2451 miles
    const result = calculateDistance(40.7128, -74.006, 34.0522, -118.2437);
    expect(result).toBeGreaterThan(2400);
    expect(result).toBeLessThan(2500);
  });

  test('calculates short distances correctly', () => {
    // JFK to LaGuardia: ~10 miles
    const result = calculateDistance(40.6413, -73.7781, 40.7769, -73.874);
    expect(result).toBeGreaterThan(8);
    expect(result).toBeLessThan(12);
  });

  test('distance is symmetric', () => {
    const d1 = calculateDistance(40.7128, -74.006, 34.0522, -118.2437);
    const d2 = calculateDistance(34.0522, -118.2437, 40.7128, -74.006);
    expect(d1).toBeCloseTo(d2, 10);
  });
});

describe('filterVendorsWithinRadius', () => {
  const mockVendors: Vendor[] = [
    {
      id: '1',
      vendor_name: 'Nearby Vendor',
      latitude: 40.72,
      longitude: -74.01,
      city: 'NYC',
      state: 'NY',
      zip_code: '10001',
    } as Vendor,
    {
      id: '2',
      vendor_name: 'Far Vendor',
      latitude: 34.0522,
      longitude: -118.2437,
      city: 'LA',
      state: 'CA',
      zip_code: '90001',
    } as Vendor,
    {
      id: '3',
      vendor_name: 'No Coords Vendor',
      latitude: null,
      longitude: null,
      city: 'Unknown',
      state: 'XX',
      zip_code: null,
    } as Vendor,
  ];

  test('filters vendors within radius', () => {
    const result = filterVendorsWithinRadius(mockVendors, 40.7128, -74.006, 50);
    expect(result).toHaveLength(1);
    expect(result[0].vendor_name).toBe('Nearby Vendor');
  });

  test('excludes vendors without coordinates', () => {
    const result = filterVendorsWithinRadius(mockVendors, 40.7128, -74.006, 5000);
    expect(result.find((v) => v.id === '3')).toBeUndefined();
  });

  test('returns empty array when no vendors in radius', () => {
    const result = filterVendorsWithinRadius(mockVendors, 0, 0, 1);
    expect(result).toHaveLength(0);
  });

  test('sorts results by distance ascending', () => {
    const vendors: Vendor[] = [
      { id: '1', vendor_name: 'Far', latitude: 40.8, longitude: -74.1 } as Vendor,
      { id: '2', vendor_name: 'Near', latitude: 40.72, longitude: -74.01 } as Vendor,
    ];
    const result = filterVendorsWithinRadius(vendors, 40.7128, -74.006, 100);
    expect(result[0].vendor_name).toBe('Near');
    expect(result[1].vendor_name).toBe('Far');
  });

  test('includes distance property on results', () => {
    const result = filterVendorsWithinRadius(mockVendors, 40.7128, -74.006, 50);
    expect(result[0]).toHaveProperty('distance');
    expect(typeof result[0].distance).toBe('number');
  });
});
