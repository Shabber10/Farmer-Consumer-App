import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { CartProvider } from './contexts/CartContext';
import { BackgroundProvider } from './contexts/BackgroundContext';
import { NavigationProvider } from './contexts/NavigationContext';

// Mobile-First Architecture Shared Infrastructure
import {
  MobilePhoneFrame,
  MobileHeader,
  MobileBottomNav,
  ProtectedRoute,
} from './shared';

// Onboarding & Auth Domain Pages
import {
  LanguageSelectPage,
  RoleSelectPage,
  LoginPage,
  FarmerRegisterPage,
  BuyerRegisterPage,
  VerifyEmailPage,
} from './auth';

// Farmer Domain Pages
import {
  FarmerDashboard,
  FarmerProducts,
  AddProductPage,
  FarmerOrders,
  FarmerEarnings,
  FarmerProfile,
  FarmerReviews,
  FarmerCommunities,
} from './farmer';

// Consumer Domain Pages
import {
  MarketplaceHome,
  CategoriesPage,
  ProductDetailPage,
  CartPage,
  CheckoutPage,
  OrderSuccessPage,
  MyOrdersPage,
  BuyerProfilePage,
  CommunityPage,
} from './consumer';

// Admin Domain Pages
import { AdminDashboard } from './admin';

// Root redirect handler based on auth state
const RootRedirect = () => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kisan-bg">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-kisan-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to={role === 'farmer' ? '/farmer' : '/buyer'} replace />;
  }

  return <Navigate to="/select-language" replace />;
};

function AppContent() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Keep focused text inputs visible above the soft keyboard without jumping the whole screen
  useEffect(() => {
    let focusTimer = null;
    let blurTimer = null;

    const isTextField = (el) => {
      if (!el || !el.tagName) return false;
      const tag = el.tagName.toUpperCase();
      if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if (tag === 'INPUT') {
        const type = (el.getAttribute('type') || 'text').toLowerCase();
        return !['checkbox', 'radio', 'button', 'submit', 'file', 'hidden'].includes(type);
      }
      return false;
    };

    const handleFocusIn = (e) => {
      if (!isTextField(e.target)) return;
      clearTimeout(blurTimer);
      setKeyboardOpen(true);
      clearTimeout(focusTimer);
      focusTimer = setTimeout(() => {
        try {
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch {}
      }, 220);
    };

    const handleFocusOut = () => {
      clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        if (!isTextField(document.activeElement)) {
          setKeyboardOpen(false);
        }
      }, 150);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    return () => {
      clearTimeout(focusTimer);
      clearTimeout(blurTimer);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const isAuthOrOnboarding = [
    '/select-language',
    '/select-role',
    '/login',
    '/register/farmer',
    '/register/buyer',
    '/verify-email'
  ].includes(location.pathname);

  return (
    <MobilePhoneFrame>
      <div className="flex flex-col min-h-screen min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-kisan-bg text-kisan-text">
        {!isAuthOrOnboarding ? (
          <MobileHeader />
        ) : (
          <div className="notranslate sticky top-0 z-30 flex justify-end px-4 pt-3 pb-1 bg-transparent">
            <div className="flex items-center bg-white/95 backdrop-blur-md rounded-full p-0.5 border border-kisan-border shadow-sm">
              {[
                { code: 'en', label: 'EN' },
                { code: 'te', label: 'TE' },
                { code: 'hi', label: 'HI' },
              ].map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => setLanguage(opt.code)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black transition-all ${
                    language === opt.code
                      ? 'bg-kisan-primary text-white shadow-xs'
                      : 'text-kisan-primary hover:bg-emerald-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <main className={`flex-1 flex flex-col w-full max-w-full min-w-0 overflow-x-hidden ${keyboardOpen ? 'pb-[45vh]' : isAuthenticated ? 'pb-24 sm:pb-28' : 'pb-0'}`}>
          <Routes>
          {/* Landing / Root */}
          <Route path="/" element={<RootRedirect />} />

          {/* Onboarding & Authentication */}
          <Route path="/select-language" element={<LanguageSelectPage />} />
          <Route path="/select-role" element={<RoleSelectPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/farmer" element={<FarmerRegisterPage />} />
          <Route path="/register/buyer" element={<BuyerRegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Farmer Protected Routes */}
          <Route path="/farmer" element={
            <ProtectedRoute requiredRole="farmer">
              <FarmerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/farmer/products" element={
            <ProtectedRoute requiredRole="farmer">
              <FarmerProducts />
            </ProtectedRoute>
          } />
          <Route path="/farmer/add-product" element={
            <ProtectedRoute requiredRole="farmer">
              <AddProductPage />
            </ProtectedRoute>
          } />
          <Route path="/farmer/orders" element={
            <ProtectedRoute requiredRole="farmer">
              <FarmerOrders />
            </ProtectedRoute>
          } />
          <Route path="/farmer/earnings" element={
            <ProtectedRoute requiredRole="farmer">
              <FarmerEarnings />
            </ProtectedRoute>
          } />
          <Route path="/farmer/profile" element={
            <ProtectedRoute requiredRole="farmer">
              <FarmerProfile />
            </ProtectedRoute>
          } />
          <Route path="/farmer/reviews" element={
            <ProtectedRoute requiredRole="farmer">
              <FarmerReviews />
            </ProtectedRoute>
          } />
          <Route path="/farmer/communities" element={
            <ProtectedRoute requiredRole="farmer">
              <FarmerCommunities />
            </ProtectedRoute>
          } />

          {/* Buyer Protected Routes */}
          <Route path="/buyer" element={
            <ProtectedRoute requiredRole="buyer">
              <MarketplaceHome />
            </ProtectedRoute>
          } />
          <Route path="/buyer/categories" element={
            <ProtectedRoute requiredRole="buyer">
              <CategoriesPage />
            </ProtectedRoute>
          } />
          <Route path="/buyer/products/:slug" element={
            <ProtectedRoute requiredRole="buyer">
              <ProductDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/buyer/product/:id" element={
            <ProtectedRoute requiredRole="buyer">
              <ProductDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/buyer/cart" element={
            <ProtectedRoute requiredRole="buyer">
              <CartPage />
            </ProtectedRoute>
          } />
          <Route path="/buyer/checkout" element={
            <ProtectedRoute requiredRole="buyer">
              <CheckoutPage />
            </ProtectedRoute>
          } />
          <Route path="/buyer/order-success" element={
            <ProtectedRoute requiredRole="buyer">
              <OrderSuccessPage />
            </ProtectedRoute>
          } />
          <Route path="/buyer/orders" element={
            <ProtectedRoute requiredRole="buyer">
              <MyOrdersPage />
            </ProtectedRoute>
          } />
          <Route path="/buyer/community" element={
            <ProtectedRoute requiredRole="buyer">
              <CommunityPage />
            </ProtectedRoute>
          } />
          <Route path="/buyer/profile" element={
            <ProtectedRoute requiredRole="buyer">
              <BuyerProfilePage />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <MobileBottomNav />
    </div>
  </MobilePhoneFrame>
);
}

function App() {
  return (
    <Router>
      <NavigationProvider>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <BackgroundProvider>
                <AppContent />
              </BackgroundProvider>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </NavigationProvider>
    </Router>
  );
}

export default App;
