import React, { useState, useEffect } from 'react';
import { X, MapPin, Users, Star, Building2, KeyRound, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../../services/api';
import RapidoMapPicker from '../../shared/components/RapidoMapPicker';

/**
 * Shared modal for joining a nearby community (within 50m–500m GPS), joining by code,
 * or creating a new apartment/gated society community with exact address & map pin.
 */
const CommunityJoinCreateModal = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = useState('nearby'); // 'nearby' | 'create' | 'code'
  const [nearby, setNearby] = useState([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [radiusM, setRadiusM] = useState(500);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Join details (apartment unit for the member)
  const [blockName, setBlockName] = useState('');
  const [floorName, setFloorName] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [joinCode, setJoinCode] = useState('');

  // Create community form
  const [form, setForm] = useState({
    name: '',
    community_type: 'apartment',
    address_line: '',
    landmark: '',
    dropoff_point: 'Main Gate Security',
    pincode: '',
    latitude: 17.4474,
    longitude: 78.3762,
  });

  const fetchNearby = async (radius = radiusM) => {
    setLoadingNearby(true);
    setError('');
    try {
      const res = await api.get(`/api/communities/nearby?radius_m=${radius}`);
      setNearby(res.data.communities || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load nearby communities.');
    } finally {
      setLoadingNearby(false);
    }
  };

  useEffect(() => {
    if (isOpen && tab === 'nearby') {
      fetchNearby(radiusM);
    }
  }, [isOpen, tab, radiusM]);

  if (!isOpen) return null;

  const handleJoin = async (communityId) => {
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post(`/api/communities/${communityId}/join`, {
        block_name: blockName,
        floor_name: floorName,
        flat_number: flatNumber,
      });
      onSuccess?.(res.data.community, res.data.membership);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join community.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/api/communities/join-by-code', {
        community_code: joinCode.trim().toUpperCase(),
        block_name: blockName,
        floor_name: floorName,
        flat_number: flatNumber,
      });
      onSuccess?.(res.data.community, res.data.membership);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid community code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Apartment / Community name is required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/api/communities', {
        ...form,
        block_name: blockName,
        floor_name: floorName,
        flat_number: flatNumber,
      });
      onSuccess?.(res.data.community, res.data.membership);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create community.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 pb-24 sm:pb-5 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div>
            <h3 className="text-base font-extrabold text-kisan-dark">Join or Create Community</h3>
            <p className="text-[11px] text-kisan-muted">Connect with neighbors in your apartment to unlock wholesale farm prices</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => setTab('nearby')}
            className={`flex-1 py-2 rounded-lg transition-all ${tab === 'nearby' ? 'bg-white text-kisan-primary shadow-xs' : 'text-gray-500'}`}
          >
            Near Me
          </button>
          <button
            type="button"
            onClick={() => setTab('create')}
            className={`flex-1 py-2 rounded-lg transition-all ${tab === 'create' ? 'bg-white text-kisan-primary shadow-xs' : 'text-gray-500'}`}
          >
            Create New
          </button>
          <button
            type="button"
            onClick={() => setTab('code')}
            className={`flex-1 py-2 rounded-lg transition-all ${tab === 'code' ? 'bg-white text-kisan-primary shadow-xs' : 'text-gray-500'}`}
          >
            Invite Code
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-3 py-2 rounded-xl">
            {error}
          </div>
        )}

        {/* Member Flat / Block Details (private to delivery only) */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 space-y-2">
          <p className="text-[11px] font-bold text-emerald-900">Your Flat Details (kept private from other members)</p>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Block / Tower"
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
              className="px-2.5 py-2 text-xs bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-kisan-primary"
            />
            <input
              type="text"
              placeholder="Floor"
              value={floorName}
              onChange={(e) => setFloorName(e.target.value)}
              className="px-2.5 py-2 text-xs bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-kisan-primary"
            />
            <input
              type="text"
              placeholder="Flat No."
              value={flatNumber}
              onChange={(e) => setFlatNumber(e.target.value)}
              className="px-2.5 py-2 text-xs bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-kisan-primary"
            />
          </div>
        </div>

        {tab === 'nearby' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-kisan-dark">Communities within {radiusM}m</span>
              <select
                value={radiusM}
                onChange={(e) => setRadiusM(Number(e.target.value))}
                className="px-2.5 py-1 border rounded-lg text-xs font-semibold bg-white"
              >
                <option value={100}>100 m</option>
                <option value={250}>250 m</option>
                <option value={500}>500 m</option>
                <option value={5000}>5 km</option>
                <option value={20000}>20 km</option>
              </select>
            </div>

            {loadingNearby ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-kisan-primary" />
              </div>
            ) : nearby.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-300 space-y-2">
                <Building2 className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-xs font-bold text-gray-700">No communities found within {radiusM}m</p>
                <p className="text-[11px] text-gray-500">Create your apartment community and invite your neighbors!</p>
                <button
                  type="button"
                  onClick={() => setTab('create')}
                  className="mt-1 px-4 py-2 bg-kisan-primary text-white text-xs font-bold rounded-xl"
                >
                  Create My Own Community
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {nearby.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-2xl border border-kisan-border bg-white shadow-2xs flex items-center justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-extrabold text-kisan-dark truncate">{c.name}</h4>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          {c.community_code}
                        </span>
                      </div>
                      <p className="text-[11px] text-kisan-muted truncate">{c.address_line}</p>
                      <div className="flex items-center space-x-3 text-[11px] font-semibold text-gray-600">
                        {c.distance_m !== undefined && (
                          <span className="flex items-center space-x-1 text-emerald-700">
                            <MapPin className="w-3 h-3" />
                            <span>{c.distance_m < 1000 ? `${Math.round(c.distance_m)} m` : `${c.distance_km} km`}</span>
                          </span>
                        )}
                        <span className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{c.members_count} members</span>
                        </span>
                        {c.farmer_review_count > 0 && (
                          <span className="flex items-center space-x-0.5 text-amber-600">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{c.avg_farmer_rating}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleJoin(c.id)}
                      className="px-3.5 py-2 bg-kisan-primary hover:bg-kisan-dark text-white text-xs font-bold rounded-xl flex-shrink-0"
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'create' && (
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-kisan-dark mb-1">Apartment / Gated Community Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. My Home Mangala / Rainbow Residency"
                className="w-full px-3 py-2 text-xs border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-kisan-dark mb-1">Community Type</label>
                <select
                  value={form.community_type}
                  onChange={(e) => setForm({ ...form, community_type: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-kisan-border rounded-xl bg-white"
                >
                  <option value="apartment">Apartment</option>
                  <option value="gated_society">Gated Community</option>
                  <option value="layout">Residential Layout</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-kisan-dark mb-1">Drop-off Point *</label>
                <input
                  type="text"
                  required
                  value={form.dropoff_point}
                  onChange={(e) => setForm({ ...form, dropoff_point: e.target.value })}
                  placeholder="e.g. Main Gate Security"
                  className="w-full px-3 py-2 text-xs border border-kisan-border rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-kisan-dark mb-1">Pin Exact Apartment Location on Map *</label>
              <RapidoMapPicker
                height="190px"
                pinLabel="Apartment Location"
                initialLat={form.latitude}
                initialLng={form.longitude}
                onLocationChange={(loc) => {
                  setForm((prev) => ({
                    ...prev,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    address_line: loc.location_title || prev.address_line,
                    pincode: loc.pincode || prev.pincode,
                  }));
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-kisan-dark mb-1">Area / Landmark *</label>
              <input
                type="text"
                required
                value={form.address_line}
                onChange={(e) => setForm({ ...form, address_line: e.target.value })}
                placeholder="e.g. Kondapur Main Road, Hyderabad"
                className="w-full px-3 py-2 text-xs border border-kisan-border rounded-xl"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-kisan-primary hover:bg-kisan-dark text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Creating...' : 'Create Community & Generate ID'}</span>
            </button>
          </form>
        )}

        {tab === 'code' && (
          <form onSubmit={handleJoinByCode} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-kisan-dark mb-1">Enter Community ID / Invite Code *</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. KD-A1B2C"
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-mono font-bold uppercase border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-kisan-primary hover:bg-kisan-dark text-white text-xs font-bold rounded-xl shadow-md"
            >
              {submitting ? 'Joining...' : 'Join with Code'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CommunityJoinCreateModal;
