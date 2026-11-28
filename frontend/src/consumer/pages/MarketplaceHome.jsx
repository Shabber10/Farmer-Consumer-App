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
    <div className="relative w-full max-w-7xl min-w-0 overflow-x-hidden mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-3 pb-28 md:pb-8">
      <PageBackground image={bg6} />

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-950 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-float flex items-center space-x-2 animate-fade-in border border-emerald-500/30">
          <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. COMPACT COMMAND BAR: LOCATION + SEARCH + COMMUNITY     */}
      {/* ======================================================== */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-kisan-border shadow-2xs space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2">
          <div className="flex items-center justify-between gap-2 lg:contents">
            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              className="flex items-center space-x-2 text-left min-w-0 hover:bg-gray-50 px-2 py-1 rounded-xl transition-colors lg:order-1 lg:max-w-[230px]"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-gray-500 tracking-wide uppercase flex items-center space-x-0.5">
                  <span>Delivering to</span>
                  <ChevronRight className="w-2.5 h-2.5 text-gray-400" />
                </span>
                <p className="text-xs font-black text-kisan-dark truncate kd-noun">
                  {displayLocation}
                </p>
              </div>
            </button>

            <Link
              to="/buyer/community"
              className={`lg:order-3 flex items-center space-x-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all flex-shrink-0 ${
                myCommunity && communityOrders.length > 0
                  ? 'bg-gradient-to-r from-emerald-800 to-teal-900 text-white shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900'
              }`}
            >
              <Users className={`w-3.5 h-3.5 ${myCommunity && communityOrders.length > 0 ? 'text-emerald-300' : 'text-kisan-primary'}`} />
              <span className="max-w-[155px] sm:max-w-[260px] truncate">
                {myCommunity ? (
                  <>
                    <span className="kd-noun">{myCommunity.name}</span> ({myCommunity.members_count})
                    {communityOrders.length > 0 ? ` • ${communityOrders.length} Pool${communityOrders.length > 1 ? 's' : ''}` : ''}
                  </>
                ) : (
                  'My Community'
                )}
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-80 flex-shrink-0" />
            </Link>
          </div>

          <div className="flex items-center space-x-2 flex-1 min-w-0 lg:order-2">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchProducePlaceholder')}
                className="w-full pl-9 pr-8 py-2 bg-gray-50/80 border border-kisan-border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setActiveChip('All');
                    fetchProducts();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            <button
              type="button"
              onClick={() => setShowFilterModal(true)}
              className="px-3 py-2 bg-gray-50/80 hover:bg-emerald-50 border border-kisan-border rounded-xl text-gray-700 hover:text-emerald-700 flex items-center space-x-1.5 transition-colors flex-shrink-0"
              title="Filter"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-bold">{t('filter')}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 pt-2 border-t border-gray-100">
          <div className="w-full lg:w-auto lg:flex-1 min-w-0 flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 border transition-all ${
                selectedCategory === null
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                  : 'bg-gray-50 text-gray-800 border-kisan-border hover:bg-emerald-50'
              }`}
            >
              <span>🌱</span>
              <span>{t('allCrops')}</span>
            </button>

            {categories.map((c) => {
              const emoji = CATEGORY_EMOJIS[c.name] || '🌾';
              const isSelected = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 border transition-all ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'bg-gray-50 text-gray-800 border-kisan-border hover:bg-emerald-50'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{getLocalizedCategoryName(c.name, language)}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between lg:justify-end gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setOnlyOrganic(!onlyOrganic)}
              className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center space-x-1 border transition-all ${
                onlyOrganic
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                  : 'bg-white text-gray-700 border-kisan-border hover:border-emerald-500'
              }`}
            >
              <Leaf className={`w-3.5 h-3.5 ${onlyOrganic ? 'text-emerald-200' : 'text-emerald-500'}`} />
              <span>100% Organic Only</span>
            </button>

            <div className="flex items-center space-x-1.5">
              <span className="hidden sm:inline text-[11px] text-kisan-muted font-semibold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-kisan-border rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-800 focus:outline-none"
              >
                <option value="newest">Recently Harvested</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Slim Farm Guarantee Strip */}
      <div className="flex flex-wrap items-center justify-center sm:justify-between gap-x-4 gap-y-1 bg-emerald-50/80 border border-emerald-200/60 rounded-xl px-3.5 py-1.5 text-[10px] sm:text-[11px] font-bold text-emerald-950">
        <span className="inline-flex items-center space-x-1"><Truck className="w-3.5 h-3.5 text-emerald-700" /><span>{t('direct100')} · {t('zeroMiddlemen')}</span></span>
        <span className="inline-flex items-center space-x-1"><Clock className="w-3.5 h-3.5 text-emerald-700" /><span>{t('dawnHarvest')} · {t('dawnHarvestSub')}</span></span>
        <span className="inline-flex items-center space-x-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /><span>{t('fairPrice')} · {t('farmerShare')}</span></span>
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
