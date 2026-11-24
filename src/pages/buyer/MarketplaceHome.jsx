import React, { useState, useEffect } from 'react';
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
  ArrowRight
} from 'lucide-react';
import ProductCard from '../../components/product/ProductCard';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import PageBackground from '../../components/common/PageBackground';
import bg6 from '../../assets/images/bg6_hd.jpg';
import api from '../../services/api';

const MarketplaceHome = () => {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Purchasing Mode: 'community' (default bulk buying) or 'individual' (normal shopping)
  const [shoppingMode, setShoppingMode] = useState('community');

  // Active Community State
  const [activeCommunity, setActiveCommunity] = useState({
    name: 'Green Valley Residents',
    type: 'Apartment & Society',
    inviteCode: 'GV2026X',
    adminName: 'Suresh Reddy',
    adminPhone: '9876543210',
    area: 'Madhapur, Hyderabad',
    deliveryPoint: 'Main Gate Security Office',
    targetKg: 50,
    collectedKg: 38.5,
    membersCount: 24,
    hoursLeft: 14,
    minutesLeft: 22,
    secondsLeft: 45
  });

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & UI modals
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [onlyOrganic, setOnlyOrganic] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [communityModalTab, setCommunityModalTab] = useState('join'); // 'join' or 'create'
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [newCommunityForm, setNewCommunityForm] = useState({
    name: '',
    type: 'Apartment',
    area: 'Madhapur, Hyderabad',
    deliveryPoint: 'Main Gate',
    pincode: '500081'
  });

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Live Countdown Timer for Community Deadline
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCommunity(prev => {
        if (prev.secondsLeft > 0) {
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        } else if (prev.minutesLeft > 0) {
          return { ...prev, minutesLeft: prev.minutesLeft - 1, secondsLeft: 59 };
        } else if (prev.hoursLeft > 0) {
          return { ...prev, hoursLeft: prev.hoursLeft - 1, minutesLeft: 59, secondsLeft: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    api.get('/api/categories').then(res => {
      setCategories(res.data.categories || []);
    });
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy, onlyOrganic]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleQuickAdd = async (product) => {
    const res = await addToCart(product.id, 1);
    if (res.success) {
      const modeLabel = shoppingMode === 'community' ? 'community pool' : 'cart';
      setToastMsg(`Added ${product.name} to ${modeLabel}!`);
      if (shoppingMode === 'community') {
        setActiveCommunity(prev => ({
          ...prev,
          collectedKg: Math.min(prev.targetKg, parseFloat((prev.collectedKg + 1).toFixed(1)))
        }));
      }
      setTimeout(() => setToastMsg(''), 2500);
    } else {
      alert(res.error || 'Failed to add');
    }
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard?.writeText(activeCommunity.inviteCode);
    setCopiedCode(true);
    setToastMsg(`Invitation code ${activeCommunity.inviteCode} copied to clipboard!`);
    setTimeout(() => {
      setCopiedCode(false);
      setToastMsg('');
    }, 2500);
  };

  const handleJoinCommunity = (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setActiveCommunity(prev => ({
      ...prev,
      name: `Society (${joinCodeInput.toUpperCase()})`,
      inviteCode: joinCodeInput.toUpperCase()
    }));
    setShowCommunityModal(false);
    setToastMsg(`Joined community ${joinCodeInput.toUpperCase()}! Bulk pricing active.`);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleCreateCommunity = (e) => {
    e.preventDefault();
    if (!newCommunityForm.name.trim()) return;
    const newCode = 'GV' + Math.floor(1000 + Math.random() * 9000);
    setActiveCommunity(prev => ({
      ...prev,
      name: newCommunityForm.name,
      type: newCommunityForm.type,
      inviteCode: newCode,
      area: newCommunityForm.area,
      deliveryPoint: newCommunityForm.deliveryPoint,
      collectedKg: 0,
      membersCount: 1
    }));
    setShowCommunityModal(false);
    setToastMsg(`Community "${newCommunityForm.name}" created! Your invite code is ${newCode}`);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const progressPercent = Math.min(
    100,
    Math.round((activeCommunity.collectedKg / activeCommunity.targetKg) * 100)
  );

  return (
    <div className="relative max-w-7xl mx-auto px-4 py-4 sm:py-6 space-y-4 pb-24 md:pb-8">
      <PageBackground image={bg6} />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-kisan-dark text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-float flex items-center space-x-2 animate-fade-in border border-white/20">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Location Bar & Mode Switcher */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-kisan-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Delivering Location */}
        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-kisan-primary flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-kisan-muted tracking-wider block">
              Delivering to
            </span>
            <p className="text-xs font-bold text-kisan-dark truncate">
              {activeCommunity.area}
              {shoppingMode === 'community' && ` • ${activeCommunity.name}`}
            </p>
          </div>
        </div>

        {/* Shopping Mode Switcher */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setShoppingMode('community')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              shoppingMode === 'community'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-kisan-dark'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Community Group Buy</span>
            <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.2 rounded-full font-extrabold ml-1">
              ₹0 Delivery
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShoppingMode('individual')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              shoppingMode === 'individual'
                ? 'bg-white text-kisan-dark shadow-xs'
                : 'text-gray-600 hover:text-kisan-dark'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Individual Order</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* COMMUNITY BULK POOL CARD (When in Community Mode)         */}
      {/* ======================================================== */}
      {shoppingMode === 'community' ? (
        <div className="bg-gradient-to-br from-emerald-800 via-kisan-primary to-emerald-950 rounded-3xl p-5 sm:p-6 text-white shadow-card relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Row: Community Info & Change Community */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/15">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-emerald-100 flex items-center space-x-1">
                <Building2 className="w-3 h-3 mr-1" />
                {activeCommunity.type}
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-white">
                {activeCommunity.name}
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopyInviteCode}
                className="bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all"
                title="Copy community invitation code"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                <span>Code: {activeCommunity.inviteCode}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCommunityModal(true)}
                className="text-[11px] font-bold text-emerald-200 hover:text-white underline ml-1"
              >
                Switch / Join
              </button>
            </div>
          </div>

          {/* Middle Row: Combined Order Target & Live Progress */}
          <div className="py-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="text-[11px] text-emerald-200 font-medium">Community Bulk Progress:</span>
                <span className="text-base font-black ml-1.5 text-white">
                  {activeCommunity.collectedKg} / {activeCommunity.targetKg} kg
                </span>
                <span className="text-[11px] text-emerald-300 font-semibold ml-1">
                  ({progressPercent}% reached)
                </span>
              </div>

              {/* Countdown Timer */}
              <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-xl flex items-center space-x-1.5 text-[11px] font-bold text-amber-300 border border-amber-300/30">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {String(activeCommunity.hoursLeft).padStart(2, '0')}h : {String(activeCommunity.minutesLeft).padStart(2, '0')}m : {String(activeCommunity.secondsLeft).padStart(2, '0')}s
                </span>
              </div>
            </div>

            {/* Target Progress Bar */}
            <div className="w-full bg-black/40 rounded-full h-3.5 p-0.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 via-emerald-400 to-emerald-300 h-full rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-emerald-100 pt-0.5">
              <span>
                🎯 Only <strong>{(activeCommunity.targetKg - activeCommunity.collectedKg).toFixed(1)} kg</strong> needed to lock in wholesale bulk price!
              </span>
              <span className="flex items-center space-x-1 text-emerald-200 font-medium">
                <Users className="w-3 h-3" />
                <span>{activeCommunity.membersCount} neighbors ordering</span>
              </span>
            </div>
          </div>

          {/* Bottom Perks Banner */}
          <div className="bg-white/10 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-emerald-300" />
              <span className="font-bold text-[11px]">
                ₹0 Delivery Charges • Consolidated Drop at {activeCommunity.deliveryPoint}
              </span>
            </div>
            <span className="text-[10px] text-emerald-200 bg-emerald-900/60 px-2 py-0.5 rounded-md font-semibold">
              Guaranteed Fresh Morning Delivery
            </span>
          </div>
        </div>
      ) : (
        /* Individual Shopping Banner */
        <div className="bg-white rounded-3xl p-5 border border-kisan-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block mb-1">
              🛒 Individual Home Shopping Mode
            </span>
            <h3 className="text-base font-bold text-kisan-dark">
              Shop Independently at Direct Farmer Rates
            </h3>
            <p className="text-xs text-kisan-muted mt-0.5">
              Items will be delivered directly to your doorstep. Standard individual delivery charges apply.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShoppingMode('community')}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 transition-all self-start sm:self-auto flex-shrink-0"
          >
            <Users className="w-4 h-4" />
            <span>Switch to Group Buying (Save 25%)</span>
          </button>
        </div>
      )}

      {/* Search Bar & Filter Options */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-kisan-muted absolute left-3.5 top-3 sm:top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search farm tomatoes, onions, leafy greens..."
            className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-kisan-border rounded-2xl text-xs sm:text-sm shadow-xs focus:outline-none focus:border-kisan-primary"
          />
        </form>

        <button
          type="button"
          onClick={() => setShowFilterModal(true)}
          className="p-2.5 sm:p-3 bg-white border border-kisan-border rounded-2xl text-kisan-text hover:text-kisan-primary shadow-xs flex items-center space-x-1.5"
          title="Filter produce"
        >
          <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline text-xs font-bold">Filter</span>
        </button>
      </div>

      {/* Horizontal Category Selector */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shadow-xs ${
            selectedCategory === null
              ? 'bg-kisan-primary text-white shadow-sm'
              : 'bg-white text-kisan-text border border-kisan-border hover:bg-gray-50'
          }`}
        >
          All Produce
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shadow-xs ${
              selectedCategory === c.id
                ? 'bg-kisan-primary text-white shadow-sm'
                : 'bg-white text-kisan-text border border-kisan-border hover:bg-gray-50'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Sorting & Filter Pill Bar */}
      <div className="flex items-center justify-between text-xs text-kisan-muted px-1">
        <button
          onClick={() => setOnlyOrganic(!onlyOrganic)}
          className={`px-3 py-1.5 rounded-full font-bold text-[11px] flex items-center space-x-1 border transition-all ${
            onlyOrganic
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
              : 'bg-white text-kisan-text border-kisan-border hover:border-emerald-500'
          }`}
        >
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>100% Organic Only</span>
        </button>

        <div className="flex items-center space-x-1.5">
          <span className="hidden sm:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-kisan-border rounded-xl px-2.5 py-1 text-xs font-semibold text-kisan-text focus:outline-none"
          >
            <option value="newest">Recently Harvested</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-kisan-primary"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-kisan-border">
          <p className="text-base font-bold text-kisan-dark">No crops found</p>
          <p className="text-xs text-kisan-muted mt-1">Try searching for other items or resetting filters.</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory(null);
              setOnlyOrganic(false);
            }}
            className="mt-4 px-4 py-2 bg-kisan-primary text-white text-xs font-bold rounded-xl"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onQuickAdd={handleQuickAdd}
              shoppingMode={shoppingMode}
            />
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* COMMUNITY CREATE / JOIN MODAL                            */}
      {/* ======================================================== */}
      {showCommunityModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-base text-kisan-dark">Community Buying</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCommunityModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs: Join vs Create */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCommunityModalTab('join')}
                className={`flex-1 py-2 font-bold rounded-lg transition-all ${
                  communityModalTab === 'join' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-500'
                }`}
              >
                Join Existing
              </button>
              <button
                type="button"
                onClick={() => setCommunityModalTab('create')}
                className={`flex-1 py-2 font-bold rounded-lg transition-all ${
                  communityModalTab === 'create' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-500'
                }`}
              >
                Create Community
              </button>
            </div>

            {communityModalTab === 'join' ? (
              <form onSubmit={handleJoinCommunity} className="space-y-3">
                <p className="text-gray-600 text-xs">
                  Enter the 6-character invitation code provided by your apartment or colony admin:
                </p>
                <div>
                  <label className="block font-bold text-kisan-text mb-1">
                    Community Code (e.g. GV2026X)
                  </label>
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    placeholder="Enter code"
                    className="w-full px-3.5 py-2.5 uppercase font-mono tracking-wider text-center text-sm font-bold border border-kisan-border rounded-xl focus:border-emerald-600 focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Join & Unlock Bulk Pricing
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreateCommunity} className="space-y-3">
                <p className="text-gray-600 text-xs">
                  Create a bulk buying group for your residential society, apartment, or gated community:
                </p>
                <div>
                  <label className="block font-bold text-kisan-text mb-1">Community / Society Name *</label>
                  <input
                    type="text"
                    value={newCommunityForm.name}
                    onChange={(e) => setNewCommunityForm({ ...newCommunityForm, name: e.target.value })}
                    placeholder="e.g. Green Valley Residents"
                    className="w-full px-3 py-2 border rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-kisan-text mb-1">Type</label>
                    <select
                      value={newCommunityForm.type}
                      onChange={(e) => setNewCommunityForm({ ...newCommunityForm, type: e.target.value })}
                      className="w-full px-2.5 py-2 border rounded-xl bg-white"
                    >
                      <option value="Apartment">Apartment</option>
                      <option value="Society">Gated Society</option>
                      <option value="Colony">Residential Colony</option>
                      <option value="Neighborhood">Neighborhood</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-kisan-text mb-1">Pincode</label>
                    <input
                      type="text"
                      value={newCommunityForm.pincode}
                      onChange={(e) => setNewCommunityForm({ ...newCommunityForm, pincode: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-kisan-text mb-1">Delivery Drop-Off Point *</label>
                  <input
                    type="text"
                    value={newCommunityForm.deliveryPoint}
                    onChange={(e) => setNewCommunityForm({ ...newCommunityForm, deliveryPoint: e.target.value })}
                    placeholder="e.g. Main Gate Security / Clubhouse Desk"
                    className="w-full px-3 py-2 border rounded-xl"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Create Community & Get Invite Code
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-base text-kisan-dark">Filter Produce</h3>
              <button onClick={() => setShowFilterModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-bold text-kisan-text mb-1">Price Range (₹)</label>
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
                className="flex-1 py-2.5 font-bold bg-kisan-primary text-white rounded-xl"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceHome;
