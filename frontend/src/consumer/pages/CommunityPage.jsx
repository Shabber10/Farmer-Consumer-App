import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Building2, Copy, Check, Share2, Clock, Star,
  Plus, MapPin, ShoppingBag, Sparkles, ArrowRight
} from 'lucide-react';
import api, { getImageUrl } from '../../services/api';
import { BackButton, PageBackground } from '../../shared';
import bg6 from '../../assets/images/bg6_hd.jpg';
import CommunityJoinCreateModal from '../components/CommunityJoinCreateModal';

const formatCountdown = (expiresAtIso) => {
  if (!expiresAtIso) return null;
  const diffMs = new Date(expiresAtIso + (expiresAtIso.endsWith('Z') ? '' : 'Z')).getTime() - Date.now();
  if (diffMs <= 0) return 'Ended';
  const totalSec = Math.floor(diffMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}h : ${String(m).padStart(2, '0')}m : ${String(s).padStart(2, '0')}s`;
};

const CommunityPage = () => {
  const [data, setData] = useState({ community: null, membership: null, orders: [], members: [] });
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addQtyMap, setAddQtyMap] = useState({});
  const [submittingOrderId, setSubmittingOrderId] = useState(null);
  const [toast, setToast] = useState('');
  const [, setTick] = useState(0);

  const fetchMyCommunity = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/communities/my');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load community:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCommunity();
  }, []);

  // Tick every second ONLY when at least one active campaign timer exists
  useEffect(() => {
    const hasActiveTimer = (data.orders || []).some((o) => Boolean(o.expires_at));
    if (!hasActiveTimer) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [data.orders]);

  const handleCopyCode = () => {
    if (!data.community?.community_code) return;
    navigator.clipboard?.writeText(data.community.community_code);
    setCopied(true);
    setToast(`Copied community code ${data.community.community_code}`);
    setTimeout(() => {
      setCopied(false);
      setToast('');
    }, 2500);
  };

  const handleShare = () => {
    if (!data.community) return;
    const text = `Join our apartment group "${data.community.name}" on KisanDirect (Code: ${data.community.community_code}) to pool farm-fresh orders and unlock 30%–100% bulk discounts!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleContribute = async (orderId) => {
    const qty = Number(addQtyMap[orderId] || 1);
    if (qty <= 0) return;
    setSubmittingOrderId(orderId);
    try {
      const res = await api.post(`/api/communities/orders/${orderId}/contribute`, { quantity_kg: qty });
      setToast(res.data.message || 'Added to group order!');
      setTimeout(() => setToast(''), 2500);
      await fetchMyCommunity();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not add quantity.');
    } finally {
      setSubmittingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-kisan-primary" />
      </div>
    );
  }

  const { community, orders, members } = data;
  const visibleOrders = (orders || []).filter((order) => {
    const cd = order.expires_at ? formatCountdown(order.expires_at) : null;
    const isExpired = Boolean(order.expires_at && cd === 'Ended');
    const hasAtLeastOne = Number(order.participants_count || 0) > 0 || Number(order.community_qty_kg || 0) > 0;
    if (isExpired && !hasAtLeastOne) return false;
    return true;
  });

  return (
    <div className="relative w-full max-w-4xl min-w-0 overflow-x-hidden mx-auto px-3 sm:px-4 py-5 space-y-5 pb-24 md:pb-8">
      <PageBackground image={bg6} />
      <BackButton fallbackPath="/buyer" label="Marketplace" />

      {toast && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-950 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-lg flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {!community ? (
        <div className="bg-white rounded-3xl p-6 border border-kisan-border shadow-card text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-kisan-primary flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-extrabold text-kisan-dark">You haven&apos;t joined an Apartment Community yet</h1>
          <p className="text-xs text-kisan-muted max-w-md mx-auto">
            Join neighbors within 50m–500m of your apartment or create your own community group to pool orders and unlock wholesale farm prices.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowJoinModal(true)}
              className="px-6 py-3 bg-kisan-primary hover:bg-kisan-dark text-white text-xs font-bold rounded-2xl shadow-md"
            >
              Join Nearby or Create Community
            </button>
            <Link
              to="/buyer"
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-kisan-dark text-xs font-bold rounded-2xl"
            >
              Continue Shopping Solo
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Community Header Card */}
          <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 rounded-3xl p-5 text-white shadow-md space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 px-2.5 py-0.5 rounded-full text-emerald-200">
                  {community.community_type}
                </span>
                <h1 className="text-xl font-black mt-1.5 truncate">{community.name}</h1>
                <p className="text-xs text-emerald-100 flex items-center space-x-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{community.address_line} • Drop: {community.dropoff_point}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowJoinModal(true)}
                className="text-xs font-bold text-emerald-200 hover:text-white underline flex-shrink-0"
              >
                Switch
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/15">
              <div className="flex items-center space-x-3 text-xs font-bold">
                <span className="flex items-center space-x-1 bg-white/10 px-2.5 py-1 rounded-xl">
                  <Users className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{community.members_count} Members</span>
                </span>
                {community.farmer_review_count > 0 && (
                  <span className="flex items-center space-x-1 bg-white/10 px-2.5 py-1 rounded-xl text-amber-300">
                    <Star className="w-3.5 h-3.5 fill-amber-300" />
                    <span>{community.avg_farmer_rating} ({community.farmer_review_count} farmer ratings)</span>
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="bg-white/15 hover:bg-white/25 text-white text-xs font-mono font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{community.community_code}</span>
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Invite</span>
                </button>
              </div>
            </div>
          </div>

          {/* Community Group Orders Feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-kisan-dark">Community Orders & Live Deals</h2>
              <Link to="/buyer/cart" className="text-xs font-bold text-kisan-primary flex items-center space-x-1 hover:underline">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Push from Cart</span>
              </Link>
            </div>

            {visibleOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-6 border border-kisan-border text-center space-y-2">
                <p className="text-sm font-bold text-kisan-dark">No community orders yet</p>
                <p className="text-xs text-kisan-muted">
                  Add any farm product to your cart and tap &ldquo;Push to Community&rdquo; to start a group buy with your neighbors!
                </p>
                <Link
                  to="/buyer"
                  className="inline-flex items-center space-x-1.5 mt-2 px-4 py-2.5 bg-kisan-primary text-white text-xs font-bold rounded-xl"
                >
                  <span>Browse Produce</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              visibleOrders.map((order) => {
                const countdown = order.expires_at ? formatCountdown(order.expires_at) : null;
                const isExpired = Boolean(order.expires_at && countdown === 'Ended');
                return (
                  <div key={order.id} className="bg-white rounded-3xl p-4 border border-kisan-border shadow-card space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        {order.product_image && order.product_image !== '/placeholder-produce.jpg' ? (
                          <img
                            src={getImageUrl(order.product_image)}
                            alt={order.product_name}
                            className="w-14 h-14 rounded-2xl object-cover bg-gray-100 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-kisan-primary flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-extrabold text-kisan-dark truncate">{order.product_name}</h3>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-[11px] text-kisan-muted truncate">
                            {order.farm_name} • Shared by {order.initiated_by_name}
                          </p>
                          {order.title_note && (
                            <p className="text-[11px] text-gray-600 italic mt-0.5">&ldquo;{order.title_note}&rdquo;</p>
                          )}
                        </div>
                      </div>

                      {countdown && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold flex items-center space-x-1 flex-shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{countdown}</span>
                        </div>
                      )}
                    </div>

                    {/* 30% / 80% / 100% Bulk Discount Range Bar */}
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-950">
                          Pool Progress: {order.current_qty_kg} / {order.target_qty_kg} {order.unit} ({order.progress_pct}%)
                        </span>
                        <span className="font-black text-kisan-primary">
                          Current: ₹{order.effective_price}/{order.unit}
                        </span>
                      </div>

                      <div className="relative w-full h-3 bg-emerald-200/70 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-emerald-700 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, order.progress_pct)}%` }}
                        />
                      </div>

                      {/* Discount Slabs */}
                      <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold text-center pt-1">
                        <div className={`p-1.5 rounded-lg border ${order.progress_pct >= 30 ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-gray-600 border-gray-200'}`}>
                          30% Pool → ₹{order.tier_30_price}
                        </div>
                        <div className={`p-1.5 rounded-lg border ${order.progress_pct >= 80 ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-gray-600 border-gray-200'}`}>
                          80% Pool → ₹{order.tier_80_price}
                        </div>
                        <div className={`p-1.5 rounded-lg border ${order.progress_pct >= 100 ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-gray-600 border-gray-200'}`}>
                          100% Pool → ₹{order.tier_100_price}
                        </div>
                      </div>
                    </div>

                    {/* Contribute Qty Control */}
                    {['open_demand', 'campaign_active'].includes(order.status) && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] text-kisan-muted">
                          {order.participants_count} neighbor(s) joined • Community share: {order.community_qty_kg} {order.unit}
                        </span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            disabled={isExpired}
                            value={addQtyMap[order.id] ?? 2}
                            onChange={(e) => setAddQtyMap({ ...addQtyMap, [order.id]: e.target.value })}
                            className="w-16 px-2 py-1.5 text-xs font-bold text-center border border-kisan-border rounded-xl disabled:opacity-50"
                          />
                          <button
                            type="button"
                            disabled={submittingOrderId === order.id || isExpired}
                            onClick={() => handleContribute(order.id)}
                            className="px-3.5 py-2 bg-kisan-primary hover:bg-kisan-dark text-white text-xs font-bold rounded-xl flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>
                              {isExpired
                                ? 'Timer Ended'
                                : submittingOrderId === order.id
                                  ? 'Adding...'
                                  : `Add ${order.unit}`}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Members List (privacy-safe: names & roles only) */}
          <div className="bg-white rounded-3xl p-4 border border-kisan-border space-y-2">
            <h3 className="text-xs font-extrabold text-kisan-dark uppercase tracking-wider">
              Neighbors in {community.name} ({members.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <span key={m.id} className="text-xs font-semibold bg-emerald-50 text-emerald-900 px-3 py-1 rounded-full border border-emerald-200">
                  {m.full_name} {m.role === 'admin' ? '(Admin)' : ''}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      <CommunityJoinCreateModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={() => fetchMyCommunity()}
      />
    </div>
  );
};

export default CommunityPage;
