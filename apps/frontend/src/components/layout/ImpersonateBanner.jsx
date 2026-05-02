/**
 * Faixa compacta quando o master navega como outro usuário (impersonação).
 */
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { Eye, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

function nomeExibicao(u) {
  if (!u) return '';
  const n = u.full_name || u.fullName;
  if (n && String(n).trim()) return String(n).trim();
  return u.email || '';
}

export default function ImpersonateBanner() {
  const { isImpersonating, originalUser, impersonatedUser, stopImpersonation } = useImpersonation();

  if (!isImpersonating || !impersonatedUser) return null;

  const alvoNome = nomeExibicao(impersonatedUser);
  const alvoEmail = impersonatedUser.email || '';
  const adminEmail = originalUser?.email || originalUser?.full_name || originalUser?.fullName || null;

  const handleStop = async () => {
    await stopImpersonation();
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] border-b border-amber-500/40 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 text-white shadow-lg"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30">
            <Eye className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Simulação de acesso</p>
            <p className="text-sm font-semibold text-white truncate">
              {alvoNome}
              {alvoEmail && (
                <span className="font-normal text-slate-300">
                  {' '}
                  · <span className="text-slate-200">{alvoEmail}</span>
                </span>
              )}
            </p>
            {adminEmail && (
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                Conta administrador: <span className="text-slate-400">{adminEmail}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 sm:pl-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleStop}
            className="w-full sm:w-auto h-8 bg-white text-slate-900 hover:bg-slate-100 border-0 font-medium text-xs shadow-sm"
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Voltar à minha conta
          </Button>
        </div>
      </div>
    </div>
  );
}
