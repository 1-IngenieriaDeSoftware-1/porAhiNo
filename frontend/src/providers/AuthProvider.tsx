'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import authService from '@/services/authService';
import { TOKEN_STORAGE_KEY } from '@/lib/routes';
import type { UsuarioAPI } from '@/types/api';

interface AuthContextValue {
  user: UsuarioAPI | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  registro: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UsuarioAPI | null>(null);
  const [loading, setLoading] = useState(true);

  const cargarSesion = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await authService.getMe();
      setUser(me);
    } catch {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarSesion();
  }, [cargarSesion]);

  const login = useCallback(async (email: string, password: string) => {
    const token = await authService.login({ email, password });
    localStorage.setItem(TOKEN_STORAGE_KEY, token.access_token);
    const me = await authService.getMe();
    setUser(me);
  }, []);

  const registro = useCallback(async (email: string, password: string) => {
    await authService.registro(email, password);
    await login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    authService.logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAdmin: user?.rol === 'admin',
      login,
      registro,
      logout,
    }),
    [user, loading, login, registro, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
