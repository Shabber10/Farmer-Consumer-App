import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { BackButton, PasswordInput } from '../../shared';

// Background Image & Brand Assets
import bg1 from '../../assets/images/bg1_hd.jpg';
import brandLogo from '../../assets/images/kisan_direct_brand_logo.png';

const LoginPage = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectBg = (img) => {
    setSelectedBg(img);
    localStorage.setItem('kisan_login_bg', img);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier || !password) {
      setError('Please enter your email or mobile number and password');
      return;
    }

    try {
      setLoading(true);
      const user = await login(identifier, password);
      if (user?.needs_verification) {
        navigate('/verify-email', {
          state: {
            email: user.email || identifier,
            role: user.role,
            dev_otp: user.dev_otp
          }
        });
        return;
      }

      if (user.role === 'farmer') {
        navigate('/farmer');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/buyer');
      }
    } catch (err) {
      if (err.response?.data?.needs_verification) {
        navigate('/verify-email', {
          state: {
            email: err.response.data.email || identifier,
            role: err.response.data.role,
            dev_otp: err.response.data.dev_otp
          }
        });
        return;
      }
      setError(err.response?.data?.error || 'Failed to login. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (ident, pass) => {
    setIdentifier(ident);
    setPassword(pass);
    try {
      setLoading(true);
      const user = await login(ident, pass);
      if (user.role === 'farmer') {
        navigate('/farmer');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/buyer');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed demo login');
    } finally {
      setLoading(false);
    }
  };

  const isEmailInput = identifier.includes('@');

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full relative flex flex-col justify-start sm:justify-center items-center px-3.5 sm:px-6 py-4 sm:py-6 bg-cover bg-center bg-no-repeat overflow-y-auto overflow-x-hidden"
      style={{
        backgroundImage: `url(${bg1})`,
        paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))',
        paddingLeft: 'max(0.875rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.875rem, env(safe-area-inset-right, 0px))'
      }}
    >
      {/* Background Dimmer Overlay - Zero Blur for 100% Crisp Visual Fidelity */}
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />

      {/* Top Brand Bar with Centered KisanDirect and Left Back Button */}
      <div className="relative z-10 w-full max-w-md pt-2 mb-2 flex items-center justify-between">
        <div className="w-16 flex-shrink-0">
          <BackButton fallbackPath="/select-language" label="Back" />
        </div>
        <div className="flex items-center space-x-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-white/50">
          <img src={brandLogo} alt="KisanDirect" className="h-5 sm:h-6 w-auto object-contain" />
        </div>
        <div className="w-16 flex-shrink-0" />
      </div>

      {/* Center Auth Card with Frosted Glass */}
      <div className="relative z-10 w-full max-w-md my-auto bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/60 shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-kisan-dark">{t('login')}</h2>
          <p className="text-xs text-kisan-muted mt-1">{t('tagline')}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-kisan-danger">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-kisan-text mb-1">
              {t('emailOrMobileLabel')}
            </label>
            <div className="relative">
              {isEmailInput ? (
                <Mail className="w-4 h-4 text-kisan-muted absolute left-3.5 top-3.5" />
              ) : (
                <Phone className="w-4 h-4 text-kisan-muted absolute left-3.5 top-3.5" />
              )}
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={t('emailOrMobilePlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/90 border border-kisan-border rounded-xl text-xs text-kisan-dark focus:outline-none focus:border-kisan-primary focus:bg-white transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-kisan-text">{t('password')}</label>
              <button type="button" className="text-[11px] text-kisan-primary hover:underline font-semibold">
                {t('forgotPassword')}
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-kisan-muted absolute left-3.5 top-3.5 z-10 pointer-events-none" />
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('enterPassword')}
                className="w-full pl-10 py-2.5 bg-gray-50/90 border border-kisan-border rounded-xl text-xs text-kisan-dark focus:outline-none focus:border-kisan-primary focus:bg-white transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-kisan-primary text-white py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md hover:bg-kisan-dark transition-all disabled:opacity-50 tap-effect"
          >
            <span>{loading ? t('loggingIn') : t('login')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Create Account Link */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <Link to="/select-role" className="text-xs font-bold text-kisan-primary hover:underline">
            {t('dontHaveAccount')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
