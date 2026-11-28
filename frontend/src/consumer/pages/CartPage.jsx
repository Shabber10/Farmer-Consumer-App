import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Sparkles, Users } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { BackButton, PageBackground } from '../../shared';
import bg8 from '../../assets/images/bg8_hd.jpg';
import { getLocalizedProductName, getLocalizedUnit } from '../../utils/productLocalization';
import api, { getImageUrl } from '../../services/api';
import CommunityJoinCreateModal from '../components/CommunityJoinCreateModal';

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, fetchCart, loading } = useCart();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showPushConfirm, setShowPushConfirm] = useState(false);
  const [myCommunity, setMyCommunity] = useState(null);
  const [pushNote, setPushNote] = useState('');
  const [pushing, setPushing] = useState(false);

  const handleOpenPushToCommunity = async () => {
    try {
      const res = await api.get('/api/communities/my');
      if (res.data.community) {
        setMyCommunity(res.data.community);
        setShowPushConfirm(true);
      } else {
        setShowCommunityModal(true);
      }
    } catch {
      setShowCommunityModal(true);
    }
  };

  const handleConfirmPush = async (targetCommunityId) => {
    setPushing(true);
    try {
      await api.post(`/api/communities/${targetCommunityId}/push-cart`, {
        title_note: pushNote.trim(),
        clear_cart: true,
      });
      await fetchCart();
      setShowPushConfirm(false);
      navigate('/buyer/community');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to push cart to community.');
    } finally {
      setPushing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-kisan-primary"></div>
      </div>
    );
  }

  const items = cart.items || [];

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-kisan-primary flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-kisan-dark">Your cart is empty</h2>
        <p className="text-xs text-kisan-muted">Browse through fresh farm produce and add vegetables, fruits, and grains.</p>
        <Link
          to="/buyer"
          className="inline-flex items-center space-x-2 bg-kisan-primary text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-sm hover:bg-kisan-dark"
        >
          <span>Explore Farm Marketplace</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const freeDeliveryThreshold = 500;
  const remainingForFree = Math.max(0, freeDeliveryThreshold - cart.subtotal);

  return (
    <div className="relative max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 pb-24 md:pb-8">
      <PageBackground image={bg8} />
      <div>
        <BackButton fallbackPath="/buyer" label="Continue Shopping" className="mb-4" />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-kisan-dark">{t('cart')}</h1>
          <p className="text-xs text-kisan-muted">{cart.item_count} items from verified local farmers</p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-bold text-kisan-danger hover:underline"
        >
          Clear Cart
        </button>
      </div>

      {/* Free Delivery Bar */}
      {remainingForFree > 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 flex items-center justify-between">
          <span>Add <b>₹{remainingForFree.toFixed(2)}</b> more produce to qualify for <b>FREE Delivery</b>!</span>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900 font-bold flex items-center space-x-1.5">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Congratulations! You unlocked FREE Delivery on this harvest order!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 border border-kisan-border shadow-card flex items-center space-x-4">
              {item.product?.image_url && item.product.image_url !== '/placeholder-produce.jpg' ? (
                <img
                  src={getImageUrl(item.product.image_url)}
                  alt={item.product?.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-gray-100 flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-kisan-dark truncate">
                  {getLocalizedProductName(item.product?.name, language)}
                </h3>
                <p className="text-[11px] text-kisan-muted truncate">{item.product?.farm_name}</p>
                <div className="mt-1 flex items-baseline space-x-1">
                  <span className="text-xs font-bold text-kisan-dark">₹{item.unit_price.toFixed(2)}</span>
                  <span className="text-[10px] text-kisan-muted">
                    /{getLocalizedUnit(item.product?.unit, language)}
                  </span>
                </div>
              </div>

              {/* Quantity Controls & Subtotal */}
              <div className="flex flex-col items-end space-y-2">
                <span className="text-sm font-black text-kisan-dark">
                  ₹{item.subtotal.toFixed(2)}
                </span>

                <div className="flex items-center space-x-2 bg-gray-50 px-2 py-1 rounded-xl border border-kisan-border">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-6 h-6 rounded bg-white border flex items-center justify-center font-bold text-xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-6 h-6 rounded bg-white border flex items-center justify-center font-bold text-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 pl-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-3xl p-5 border border-kisan-border shadow-card h-fit space-y-4">
          <h2 className="font-bold text-base text-kisan-dark pb-2 border-b border-gray-100">
            Order Summary
          </h2>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between text-kisan-muted">
              <span>{t('subtotal')}</span>
              <span className="font-bold text-kisan-dark">₹{cart.subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-kisan-muted">
              <span>{t('deliveryFee')}</span>
              <span className={`font-bold ${cart.delivery_fee === 0 ? 'text-emerald-700' : 'text-kisan-dark'}`}>
                {cart.delivery_fee === 0 ? t('free') : `₹${cart.delivery_fee.toFixed(2)}`}
              </span>
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-between text-sm font-black text-kisan-dark">
              <span>{t('totalAmount')}</span>
              <span>₹{cart.total_amount.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/buyer/checkout')}
            className="w-full bg-kisan-primary text-white py-3.5 rounded-2xl font-bold text-sm shadow-md hover:bg-kisan-dark transition-all flex items-center justify-center space-x-2"
          >
            <span>{t('proceedToCheckout')} (Solo)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleOpenPushToCommunity}
            className="w-full bg-emerald-50 border-2 border-kisan-primary text-kisan-primary py-3 rounded-2xl font-bold text-sm hover:bg-emerald-100 transition-all flex items-center justify-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>Push Cart to Community</span>
          </button>
          <p className="text-[11px] text-kisan-muted text-center">
            Pool with apartment neighbors to unlock 30%–100% bulk discounts!
          </p>
        </div>
      </div>

      {/* Confirm Push to Existing Community Modal */}
      {showPushConfirm && myCommunity && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-kisan-dark">Push Cart to {myCommunity.name}</h3>
            <p className="text-xs text-kisan-muted">
              Your {items.length} cart item(s) will be shared in your community group ({myCommunity.members_count} members) so neighbors can join and unlock bulk pricing.
            </p>
            <input
              type="text"
              placeholder="Optional note (e.g. Fresh farm tomatoes, join before evening!)"
              value={pushNote}
              onChange={(e) => setPushNote(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary"
            />
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowPushConfirm(false)}
                className="flex-1 py-2.5 bg-gray-100 text-kisan-dark text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pushing}
                onClick={() => handleConfirmPush(myCommunity.id)}
                className="flex-1 py-2.5 bg-kisan-primary text-white text-xs font-bold rounded-xl"
              >
                {pushing ? 'Pushing...' : 'Push to Community'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Nearby or Create Community Modal if user has no community */}
      <CommunityJoinCreateModal
        isOpen={showCommunityModal}
        onClose={() => setShowCommunityModal(false)}
        onSuccess={(community) => {
          setMyCommunity(community);
          setShowPushConfirm(true);
        }}
      />
    </div>
  );
};

export default CartPage;
