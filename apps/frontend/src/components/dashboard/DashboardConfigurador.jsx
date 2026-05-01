import { useState } from 'react';
import { X, Settings, RotateCcw, Check } from 'lucide-react';
import { ALL_WIDGETS } from '@/services/dashboardConfig';

export default function DashboardConfigurador({ ativos, onSave, onReset, onClose }) {
  const [selecionados, setSelecionados] = useState([...ativos]);

  const toggle = (id) => {
    setSelecionados(prev =>
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  const grupos = [...new Set(ALL_WIDGETS.map(w => w.grupo))];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Settings size={15} className="text-primary" />
            <h2 className="text-sm font-semibold">Configurar Widgets do Dashboard</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground"><X size={15}/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {grupos.map(grupo => (
            <div key={grupo}>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{grupo}</p>
              <div className="space-y-1.5">
                {ALL_WIDGETS.filter(w => w.grupo === grupo).map(w => {
                  const ativo = selecionados.includes(w.id);
                  return (
                    <label key={w.id} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all text-xs ${ativo ? 'border-primary bg-blue-50' : 'border-border hover:bg-muted'}`}>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${ativo ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                        {ativo && <Check size={10} className="text-white" strokeWidth={3}/>}
                      </div>
                      <span className={ativo ? 'font-medium text-foreground' : 'text-muted-foreground'}>{w.label}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{w.size}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30 shrink-0">
          <button onClick={onReset} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <RotateCcw size={12}/> Restaurar padrão
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-1.5 text-xs border border-border rounded hover:bg-muted">Cancelar</button>
            <button onClick={() => onSave(selecionados)} className="px-4 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90">
              Salvar ({selecionados.length} widgets)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}