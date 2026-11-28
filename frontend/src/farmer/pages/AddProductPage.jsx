import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Upload, Camera, AlertCircle, Users, Truck } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { BackButton } from '../../shared';
import api from '../../services/api';

const AddProductPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    bulk_price: '',
    min_bulk_quantity: '50',
    unit: 'kg',
    available_quantity: '',
    delivery_price_per_km: '',
    max_delivery_km: '15',
    selling_mode: 'both',
    harvest_date: new Date().toISOString().split('T')[0],
    image_url: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const cameraInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/categories').then(res => {
      setCategories(res.data.categories || []);
      if (res.data.categories?.length > 0) {
        setFormData(prev => ({ ...prev, category_id: res.data.categories[0].id }));
      }
    });
  }, []);

  const uploadImageFile = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));

    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      setUploading(true);
      const res = await api.post('/api/products/upload-image', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, image_url: res.data.image_url }));
    } catch (err) {
      console.error('Image upload failed:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) await uploadImageFile(file);
  };

  const handleCameraCapture = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const photo = await CapCamera.getPhoto({
          quality: 85,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera,
        });
        if (photo?.base64String) {
          const byteChars = atob(photo.base64String);
          const byteNums = new Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i += 1) {
            byteNums[i] = byteChars.charCodeAt(i);
          }
          const ext = photo.format || 'jpeg';
          const blob = new Blob([new Uint8Array(byteNums)], { type: `image/${ext}` });
          const file = new File([blob], `harvest_${Date.now()}.${ext}`, { type: `image/${ext}` });
          await uploadImageFile(file);
        }
      } catch (err) {
        if (!String(err?.message || '').toLowerCase().includes('cancel')) {
          cameraInputRef.current?.click();
        }
      }
      return;
    }
    cameraInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (
      !formData.name ||
      !formData.category_id ||
      !formData.unit ||
      formData.price === '' ||
      formData.available_quantity === '' ||
      formData.bulk_price === '' ||
      formData.min_bulk_quantity === '' ||
      formData.delivery_price_per_km === '' ||
      formData.max_delivery_km === ''
    ) {
      setError('All fields are required. Please fill in every field.');
      return;
    }

    if (!formData.image_url) {
      setError('Please upload a harvest photograph.');
      return;
    }

    const maxKm = parseFloat(formData.max_delivery_km);
    if (isNaN(maxKm) || maxKm <= 0 || maxKm >= 20) {
      setError('Delivery distance must be less than 20 km (1 - 19 km)');
      return;
    }

    const deliveryPerKm = parseFloat(formData.delivery_price_per_km);
    if (isNaN(deliveryPerKm) || deliveryPerKm < 0) {
      setError('Please enter a valid delivery price per km');
      return;
    }

    try {
      setSubmitting(true);
      const individualPrice = parseFloat(formData.price);
      const bulkPrice = parseFloat(formData.bulk_price);
      const minBulkQty = parseFloat(formData.min_bulk_quantity);
      const availQty = parseFloat(formData.available_quantity);

      if (isNaN(bulkPrice) || isNaN(individualPrice) || bulkPrice >= individualPrice) {
        setError('Bulk price must be lower than the individual/solo price.');
        setSubmitting(false);
        return;
      }

      if (isNaN(availQty) || isNaN(minBulkQty) || availQty <= minBulkQty) {
        setError('Available quantity must be greater than the minimum bulk quantity.');
        setSubmitting(false);
        return;
      }

      await api.post('/api/products', {
        name: formData.name,
        category_id: parseInt(formData.category_id),
        price: individualPrice,
        bulk_price: bulkPrice,
        min_bulk_quantity: minBulkQty,
        available_quantity: availQty,
        unit: formData.unit,
        delivery_price_per_km: deliveryPerKm,
        max_delivery_km: maxKm,
        selling_mode: formData.selling_mode,
        harvest_date: formData.harvest_date || null,
        image_url: formData.image_url
      });
      navigate('/farmer/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to list product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl min-w-0 overflow-x-hidden mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-5 pb-20 md:pb-8">
      {/* Top Bar */}
      <div className="flex items-center space-x-3">
        <BackButton fallbackPath="/farmer/products" variant="circle" />
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-kisan-dark">{t('addProduct')}</h1>
          <p className="text-xs text-kisan-muted">List your harvested produce directly in the marketplace</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-kisan-danger">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 sm:p-7 border border-kisan-border shadow-card space-y-4 text-xs">
        {/* Photo Upload Box */}
        <div>
          <label className="block font-bold text-kisan-text mb-1.5">{t('uploadPhoto')} *</label>
          <div className="border-2 border-dashed border-kisan-border rounded-2xl p-4 text-center hover:border-kisan-primary transition-colors bg-kisan-bg/50 relative overflow-hidden">
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
            {imagePreview ? (
              <div className="relative h-44 rounded-xl overflow-hidden">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 right-2 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCameraCapture}
                    className="bg-emerald-700/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer flex items-center space-x-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Camera</span>
                  </button>
                  <label className="bg-black/75 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer flex items-center space-x-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Gallery</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-5 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-kisan-primary flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="font-bold text-kisan-dark text-sm">Capture or upload harvest photograph</span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleCameraCapture}
                    className="cursor-pointer bg-kisan-primary hover:bg-kisan-dark text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Photo (Camera)</span>
                  </button>
                  <label className="cursor-pointer bg-white border border-kisan-border hover:bg-gray-50 text-kisan-dark font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs">
                    <Upload className="w-4 h-4" />
                    <span>Choose from Gallery</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
                <span className="text-[11px] text-kisan-muted">PNG, JPG, WEBP up to 10MB</span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center font-bold text-kisan-primary">
                Uploading photo...
              </div>
            )}
          </div>
        </div>

        {/* Product Name */}
        <div>
          <label className="block font-bold text-kisan-text mb-1">{t('productName')} *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Fresh Desi Tomatoes"
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary text-sm font-medium"
            required
          />
        </div>

        {/* Category & Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-kisan-text mb-1">{t('category')} *</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary text-xs font-medium"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-kisan-text mb-1">{t('unit')} *</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary text-xs font-medium"
            >
              <option value="kg">kg (Kilogram)</option>
              <option value="gram">gram</option>
              <option value="bunch">bunch (Katta)</option>
              <option value="piece">piece</option>
              <option value="dozen">dozen</option>
              <option value="litre">litre</option>
            </select>
          </div>
        </div>

        {/* Harvest Date */}
        <div>
          <label className="block font-bold text-kisan-text mb-1">Harvest Date</label>
          <input
            type="date"
            value={formData.harvest_date}
            onChange={(e) => setFormData({ ...formData, harvest_date: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary text-xs font-bold"
          />
        </div>

        {/* Price & Quantity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-kisan-text mb-1">{t('pricePerUnit')} (Individual) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="e.g. 20.00"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary text-sm font-bold"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-kisan-text mb-1">{t('availableQuantity')} *</label>
            <input
              type="number"
              step="0.01"
              value={formData.available_quantity}
              onChange={(e) => setFormData({ ...formData, available_quantity: e.target.value })}
              placeholder="e.g. 500"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary text-sm font-bold"
              required
            />
          </div>
        </div>

        {/* Community Bulk Buying Pricing Box */}
        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs text-emerald-950">Community Bulk Buying Pricing</h3>
              <p className="text-[10px] text-emerald-700">Special discounted price when residential societies order in bulk</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-emerald-900 text-[11px] mb-1">
                Bulk Price / {formData.unit} (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.bulk_price}
                onChange={(e) => setFormData({ ...formData, bulk_price: e.target.value })}
                placeholder={formData.price ? `e.g. ${Math.round(formData.price * 0.75)}` : 'e.g. 15.00'}
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-600 text-xs font-bold text-emerald-900"
                required
              />
              <span className="text-[9px] text-emerald-600 block mt-0.5">Shown to residential communities</span>
            </div>

            <div>
              <label className="block font-bold text-emerald-900 text-[11px] mb-1">
                Min Community Target ({formData.unit}) *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={formData.min_bulk_quantity}
                onChange={(e) => setFormData({ ...formData, min_bulk_quantity: e.target.value })}
                placeholder="e.g. 50"
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-600 text-xs font-bold text-emerald-900"
                required
              />
              <span className="text-[9px] text-emerald-600 block mt-0.5">Order confirmed when pool reaches this</span>
            </div>
          </div>
        </div>

        {/* Delivery Pricing & Radius (< 20 km) */}
        <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs text-emerald-950">Farmer Delivery Charges</h3>
              <p className="text-[10px] text-emerald-800">Set your delivery rate per km (strictly under 20 km)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-emerald-950 text-[11px] mb-1">
                Delivery Price / km (₹) *
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.delivery_price_per_km}
                onChange={(e) => setFormData({ ...formData, delivery_price_per_km: e.target.value })}
                placeholder="e.g. 5"
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-600 text-xs font-bold text-emerald-950"
                required
              />
              <span className="text-[9px] text-emerald-700 block mt-0.5">Charged per km for delivery</span>
            </div>

            <div>
              <label className="block font-bold text-emerald-950 text-[11px] mb-1">
                Max Distance (&lt; 20 km) *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="19"
                value={formData.max_delivery_km}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || (parseFloat(val) >= 0 && parseFloat(val) < 20)) {
                    setFormData({ ...formData, max_delivery_km: val });
                  }
                }}
                placeholder="e.g. 15"
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-600 text-xs font-bold text-emerald-950"
                required
              />
              <span className="text-[9px] text-emerald-700 block mt-0.5">Allowed range: 1 – 19 km</span>
            </div>
          </div>
        </div>

        {/* Selling Mode Selector */}
        <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 space-y-2">
          <label className="block font-extrabold text-xs text-emerald-950">
            Who can buy this produce? *
          </label>
          <select
            value={formData.selling_mode}
            onChange={(e) => setFormData({ ...formData, selling_mode: e.target.value })}
            className="w-full px-3 py-2.5 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-600 text-xs font-bold text-emerald-950"
          >
            <option value="both">Both Apartments (Bulk) &amp; Individual Buyers</option>
            <option value="apartments_only">Apartments (Bulk) Only</option>
            <option value="individual_only">Individual Buyers Only</option>
          </select>
          <span className="text-[10px] text-emerald-800 block">
            Bulk automatically stops if remaining stock drops below Min Bulk Target; Individual buyers receive stock via nearest-first dispatch.
          </span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || uploading}
          className="w-full mt-2 bg-kisan-primary text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-kisan-dark transition-all disabled:opacity-50"
        >
          {submitting ? 'Publishing Produce...' : t('saveProduct')}
        </button>
      </form>
    </div>
  );
};

export default AddProductPage;
