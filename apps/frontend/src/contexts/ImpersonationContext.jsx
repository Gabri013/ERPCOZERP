import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/services/api';

const ImpersonationContext = createContext(null);

const decodeJwtPayload = (jwtToken) => {
  try {
    const payload = jwtToken.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

/**
 * Provedor de contexto para gerenciar modo de impersonation
 * Usado para que o master possa visualizar o sistema como outro usuário
 */
export function ImpersonationProvider({ children }) {
  const { user, token, authChecked, setUser: setAuthUser, setToken: setAuthToken } = useAuth();
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalUser, setOriginalUser] = useState(null);
  const [impersonatedUser, setImpersonatedUser] = useState(null);

  useEffect(() => {
    if (!authChecked || !token) {
      return;
    }

    const impersonationToken = localStorage.getItem('impersonation_token');
    if (!impersonationToken) {
      return;
    }

    const payload = decodeJwtPayload(impersonationToken);
    const impersonatedUserId = payload?.sub || payload?.userId || null;
    if (!payload?.impersonation || !impersonatedUserId) {
      localStorage.removeItem('impersonation_token');
      return;
    }

    const originalToken = localStorage.getItem('original_access_token');
    const originalPayload = originalToken ? decodeJwtPayload(originalToken) : null;
    const master =
      originalPayload?.email || originalPayload?.sub
        ? { id: originalPayload.sub, email: originalPayload.email }
        : payload.impersonatedBy
          ? { id: payload.impersonatedBy, email: null }
          : null;

    setIsImpersonating(true);
    setOriginalUser(master);
    setImpersonatedUser({
      id: impersonatedUserId,
      email: payload.email,
      full_name: payload.fullName ?? payload.full_name,
      roles: payload.roles || [],
    });
    setAuthUser({
      id: impersonatedUserId,
      email: payload.email,
      full_name: payload.fullName ?? payload.full_name,
      roles: payload.roles || [],
    });
    setAuthToken(impersonationToken);
  }, [authChecked, token, setAuthUser, setAuthToken]);

  const startImpersonation = async (targetUserId, reason = '') => {
    try {
      const response = await api.post(`/api/admin/impersonate/${targetUserId}`, { reason });
      const { token: impersonationToken, user: targetUser } = response?.data || {};

      if (!impersonationToken || !targetUser) {
        return {
          success: false,
          error: 'Resposta inválida ao iniciar impersonação',
        };
      }

      const originalTok = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (originalTok) {
        localStorage.setItem('original_access_token', originalTok);
      }

      localStorage.setItem('impersonation_token', impersonationToken);
      localStorage.setItem('access_token', impersonationToken);

      setOriginalUser(user);
      const resolvedTarget = {
        ...targetUser,
        full_name: targetUser.full_name ?? targetUser.fullName,
      };
      setImpersonatedUser(resolvedTarget);
      setIsImpersonating(true);
      setAuthUser(resolvedTarget);
      setAuthToken(impersonationToken);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err?.body?.error || err.message,
      };
    }
  };

  const stopImpersonation = async () => {
    try {
      const impToken = localStorage.getItem('impersonation_token');
      if (impToken) {
        await api.post('/api/admin/stop-impersonate');
      }
    } finally {
      const originalToken = localStorage.getItem('original_access_token');
      localStorage.removeItem('impersonation_token');
      localStorage.removeItem('original_access_token');

      if (originalToken) {
        localStorage.setItem('access_token', originalToken);
      }

      setIsImpersonating(false);
      setImpersonatedUser(null);
      setAuthToken(originalToken || null);

      window.location.reload();
    }
  };

  const value = {
    isImpersonating,
    originalUser,
    impersonatedUser,
    startImpersonation,
    stopImpersonation,
  };

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const ctx = useContext(ImpersonationContext);
  if (!ctx) {
    throw new Error('useImpersonation deve ser usado dentro de ImpersonationProvider');
  }
  return ctx;
}
