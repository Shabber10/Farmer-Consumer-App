import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowRight, RotateCw, AlertCircle, Sprout, KeyRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import BackButton from '../../components/common/BackButton';
import bg1 from '../../assets/images/bg1_hd.jpg';

const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail, sendVerificationOtp, user } = useAuth();
  const { t } = useLanguage();

  const email = location.state?.email || user?.email || '';
  const initialDevOtp = location.state?.dev_otp || '';
  const role = location.state?.role || user?.role || 'buyer';

  const [otp, setOtp] = useState(initialDevOtp || '');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [devOtpHint, setDevOtpHint] = useState(initialDevOtp || '123456');

  // Countdown timer for resending
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      const verifiedUser = await verifyEmail(email, cleanOtp);
      setSuccessMsg('Email verified successfully! Redirecting to your dashboard...');
      setTimeout(() => {
        if (verifiedUser?.role === 'farmer' || role === 'farmer') {
          navigate('/farmer', { replace: true });
        } else {
          navigate('/buyer', { replace: true });
        }
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired verification code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setError('');
    setSuccessMsg('');
    try {
      setResending(true);
      const res = await sendVerificationOtp(email);
      setSuccessMsg(`A new code was sent to ${email}`);
      if (res.dev_otp) {
        setDevOtpHint(res.dev_otp);
      }
      setCountdown(60);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full relative flex flex-col justify-center items-center px-4 py-6 sm:p-6 bg-cover bg-center bg-no-repeat overflow-y-auto"
      style={{
        backgroundImage: `url(${bg1})`,
        backgroundAttachment: 'fixed',
        paddingTop: 'max(1.5rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
      }}
    >
      {/* Background Dimmer Overlay */}
      <div className="absolute inset-0 bg-black/35 pointer-events-none" />

      {/* Top Header with Centered KisanDirect and Left Back Button */}
      <div className="relative z-10 w-full max-w-md pt-2 mb-2 flex items-center justify-between">
        <div className="w-16 flex-shrink-0">
          <BackButton fallbackPath="/login" label="Login" />
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-kisan-primary text-white flex items-center justify-center shadow-md border border-white/20">
            <Sprout className="w-4 h-4" />
          </div>
          <span className="text-base font-black text-white tracking-tight drop-shadow-md">
            {t('appName')}
          </span>
        </div>
        <div className="w-16 flex-shrink-0" />
      </div>

      {/* Verification Card */}
      <div className="relative z-10 w-full max-w-md my-6 bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/60 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center mb-3 shadow-md border border-emerald-200">
            <Mail className="w-7 h-7 text-kisan-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-kisan-dark">
            Verify Your Email
          </h1>
          <p className="text-xs text-kisan-muted mt-1 leading-relaxed">
            We sent a 6-digit verification code to
          </p>
          <p className="text-xs font-bold text-kisan-dark bg-emerald-50 border border-emerald-200 rounded-lg py-1 px-3 mt-1.5 inline-block">
            {email || 'your registered email'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-kisan-danger">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-kisan-text mb-1.5 text-center">
              Enter 6-Digit Code
            </label>
            <div className="relative max-w-xs mx-auto">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                className="w-full text-center tracking-[0.5em] text-2xl font-black py-3 px-4 bg-gray-50 border-2 border-kisan-border focus:border-kisan-primary rounded-2xl outline-none transition-all shadow-inner font-mono text-kisan-dark"
                autoFocus
              />
            </div>

            {/* Dev Autofill Shortcut */}
            {devOtpHint && (
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => setOtp(devOtpHint)}
                  className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-kisan-primary bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-3 py-1 rounded-full transition-all tap-effect"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Dev Test Code: {devOtpHint} (Click to Fill)</span>
                </button>
              </div>
            )}
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full bg-kisan-primary hover:bg-kisan-dark text-white py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 shadow-card transition-all disabled:opacity-50 tap-effect"
          >
            {loading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Verify & Access Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Resend and Switch Account */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col items-center space-y-2 text-xs">
          <div className="flex items-center space-x-1.5 text-kisan-muted">
            <span>Didn't receive the email?</span>
            {countdown > 0 ? (
              <span className="font-bold text-gray-500">Resend in {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="font-bold text-kisan-primary hover:underline"
              >
                {resending ? 'Sending...' : 'Resend Code'}
              </button>
            )}
          </div>

          <Link
            to="/login"
            className="text-xs font-semibold text-gray-500 hover:text-kisan-dark hover:underline pt-1"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
