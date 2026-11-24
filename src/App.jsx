import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { CartProvider } from './contexts/CartContext';
import { BackgroundProvider } from './contexts/BackgroundContext';
import { NavigationProvider } from './contexts/NavigationContext';

// Mobile-First Architecture Components
import MobilePhoneFrame from './components/mobile/MobilePhoneFrame';
import MobileHeader from './components/mobile/MobileHeader';
import MobileBottomNav from './components/mobile/MobileBottomNav';
import ProtectedRoute from './components/common/ProtectedRoute';

// Onboarding & Auth Pages
import LanguageSelectPage from './pages/onboarding/LanguageSelectPage';
import RoleSelectPage from './pages/onboarding/RoleSelectPage';
import LoginPage from './pages/auth/LoginPage';
import FarmerRegisterPage from './pages/auth/FarmerRegisterPage';
import BuyerRegisterPage from './pages/auth/BuyerRegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

// Farmer Pages
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import FarmerProducts from './pages/farmer/FarmerProducts';
import AddProductPage from './pages/farmer/AddProductPage';
import FarmerOrders from './pages/farmer/FarmerOrders';
import FarmerEarnings from './pages/farmer/FarmerEarnings';
import FarmerProfile from './pages/farmer/FarmerProfile';

// Buyer Pages
import MarketplaceHome from './pages/buyer/MarketplaceHome';
import CategoriesPage from './pages/buyer/CategoriesPage';
import ProductDetailPage from './pages/buyer/ProductDetailPage';
import CartPage from './pages/buyer/CartPage';
import CheckoutPage from './pages/buyer/CheckoutPage';
import OrderSuccessPage from './pages/buyer/OrderSuccessPage';
import MyOrdersPage from './pages/buyer/MyOrdersPage';
import BuyerProfilePage from './pages/buyer/BuyerProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

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
      <div className="flex flex-col min-h-screen min-h-[100dvh] w-full bg-kisan-bg text-kisan-text">
        {!isAuthOrOnboarding && <MobileHeader />}
        <main className={`flex-1 flex flex-col w-full ${isAuthenticated ? 'pb-16 md:pb-4' : 'pb-0'}`}>
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
