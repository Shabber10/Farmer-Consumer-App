import React from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigation } from '../../contexts/NavigationContext';
import brandLogo from '../../assets/images/kisan_direct_brand_logo.png';
import appLogo from '../../assets/images/app_logo.png';

const MobileHeader = ({ title, showBack = false }) => {
  const location = useLocation();
  const { role } = useAuth();
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

        <div className="w-12 flex items-center justify-end flex-shrink-0">
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
    </header>
  );
};

export default MobileHeader;
