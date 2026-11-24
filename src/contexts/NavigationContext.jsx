import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

const NavigationContext = createContext(null);

export const NavigationProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Stack of custom back handlers (e.g. multi-step forms, modals)
  // Each handler returns true if it consumed the event, or false to continue
  const customHandlersRef = useRef([]);

  const registerBackAction = useCallback((handler) => {
    customHandlersRef.current.push(handler);
    return () => {
      customHandlersRef.current = customHandlersRef.current.filter((h) => h !== handler);
    };
  }, []);

  // Compute smart fallback path based on current pathname when history is empty
  const getSmartFallback = useCallback((currentPath) => {
    if (currentPath === '/select-role') return '/select-language';
    if (currentPath === '/login') return '/select-role';
    if (currentPath === '/register/farmer' || currentPath === '/register/buyer') return '/login';
    if (currentPath.startsWith('/buyer/product') || currentPath === '/buyer/categories' || currentPath === '/buyer/cart') return '/buyer';
    if (currentPath === '/buyer/checkout') return '/buyer/cart';
    if (currentPath === '/buyer/orders' || currentPath === '/buyer/profile' || currentPath === '/buyer/order-success') return '/buyer';
    if (currentPath.startsWith('/farmer/') && currentPath !== '/farmer') return '/farmer';
    return null;
  }, []);

  const isRootRoute = useCallback((path) => {
    return ['/farmer', '/buyer', '/admin', '/select-language'].includes(path);
  }, []);

  const goBack = useCallback((fallbackPath) => {
    // 1. Check if any custom handler consumes this back event (LIFO order)
    if (customHandlersRef.current.length > 0) {
      for (let i = customHandlersRef.current.length - 1; i >= 0; i--) {
        const handler = customHandlersRef.current[i];
        try {
          const handled = handler();
          if (handled) return; // consumed by active custom handler
        } catch (e) {
          console.warn('Back action handler error:', e);
        }
      }
    }

    // 2. Check if we're on a root route
    if (isRootRoute(location.pathname)) {
      if (Capacitor.isNativePlatform()) {
        CapApp.exitApp();
      }
      return;
    }

    // 3. Normal navigation: try browser history back if available
    const hasHistory = window.history.state && window.history.state.idx > 0;
    if (hasHistory) {
      navigate(-1);
    } else {
      const targetFallback = fallbackPath || getSmartFallback(location.pathname) || '/';
      navigate(targetFallback, { replace: true });
    }
  }, [navigate, location.pathname, isRootRoute, getSmartFallback]);

  // Listen to native hardware back button via Capacitor App plugin
  useEffect(() => {
    let backListener = null;

    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('backButton', () => {
        goBack();
      }).then((listener) => {
        backListener = listener;
      }).catch((err) => {
        console.warn('Capacitor backButton listener init warning:', err);
      });
    }

    return () => {
      if (backListener && typeof backListener.remove === 'function') {
        backListener.remove();
      }
    };
  }, [goBack]);

  return (
    <NavigationContext.Provider value={{ goBack, registerBackAction, isRootRoute }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
