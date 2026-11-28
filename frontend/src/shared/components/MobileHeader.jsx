import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Bell, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigation } from '../../contexts/NavigationContext';
import api from '../../services/api';
import brandLogo from '../../assets/images/kisan_direct_brand_logo.png';
import appLogo from '../../assets/images/app_logo.png';

const MobileHeader = ({ title, showBack = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, isAuthenticated } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { goBack, isRootRoute } = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !['buyer', 'farmer'].includes(role)) return;
    let active = true;
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/api/notifications');
        if (!active) return;
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      } catch {
        // ignore polling error
      }
    };
    fetchNotifs();
    const timer = setInterval(fetchNotifs, 20000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [isAuthenticated, role, location.pathname]);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/api/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  };

  const isRoot = isRootRoute(location.pathname);
  const canGoBack = showBack || !isRoot;

  const cycleLang = () => {
    if (language === 'en') setLanguage('te');
    else if (language === 'te') setLanguage('hi');
    else setLanguage('en');
  };

  return (
    <header 
      className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-kisan-border shadow-sm transition-all"
      style={{
        paddingTop: 'max(0.625rem, env(safe-area-inset-top, 0px))',
        paddingBottom: '0.625rem',
        paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))'
      }}
    >
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
        <div className="w-12 flex items-center justify-start flex-shrink-0">
          {canGoBack && !isRoot ? (
            <button
              type="button"
              onClick={() => goBack()}
              className="p-1.5 -ml-1 text-kisan-dark hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors tap-effect flex-shrink-0 border border-kisan-border/60 bg-gray-50/80 shadow-2xs"
              aria-label="Back"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5 text-kisan-dark stroke-[2.25]" />
            </button>
          ) : (
            <img src={appLogo} alt="Logo" className="w-8 h-8 rounded-xl object-contain shadow-xs flex-shrink-0" />
          )}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-1 min-w-0">
          {title ? (
            <>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-xs sm:text-sm font-black text-kisan-dark leading-tight truncate">
                  {title}
                </h1>
              </div>
              <p className="text-[10px] text-kisan-muted font-semibold leading-none truncate mt-0.5">
                {role === 'farmer' ? t('sellerPortal') : role === 'buyer' ? t('farmFreshSubtitle') : t('mobilePlatform')}
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <img src={brandLogo} alt="KisanDirect" className="h-5 sm:h-6 w-auto object-contain" />
              <p className="text-[9px] text-kisan-muted font-semibold leading-none tracking-tight mt-0.5">
                {role === 'farmer' ? t('farmerSellerPortal') : t('farmFreshMarketplace')}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-1.5 flex-shrink-0">
          {isAuthenticated && ['buyer', 'farmer'].includes(role) && (
            <button
              type="button"
              onClick={() => setShowNotifs((v) => !v)}
              className="relative p-1.5 rounded-full bg-kisan-light text-kisan-primary border border-kisan-secondary/30 tap-effect"
              aria-label="Notifications"
            >
              <Bell className="w-3.5 h-3.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}
          {/* Quick Language Toggle Pill */}
          <button
            onClick={cycleLang}
            className="flex items-center space-x-1 bg-kisan-light text-kisan-primary text-[10px] font-black px-2.5 py-1 rounded-full border border-kisan-secondary/30 tap-effect flex-shrink-0"
            title="Switch Language (EN / TE / HI)"
          >
            <Globe className="w-3 h-3" />
            <span>{language.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {showNotifs && isAuthenticated && ['buyer', 'farmer'].includes(role) && (
        <div className="max-w-md ml-auto mt-2 bg-white rounded-2xl border border-kisan-border shadow-xl p-3 space-y-2 text-left">
          <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
            <span className="text-xs font-extrabold text-kisan-dark">
              {role === 'farmer' ? 'Farm Order & Campaign Alerts' : 'Apartment & Order Alerts'}
            </span>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button type="button" onClick={handleMarkAllRead} className="text-[10px] font-bold text-kisan-primary">
                  Mark all read
                </button>
              )}
              <button type="button" onClick={() => setShowNotifs(false)} className="text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {notifications.length === 0 ? (
            <p className="text-[11px] text-kisan-muted py-2 text-center">No notifications yet</p>
          ) : (
            <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
              {notifications.slice(0, 8).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    setShowNotifs(false);
                    if (!n.is_read) {
                      api.patch(`/api/notifications/${n.id}/read`).catch(() => {});
                      setUnreadCount((c) => Math.max(0, c - 1));
                    }
                    navigate(role === 'farmer' ? '/farmer/orders' : '/buyer/community');
                  }}
                  className={`w-full text-left py-2 px-1.5 rounded-lg ${n.is_read ? 'opacity-70' : 'bg-emerald-50/60'}`}
                >
                  <p className="text-[11px] font-extrabold text-kisan-dark">{n.title}</p>
                  <p className="text-[10px] text-kisan-muted mt-0.5">{n.message}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default MobileHeader;
