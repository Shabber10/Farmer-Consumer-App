import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Users, Star, CheckSquare, Square, Truck, Clock,
  List, Map as MapIcon, ShieldCheck, Phone, Sparkles, CheckCircle2, X
} from 'lucide-react';
import api from '../../services/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { PageBackground } from '../../shared';
import bg7 from '../../assets/images/bg7_hd.jpg';

const FarmerCommunities = () => {
  const [tab, setTab] = useState('discover'); // 'discover' | 'demand' | 'campaigns'
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [sortBy, setSortBy] = useState('distance');
  const [communities, setCommunities] = useState([]);
  const [farmerLoc, setFarmerLoc] = useState({ latitude: 17.4474, longitude: 78.3762 });
  const [demandRequests, setDemandRequests] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Launch Campaign Modal State
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    product_id: '',
    total_stock_kg: 100,
    min_bulk_kg: 50,
    duration_minutes: 60,
    base_price: 100,
    tier_30_price: 90,
    tier_80_price: 80,
    tier_100_price: 70,
    reservation_agreed: false,
    demand_order_id: null,
    mode: 'supply_campaign',
  });

  // Rate Community Modal State
  const [ratingTarget, setRatingTarget] = useState(null); // { community_id, community_name, community_order_id }
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    payment_score: 5,
    pickup_score: 5,
    communication_score: 5,
    comment: '',
  });

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const loadAll = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [commRes, demandRes, campRes, prodRes] = await Promise.all([
        api.get(`/api/campaigns/farmer/communities?sort_by=${sortBy}`),
        api.get('/api/campaigns/farmer/demand-requests'),
        api.get('/api/campaigns/farmer/list'),
        api.get('/api/farmer/products'),
      ]);
      setCommunities(commRes.data.communities || []);
      if (commRes.data.farmer_location) setFarmerLoc(commRes.data.farmer_location);
      setDemandRequests(demandRes.data.demand_requests || []);
      setCampaigns(campRes.data.campaigns || []);
      const prods = prodRes.data.products || [];
      setProducts(prods);
      const firstEligible = prods.find(
        (p) => p.is_available && p.available_quantity > 0 && p.selling_mode !== 'individual_only' && !p.bulk_disabled
      );
      if (firstEligible && !campaignForm.product_id) {
        setCampaignForm((prev) => ({
          ...prev,
          product_id: firstEligible.id,
          total_stock_kg: firstEligible.available_quantity || 100,
          min_bulk_kg: firstEligible.min_bulk_quantity || 50,
          base_price: firstEligible.price || 100,
          tier_30_price: Math.round((firstEligible.price || 100) * 0.9),
          tier_80_price: Math.round((firstEligible.price || 100) * 0.8),
          tier_100_price: firstEligible.bulk_price || Math.round((firstEligible.price || 100) * 0.7),
        }));
      }
    } catch (err) {
      console.error('Failed to load farmer community hub:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [sortBy, campaignForm.product_id]);

  useEffect(() => {
    loadAll(false);
  }, [sortBy]);

  useAutoRefresh(loadAll, 10000, !showCampaignModal && !ratingTarget);

  // Render Leaflet Map when viewMode === 'map'
  useEffect(() => {
    if (tab !== 'discover' || viewMode !== 'map' || !mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current).setView([farmerLoc.latitude, farmerLoc.longitude], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Farmer Pin
    L.circleMarker([farmerLoc.latitude, farmerLoc.longitude], {
      radius: 9,
      color: '#14532d',
      fillColor: '#16a34a',
      fillOpacity: 1,
    })
      .addTo(map)
      .bindPopup('<b>Your Farm Location</b>');

    // Community Pins
    communities.forEach((c) => {
      const isSelected = selectedIds.includes(c.id);
      const marker = L.circleMarker([c.latitude, c.longitude], {
        radius: 10,
        color: isSelected ? '#b45309' : '#0f766e',
        fillColor: isSelected ? '#f59e0b' : '#14b8a6',
        fillOpacity: 0.9,
      }).addTo(map);

      marker.bindPopup(
        `<b>${c.name}</b><br/>${c.distance_km} km away • ${c.members_count} members<br/>Farmer Rating: ${c.avg_farmer_rating || 'New'} ★`
      );
      marker.on('click', () => {
        setSelectedIds((prev) => (prev.includes(c.id) ? [] : [c.id]));
      });
    });

    mapInstanceRef.current = map;
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [tab, viewMode, communities, selectedIds, farmerLoc]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? [] : [id]));
  };

  const handleProductChange = (prodId) => {
    const p = products.find((item) => item.id === Number(prodId));
    if (!p) return;
    setCampaignForm((prev) => ({
      ...prev,
      product_id: p.id,
      total_stock_kg: p.available_quantity || 100,
      min_bulk_kg: p.min_bulk_quantity || 50,
      base_price: p.price || 100,
      tier_30_price: Math.round((p.price || 100) * 0.9),
      tier_80_price: Math.round((p.price || 100) * 0.8),
      tier_100_price: p.bulk_price || Math.round((p.price || 100) * 0.7),
    }));
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!campaignForm.reservation_agreed) {
      alert('Please confirm the Stock Reservation Agreement first.');
      return;
    }
    try {
      const res = await api.post('/api/campaigns/farmer/create', {
        ...campaignForm,
        target_community_ids: selectedIds,
      });
      setShowCampaignModal(false);
      setToast(res.data.message || 'Campaign launched!');
      setTimeout(() => setToast(''), 3000);
      setTab('campaigns');
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to launch campaign.');
    }
  };

  const handleFulfillDemand = (req) => {
    setSelectedIds([req.community_id]);
    const matchingProd = products.find((p) => p.name.toLowerCase() === req.product_name.toLowerCase()) || products[0];
    setCampaignForm((prev) => ({
      ...prev,
      product_id: matchingProd ? matchingProd.id : prev.product_id,
      total_stock_kg: Math.max(req.target_qty_kg || 50, matchingProd?.available_quantity || 50),
      min_bulk_kg: req.target_qty_kg || 50,
      demand_order_id: req.id,
      mode: 'demand_fulfill',
      reservation_agreed: false,
    }));
    setShowCampaignModal(true);
  };

  const handleUpdateCampaignStatus = async (campaignId, nextStatus) => {
    try {
      const res = await api.post(`/api/campaigns/farmer/${campaignId}/lock-and-deliver`, { status: nextStatus });
      setToast(res.data.message);
      setTimeout(() => setToast(''), 3000);
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update campaign status.');
    }
  };

  const handleSubmitCommunityReview = async (e) => {
    e.preventDefault();
    if (!ratingTarget) return;
    try {
      const res = await api.post(`/api/campaigns/farmer/communities/${ratingTarget.community_id}/review`, {
        ...reviewForm,
        community_order_id: ratingTarget.community_order_id,
      });
      setRatingTarget(null);
      setToast(res.data.message);
      setTimeout(() => setToast(''), 3000);
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save community rating.');
    }
  };

  const eligibleBulkProducts = products.filter(
    (p) => p.is_available && p.available_quantity > 0 && p.selling_mode !== 'individual_only' && !p.bulk_disabled
  );
  const apartmentsDisabled = eligibleBulkProducts.length === 0;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-kisan-primary" />
      </div>
    );
  }

  return (
    <div className="relative max-w-5xl mx-auto px-4 py-5 space-y-5 pb-24 md:pb-8">
      <PageBackground image={bg7} />

      {toast && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-950 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-lg flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-kisan-dark">Community Marketplace Hub</h1>
          <p className="text-xs text-kisan-muted">
            Discover apartments on map/list, reserve stock in a shared pool, fulfill demand, and rate communities after delivery.
          </p>
        </div>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setCampaignForm((prev) => ({ ...prev, demand_order_id: null, mode: 'supply_campaign', reservation_agreed: false }));
              setShowCampaignModal(true);
            }}
            className="px-4 py-2.5 bg-kisan-primary hover:bg-kisan-dark text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 self-start"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Reserve &amp; Launch ({selectedIds.length} selected)</span>
          </button>
        )}
      </div>

      {/* Main Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-kisan-border text-xs font-bold gap-1">
        <button
          type="button"
          onClick={() => setTab('discover')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${tab === 'discover' ? 'bg-kisan-primary text-white shadow-xs' : 'text-gray-600'}`}
        >
          Apartments ({communities.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('demand')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${tab === 'demand' ? 'bg-kisan-primary text-white shadow-xs' : 'text-gray-600'}`}
        >
          Demand Requests ({demandRequests.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('campaigns')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${tab === 'campaigns' ? 'bg-kisan-primary text-white shadow-xs' : 'text-gray-600'}`}
        >
          My Campaigns ({campaigns.length})
        </button>
      </div>

      {/* TAB 1: DISCOVER APARTMENTS */}
      {tab === 'discover' && (
        <div className="space-y-4">
          {apartmentsDisabled && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl p-3.5 text-xs font-semibold">
              Apartments selection is disabled because none of your active products have enough stock above their Min Bulk Target or are set to Bulk/Both selling mode.
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 ${viewMode === 'list' ? 'bg-white text-kisan-dark shadow-2xs' : 'text-gray-500'}`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 ${viewMode === 'map' ? 'bg-white text-kisan-dark shadow-2xs' : 'text-gray-500'}`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Map</span>
              </button>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-xs font-bold border border-kisan-border rounded-xl bg-white"
            >
              <option value="distance">Nearest First</option>
              <option value="rating">Highest Farmer Rating</option>
              <option value="members">Most Members</option>
            </select>
          </div>

          {viewMode === 'map' ? (
            <div className="bg-white rounded-3xl p-3 border border-kisan-border shadow-card space-y-2">
              <p className="text-[11px] text-kisan-muted px-1">
                Tap any apartment pin on the map to select/deselect it for your campaign.
              </p>
              <div ref={mapContainerRef} className="w-full h-80 rounded-2xl overflow-hidden z-0" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {communities.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => { if (!apartmentsDisabled) toggleSelect(c.id); }}
                    className={`bg-white rounded-2xl p-4 border-2 transition-all shadow-card space-y-2 ${
                      apartmentsDisabled
                        ? 'opacity-60 cursor-not-allowed border-kisan-border'
                        : isSelected
                          ? 'cursor-pointer border-kisan-primary bg-emerald-50/40'
                          : 'cursor-pointer border-kisan-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-extrabold text-kisan-dark kd-noun">{c.name}</h3>
                        <p className="text-[11px] text-kisan-muted kd-noun">{c.address_line}</p>
                      </div>
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-kisan-primary flex-shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-300 flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                      <span className="text-emerald-700 flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{c.distance_km} km</span>
                      </span>
                      <span className="text-gray-700 flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{c.members_count} members</span>
                      </span>
                      <span className="text-amber-600 flex items-center space-x-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{c.farmer_review_count > 0 ? `${c.avg_farmer_rating}/5 (${c.farmer_review_count})` : 'No ratings yet'}</span>
                      </span>
                    </div>

                    {c.recent_reviews?.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-2 text-[11px] text-gray-600">
                        &ldquo;{c.recent_reviews[0].comment}&rdquo; — <span className="font-bold">{c.recent_reviews[0].farm_name}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEMAND REQUESTS */}
      {tab === 'demand' && (
        <div className="space-y-3">
          {demandRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-kisan-border text-xs text-kisan-muted">
              No open community demand requests right now.
            </div>
          ) : (
            demandRequests.map((req) => (
              <div key={req.id} className="bg-white rounded-2xl p-4 border border-kisan-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-extrabold text-kisan-dark">{req.product_name}</h3>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      {req.current_qty_kg} kg requested
                    </span>
                  </div>
                  <p className="text-xs text-kisan-muted">
                    {req.community_name} • {req.distance_km ?? '?'} km away • {req.participants_count} members
                  </p>
                </div>
                <button
                  type="button"
                  disabled={apartmentsDisabled}
                  onClick={() => handleFulfillDemand(req)}
                  className="px-4 py-2 bg-kisan-primary hover:bg-kisan-dark text-white text-xs font-bold rounded-xl self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {apartmentsDisabled ? 'No Eligible Bulk Stock' : 'Fulfill with Reserved Stock'}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: ACTIVE CAMPAIGNS & CONSOLIDATED DELIVERY SHEET */}
      {tab === 'campaigns' && (
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-kisan-border text-xs text-kisan-muted">
              No active campaigns yet. Select apartments in the Apartments tab to launch your first reserved campaign!
            </div>
          ) : (
            campaigns.map((camp) => (
              <div key={camp.id} className="bg-white rounded-3xl p-4 sm:p-5 border border-kisan-border shadow-card space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {camp.status.replace(/_/g, ' ')}
                    </span>
                    <h3 className="text-base font-extrabold text-kisan-dark mt-1">
                      {camp.product_name} — {camp.allocated_kg} / {camp.total_stock_kg} {camp.unit} allocated ({camp.progress_pct}%)
                    </h3>
                    <p className="text-[11px] text-kisan-muted">
                      Active Tier Price: ₹{camp.current_price}/{camp.unit} (30%: ₹{camp.tier_30_price} | 80%: ₹{camp.tier_80_price} | 100%: ₹{camp.tier_100_price})
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {camp.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateCampaignStatus(camp.id, 'locked')}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl"
                      >
                        Lock &amp; Unlock Addresses
                      </button>
                    )}
                    {camp.status === 'locked' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateCampaignStatus(camp.id, 'out_for_delivery')}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Start Delivery</span>
                      </button>
                    )}
                    {camp.status === 'out_for_delivery' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateCampaignStatus(camp.id, 'completed')}
                        className="px-3.5 py-2 bg-kisan-primary hover:bg-kisan-dark text-white text-xs font-bold rounded-xl flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Delivered</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Per-Community Delivery Breakdown */}
                <div className="space-y-2">
                  {(camp.community_orders || []).map((co) => (
                    <div key={co.id} className="bg-gray-50 rounded-2xl p-3 border border-gray-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-kisan-dark">{co.community_name}</span>
                          <span className="text-kisan-muted ml-2">Drop: {co.community_dropoff}</span>
                        </div>
                        <span className="font-black text-kisan-primary">
                          {co.community_qty_kg} {co.unit} ({co.participants_count} members)
                        </span>
                      </div>

                      {/* Delivery Contacts revealed ONLY after lock */}
                      {['locked', 'out_for_delivery', 'completed'].includes(camp.status) && co.items?.length > 0 && (
                        <div className="pt-2 border-t border-gray-200 space-y-1">
                          <p className="text-[10px] font-bold uppercase text-gray-500">Delivery Sheet (Unlocked)</p>
                          {co.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-[11px] bg-white px-2.5 py-1.5 rounded-lg border">
                              <span className="font-semibold text-kisan-dark">
                                {item.member_name} • {item.quantity_kg} {co.unit} • {item.delivery_landmark || co.community_dropoff}
                              </span>
                              {item.contact_phone && (
                                <a href={`tel:${item.contact_phone}`} className="text-kisan-primary font-bold flex items-center space-x-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{item.contact_phone}</span>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {camp.status === 'completed' && (
                        <button
                          type="button"
                          onClick={() => setRatingTarget({ community_id: co.community_id, community_name: co.community_name, community_order_id: co.id })}
                          className="text-xs font-bold text-amber-700 hover:underline flex items-center space-x-1"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>Rate {co.community_name}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Launch Campaign & Stock Reservation Agreement Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateCampaign} className="bg-white w-full max-w-lg rounded-3xl p-5 space-y-3.5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-base font-extrabold text-kisan-dark">Launch Reserved Bulk Campaign</h3>
              <button type="button" onClick={() => setShowCampaignModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            <div>
              <label className="block text-xs font-bold text-kisan-dark mb-1">Select Produce *</label>
              <select
                value={campaignForm.product_id}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded-xl bg-white"
              >
                {products.map((p) => {
                  const isOut = !p.is_available || p.available_quantity <= 0;
                  const isIndiv = p.selling_mode === 'individual_only';
                  const isBelowMin = p.bulk_disabled || p.available_quantity < (p.min_bulk_quantity || 50);
                  const disabled = isOut || isIndiv || isBelowMin;
                  const reason = isOut
                    ? 'Out of Stock — Unavailable'
                    : isIndiv
                      ? 'Individual Only — Apartments Disabled'
                      : isBelowMin
                        ? 'Below Min Bulk — Apartments Disabled'
                        : `Avail: ${p.available_quantity} ${p.unit} • Min Bulk: ${p.min_bulk_quantity} • ₹${p.price}`;
                  return (
                    <option key={p.id} value={p.id} disabled={disabled}>
                      {p.name} ({reason})
                    </option>
                  );
                })}
              </select>
              {eligibleBulkProducts.length === 0 && (
                <p className="text-[11px] text-amber-700 font-semibold mt-1">
                  No eligible products (remaining stock is below Min Bulk Target, out of stock, or set to Individual Only).
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold mb-1">Reserved Stock (kg)</label>
                <input
                  type="number"
                  required
                  value={campaignForm.total_stock_kg}
                  onChange={(e) => setCampaignForm({ ...campaignForm, total_stock_kg: Number(e.target.value) })}
                  className="w-full px-2.5 py-2 text-xs border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1">Min Bulk (kg)</label>
                <input
                  type="number"
                  required
                  value={campaignForm.min_bulk_kg}
                  onChange={(e) => setCampaignForm({ ...campaignForm, min_bulk_kg: Number(e.target.value) })}
                  className="w-full px-2.5 py-2 text-xs border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1">Timer (1–2 hrs)</label>
                <select
                  value={campaignForm.duration_minutes}
                  onChange={(e) => setCampaignForm({ ...campaignForm, duration_minutes: Number(e.target.value) })}
                  className="w-full px-2 py-2 text-xs border rounded-xl bg-white"
                >
                  <option value={60}>1 Hour (60m)</option>
                  <option value={90}>1.5 Hours (90m)</option>
                  <option value={120}>2 Hours (120m)</option>
                </select>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 space-y-2">
              <p className="text-[11px] font-extrabold text-emerald-950">Bulk Discount Slabs (₹ per unit)</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold">30% Pool ₹</label>
                  <input type="number" required value={campaignForm.tier_30_price} onChange={(e) => setCampaignForm({ ...campaignForm, tier_30_price: Number(e.target.value) })} className="w-full px-2 py-1.5 text-xs bg-white border rounded-lg" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold">80% Pool ₹</label>
                  <input type="number" required value={campaignForm.tier_80_price} onChange={(e) => setCampaignForm({ ...campaignForm, tier_80_price: Number(e.target.value) })} className="w-full px-2 py-1.5 text-xs bg-white border rounded-lg" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold">100% Pool ₹</label>
                  <input type="number" required value={campaignForm.tier_100_price} onChange={(e) => setCampaignForm({ ...campaignForm, tier_100_price: Number(e.target.value) })} className="w-full px-2 py-1.5 text-xs bg-white border rounded-lg" />
                </div>
              </div>
            </div>

            <label className="flex items-start space-x-2.5 bg-amber-50 border border-amber-200 rounded-2xl p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={campaignForm.reservation_agreed}
                onChange={(e) => setCampaignForm({ ...campaignForm, reservation_agreed: e.target.checked })}
                className="mt-0.5 rounded"
              />
              <span className="text-[11px] font-bold text-amber-950 leading-relaxed">
                Stock Reservation Agreement: I confirm I will reserve {campaignForm.total_stock_kg} kg exclusively for the selected {selectedIds.length} community/communities for {campaignForm.duration_minutes} minutes and will NOT sell it elsewhere until the timer ends.
              </span>
            </label>

            <button
              type="submit"
              className="w-full py-3 bg-kisan-primary hover:bg-kisan-dark text-white text-xs font-bold rounded-xl shadow-md"
            >
              Confirm Agreement &amp; Start Campaign Timer
            </button>
          </form>
        </div>
      )}

      {/* Rate Community Modal */}
      {ratingTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSubmitCommunityReview} className="bg-white w-full max-w-md rounded-3xl p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-base font-extrabold text-kisan-dark">Rate {ratingTarget.community_name}</h3>
              <button type="button" onClick={() => setRatingTarget(null)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: s })}>
                  <Star className={`w-7 h-7 ${s <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              required
              placeholder="How was payment coordination, pickup readiness, and communication at this apartment?"
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              className="w-full px-3 py-2 text-xs border rounded-xl"
            />
            <button type="submit" className="w-full py-2.5 bg-kisan-primary text-white text-xs font-bold rounded-xl">
              Submit Verified Community Rating
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FarmerCommunities;
