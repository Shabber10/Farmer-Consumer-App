import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Phone, ArrowRight, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { BackButton, PasswordInput } from '../../shared';
import api from '../../services/api';

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

  // Forgot Password Modal State
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotDevOtp, setForgotDevOtp] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleOpenForgot = () => {
    setForgotIdentifier(identifier || '');
    setForgotOtp('');
    setForgotDevOtp('');
    setForgotNewPass('');
    setForgotConfirmPass('');
    setForgotError('');
    setForgotSuccess('');
    setForgotStep(1);
    setShowForgot(true);
  };

  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    setForgotError('');
    try {
      setForgotLoading(true);
      const res = await api.post('/api/auth/forgot-password', { identifier: forgotIdentifier });
      setForgotDevOtp(res.data.dev_otp || '');
      if (res.data.dev_otp) setForgotOtp(res.data.dev_otp);
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.error || 'Could not send reset OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (forgotNewPass.length < 6) {
      setForgotError('New password must be at least 6 characters');
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setForgotError('Passwords do not match');
      return;
    }
    try {
      setForgotLoading(true);
      const res = await api.post('/api/auth/reset-password', {
        identifier: forgotIdentifier,
        otp: forgotOtp,
        new_password: forgotNewPass,
        confirm_password: forgotConfirmPass,
      });
      setForgotSuccess(res.data.message || 'Password updated! You can now log in.');
      setIdentifier(forgotIdentifier);
      setPassword('');
      setTimeout(() => {
        setShowForgot(false);
      }, 1500);
    } catch (err) {
      setForgotError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

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
              <button
                type="button"
                onClick={handleOpenForgot}
                className="text-[11px] text-kisan-primary hover:underline font-semibold"
              >
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

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-kisan-dark">Reset Password</h3>
              <button type="button" onClick={() => setShowForgot(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-kisan-danger">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs text-emerald-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{forgotSuccess}</span>
              </div>
            ) : forgotStep === 1 ? (
              <form onSubmit={handleSendResetOtp} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-kisan-text mb-1">Registered Email or Mobile</label>
                  <input
                    type="text"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="Enter your email or 10-digit mobile"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-kisan-border rounded-xl focus:outline-none focus:border-kisan-primary"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-kisan-primary text-white py-2.5 rounded-xl font-bold disabled:opacity-50"
                >
                  {forgotLoading ? 'Sending OTP...' : 'Send Reset OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
                {forgotDevOtp && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 font-semibold">
                    Verification OTP: <span className="font-mono font-black">{forgotDevOtp}</span>
                  </div>
                )}
                <div>
                  <label className="block font-bold text-kisan-text mb-1">6-Digit OTP</label>
                  <input
                    type="text"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-3 py-2 bg-gray-50 border border-kisan-border rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-kisan-text mb-1">New Password</label>
                  <PasswordInput
                    value={forgotNewPass}
                    onChange={(e) => setForgotNewPass(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 bg-gray-50 border border-kisan-border rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-kisan-text mb-1">Confirm New Password</label>
                  <PasswordInput
                    value={forgotConfirmPass}
                    onChange={(e) => setForgotConfirmPass(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 bg-gray-50 border border-kisan-border rounded-xl"
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="flex-1 py-2.5 border border-gray-300 rounded-xl font-bold text-gray-600"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 bg-kisan-primary text-white rounded-xl font-bold disabled:opacity-50"
                  >
                    {forgotLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
