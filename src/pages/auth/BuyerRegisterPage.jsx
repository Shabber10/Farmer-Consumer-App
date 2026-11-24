import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  User,
  Lock,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  AlertCircle,
  Sprout,
  Crosshair,
  Search,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigation } from '../../contexts/NavigationContext';
import BackButton from '../../components/common/BackButton';

// Background Image
import bg1 from '../../assets/images/bg1_hd.jpg';

// Preset Major Residential & Urban Delivery Hubs for Instant Pinning
const PRESET_BUYER_HUBS = [
  {
    id: 'hitec_city',
    title: 'HITEC City & Madhapur Residential Area',
    subtitle: 'Cyberabad, Hyderabad, Telangana',
    village: 'Madhapur',
    district: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    landmark: 'Near Cyber Towers & Mindspace',
    lat: 17.4474,
    lng: 78.3762,
  },
  {
    id: 'gachibowli',
    title: 'Gachibowli Financial District',
    subtitle: 'Gachibowli, Hyderabad, Telangana',
    village: 'Gachibowli',
    district: 'Hyderabad',
    state: 'Telangana',
    pincode: '500032',
    landmark: 'Near DLF Cyber City Gate',
    lat: 17.4401,
    lng: 78.3489,
  },
  {
    id: 'kukatpally',
    title: 'Kukatpally Housing Board (KPHB)',
    subtitle: 'Kukatpally, Hyderabad, Telangana',
    village: 'Kukatpally',
    district: 'Medchal-Malkajgiri',
    state: 'Telangana',
    pincode: '500072',
    landmark: 'Near KPHB Metro Station',
    lat: 17.4938,
    lng: 78.3995,
  },
  {
    id: 'banjara_hills',
    title: 'Banjara Hills Colony',
    subtitle: 'Road No. 12, Hyderabad, Telangana',
    village: 'Banjara Hills',
    district: 'Hyderabad',
    state: 'Telangana',
    pincode: '500034',
    landmark: 'Near Care Hospital & Park',
    lat: 17.4156,
    lng: 78.4350,
  },
  {
    id: 'secunderabad',
    title: 'Secunderabad West Marredpally',
    subtitle: 'Secunderabad, Hyderabad, Telangana',
    village: 'Marredpally',
    district: 'Hyderabad',
    state: 'Telangana',
    pincode: '500026',
    landmark: 'Near Clock Tower & St. Ann\'s',
    lat: 17.4435,
    lng: 78.5012,
  },
  {
    id: 'uppal',
    title: 'Uppal Residential Hub',
    subtitle: 'Uppal, Hyderabad, Telangana',
    village: 'Uppal',
    district: 'Medchal-Malkajgiri',
    state: 'Telangana',
    pincode: '500039',
    landmark: 'Near Uppal Ring Road Junction',
    lat: 17.4022,
    lng: 78.5599,
  },
  {
    id: 'kondapur',
    title: 'Kondapur Residential Enclave',
    subtitle: 'Kondapur, Hyderabad, Telangana',
    village: 'Kondapur',
    district: 'Rangareddy',
    state: 'Telangana',
    pincode: '500084',
    landmark: 'Near Botanical Garden Road',
    lat: 17.4699,
    lng: 78.3578,
  },
];

