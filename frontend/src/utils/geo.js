/**
 * Geo & Coordinate Utilities for LiveFix
 * Formats GPS coordinates to Cardinal Direction format (N, E / S, W)
 */

export function formatCoordinates(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return null;
  }
  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);
  if (isNaN(numLat) || isNaN(numLng)) {
    return null;
  }

  const latCard = numLat >= 0 ? 'N' : 'S';
  const lngCard = numLng >= 0 ? 'E' : 'W';
  const absLat = Math.abs(numLat).toFixed(4);
  const absLng = Math.abs(numLng).toFixed(4);

  return `${absLat}° ${latCard}, ${absLng}° ${lngCard}`;
}

export function getGoogleMapsUrl(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return null;
  }
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function getDisplayAddress(address, lat, lng) {
  if (address && typeof address === 'string' && address.trim().length > 0) {
    return address.trim();
  }
  const coords = formatCoordinates(lat, lng);
  return coords || 'Address not specified';
}
