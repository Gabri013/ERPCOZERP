import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '@/services/authService';
import { resolveApiUrl } from '@/config/appConfig';

const AuthContext = createContext(null);

const getStoredToken = () => localStorage.getItem('access_token');
const setStoredToken = (token) => {
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getStoredToken());
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      const currentUser = await authService.getCurrentUser();

      if (!currentUser) {
        setUser(null);
        setToken(null);
        setStoredToken(null);
        setAuthError({ type: 'auth_required' });
        return null;
      }

      setUser(currentUser);
      setToken(getStoredToken());
      return currentUser;
    } catch (error) {
      setUser(null);
      setToken(null);
      setStoredToken(null);
      setAuthError({
        type: error?.type || 'auth_required',
        message: error?.message || 'Falha ao verificar autenticacao.',
      });
      return null;
    } finally {
      setAuthChecked(true);
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = authService.subscribeAuthChanges((nextUser) => {
      setUser(nextUser);
      setAuthError(nextUser ? null : { type: 'auth_required' });
      setAuthChecked(true);
      setIsLoadingAuth(false);
    });

    checkUserAuth();

    return unsubscribe;
  }, [checkUserAuth]);

  const login = useCallback(async (email, password) => {
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      const response = await fetch(resolveApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Falha no login.');
      }

      const data = await response.json();
      const nextToken = data.accessToken || data.token || data.access_token || null;

      setStoredToken(nextToken);
      setToken(nextToken);
      setUser(data.user || null);
      setAuthChecked(true);
      setAuthError(null);

      return { success: true, user: data.user };
    } catch (error) {
      setAuthError({ type: 'auth_required', message: error.message });
      return { success: false, error: error.message };
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setAuthChecked(true);
    setAuthError({ type: 'auth_required' });
    authService.navigateToLogin();
  }, []);

  const navigateToLogin = useCallback(() => {
    authService.navigateToLogin();
  }, []);

  const value = useMemo(() => ({
    user,
    setUser,
    token,
    setToken,
    login,
    logout,
    isAuthenticated: Boolean(user),
    isLoadingAuth,
    isLoadingPublicSettings: false,
    authChecked,
    authError,
    checkUserAuth,
    navigateToLogin,
  }), [
    user,
    token,
    login,
    logout,
    isLoadingAuth,
    authChecked,
    authError,
    checkUserAuth,
    navigateToLogin,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }

  return context;
}
