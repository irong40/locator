import type { Vendor } from './types';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in miles
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const earthRadiusKm = 6371;

  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = earthRadiusKm * c;
  const distanceMiles = distanceKm * 0.621371;

  return distanceMiles;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Filter vendors within specified radius
 */
export function filterVendorsWithinRadius(
  vendors: Vendor[],
  centerLat: number,
  centerLng: number,
  radiusMiles: number
): (Vendor & { distance: number })[] {
  return vendors
    .filter((vendor) => {
      if (!vendor.latitude || !vendor.longitude) return false;
      const distance = calculateDistance(
        centerLat,
        centerLng,
        vendor.latitude,
        vendor.longitude
      );
      return distance <= radiusMiles;
    })
    .map((vendor) => ({
      ...vendor,
      distance: calculateDistance(
        centerLat,
        centerLng,
        vendor.latitude!,
        vendor.longitude!
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
}
