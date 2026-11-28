import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit3, MapPin, AlertCircle, Users, Truck, Sprout } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import api, { getImageUrl } from '../../services/api';
import { getLocalizedProductName, getLocalizedCategoryName, getLocalizedUnit } from '../../utils/productLocalization';

const FALLBACK_IMG = '';

const FarmerProducts = () => {
  const { language, t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [msg, setMsg] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/farmer/products');
      setProducts(res.data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
      setDeleteConfirmId(null);
      setMsg('Product deleted successfully');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const maxKm = parseFloat(editingProduct.max_delivery_km);
    if (isNaN(maxKm) || maxKm <= 0 || maxKm >= 20) {
      alert('Max delivery distance must be between 1 and 19 km');
      return;
    }
    const indivPrice = parseFloat(editingProduct.price);
    const bulkPrice = parseFloat(editingProduct.bulk_price);
    const minBulkQty = parseFloat(editingProduct.min_bulk_quantity);
    const availQty = parseFloat(editingProduct.available_quantity);
    if (isNaN(bulkPrice) || isNaN(indivPrice) || bulkPrice >= indivPrice) {
      alert('Bulk price must be lower than the individual/solo price.');
      return;
    }
    if (isNaN(availQty) || isNaN(minBulkQty) || availQty <= minBulkQty) {
      alert('Available quantity must be greater than the minimum bulk quantity.');
      return;
    }
    try {
      await api.put(`/api/products/${editingProduct.id}`, {
        name: editingProduct.name,
        price: indivPrice,
        bulk_price: bulkPrice,
        min_bulk_quantity: minBulkQty,
        available_quantity: availQty,
        delivery_price_per_km: parseFloat(editingProduct.delivery_price_per_km),
        max_delivery_km: maxKm,
        is_available: editingProduct.is_available,
        selling_mode: editingProduct.selling_mode || 'both',
        harvest_date: editingProduct.harvest_date || null
      });
      setEditingProduct(null);
      fetchProducts();
      setMsg('Product updated successfully');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update product');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3.5 py-3 space-y-3 pb-24">
      {/* Compact Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-extrabold text-kisan-dark leading-tight">{t('myProducts')}</h1>
          <p className="text-[11px] text-kisan-muted truncate">Manage all produce listed from your farm</p>
        </div>
        <Link
          to="/farmer/add-product"
          className="bg-kisan-primary text-white px-3.5 py-2 rounded-xl font-bold text-xs flex items-center space-x-1 shadow-sm hover:bg-kisan-dark transition-all flex-shrink-0 active:scale-95 tap-effect"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addProduct')}</span>
        </Link>
      </div>

      {msg && (
        <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-kisan-primary"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-kisan-border">
          <p className="text-sm font-semibold text-kisan-text">No products added yet</p>
          <p className="text-xs text-kisan-muted mt-1">Start listing your harvested produce to reach local buyers!</p>
          <Link
            to="/farmer/add-product"
            className="mt-4 inline-flex items-center space-x-1.5 bg-kisan-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-kisan-dark"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Product</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
          {products.map((p) => {
            const hasValidImg = p.image_url && p.image_url !== '/placeholder-produce.jpg';
            return (
              <div key={p.id} className="w-full bg-white rounded-2xl border border-kisan-border shadow-xs overflow-hidden flex flex-col justify-between">
                <div className="p-3.5 space-y-3">
                  {/* Top Row: Thumbnail + Title + Status */}
                  <div className="flex items-start space-x-3">
                    <div className="w-20 h-20 rounded-xl bg-emerald-50 border border-emerald-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {hasValidImg ? (
                        <img
                          src={getImageUrl(p.image_url)}
                          alt={p.name}
                          onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Sprout className="w-8 h-8 text-emerald-600/70" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase font-bold text-kisan-muted tracking-wide truncate">
                          {getLocalizedCategoryName(p.category_name, language)} • {p.selling_mode === 'apartments_only' ? 'Apartments Only' : p.selling_mode === 'individual_only' ? 'Individual Only' : 'Bulk & Individual'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          !p.is_available || p.available_quantity <= 0
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : p.bulk_disabled
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {!p.is_available || p.available_quantity <= 0 ? 'Unavailable' : p.bulk_disabled ? 'Bulk Stopped' : 'Active'}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-sm text-kisan-dark mt-0.5 truncate">
                        {getLocalizedProductName(p.name, language)}
                      </h3>

                      <div className="flex items-center text-[11px] text-kisan-muted mt-1 truncate">
                        <MapPin className="w-3 h-3 text-kisan-secondary mr-1 flex-shrink-0" />
                        <span className="truncate">{p.location}</span>
                      </div>

                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[11px] font-bold text-kisan-dark bg-gray-100 px-2 py-0.5 rounded-md">
                          Stock: {p.available_quantity} {p.unit}
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-black text-kisan-dark">₹{p.price?.toFixed(0)}</span>
                          <span className="text-[10px] text-kisan-muted">/{getLocalizedUnit(p.unit, language)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Delivery Info Strips */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <div className="bg-emerald-50/80 px-2.5 py-1.5 rounded-xl border border-emerald-100 flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-emerald-800 min-w-0">
                        <Users className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="text-[10px] font-bold truncate">Bulk:</span>
                      </div>
                      <span className="text-[11px] font-black text-emerald-700 flex-shrink-0">
                        ₹{(p.bulk_price || p.price * 0.75).toFixed(0)}
                      </span>
                    </div>

                    <div className="bg-emerald-50/80 px-2.5 py-1.5 rounded-xl border border-emerald-100 flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-emerald-900 min-w-0">
                        <Truck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="text-[10px] font-bold truncate">₹{p.delivery_price_per_km ?? 0}/km</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 flex-shrink-0">
                        &le;{p.max_delivery_km ?? 15}km
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-3.5 py-2 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => setEditingProduct({ ...p })}
                    className="text-xs font-bold text-kisan-primary hover:text-kisan-dark flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-white transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(p.id)}
                    className="text-xs font-bold text-kisan-danger hover:text-red-700 flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-white transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-xl">
            <AlertCircle className="w-12 h-12 text-kisan-danger mx-auto mb-3" />
            <h3 className="font-bold text-base text-kisan-dark">{t('deleteProduct')}</h3>
            <p className="text-xs text-kisan-muted mt-1">{t('confirmDelete')}</p>
            <div className="flex space-x-2 mt-5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 text-xs font-bold text-kisan-muted border border-gray-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2 text-xs font-bold bg-kisan-danger text-white rounded-xl hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-kisan-dark mb-4">{t('updateProduct')}</h3>
            <form onSubmit={handleUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Product Name *</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Individual Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editingProduct.price ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Available Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingProduct.available_quantity ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, available_quantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                <div>
                  <label className="block font-bold text-emerald-900 mb-1 text-[11px]">Bulk Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editingProduct.bulk_price ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, bulk_price: e.target.value })}
                    placeholder="e.g. 15"
                    className="w-full px-2.5 py-1.5 border border-emerald-200 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-emerald-900 mb-1 text-[11px]">Min Bulk Target (kg) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={editingProduct.min_bulk_quantity ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, min_bulk_quantity: e.target.value })}
                    placeholder="e.g. 50"
                    className="w-full px-2.5 py-1.5 border border-emerald-200 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                <div>
                  <label className="block font-bold text-emerald-900 mb-1 text-[11px]">Delivery Price / km (₹) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={editingProduct.delivery_price_per_km ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, delivery_price_per_km: e.target.value })}
                    placeholder="e.g. 5"
                    className="w-full px-2.5 py-1.5 border border-emerald-200 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-emerald-900 mb-1 text-[11px]">Max Distance (&lt; 20 km) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="19"
                    value={editingProduct.max_delivery_km ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (parseFloat(val) >= 0 && parseFloat(val) < 20)) {
                        setEditingProduct({ ...editingProduct, max_delivery_km: val });
                      }
                    }}
                    placeholder="e.g. 15"
                    className="w-full px-2.5 py-1.5 border border-emerald-200 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Harvest Date</label>
                <input
                  type="date"
                  value={editingProduct.harvest_date ? String(editingProduct.harvest_date).slice(0, 10) : ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, harvest_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Who can buy this produce? *</label>
                <select
                  value={editingProduct.selling_mode || 'both'}
                  onChange={(e) => setEditingProduct({ ...editingProduct, selling_mode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white font-semibold"
                >
                  <option value="both">Both Apartments (Bulk) &amp; Individual Buyers</option>
                  <option value="apartments_only">Apartments (Bulk) Only</option>
                  <option value="individual_only">Individual Buyers Only</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="avail"
                  checked={editingProduct.is_available}
                  onChange={(e) => setEditingProduct({ ...editingProduct, is_available: e.target.checked })}
                  className="rounded text-kisan-primary focus:ring-kisan-primary w-4 h-4"
                />
                <label htmlFor="avail" className="font-bold text-kisan-text">Active for Sale in Marketplace</label>
              </div>

              <div className="flex space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 font-bold border rounded-xl text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 font-bold bg-kisan-primary text-white rounded-xl hover:bg-kisan-dark"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerProducts;
