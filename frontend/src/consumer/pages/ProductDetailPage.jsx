import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
  Sparkles, MapPin, Plus, Minus, ShoppingCart, User, ShieldCheck,
  Star, ThumbsUp, CheckCircle2, Truck, MessageSquare, Trash2, Send, Leaf
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { BackButton } from '../../shared';
import api, { getImageUrl } from '../../services/api';
import { getLocalizedProductName, getLocalizedCategoryName, getLocalizedUnit } from '../../utils/productLocalization';

const StarPicker = ({ value, onChange, size = 'w-6 h-6' }) => (
  <div className="flex items-center space-x-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className="p-0.5 transition-transform active:scale-90 focus:outline-none"
      >
        <Star
          className={`${size} ${
            star <= value
              ? 'fill-amber-400 text-amber-400'
              : 'text-gray-300'
          }`}
        />
      </button>
    ))}
  </div>
);

const ProductDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const { addToCart } = useCart();
  const { user, isAuthenticated, role } = useAuth();
  const { language, t } = useLanguage();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState('');

  // Reviews state
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [sortBy, setSortBy] = useState('recent');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    farmer_rating: 5,
    title: '',
    comment: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchProductAndReviews = useCallback(async () => {
    try {
      const [prodRes, revRes] = await Promise.all([
        api.get(`/api/products/${id}`),
        api.get(`/api/reviews/product/${id}?sort=${sortBy}`)
      ]);
      setProduct(prodRes.data.product);
      setSummary(revRes.data.summary);
      setReviews(revRes.data.reviews || []);
      if (revRes.data.my_review) {
        setReviewForm({
          rating: revRes.data.my_review.rating,
          farmer_rating: revRes.data.my_review.farmer_rating,
          title: revRes.data.my_review.title || '',
          comment: revRes.data.my_review.comment || ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, sortBy]);

  useEffect(() => {
    fetchProductAndReviews();
  }, [fetchProductAndReviews]);

  useEffect(() => {
    if (location.hash === '#reviews') {
      setShowReviewForm(true);
      setTimeout(() => {
        document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [location.hash, loading]);

  if (loading || !product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-kisan-primary"></div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    setAdding(true);
    const res = await addToCart(product.id, quantity);
    if (res.success) {
      setToast(`Added ${quantity} ${product.unit} to cart!`);
      setTimeout(() => setToast(''), 3000);
    } else {
      alert(res.error || 'Failed to add');
    }
    setAdding(false);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) return;
    try {
      setSubmittingReview(true);
      await api.post(`/api/reviews/product/${id}`, reviewForm);
      setShowReviewForm(false);
      setToast('Thank you! Your review has been published.');
      setTimeout(() => setToast(''), 3000);
      await fetchProductAndReviews();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleHelpful = async (reviewId) => {
    try {
      const res = await api.post(`/api/reviews/${reviewId}/helpful`);
      setReviews(prev =>
        prev.map(r => (r.id === reviewId ? { ...r, helpful_count: res.data.helpful_count } : r))
      );
    } catch (err) {}
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await api.delete(`/api/reviews/${reviewId}`);
      setToast('Review deleted');
      setTimeout(() => setToast(''), 2500);
      await fetchProductAndReviews();
    } catch (err) {}
  };

  const avgRating = summary?.average_rating || product.average_rating || 0;
  const totalReviews = summary?.total_reviews || product.review_count || 0;
  const farmerRating = summary?.farmer_overall_rating || product.farmer_rating || 0;
  const farmerTotalReviews = summary?.farmer_total_reviews || product.farmer_review_count || 0;
  const breakdown = summary?.rating_breakdown || { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };

  return (
    <div className="w-full max-w-4xl mx-auto px-3.5 py-4 space-y-4 pb-24">
      {/* Top Bar */}
      <BackButton fallbackPath="/buyer" label="Back to Marketplace" />

      {toast && (
        <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold text-center">
          {toast}
        </div>
      )}

      {/* Main Product Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white rounded-2xl p-4 sm:p-6 border border-kisan-border shadow-xs">
        {/* Product Image */}
        <div className="relative h-60 sm:h-80 rounded-2xl overflow-hidden bg-kisan-bg flex items-center justify-center">
          {product.image_url && product.image_url !== '/placeholder-produce.jpg' ? (
            <img
              src={getImageUrl(product.image_url)}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Leaf className="w-16 h-16 text-kisan-primary/30" />
          )}
          {product.is_organic && (
            <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center shadow-sm">
              <Sparkles className="w-3 h-3 mr-1" />
              {t('organic')}
            </span>
          )}
          <span className="absolute bottom-3 right-3 bg-black/65 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
            {t('stock')}: {product.available_quantity} {getLocalizedUnit(product.unit, language)}
          </span>
        </div>

        {/* Details & Purchase */}
        <div className="flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-kisan-primary font-bold uppercase tracking-wider">
                {getLocalizedCategoryName(product.category_name, language)}
              </span>
              {totalReviews > 0 && (
                <a
                  href="#reviews-section"
                  className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-extrabold"
                >
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{avgRating}</span>
                  <span className="text-emerald-700/70 font-semibold">({totalReviews})</span>
                </a>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-kisan-dark mt-1">
              {getLocalizedProductName(product.name, language)}
            </h1>

            {/* Price Banner */}
            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-2xl sm:text-3xl font-black text-kisan-dark">
                ₹{product.price.toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-kisan-muted">
                / {getLocalizedUnit(product.unit, language)}
              </span>
            </div>

            {/* Farmer Info & Rating Box */}
            <div className="mt-3.5 p-3 bg-kisan-bg rounded-2xl border border-kisan-border space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-kisan-light text-kisan-dark flex items-center justify-center font-bold text-sm flex-shrink-0">
                    <User className="w-4 h-4 text-kisan-primary" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-kisan-dark truncate">{product.farmer_name}</h4>
                    <p className="text-[11px] text-kisan-primary font-medium truncate">{product.farm_name}</p>
                  </div>
                </div>

                {farmerTotalReviews > 0 && (
                  <div className="text-right flex-shrink-0 bg-white px-2.5 py-1 rounded-xl border border-emerald-200/70">
                    <div className="flex items-center justify-end space-x-0.5 text-xs font-black text-emerald-800">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{farmerRating}</span>
                    </div>
                    <span className="text-[9px] text-gray-500 font-semibold block">
                      Seller ({farmerTotalReviews})
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-kisan-muted pt-1.5 border-t border-gray-200/60 gap-2">
                <span className="flex items-center truncate">
                  <MapPin className="w-3.5 h-3.5 text-kisan-secondary mr-1 flex-shrink-0" />
                  <span className="truncate">{product.location}</span>
                </span>
                <span className="flex items-center text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/70 flex-shrink-0">
                  <Truck className="w-3 h-3 mr-1" />
                  ₹{product.delivery_price_per_km ?? 0}/km • &le;{product.max_delivery_km ?? 15}km
                </span>
              </div>
            </div>

            <div className="mt-2.5 flex items-center space-x-2 text-[11px] font-medium text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Direct farmer deal. 100% of payment goes to the cultivating grower.</span>
            </div>
          </div>

          {/* Quantity and Add to Cart Button */}
          <div className="pt-3 border-t border-gray-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-kisan-text">Select Quantity:</span>
              <div className="flex items-center space-x-3 bg-gray-50 px-3 py-1 rounded-xl border border-kisan-border">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-7 h-7 rounded-lg bg-white border flex items-center justify-center font-bold text-kisan-text hover:bg-gray-100"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.available_quantity || 9999}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!Number.isNaN(val) && val >= 1) {
                      setQuantity(Math.min(val, Number(product.available_quantity || val)));
                    }
                  }}
                  className="font-extrabold text-sm text-kisan-dark w-14 text-center bg-white border border-kisan-border rounded-lg py-0.5 focus:outline-none focus:border-kisan-primary"
                  aria-label="Quantity"
                />
                <button
                  onClick={() => setQuantity(Math.min(product.available_quantity, quantity + 1))}
                  className="w-7 h-7 rounded-lg bg-white border flex items-center justify-center font-bold text-kisan-text hover:bg-gray-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!product.is_available || product.available_quantity <= 0 || product.selling_mode === 'apartments_only' || adding}
              className="w-full bg-kisan-primary text-white py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-kisan-dark transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>
                {product.selling_mode === 'apartments_only'
                  ? 'Apartments Bulk Only (Unavailable for Individual)'
                  : !product.is_available || product.available_quantity <= 0
                    ? 'Currently Unavailable / Out of Stock'
                    : adding
                      ? 'Adding...'
                      : `Add to Cart • ₹${(product.price * quantity).toFixed(2)}`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Ratings & Reviews Section */}
      <div id="reviews-section" className="bg-white rounded-2xl p-4 sm:p-6 border border-kisan-border shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-kisan-dark">Ratings &amp; Reviews</h2>
            <p className="text-[11px] text-kisan-muted">Verified customer feedback on produce &amp; farmer</p>
          </div>
          {isAuthenticated && role === 'buyer' && (
            <button
              type="button"
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-emerald-800 transition-all active:scale-95 flex-shrink-0"
            >
              {showReviewForm ? 'Close' : 'Write a Review'}
            </button>
          )}
        </div>

        {/* Rating Overview + Distribution Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 items-center">
          <div className="sm:col-span-4 flex sm:flex-col items-center sm:items-center justify-between sm:justify-center text-center border-b sm:border-b-0 sm:border-r border-gray-200 pb-3 sm:pb-0 sm:pr-4">
            <div>
              <div className="flex items-center justify-center space-x-1">
                <span className="text-3xl font-black text-gray-900">{avgRating || '0.0'}</span>
                <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
              </div>
              <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}
              </p>
            </div>
            <div className="sm:mt-2 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl text-center">
              <p className="text-[10px] font-bold text-emerald-800">
                Farmer Rating: <span className="font-black">{farmerRating || 'N/A'} ★</span>
              </p>
            </div>
          </div>

          <div className="sm:col-span-8 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = breakdown[String(star)] || 0;
              const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
              const barColor =
                star >= 4 ? 'bg-emerald-600' : star === 3 ? 'bg-amber-400' : 'bg-red-400';
              return (
                <div key={star} className="flex items-center space-x-2 text-[11px]">
                  <span className="w-7 font-bold text-gray-700 flex items-center justify-end">
                    {star}★
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-gray-500 font-semibold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Write / Edit Review Form */}
        {showReviewForm && (
          <form onSubmit={handleReviewSubmit} className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3 text-xs">
            <h3 className="font-extrabold text-sm text-emerald-950">Share Your Experience</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Product Quality &amp; Freshness *
                </label>
                <StarPicker
                  value={reviewForm.rating}
                  onChange={(val) => setReviewForm({ ...reviewForm, rating: val })}
                />
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Farmer Packing &amp; Delivery *
                </label>
                <StarPicker
                  value={reviewForm.farmer_rating}
                  onChange={(val) => setReviewForm({ ...reviewForm, farmer_rating: val })}
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Headline (Optional)</label>
              <input
                type="text"
                value={reviewForm.title}
                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                placeholder="e.g. Fresh harvest & fast delivery!"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Your Review *</label>
              <textarea
                rows={3}
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                placeholder="How was the produce quality, taste, and farmer delivery?"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="px-3.5 py-2 rounded-xl border text-gray-600 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReview}
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold flex items-center space-x-1.5 hover:bg-emerald-800 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittingReview ? 'Submitting...' : 'Submit Review'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Sort Chips */}
        {reviews.length > 0 && (
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'recent', label: 'Most Recent' },
              { id: 'highest', label: 'Highest Rated' },
              { id: 'lowest', label: 'Lowest Rated' },
              { id: 'helpful', label: 'Most Helpful' }
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSortBy(s.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap transition-colors ${
                  sortBy === s.id
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Review List */}
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-1.5 text-gray-300" />
            <p className="font-semibold text-gray-500">No reviews yet</p>
            <p>Be the first to review this harvest!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map((rev) => {
              const badgeColor =
                rev.rating >= 4
                  ? 'bg-emerald-600 text-white'
                  : rev.rating === 3
                  ? 'bg-amber-500 text-white'
                  : 'bg-red-500 text-white';
              return (
                <div key={rev.id} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className={`inline-flex items-center space-x-0.5 text-[10px] font-black px-2 py-0.5 rounded-md ${badgeColor}`}>
                        <span>{rev.rating}</span>
                        <Star className="w-2.5 h-2.5 fill-current" />
                      </span>
                      {rev.title && (
                        <span className="font-extrabold text-xs text-gray-900">{rev.title}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                      {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed">{rev.comment}</p>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="font-bold text-gray-700">{rev.buyer_name}</span>
                      {rev.is_verified_purchase && (
                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                          Verified Buyer
                        </span>
                      )}
                      <span className="text-[10px] text-amber-700 font-semibold">
                        Farmer: {rev.farmer_rating}★
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isAuthenticated && (
                        <button
                          type="button"
                          onClick={() => handleHelpful(rev.id)}
                          className="inline-flex items-center space-x-1 text-[10px] font-bold text-gray-500 hover:text-emerald-700 bg-gray-100 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>Helpful ({rev.helpful_count || 0})</span>
                        </button>
                      )}
                      {user?.id === rev.buyer_id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(rev.id)}
                          className="text-red-400 hover:text-red-600 p-1"
                          title="Delete review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Farmer Reply */}
                  {rev.farmer_reply && (
                    <div className="mt-2 ml-3 p-2.5 bg-emerald-50/70 border-l-2 border-emerald-600 rounded-r-xl text-xs">
                      <span className="font-extrabold text-[10px] text-emerald-800 uppercase block">
                        Reply from {product.farm_name}
                      </span>
                      <p className="text-gray-700 text-[11px] mt-0.5">{rev.farmer_reply}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
