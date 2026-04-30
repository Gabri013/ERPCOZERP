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
  const { user, token, authChecked, setUser: setAuthUser } = useAuth();
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
    if (!payload?.impersonation || !payload?.userId) {
      localStorage.removeItem('impersonation_token');
      return;
    }

    setIsImpersonating(true);
    setOriginalUser({ id: payload.impersonatedBy || null });
    setImpersonatedUser({
      id: payload.userId,
      email: payload.email,
      roles: payload.roles || [],
    });
    setAuthUser({
      id: payload.userId,
      email: payload.email,
      roles: payload.roles || [],
    });
  }, [authChecked, token, setAuthUser]);

  /**
   * Inicia modo de impersonation
   * @param {string} targetUserId - ID do usuário alvo
   * @param {string} reason - Motivo da visualização
   */
  const startImpersonation = async (targetUserId, reason = '') => {
    try {
      const response = await api.post(`/api/admin/impersonate/${targetUserId}`, { reason });
      const { token, user: targetUser } = response.data;

      // Salva token de impersonation
      localStorage.setItem('impersonation_token', token);
      
      setOriginalUser(user); // master atual
      setImpersonatedUser(targetUser);
      setIsImpersonating(true);
      setAuthUser(targetUser); // atualiza contexto de auth

      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || err.message 
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
      localStorage.removeItem('impersonation_token');
      setIsImpersonating(false);
      setImpersonatedUser(null);
      
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
