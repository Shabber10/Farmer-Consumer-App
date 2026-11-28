import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, MapPin, Phone, Search, SlidersHorizontal, X, Loader2, Check, Navigation, KeyRound, PackageCheck } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../../contexts/LanguageContext';
import { PageBackground } from '../../shared';
import bg7 from '../../assets/images/bg7_hd.jpg';
import api from '../../services/api';

const ORDER_STATUSES = ['All', 'Confirmed', 'Packed', 'Delivered', 'Completed', 'Cancelled'];

const MiniDeliveryMap = ({ lat, lng, address }) => {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || lat == null || lng == null) return;
    if (instanceRef.current) {
      instanceRef.current.remove();
      instanceRef.current = null;
    }
    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    L.circleMarker([lat, lng], {
      radius: 8,
      color: '#14532d',
      fillColor: '#16a34a',
      fillOpacity: 0.95,
      weight: 3,
    })
      .addTo(map)
      .bindPopup(address || 'Delivery Location');
    instanceRef.current = map;
    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }
    };
  }, [lat, lng, address]);

  if (lat == null || lng == null) return null;
  return <div ref={mapRef} className="w-full h-36 rounded-xl border border-emerald-200 overflow-hidden z-0" />;
};

const FarmerOrders = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [otpInputs, setOtpInputs] = useState({});
  const [otpErrors, setOtpErrors] = useState({});

  // Pull-to-refresh touch tracking
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartYRef = useRef(null);

  const fetchOrders = async (isPullRefresh = false) => {
    try {
      if (isPullRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const res = await api.get('/api/farmer/orders');
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setPullDistance(0);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleTouchStart = (e) => {
    if (window.scrollY <= 2) {
      touchStartYRef.current = e.touches[0].clientY;
    } else {
      touchStartYRef.current = null;
    }
  };

  const handleTouchMove = (e) => {
    if (touchStartYRef.current === null || window.scrollY > 2) return;
    const delta = e.touches[0].clientY - touchStartYRef.current;
    if (delta > 0) {
      setPullDistance(Math.min(72, delta * 0.45));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance >= 48 && !refreshing) {
      fetchOrders(true);
    } else {
      setPullDistance(0);
    }
    touchStartYRef.current = null;
  };

  const handleUpdateStatus = async (orderId, newStatus, otp = '') => {
    try {
      setUpdatingId(orderId);
      setOtpErrors((prev) => ({ ...prev, [orderId]: '' }));
      await api.patch(`/api/farmer/orders/${orderId}/status`, { status: newStatus, otp });
      await fetchOrders();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update order status';
      if (newStatus === 'Delivered' || newStatus === 'Completed') {
        setOtpErrors((prev) => ({ ...prev, [orderId]: msg }));
      } else {
        alert(msg);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = activeTab === 'All' || o.status === activeTab;
    if (!matchesStatus) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const orderNum = (o.order_number || `ORD-${o.id}`).toLowerCase();
    const buyer = (o.buyer_name || '').toLowerCase();
    const itemsText = (o.items || []).map((i) => i.product_name || '').join(' ').toLowerCase();
    return orderNum.includes(q) || buyer.includes(q) || itemsText.includes(q);
  });

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full max-w-6xl min-w-0 overflow-x-hidden mx-auto px-4 py-5 sm:py-8 space-y-4 pb-24 md:pb-8"
    >
      <PageBackground image={bg7} />

      {/* Pull-to-Refresh Indicator */}
      {(pullDistance > 8 || refreshing) && (
        <div
          className="flex items-center justify-center text-xs font-bold text-kisan-primary transition-all"
          style={{ height: refreshing ? 36 : pullDistance }}
        >
          <Loader2 className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing orders...' : pullDistance >= 48 ? 'Release to refresh' : 'Pull down to refresh'}</span>
        </div>
      )}

      {/* Header (no duplicate back or refresh button) */}
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold text-kisan-dark">{t('orders')}</h1>
        <p className="text-xs text-kisan-muted">Manage buyer orders, search, filter, and pull down to refresh</p>
      </div>

      {/* Search Bar + Filter Dropdown Button */}
      <div className="relative z-30 w-full bg-white rounded-2xl p-2.5 border border-kisan-border shadow-card flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order ID, buyer, or product..."
            className="w-full pl-9 pr-8 py-2.5 text-xs bg-gray-50 border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowFilterSheet((prev) => !prev)}
            className={`relative p-2.5 rounded-xl border transition-all ${
              activeTab !== 'All' || showFilterSheet
                ? 'bg-emerald-50 border-kisan-primary text-kisan-primary'
                : 'bg-white border-kisan-border text-kisan-dark hover:bg-gray-50'
            }`}
            title="Filter Orders by Status"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeTab !== 'All' && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-kisan-primary" />
            )}
          </button>

          {/* Dropdown List */}
          {showFilterSheet && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowFilterSheet(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-kisan-border shadow-xl z-40 py-1.5 overflow-hidden">
                <div className="px-3.5 py-2 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-kisan-muted">
                    Order Status
                  </span>
                  {activeTab !== 'All' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('All');
                        setShowFilterSheet(false);
                      }}
                      className="text-[11px] font-bold text-kisan-primary hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
                {ORDER_STATUSES.map((tab) => {
                  const count = tab === 'All' ? orders.length : orders.filter((o) => o.status === tab).length;
                  const isSelected = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab);
                        setShowFilterSheet(false);
                      }}
                      className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 text-kisan-primary font-extrabold'
                          : 'text-kisan-dark font-semibold hover:bg-gray-50'
                      }`}
                    >
                      <span>{tab}{count > 0 ? ` (${count})` : ''}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-kisan-primary" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Active Filter Pill when non-All is selected */}
      {activeTab !== 'All' && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-kisan-muted">Showing:</span>
          <button
            type="button"
            onClick={() => setActiveTab('All')}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold"
          >
            <span>{activeTab}</span>
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-kisan-primary"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="w-full bg-white rounded-3xl p-8 sm:p-10 text-center border border-kisan-border shadow-card space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-kisan-primary flex items-center justify-center mx-auto">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <p className="text-sm font-extrabold text-kisan-dark">No orders found</p>
          <p className="text-xs text-kisan-muted max-w-xs mx-auto">
            {activeTab === 'All'
              ? 'When consumers place direct orders for your produce, they will appear here.'
              : `No orders currently in "${activeTab}" status.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="w-full min-w-0 bg-white rounded-2xl border border-kisan-border shadow-card p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm sm:text-base text-kisan-dark">
                      {order.order_number || `ORD-${order.id}`}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ['Completed', 'Delivered'].includes(order.status) ? 'bg-emerald-100 text-emerald-800' :
                      order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      order.status === 'Packed' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-kisan-muted">
                    {order.order_date ? new Date(order.order_date).toLocaleString() : ''}
                  </span>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-kisan-muted block">Order Value</span>
                  <span className="text-base sm:text-lg font-black text-kisan-dark">
                    ₹{order.subtotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Buyer & Address Details + Map */}
              <div className="space-y-3 py-3 text-xs bg-kisan-bg/50 rounded-xl p-3 my-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-kisan-muted font-bold block mb-0.5">Buyer Information</span>
                    <p className="font-semibold text-kisan-dark kd-noun">{order.buyer_name}</p>
                    {order.buyer_phone && (
                      <p className="text-kisan-muted flex items-center mt-0.5">
                        <Phone className="w-3 h-3 mr-1" />
                        {order.buyer_phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="text-kisan-muted font-bold block mb-0.5">Delivery Location</span>
                    <p className="text-kisan-text flex items-start">
                      <MapPin className="w-3.5 h-3.5 text-kisan-primary mr-1 flex-shrink-0 mt-0.5" />
                      <span className="kd-noun">{order.delivery_address || 'Address provided at checkout'}</span>
                    </p>
                    <a
                      href={
                        order.delivery_latitude != null && order.delivery_longitude != null
                          ? `https://www.google.com/maps/dir/?api=1&destination=${order.delivery_latitude},${order.delivery_longitude}`
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address || 'Hyderabad')}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl shadow-xs"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Open in Google Maps</span>
                    </a>
                  </div>
                </div>
                {order.delivery_latitude != null && order.delivery_longitude != null && (
                  <MiniDeliveryMap
                    lat={order.delivery_latitude}
                    lng={order.delivery_longitude}
                    address={order.delivery_address}
                  />
                )}
              </div>

              {/* Ordered Items */}
              <div className="space-y-2 py-1">
                <span className="text-xs font-bold text-kisan-muted block">Items in this order:</span>
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-kisan-primary"></span>
                      <span className="font-semibold text-kisan-dark">{item.product_name}</span>
                      <span className="text-kisan-muted">({item.quantity} {item.unit})</span>
                    </div>
                    <span className="font-bold text-kisan-dark">₹{item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Status Action Buttons: Confirmed -> Pack Order -> Demo OTP Delivery */}
              <div className="mt-4 pt-3 border-t border-gray-100 space-y-2.5">
                {['Confirmed', 'Pending', 'Accepted'].includes(order.status) && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      Order Confirmed by System — Ready to Pack
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(order.id, 'Packed')}
                      disabled={updatingId === order.id}
                      className="px-4 py-2 text-xs font-bold bg-kisan-primary text-white rounded-xl hover:bg-kisan-dark shadow-sm flex items-center space-x-1.5"
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>{updatingId === order.id ? 'Packing...' : 'Pack Order'}</span>
                    </button>
                  </div>
                )}

                {['Packed', 'Preparing', 'Ready for Dispatch'].includes(order.status) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5 text-xs font-extrabold text-amber-950">
                        <KeyRound className="w-4 h-4 text-amber-700" />
                        <span>Demo Delivery OTP:</span>
                        <span className="px-2 py-0.5 rounded-lg bg-white border border-amber-300 font-mono text-sm tracking-widest text-kisan-dark">
                          {order.delivery_otp || '1234'}
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-800 font-semibold">
                        Enter OTP from customer to complete delivery
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter 4-digit OTP"
                        value={otpInputs[order.id] || ''}
                        onChange={(e) => setOtpInputs({ ...otpInputs, [order.id]: e.target.value })}
                        className="w-36 px-3 py-2 text-xs font-mono font-bold bg-white border border-amber-300 rounded-xl focus:outline-none focus:border-kisan-primary"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order.id, 'Delivered', otpInputs[order.id] || '')}
                        disabled={updatingId === order.id}
                        className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-sm"
                      >
                        {updatingId === order.id ? 'Verifying...' : 'Verify OTP & Mark Delivered'}
                      </button>
                    </div>
                    {otpErrors[order.id] && (
                      <p className="text-[11px] font-bold text-red-600">{otpErrors[order.id]}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FarmerOrders;
