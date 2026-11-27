import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, ShoppingBag, PlusCircle, Package, User, Layers, ShoppingCart, ShieldCheck, ArrowRight, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';

const MobileBottomNav = () => {
  const { isAuthenticated, role } = useAuth();
  const { t } = useLanguage();
  const { itemCount, totalAmount, subtotal } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDismissed, setIsDismissed] = useState(false);
  const prevCountRef = useRef(itemCount);

  // Re-open floating banner if user adds more items to cart
  useEffect(() => {
    if (itemCount > prevCountRef.current) {
      setIsDismissed(false);
    }
    prevCountRef.current = itemCount;
  }, [itemCount]);

  if (!isAuthenticated) return null;

  if (role === 'farmer') {
    return (
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-kisan-border px-3 pt-2 shadow-lg"
        style={{
          paddingBottom: 'max(0.875rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))',
          paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))'
        }}
      >
        <div className="w-full max-w-xl mx-auto flex items-center justify-around">
          <NavLink
            to="/farmer"
            end
            className={({ isActive }) =>
              `flex flex-col items-center tap-effect ${isActive ? 'text-kisan-primary font-bold' : 'text-kisan-muted'}`
            }
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t('home')}</span>
          </NavLink>

          <NavLink
            to="/farmer/products"
            className={({ isActive }) =>
              `flex flex-col items-center tap-effect ${isActive ? 'text-kisan-primary font-bold' : 'text-kisan-muted'}`
            }
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t('myProducts')}</span>
          </NavLink>

          <button
            onClick={() => navigate('/farmer/add-product')}
            className="w-12 h-12 -mt-5 bg-kisan-primary hover:bg-kisan-dark text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white tap-effect"
            title="Add Produce"
          >
            <PlusCircle className="w-6 h-6" />
          </button>

          <NavLink
            to="/farmer/orders"
            className={({ isActive }) =>
              `flex flex-col items-center tap-effect ${isActive ? 'text-kisan-primary font-bold' : 'text-kisan-muted'}`
            }
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t('orders')}</span>
          </NavLink>

          <NavLink
            to="/farmer/profile"
            className={({ isActive }) =>
              `flex flex-col items-center tap-effect ${isActive ? 'text-kisan-primary font-bold' : 'text-kisan-muted'}`
            }
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t('profile')}</span>
          </NavLink>
        </div>
      </nav>
    );
  }

  if (role === 'buyer') {
    const isCartOrCheckout = ['/buyer/cart', '/buyer/checkout'].includes(location.pathname);

    return (
      <>
        {/* Floating Mini Cart Notification Pill with Dismiss (Cross) Button & Animation */}
        {itemCount > 0 && !isCartOrCheckout && !isDismissed && (
          <div className="fixed bottom-20 left-0 right-0 z-40 px-3.5 max-w-lg mx-auto pointer-events-none animate-slide-up transition-all duration-300">
            <div
              onClick={() => navigate('/buyer/cart')}
              className="pointer-events-auto bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-950 text-white rounded-2xl px-3.5 py-2.5 shadow-xl border border-emerald-600/40 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center text-emerald-300 font-bold flex-shrink-0">
                  <ShoppingCart className="w-4 h-4 animate-bounce" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black leading-tight text-white truncate">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
                  </p>
                  <p className="text-[10px] text-emerald-300 font-bold truncate">
                    ₹{(totalAmount || subtotal || 0).toFixed(0)} • Tap to view cart
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                <div className="flex items-center space-x-1 bg-white text-emerald-900 text-xs font-black px-3 py-1.5 rounded-xl shadow-xs hover:bg-emerald-50 active:scale-95 transition-transform">
                  <span>View Cart</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>

                {/* Close (Cross) Button to dismiss overlapping banner */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDismissed(true);
                  }}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 flex items-center justify-center text-emerald-200 hover:text-white transition-all tap-effect"
                  title="Dismiss cart banner"
                  aria-label="Dismiss cart banner"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        )}

        <nav 
          className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-kisan-border px-3 pt-2 shadow-lg"
          style={{
            paddingBottom: 'max(0.875rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))'
          }}
        >
          <div className="w-full max-w-xl mx-auto flex items-center justify-around">
            <NavLink
              to="/buyer"
              end
              className={({ isActive }) =>
                `flex flex-col items-center tap-effect ${isActive ? 'text-emerald-700 font-bold' : 'text-gray-400 hover:text-gray-600'}`
              }
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t('home')}</span>
            </NavLink>

            <NavLink
              to="/buyer/categories"
              className={({ isActive }) =>
                `flex flex-col items-center tap-effect ${isActive ? 'text-emerald-700 font-bold' : 'text-gray-400 hover:text-gray-600'}`
              }
            >
              <Layers className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t('categories')}</span>
            </NavLink>

            <NavLink
              to="/buyer/cart"
              className={({ isActive }) =>
                `flex flex-col items-center relative tap-effect ${isActive ? 'text-emerald-700 font-bold' : 'text-gray-400 hover:text-gray-600'}`
              }
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-emerald-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5">{t('cart')}</span>
            </NavLink>

            <NavLink
              to="/buyer/orders"
              className={({ isActive }) =>
                `flex flex-col items-center tap-effect ${isActive ? 'text-emerald-700 font-bold' : 'text-gray-400 hover:text-gray-600'}`
              }
            >
              <Package className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{t('orders')}</span>
            </NavLink>

            <NavLink
              to="/buyer/profile"
              className={({ isActive }) =>
                `flex flex-col items-center tap-effect ${isActive ? 'text-emerald-700 font-bold' : 'text-gray-400 hover:text-gray-600'}`
              }
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t('profile')}</span>
            </NavLink>
          </div>
        </nav>
      </>
    );
  }

  // Admin
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-purple-900 text-white px-3 pt-2 shadow-lg"
      style={{
        paddingBottom: 'max(0.875rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))'
      }}
    >
      <div className="w-full max-w-xl mx-auto flex items-center justify-around">
        <NavLink
          to="/admin"
          className="flex flex-col items-center text-purple-200 hover:text-white"
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-bold">Admin Console</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
