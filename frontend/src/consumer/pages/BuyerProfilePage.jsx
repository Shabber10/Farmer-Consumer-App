import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, MapPin, Globe, Headphones, LogOut, Plus, Trash2, CheckCircle2, 
  Package, ShoppingCart, ChevronRight, Lock, Phone, Mail, Pencil, 
  ArrowLeft, AlertCircle, ChevronDown, Check, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { PasswordInput, RapidoMapPicker } from '../../shared';
import api from '../../services/api';

const BuyerProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // Active accordion section: 'profile' | 'addresses' | 'password' | 'phone' | 'support' | null
  const [activeSection, setActiveSection] = useState(null);

  // Status message { type: 'success' | 'error', text: '' }
  const [statusMsg, setStatusMsg] = useState(null);

  // Edit Profile Form
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    mobile_number: ''
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

  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [newAddr, setNewAddr] = useState({
    door_number: '', street: '', village: '', district: '', state: 'Telangana', pincode: '', landmark: ''
  });

  // Support
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMsg, setSupportMsg] = useState('');

  // Sync user state to forms
  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        email: user.email || '',
        mobile_number: user.mobile_number || ''
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

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/api/addresses');
      setAddresses(res.data.addresses || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Handle Profile Update (Name & Email)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/api/auth/profile', {
        full_name: profileForm.full_name,
        email: profileForm.email
      });
      updateUser(res.data.user);
      setActiveSection(null);
      showFeedback('success', 'Profile updated successfully!');
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to update profile');
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
      showFeedback('success', 'Mobile number updated successfully!');
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

  // Handle Add Address
  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/addresses', newAddr);
      setShowAddAddr(false);
      setNewAddr({ door_number: '', street: '', village: '', district: '', state: 'Telangana', pincode: '', landmark: '' });
      fetchAddresses();
      showFeedback('success', 'New address added successfully!');
    } catch (err) {
      showFeedback('error', 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await api.delete(`/api/addresses/${id}`);
      fetchAddresses();
      showFeedback('success', 'Address removed');
    } catch (e) {}
  };

  const handleSetDefault = async (id) => {
    try {
      await api.patch(`/api/addresses/${id}/default`);
      fetchAddresses();
      showFeedback('success', 'Default address updated');
    } catch (e) {}
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
      {/* Compact Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/buyer')}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-gray-700 hover:text-emerald-700 active:scale-95 transition-all py-1.5 px-3 rounded-xl bg-white border border-gray-200 shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-700" />
          <span>{t('home')}</span>
        </button>
        <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
          <ShieldCheck className="w-3 h-3 text-emerald-600 mr-1" />
          Verified Customer
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

      {/* Profile Identity Card (Compact & High-Density) */}
      <div className="bg-white rounded-2xl p-3.5 border border-kisan-border shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-lg shadow-2xs flex-shrink-0">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-gray-900 leading-tight truncate">
                {user?.full_name || 'Kisan Direct User'}
              </h2>
              <p className="text-[11px] text-gray-500 font-medium flex items-center mt-0.5 truncate">
                <Phone className="w-3 h-3 text-emerald-600 mr-1 flex-shrink-0" />
                {user?.mobile_number || 'No phone registered'}
              </p>
              <p className="text-[10px] text-gray-400 font-medium flex items-center mt-0.5 truncate">
                <Mail className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0" />
                {user?.email || 'No email registered'}
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

        {/* Inline Edit Personal Details Form */}
        {activeSection === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="mt-3 pt-3 border-t border-gray-100 space-y-2.5 text-xs animate-slide-up">
            <p className="font-bold text-gray-700">{t('personalDetails') || 'Edit Personal Details'}</p>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">{t('fullName')}</label>
              <input
                type="text"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value.replace(/[^A-Za-z\s.'-]/g, '') })}
                className="w-full px-2.5 py-1.5 border rounded-xl text-xs bg-gray-50/60 focus:bg-white"
                required
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

      {/* Quick Access Tiles: Orders & Cart */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => navigate('/buyer/orders')}
          className="p-3 bg-white rounded-2xl border border-kisan-border shadow-xs hover:border-emerald-300 transition-all flex items-center space-x-2.5 active:scale-[0.98] tap-effect text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/50 flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-gray-900 leading-tight">{t('myOrders')}</p>
            <p className="text-[10px] text-gray-400 truncate">Deliveries & track</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/buyer/cart')}
          className="p-3 bg-white rounded-2xl border border-kisan-border shadow-xs hover:border-emerald-300 transition-all flex items-center space-x-2.5 active:scale-[0.98] tap-effect text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/50 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-gray-900 leading-tight">{t('cart')}</p>
            <p className="text-[10px] text-gray-400 truncate">Checkout pool</p>
          </div>
        </button>
      </div>

      {/* Grouped Account & Security Options */}
      <div className="bg-white rounded-2xl border border-kisan-border shadow-xs divide-y divide-gray-100 overflow-hidden">
        {/* Row 1: Saved Addresses */}
        <div className="p-3">
          <div 
            onClick={() => toggleSection('addresses')}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{t('savedAddresses')}</p>
                <p className="text-[10px] text-gray-400">{addresses.length} delivery addresses saved</p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSection('addresses');
                  setShowAddAddr(true);
                }}
                className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200"
              >
                + Add
              </button>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${activeSection === 'addresses' ? 'rotate-180 text-emerald-700' : ''}`} />
            </div>
          </div>

          {/* Address List & Add Form Dropdown */}
          {activeSection === 'addresses' && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-xs animate-slide-up">
              {addresses.map((a) => (
                <div key={a.id} className="p-2.5 bg-gray-50/80 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-gray-900 truncate">{a.door_number}, {a.street}</span>
                      {a.is_default && (
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded">Default</span>
                      )}
                    </div>
                    <p className="text-gray-500 text-[10px] truncate">{a.village}, {a.district} - {a.pincode}</p>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {!a.is_default && (
                      <button
                        onClick={() => handleSetDefault(a.id)}
                        className="text-[10px] text-emerald-700 font-bold hover:underline"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAddress(a.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete Address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {showAddAddr ? (
                <form onSubmit={handleAddAddress} className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-200 space-y-2.5 text-xs mt-2">
                  <p className="font-bold text-emerald-900 text-xs">Pin Location (Auto-Detects Address)</p>
                  <RapidoMapPicker
                    initialLat={newAddr.latitude || 17.4474}
                    initialLng={newAddr.longitude || 78.3762}
                    initialTitle={newAddr.street || 'Delivery Location'}
                    initialAddress={[newAddr.village, newAddr.district, newAddr.state, newAddr.pincode].filter(Boolean).join(', ')}
                    initialCity={newAddr.district || 'Hyderabad'}
                    initialPincode={newAddr.pincode || '500081'}
                    pinLabel="Delivery Pin"
                    selectedLabel="Auto-Detected Address"
                    mapHeight="200px"
                    onLocationChange={(loc) => {
                      setNewAddr((prev) => ({
                        ...prev,
                        latitude: loc.lat,
                        longitude: loc.lng,
                        street: loc.title || loc.address || prev.street || 'Selected Area',
                        village: loc.village || loc.title || prev.village || 'Hyderabad',
                        district: loc.district || prev.district || 'Hyderabad',
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
                      className="p-2 border rounded-lg text-xs bg-white"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Landmark (e.g. Near Main Gate) *"
                      value={newAddr.landmark}
                      onChange={(e) => setNewAddr({ ...newAddr, landmark: e.target.value })}
                      className="p-2 border rounded-lg text-xs bg-white"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddAddr(false)}
                      className="px-2.5 py-1 border rounded-lg font-bold text-[10px] text-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1 bg-emerald-700 text-white rounded-lg font-bold text-[10px]"
                    >
                      Save Address
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
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
                <p className="text-[10px] text-gray-400">Update your login security & credentials</p>
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

      {/* Preferences & Help Group */}
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

        {/* Row 2: Help & Support Form */}
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
                <p className="text-[10px] text-gray-400">Customer care & order assistance</p>
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
                placeholder="Subject (e.g. Delivery status)"
                className="w-full px-2.5 py-1.5 border rounded-xl text-xs bg-gray-50/60 focus:bg-white"
                required
              />
              <textarea
                value={supportMsg}
                onChange={(e) => setSupportMsg(e.target.value)}
                placeholder="Describe your issue or feedback..."
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

export default BuyerProfilePage;