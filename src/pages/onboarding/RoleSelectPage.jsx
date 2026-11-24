import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sprout, ShoppingBag, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import BackButton from '../../components/common/BackButton';
import PageBackground from '../../components/common/PageBackground';
import bg2 from '../../assets/images/bg2_hd.jpg';

const RoleSelectPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('farmer');

  const handleContinue = () => {
    if (selectedRole === 'farmer') {
      navigate('/register/farmer');
    } else {
      navigate('/register/buyer');
    }
  };

  return (
    <div 
      className="min-h-screen min-h-[100dvh] relative flex flex-col justify-between w-full max-w-md mx-auto px-4 sm:px-6"
      style={{
        paddingTop: 'max(1.5rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))'
      }}
    >
      <PageBackground image={bg2} />
      {/* Top Header with Centered KisanDirect and Left Back Button */}
      <div className="pt-2 sm:pt-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="w-16 flex-shrink-0">
            <BackButton fallbackPath="/select-language" label="Back" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-kisan-primary text-white flex items-center justify-center shadow-md border border-white/20">
              <Sprout className="w-4 h-4" />
            </div>
            <span className="text-base font-black text-kisan-dark tracking-tight">
              {t('appName')}
            </span>
          </div>
          <div className="w-16 flex-shrink-0" />
        </div>
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-extrabold text-kisan-dark">
            {t('joinAs')}
          </h1>
          <p className="text-xs text-kisan-muted mt-0.5">
            Choose your account role to proceed
          </p>
        </div>
      </div>

      {/* Role Cards */}
      <div className="space-y-3 sm:space-y-4 my-auto py-3 overflow-y-auto max-h-[60vh] sm:max-h-none no-scrollbar">
        {/* Farmer Card */}
        <div
          onClick={() => setSelectedRole('farmer')}
          className={`
            cursor-pointer p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 relative overflow-hidden bg-white tap-effect
            ${selectedRole === 'farmer'
              ? 'border-kisan-primary ring-2 ring-kisan-light shadow-card'
              : 'border-kisan-border hover:border-kisan-secondary/50'
            }
          `}
        >
          <div className="flex items-start space-x-3.5 sm:space-x-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <Sprout className="w-6 h-6 sm:w-7 sm:h-7 text-kisan-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-kisan-dark">{t('farmer')}</h3>
              <p className="text-[11px] sm:text-xs text-kisan-muted mt-1 leading-relaxed">
                {t('farmerDesc')}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-kisan-primary">
                <span>Direct Marketplace</span>
                <span>•</span>
                <span>Zero Middlemen</span>
                <span>•</span>
                <span>Live Orders</span>
              </div>
            </div>
          </div>
        </div>

        {/* Buyer Card */}
        <div
          onClick={() => setSelectedRole('buyer')}
          className={`
            cursor-pointer p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 relative overflow-hidden bg-white tap-effect
            ${selectedRole === 'buyer'
              ? 'border-kisan-primary ring-2 ring-kisan-light shadow-card'
              : 'border-kisan-border hover:border-kisan-secondary/50'
            }
          `}
        >
          <div className="flex items-start space-x-3.5 sm:space-x-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-kisan-dark">{t('buyer')}</h3>
              <p className="text-[11px] sm:text-xs text-kisan-muted mt-1 leading-relaxed">
                {t('buyerDesc')}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-amber-700">
                <span>Farm Fresh</span>
                <span>•</span>
                <span>Verified Farmers</span>
                <span>•</span>
                <span>Home Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 pb-1 sm:pb-2 space-y-2.5 flex-shrink-0">
        <button
          onClick={handleContinue}
          className="w-full bg-kisan-primary text-white py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center space-x-2 shadow-card hover:bg-kisan-dark transition-all duration-200 active:scale-[0.99] tap-effect"
        >
          <span>Next</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="text-center pt-0.5">
          <Link to="/login" className="text-xs font-semibold text-kisan-primary hover:underline">
            {t('alreadyHaveAccount')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectPage;