const BuyerRegisterPage = () => {
  const { register } = useAuth();
  const { t, language } = useLanguage();
  const { registerBackAction } = useNavigation();
  const navigate = useNavigate();

  // Multi-step tracking: Step 1 (Account details) -> Step 2 (Delivery Address & Map Pin)
  const [currentStep, setCurrentStep] = useState(1);

  // When on Step 2 (Address), pressing mobile hardware back button returns to Step 1
  useEffect(() => {
    if (currentStep === 2) {
      return registerBackAction(() => {
        setCurrentStep(1);
        return true; // event consumed
      });
    }
  }, [currentStep, registerBackAction]);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    village: 'Madhapur',
    district: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    landmark: 'Near Cyber Towers',
    password: '',
    confirm_password: '',
    latitude: 17.4474,
    longitude: 78.3762,
    location_title: 'HITEC City & Madhapur Residential Area',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Search places / colonies / residential areas on map
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearchChange = async (val) => {
    setSearchQuery(val);
    setShowSearchDropdown(true);

    if (!val || val.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const q = val.toLowerCase().trim();
    // 1. Instant local matches from preset delivery hubs
    const localMatches = PRESET_BUYER_HUBS.filter(
      (hub) =>
        hub.title.toLowerCase().includes(q) ||
        hub.village.toLowerCase().includes(q) ||
        hub.district.toLowerCase().includes(q) ||
        hub.pincode.includes(q)
    );

    setSearchResults(localMatches);

    // 2. Query OpenStreetMap Nominatim for any area/colony/city
    if (q.length >= 3) {
      try {
        setSearching(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(val)}&limit=5&countrycodes=in`
        );
        if (res.ok) {
          const remoteData = await res.json();
          const remoteMatches = remoteData.map((item) => {
            const addr = item.address || {};
            const title = item.display_name.split(',')[0];
            return {
              id: item.place_id || String(item.osm_id),
              title: title,
              subtitle: item.display_name,
              village: addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city || title,
              district: addr.state_district || addr.county || addr.district || addr.city || 'Hyderabad',
              state: addr.state || 'Telangana',
              pincode: (addr.postcode || '').replace(/\D/g, '').slice(0, 6) || '500081',
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            };
          });

          const combined = [...localMatches];
          remoteMatches.forEach((rm) => {
            if (!combined.some((c) => Math.abs(c.lat - rm.lat) < 0.005 && Math.abs(c.lng - rm.lng) < 0.005)) {
              combined.push(rm);
            }
          });
          setSearchResults(combined);
        }
      } catch (err) {
        console.warn('Map geocoding notice:', err);
      } finally {
        setSearching(false);
      }
    }
  };

  const applyPresetHub = (hub) => {
    setFormData((prev) => ({
      ...prev,
      village: hub.village,
      district: hub.district,
      state: hub.state,
      pincode: hub.pincode,
      landmark: hub.landmark || prev.landmark,
      latitude: hub.lat,
      longitude: hub.lng,
      location_title: hub.title,
    }));
    setSearchQuery(hub.title);
    setShowSearchDropdown(false);
    setStatusMessage(`Delivery address set to: ${hub.title}`);
  };

  // Step 1: Validate Account Details & Advance to Step 2
  const handleStep1Next = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.full_name.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('A valid email address is mandatory for registration');
      return;
    }

    const cleanMobile = formData.mobile_number.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setError('Please provide a valid 10-digit mobile number');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Device GPS Geolocation Detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setStatusMessage('Geolocation is not supported by your device browser.');
      return;
    }

    setDetecting(true);
    setStatusMessage('Acquiring precise GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        let detectedVillage = '';
        let detectedDistrict = '';
        let detectedState = '';
        let detectedPincode = '';
        let detectedLandmark = '';
        let locationTitle = 'My Current Location';

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            detectedVillage = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city || '';
            detectedDistrict = addr.state_district || addr.county || addr.district || addr.city || '';
            detectedState = addr.state || 'Telangana';
            detectedPincode = (addr.postcode || '').replace(/\D/g, '').slice(0, 6);
            detectedLandmark = addr.road ? `Near ${addr.road}` : '';
            locationTitle = data.display_name?.split(',')[0] || 'Current Location';
          }
        } catch (reverseErr) {
          console.warn('Reverse geocode note:', reverseErr);
        }

        setFormData((prev) => ({
          ...prev,
          latitude,
          longitude,
          location_title: locationTitle,
          village: detectedVillage || prev.village || 'Local Area',
          district: detectedDistrict || prev.district || 'Hyderabad',
          state: detectedState || prev.state || 'Telangana',
          pincode: detectedPincode || prev.pincode || '500081',
          landmark: detectedLandmark || prev.landmark,
        }));

        setDetecting(false);
        setStatusMessage(`GPS Location pinned successfully! (Accuracy: ±${Math.round(accuracy)}m)`);
      },
      (geoError) => {
        setDetecting(false);
        const errMessages = {
          1: 'GPS permission denied. Please allow location in settings or search your area above.',
          2: 'Unable to determine GPS location. Please search your area above.',
          3: 'GPS request timed out. Please try again or select from search.',
        };
        setStatusMessage(errMessages[geoError.code] || 'Could not detect GPS location. Please select manually.');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // Step 2 Submission: Register & Navigate to Email Verification
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.landmark || !formData.landmark.trim()) {
      setError('Landmark is mandatory. Please enter a landmark for your delivery address.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        role: 'buyer',
        language,
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        mobile_number: formData.mobile_number.trim(),
        village: formData.village.trim() || formData.location_title || 'Local Area',
        district: formData.district.trim() || 'Hyderabad',
        state: formData.state.trim() || 'Telangana',
        pincode: formData.pincode.trim() || '500081',
        delivery_pincode: formData.pincode.trim() || '500081',
        password: formData.password,
        confirm_password: formData.confirm_password,
        latitude: formData.latitude,
        longitude: formData.longitude,
        location_title: formData.location_title,
        landmark: formData.landmark.trim(),
      };

      const registered = await register(payload);
      // Navigate to email verification screen before accessing buyer dashboard
      navigate('/verify-email', {
        state: {
          email: formData.email.trim(),
          role: 'buyer',
          dev_otp: registered?.dev_otp,
        },
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${formData.longitude - 0.015}%2C${formData.latitude - 0.012}%2C${formData.longitude + 0.015}%2C${formData.latitude + 0.012}&layer=mapnik&marker=${formData.latitude}%2C${formData.longitude}`;

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full relative flex flex-col justify-center items-center px-4 py-6 sm:p-6 bg-cover bg-center bg-no-repeat overflow-y-auto"
      style={{
        backgroundImage: `url(${bg1})`,
        backgroundAttachment: 'fixed',
        paddingTop: 'max(1.5rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
      }}
    >
      {/* Background Dimmer Overlay */}
      <div className="absolute inset-0 bg-black/35 pointer-events-none" />

      {/* Top Header with Centered KisanDirect and Left Back Button */}
      <div className="relative z-10 w-full max-w-lg pt-2 mb-2 flex items-center justify-between">
        <div className="w-16 flex-shrink-0">
          <BackButton
            onClick={currentStep === 2 ? () => setCurrentStep(1) : undefined}
            fallbackPath="/select-role"
            label="Back"
          />
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-kisan-primary text-white flex items-center justify-center shadow-md border border-white/20">
            <Sprout className="w-4 h-4" />
          </div>
          <span className="text-base font-black text-white tracking-tight drop-shadow-md">
            {t('appName')}
          </span>
        </div>
        <div className="w-16 flex-shrink-0" />
      </div>

      {/* Main Registration Card */}
      <div className="relative z-10 w-full max-w-lg my-2 bg-white/95 backdrop-blur-xl rounded-3xl p-5 sm:p-7 border border-white/60 shadow-2xl transition-all">
        {/* Clean Card Title */}
        <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-100">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 shadow-md">
            {currentStep === 1 ? (
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700" />
            ) : (
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700" />
            )}
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-kisan-dark leading-tight">
              {currentStep === 1 ? 'Buyer Account Details' : 'Delivery Location'}
            </h1>
            <p className="text-[11px] sm:text-xs text-kisan-muted leading-relaxed">
              {currentStep === 1
                ? 'Fill in your name, mandatory email, mobile, and password'
                : 'Pin your delivery address on the map and enter landmark'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-kisan-danger">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {statusMessage && (
          <div className="mb-3.5 p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-[11px] font-semibold text-emerald-800 flex items-center space-x-2">
            <MapPin className="w-3.5 h-3.5 text-kisan-primary flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 1: Account Details (Email & Mobile Mandatory)        */}
        {/* ======================================================== */}
        {currentStep === 1 && (
          <form onSubmit={handleStep1Next} className="space-y-3 text-xs">
            {/* Full Name */}
            <div>
              <label className="block font-bold text-kisan-text mb-1">
                Full Name <span className="text-red-500 font-black">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-kisan-muted absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Shabber Hussain"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50/90 border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary"
                  required
                />
              </div>
            </div>

            {/* Email Address - Strictly Mandatory */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-kisan-text">
                  Email Address <span className="text-red-500 font-black">*</span>
                </label>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  Verification Required
                </span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-kisan-muted absolute left-3 top-3" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="shabber@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50/90 border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary"
                  required
                />
              </div>
            </div>

            {/* Mobile Number - Mandatory */}
            <div>
              <label className="block font-bold text-kisan-text mb-1">
                10-Digit Mobile Number <span className="text-red-500 font-black">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-kisan-muted absolute left-3 top-3" />
                <input
                  type="tel"
                  maxLength={10}
                  value={formData.mobile_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mobile_number: e.target.value.replace(/\D/g, '').slice(0, 10),
                    })
                  }
                  placeholder="9876543210"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50/90 border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary"
                  required
                />
              </div>
            </div>

            {/* Password and Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-bold text-kisan-text mb-1">
                  Password <span className="text-red-500 font-black">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-kisan-muted absolute left-3 top-3" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50/90 border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-kisan-text mb-1">
                  Confirm Password <span className="text-red-500 font-black">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-kisan-muted absolute left-3 top-3" />
                  <input
                    type="password"
                    value={formData.confirm_password}
                    onChange={(e) =>
                      setFormData({ ...formData, confirm_password: e.target.value })
                    }
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50/90 border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Next Button */}
            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 shadow-md transition-all mt-4 tap-effect"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* STEP 2: Address with Search, Map & Mandatory Landmark    */}
        {/* ======================================================== */}
        {currentStep === 2 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4 text-xs">
            {/* Search Location on Map */}
            <div className="relative">
              <div className="flex items-center gap-2 bg-white border border-kisan-border rounded-xl px-3 py-2.5 shadow-sm focus-within:border-amber-600">
                <Search className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search apartment, colony, or city on map..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowSearchDropdown(true)}
                  className="w-full border-none outline-none text-xs bg-transparent text-kisan-dark placeholder-gray-400"
                />
                {searching && <RotateCw className="w-3.5 h-3.5 text-gray-400 animate-spin flex-shrink-0" />}
                {searchQuery && !searching && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchDropdown(false);
                      setSearchResults([]);
                    }}
                    className="text-[11px] text-gray-400 hover:text-gray-600 font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute top-12 left-0 right-0 bg-white border border-kisan-border rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto p-1.5 space-y-1">
                  {searchResults.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => applyPresetHub(item)}
                      className="w-full text-left p-2 hover:bg-amber-50 rounded-lg flex items-start space-x-2 transition-colors tap-effect"
                    >
                      <MapPin className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <strong className="block text-xs text-kisan-dark truncate">
                          {item.title}
                        </strong>
                        <span className="text-[10px] text-kisan-muted truncate block">
                          {item.subtitle || `${item.village}, ${item.district}`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bigger Map with Floating Auto Detect & Unwanted Attribution Hidden */}
            <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-kisan-border shadow-sm bg-gray-100">
              <iframe
                title="Delivery Location Map"
                src={mapEmbedUrl}
                className="w-full border-0 pointer-events-none"
                style={{
                  height: 'calc(100% + 44px)',
                  marginBottom: '-44px',
                }}
                loading="lazy"
              />

              {/* Floating Auto-Detect GPS Button */}
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={detecting}
                className="absolute top-3 right-3 bg-white/95 backdrop-blur-md hover:bg-amber-50 active:scale-95 text-kisan-dark font-bold text-xs px-3.5 py-2 rounded-xl shadow-md border border-kisan-border flex items-center space-x-1.5 transition-all tap-effect z-10"
                title="Auto-detect current GPS location"
              >
                {detecting ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 text-amber-700 animate-spin" />
                    <span className="text-[11px] text-amber-700">Detecting...</span>
                  </>
                ) : (
                  <>
                    <Crosshair className="w-3.5 h-3.5 text-amber-700" />
                    <span className="text-[11px]">Auto Detect</span>
                  </>
                )}
              </button>

              {/* Pinned Coordinates Tag */}
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-kisan-border text-[10px] text-gray-700 font-mono shadow-xs z-10 flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-amber-700" />
                <span>
                  {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Pinned Address Details from Map */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 flex items-start space-x-2.5">
              <MapPin className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                    PINNED ADDRESS
                  </span>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                    Auto-detected
                  </span>
                </div>
                <p className="text-xs font-bold text-kisan-dark mt-0.5 truncate">
                  {formData.location_title || formData.village || 'Delivery Address'}
                </p>
                <p className="text-[11px] text-kisan-muted truncate">
                  {[formData.village, formData.district, formData.state, formData.pincode].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>

            {/* Landmark (The Only Mandatory Field) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-kisan-text">
                  Landmark / House No. / Flat Details <span className="text-red-500 font-black">*</span>
                </label>
                <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-bold">
                  Mandatory
                </span>
              </div>
              <div className="relative">
                <MapPin className="w-4 h-4 text-kisan-muted absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  placeholder="e.g. Flat 402, Green Valley Apartments, Near Main Gate"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50/90 border border-kisan-border rounded-xl focus:outline-none focus:border-amber-600 font-medium"
                  required
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Pin your delivery point on the map above and specify your flat/building landmark here.
              </p>
            </div>

            {/* Submit & Go to Email Verification */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 shadow-md transition-all mt-4 disabled:opacity-50 tap-effect"
            >
              {loading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Link */}
        <div className="mt-4 pt-3 border-t border-gray-100 text-center">
          <Link to="/login" className="text-xs font-semibold text-kisan-primary hover:underline">
            Already registered? Login here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BuyerRegisterPage;
