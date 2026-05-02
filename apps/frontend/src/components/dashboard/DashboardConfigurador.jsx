import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Settings, RotateCcw, Check } from 'lucide-react';
import { ALL_WIDGETS } from '@/services/dashboardConfig';

export default function DashboardConfigurador({ ativos, onSave, onReset, onClose }) {
  // Inicializa com os widgets ativos. O pai usa key={widgetIds.join('|')} para
  // remontar este componente sempre que o layout externo mudar — não precisamos
  // de um useEffect que resete a seleção em resposta a mudanças de `ativos`.
  const [selecionados, setSelecionados] = useState(() => new Set(Array.isArray(ativos) ? ativos : []));

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggle = (id) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const grupos = [...new Set(ALL_WIDGETS.map((w) => w.grupo))];

  const modal = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white relative z-[1] flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl shadow-2xl"
        data-testid="dashboard-widget-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-widgets-title"
        aria-label="Configurar Widgets do Dashboard"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <Settings size={15} className="text-primary" />
            <h2 id="dashboard-widgets-title" className="text-sm font-semibold">
              Configurar Widgets do Dashboard
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted">
            <X size={15} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {grupos.map((grupo) => (
            <div key={grupo}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{grupo}</p>
              <div className="space-y-1.5">
                {ALL_WIDGETS.filter((w) => w.grupo === grupo).map((w) => {
                  const ativo = selecionados.has(w.id);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      data-testid={`dashboard-widget-row-${w.id}`}
                      onClick={() => toggle(w.id)}
                      aria-pressed={ativo}
                      className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left text-xs transition-colors ${
                        ativo ? 'border-primary bg-blue-50' : 'border-border hover:bg-muted'
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          ativo ? 'border-primary bg-primary' : 'border-muted-foreground bg-white'
                        }`}
                        aria-hidden
                      >
                        {ativo && <Check size={10} className="text-white" strokeWidth={3} />}
                      </span>
                      <span className={`min-w-0 flex-1 ${ativo ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {w.label}
                      </span>
                      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{w.size}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-border bg-muted/30 px-5 py-3">
          <button type="button" onClick={onReset} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <RotateCcw size={12} /> Restaurar padrão
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded border border-border px-4 py-1.5 text-xs hover:bg-muted">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onSave(Array.from(selecionados))}
              className="cozinha-blue-bg rounded px-4 py-1.5 text-xs text-white hover:opacity-90"
            >
              Salvar ({selecionados.size} widgets)
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null;
}
