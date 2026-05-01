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

  // No mount, verifica se há token de impersonation ativo
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

    setIsImpersonating(true);
    setOriginalUser({ id: payload.impersonatedBy || null });
    setImpersonatedUser({
      id: impersonatedUserId,
      email: payload.email,
      roles: payload.roles || [],
    });
    setAuthUser({
      id: impersonatedUserId,
      email: payload.email,
      roles: payload.roles || [],
    });
    setAuthToken(impersonationToken);
  }, [authChecked, token, setAuthUser]);

  /**
   * Inicia modo de impersonation
   * @param {string} targetUserId - ID do usuário alvo
   * @param {string} reason - Motivo da visualização
   */
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

      const originalToken = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (originalToken) {
        localStorage.setItem('original_access_token', originalToken);
      }

      // Salva token de impersonation
      localStorage.setItem('impersonation_token', impersonationToken);
      localStorage.setItem('access_token', impersonationToken);
      
      setOriginalUser(user); // master atual
      setImpersonatedUser(targetUser);
      setIsImpersonating(true);
      setAuthUser(targetUser); // atualiza contexto de auth
      setAuthToken(impersonationToken); // atualiza token efetivo do app

      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err?.body?.error || err.message 
      };
    }
  };

  /**
   * Finaliza modo de impersonation
   */
   const stopImpersonation = async () => {
     try {
       const impToken = localStorage.getItem('impersonation_token');
       if (impToken) {
         await api.post('/api/admin/stop-impersonate');
       }
     } finally {
      // Limpa storage
      const originalToken = localStorage.getItem('original_access_token');
      localStorage.removeItem('impersonation_token');
      localStorage.removeItem('original_access_token');

      if (originalToken) {
        localStorage.setItem('access_token', originalToken);
      }

      setIsImpersonating(false);
      setImpersonatedUser(null);
      setAuthToken(originalToken || null);
      
      // Recarrega dados do master (pode recarregar a página ou refazer login)
      // Opção mais simples: recarregar para pegar token original
      window.location.reload();
    }
  };

  const value = {
    isImpersonating,
    originalUser,
    impersonatedUser,
    startImpersonation,
    stopImpersonation,
    stopImersonation: stopImpersonation
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
