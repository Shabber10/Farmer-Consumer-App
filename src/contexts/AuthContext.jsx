import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kd_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('kd_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('kd_token');
      if (storedToken) {
        try {
          const res = await api.get('/api/auth/me');
          setUser(res.data.user);
          localStorage.setItem('kd_user', JSON.stringify(res.data.user));
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, []);

  const login = async (identifier, password) => {
    try {
      const res = await api.post('/api/auth/login', { identifier, password });
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('kd_token', newToken);
      localStorage.setItem('kd_user', JSON.stringify(newUser));
      return newUser;
    } catch (err) {
      if (err.response?.data?.needs_verification) {
        return {
          needs_verification: true,
          email: err.response.data.email,
          role: err.response.data.role,
          dev_otp: err.response.data.dev_otp
        };
      }
      throw err;
    }
  };

  const register = async (registerData) => {
    const res = await api.post('/api/auth/register', registerData);
    const { token: newToken, user: newUser, dev_otp, needs_verification } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('kd_token', newToken);
    localStorage.setItem('kd_user', JSON.stringify(newUser));
    return { ...newUser, dev_otp, needs_verification };
  };

  const sendVerificationOtp = async (email) => {
    const res = await api.post('/api/auth/send-verification-otp', { email });
    return res.data;
  };

  const verifyEmail = async (email, otp) => {
    const res = await api.post('/api/auth/verify-email-otp', { email, otp });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('kd_token', newToken);
    localStorage.setItem('kd_user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('kd_token');
    localStorage.removeItem('kd_user');
    try {
      api.post('/api/auth/logout');
    } catch (e) {}
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const nextUser = { ...prev, ...updatedData };
      localStorage.setItem('kd_user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      role: user?.role || null,
      isAuthenticated: !!token && !!user,
      loading,
      login,
      register,
      logout,
      updateUser,
      verifyEmail,
      sendVerificationOtp
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
