/**
 * ImpersonateBanner — Exibido quando master está visualizando como outro usuário
 * Este componente é fixo no topo da tela e mostra quem está sendo visualizado
 */
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { AlertTriangle, UserX, Shield, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function ImpersonateBanner() {
  const { isImpersonating, originalUser, impersonatedUser, stopImpersonation } = useImpersonation();
  const navigate = useNavigate();

  if (!isImpersonating) return null;

  const handleStop = async () => {
    await stopImpersonation();
    navigate('/dashboard');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-lg border-b-2 border-black/10">
      <div className="max-w-screen-2xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            <span className="font-bold text-sm uppercase tracking-wide">
              Modo de Visualização
            </span>
          </div>
          <div className="h-6 w-px bg-black/20" />
          <div className="text-sm">
            <span className="opacity-75">Visualizando como:</span>{' '}
            <strong className="text-black">{impersonatedUser?.full_name}</strong>
            <span className="text-xs opacity-70 ml-2">
              ({impersonatedUser?.email})
            </span>
          </div>
          <div className="h-6 w-px bg-black/20" />
          <div className="text-xs opacity-70">
            Master: {originalUser?.full_name}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleStop}
            className="bg-white hover:bg-gray-100 border-black text-black font-medium shadow-sm"
          >
            <UserX className="mr-2 h-4 w-4" />
            Sair da Visualização
          </Button>
        </div>
      </div>
    </div>
  );
}
