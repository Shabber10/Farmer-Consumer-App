import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sprout, ArrowLeft, Globe, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigation } from '../../contexts/NavigationContext';

const MobileHeader = ({ title, showBack = false }) => {
  const location = useLocation();
  const { isAuthenticated, role, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { goBack, isRootRoute } = useNavigation();

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
        <div className="w-12 flex items-center flex-shrink-0">
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
            <div className="w-8 h-8 rounded-xl bg-kisan-primary flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Sprout className="w-5 h-5" />
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-1 min-w-0">
          <div className="flex items-center space-x-1.5">
            <h1 className="text-xs sm:text-sm font-black text-kisan-dark leading-tight truncate">
              {title || (role === 'farmer' ? t('farmerDashboard') : t('appName'))}
            </h1>
          </div>
          <p className="text-[10px] text-kisan-muted font-semibold leading-none truncate mt-0.5">
            {role === 'farmer' ? 'Seller Portal' : role === 'buyer' ? 'Farm Fresh' : 'Mobile Platform'}
          </p>
        </div>

        <div className="w-16 flex items-center justify-end space-x-1 flex-shrink-0">
          {/* Quick Language Toggle Pill */}
          <button
            onClick={cycleLang}
            className="flex items-center space-x-1 bg-kisan-light text-kisan-primary text-[10px] font-black px-2.5 py-1 rounded-full border border-kisan-secondary/30 tap-effect"
            title="Switch Language (EN / TE / HI)"
          >
            <Globe className="w-3 h-3" />
            <span>{language.toUpperCase()}</span>
          </button>

          {isAuthenticated && (
            <button
              onClick={logout}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-full tap-effect"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
