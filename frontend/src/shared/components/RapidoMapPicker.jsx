import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Search,
  LocateFixed,
  Loader2,
  X,
  Plus,
  Minus,
  CheckCircle2,
} from 'lucide-react';
import { getCurrentLocation } from '../../utils/geolocation';
import './RapidoMapPicker.css';

const QUICK_PLACES = [
  {
    id: 'bowenpally',
    title: 'Bowenpally Agricultural Market Yard',
    subtitle: 'Bowenpally, Secunderabad, Telangana - 500011',
    city: 'Hyderabad',
    pincode: '500011',
    lat: 17.4772,
    lng: 78.4754,
  },
  {
    id: 'gudimalkapur',
    title: 'Gudimalkapur Vegetable & Flower Market',
    subtitle: 'Mehdipatnam, Hyderabad, Telangana - 500028',
    city: 'Hyderabad',
    pincode: '500028',
    lat: 17.3821,
    lng: 78.4376,
  },
  {
    id: 'kothapet',
    title: 'Gaddiannaram Fruit Market',
    subtitle: 'Kothapet, Hyderabad, Telangana - 500035',
    city: 'Hyderabad',
    pincode: '500035',
    lat: 17.3688,
    lng: 78.5356,
  },
  {
    id: 'siddipet',
    title: 'Siddipet Farmer Market (Rythu Bazaar)',
    subtitle: 'Siddipet, Telangana - 502103',
    city: 'Siddipet',
    pincode: '502103',
    lat: 18.1018,
    lng: 78.8520,
  },
  {
    id: 'shamshabad',
    title: 'Shamshabad Agro Belt',
    subtitle: 'Shamshabad, Rangareddy, Telangana - 501218',
    city: 'Rangareddy',
    pincode: '501218',
    lat: 17.2543,
    lng: 78.4311,
  },
  {
    id: 'medak',
    title: 'Medak Rural Farming Valley',
    subtitle: 'Medak, Telangana - 502110',
    city: 'Medak',
    pincode: '502110',
    lat: 18.0478,
    lng: 78.2618,
  },
  {
    id: 'hitec',
    title: 'HITEC City & Madhapur Hub',
    subtitle: 'Madhapur, Hyderabad, Telangana - 500081',
    city: 'Hyderabad',
    pincode: '500081',
    lat: 17.4482,
    lng: 78.3742,
  },
];

function parseNominatimAddress(data, fallbackLat, fallbackLng) {
  const addr = data?.address || {};
  const primary =
    data?.name ||
    addr.amenity ||
    addr.shop ||
    addr.building ||
    addr.railway ||
    addr.road ||
    addr.neighbourhood ||
    addr.suburb ||
    addr.village ||
    addr.town ||
    addr.city_district ||
    'Selected Location';

  const locality =
    addr.neighbourhood ||
    addr.suburb ||
    addr.village ||
    addr.city_district ||
    addr.county ||
    '';

  const detectedCity =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.state_district ||
    'Hyderabad';

  const detectedPincode = (addr.postcode || '').replace(/\D/g, '').slice(0, 6);

  const parts = [];
  if (addr.road && addr.road !== primary) parts.push(addr.road);
  if (locality && locality !== primary && !parts.includes(locality)) parts.push(locality);
  if (detectedCity && detectedCity !== primary && !parts.includes(detectedCity)) parts.push(detectedCity);
  if (addr.state) parts.push(addr.state);
  if (detectedPincode) parts.push(detectedPincode);

  const subtitle = parts.length > 0
    ? parts.join(', ')
    : (data?.display_name || `${fallbackLat.toFixed(5)}, ${fallbackLng.toFixed(5)}`);

  return {
    title: primary,
    subtitle,
    fullAddress: subtitle ? `${primary}, ${subtitle}` : primary,
    village: addr.village || addr.town || locality || primary,
    district: detectedCity,
    state: addr.state || 'Telangana',
    city: detectedCity,
    pincode: detectedPincode,
  };
}

