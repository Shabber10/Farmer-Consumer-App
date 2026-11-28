import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { MapPin, CreditCard, Banknote, Smartphone, Check, Plus, AlertCircle, ArrowLeft } from 'lucide-react';
import { PINCODE_MANDALS_MAP } from '../../data/pincodeLocations';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { BackButton, PageBackground, RapidoMapPicker } from '../../shared';
import bg8 from '../../assets/images/bg8_hd.jpg';
import api from '../../services/api';
import { getLocalizedProductName, getLocalizedUnit } from '../../utils/productLocalization';

const CheckoutPage = () => {
  const { cart, fetchCart } = useCart();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [razorpayModal, setRazorpayModal] = useState(null);
  const [verifyingRp, setVerifyingRp] = useState(false);

  // Add Address Form
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [newAddr, setNewAddr] = useState({
    door_number: '',
    street: 'HITEC City & Madhapur',
    village: 'Madhapur',
    district: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    landmark: '',
    latitude: 17.4474,
    longitude: 78.3762,
  });

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get('/api/addresses');
        const list = res.data.addresses || [];
        setAddresses(list);
        const def = list.find(a => a.is_default) || list[0];
        if (def) setSelectedAddressId(def.id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/addresses', newAddr);
      setAddresses(prev => [res.data.address, ...prev]);
      setSelectedAddressId(res.data.address.id);
      setShowAddAddr(false);
      setNewAddr({ door_number: '', street: '', village: '', district: '', state: 'Telangana', pincode: '', landmark: '' });
    } catch (err) {
      alert('Failed to save address');
    }
  };

  const handlePlaceOrder = async () => {
    setError('');
    if (!selectedAddressId) {
      setError('Please select or add a delivery address');
      return;
    }

    try {
      setPlacing(true);
      const res = await api.post('/api/orders', {
        address_id: selectedAddressId,
        payment_method: paymentMethod
      });
      const createdOrder = res.data.order;

      if (paymentMethod === 'RAZORPAY') {
        const payRes = await api.post('/api/payments/create', {
          order_id: createdOrder.id,
          payment_method: 'RAZORPAY',
        });
        const payData = payRes.data;

        const useWebRazorpay =
          !Capacitor.isNativePlatform() &&
          payData.mode === 'live_razorpay' &&
          typeof window !== 'undefined' &&
          window.Razorpay;

        if (useWebRazorpay) {
          try {
            const rp = new window.Razorpay({
              key: payData.key_id,
              amount: payData.amount_paise,
              currency: payData.currency || 'INR',
              name: 'KisanDirect',
              description: `Fresh Produce Order ${payData.order_number}`,
              order_id: payData.razorpay_order_id,
              handler: async (rpResponse) => {
                try {
                  const vRes = await api.post('/api/payments/verify', {
                    order_id: createdOrder.id,
                    razorpay_order_id: rpResponse.razorpay_order_id,
                    razorpay_payment_id: rpResponse.razorpay_payment_id,
                    razorpay_signature: rpResponse.razorpay_signature,
                  });
                  await fetchCart();
                  navigate('/buyer/order-success', { state: { order: vRes.data.order } });
                } catch (vErr) {
                  setError(vErr.response?.data?.error || 'Razorpay payment verification failed');
                }
              },
              theme: { color: '#246B45' },
              modal: {
                ondismiss: async () => {
                  await api.post('/api/payments/cancel', { order_id: createdOrder.id }).catch(() => {});
                  setError('Payment cancelled. Your items are still in your cart.');
                },
              },
            });
            rp.on('payment.failed', async (resp) => {
              const reason = resp?.error?.description || 'Razorpay payment failed';
              await api.post('/api/payments/fail', { order_id: createdOrder.id, reason }).catch(() => {});
              setError(`${reason}. Your items are still in your cart.`);
            });
            rp.open();
            return;
          } catch {
            // Fall back to in-app Razorpay modal if WebView blocks popup
          }
        }

        // In-App Razorpay Test Checkout Modal (works in Android WebView & Sandbox with Success/Fail options)
        setRazorpayModal({ payData, order: createdOrder, channel: 'UPI' });
        return;
      }

      await fetchCart();
      navigate('/buyer/order-success', { state: { order: createdOrder } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  const handleFailSandboxRazorpay = async () => {
    if (!razorpayModal) return;
    try {
      setVerifyingRp(true);
      const { payData, order } = razorpayModal;
      await api.post('/api/payments/fail', {
        order_id: order.id,
        reason: `Simulated ${razorpayModal.channel} payment failure`,
      });
      setRazorpayModal(null);
      setError(`Payment Failed for Order ${payData.order_number}. You can retry from My Orders.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not record payment failure');
    } finally {
      setVerifyingRp(false);
    }
  };

  const handleConfirmSandboxRazorpay = async () => {
    if (!razorpayModal) return;
    try {
      setVerifyingRp(true);
      const { payData, order } = razorpayModal;
      const vRes = await api.post('/api/payments/verify', {
        order_id: order.id,
        razorpay_order_id: payData.razorpay_order_id,
        razorpay_payment_id: `pay_rp_${Date.now()}`,
        razorpay_signature: 'valid_sandbox_signature',
      });
      await fetchCart();
      setRazorpayModal(null);
      navigate('/buyer/order-success', { state: { order: vRes.data.order } });
    } catch (err) {
      setError(err.response?.data?.error || 'Razorpay verification failed');
    } finally {
      setVerifyingRp(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-kisan-primary"></div>
      </div>
    );
  }

  if ((!cart?.items || cart.items.length === 0) && !razorpayModal && !placing) {
    return (
      <div className="relative max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <PageBackground image={bg8} />
        <h2 className="text-xl font-bold text-kisan-dark">Your cart is empty</h2>
        <p className="text-xs text-kisan-muted">Add fresh produce to your cart before proceeding to checkout.</p>
        <button
          type="button"
          onClick={() => navigate('/buyer')}
          className="inline-flex items-center space-x-2 bg-kisan-primary text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-sm hover:bg-kisan-dark"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Explore Farm Marketplace</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6 pb-24 md:pb-8">
      <PageBackground image={bg8} />
      <BackButton fallbackPath="/buyer/cart" label="Back to Cart" />

      <div>
        <h1 className="text-2xl font-extrabold text-kisan-dark">{t('checkout')}</h1>
        <p className="text-xs text-kisan-muted">Confirm delivery destination and payment method</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-kisan-danger">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Address Selection */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-kisan-border shadow-card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h2 className="font-bold text-sm sm:text-base text-kisan-dark flex items-center">
            <MapPin className="w-4 h-4 text-kisan-primary mr-1.5" />
            <span>{t('deliveryAddress')}</span>
          </h2>
          <button
            type="button"
            onClick={() => setShowAddAddr(!showAddAddr)}
            className="text-xs font-bold text-kisan-primary hover:underline flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Address</span>
          </button>
        </div>

        {/* Existing Addresses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              onClick={() => setSelectedAddressId(addr.id)}
              className={`
                cursor-pointer p-3.5 rounded-2xl border-2 transition-all relative text-xs
                ${selectedAddressId === addr.id
                  ? 'border-kisan-primary bg-kisan-light/30 shadow-sm'
                  : 'border-kisan-border hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-kisan-dark">{addr.door_number}</span>
                {selectedAddressId === addr.id && (
                  <Check className="w-4 h-4 text-kisan-primary font-bold" />
                )}
              </div>
              <p className="text-kisan-text">{addr.street}</p>
              <p className="text-kisan-muted">{addr.village}, {addr.district} - {addr.pincode}</p>
            </div>
          ))}
        </div>

        {/* Add Address Form Toggle (Map Auto-Detect + Door/Landmark Only) */}
        {showAddAddr && (
          <form onSubmit={handleCreateAddress} className="mt-3 p-4 bg-gray-50 rounded-2xl border space-y-3 text-xs">
            <h4 className="font-bold text-kisan-dark">Pin Delivery Location (Auto-Detects Address)</h4>
            <RapidoMapPicker
              initialLat={newAddr.latitude}
              initialLng={newAddr.longitude}
              initialTitle={newAddr.street || 'Delivery Location'}
              initialAddress={[newAddr.village, newAddr.district, newAddr.state, newAddr.pincode].filter(Boolean).join(', ')}
              initialCity={newAddr.district || 'Hyderabad'}
              initialPincode={newAddr.pincode || '500081'}
              pinLabel="Delivery Pin"
              selectedLabel="Auto-Detected Address"
              mapHeight="210px"
              onLocationChange={(loc) => {
                setNewAddr((prev) => ({
                  ...prev,
                  latitude: loc.lat,
                  longitude: loc.lng,
                  street: loc.title || loc.address || prev.street,
                  village: loc.village || loc.title || prev.village,
                  district: loc.district || prev.district,
                  state: loc.state || prev.state || 'Telangana',
                  pincode: loc.pincode || prev.pincode || '500001',
                }));
              }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Door / Flat No. *"
                value={newAddr.door_number}
                onChange={(e) => setNewAddr({ ...newAddr, door_number: e.target.value })}
                className="p-2.5 border rounded-xl bg-white"
                required
              />
              <input
                type="text"
                placeholder="Landmark (e.g. Near Main Gate) *"
                value={newAddr.landmark}
                onChange={(e) => setNewAddr({ ...newAddr, landmark: e.target.value })}
                className="p-2.5 border rounded-xl bg-white"
                required
              />
            </div>
            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddAddr(false)}
                className="px-3 py-1.5 border rounded-xl font-bold text-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-kisan-primary text-white rounded-xl font-bold"
              >
                Save &amp; Select
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. Payment Options */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-kisan-border shadow-card space-y-3">
        <h2 className="font-bold text-sm sm:text-base text-kisan-dark pb-2 border-b border-gray-100">
          {t('paymentMethod')}
        </h2>

        <div className="space-y-2.5">
          <label className={`
            flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all
            ${paymentMethod === 'COD' ? 'border-kisan-primary bg-kisan-light/30' : 'border-kisan-border'}
          `}>
            <div className="flex items-center space-x-3">
              <Banknote className="w-5 h-5 text-emerald-700" />
              <div>
                <span className="font-bold text-xs text-kisan-dark block">{t('cashOnDelivery')}</span>
                <span className="text-[11px] text-kisan-muted">Pay in cash when fresh produce arrives at your doorstep</span>
              </div>
            </div>
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === 'COD'}
              onChange={() => setPaymentMethod('COD')}
              className="text-kisan-primary focus:ring-kisan-primary"
            />
          </label>

          <label className={`
            flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all
            ${paymentMethod === 'UPI' ? 'border-kisan-primary bg-kisan-light/30' : 'border-kisan-border'}
          `}>
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-blue-700" />
              <div>
                <span className="font-bold text-xs text-kisan-dark block">{t('upiDirect')}</span>
                <span className="text-[11px] text-kisan-muted">Direct Google Pay, PhonePe, Paytm QR transfer</span>
              </div>
            </div>
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === 'UPI'}
              onChange={() => setPaymentMethod('UPI')}
              className="text-kisan-primary focus:ring-kisan-primary"
            />
          </label>

          <label className={`
            flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all
            ${paymentMethod === 'RAZORPAY' ? 'border-kisan-primary bg-kisan-light/30' : 'border-kisan-border'}
          `}>
            <div className="flex items-center space-x-3">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <div>
                <span className="font-bold text-xs text-kisan-dark block">Razorpay (UPI, Cards, Netbanking)</span>
                <span className="text-[11px] text-kisan-muted">Secure instant checkout powered by Razorpay</span>
              </div>
            </div>
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === 'RAZORPAY'}
              onChange={() => setPaymentMethod('RAZORPAY')}
              className="text-kisan-primary focus:ring-kisan-primary"
            />
          </label>
        </div>
      </div>

      {/* 3. Items & Full Delivery Breakdown */}
      <div className="bg-white rounded-3xl p-5 border border-kisan-border shadow-card space-y-3">
        <h3 className="font-bold text-sm text-kisan-dark">Order &amp; Delivery Breakdown ({cart.item_count} items)</h3>
        {(() => {
          const selAddr = addresses.find((a) => a.id === selectedAddressId);
          const calcDistKm = (lat1, lon1, lat2, lon2) => {
            if ([lat1, lon1, lat2, lon2].some((v) => v === null || v === undefined)) return null;
            const R = 6371;
            const dLat = ((lat2 - lat1) * Math.PI) / 180;
            const dLon = ((lon2 - lon1) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) ** 2 +
              Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          };

          return (
            <>
              <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
                {cart.items?.map((it) => {
                  const p = it.product || {};
                  const distKm = calcDistKm(p.farmer_latitude, p.farmer_longitude, selAddr?.latitude, selAddr?.longitude);
                  const ratePerKm = Number(p.delivery_price_per_km ?? 0);
                  return (
                    <div key={it.id} className="py-2.5 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-kisan-dark font-bold">
                          {getLocalizedProductName(p.name, language)} ({it.quantity} {getLocalizedUnit(p.unit, language)} × ₹{Number(p.price || it.unit_price || 0).toFixed(2)})
                        </span>
                        <span className="font-extrabold text-kisan-dark">₹{Number(it.subtotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-kisan-muted gap-1">
                        <span>Farmer: <b className="text-kisan-text kd-noun">{p.farm_name || p.farmer_name || 'Local Farm'}</b> (<span className="kd-noun">{p.location}</span>)</span>
                        <span>
                          {distKm !== null ? `${distKm.toFixed(1)} km away` : `Max ≤${p.max_delivery_km ?? 15} km`} • ₹{ratePerKm}/km
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-kisan-muted">
                  <span>Order Price (Produce Subtotal)</span>
                  <span className="font-bold text-kisan-dark">₹{Number(cart.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-kisan-muted">
                  <span>Delivery Charge {Number(cart.subtotal || 0) >= 500 ? '(Free ≥ ₹500)' : '(Standard Flat Fee)'}</span>
                  <span className="font-bold text-emerald-700">
                    {Number(cart.delivery_fee || 0) === 0 ? 'FREE (₹0.00)' : `₹${Number(cart.delivery_fee || 0).toFixed(2)}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-sm font-black text-kisan-dark">
                  <span>{t('totalAmount')}</span>
                  <span className="text-lg text-kisan-primary">₹{Number(cart.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Place Order CTA */}
      <button
        type="button"
        onClick={handlePlaceOrder}
        disabled={placing || Boolean(razorpayModal)}
        className="w-full bg-kisan-primary text-white py-4 rounded-2xl font-bold text-base shadow-card hover:bg-kisan-dark transition-all disabled:opacity-50"
      >
        {placing ? 'Confirming Harvest Order...' : `${paymentMethod === 'RAZORPAY' ? 'Pay with Razorpay' : t('placeOrder')} • ₹${Number(cart.total_amount || 0).toFixed(2)}`}
      </button>

      {/* Razorpay Sandbox Checkout Modal (used when live merchant keys are not set) */}
      {razorpayModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-gray-200">
            <div className="bg-[#1565C0] text-white p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider opacity-80 font-bold">Razorpay Test Checkout</p>
                <h3 className="text-base font-extrabold">KisanDirect</h3>
                <p className="text-[11px] opacity-90">Order {razorpayModal.payData.order_number}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black">₹{Number(razorpayModal.payData.amount).toFixed(2)}</p>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">Test Mode</span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                {['UPI', 'Card', 'Netbanking'].map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setRazorpayModal({ ...razorpayModal, channel: ch })}
                    className={`py-2 rounded-xl border transition-all ${
                      razorpayModal.channel === ch
                        ? 'border-[#1565C0] bg-blue-50 text-[#1565C0]'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-700 space-y-1">
                <p className="font-bold text-kisan-dark">
                  {razorpayModal.channel === 'UPI' && 'Pay via UPI (success@razorpay)'}
                  {razorpayModal.channel === 'Card' && 'Test Visa Card •••• 1111'}
                  {razorpayModal.channel === 'Netbanking' && 'Test HDFC / SBI Netbanking'}
                </p>
                <p className="text-[11px] text-gray-500 font-mono">
                  RP Order: {razorpayModal.payData.razorpay_order_id}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  disabled={verifyingRp}
                  onClick={handleFailSandboxRazorpay}
                  className="flex-1 py-2.5 border border-red-300 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-bold text-red-700 disabled:opacity-50"
                >
                  Simulate Failure
                </button>
                <button
                  type="button"
                  disabled={verifyingRp}
                  onClick={handleConfirmSandboxRazorpay}
                  className="flex-1 py-2.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {verifyingRp ? 'Verifying...' : `Success • Pay ₹${Number(razorpayModal.payData.amount).toFixed(2)}`}
                </button>
              </div>
              <button
                type="button"
                disabled={verifyingRp}
                onClick={async () => {
                  const orderId = razorpayModal.order.id;
                  await api.post('/api/payments/cancel', { order_id: orderId }).catch(() => {});
                  setRazorpayModal(null);
                  setError('Payment cancelled. Your items are still in your cart.');
                }}
                className="w-full py-2 text-[11px] font-bold text-gray-500 hover:text-gray-700"
              >
                Cancel &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
