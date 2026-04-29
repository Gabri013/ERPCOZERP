import { Outlet } from 'react-router-dom';
import { usePermissao } from '@/lib/PermissaoContext';
import AccessDenied from '@/components/AccessDenied';

export default function PermissaoRoute({ acao, anyOf = [], children }) {
  const { pode } = usePermissao();
  const permitido = acao ? pode(acao) : anyOf.length ? anyOf.some(pode) : true;

  if (!permitido) return <AccessDenied />;

  return children ?? <Outlet />;
}
