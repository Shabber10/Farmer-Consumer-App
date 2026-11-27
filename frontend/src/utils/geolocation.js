import { Geolocation } from '@capacitor/geolocation';

/**
 * High-Accuracy Geolocation Detector with Native Capacitor Android Permissions,
 * Mock GPS Filtering, Physical IP Geolocation Fallback, and OpenStreetMap Reverse Geocoding.
 *
 * @param {Function} onProgress Callback for status message updates
 * @returns {Promise<{
 *   latitude: number,
 *   longitude: number,
 *   accuracy: number|null,
 *   source: 'gps'|'ip'|'default',
 *   address: {
 *     title: string,
 *     village: string,
 *     district: string,
 *     state: string,
 *     pincode: string,
 *     landmark: string
 *   }
 * }>}
 */
export async function getCurrentLocation(onProgress = () => {}) {
  onProgress('Checking location permissions...');

  let coords = null;
  let accuracy = null;
  let source = 'gps';

  // 1. Try Native Capacitor Geolocation with explicit Android OS permission prompt
  try {
    const checkPerm = await Geolocation.checkPermissions().catch(() => null);
    if (!checkPerm || checkPerm.location !== 'granted') {
      onProgress('Requesting device location permission...');
      const reqPerm = await Geolocation.requestPermissions().catch(() => null);
      console.log('Location permission request result:', reqPerm);
    }

    onProgress('Acquiring high-accuracy GPS coordinates...');
    const pos = await Promise.race([
      Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('GPS timeout')), 10000)),
    ]);

    if (pos && pos.coords) {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      // Check if emulator default mock coordinates (Mountain View, CA: 37.422, -122.084) or (0, 0)
      const isMock =
        (Math.abs(lat - 37.422) < 0.15 && Math.abs(lng - (-122.084)) < 0.15) ||
        (lat === 0 && lng === 0);

      if (!isMock) {
        coords = { latitude: lat, longitude: lng };
        accuracy = pos.coords.accuracy;
        source = 'gps';
      } else {
        console.warn('Detected emulator mock coordinates (Mountain View, CA). Falling back to physical location.');
      }
    }
  } catch (geoErr) {
    console.warn('Native Capacitor geolocation error, trying fallbacks:', geoErr);
  }

  // 2. Try browser navigator.geolocation if native failed
  if (!coords && typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      onProgress('Checking browser geolocation...');
      const navPos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 0,
        });
      });
      if (navPos && navPos.coords) {
        const lat = navPos.coords.latitude;
        const lng = navPos.coords.longitude;
        const isMock =
          (Math.abs(lat - 37.422) < 0.15 && Math.abs(lng - (-122.084)) < 0.15) ||
          (lat === 0 && lng === 0);
        if (!isMock) {
          coords = { latitude: lat, longitude: lng };
          accuracy = navPos.coords.accuracy;
          source = 'gps';
        }
      }
    } catch (e) {
      console.warn('Browser geolocation fallback failed:', e);
    }
  }

  // 3. Fallback to physical IP geolocation (ipwho.is)
  let ipInfo = null;
  if (!coords) {
    onProgress('Detecting physical location via network...');
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 6000);
      const res = await fetch('https://ipwho.is/', { signal: controller.signal });
      clearTimeout(t);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.latitude && data.longitude) {
          coords = { latitude: data.latitude, longitude: data.longitude };
          source = 'ip';
          ipInfo = data;
        }
      }
    } catch (ipErr) {
      console.warn('ipwho.is lookup notice:', ipErr);
    }
  }

  // 4. Secondary fallback to ipapi.co
  if (!coords) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 5000);
      const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
      clearTimeout(t);
      if (res.ok) {
        const data = await res.json();
        if (data && data.latitude && data.longitude) {
          coords = { latitude: data.latitude, longitude: data.longitude };
          source = 'ip';
          ipInfo = { city: data.city, region: data.region, postal: data.postal };
        }
      }
    } catch (e) {
      console.warn('ipapi.co lookup notice:', e);
    }
  }

  // 5. Safe default coordinates (Hyderabad, Telangana) if completely offline
  if (!coords) {
    coords = { latitude: 17.3850, longitude: 78.4867 };
    source = 'default';
    ipInfo = { city: 'Hyderabad', region: 'Telangana', postal: '500001' };
  }

  // 6. OpenStreetMap Nominatim Reverse Geocoding
  onProgress('Resolving pinned address details...');
  let address = {
    title: ipInfo?.city || 'Current Location',
    village: ipInfo?.city || 'Madhapur',
    district: ipInfo?.city || 'Hyderabad',
    state: ipInfo?.region || 'Telangana',
    pincode: ipInfo?.postal || '500001',
    landmark: '',
  };

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`,
      { signal: controller.signal }
    );
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      address.title =
        data.name ||
        addr.suburb ||
        addr.village ||
        addr.town ||
        addr.neighbourhood ||
        addr.city ||
        'Current Location';
      address.village =
        addr.village ||
        addr.town ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.hamlet ||
        addr.city_district ||
        addr.city ||
        address.village;
      address.district =
        addr.state_district ||
        addr.county ||
        addr.district ||
        addr.city ||
        address.district;
      address.state = addr.state || address.state;
      address.pincode = (addr.postcode || '').replace(/\D/g, '').slice(0, 6) || address.pincode;
      address.landmark = addr.road ? `Near ${addr.road}` : '';
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode note:', err);
  }

  return {
    latitude: Number(coords.latitude.toFixed(6)),
    longitude: Number(coords.longitude.toFixed(6)),
    accuracy: accuracy ? Math.round(accuracy) : null,
    source,
    address,
  };
}