export default function RapidoMapPicker({
  initialLat = 17.4485,
  initialLng = 78.3908,
  initialTitle = 'Madhapur / Hyderabad',
  initialAddress = 'Hyderabad, Telangana - 500081',
  initialCity = 'Hyderabad',
  initialPincode = '500081',
  pinLabel = 'Farm / Delivery Location',
  selectedLabel = 'Pinned Location Details',
  mapHeight = '320px',
  onLocationChange,
}) {
  const startLat = Number(initialLat) || 17.4485;
  const startLng = Number(initialLng) || 78.3908;

  const [primaryTitle, setPrimaryTitle] = useState(initialTitle || 'Selected Location');
  const [fullAddressText, setFullAddressText] = useState(initialAddress || `${startLat.toFixed(5)}, ${startLng.toFixed(5)}`);
  const [city, setCity] = useState(initialCity || 'Hyderabad');
  const [pincode, setPincode] = useState(initialPincode || '');
  const [currentCoords, setCurrentCoords] = useState({ lat: startLat, lng: startLng });
  const [isDragging, setIsDragging] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [locationSource, setLocationSource] = useState('pin');
  const [toastMsg, setToastMsg] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userDotRef = useRef(null);
  const geocodeAbortRef = useRef(null);
  const skipNextMoveEndRef = useRef(false);
  const onLocationChangeRef = useRef(onLocationChange);

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  const emitLocation = useCallback((payload) => {
    if (onLocationChangeRef.current) {
      onLocationChangeRef.current(payload);
    }
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(''), 4000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const reverseGeocode = useCallback(
    async (targetLat, targetLng, source = 'pin') => {
      const fixedLat = Number(targetLat.toFixed(6));
      const fixedLng = Number(targetLng.toFixed(6));
      setCurrentCoords({ lat: fixedLat, lng: fixedLng });

      setLocationSource(source);
      setIsGeocoding(true);

      if (geocodeAbortRef.current) {
        geocodeAbortRef.current.abort();
      }
      const controller = new AbortController();
      geocodeAbortRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${fixedLat}&lon=${fixedLng}&addressdetails=1`,
          {
            signal: controller.signal,
            headers: { 'Accept-Language': 'en' },
          }
        );

        if (res.ok) {
          const data = await res.json();
          const parsed = parseNominatimAddress(data, fixedLat, fixedLng);
          setPrimaryTitle(parsed.title);
          setFullAddressText(parsed.subtitle);
          setCity(parsed.city);
          if (parsed.pincode) setPincode(parsed.pincode);

          emitLocation({
            lat: fixedLat,
            lng: fixedLng,
            title: parsed.title,
            subtitle: parsed.subtitle,
            fullAddress: parsed.fullAddress,
            village: parsed.village,
            district: parsed.district,
            state: parsed.state,
            city: parsed.city,
            pincode: parsed.pincode,
            source,
          });
        } else {
          const fallbackSub = `${fixedLat.toFixed(5)}, ${fixedLng.toFixed(5)}`;
          setPrimaryTitle('Pinned Location');
          setFullAddressText(fallbackSub);
          emitLocation({
            lat: fixedLat,
            lng: fixedLng,
            title: 'Pinned Location',
            subtitle: fallbackSub,
            fullAddress: fallbackSub,
            village: 'Selected Area',
            district: city || 'Hyderabad',
            state: 'Telangana',
            city,
            pincode: initialPincode || '',
            source,
          });
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          const fallbackSub = `${fixedLat.toFixed(5)}, ${fixedLng.toFixed(5)}`;
          setPrimaryTitle('Pinned Location');
          setFullAddressText(fallbackSub);
          emitLocation({
            lat: fixedLat,
            lng: fixedLng,
            title: 'Pinned Location',
            subtitle: fallbackSub,
            fullAddress: fallbackSub,
            village: 'Selected Area',
            district: city || 'Hyderabad',
            state: 'Telangana',
            city,
            pincode: initialPincode || '',
            source,
          });
        }
      } finally {
        clearTimeout(timeoutId);
        if (geocodeAbortRef.current === controller) {
          setIsGeocoding(false);
        }
      }
    },
    [city, initialPincode, emitLocation]
  );

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: true,
      tap: true,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    map.on('movestart', () => {
      setIsDragging(true);
      setShowDropdown(false);
    });

    map.on('moveend', () => {
      setIsDragging(false);
      if (skipNextMoveEndRef.current) {
        skipNextMoveEndRef.current = false;
        return;
      }
      const center = map.getCenter();
      reverseGeocode(center.lat, center.lng, 'pin');
    });

    map.on('click', (e) => {
      setShowDropdown(false);
      map.panTo(e.latlng, { animate: true, duration: 0.35 });
    });

    mapInstanceRef.current = map;

    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(resizeTimer);
      if (geocodeAbortRef.current) geocodeAbortRef.current.abort();
      map.remove();
      mapInstanceRef.current = null;
      userDotRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced live Nominatim search
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&limit=6&q=${encodeURIComponent(q)}`,
          {
            signal: controller.signal,
            headers: { 'Accept-Language': 'en' },
          }
        );
        if (res.ok) {
          const items = await res.json();
          const mapped = (items || []).map((item) => {
            const parsed = parseNominatimAddress(item, Number(item.lat), Number(item.lon));
            return {
              id: `nom-${item.place_id}`,
              title: parsed.title,
              subtitle: parsed.subtitle,
              fullAddress: parsed.fullAddress,
              village: parsed.village,
              district: parsed.district,
              state: parsed.state,
              city: parsed.city,
              pincode: parsed.pincode,
              lat: Number(item.lat),
              lng: Number(item.lon),
            };
          });
          setSearchResults(mapped);
        }
      } catch (err) {
        if (err.name !== 'AbortError') setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const handleSelectPlace = (place) => {
    setShowDropdown(false);
    setSearchQuery('');
    setPrimaryTitle(place.title);
    setFullAddressText(place.subtitle);
    if (place.city) setCity(place.city);
    if (place.pincode) setPincode(place.pincode);
    setCurrentCoords({ lat: place.lat, lng: place.lng });
    setLocationSource('pin');

    emitLocation({
      lat: place.lat,
      lng: place.lng,
      title: place.title,
      subtitle: place.subtitle,
      fullAddress: place.fullAddress || `${place.title}, ${place.subtitle}`,
      village: place.village || place.title,
      district: place.district || place.city || 'Hyderabad',
      state: place.state || 'Telangana',
      city: place.city || 'Hyderabad',
      pincode: place.pincode || '',
      source: 'pin',
    });

    if (mapInstanceRef.current) {
      skipNextMoveEndRef.current = true;
      mapInstanceRef.current.setView([place.lat, place.lng], 16, { animate: true });
    }
  };

  // High Accuracy GPS Auto-Detection with Mock-GPS Filtering & IP Fallback
  const handleDetectGPS = async () => {
    setDetecting(true);
    setToastMsg('Acquiring high-accuracy GPS coordinates...');

    try {
      const loc = await getCurrentLocation((status) => {
        setToastMsg(status);
      });

      if (loc && loc.latitude && loc.longitude) {
        const detectedLat = loc.latitude;
        const detectedLng = loc.longitude;
        setCurrentCoords({ lat: detectedLat, lng: detectedLng });

        if (mapInstanceRef.current) {
          const latLng = [detectedLat, detectedLng];

          // Blue user pulse dot
          if (userDotRef.current) {
            userDotRef.current.setLatLng(latLng);
          } else {
            const dotIcon = L.divIcon({
              className: 'rapido-user-dot-icon',
              html: `<div class="rapido-pulse-dot"><span class="rapido-pulse-ring"></span><span class="rapido-pulse-core"></span></div>`,
              iconSize: [22, 22],
              iconAnchor: [11, 11],
            });
            userDotRef.current = L.marker(latLng, { icon: dotIcon, zIndexOffset: 1000 }).addTo(mapInstanceRef.current);
          }

          skipNextMoveEndRef.current = true;
          mapInstanceRef.current.setView(latLng, 17, { animate: true });
        }

        // Fill address info
        if (loc.address) {
          setPrimaryTitle(loc.address.title || loc.address.village || 'Detected Location');
          const full = [loc.address.village, loc.address.district, loc.address.state, loc.address.pincode].filter(Boolean).join(', ');
          setFullAddressText(full);
          setCity(loc.address.district || 'Hyderabad');
          if (loc.address.pincode) setPincode(loc.address.pincode);

          emitLocation({
            lat: detectedLat,
            lng: detectedLng,
            title: loc.address.title || loc.address.village || 'Detected Location',
            subtitle: full,
            fullAddress: full,
            village: loc.address.village,
            district: loc.address.district,
            state: loc.address.state,
            city: loc.address.district,
            pincode: loc.address.pincode,
            landmark: loc.address.landmark || '',
            source: loc.source === 'gps' ? 'gps' : 'network',
          });
        } else {
          reverseGeocode(detectedLat, detectedLng, 'gps');
        }

        setLocationSource(loc.source === 'gps' ? 'gps' : 'network');
        setToastMsg(`Location locked! (${detectedLat.toFixed(4)}, ${detectedLng.toFixed(4)})`);
      } else {
        setToastMsg('Could not detect location. Drag pin or search above.');
      }
    } catch (err) {
      console.warn('GPS detection error:', err);
      setToastMsg('Unable to retrieve GPS. You can drag the map pin to your location.');
    } finally {
      setDetecting(false);
    }
  };

  const displayResults = searchQuery.trim().length >= 3 ? searchResults : QUICK_PLACES;

  return (
    <div className="rapido-picker-wrap">
      {/* Map Shell Container */}
      <div className="rapido-map-shell">
        {/* Floating Top Search Bar */}
        <div className="rapido-search-overlay">
          <div className="rapido-search-pill">
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search area, village, mandi, or pincode..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="rapido-search-input"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowDropdown(false);
                }}
                className="rapido-search-clear"
              >
                <X size={14} />
              </button>
            ) : isSearching ? (
              <Loader2 size={15} className="rapido-spin text-emerald-600" />
            ) : null}
          </div>

          {/* Search Dropdown / Quick Place Chips */}
          {showDropdown && (
            <div className="rapido-search-dropdown no-scrollbar">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 bg-gray-50/90 text-[11px] font-bold text-gray-500">
                <span>{searchQuery.trim().length >= 3 ? 'Search Results' : 'Popular Agricultural Hubs'}</span>
                <button
                  type="button"
                  onClick={() => setShowDropdown(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              </div>

              {isSearching && (
                <div className="rapido-search-status">
                  <Loader2 size={13} className="rapido-spin inline mr-1 text-emerald-600" />
                  <span>Searching places...</span>
                </div>
              )}

              {!isSearching && displayResults.length === 0 && (
                <div className="rapido-search-status">
                  No places found. Try dragging the map pin directly.
                </div>
              )}

              {displayResults.map((place) => (
                <button
                  type="button"
                  key={place.id}
                  className="rapido-search-item"
                  onClick={() => handleSelectPlace(place)}
                >
                  <span className="rapido-search-item-icon">
                    <MapPin size={14} className="text-emerald-700" />
                  </span>
                  <div className="min-w-0 text-left">
                    <span className="rapido-search-item-title block truncate">{place.title}</span>
                    <span className="rapido-search-item-sub block truncate">{place.subtitle}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Leaflet Map Canvas */}
        <div
          ref={mapContainerRef}
          className="rapido-leaflet-canvas"
          style={{ height: mapHeight }}
        />

        {/* Fixed Center Pin */}
        <div className={`rapido-center-pin-anchor ${isDragging ? 'is-dragging' : ''}`}>
          <div className="rapido-pin-tooltip">
            {isDragging ? (
              <span>Move map to adjust</span>
            ) : isGeocoding ? (
              <>
                <Loader2 size={11} className="rapido-spin" />
                <span>Locating...</span>
              </>
            ) : (
              <span>{pinLabel}</span>
            )}
          </div>

          <div className="rapido-pin-marker">
            <div className="rapido-pin-head bg-emerald-600 border-2 border-white shadow-md">
              <div className="rapido-pin-inner-dot bg-white" />
            </div>
            <div className="rapido-pin-stick bg-emerald-700" />
          </div>

          <div className="rapido-pin-ground-shadow" />
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="rapido-map-toast">
            <span className="truncate">{toastMsg}</span>
            <button
              type="button"
              onClick={() => setToastMsg('')}
              className="ml-2 text-white/80 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Zoom Controls (Bottom Left - Isolated from Auto-Detect) */}
        <div className="rapido-map-zoom-stack">
          <button
            type="button"
            className="rapido-zoom-btn"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            aria-label="Zoom in"
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            className="rapido-zoom-btn"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            aria-label="Zoom out"
          >
            <Minus size={16} />
          </button>
        </div>

        {/* Detect My Location FAB (Bottom Right - Isolated from Zoom Controls) */}
        <button
          type="button"
          className="rapido-gps-fab"
          onClick={handleDetectGPS}
          disabled={detecting}
        >
          {detecting ? (
            <>
              <Loader2 size={16} className="rapido-spin" />
              <span>Detecting...</span>
            </>
          ) : (
            <>
              <LocateFixed size={16} />
              <span>Detect Location</span>
            </>
          )}
        </button>
      </div>

      {/* Selected Location Summary Card */}
      <div className="rapido-address-card">
        <div className="rapido-address-top-meta">
          <span className="rapido-address-eyebrow">{selectedLabel}</span>
          <span
            className={`rapido-source-badge ${
              locationSource === 'gps' || locationSource === 'network' ? 'rapido-source-badge--gps' : 'rapido-source-badge--pin'
            }`}
          >
            <CheckCircle2 size={12} />
            {locationSource === 'gps'
              ? 'GPS Verified'
              : locationSource === 'network'
              ? 'Network Detected'
              : 'Map Pin Selected'}
          </span>
        </div>

        <div className="rapido-address-main-row">
          <div className="rapido-address-icon-wrap">
            <MapPin size={18} className="text-emerald-700" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="rapido-address-title truncate">{primaryTitle}</h4>
            <p className="rapido-address-subtitle line-clamp-2">{fullAddressText}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-[10px]">
            {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
          </span>
          {pincode && (
            <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-100">
              PIN: {pincode}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
