import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  MapPin,
  X,
  Users,
  ShoppingBag,
  Clock,
  Truck,
  Copy,
  Check,
  ChevronRight,
  PlusCircle,
  Building2,
  ShieldCheck,
  ArrowRight,
  Share2,
  Leaf,
  Award,
  Flame,
  CheckCircle2,
  Tag,
  Star
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import DeliveryRatingModal from '../components/DeliveryRatingModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { PageBackground } from '../../shared';
import bg6 from '../../assets/images/bg6_hd.jpg';
import api from '../../services/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { getLocalizedCategoryName, getLocalizedQuickChips } from '../../utils/productLocalization';

const CATEGORY_EMOJIS = {
  'Vegetables': '🥦',
  'Fruits': '🍎',
  'Grains': '🌾',
  'Pulses': '🫘',
  'Spices': '🌶️',
  'Other Products': '🍯',
};

const MarketplaceHome = () => {
  const { language, t } = useLanguage();
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const quickChips = getLocalizedQuickChips(language);

  // Post-delivery rating prompt state
  const [pendingRatingOrder, setPendingRatingOrder] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const fetchPendingAndCommunity = useCallback(() => {
    if (!isAuthenticated) return;
    api.get('/api/reviews/pending-delivery')
      .then((res) => {
        const pending = res.data.pending_orders || [];
        if (pending.length > 0) {
          const latest = pending[0];
          setPendingRatingOrder(latest);
          if (!sessionStorage.getItem(`kd_rating_dismissed_${latest.id}`)) {
            setShowRatingModal(true);
          }
        }
      })
      .catch(() => {});
    api.get('/api/communities/my')
      .then((res) => {
        setMyCommunity(res.data.community || null);
        setCommunityOrders(res.data.orders || []);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    fetchPendingAndCommunity();
  }, [fetchPendingAndCommunity]);

  const [myCommunity, setMyCommunity] = useState(null);
  const [communityOrders, setCommunityOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & UI modals
  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [onlyOrganic, setOnlyOrganic] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Resolved dynamic delivery location for user
  const displayLocation =
    user?.location_title ||
    (user?.delivery_village ? `${user.delivery_village}, ${user.delivery_district || 'Hyderabad'}` : null) ||
    'Hyderabad, Telangana';

  const buyerGreeting = user?.full_name ? user.full_name.split(' ')[0] : 'Neighbor';

  const fetchCategories = useCallback(() => {
    api.get('/api/categories')
      .then(res => {
        setCategories(res.data.categories || []);
      })
      .catch(err => {
        console.warn('Failed to fetch categories:', err);
      });
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const fetchProducts = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category_id', selectedCategory);
      if (search) params.append('search', search);
      if (sortBy) params.append('sort_by', sortBy);
      if (onlyOrganic) params.append('is_organic', 'true');
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      if (locationFilter) params.append('location', locationFilter);

      const res = await api.get(`/api/products?${params.toString()}`);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedCategory, search, sortBy, onlyOrganic, minPrice, maxPrice, locationFilter]);

  useEffect(() => {
    fetchProducts(false);
  }, [selectedCategory, sortBy, onlyOrganic]);

  const refreshAllHome = useCallback(() => {
    fetchProducts(true);
    fetchCategories();
    fetchPendingAndCommunity();
  }, [fetchProducts, fetchCategories, fetchPendingAndCommunity]);

  useAutoRefresh(refreshAllHome, 10000, !showFilterModal && !showLocationModal && !showRatingModal);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleChipClick = (chip) => {
    setActiveChip(chip.label);
    setSearch(chip.query);
    // Fetch immediately with the new chip query
    const params = new URLSearchParams();
    if (selectedCategory) params.append('category_id', selectedCategory);
    if (chip.query) params.append('search', chip.query);
    if (sortBy) params.append('sort_by', sortBy);
    if (onlyOrganic) params.append('is_organic', 'true');
    setLoading(true);
    api.get(`/api/products?${params.toString()}`)
      .then(res => setProducts(res.data.products || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleQuickAdd = async (product) => {
    const res = await addToCart(product.id, 1);
    if (res.success) {
      setToastMsg(`Added ${product.name} to cart!`);
      setTimeout(() => setToastMsg(''), 2500);
    } else {
      alert(res.error || 'Failed to add');
    }
  };

  return (
    <div className="relative w-full max-w-full min-w-0 overflow-x-hidden mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3.5 pb-28 md:pb-8">
      <PageBackground image={bg6} />

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-950 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-float flex items-center space-x-2 animate-fade-in border border-emerald-500/30">
          <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. TOP DELIVERY BAR & GREETING                           */}
      {/* ======================================================== */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-kisan-border shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          {/* Delivering Location Pill */}
          <button
            type="button"
            onClick={() => setShowLocationModal(true)}
            className="flex items-center space-x-2 text-left min-w-0 hover:bg-gray-50 p-1 rounded-xl transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-500 tracking-wide uppercase flex items-center space-x-1">
                <span>Delivering to</span>
                <ChevronRight className="w-3 h-3 text-gray-400" />
              </span>
              <p className="text-xs font-black text-kisan-dark truncate kd-noun">
                {displayLocation}
              </p>
            </div>
          </button>

          {/* My Community Quick Link (no default timer) */}
          <Link
            to="/buyer/community"
            className="flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 px-3 py-2 rounded-xl text-[11px] font-bold transition-all flex-shrink-0"
          >
            <Users className="w-3.5 h-3.5 text-kisan-primary" />
            <span className="max-w-[120px] truncate">
              {myCommunity ? <><span className="kd-noun">{myCommunity.name}</span> ({myCommunity.members_count})</> : 'My Community'}
            </span>
          </Link>
        </div>
      </div>

      {/* Show a clean community banner ONLY when the user's community has live deals (no fake default timer) */}
      {myCommunity && communityOrders.length > 0 && (
        <Link
          to="/buyer/community"
          className="block bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-3.5 text-white shadow-xs border border-emerald-700/40"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                <span className="kd-noun">{myCommunity.name}</span> • {myCommunity.members_count} neighbors
              </p>
              <p className="text-xs font-extrabold truncate mt-0.5">
                {communityOrders.length} active community group order(s) — Tap to view pool &amp; prices
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-200 flex-shrink-0" />
          </div>
        </Link>
      )}

      {/* ======================================================== */}
      {/* 3. SEARCH BAR & QUICK CHIPS                              */}
      {/* ======================================================== */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchProducePlaceholder')}
              className="w-full pl-10 pr-9 py-2.5 sm:py-3 bg-white border border-kisan-border rounded-2xl text-xs sm:text-sm shadow-2xs focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setActiveChip('All');
                  fetchProducts();
                }}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          <button
            type="button"
            onClick={() => setShowFilterModal(true)}
            className="p-2.5 sm:p-3 bg-white border border-kisan-border rounded-2xl text-gray-700 hover:text-emerald-700 shadow-2xs flex items-center space-x-1.5 transition-colors"
            title="Filter Produce"
          >
            <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline text-xs font-bold">{t('filter')}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. VISUAL CATEGORIES SECTION                             */}
      {/* ======================================================== */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold text-kisan-dark tracking-wide uppercase">
            {t('farmCategories')}
          </h3>
          {selectedCategory && (
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="text-[11px] font-bold text-emerald-700 hover:underline"
            >
              {t('allCategories')}
            </button>
          )}
        </div>

        <div className="w-full max-w-full flex items-center space-x-2.5 overflow-x-auto no-scrollbar py-1">
          {/* All Produce Pill */}
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`flex flex-col items-center justify-center min-w-[70px] sm:min-w-[80px] p-2.5 rounded-2xl border transition-all shadow-2xs ${
              selectedCategory === null
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-white text-gray-800 border-kisan-border hover:bg-gray-50'
            }`}
          >
            <span className="text-xl mb-1">🌱</span>
            <span className="text-[11px] font-bold leading-tight">{t('allCrops')}</span>
          </button>

          {/* Dynamic Categories */}
          {categories.map((c) => {
            const emoji = CATEGORY_EMOJIS[c.name] || '🌾';
            const isSelected = selectedCategory === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`flex flex-col items-center justify-center min-w-[70px] sm:min-w-[80px] p-2.5 rounded-2xl border transition-all shadow-2xs ${
                  isSelected
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-white text-gray-800 border-kisan-border hover:bg-gray-50'
                }`}
              >
                <span className="text-xl mb-1">{emoji}</span>
                <span className="text-[11px] font-bold leading-tight truncate max-w-[70px]">
                  {getLocalizedCategoryName(c.name, language)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. DIRECT FARM TRANSPARENCY BANNER                       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-3 gap-2 bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 p-2.5 rounded-2xl border border-emerald-200/60 text-center">
        <div className="flex flex-col items-center p-1">
          <Truck className="w-4 h-4 text-emerald-700 mb-1" />
          <span className="text-[10px] font-black text-emerald-950 leading-tight">{t('direct100')}</span>
          <span className="text-[9px] text-gray-500">{t('zeroMiddlemen')}</span>
        </div>
        <div className="flex flex-col items-center p-1 border-x border-emerald-200/50">
          <Clock className="w-4 h-4 text-emerald-700 mb-1" />
          <span className="text-[10px] font-black text-emerald-950 leading-tight">{t('dawnHarvest')}</span>
          <span className="text-[9px] text-gray-500">{t('dawnHarvestSub')}</span>
        </div>
        <div className="flex flex-col items-center p-1">
          <ShieldCheck className="w-4 h-4 text-emerald-700 mb-1" />
          <span className="text-[10px] font-black text-emerald-950 leading-tight">{t('fairPrice')}</span>
          <span className="text-[9px] text-gray-500">{t('farmerShare')}</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. PRODUCTS HEADER & SORTING                             */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between text-xs text-kisan-muted px-1 pt-1">
        <button
          type="button"
          onClick={() => setOnlyOrganic(!onlyOrganic)}
          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center space-x-1 border transition-all ${
            onlyOrganic
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
              : 'bg-white text-gray-700 border-kisan-border hover:border-emerald-500'
          }`}
        >
          <Leaf className="w-3.5 h-3.5 text-emerald-500" />
          <span>100% Organic Only</span>
        </button>

        <div className="flex items-center space-x-1.5">
          <span className="hidden sm:inline font-semibold">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-kisan-border rounded-xl px-2.5 py-1 text-xs font-bold text-gray-800 focus:outline-none"
          >
            <option value="newest">Recently Harvested</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 7. PRODUCTS GRID                                         */}
      {/* ======================================================== */}
      {loading ? (
        <div className="min-h-[35vh] flex flex-col items-center justify-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-700"></div>
          <span className="text-xs text-gray-500 font-medium">Loading fresh harvest...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-kisan-border shadow-xs">
          <p className="text-base font-extrabold text-kisan-dark">No crops found</p>
          <p className="text-xs text-gray-500 mt-1">
            Try searching for other items or resetting filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setActiveChip('All');
              setSelectedCategory(null);
              setOnlyOrganic(false);
            }}
            className="mt-4 px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="w-full max-w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onQuickAdd={handleQuickAdd}
              shoppingMode="individual"
            />
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. CHANGE DELIVERY LOCATION MODAL                        */}
      {/* ======================================================== */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <h3 className="font-extrabold text-sm text-kisan-dark">Select Delivery Hub</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-gray-600 text-xs">
                Pick your residential community or area for consolidated morning dispatch:
              </p>
              {[
                { name: 'Madhapur & HITEC City Hub', code: '500081', desc: 'Main Drop: Green Valley Security Desk' },
                { name: 'Gachibowli Financial District', code: '500032', desc: 'Main Drop: DLF Gate 2 Clubhouse' },
                { name: 'Kondapur & Botanical Garden', code: '500084', desc: 'Main Drop: MyHome Bhooja Lobby' },
                { name: 'Kukatpally Housing Board (KPHB)', code: '500072', desc: 'Main Drop: Metro Station Complex' },
              ].map((loc) => (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => {
                    setLocationFilter(loc.name);
                    setShowLocationModal(false);
                    setToastMsg(`Delivery location set to ${loc.name}`);
                    setTimeout(() => setToastMsg(''), 2500);
                  }}
                  className="w-full text-left p-3 rounded-xl border border-kisan-border hover:border-emerald-600 hover:bg-emerald-50/50 transition-colors flex items-center justify-between group"
                >
                  <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-emerald-800">{loc.name}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">{loc.desc} • {loc.code}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Old static community modal removed; handled by CommunityPage & CommunityJoinCreateModal */}

      {/* ======================================================== */}
      {/* 10. FILTER MODAL                                         */}
      {/* ======================================================== */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-kisan-dark">Filter Produce</h3>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1">Price Range (₹)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMinPrice('');
                  setMaxPrice('');
                  setLocationFilter('');
                  fetchProducts();
                  setShowFilterModal(false);
                }}
                className="flex-1 py-2.5 font-bold border rounded-xl text-gray-500"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  fetchProducts();
                  setShowFilterModal(false);
                }}
                className="flex-1 py-2.5 font-bold bg-emerald-700 text-white rounded-xl shadow-2xs"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Post-Delivery Pending Rating Banner (if user tapped Later) */}
      {pendingRatingOrder && !showRatingModal && (
        <div className="fixed top-16 left-0 right-0 z-30 px-3.5 max-w-lg mx-auto pointer-events-none">
          <div
            onClick={() => setShowRatingModal(true)}
            className="pointer-events-auto bg-amber-50 border border-amber-300 text-amber-950 rounded-2xl px-3.5 py-2 shadow-md flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all"
          >
            <div className="flex items-center space-x-2 min-w-0">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500 flex-shrink-0" />
              <p className="text-[11px] font-extrabold truncate">
                Order {pendingRatingOrder.order_number} delivered! Tap to rate
              </p>
            </div>
            <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-lg flex-shrink-0 ml-2">
              Rate ★
            </span>
          </div>
        </div>
      )}

      {/* Automatic Post-Delivery Rating & Feedback Modal */}
      {showRatingModal && pendingRatingOrder && (
        <DeliveryRatingModal
          order={pendingRatingOrder}
          onClose={() => {
            sessionStorage.setItem(`kd_rating_dismissed_${pendingRatingOrder.id}`, '1');
            setShowRatingModal(false);
          }}
          onSubmitted={() => {
            setShowRatingModal(false);
            setPendingRatingOrder(null);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
};

export default MarketplaceHome;
