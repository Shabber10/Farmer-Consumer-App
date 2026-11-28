import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sprout,
  User,
  Lock,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Search,
  Crosshair,
  RotateCw,
  CheckCircle2,
  Radio,
  LocateFixed,
  Building,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { BackButton, RapidoMapPicker, PasswordInput } from '../../shared';
import { PINCODE_MANDALS_MAP } from '../../data/pincodeLocations';
import { getCurrentLocation } from '../../utils/geolocation';

// Background Image & Brand Assets
import bg2 from '../../assets/images/bg2_hd.jpg';
import brandLogo from '../../assets/images/kisan_direct_brand_logo.png';

// Preset Major Agricultural Hubs & Mandis for Instant Pinning
const PRESET_FARM_HUBS = [
  {
    id: 'bowenpally',
    title: 'Bowenpally Agricultural Market',
    subtitle: 'Secunderabad, Hyderabad, Telangana',
    village: 'Bowenpally',
    district: 'Hyderabad',
    state: 'Telangana',
    pincode: '500011',
    landmark: 'Near APMC Vegetable Market Yard',
    lat: 17.4764,
    lng: 78.4867,
  },
  {
    id: 'siddipet',
    title: 'Siddipet Rythu Bazar & Agricultural Yard',
    subtitle: 'Siddipet, Telangana',
    village: 'Siddipet',
    district: 'Siddipet',
    state: 'Telangana',
    pincode: '502103',
    landmark: 'Near Rythu Vedika & Collectorate Road',
    lat: 18.1018,
    lng: 78.8520,
  },
  {
    id: 'warangal',
    title: 'Warangal Enamamula Grain Market',
    subtitle: 'Enamamula, Warangal, Telangana',
    village: 'Enamamula',
    district: 'Warangal',
    state: 'Telangana',
    pincode: '506005',
    landmark: 'Asia Second Largest Grain Market Yard',
    lat: 17.9689,
    lng: 79.6200,
  },
  {
    id: 'nizamabad',
    title: 'Nizamabad APMC Mandi',
    subtitle: 'Nizamabad, Telangana',
    village: 'Nizamabad',
    district: 'Nizamabad',
    state: 'Telangana',
    pincode: '503001',
    landmark: 'Opposite New Grain Market Yard',
    lat: 18.6725,
    lng: 78.0944,
  },
  {
    id: 'khammam',
    title: 'Khammam Agricultural Market Yard',
    subtitle: 'Khammam, Telangana',
    village: 'Khammam',
    district: 'Khammam',
    state: 'Telangana',
    pincode: '507001',
    landmark: 'Near Mirchi Mandi Yard',
    lat: 17.2473,
    lng: 80.1514,
  },
  {
    id: 'karimnagar',
    title: 'Karimnagar Rythu Bazar',
    subtitle: 'Karimnagar, Telangana',
    village: 'Karimnagar',
    district: 'Karimnagar',
    state: 'Telangana',
    pincode: '505001',
    landmark: 'Near Collectorate Chowrasta',
    lat: 18.4386,
    lng: 79.1288,
  },
  {
    id: 'sangareddy',
    title: 'Sangareddy Agricultural Market Yard',
    subtitle: 'Kandi, Sangareddy, Telangana',
    village: 'Kandi',
    district: 'Sangareddy',
    state: 'Telangana',
    pincode: '502001',
    landmark: 'Near NH65 Market Yard',
    lat: 17.6190,
    lng: 78.0818,
  },
  {
    id: 'medak',
    title: 'Medak Farmer Market Yard',
    subtitle: 'Medak, Telangana',
    village: 'Medak',
    district: 'Medak',
    state: 'Telangana',
    pincode: '502110',
    landmark: 'Near Bus Depot Road',
    lat: 18.0483,
    lng: 78.2617,
  },
  {
    id: 'gaddiannaram',
    title: 'Kothapet Fruit & Vegetable Market',
    subtitle: 'Dilsukhnagar, Ranga Reddy, Telangana',
    village: 'Kothapet',
    district: 'Ranga Reddy',
    state: 'Telangana',
    pincode: '500035',
    landmark: 'Near Victoria Memorial Metro',
    lat: 17.3688,
    lng: 78.5307,
  },
  {
    id: 'shamshabad',
    title: 'Shamshabad Farmer Produce Yard',
    subtitle: 'Shamshabad, Ranga Reddy, Telangana',
    village: 'Shamshabad',
    district: 'Ranga Reddy',
    state: 'Telangana',
    pincode: '501218',
    landmark: 'Near Airport Road Junction',
    lat: 17.2543,
    lng: 78.3970,
  },
];

