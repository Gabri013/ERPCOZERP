import { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Plus, CheckCircle, XCircle, ArrowRight, Package, AlertTriangle, Truck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';
const hoje = new Date().toISOString().split('T')[0];
const addDias = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };

const STATUS_REQ = {
  'Pendente':       'bg-yellow-100 text-yellow-700',
  'Separado':       'bg-blue-100 text-blue-700',
  'Requisitado':    'bg-green-100 text-green-700',
  'Parcial':        'bg-orange-100 text-orange-700',
  'Cancelado':      'bg-red-100 text-red-700',
};

export default function RequisicaoMateriais() {
  const [aba, setAba] = useState('requisicoes');
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [requisicoes, setRequisicoes] = useState([]);
  const [transferencias, setTransferencias] = useState([]);
  const [opsDisponiveis, setOpsDisponiveis] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get('/api/production/requisitions');
      const d = res.data?.data ?? res.data ?? {};
      setRequisicoes(Array.isArray(d) ? d : (d.requisicoes ?? []));
      setTransferencias(d.transferencias ?? []);
      setOpsDisponiveis(d.ops ?? []);
    } catch {
      setRequisicoes([]); setTransferencias([]); setOpsDisponiveis([]);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  const [detalhe, setDetalhe] = useState(null);
  const [showNovaReq, setShowNovaReq] = useState(false);
  const [opSel, setOpSel] = useState('');
  const [tipoReq, setTipoReq] = useState('normal');

  const lista = useMemo(() => {
    let d = requisicoes;
    if (filtroStatus !== 'Todos') d = d.filter((r) => r.status === filtroStatus);
    if (busca) { const q = busca.toLowerCase(); d = d.filter((r) => r.id.toLowerCase().includes(q) || r.op.toLowerCase().includes(q)); }
    return d;
  }, [requisicoes, filtroStatus, busca]);

  const kpis = useMemo(() => ({
    pendentes: requisicoes.filter((r) => r.status === 'Pendente').length,
    separados: requisicoes.filter((r) => r.status === 'Separado').length,
    requisitados: requisicoes.filter((r) => r.status === 'Requisitado').length,
    sem_estoque: requisicoes.flatMap((r) => r.itens).filter((i) => i.sem_estoque).length,
  }), [requisicoes]);

  const gerarRequisicao = () => {
    if (!opSel) return toast.error('Selecione uma OP');
    const op = opsDisponiveis.find((o) => o.id === opSel);
    const nova = {
      id: `REQ-${String(requisicoes.length + 1).padStart(3, '0')}`, op: opSel, data: hoje, tipo: tipoReq,
      status: 'Pendente', operador: 'Usuário Atual', almoxarife: null,
      itens: [
        { id: 1, codigo: 'MP-CHAPA-316L-3MM', descricao: 'Chapa Inox 316L 3mm (gerado da BOM)', qtd_necessaria: 45.5, qtd_requis: 47.8, qtd_separada: 0, unidade: 'kg', lote: '', local: '', ok: false },
      ],
    };
    setRequisicoes([nova, ...requisicoes]);
    setShowNovaReq(false);
    setOpSel('');
    toast.success(`Requisição ${nova.id} gerada a partir da BOM da OP ${opSel}!`);
  };

  const separar = (reqId) => {
    setRequisicoes(requisicoes.map((r) => r.id === reqId ? { ...r, status: 'Separado', itens: r.itens.map((i) => ({ ...i, qtd_separada: i.qtd_requis })) } : r));
    toast.success('Materiais separados!');
  };

  const requisitar = (reqId) => {
    setRequisicoes(requisicoes.map((r) => r.id === reqId ? { ...r, status: 'Requisitado' } : r));
    toast.success('Materiais requisitados! Estoque atualizado.');
  };

  const StatusChip = ({ status }) => (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_REQ[status] || 'bg-muted'}`}>{status}</span>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Requisição de Materiais</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Controle o consumo de materiais nas ordens de produção integrado ao estoque</p>
        </div>
        <button type="button" onClick={() => setShowNovaReq(true)} className="erp-btn-primary flex items-center gap-2">
          <Plus size={14} /> Nova Requisição
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pendentes', value: kpis.pendentes, color: 'text-yellow-600', icon: <Package size={16} /> },
          { label: 'Separados', value: kpis.separados, color: 'text-blue-600', icon: <CheckCircle size={16} /> },
          { label: 'Requisitados', value: kpis.requisitados, color: 'text-green-600', icon: <CheckCircle size={16} /> },
          { label: 'Itens sem estoque', value: kpis.sem_estoque, color: kpis.sem_estoque > 0 ? 'text-red-600' : '', icon: <AlertTriangle size={16} /> },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3 flex items-center gap-2">
            <div className={`${k.color || 'text-muted-foreground'}`}>{k.icon}</div>
            <div>
              <p className="text-[10px] text-muted-foreground">{k.label}</p>
              <p className={`text-lg font-bold ${k.color || ''}`}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div className="border-b border-border flex gap-0">
        {[
          { id: 'requisicoes', label: 'Requisições' },
          { id: 'separacao', label: 'Separação de Materiais' },
          { id: 'transferencias', label: 'Transferências' },
          { id: 'config', label: 'Configuração Automática' },
        ].map((a) => (
          <button key={a.id} type="button" onClick={() => setAba(a.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${aba === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ABA REQUISIÇÕES */}
      {aba === 'requisicoes' && (
        <div className="space-y-3">
          <div className="erp-card p-2 flex gap-2">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="erp-input pl-7 text-xs w-full" placeholder="Buscar por requisição ou OP..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            {['Todos', 'Pendente', 'Separado', 'Requisitado'].map((s) => (
              <button key={s} type="button" onClick={() => setFiltroStatus(s)}
                className={`px-2.5 py-1 rounded text-xs ${filtroStatus === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>{s}</button>
            ))}
          </div>
          <div className="space-y-2">
            {lista.map((r) => (
              <div key={r.id} className="erp-card p-0 overflow-hidden">
                <div className="p-3 flex items-start gap-3 justify-between border-b border-border/40">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-primary text-sm">{r.id}</span>
                      <StatusChip status={r.status} />
                      {r.tipo === 'automatica' && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Automática</span>}
                    </div>
                    <p className="text-sm font-medium mt-0.5">{r.op}</p>
                    <p className="text-xs text-muted-foreground">{r.itens.length} item(ns) · {fmtD(r.data)} · Solicitante: {r.operador}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {r.status === 'Pendente' && <button type="button" onClick={() => separar(r.id)} className="erp-btn-ghost text-xs flex items-center gap-1"><Package size={12} /> Separar</button>}
                    {r.status === 'Separado' && <button type="button" onClick={() => requisitar(r.id)} className="erp-btn-primary text-xs flex items-center gap-1"><CheckCircle size={12} /> Requisitar</button>}
                    <button type="button" onClick={() => setDetalhe(r)} className="erp-btn-ghost text-xs">Ver itens</button>
                  </div>
                </div>
                {/* Itens resumo */}
                <div className="p-2 flex flex-wrap gap-1.5">
                  {r.itens.map((it) => (
                    <div key={it.id} className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border ${it.sem_estoque ? 'border-red-300 bg-red-50 text-red-700' : 'border-border/50 bg-muted/20'}`}>
                      {it.sem_estoque && <AlertTriangle size={10} />}
                      <span className="font-mono">{it.codigo}</span>
                      <span className="text-muted-foreground">{it.qtd_requis} {it.unidade}</span>
                      {it.lote && <span className="text-[9px] text-muted-foreground">L:{it.lote}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!lista.length && <div className="erp-card p-8 text-center text-muted-foreground">Nenhuma requisição encontrada</div>}
          </div>
        </div>
      )}

      {/* ABA SEPARAÇÃO */}
      {aba === 'separacao' && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            Separe os materiais para as ordens de produção <strong>antes do consumo</strong>, conferindo mais organização ao almoxarifado.
          </div>
          {requisicoes.filter((r) => r.status === 'Pendente' || r.status === 'Separado').map((r) => (
            <div key={r.id} className="erp-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-semibold">{r.id}</span> <span className="text-muted-foreground text-sm">— {r.op}</span>
                  <StatusChip status={r.status} />
                </div>
              </div>
              <table className="w-full text-xs">
                <thead><tr className="bg-muted"><th className="text-left p-2">Material</th><th className="text-right p-2">Necessário</th><th className="text-right p-2">Solicitado c/ perda</th><th className="text-right p-2">Separado</th><th className="text-center p-2">Lote</th><th className="text-center p-2">Local</th><th className="text-center p-2">OK</th></tr></thead>
                <tbody>
                  {r.itens.map((it) => (
                    <tr key={it.id} className={`border-b border-border/30 ${it.sem_estoque ? 'bg-red-50/50' : ''}`}>
                      <td className="p-2"><div className="font-mono text-[10px]">{it.codigo}</div><div className="text-muted-foreground">{it.descricao}</div></td>
                      <td className="p-2 text-right">{it.qtd_necessaria} {it.unidade}</td>
                      <td className="p-2 text-right font-medium">{it.qtd_requis} {it.unidade}</td>
                      <td className="p-2 text-right">{it.qtd_separada > 0 ? `${it.qtd_separada} ${it.unidade}` : <span className="text-muted-foreground">—</span>}</td>
                      <td className="p-2 text-center text-muted-foreground">{it.lote || '—'}</td>
                      <td className="p-2 text-center text-muted-foreground">{it.local || '—'}</td>
                      <td className="p-2 text-center">
                        {it.sem_estoque
                          ? <AlertTriangle size={13} className="text-red-500 mx-auto" title="Sem estoque suficiente" />
                          : it.qtd_separada >= it.qtd_requis ? <CheckCircle size={13} className="text-green-500 mx-auto" /> : <XCircle size={13} className="text-muted-foreground mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {r.status === 'Pendente' && (
                <div className="mt-3 flex justify-end">
                  <button type="button" onClick={() => separar(r.id)} className="erp-btn-primary text-xs flex items-center gap-1.5"><Package size={12} /> Confirmar Separação</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ABA TRANSFERÊNCIAS */}
      {aba === 'transferencias' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Transfira materiais para o setor de produção com cálculo automático das quantidades</p>
            <button type="button" onClick={() => toast.info('Nova transferência')} className="erp-btn-primary text-xs flex items-center gap-1"><Plus size={12} /> Nova Transferência</button>
          </div>
          <div className="erp-card overflow-x-auto">
            <table className="erp-table w-full">
              <thead><tr><th>Transferência</th><th>OP</th><th>Data</th><th>Origem</th><th>Destino</th><th>Itens</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {transferencias.map((t) => (
                  <tr key={t.id}>
                    <td className="font-mono font-semibold text-primary">{t.id}</td>
                    <td>{t.op}</td>
                    <td>{fmtD(t.data)}</td>
                    <td>{t.origem}</td>
                    <td className="flex items-center gap-1"><ArrowRight size={12} className="text-muted-foreground" />{t.destino}</td>
                    <td className="text-center">{t.itens}</td>
                    <td><span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${t.status === 'Concluída' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.status}</span></td>
                    <td>
                      {t.status === 'Pendente' && <button type="button" onClick={() => { setTransferencias(transferencias.map((tf) => tf.id === t.id ? { ...tf, status: 'Concluída' } : tf)); toast.success('Transferência confirmada!'); }} className="text-xs text-green-600 hover:underline">Confirmar</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA CONFIG */}
      {aba === 'config' && (
        <div className="space-y-4 max-w-xl">
          <div className="erp-card p-4">
            <h3 className="text-sm font-semibold mb-3">Requisição Automática de Materiais</h3>
            <div className="space-y-3 text-sm">
              {[
                { id: 'ao_liberar', label: 'Requisição automática na liberação da OP', desc: 'Os materiais são requisitados automaticamente quando a ordem é liberada para produção.' },
                { id: 'ao_reportar', label: 'Requisição automática no reporte da produção', desc: 'Os materiais são requisitados na quantidade exata reportada como produzida.' },
                { id: 'alertar_sem_estoque', label: 'Alertar quando não houver estoque suficiente', desc: 'Exibir alerta visual nos itens sem estoque ao gerar a requisição.' },
                { id: 'incluir_perda', label: 'Incluir % de perda automáticamente', desc: 'Adiciona a porcentagem de perda cadastrada na BOM à quantidade requisitada.' },
              ].map((opt) => (
                <label key={opt.id} className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-muted/20 cursor-pointer">
                  <input type="checkbox" className="mt-0.5" defaultChecked={opt.id !== 'ao_reportar'} />
                  <div>
                    <p className="font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={() => toast.success('Configurações salvas!')} className="erp-btn-primary text-xs">Salvar Configurações</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Requisição */}
      {showNovaReq && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Nova Requisição de Materiais</h2>
              <button type="button" onClick={() => setShowNovaReq(false)}><XCircle size={18} /></button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div>
                <label className="erp-label">Ordem de Produção *</label>
                <select className="erp-input w-full" value={opSel} onChange={(e) => setOpSel(e.target.value)}>
                  <option value="">Selecione a OP...</option>
                  {opsDisponiveis.map((op) => <option key={op.id} value={op.id}>{op.id} — {op.produto}</option>)}
                </select>
              </div>
              <div>
                <label className="erp-label">Tipo de Requisição</label>
                <div className="flex gap-2">
                  {[
                    { value: 'normal', label: 'Manual' },
                    { value: 'automatica', label: 'Automática (BOM)' },
                  ].map((t) => (
                    <label key={t.value} className={`flex-1 p-2.5 rounded border cursor-pointer text-center text-xs font-medium ${tipoReq === t.value ? 'bg-primary/10 border-primary text-primary' : 'border-border hover:bg-muted/30'}`}>
                      <input type="radio" className="hidden" value={t.value} checked={tipoReq === t.value} onChange={(e) => setTipoReq(e.target.value)} />
                      {t.label}
                    </label>
                  ))}
                </div>
              </div>
              {tipoReq === 'automatica' && (
                <div className="bg-blue-50 border border-blue-100 rounded p-2 text-xs text-blue-700 flex items-center gap-1.5">
                  <RefreshCw size={12} /> A BOM ativa do produto será usada para calcular as quantidades automaticamente.
                </div>
              )}
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowNovaReq(false)} className="erp-btn-ghost">Cancelar</button>
              <button type="button" onClick={gerarRequisicao} className="erp-btn-primary">Gerar Requisição</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalhe */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div><h2 className="font-semibold">{detalhe.id}</h2><p className="text-xs text-muted-foreground">{detalhe.op} · {fmtD(detalhe.data)}</p></div>
              <button type="button" onClick={() => setDetalhe(null)}><XCircle size={18} /></button>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted"><th className="text-left p-2">Material</th><th className="text-right p-2">Necessário</th><th className="text-right p-2">Requisitado</th><th className="text-center p-2">Lote</th><th className="text-center p-2">Local</th><th className="text-center p-2">Status</th></tr></thead>
                <tbody>
                  {detalhe.itens.map((it) => (
                    <tr key={it.id} className="border-b border-border/30">
                      <td className="p-2"><div className="font-mono text-[10px] font-semibold">{it.codigo}</div><div className="text-muted-foreground">{it.descricao}</div></td>
                      <td className="p-2 text-right">{it.qtd_necessaria} {it.unidade}</td>
                      <td className="p-2 text-right font-medium">{it.qtd_requis} {it.unidade}</td>
                      <td className="p-2 text-center text-muted-foreground">{it.lote || '—'}</td>
                      <td className="p-2 text-center text-muted-foreground">{it.local || '—'}</td>
                      <td className="p-2 text-center">
                        {it.ok ? <CheckCircle size={13} className="text-green-500 mx-auto" /> : <XCircle size={13} className="text-yellow-500 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border flex justify-end">
              <button type="button" onClick={() => setDetalhe(null)} className="erp-btn-ghost text-xs">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
