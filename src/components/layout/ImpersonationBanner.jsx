/**
 * Impersonation Banner — aparece no topo quando master está visualizando como outro usuário
 */
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { UserX, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function ImpersonationBanner() {
  const { isImpersonating, originalUser, impersonatedUser, stopImpersonation } = useImpersonation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isImpersonating) {
      console.log('[Impersonation] Master viewing as:', impersonatedUser?.email);
    }
  }, [isImpersonating]);

  if (!isImpersonating) return null;

  const handleStop = async () => {
    await stopImpersonation();
    navigate('/dashboard');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg">
      <div className="max-w-screen-2xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="font-bold text-sm">
              MODO DE VISUALIZAÇÃO ATIVO
            </span>
          </div>
          <div className="h-6 w-px bg-black/20" />
          <div className="text-sm">
            <span className="opacity-70">Visualizando como:</span>{' '}
            <strong>{impersonatedUser?.full_name}</strong>
            <span className="text-xs opacity-70 ml-2">
              ({impersonatedUser?.email})
            </span>
          </div>
          <div className="h-6 w-px bg-black/20" />
          <div className="text-xs opacity-70">
            Original: {originalUser?.full_name}
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
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
