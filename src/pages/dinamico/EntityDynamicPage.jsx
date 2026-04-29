import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useMetadataStore } from '@/stores/metadataStore';
import { useAuth } from '@/lib/AuthContext';
import { usePermissionEngine } from '@/lib/PermissaoContext';
import DynamicEntityPage from '@/components/metadata/DynamicEntityPage';
import { Loader2 } from 'lucide-react';

/**
 * Página dinâmica que carrega entidade pelo código na URL
 * Ex: /entidades/produto → mostra entidade 'produto'
 */
export default function EntityDynamicPage() {
  const { codigo } = useParams();
  const { entities, loading, loadEntities } = useMetadataStore();
  const { user } = useAuth();
  const permissionEngine = usePermissionEngine();

  useEffect(() => {
    if (entities.length === 0) {
      loadEntities();
    }
  }, []);

  if (loading && entities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const entity = entities.find(e => e.code === codigo);

  if (!entity) {
    return <Navigate to="/" replace />;
  }

  // Renderiza página dinâmica
  return <DynamicEntityPage entityCode={codigo} />;
}
