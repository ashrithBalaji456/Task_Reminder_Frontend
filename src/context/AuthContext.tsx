import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types';
import { authApi } from '../api/auth.api';

interface User {
  id: number;
  name: string;
  email: string;
  timezone: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem('accessToken'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveAuthSession = useCallback((res: AuthResponse) => {
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    const userData: User = {
      id: res.userId,
      name: res.name,
      email: res.email,
      timezone: res.timezone || 'UTC',
    };
    localStorage.setItem('user', JSON.stringify(userData));
    setAccessToken(res.accessToken);
    setUser(userData);
  }, []);

  const clearAuthSession = useCallback(() => {
    if (user?.id) {
      import('../pwa/offline/db').then(({ clearUserDataFromDB }) => {
        clearUserDataFromDB(user.id);
      }).catch(() => {});
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setAccessToken(null);
    setUser(null);
  }, [user?.id]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('accessToken');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedToken);
      } catch (e) {
        clearAuthSession();
      }
    }
    setIsLoading(false);

    const handleLogoutEvent = () => {
      clearAuthSession();
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, [clearAuthSession]);

  const login = async (data: LoginRequest) => {
    const res = await authApi.login(data);
    saveAuthSession(res);
  };

  const register = async (data: RegisterRequest) => {
    const res = await authApi.register(data);
    saveAuthSession(res);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (e) {
      // Ignore logout backend network errors
    } finally {
      clearAuthSession();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user && !!accessToken,
        isLoading,
        login,
        register,
        logout,
      }}
    >
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
