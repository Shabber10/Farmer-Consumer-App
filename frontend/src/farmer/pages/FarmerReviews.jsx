import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, CheckCircle2, Send, ThumbsUp, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const FarmerReviews = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [msg, setMsg] = useState('');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/reviews/farmer');
      setSummary(res.data.summary);
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleReplySubmit = async (e, reviewId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      const res = await api.post(`/api/reviews/${reviewId}/reply`, { reply: replyText });
      setReviews(prev => prev.map(r => (r.id === reviewId ? res.data.review : r)));
      setReplyingId(null);
      setReplyText('');
      setMsg('Reply posted successfully');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to post reply');
    }
  };

  const breakdown = summary?.rating_breakdown || { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
  const total = summary?.total_reviews || 0;

  return (
    <div className="w-full max-w-2xl mx-auto px-3.5 py-3 space-y-3 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-kisan-dark">Customer Reviews</h1>
          <p className="text-[11px] text-kisan-muted">Buyer ratings on your harvest &amp; delivery service</p>
        </div>
        <button
          onClick={() => navigate('/farmer/profile')}
          className="inline-flex items-center space-x-1 text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-700" />
          <span>Profile</span>
        </button>
      </div>

      {msg && (
        <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-kisan-primary"></div>
        </div>
      ) : (
        <>
          {/* Summary Card */}
          <div className="bg-white rounded-2xl p-4 border border-kisan-border shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-5 flex sm:flex-col items-center justify-between sm:justify-center text-center border-b sm:border-b-0 sm:border-r border-gray-100 pb-3 sm:pb-0 sm:pr-4">
              <div>
                <div className="flex items-center justify-center space-x-1">
                  <span className="text-3xl font-black text-gray-900">
                    {summary?.farmer_average_rating || '0.0'}
                  </span>
                  <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                </div>
                <span className="text-[11px] font-bold text-emerald-700 block">Seller Rating</span>
              </div>
              <div className="sm:mt-2 bg-gray-50 px-3 py-1 rounded-xl border border-gray-200/80">
                <p className="text-[10px] font-bold text-gray-600">
                  Produce Avg: <span className="text-gray-900 font-black">{summary?.average_rating || '0.0'} ★</span>
                </p>
                <p className="text-[10px] text-gray-400">{total} total reviews</p>
              </div>
            </div>

            <div className="sm:col-span-7 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = breakdown[String(star)] || 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={star} className="flex items-center space-x-2 text-[11px]">
                    <span className="w-6 font-bold text-gray-700 text-right">{star}★</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-gray-500 font-semibold">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-kisan-border text-xs text-gray-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-1.5 text-gray-300" />
              <p className="font-bold text-gray-600">No customer reviews yet</p>
              <p>Reviews from buyers will appear here once they rate your produce.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-white rounded-2xl p-3.5 border border-kisan-border shadow-xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="inline-flex items-center space-x-0.5 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md flex-shrink-0">
                        <span>{rev.rating}</span>
                        <Star className="w-2.5 h-2.5 fill-current" />
                      </span>
                      <span className="text-xs font-extrabold text-kisan-dark truncate">
                        {rev.product_name}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                      {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>

                  {rev.title && (
                    <p className="text-xs font-bold text-gray-900">{rev.title}</p>
                  )}
                  <p className="text-xs text-gray-700 leading-relaxed">{rev.comment}</p>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-700">{rev.buyer_name}</span>
                      {rev.is_verified_purchase && (
                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                          Verified
                        </span>
                      )}
                      <span className="text-[10px] text-amber-700 font-bold">
                        Seller: {rev.farmer_rating}★
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center text-[10px] text-gray-400">
                        <ThumbsUp className="w-3 h-3 mr-0.5" /> {rev.helpful_count || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingId(replyingId === rev.id ? null : rev.id);
                          setReplyText(rev.farmer_reply || '');
                        }}
                        className="text-[11px] font-bold text-emerald-700 hover:underline"
                      >
                        {rev.farmer_reply ? 'Edit Reply' : 'Reply'}
                      </button>
                    </div>
                  </div>

                  {rev.farmer_reply && replyingId !== rev.id && (
                    <div className="p-2.5 bg-emerald-50/70 border-l-2 border-emerald-600 rounded-r-xl text-xs">
                      <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">Your Reply</span>
                      <p className="text-[11px] text-gray-700 mt-0.5">{rev.farmer_reply}</p>
                    </div>
                  )}

                  {replyingId === rev.id && (
                    <form onSubmit={(e) => handleReplySubmit(e, rev.id)} className="pt-2 border-t border-gray-100 flex space-x-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a thank-you or response..."
                        className="flex-1 px-3 py-1.5 border rounded-xl text-xs bg-gray-50 focus:bg-white"
                        required
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send</span>
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FarmerReviews;