const FarmerRegisterPage = () => {
  const { register } = useAuth();
  const { t, language } = useLanguage();
  const { registerBackAction } = useNavigation();
  const navigate = useNavigate();

  // Multi-step tracking: Step 1 (Account details) -> Step 2 (Address & GPS Pin)
  const [currentStep, setCurrentStep] = useState(1);

  // When on Step 2 (Address), pressing mobile hardware back button or in-app back returns to Step 1
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
    farm_name: '',
    village: '',
    district: '',
    state: 'Telangana',
    pincode: '',
    password: '',
    confirm_password: '',
    landmark: '',
    latitude: 17.4764,
    longitude: 78.4867,
    location_title: 'Bowenpally Agricultural Market',
    location_source: 'preset',
    accuracy: null,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Search places / villages / mandis on map
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
    // 1. Instant local matches from preset agricultural hubs
    const localMatches = PRESET_FARM_HUBS.filter(
      (hub) =>
        hub.title.toLowerCase().includes(q) ||
        hub.village.toLowerCase().includes(q) ||
        hub.district.toLowerCase().includes(q) ||
        hub.pincode.includes(q)
    );

    setSearchResults(localMatches);

    // 2. Query OpenStreetMap Nominatim for any village/town/city
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
              village: addr.village || addr.town || addr.suburb || addr.city || title,
              district: addr.state_district || addr.county || addr.district || addr.city || '',
              state: addr.state || 'Telangana',
              pincode: (addr.postcode || '').replace(/\D/g, '').slice(0, 6) || '500001',
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            };
          });

          // Combine results, avoiding coordinate duplicates
          const combined = [...localMatches];
          remoteMatches.forEach((rm) => {
            if (!combined.some((c) => Math.abs(c.lat - rm.lat) < 0.005 && Math.abs(c.lng - rm.lng) < 0.005)) {
              combined.push(rm);
            }
          });
          setSearchResults(combined);
        }
      } catch (err) {
        // Keep local matches on error
      } finally {
        setSearching(false);
      }
    }
  };

  // Step 1 Validation & Proceed to Step 2
  const handleProceedToAddress = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.full_name.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email address is mandatory');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address (e.g. name@domain.com)');
      return;
    }

    if (!formData.mobile_number.trim()) {
      setError('Mobile number is mandatory');
      return;
    }

    const cleanedMobile = formData.mobile_number.replace(/\D/g, '');
    if (cleanedMobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    // All Step 1 validations passed -> advance to Address step
    setCurrentStep(2);
    // If village is not set yet, initialize from default hub
    if (!formData.village) {
      const defaultHub = PRESET_FARM_HUBS[0];
      setFormData((prev) => ({
        ...prev,
        village: defaultHub.village,
        district: defaultHub.district,
        state: defaultHub.state,
        pincode: defaultHub.pincode,
        landmark: defaultHub.landmark,
        latitude: defaultHub.lat,
        longitude: defaultHub.lng,
        location_title: defaultHub.title,
      }));
    }
  };

  // Apply Hub / Pin selection
  const applyPresetHub = (hub) => {
    setFormData((prev) => ({
      ...prev,
      latitude: hub.lat,
      longitude: hub.lng,
      location_title: hub.title,
      village: hub.village,
      district: hub.district,
      state: hub.state,
      pincode: hub.pincode,
      landmark: hub.landmark,
      location_source: 'preset',
      accuracy: null,
    }));
    setShowSearchDropdown(false);
    setSearchQuery('');
    setStatusMessage(`Selected: ${hub.title} (${hub.district})`);
  };

  // Detect Actual GPS Location via Native Capacitor Geolocation & Fallbacks
  const handleDetectGPS = async () => {
    setDetecting(true);
    setStatusMessage('Checking location permissions...');

    try {
      const loc = await getCurrentLocation((msg) => setStatusMessage(msg));
      setFormData((prev) => ({
        ...prev,
        latitude: loc.latitude,
        longitude: loc.longitude,
        location_title: loc.address.title || prev.location_title,
        village: loc.address.village || prev.village || 'Bowenpally',
        district: loc.address.district || prev.district || 'Hyderabad',
        state: loc.address.state || prev.state || 'Telangana',
        pincode: loc.address.pincode || prev.pincode || '500011',
        landmark: loc.address.landmark || prev.landmark || 'Near APMC Vegetable Market Yard',
        accuracy: loc.accuracy,
        location_source: loc.source,
      }));

      setStatusMessage(
        loc.accuracy
          ? `GPS Location pinned successfully! (Accuracy: ±${loc.accuracy}m)`
          : `Location pinned: ${loc.address.village || 'Hyderabad'}, ${loc.address.state}`
      );
    } catch (err) {
      console.warn('Geolocation detection notice:', err);
      setStatusMessage('Could not detect location. Please search or select below.');
    } finally {
      setDetecting(false);
    }
  };

  // Final Registration Submission (from Step 2)
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.landmark || !formData.landmark.trim()) {
      setError('Landmark is mandatory. Please enter a landmark for your farm location.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        role: 'farmer',
        language,
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        mobile_number: formData.mobile_number.trim(),
        farm_name: formData.farm_name.trim() || `${formData.full_name.trim()}'s Farm`,
        village: formData.village.trim() || formData.location_title || 'Local Farm',
        district: formData.district.trim() || 'Telangana',
        state: formData.state.trim() || 'Telangana',
        pincode: formData.pincode.trim() || '500001',
        password: formData.password,
        confirm_password: formData.confirm_password,
        latitude: formData.latitude,
        longitude: formData.longitude,
        location_title: formData.location_title,
        landmark: formData.landmark.trim(),
      };

      const registered = await register(payload);
      navigate('/verify-email', {
        state: {
          email: formData.email.trim(),
          role: 'farmer',
          dev_otp: registered?.dev_otp
        }
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
      className="min-h-screen min-h-[100dvh] w-full relative flex flex-col justify-start sm:justify-center items-center px-3.5 sm:px-6 py-4 sm:py-6 bg-cover bg-center bg-no-repeat overflow-y-auto overflow-x-hidden"
      style={{
        backgroundImage: `url(${bg2})`,
        paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))',
        paddingLeft: 'max(0.875rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.875rem, env(safe-area-inset-right, 0px))',
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
        <div className="flex items-center space-x-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-white/50">
          <img src={brandLogo} alt="KisanDirect" className="h-5 sm:h-6 w-auto object-contain" />
        </div>
        <div className="w-16 flex-shrink-0" />
      </div>

      {/* Card Container */}
      <div className="relative z-10 w-full max-w-lg my-2 bg-white/95 backdrop-blur-xl rounded-3xl p-5 sm:p-7 border border-white/60 shadow-2xl transition-all">
        {/* Clean Card Title */}
        <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-100">
          <div className="w-10 h-10 rounded-2xl bg-kisan-primary text-white flex items-center justify-center flex-shrink-0 shadow-md">
            {currentStep === 1 ? <User className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-lg font-black text-kisan-dark">
              {currentStep === 1 ? 'Account Details' : 'Farm Location'}
            </h1>
            <p className="text-[11px] text-kisan-muted">
              {currentStep === 1
                ? 'Fill in your name, contact, and security details'
                : 'Pin your farm on the map and enter landmark'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-kisan-danger">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 1: Basic Info & Mandatory Contact Details           */}
        {/* ======================================================== */}
        {currentStep === 1 && (
          <form onSubmit={handleProceedToAddress} className="space-y-3 text-xs">
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
                  placeholder="e.g. Ramesh Patel"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50/90 border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary"
                  required
                />
              </div>
            </div>

            {/* Email Address (Mandatory) */}
            <div>
              <label className="block font-bold text-kisan-text mb-1">
                Email Address <span className="text-red-500 font-black">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-kisan-muted absolute left-3 top-3" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ramesh@farm.com"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50/90 border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary"
                  required
                />
              </div>
            </div>

            {/* Mobile Number (Mandatory) */}
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
                      mobile_number: e.target.value.replace(/\D/g, ''),
                    })
                  }
                  placeholder="9876543210"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50/90 border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary font-medium tracking-wide"
                  required
                />
              </div>
            </div>

            {/* Farm Name (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-kisan-text">Farm Name</label>
                <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                  Optional
                </span>
              </div>
              <input
                type="text"
                value={formData.farm_name}
                onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
                placeholder="e.g. Patel Organic Farms (Leave empty to use your name)"
                className="w-full px-3 py-2 bg-gray-50/90 border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary"
              />
            </div>

            {/* Password and Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-bold text-kisan-text mb-1">
                  Password <span className="text-red-500 font-black">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-kisan-muted absolute left-3 top-3 z-10 pointer-events-none" />
                  <PasswordInput
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 py-2 bg-gray-50/90 border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-kisan-text mb-1">
                  Confirm Password <span className="text-red-500 font-black">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-kisan-muted absolute left-3 top-3 z-10 pointer-events-none" />
                  <PasswordInput
                    value={formData.confirm_password}
                    onChange={(e) =>
                      setFormData({ ...formData, confirm_password: e.target.value })
                    }
                    placeholder="Re-enter password"
                    className="w-full pl-9 py-2 bg-gray-50/90 border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Next Button */}
            <button
              type="submit"
              className="w-full bg-kisan-primary hover:bg-kisan-dark text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 shadow-md transition-all mt-4 tap-effect"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* STEP 2: Interactive Rapido Map Location & Farm Details */}
        {/* ======================================================== */}
        {currentStep === 2 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4 text-xs">
            {/* Live Interactive Rapido Map Picker */}
            <RapidoMapPicker
              initialLat={formData.latitude}
              initialLng={formData.longitude}
              initialTitle={formData.location_title || 'Bowenpally Agricultural Market'}
              initialAddress={[formData.village, formData.district, formData.state].filter(Boolean).join(', ') || 'Hyderabad, Telangana - 500011'}
              initialCity={formData.district || 'Hyderabad'}
              initialPincode={formData.pincode || '500011'}
              pinLabel="Farm Location"
              selectedLabel="Selected Farm Location"
              mapHeight="280px"
              onLocationChange={(loc) => {
                setFormData((prev) => {
                  const updatedPincode = loc.pincode || prev.pincode;
                  let autoDistrict = loc.district || prev.district;
                  let autoVillage = loc.village || prev.village;
                  if (updatedPincode && PINCODE_MANDALS_MAP[updatedPincode]) {
                    const mapped = PINCODE_MANDALS_MAP[updatedPincode];
                    if (mapped.city) autoDistrict = mapped.city;
                    if (mapped.mandals && mapped.mandals.length > 0 && !prev.village) {
                      autoVillage = mapped.mandals[0].replace(' Mandal', '');
                    }
                  }
                  return {
                    ...prev,
                    latitude: loc.lat,
                    longitude: loc.lng,
                    location_title: loc.title || prev.location_title,
                    location_source: loc.source || prev.location_source,
                    village: autoVillage,
                    district: autoDistrict,
                    state: loc.state || prev.state,
                    pincode: updatedPincode,
                    landmark: loc.landmark || prev.landmark,
                  };
                });
              }}
            />

            {/* Landmark (Mandatory) */}
            <div>
              <label className="block font-bold text-kisan-text mb-1">
                Landmark / Farm Survey No. <span className="text-red-500 font-black">*</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-kisan-muted absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  placeholder="e.g. Near APMC Market Yard / Survey #42"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50/90 border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary text-xs font-medium"
                  required
                />
              </div>
            </div>



            {/* Single Clean Next Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-kisan-primary hover:bg-kisan-dark text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 shadow-md transition-all disabled:opacity-50 tap-effect"
              >
                <span>{loading ? 'Submitting...' : 'Next'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 text-center">
          <Link to="/login" className="text-xs font-bold text-kisan-primary hover:underline">
            {t('alreadyHaveAccount')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FarmerRegisterPage;
