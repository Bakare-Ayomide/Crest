// Geo & Location calculation utilities for CREST Quick Preferences

export interface GeoLocation {
  name: string;
  lat: number;
  lng: number;
  country?: string;
  region?: string;
}

export const POPULAR_CITIES: GeoLocation[] = [
  { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194, country: 'United States', region: 'California' },
  { name: 'New York, NY', lat: 40.7128, lng: -74.0060, country: 'United States', region: 'New York' },
  { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437, country: 'United States', region: 'California' },
  { name: 'London', lat: 51.5074, lng: -0.1278, country: 'United Kingdom', region: 'England' },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, country: 'France', region: 'Île-de-France' },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, country: 'Japan', region: 'Kanto' },
  { name: 'Austin, TX', lat: 30.2672, lng: -97.7431, country: 'United States', region: 'Texas' },
  { name: 'Miami, FL', lat: 25.7617, lng: -80.1918, country: 'United States', region: 'Florida' },
  { name: 'Seattle, WA', lat: 47.6062, lng: -122.3321, country: 'United States', region: 'Washington' },
  { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298, country: 'United States', region: 'Illinois' },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832, country: 'Canada', region: 'Ontario' },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050, country: 'Germany', region: 'Berlin' },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, country: 'Australia', region: 'NSW' },
  { name: 'Barcelona', lat: 41.3879, lng: 2.1699, country: 'Spain', region: 'Catalonia' }
];

/**
 * Calculates distance in kilometers between two coordinates using the Haversine formula
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

/**
 * Search locations with OpenStreetMap Nominatim and fallback to popular cities
 */
export async function searchLocations(query: string): Promise<GeoLocation[]> {
  if (!query || query.trim().length === 0) return POPULAR_CITIES.slice(0, 6);

  const trimmed = query.trim().toLowerCase();

  // Check matching local popular cities first
  const localMatches = POPULAR_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(trimmed) ||
      (c.country && c.country.toLowerCase().includes(trimmed)) ||
      (c.region && c.region.toLowerCase().includes(trimmed))
  );

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en',
        },
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const results: GeoLocation[] = data.map((item: any) => {
        const city = item.address?.city || item.address?.town || item.address?.village || item.address?.municipality || item.name;
        const state = item.address?.state || item.address?.county || '';
        const country = item.address?.country || '';
        const name = city ? (state ? `${city}, ${state}` : `${city}, ${country}`) : item.display_name.split(',').slice(0, 2).join(',');

        return {
          name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          country,
          region: state,
        };
      });

      // Combine with local matches
      const combined = [...results, ...localMatches];
      const unique = combined.filter((v, i, a) => a.findIndex((t) => t.name === v.name) === i);
      return unique.slice(0, 6);
    }
  } catch (e) {
    // Return filtered local matches on network issue
  }

  return localMatches.length > 0 ? localMatches : POPULAR_CITIES.slice(0, 5);
}

/**
 * Reverse geocode latitude and longitude to a city/area string
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en',
        },
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || data.name;
      const state = data.address?.state || data.address?.country || '';
      if (city && state) return `${city}, ${state}`;
      if (city) return city;
      if (data.display_name) return data.display_name.split(',').slice(0, 2).join(',').trim();
    }
  } catch (e) {
    // Ignore network error and return nearest known city or coordinates
  }

  // Fallback to closest popular city
  let closest = POPULAR_CITIES[0];
  let minD = calculateDistanceKm(lat, lng, closest.lat, closest.lng);
  for (const c of POPULAR_CITIES) {
    const d = calculateDistanceKm(lat, lng, c.lat, c.lng);
    if (d < minD) {
      minD = d;
      closest = c;
    }
  }

  if (minD < 50) {
    return closest.name;
  }

  return `${lat.toFixed(3)}°, ${lng.toFixed(3)}°`;
}
