/**
 * Offline Cache for Properties and Units
 * Caches property and unit data in IndexedDB for offline form use
 */

import { propertiesApi, unitsApi } from './api-services';
import {
  cacheProperties,
  cacheUnits,
  getCachedProperties as getPropertiesFromDB,
  getCachedUnits as getUnitsFromDB,
} from './inspection-db';
import type { CachedProperty, CachedUnit } from './inspection-types';

/**
 * Refresh the offline cache with latest property and unit data
 * Call this when inspection pages mount (if online)
 */
export async function refreshOfflineCache(): Promise<void> {
  try {
    // Fetch all properties
    const propertiesResponse = await propertiesApi.getAll();

    if (propertiesResponse.success && propertiesResponse.data) {
      const properties: CachedProperty[] = (
        Array.isArray(propertiesResponse.data)
          ? propertiesResponse.data
          : []
      ).map((p: any) => ({
        id: p.id,
        name: p.name || p.property_name || '',
        address: p.address || p.location || '',
        cached_at: new Date().toISOString(),
      }));

      await cacheProperties(properties);
    }

    // Fetch all units
    const unitsResponse = await unitsApi.getAll();

    if (unitsResponse.success && unitsResponse.data) {
      const units: CachedUnit[] = (
        Array.isArray(unitsResponse.data)
          ? unitsResponse.data
          : []
      ).map((u: any) => ({
        id: u.id,
        property_id: u.property_id,
        unit_number: u.unit_number || u.name || '',
        floor: u.floor,
        cached_at: new Date().toISOString(),
      }));

      await cacheUnits(units);
    }
  } catch (error) {
    console.error('Failed to refresh offline cache:', error);
    // Don't throw - cache refresh is best-effort
  }
}

/**
 * Get cached properties from IndexedDB
 * Falls back to empty array if cache is unavailable
 */
export async function getCachedProperties(): Promise<CachedProperty[]> {
  try {
    return await getPropertiesFromDB();
  } catch (error) {
    console.error('Failed to get cached properties:', error);
    return [];
  }
}

/**
 * Get cached units from IndexedDB
 * Falls back to empty array if cache is unavailable
 */
export async function getCachedUnits(propertyId?: number): Promise<CachedUnit[]> {
  try {
    return await getUnitsFromDB(propertyId);
  } catch (error) {
    console.error('Failed to get cached units:', error);
    return [];
  }
}

/**
 * Check if offline cache is available and populated
 */
export async function isCacheAvailable(): Promise<boolean> {
  try {
    const properties = await getPropertiesFromDB();
    return properties.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get properties - tries API first, falls back to cache
 */
export async function getPropertiesWithFallback(isOnline: boolean): Promise<CachedProperty[]> {
  if (isOnline) {
    try {
      const response = await propertiesApi.getAll();
      if (response.success && response.data) {
        const properties: CachedProperty[] = (
          Array.isArray(response.data) ? response.data : []
        ).map((p: any) => ({
          id: p.id,
          name: p.name || p.property_name || '',
          address: p.address || p.location || '',
          cached_at: new Date().toISOString(),
        }));

        // Update cache in background
        cacheProperties(properties).catch(console.error);

        return properties;
      }
    } catch (error) {
      console.error('Failed to fetch properties from API:', error);
    }
  }

  // Fall back to cache
  return getCachedProperties();
}

/**
 * Get units - tries API first, falls back to cache
 */
export async function getUnitsWithFallback(
  isOnline: boolean,
  propertyId?: number
): Promise<CachedUnit[]> {
  if (isOnline) {
    try {
      const response = propertyId
        ? await unitsApi.list(propertyId.toString())
        : await unitsApi.getAll();

      if (response.success && response.data) {
        const units: CachedUnit[] = (
          Array.isArray(response.data) ? response.data : []
        ).map((u: any) => ({
          id: u.id,
          property_id: u.property_id,
          unit_number: u.unit_number || u.name || '',
          floor: u.floor,
          cached_at: new Date().toISOString(),
        }));

        // Update cache in background (only if fetching all)
        if (!propertyId) {
          cacheUnits(units).catch(console.error);
        }

        // Filter by property if needed
        if (propertyId) {
          return units.filter((u) => u.property_id === propertyId);
        }

        return units;
      }
    } catch (error) {
      console.error('Failed to fetch units from API:', error);
    }
  }

  // Fall back to cache
  return getCachedUnits(propertyId);
}
