import { useState } from 'react';
import { X, Play, Pause, CheckCircle } from 'lucide-react';

const ETAPAS = ['Programação','Engenharia','Corte a Laser','Retirada','Rebarbação','Dobra','Solda','Montagem','Acabamento','Qualidade','Embalagem','Expedição'];
const OPERADORES = ['José Pereira','Marcos Lima','Carlos Silva','Ana Souza','Roberto F.'];
const SETORES = ['Laser','Rebarbação','Dobra','Solda','Montagem','Acabamento','Qualidade','Expedição'];

const inp = 'w-full border border-border rounded px-2.5 py-1.5 text-xs bg-white outline-none focus:border-primary';
const lbl = 'block text-[11px] text-muted-foreground mb-0.5';

export default function ApontamentoModal({ op, onClose, onSave }) {
  const [form, setForm] = useState({
    etapa: ETAPAS[0], operador: OPERADORES[0], setor: SETORES[0],
    quantidade: '', refugo: 0, observacao: '',
  });
  const [saving, setSaving] = useState(false);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleIniciar = async () => {
    setSaving(true);
    await onSave({ ...form, tipo: 'iniciar' });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold">Registrar Apontamento</h2>
            <p className="text-[11px] text-muted-foreground">{op?.numero} — {op?.produtoDescricao}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16}/></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Etapa</label>
              <select className={inp} value={form.etapa} onChange={e=>upd('etapa',e.target.value)}>
                {ETAPAS.map(e=><option key={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Setor</label>
              <select className={inp} value={form.setor} onChange={e=>upd('setor',e.target.value)}>
                {SETORES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Operador</label>
              <select className={inp} value={form.operador} onChange={e=>upd('operador',e.target.value)}>
                {OPERADORES.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Hora Início (automático)</label>
              <input className={`${inp} bg-muted text-muted-foreground`} value={new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} readOnly/>
            </div>
            <div>
              <label className={lbl}>Quantidade Produzida</label>
              <input type="number" min="0" className={inp} value={form.quantidade} onChange={e=>upd('quantidade',e.target.value)} placeholder="0"/>
            </div>
            <div>
              <label className={lbl}>Refugo</label>
              <input type="number" min="0" className={inp} value={form.refugo} onChange={e=>upd('refugo',e.target.value)} placeholder="0"/>
            </div>
          </div>
          <div>
            <label className={lbl}>Observação</label>
            <textarea rows={2} className={inp} value={form.observacao} onChange={e=>upd('observacao',e.target.value)} placeholder="Observações..."/>
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30">
          <button onClick={onClose} className="px-4 py-1.5 text-xs border border-border rounded hover:bg-muted">Cancelar</button>
          <div className="flex gap-2">
            <button onClick={handleIniciar} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-green-600 text-white rounded hover:opacity-90 disabled:opacity-60">
              <Play size={12}/> {saving ? 'Registrando...' : 'Iniciar Apontamento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}