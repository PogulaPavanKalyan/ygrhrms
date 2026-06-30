import React, { createContext, useState, useEffect, useContext } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Initialize CSRF cookie on mount and check if user session is already active
  useEffect(() => {
    const checkSessionUser = async () => {
      try {
        await authApi.getCSRF();
        const response = await authApi.getCurrentUser();
        setUser(response.data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
        setCheckingAuth(false);
      }
    };

    checkSessionUser();
  }, []);

  // Login handler
  const login = async (username, password, rememberMe) => {
    setLoading(true);
    try {
      await authApi.getCSRF();
      const res = await authApi.login({
        username,
        password,
        remember_me: rememberMe,
      });
      setUser(res.data.user);
      return { success: true, user: res.data.user };
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'An error occurred during login.';
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    setLoading(true);
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      setUser(null);
      setLoading(false);
      window.location.href = '/login';
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, checkingAuth, isAuthenticated, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
