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

  // Strict parent hierarchy for onboarding / auth flow to eliminate loops
  const AUTH_PARENT_ROUTES = {
    '/select-language': null,
    '/login': '/select-language',
    '/select-role': '/login',
    '/register/farmer': '/select-role',
    '/register/buyer': '/select-role',
    '/verify-email': '/login'
  };

  // Compute smart fallback path based on current pathname when history is empty
  const getSmartFallback = useCallback((currentPath) => {
    if (currentPath === '/register/farmer' || currentPath === '/register/buyer') return '/select-role';
    if (currentPath === '/select-role') return '/login';
    if (currentPath === '/login') return '/select-language';
    if (currentPath.startsWith('/buyer/product') || currentPath === '/buyer/categories' || currentPath === '/buyer/cart') return '/buyer';
    if (currentPath === '/buyer/checkout') return '/buyer/cart';
    if (currentPath === '/buyer/orders' || currentPath === '/buyer/profile' || currentPath === '/buyer/order-success') return '/buyer';
    if (currentPath.startsWith('/farmer/') && currentPath !== '/farmer') return '/farmer';
    return null;
  }, []);

  const isRootRoute = useCallback((path) => {
    return ['/farmer', '/buyer', '/admin', '/select-language'].includes(path);
  }, []);

  const goBack = useCallback((explicitFallback) => {
    // 1. Check if any custom handler consumes this back event (LIFO order, e.g. multi-step form)
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

    const currentPath = location.pathname;

    // 2. Check if we're on a root route
    if (isRootRoute(currentPath)) {
      if (Capacitor.isNativePlatform()) {
        CapApp.exitApp();
      }
      return;
    }

    // 3. Strict Deterministic Hierarchy for Onboarding / Auth flow
    // Eliminates infinite ping-pong loops (e.g. login <-> select-role <-> register)
    if (currentPath in AUTH_PARENT_ROUTES) {
      const parentRoute = explicitFallback || AUTH_PARENT_ROUTES[currentPath];
      if (!parentRoute) {
        if (Capacitor.isNativePlatform()) {
          CapApp.exitApp();
        }
        return;
      }
      navigate(parentRoute, { replace: true });
      return;
    }

    // 4. Authenticated flow: use explicit fallback if provided
    if (explicitFallback) {
      navigate(explicitFallback, { replace: true });
      return;
    }

    // 5. Normal navigation: try browser history back if available
    const hasHistory = window.history.state && window.history.state.idx > 0;
    if (hasHistory) {
      navigate(-1);
    } else {
      const targetFallback = getSmartFallback(currentPath) || '/';
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
