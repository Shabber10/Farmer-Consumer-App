import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, CheckCircle2, ChevronDown } from 'lucide-react';
import { OrderTimeline } from '../../shared';
import DeliveryRatingModal from '../components/DeliveryRatingModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { BackButton } from '../../shared';
import api from '../../services/api';

const MyOrdersPage = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [ratingOrder, setRatingOrder] = useState(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState({});

  const toggleOrderExpand = (orderId) => {
    setExpandedOrderIds((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/orders');
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      setCancellingId(orderId);
      await api.post(`/api/orders/${orderId}/cancel`);
      await fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="w-full max-w-4xl min-w-0 overflow-x-hidden mx-auto px-3 sm:px-4 py-5 space-y-4 pb-24 md:pb-8">
      <div>
        <BackButton fallbackPath="/buyer" label="Back to Marketplace" className="mb-2" />
      </div>
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-extrabold text-kisan-dark">{t('myOrders')}</h1>
        <p className="text-xs text-kisan-muted">Tap any order to view status, timeline &amp; details</p>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-kisan-primary"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-kisan-border">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-kisan-text">No orders placed yet</p>
          <p className="text-xs text-kisan-muted mt-0.5">Explore the marketplace and order fresh agricultural produce directly from farmers!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isExpanded = !!expandedOrderIds[order.id];
            const firstItem = order.items?.[0];
            const extraCount = (order.items?.length || 0) - 1;
            const productSummary = firstItem
              ? `${firstItem.product_name}${extraCount > 0 ? ` + ${extraCount} more` : ''}`
              : order.order_number;

            return (
              <div key={order.id} className="bg-white rounded-3xl border border-kisan-border shadow-card overflow-hidden">
                {/* Compact Header: Product + Amount (click to drop down status & details) */}
                <button
                  type="button"
                  onClick={() => toggleOrderExpand(order.id)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-gray-50/60 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-sm sm:text-base text-kisan-dark truncate">
                      {productSummary}
                    </p>
                    <p className="text-[11px] text-kisan-muted mt-0.5">
                      {order.order_number} • {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2.5 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-base font-black text-kisan-primary block">₹{order.total_amount?.toFixed(2)}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${
                        order.order_status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        order.order_status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {order.order_status}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180 text-kisan-primary' : ''}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-5 pt-2 border-t border-gray-100 space-y-4">
                    {/* Progress Stepper Timeline */}
                    <div className="px-2 py-1">
                      <OrderTimeline currentStatus={order.order_status} />
                    </div>

                    {/* Items List */}
                    <div className="bg-kisan-bg/50 rounded-2xl p-3.5 space-y-2 text-xs">
                      <span className="font-bold text-kisan-dark block">Items ({order.items?.length || 0}):</span>
                      {order.items?.map((it) => (
                        <div key={it.id} className="flex items-center justify-between py-1 gap-2">
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-kisan-primary flex-shrink-0"></span>
                            <span className="font-semibold text-kisan-dark truncate">{it.product_name}</span>
                            <span className="text-kisan-muted flex-shrink-0">({it.quantity} {it.unit})</span>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <Link
                              to={`/buyer/product/${it.product_id}#reviews`}
                              className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200"
                            >
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              <span>Rate</span>
                            </Link>
                            <span className="font-bold text-kisan-dark">₹{it.subtotal.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer with Cancellation (if Pending) or Delivery Rating (if Completed) */}
                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-gray-100 text-xs gap-2">
                      <span className="text-kisan-muted">
                        Delivery to: <b className="text-kisan-text">{order.address?.street}, {order.address?.pincode}</b>
                      </span>

                      {order.order_status === 'Pending' && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancellingId === order.id}
                          className="text-xs font-bold text-kisan-danger hover:bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 transition-colors"
                        >
                          {cancellingId === order.id ? 'Cancelling...' : t('cancelOrder')}
                        </button>
                      )}

                      {order.order_status === 'Completed' && (
                        order.is_rated ? (
                          <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xl font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Rated {order.feedback?.overall_rating || 5}★</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => setRatingOrder(order)}
                            className="inline-flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-all"
                          >
                            <Star className="w-3.5 h-3.5 fill-white" />
                            <span>Rate Delivery &amp; Items</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {ratingOrder && (
        <DeliveryRatingModal
          order={ratingOrder}
          onClose={() => setRatingOrder(null)}
          onSubmitted={() => {
            setRatingOrder(null);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
};

export default MyOrdersPage;
