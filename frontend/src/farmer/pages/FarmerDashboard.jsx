import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, ShoppingBag, Layers, Clock, Plus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { PageBackground } from '../../shared';
import bg7 from '../../assets/images/bg7_hd.jpg';
import api from '../../services/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';

const FarmerDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get('/api/farmer/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load farmer dashboard:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(false);
  }, [fetchDashboard]);

  useAutoRefresh(fetchDashboard, 10000);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-kisan-primary"></div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    total_earnings: 0,
    pending_earnings: 0,
    total_orders: 0,
    pending_orders: 0,
    active_products: 0,
    total_products: 0
  };

  return (
    <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-5 space-y-4 pb-20 md:pb-8">
      <PageBackground image={bg7} />
      {/* Top Row: Compact Welcome + Community Hub side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-8 bg-gradient-to-r from-kisan-primary to-kisan-dark rounded-2xl p-4 sm:p-5 text-white shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden">
          <img
            src={bg7}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay pointer-events-none"
          />
          <div className="relative z-10 min-w-0">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-200 bg-white/10 px-2.5 py-0.5 rounded-full kd-noun">
              {data?.farmer?.farm_name || 'Farmer Portal'}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold mt-1.5">
              Welcome, <span className="kd-noun">{user?.full_name || 'Kisan'}</span>!
            </h1>
            <p className="text-xs text-emerald-100 mt-0.5 max-w-lg">
              Manage your harvest inventory, fulfill direct orders, and track earnings without middlemen.
            </p>
          </div>

          <Link
            to="/farmer/add-product"
            className="relative z-10 bg-white text-kisan-primary hover:bg-emerald-50 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center justify-center space-x-1.5 transition-all self-start sm:self-auto flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addProduct')}</span>
          </Link>
        </div>

        {/* Community Discovery & Bulk Campaigns Shortcut */}
        <Link
          to="/farmer/communities"
          className="lg:col-span-4 bg-white rounded-2xl p-4 border-2 border-emerald-200 hover:border-kisan-primary shadow-card transition-all flex flex-col justify-between gap-2"
        >
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Community Hub
            </span>
            <h3 className="text-sm font-extrabold text-kisan-dark mt-1.5">
              Nearby Apartments &amp; Bulk Campaigns
            </h3>
            <p className="text-[11px] text-kisan-muted mt-0.5 line-clamp-2">
              View community demand, ratings, and lock consolidated bulk orders.
            </p>
          </div>
          <span className="inline-flex items-center space-x-1 text-xs font-extrabold text-kisan-primary">
            <span>Open Apartments Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>

      {/* Compact Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-kisan-border shadow-card">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-kisan-muted font-medium">{t('totalEarnings')}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-kisan-primary flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-kisan-dark">
            ₹{metrics.total_earnings.toFixed(2)}
          </h3>
          <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
            + ₹{metrics.pending_earnings.toFixed(2)} pending
          </span>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-kisan-border shadow-card">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-kisan-muted font-medium">{t('totalOrders')}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-kisan-dark">
            {metrics.total_orders}
          </h3>
          <span className="text-[11px] text-blue-700 font-semibold block mt-0.5">
            Lifetime orders
          </span>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-kisan-border shadow-card">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-kisan-muted font-medium">{t('pendingOrders')}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-kisan-dark">
            {metrics.pending_orders}
          </h3>
          <span className="text-[11px] text-amber-700 font-semibold block mt-0.5">
            Requires action
          </span>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-kisan-border shadow-card">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-kisan-muted font-medium">{t('activeProducts')}</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-kisan-dark">
            {metrics.active_products}
          </h3>
          <span className="text-[11px] text-purple-700 font-semibold block mt-0.5">
            In live marketplace
          </span>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-kisan-border shadow-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-kisan-dark">{t('recentOrders')}</h2>
            <p className="text-xs text-kisan-muted">Buyer orders for your harvested items</p>
          </div>
          <Link
            to="/farmer/orders"
            className="text-xs font-bold text-kisan-primary hover:underline flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {(!data?.recent_orders || data.recent_orders.length === 0) ? (
          <div className="text-center py-10">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-kisan-text">{t('noOrdersYet')}</p>
            <p className="text-xs text-kisan-muted mt-0.5">When buyers purchase your products, they appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.recent_orders.map((order) => (
              <div key={order.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-kisan-dark">
                      {order.order_number || `ORD-${order.id}`}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ['Completed', 'Delivered'].includes(order.status) ? 'bg-emerald-100 text-emerald-800' :
                      order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-kisan-muted mt-0.5">
                    Buyer: <span className="font-medium text-kisan-text kd-noun">{order.buyer_name}</span> • {order.items?.length || 0} items
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-4">
                  <span className="text-base font-extrabold text-kisan-dark">
                    ₹{order.subtotal.toFixed(2)}
                  </span>
                  <Link
                    to="/farmer/orders"
                    className="text-xs font-semibold px-3 py-1.5 bg-kisan-light text-kisan-dark rounded-xl border border-kisan-primary/30 hover:bg-kisan-primary hover:text-white transition-colors"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerDashboard;
