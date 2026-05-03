import { Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { usePermissao } from '@/lib/PermissaoContext';
import AccessDenied from '@/components/AccessDenied';

export default function PermissaoRoute({ acao, anyOf = [], children }) {
  const { pode, isLoadingPermissions, usuarioAtual } = usePermissao();
  const needsCheck = Boolean(acao) || anyOf.length > 0;
  const skipPermWait = usuarioAtual?.roles?.includes('master');

  if (needsCheck && isLoadingPermissions && !skipPermWait) {
    return (
      <div className="flex justify-center items-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="animate-spin" size={20} />
        Verificando permissões…
      </div>
    );
  }

  const permitido = acao ? pode(acao) : anyOf.length ? anyOf.some(pode) : true;

  if (!permitido) return <AccessDenied />;

  return children ?? <Outlet />;
}
