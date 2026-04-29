import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';

const PermissaoContext = createContext({ pode: () => true, papel: 'dono' });

export const PermissaoProvider = ({ children }) => {
  const { user, token } = useAuth();
  const { isImpersonating, impersonatedUser, startImpersonation, stopImpersonation } = useImpersonation();
  
  // Usuário visível (o que está vendo a página)
  const usuarioVisivel = isImpersonating ? impersonatedUser : user;
  
  // Permissões efetivas do usuário visível
  const [permissoes, setPermissoes] = useState([]);

  // Carrega permissões do usuário visível
  useEffect(() => {
    if (!usuarioVisivel?.id) return;

    // No futuro, buscar do backend: /api/permissions/user/:userId
    // Por enquanto, usa perfil local + custom
    const { getPermissoesPorPerfil } = require('@/lib/perfis');
    const base = getPermissoesPorPerfil(usuarioVisivel.perfil || usuarioVisivel.roles?.[0] || 'visualizador');
    const custom = usuarioVisivel.permissoesCustom || [];
    setPermissoes([...new Set([...base, ...custom])]);
  }, [usuarioVisivel]);

  // Verifica permissão
  const pode = useCallback((acao) => {
    // Master nunca está impersonando, mas se não for master, verifica permissões
    if (!isImpersonating && user?.roles?.includes('master')) return true;
    return permissoes.includes(acao);
  }, [permissoes, isImpersonating, user]);

  // Iniciar impersonation (delegado para o contexto de impersonation)
  const iniciarImpersonate = async (usuarioId, reason = '') => {
    return await startImpersonation(usuarioId, reason);
  };

  const pararImpersonate = async () => {
    await stopImpersonation();
  };

  return (
    <PermissaoContext.Provider value={{
      pode,
      papel: usuarioVisivel?.perfil || usuarioVisivel?.roles?.[0] || 'dono',
      usuarioAtual: user,
      usuarioVisivel,
      impersonando: isImpersonating ? usuarioVisivel : null,
      iniciarImpersonate,
      pararImpersonate,
      permissoes,
    }}>
      {children}
    </PermissaoContext.Provider>
  );
};

export const usePermissao = () => useContext(PermissaoContext);

export const usePermissionEngine = () => {
  const { pode } = usePermissao();

  const can = useCallback((action, entityCode) => {
    const scopedPermission = entityCode ? `${action}_${entityCode}` : action;
    return pode(scopedPermission) || pode(action);
  }, [pode]);

  const canByOwnership = useCallback((action, entityCode) => {
    return can(action, entityCode);
  }, [can]);

  return { can, canByOwnership };
};

// Helper para condicionar renderização
export function PodeRender({ acao, children, fallback = null }) {
  const { pode } = usePermissao();
  return pode(acao) ? children : fallback;
}
