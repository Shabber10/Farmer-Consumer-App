import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, MapPin, Globe, Headphones, LogOut, CheckCircle2, 
  Package, ShoppingBag, TrendingUp, ChevronRight, Lock, Phone, Mail, 
  Pencil, ArrowLeft, AlertCircle, ChevronDown, ShieldCheck, Sprout, Star
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { PasswordInput } from '../../shared';
import api from '../../services/api';

const FarmerProfile = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // Active accordion section: 'profile' | 'farm_location' | 'password' | 'phone' | 'support' | null
  const [activeSection, setActiveSection] = useState(null);

  // Status feedback { type: 'success' | 'error', text: '' }
  const [statusMsg, setStatusMsg] = useState(null);

  // Profile Form (Farmer Name & Email & Farm Name)
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    farm_name: ''
  });

  // Farm Location Form
  const [farmLocationForm, setFarmLocationForm] = useState({
    village: '',
    district: '',
    state: 'Telangana',
    pincode: ''
  });

  // Password Form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Phone Form
  const [phoneForm, setPhoneForm] = useState({
    mobile_number: ''
  });

  // Support
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMsg, setSupportMsg] = useState('');

  const farmer = user?.farmer_profile || {};

  // Sync user state to form
  useEffect(() => {
    if (user) {
      const fp = user.farmer_profile || {};
      setProfileForm({
        full_name: user.full_name || '',
        email: user.email || '',
        farm_name: fp.farm_name || ''
      });
      setFarmLocationForm({
        village: fp.village || '',
        district: fp.district || '',
        state: fp.state || 'Telangana',
        pincode: fp.pincode || ''
      });
      setPhoneForm({
        mobile_number: user.mobile_number || ''
      });
    }
  }, [user]);

  const showFeedback = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const toggleSection = (section) => {
    setActiveSection(prev => prev === section ? null : section);
  };

  // Handle Profile Update (Name, Farm Name, Email)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/api/auth/profile', profileForm);
      updateUser(res.data.user);
      setActiveSection(null);
      showFeedback('success', 'Farm profile updated successfully!');
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to update profile');
    }
  };

  // Handle Farm Location Update
  const handleUpdateFarmLocation = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/api/auth/profile', farmLocationForm);
      updateUser(res.data.user);
      setActiveSection(null);
      showFeedback('success', 'Farm location details updated!');
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to update farm location');
    }
  };

  // Handle Phone Number Change
  const handleUpdatePhone = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/api/auth/profile', {
        mobile_number: phoneForm.mobile_number
      });
      updateUser(res.data.user);
      setActiveSection(null);
      showFeedback('success', 'Registered mobile number updated!');
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to update mobile number');
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showFeedback('error', 'New passwords do not match');
      return;
    }
    try {
      await api.put('/api/auth/change-password', passwordForm);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setActiveSection(null);
      showFeedback('success', 'Password updated successfully!');
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to change password');
    }
  };

  // Handle Support Submit
  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/support', { subject: supportSubject, message: supportMsg });
      setSupportSubject('');
      setSupportMsg('');
      setActiveSection(null);
      showFeedback('success', 'Support request sent. Our team will contact you shortly!');
    } catch (e) {
      showFeedback('error', 'Failed to send support ticket');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-3.5 py-3 space-y-2.5 pb-28">
      {/* Top Status Badge (single back button is in MobileHeader) */}
      <div className="flex items-center justify-end">
        <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
          <Sprout className="w-3 h-3 text-emerald-600 mr-1" />
          Verified Producer
        </span>
      </div>

      {/* Global Status Banner */}
      {statusMsg && (
        <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 animate-slide-up shadow-xs ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          )}
          <span className="truncate">{statusMsg.text}</span>
        </div>
      )}

      {/* Farmer Identity Card (Compact & High-Density) */}
      <div className="bg-white rounded-2xl p-3.5 border border-kisan-border shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-700 to-green-800 text-white flex items-center justify-center font-black text-lg shadow-2xs flex-shrink-0">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'K'}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-gray-900 leading-tight truncate">
                {user?.full_name || 'Kisan Direct Farmer'}
              </h2>
              <p className="text-xs font-bold text-emerald-700 leading-tight truncate mt-0.5">
                {farmer.farm_name || 'Direct Farm'}
              </p>
              <p className="text-[11px] text-gray-500 font-medium flex items-center mt-0.5 truncate">
                <Phone className="w-3 h-3 text-emerald-600 mr-1 flex-shrink-0" />
                {user?.mobile_number || 'No phone registered'}
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleSection('profile')}
            className={`p-2 rounded-xl border transition-all active:scale-95 flex-shrink-0 ${
              activeSection === 'profile'
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-emerald-50/80 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
            }`}
            title="Edit Profile"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Inline Edit Farmer Profile Form */}
        {activeSection === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="mt-3 pt-3 border-t border-gray-100 space-y-2.5 text-xs animate-slide-up">
            <p className="font-bold text-gray-700">{t('personalDetails') || 'Edit Farmer Details'}</p>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">{t('fullName')}</label>
              <input
                type="text"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                className="w-full px-2.5 py-1.5 border rounded-xl text-xs bg-gray-50/60 focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">Farm Name</label>
              <input
                type="text"
                value={profileForm.farm_name}
                onChange={(e) => setProfileForm({ ...profileForm, farm_name: e.target.value })}
                placeholder="e.g. Green Valley Organic Farm"
                className="w-full px-2.5 py-1.5 border rounded-xl text-xs bg-gray-50/60 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">{t('email')}</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full px-2.5 py-1.5 border rounded-xl text-xs bg-gray-50/60 focus:bg-white"
                required
              />
            </div>
            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveSection(null)}
                className="px-3 py-1.5 rounded-xl border text-gray-500 font-bold text-[11px]"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-emerald-700 text-white font-bold text-[11px] shadow-xs active:scale-95"
              >
                {t('saveChanges')}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Quick Access Tiles: Orders, Products, Earnings, Reviews */}
      <div className="grid grid-cols-4 gap-1.5">
        <button
          onClick={() => navigate('/farmer/orders')}
          className="p-2 bg-white rounded-2xl border border-kisan-border shadow-xs hover:border-emerald-300 transition-all flex flex-col items-center justify-center text-center active:scale-[0.98] tap-effect"
        >
          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/50 flex items-center justify-center mb-1">
            <Package className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] font-black text-gray-900 leading-tight">{t('orders')}</p>
        </button>

        <button
          onClick={() => navigate('/farmer/products')}
          className="p-2 bg-white rounded-2xl border border-kisan-border shadow-xs hover:border-emerald-300 transition-all flex flex-col items-center justify-center text-center active:scale-[0.98] tap-effect"
        >
          <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/50 flex items-center justify-center mb-1">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] font-black text-gray-900 leading-tight">{t('products')}</p>
        </button>

        <button
          onClick={() => navigate('/farmer/earnings')}
          className="p-2 bg-white rounded-2xl border border-kisan-border shadow-xs hover:border-emerald-300 transition-all flex flex-col items-center justify-center text-center active:scale-[0.98] tap-effect"
        >
          <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/50 flex items-center justify-center mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] font-black text-gray-900 leading-tight">{t('earnings')}</p>
        </button>

        <button
          onClick={() => navigate('/farmer/reviews')}
          className="p-2 bg-white rounded-2xl border border-kisan-border shadow-xs hover:border-emerald-300 transition-all flex flex-col items-center justify-center text-center active:scale-[0.98] tap-effect"
        >
          <div className="w-7 h-7 rounded-xl bg-yellow-50 text-amber-600 border border-amber-200/50 flex items-center justify-center mb-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          </div>
          <p className="text-[11px] font-black text-gray-900 leading-tight">
            {farmer.farmer_rating ? `${farmer.farmer_rating}★` : 'Reviews'}
          </p>
        </button>
      </div>

      {/* Grouped Account & Security Options */}
      <div className="bg-white rounded-2xl border border-kisan-border shadow-xs divide-y divide-gray-100 overflow-hidden">
        {/* Row 1: Farm Location & Pickup Address */}
        <div className="p-3">
          <div 
            onClick={() => toggleSection('farm_location')}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900">Farm Location & Address</p>
                <p className="text-[10px] text-gray-400 truncate">
                  {farmer.village ? `${farmer.village}, ${farmer.district}` : 'Tap to set farm address'}
                </p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${activeSection === 'farm_location' ? 'rotate-180 text-emerald-700' : ''}`} />
          </div>

          {activeSection === 'farm_location' && (
            <form onSubmit={handleUpdateFarmLocation} className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-xs animate-slide-up">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Village / Town</label>
                  <input
                    type="text"
                    value={farmLocationForm.village}
                    onChange={(e) => setFarmLocationForm({ ...farmLocationForm, village: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-gray-50/60 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">District</label>
                  <input
                    type="text"
                    value={farmLocationForm.district}
                    onChange={(e) => setFarmLocationForm({ ...farmLocationForm, district: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-gray-50/60 focus:bg-white"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">State</label>
                  <input
                    type="text"
                    value={farmLocationForm.state}
                    onChange={(e) => setFarmLocationForm({ ...farmLocationForm, state: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-gray-50/60 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={farmLocationForm.pincode}
                    onChange={(e) => setFarmLocationForm({ ...farmLocationForm, pincode: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-gray-50/60 focus:bg-white"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveSection(null)}
                  className="px-3 py-1.5 rounded-xl border text-gray-500 font-bold text-[11px]"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-700 text-white font-bold text-[11px] shadow-xs active:scale-95"
                >
                  Save Address
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Row 2: Change Mobile Number */}
        <div className="p-3">
          <div 
            onClick={() => toggleSection('phone')}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{t('changeMobile') || 'Mobile Number'}</p>
                <p className="text-[10px] text-gray-400">{user?.mobile_number || 'Tap to update phone'}</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${activeSection === 'phone' ? 'rotate-180 text-blue-700' : ''}`} />
          </div>

          {activeSection === 'phone' && (
            <form onSubmit={handleUpdatePhone} className="mt-3 pt-3 border-t border-gray-100 space-y-2.5 text-xs animate-slide-up">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">New 10-Digit Mobile Number</label>
                <input
                  type="tel"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  placeholder="Enter 10-digit number"
                  value={phoneForm.mobile_number}
                  onChange={(e) => setPhoneForm({ mobile_number: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-2.5 py-1.5 border rounded-xl text-xs bg-gray-50/60 focus:bg-white"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveSection(null)}
                  className="px-3 py-1.5 rounded-xl border text-gray-500 font-bold text-[11px]"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-700 text-white font-bold text-[11px] shadow-xs active:scale-95"
                >
                  Update Number
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Row 3: Change Password */}
        <div className="p-3">
          <div 
            onClick={() => toggleSection('password')}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{t('changePassword') || 'Change Password'}</p>
                <p className="text-[10px] text-gray-400">Update login security & farmer pin</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${activeSection === 'password' ? 'rotate-180 text-amber-700' : ''}`} />
          </div>

          {activeSection === 'password' && (
            <form onSubmit={handleChangePassword} className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-xs animate-slide-up">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-0.5">{t('currentPassword') || 'Current Password'}</label>
                <PasswordInput
                  placeholder="Enter current password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="w-full px-2.5 py-1.5 border rounded-xl text-xs bg-gray-50/60 focus:bg-white"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">{t('newPassword') || 'New Password'}</label>
                  <PasswordInput
                    placeholder="Min 6 characters"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded-xl text-xs bg-gray-50/60 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">{t('confirmPassword') || 'Confirm'}</label>
                  <PasswordInput
                    placeholder="Re-enter password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded-xl text-xs bg-gray-50/60 focus:bg-white"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveSection(null)}
                  className="px-3 py-1.5 rounded-xl border text-gray-500 font-bold text-[11px]"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-[11px] shadow-xs active:scale-95"
                >
                  Update Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Preferences & Support */}
      <div className="bg-white rounded-2xl border border-kisan-border shadow-xs divide-y divide-gray-100 overflow-hidden">
        {/* Row 1: App Language Selector (Compact segmented inline) */}
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">{t('appLanguage') || 'App Language'}</p>
              <p className="text-[10px] text-gray-400">English, తెలుగు, हिंदी</p>
            </div>
          </div>
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200">
            {[
              { code: 'en', label: 'EN' },
              { code: 'te', label: 'తె' },
              { code: 'hi', label: 'हिं' }
            ].map((item) => (
              <button
                key={item.code}
                onClick={() => setLanguage(item.code)}
                className={`py-1 px-2.5 rounded-lg text-xs font-black transition-all ${
                  language === item.code
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Help & Support */}
        <div className="p-3">
          <div 
            onClick={() => toggleSection('support')}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{t('helpSupport') || 'Help & Support'}</p>
                <p className="text-[10px] text-gray-400">Farmer helpline & dispatch support</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${activeSection === 'support' ? 'rotate-180 text-teal-700' : ''}`} />
          </div>

          {activeSection === 'support' && (
            <form onSubmit={handleSupportSubmit} className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-xs animate-slide-up">
              <input
                type="text"
                value={supportSubject}
                onChange={(e) => setSupportSubject(e.target.value)}
                placeholder="Subject (e.g. Payout question)"
                className="w-full px-2.5 py-1.5 border rounded-xl text-xs bg-gray-50/60 focus:bg-white"
                required
              />
              <textarea
                value={supportMsg}
                onChange={(e) => setSupportMsg(e.target.value)}
                placeholder="Describe your issue or request in detail..."
                rows={2}
                className="w-full px-2.5 py-1.5 border rounded-xl text-xs bg-gray-50/60 focus:bg-white"
                required
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveSection(null)}
                  className="px-3 py-1.5 rounded-xl border text-gray-500 font-bold text-[11px]"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-teal-700 text-white font-bold text-[11px] shadow-xs active:scale-95"
                >
                  {t('sendSupportMessage')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Logout Row */}
      <button
        onClick={logout}
        className="w-full py-2.5 px-4 bg-red-50/80 hover:bg-red-100 active:scale-[0.99] text-red-600 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all border border-red-200 shadow-2xs tap-effect"
      >
        <LogOut className="w-4 h-4" />
        <span>{t('logout')}</span>
      </button>
    </div>
  );
};

export default FarmerProfile;