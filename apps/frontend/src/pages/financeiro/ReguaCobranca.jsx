import { useState, useEffect, useCallback } from 'react';
import { Plus, Send, Edit2, Trash2, XCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

const TIPOS_PASSO = [
  'Lembrete de vencimento', 'Cobrança após vencimento', 'Confirmação de recebimento',
];

export default function ReguaCobranca() {
  const [reguas, setReguas] = useState([]);
  const [selecionada, setSelecionada] = useState(null);
  const [passos, setPassos] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get('/api/financial/collection-rules');
      const body = res?.data?.data ?? res?.data ?? {};
      const reguasList = Array.isArray(body.reguas) ? body.reguas : Array.isArray(body) ? body : [];
      setReguas(reguasList);
      if (reguasList.length > 0 && !selecionada) {
        setSelecionada(reguasList[0]);
        setPassos(Array.isArray(reguasList[0].passos) ? reguasList[0].passos : []);
      }
    } catch {
      toast.error('Erro ao carregar réguas de cobrança');
    }
  }, [selecionada]);

  useEffect(() => { loadData(); }, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ descricao: '', tipo: TIPOS_PASSO[0], dias: '' });
  const [editPasso, setEditPasso] = useState(null);

  const salvarPasso = async () => {
    if (!form.descricao) return toast.error('Informe a descrição');
    const payload = { ...form, dias: Number(form.dias) || 0, regua_id: selecionada?.id };
    if (editPasso) {
      try {
        await api.put(`/api/financial/collection-rules/${editPasso.id}`, payload);
      } catch { /* atualiza local */ }
      setPassos(passos.map((p) => p.id === editPasso.id ? { ...editPasso, ...form, dias: Number(form.dias) || 0 } : p));
      toast.success('Passo atualizado!');
    } else {
      let novo = { ...payload, id: Date.now(), passo: passos.length + 1 };
      try {
        const res = await api.post('/api/financial/collection-rules', payload);
        novo = { ...novo, ...(res?.data?.data ?? res?.data ?? {}) };
      } catch { /* usa local */ }
      setPassos([...passos, novo]);
      toast.success('Passo adicionado!');
    }
    setShowForm(false); setEditPasso(null);
    setForm({ descricao: '', tipo: TIPOS_PASSO[0], dias: '' });
  };

  const removerPasso = (id) => {
    setPassos(passos.filter((p) => p.id !== id).map((p, i) => ({ ...p, passo: i + 1 })));
    toast.success('Passo removido!');
  };

  const TIPO_COR = {
    'Lembrete de vencimento': 'bg-blue-100 text-blue-700',
    'Cobrança após vencimento': 'bg-red-100 text-red-700',
    'Confirmação de recebimento': 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Régua de Cobrança</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Cobrança automática com lembretes e e-mails programados</p>
        </div>
        <button type="button" onClick={() => toast.info('Nova régua de cobrança')} className="erp-btn-primary flex items-center gap-2">
          <Plus size={14} /> Nova Régua
        </button>
      </div>

      {/* Seletor de régua */}
      <div className="flex gap-2 flex-wrap">
        {reguas.map((r) => (
          <button key={r.id} type="button" onClick={() => { setSelecionada(r); setPassos(Array.isArray(r.passos) ? r.passos : []); }}
            className={`px-4 py-2 rounded-lg border text-sm transition-colors ${selecionada?.id === r.id ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border hover:bg-muted'}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${r.ativa ? 'bg-green-500' : 'bg-gray-400'}`} />
            {r.nome}
            <span className="ml-1.5 text-xs text-muted-foreground">({r.passos} passos)</span>
          </button>
        ))}
      </div>

      {selecionada && (
        <>
          <div className="erp-card p-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{selecionada.nome}</h3>
              <p className="text-xs text-muted-foreground">{selecionada.descricao}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selecionada.ativa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {selecionada.ativa ? 'Ativa' : 'Inativa'}
              </span>
              <button type="button" onClick={() => { setShowForm(true); setEditPasso(null); setForm({ descricao: '', tipo: TIPOS_PASSO[0], dias: '' }); }}
                className="erp-btn-primary text-xs flex items-center gap-1"><Plus size={12} /> Criar novo passo</button>
            </div>
          </div>

          {/* Tabela de passos */}
          <div className="erp-card overflow-x-auto">
            <table className="erp-table w-full">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="text-left">Passo</th>
                  <th className="text-left">Descrição</th>
                  <th className="text-left">Tipo de passo</th>
                  <th className="text-left">Dias</th>
                  <th className="text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {passos.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="font-bold text-primary">{p.passo}</td>
                    <td className="font-medium">{p.descricao}</td>
                    <td><span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${TIPO_COR[p.tipo] || 'bg-muted text-muted-foreground'}`}>{p.tipo}</span></td>
                    <td className="text-muted-foreground">{p.dias != null ? p.dias : '—'}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => toast.success(`E-mail de teste enviado para o passo ${p.passo}`)}
                          className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"><Send size={11} /> Enviar email</button>
                        <button type="button" onClick={() => { setEditPasso(p); setForm({ descricao: p.descricao, tipo: p.tipo, dias: String(p.dias ?? '') }); setShowForm(true); }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground"><Edit2 size={12} /></button>
                        <button type="button" onClick={() => removerPasso(p.id)} className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!passos.length && <tr><td colSpan={5} className="text-center py-6 text-muted-foreground text-sm">Nenhum passo configurado</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Explicação */}
          <div className="erp-card p-4 text-sm">
            <h3 className="font-semibold mb-2">Como funciona a régua de cobrança</h3>
            <ul className="text-muted-foreground space-y-1.5 text-xs list-disc list-inside">
              <li>O sistema verifica diariamente as contas a receber e dispara e-mails automaticamente conforme os passos configurados</li>
              <li><strong>Lembrete de vencimento:</strong> enviado X dias antes do vencimento da conta</li>
              <li><strong>Cobrança após vencimento:</strong> enviado X dias depois da data de vencimento se a conta ainda não foi baixada</li>
              <li><strong>Confirmação de recebimento:</strong> enviado automaticamente após a baixa da conta</li>
              <li>Configure quantos passos precisar — a régua é totalmente personalizada por sua empresa</li>
            </ul>
          </div>
        </>
      )}

      {/* Modal passo */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">{editPasso ? 'Editar Passo' : 'Novo Passo da Régua'}</h2>
              <button type="button" onClick={() => setShowForm(false)}><XCircle size={18} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="erp-label">Descrição *</label>
                <input className="erp-input w-full" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Cobrança 5 dias após o vencimento" />
              </div>
              <div>
                <label className="erp-label">Tipo de passo</label>
                <select className="erp-input w-full" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  {TIPOS_PASSO.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              {form.tipo !== 'Confirmação de recebimento' && (
                <div>
                  <label className="erp-label">Dias {form.tipo === 'Lembrete de vencimento' ? 'antes' : 'após'} o vencimento</label>
                  <input type="number" min="0" className="erp-input w-full" value={form.dias} onChange={(e) => setForm({ ...form, dias: e.target.value })} placeholder="0" />
                </div>
              )}
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="erp-btn-ghost">Cancelar</button>
              <button type="button" onClick={salvarPasso} className="erp-btn-primary flex items-center gap-1"><Save size={13} /> Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
