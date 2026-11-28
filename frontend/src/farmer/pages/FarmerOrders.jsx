import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, MapPin, Phone, Search, SlidersHorizontal, X, Loader2, Check } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { PageBackground } from '../../shared';
import bg7 from '../../assets/images/bg7_hd.jpg';
import api from '../../services/api';

const ORDER_STATUSES = ['All', 'Pending', 'Accepted', 'Preparing', 'Ready for Dispatch', 'Completed', 'Cancelled'];

const FarmerOrders = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

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

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      await api.patch(`/api/farmer/orders/${orderId}/status`, { status: newStatus });
      await fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update order status');
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
                      order.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                      order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
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

              {/* Buyer & Address Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 text-xs bg-kisan-bg/50 rounded-xl p-3 my-3">
                <div>
                  <span className="text-kisan-muted font-bold block mb-0.5">Buyer Information</span>
                  <p className="font-semibold text-kisan-dark">{order.buyer_name}</p>
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
                    <span>{order.delivery_address || 'Address provided at checkout'}</span>
                  </p>
                </div>
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

              {/* Status Action Buttons */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-end gap-2">
                {order.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'Cancelled')}
                      disabled={updatingId === order.id}
                      className="px-3 py-1.5 text-xs font-bold text-kisan-danger hover:bg-red-50 rounded-xl border border-red-200"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'Accepted')}
                      disabled={updatingId === order.id}
                      className="px-4 py-1.5 text-xs font-bold bg-kisan-primary text-white rounded-xl hover:bg-kisan-dark shadow-sm"
                    >
                      Accept Order
                    </button>
                  </>
                )}

                {order.status === 'Accepted' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                    disabled={updatingId === order.id}
                    className="px-4 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm"
                  >
                    Start Preparing Harvest
                  </button>
                )}

                {order.status === 'Preparing' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'Ready for Dispatch')}
                    disabled={updatingId === order.id}
                    className="px-4 py-1.5 text-xs font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-sm"
                  >
                    Mark Ready for Dispatch
                  </button>
                )}

                {order.status === 'Ready for Dispatch' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'Completed')}
                    disabled={updatingId === order.id}
                    className="px-4 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-sm"
                  >
                    Mark Delivered (Completed)
                  </button>
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
