import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { getPermissoesPorPerfil } from '@/lib/perfis';
import { resolveApiUrl } from '@/config/appConfig';

const PermissaoContext = createContext({ pode: () => true, papel: 'dono' });

export const PermissaoProvider = ({ children }) => {
  const { user, token } = useAuth();
  const { isImpersonating, impersonatedUser, startImpersonation, stopImpersonation } = useImpersonation();
  
  // Usuário visível (o que está vendo a página)
  const usuarioVisivel = isImpersonating ? impersonatedUser : user;
  
  // Permissões efetivas do usuário visível
  const [permissoes, setPermissoes] = useState([]);
  const [modules, setModules] = useState({});
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  // Carrega permissões do backend
  const loadPermissionsFromBackend = useCallback(async () => {
    if (!token || !usuarioVisivel?.id) return;

    setIsLoadingPermissions(true);
    try {
      const response = await fetch(resolveApiUrl('/api/permissions/me'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPermissoes(data.permissions || []);
        setModules(data.modules || {});
        console.log('[Backend Permissões] Carregado:', {
          roles: data.user.roles,
          modules: data.modules,
          permissionCount: data.permissions?.length || 0
        });
      }
    } catch (err) {
      console.warn('[Backend Permissões] Erro ao carregar, usando permissões locais:', err);
    } finally {
      setIsLoadingPermissions(false);
    }
  }, [token, usuarioVisivel?.id]);

  // Carrega permissões do usuário visível (tenta backend primeiro, fallback para local)
  useEffect(() => {
    if (!usuarioVisivel?.id) return;

    // Tenta carregar do backend
    loadPermissionsFromBackend();
  }, [usuarioVisivel, loadPermissionsFromBackend]);

  // Verifica permissão
  const pode = useCallback((acao) => {
    // Master nunca está impersonando, mas se não for master, verifica permissões
    if (!isImpersonating && user?.roles?.includes('master')) return true;
    return permissoes.includes(acao);
  }, [permissoes, isImpersonating, user]);

  // Verifica se pode visualizar módulo
  const podeVerModulo = useCallback((modulo) => {
    if (!modulo) return true;
    return modules[modulo] === true;
  }, [modules]);

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
      podeVerModulo,
      papel: usuarioVisivel?.perfil || usuarioVisivel?.roles?.[0] || 'dono',
      usuarioAtual: user,
      usuarioVisivel,
      impersonando: isImpersonating ? usuarioVisivel : null,
      iniciarImpersonate,
      pararImpersonate,
      permissoes,
      modules,
      isLoadingPermissions,
      reloadPermissions: loadPermissionsFromBackend,
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
