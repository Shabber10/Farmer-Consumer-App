import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Bell, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigation } from '../../contexts/NavigationContext';
import api from '../../services/api';
import { getNotificationPermission, requestNotificationPermission, sendSystemNotificationIfAllowed } from '../../utils/notificationService';
import brandLogo from '../../assets/images/kisan_direct_brand_logo.png';
import appLogo from '../../assets/images/app_logo.png';

const MobileHeader = ({ title, showBack = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, isAuthenticated, user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { goBack, isRootRoute } = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifPermission, setNotifPermission] = useState('default');

  useEffect(() => {
    if (!isAuthenticated || !['buyer', 'farmer'].includes(role)) return;
    let active = true;

    const initPerm = async () => {
      let perm = await getNotificationPermission();
      if (!active) return;
      if (perm === 'default' && !localStorage.getItem('kd_notif_prompted')) {
        localStorage.setItem('kd_notif_prompted', '1');
        perm = await requestNotificationPermission();
      }
      if (active) setNotifPermission(perm);
    };
    initPerm();

    const fetchNotifs = async () => {
      try {
        const res = await api.get('/api/notifications');
        if (!active) return;
        const list = res.data.notifications || [];
        setNotifications(list);
        setUnreadCount(res.data.unread_count || 0);

        const seenKey = `kd_seen_notif_ids_${user?.id || role}`;
        const rawSeen = localStorage.getItem(seenKey);
        if (rawSeen === null) {
          localStorage.setItem(seenKey, JSON.stringify(list.map((n) => n.id).slice(-200)));
        } else {
          let seenSet;
          try {
            seenSet = new Set(JSON.parse(rawSeen) || []);
          } catch {
            seenSet = new Set();
          }
          const unseenUnread = list.filter((n) => !n.is_read && !seenSet.has(n.id));
          if (unseenUnread.length > 0) {
            unseenUnread.forEach((n) => {
              seenSet.add(n.id);
              sendSystemNotificationIfAllowed(n.title, n.message, n.id);
            });
            localStorage.setItem(seenKey, JSON.stringify(Array.from(seenSet).slice(-200)));
          }
        }
      } catch {
        // ignore polling error
      }
    };
    fetchNotifs();
    const timer = setInterval(fetchNotifs, 10000);
    const onWake = () => {
      if (document.visibilityState !== 'hidden') fetchNotifs();
    };
    window.addEventListener('focus', onWake);
    document.addEventListener('visibilitychange', onWake);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('focus', onWake);
      document.removeEventListener('visibilitychange', onWake);
    };
  }, [isAuthenticated, role, user?.id, location.pathname]);

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
          {/* Always-visible Language Segmented Switcher (EN | TE | HI) */}
          <div
            className="notranslate flex items-center bg-kisan-light rounded-full p-0.5 border border-kisan-secondary/30 flex-shrink-0"
            role="group"
            aria-label="Language Switcher"
          >
            {[
              { code: 'en', label: 'EN' },
              { code: 'te', label: 'TE' },
              { code: 'hi', label: 'HI' },
            ].map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => setLanguage(opt.code)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-all tap-effect ${
                  language === opt.code
                    ? 'bg-kisan-primary text-white shadow-xs'
                    : 'text-kisan-primary hover:bg-emerald-100'
                }`}
                title={`Switch language to ${opt.label}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
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
          {notifPermission !== 'unsupported' && (
            <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-[10px]">
              <span className="text-kisan-muted font-semibold">
                {notifPermission === 'granted'
                  ? 'Push Alerts: Active on this device'
                  : 'Push Alerts Off — Showing in Bell icon only'}
              </span>
              {notifPermission !== 'granted' && notifPermission !== 'denied' && (
                <button
                  type="button"
                  onClick={async () => {
                    const p = await requestNotificationPermission();
                    setNotifPermission(p);
                  }}
                  className="font-extrabold text-kisan-primary hover:underline ml-2"
                >
                  Allow
                </button>
              )}
            </div>
          )}
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
