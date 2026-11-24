import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, ShoppingBag, PlusCircle, Package, User, Layers, ShoppingCart, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';

const MobileBottomNav = () => {
  const { isAuthenticated, role } = useAuth();
  const { t } = useLanguage();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  if (role === 'farmer') {
    return (
      <nav 
        className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-kisan-border px-3 pt-2 shadow-lg"
        style={{
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
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
    return (
      <nav 
        className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-kisan-border px-3 pt-2 shadow-lg"
        style={{
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
          paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))'
        }}
      >
        <div className="w-full max-w-xl mx-auto flex items-center justify-around">
          <NavLink
            to="/buyer"
            end
            className={({ isActive }) =>
              `flex flex-col items-center tap-effect ${isActive ? 'text-kisan-primary font-bold' : 'text-kisan-muted'}`
            }
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t('home')}</span>
          </NavLink>

          <NavLink
            to="/buyer/categories"
            className={({ isActive }) =>
              `flex flex-col items-center tap-effect ${isActive ? 'text-kisan-primary font-bold' : 'text-kisan-muted'}`
            }
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t('categories')}</span>
          </NavLink>

          <NavLink
            to="/buyer/cart"
            className={({ isActive }) =>
              `flex flex-col items-center relative tap-effect ${isActive ? 'text-kisan-primary font-bold' : 'text-kisan-muted'}`
            }
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-kisan-accent text-kisan-dark font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {itemCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">{t('cart')}</span>
          </NavLink>

          <NavLink
            to="/buyer/orders"
            className={({ isActive }) =>
              `flex flex-col items-center tap-effect ${isActive ? 'text-kisan-primary font-bold' : 'text-kisan-muted'}`
            }
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t('myOrders')}</span>
          </NavLink>

          <NavLink
            to="/buyer/profile"
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

  // Admin
  return (
    <nav 
      className="sticky bottom-0 z-40 bg-purple-900 text-white px-3 pt-2 shadow-lg"
      style={{
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
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
