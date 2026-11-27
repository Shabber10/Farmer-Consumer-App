import axios from 'axios';
import { Capacitor } from '@capacitor/core';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // When running inside native Android APK
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    const customBackend = localStorage.getItem('kd_backend_url');
    if (customBackend) return customBackend;
    // Default to local emulator backend 10.0.2.2:5050
    return 'http://10.0.2.2:5050';
  }
  return '';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    config.baseURL = getBaseUrl();
    const token = localStorage.getItem('kd_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if trying to login
      if (!error.config.url.includes('/api/auth/login')) {
        localStorage.removeItem('kd_token');
        localStorage.removeItem('kd_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
