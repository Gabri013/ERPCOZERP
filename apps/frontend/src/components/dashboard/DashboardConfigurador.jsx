import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Settings, RotateCcw, Check, Star, Lock } from 'lucide-react';
import { ALL_WIDGETS, getWidgetsByPermissions } from '@/services/dashboardConfig';
import { usePermissao } from '@/lib/PermissaoContext';
import { getDefaultWidgetsByRole } from '@/lib/defaultDashboardLayouts';
import { primaryRole } from '@/lib/rolePriority';
import { useAuth } from '@/lib/AuthContext';

export default function DashboardConfigurador({ ativos, onSave, onReset, onClose }) {
  const [selecionados, setSelecionados] = useState(() => new Set(Array.isArray(ativos) ? ativos : []));
  const { permissions, isLoadingPermissions } = usePermissao();
  const { user } = useAuth();

  const roleCode = useMemo(() => primaryRole(user?.roles), [user?.roles]);

  // Widgets que o usuário pode ver/adicionar (filtrado por permissão)
  // se as permissões ainda estão carregando, mostra todos os widgets não-ocultos
  const widgetsDisponiveis = useMemo(() => {
    if (isLoadingPermissions || !permissions?.length) {
      return ALL_WIDGETS.filter((w) => !w.hidden);
    }
    return getWidgetsByPermissions(permissions);
  }, [permissions, isLoadingPermissions]);

  // IDs do layout padrão para o role do usuário
  const defaultsForRole = useMemo(
    () => new Set(getDefaultWidgetsByRole(roleCode, user?.sector)),
    [roleCode, user?.sector],
  );

  // IDs dos widgets disponíveis (para checar se um widget salvo ainda é acessível)
  const disponiveisSet = useMemo(
    () => new Set(widgetsDisponiveis.map((w) => w.id)),
    [widgetsDisponiveis],
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggle = (id) => {
    if (!disponiveisSet.has(id)) return; // bloqueado por permissão
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Aplicar padrão do perfil
  const aplicarPadrao = () => {
    const defaults = getDefaultWidgetsByRole(roleCode, user?.sector);
    setSelecionados(new Set(defaults.filter((id) => disponiveisSet.has(id))));
  };

  // Grupos dos widgets disponíveis (exclui Legado)
  const grupos = useMemo(() => {
    const gs = [];
    for (const w of widgetsDisponiveis) {
      if (!gs.includes(w.grupo)) gs.push(w.grupo);
    }
    return gs;
  }, [widgetsDisponiveis]);

  const recomendadoCount = [...defaultsForRole].filter((id) => disponiveisSet.has(id)).length;
  const selecionadosCount = selecionados.size;

  const modal = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white relative z-[1] flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-xl shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-widgets-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <Settings size={15} className="text-primary" />
            <div>
              <h2 id="dashboard-widgets-title" className="text-sm font-semibold leading-tight">
                Personalizar Dashboard
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {selecionadosCount} selecionado{selecionadosCount !== 1 ? 's' : ''} •{' '}
                {widgetsDisponiveis.length} disponíveis para seu perfil
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted">
            <X size={15} />
          </button>
        </div>

        {/* ── Banner do perfil ─────────────────────────────────────────────── */}
        {recomendadoCount > 0 && (
          <div className="shrink-0 bg-blue-50 border-b border-blue-100 px-5 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-blue-700">
              <Star size={13} className="shrink-0" />
              <span>
                <strong>{recomendadoCount} widget{recomendadoCount !== 1 ? 's' : ''}</strong>{' '}
                recomendados para o seu perfil
              </span>
            </div>
            <button
              type="button"
              onClick={aplicarPadrao}
              className="shrink-0 text-[11px] font-medium text-blue-600 hover:text-blue-800 bg-white border border-blue-200 rounded px-2.5 py-1 hover:bg-blue-50 transition-colors"
            >
              Aplicar padrão
            </button>
          </div>
        )}

        {/* ── Lista de widgets ─────────────────────────────────────────────── */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {grupos.map((grupo) => {
            const items = widgetsDisponiveis.filter((w) => w.grupo === grupo);
            if (items.length === 0) return null;
            return (
              <div key={grupo}>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {grupo}
                </p>
                <div className="space-y-1.5">
                  {items.map((w) => {
                    const ativo = selecionados.has(w.id);
                    const isDefault = defaultsForRole.has(w.id);
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => toggle(w.id)}
                        aria-pressed={ativo}
                        className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left text-xs transition-colors ${
                          ativo
                            ? 'border-primary bg-blue-50'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        {/* Checkbox */}
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            ativo ? 'border-primary bg-primary' : 'border-muted-foreground bg-white'
                          }`}
                          aria-hidden
                        >
                          {ativo && <Check size={10} className="text-white" strokeWidth={3} />}
                        </span>

                        {/* Label */}
                        <span className={`min-w-0 flex-1 ${ativo ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                          {w.label}
                        </span>

                        {/* Tags */}
                        <div className="flex items-center gap-1 shrink-0">
                          {isDefault && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-blue-100 text-blue-700 px-1.5 py-0.5 text-[10px] font-medium">
                              <Star size={9} /> Perfil
                            </span>
                          )}
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {w.size}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {widgetsDisponiveis.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Lock size={32} className="text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                Nenhum widget disponível para seu perfil
              </p>
              <p className="text-xs text-muted-foreground/70">
                Verifique suas permissões com o administrador
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-t border-border bg-muted/30 px-5 py-3">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw size={12} /> Restaurar padrão do sistema
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-border px-4 py-1.5 text-xs hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onSave(Array.from(selecionados))}
              className="cozinha-blue-bg rounded px-4 py-1.5 text-xs text-white hover:opacity-90"
            >
              Salvar ({selecionadosCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null;
}
