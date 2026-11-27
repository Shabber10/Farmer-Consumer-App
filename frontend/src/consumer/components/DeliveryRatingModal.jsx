import React, { useState } from 'react';
import { Star, X, Truck, User, PackageCheck, Send, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

const FEEDBACK_TAGS = [
  'On-Time Delivery',
  'Fresh Produce',
  'Neat Packing',
  'Polite Farmer',
  'Great Value',
  'Accurate Weight'
];

const StarRow = ({ value, onChange, size = 'w-6 h-6' }) => (
  <div className="flex items-center space-x-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button
        key={s}
        type="button"
        onClick={() => onChange(s)}
        className="p-0.5 transition-transform active:scale-90 focus:outline-none"
      >
        <Star
          className={`${size} ${
            s <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
          }`}
        />
      </button>
    ))}
  </div>
);

const DeliveryRatingModal = ({ order, onClose, onSubmitted }) => {
  const [overallRating, setOverallRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [farmerRating, setFarmerRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState(['Fresh Produce', 'On-Time Delivery']);
  const [comment, setComment] = useState('');
  const [itemRatings, setItemRatings] = useState(() => {
    const initial = {};
    (order?.items || []).forEach((it) => {
      if (it.product_id) initial[it.product_id] = 5;
    });
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);

  if (!order) return null;

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const itemsPayload = (order.items || [])
        .filter((it) => it.product_id)
        .map((it) => ({
          product_id: it.product_id,
          rating: itemRatings[it.product_id] || overallRating,
          comment
        }));

      const res = await api.post(`/api/reviews/order/${order.id}`, {
        overall_rating: overallRating,
        delivery_rating: deliveryRating,
        farmer_rating: farmerRating,
        feedback_tags: selectedTags,
        comment,
        items: itemsPayload
      });

      if (onSubmitted) onSubmitted(res.data.feedback);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white px-4 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <PackageCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm leading-tight">Order Delivered!</h3>
              <p className="text-[11px] text-emerald-200 truncate">
                Rate {order.order_number} &amp; share feedback
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto text-xs">
          {/* Overall Experience */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 text-center space-y-1.5">
            <p className="font-extrabold text-emerald-950 text-xs">
              How was your overall delivery experience?
            </p>
            <div className="flex justify-center">
              <StarRow value={overallRating} onChange={setOverallRating} size="w-7 h-7" />
            </div>
            <p className="text-[10px] font-bold text-emerald-700">
              {overallRating === 5 ? 'Loved it!' : overallRating === 4 ? 'Very Good' : overallRating === 3 ? 'Okay' : 'Needs Improvement'}
            </p>
          </div>

          {/* Delivery & Farmer Split Ratings */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center space-x-1 text-[11px] font-bold text-gray-700 mb-1">
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                <span>Delivery</span>
              </div>
              <StarRow value={deliveryRating} onChange={setDeliveryRating} size="w-4 h-4" />
            </div>

            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center space-x-1 text-[11px] font-bold text-gray-700 mb-1">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Farmer</span>
              </div>
              <StarRow value={farmerRating} onChange={setFarmerRating} size="w-4 h-4" />
            </div>
          </div>

          {/* Quick Feedback Tags */}
          <div>
            <p className="font-bold text-gray-700 text-[11px] mb-1.5">What stood out?</p>
            <div className="flex flex-wrap gap-1.5">
              {FEEDBACK_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                      active
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {active && <CheckCircle2 className="w-2.5 h-2.5 inline mr-1" />}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Per-Item Produce Ratings */}
          {(order.items || []).some((it) => it.product_id) && (
            <div className="space-y-1.5">
              <p className="font-bold text-gray-700 text-[11px]">Rate Produce Quality</p>
              <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200/70">
                {order.items
                  .filter((it) => it.product_id)
                  .map((it) => (
                    <div key={it.id} className="p-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">{it.product_name}</p>
                        <p className="text-[10px] text-gray-400">
                          {it.quantity} {it.unit}
                        </p>
                      </div>
                      <StarRow
                        value={itemRatings[it.product_id] || 5}
                        onChange={(val) =>
                          setItemRatings((prev) => ({ ...prev, [it.product_id]: val }))
                        }
                        size="w-4 h-4"
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Written Feedback */}
          <div>
            <label className="block font-bold text-gray-700 text-[11px] mb-1">
              Additional Feedback (Optional)
            </label>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details about freshness, delivery, or packaging..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:bg-white"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex space-x-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs"
            >
              Later
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Submit Rating & Feedback'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliveryRatingModal;
