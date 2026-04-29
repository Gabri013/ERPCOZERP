import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/services/api';

const ImpersonationContext = createContext(null);

/**
 * Provedor de contexto para gerenciar modo de impersonation
 * Usado para que o master possa visualizar o sistema como outro usuário
 */
export function ImpersonationProvider({ children }) {
  const { user, setUser: setAuthUser } = useAuth();
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalUser, setOriginalUser] = useState(null);
  const [impersonatedUser, setImpersonatedUser] = useState(null);

  // No mount, verifica se há token de impersonation ativo
  useEffect(() => {
    const checkImpersonationStatus = async () => {
      // Tenta verificar status via API (mais seguro)
      try {
        const response = await fetch('/api/admin/impersonation/status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        const data = await response.json();
        
        if (data?.isImpersonating) {
          setIsImpersonating(true);
          setOriginalUser(data.masterUser);
          setImpersonatedUser(data.impersonatedUser);
          // Atualiza contexto de auth com usuário alvo
          setAuthUser(data.impersonatedUser);
        }
      } catch (err) {
        // Se der erro (401), remove token de impersonation se existir
        localStorage.removeItem('impersonation_token');
      }
    };

    checkImpersonationStatus();
  }, []);

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
         await api.post('/admin/stop-impersonate');
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
