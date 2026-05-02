import { useState, useMemo, useRef } from 'react';
import { Plus, Search, CheckCircle, XCircle, Printer, Tag, AlertTriangle, Package, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';

const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';
const fmtDT = (v) => v ? new Date(v).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const hoje = new Date().toISOString().split('T')[0];
const addDias = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };

const STATUS_REP = {
  'Pendente':     'bg-yellow-100 text-yellow-700',
  'Em Produção':  'bg-blue-100 text-blue-700',
  'Concluído':    'bg-green-100 text-green-700',
  'Com Refugo':   'bg-red-100 text-red-700',
};

const MOCK_OPS = [
  {
    id: 'OP-2025-001', produto: 'Tanque Inox 316L 500L', codigo_produto: 'TANK-500L',
    qtd_planejada: 2, qtd_reportada: 1, qtd_refugo: 0, qtd_re_trabalho: 0,
    status: 'Em Produção', operadores: ['João S.', 'Maria L.'],
    prazo: addDias(hoje, 12),
    subprodutos: [{ codigo: 'SP-APARAS-INOX', descricao: 'Aparas de inox', qtd_esperada: 9.0, qtd_gerada: 0, unidade: 'kg' }],
    co_produtos: [],
    reportes: [
      { id: 1, data: addDias(hoje, -1) + 'T14:30:00', operador: 'João S.', qtd: 1, lote: 'LT-2025-0051', refugo: 0, obs: '' },
    ],
  },
  {
    id: 'OP-2025-002', produto: 'Trocador Tubular 100m²', codigo_produto: 'TROCADOR-100',
    qtd_planejada: 2, qtd_reportada: 0, qtd_refugo: 0, qtd_re_trabalho: 0,
    status: 'Pendente', operadores: ['Ana P.'],
    prazo: addDias(hoje, 20),
    subprodutos: [{ codigo: 'SP-APARAS-INOX', descricao: 'Aparas de inox', qtd_esperada: 6.4, qtd_gerada: 0, unidade: 'kg' }],
    co_produtos: [],
    reportes: [],
  },
  {
    id: 'OP-2025-003', produto: 'Reator 200L', codigo_produto: 'REATOR-200L',
    qtd_planejada: 1, qtd_reportada: 1, qtd_refugo: 0, qtd_re_trabalho: 0,
    status: 'Concluído', operadores: ['Carlos M.'],
    prazo: addDias(hoje, -2),
    subprodutos: [{ codigo: 'SP-APARAS-INOX', descricao: 'Aparas de inox', qtd_esperada: 3.5, qtd_gerada: 3.5, unidade: 'kg' }],
    co_produtos: [],
    reportes: [
      { id: 1, data: addDias(hoje, -3) + 'T09:15:00', operador: 'Carlos M.', qtd: 1, lote: 'LT-2025-0048', refugo: 0, obs: '' },
    ],
  },
];

const ETIQUETA_LAYOUT = (op, lote, qtd) => ({
  linha1: op.produto,
  linha2: `Cód: ${op.codigo_produto}`,
  linha3: `OP: ${op.id} | Lote: ${lote || '—'}`,
  linha4: `Qtd: ${qtd} pcs | ${new Date().toLocaleDateString('pt-BR')}`,
});

export default function ReporteProducao() {
  const [aba, setAba] = useState('reportes');
  const [ops, setOps] = useState(MOCK_OPS);
  const [opSel, setOpSel] = useState(null);
  const [showReporte, setShowReporte] = useState(false);
  const [showEtiqueta, setShowEtiqueta] = useState(null);
  const [busca, setBusca] = useState('');
  const [qtdReporte, setQtdReporte] = useState(1);
  const [loteReporte, setLoteReporte] = useState('');
  const [refugoReporte, setRefugoReporte] = useState(0);
  const [subprodsReporte, setSubprodsReporte] = useState([]);
  const [qtdEtiquetas, setQtdEtiquetas] = useState(1);

  const listaFiltrada = useMemo(() => {
    if (!busca) return ops;
    const q = busca.toLowerCase();
    return ops.filter((o) => o.id.toLowerCase().includes(q) || o.produto.toLowerCase().includes(q));
  }, [ops, busca]);

  const kpis = useMemo(() => ({
    total_ops: ops.length,
    em_producao: ops.filter((o) => o.status === 'Em Produção').length,
    concluidas: ops.filter((o) => o.status === 'Concluído').length,
    total_reportado: ops.reduce((s, o) => s + o.qtd_reportada, 0),
  }), [ops]);

  const abrirReporte = (op) => {
    setOpSel(op);
    setQtdReporte(op.qtd_planejada - op.qtd_reportada);
    setLoteReporte('');
    setRefugoReporte(0);
    setSubprodsReporte(op.subprodutos.map((sp) => ({ ...sp, qtd_reportar: 0 })));
    setShowReporte(true);
  };

  const salvarReporte = () => {
    if (!opSel || qtdReporte <= 0) return;
    const novoReporte = {
      id: Date.now(),
      data: new Date().toISOString(),
      operador: 'Usuário Atual',
      qtd: qtdReporte,
      lote: loteReporte,
      refugo: refugoReporte,
      obs: '',
    };
    const qtdNovaTotal = opSel.qtd_reportada + qtdReporte;
    const novoStatus = qtdNovaTotal >= opSel.qtd_planejada
      ? (refugoReporte > 0 ? 'Com Refugo' : 'Concluído')
      : 'Em Produção';
    setOps(ops.map((o) => o.id === opSel.id ? {
      ...o,
      qtd_reportada: qtdNovaTotal,
      qtd_refugo: o.qtd_refugo + refugoReporte,
      status: novoStatus,
      reportes: [...o.reportes, novoReporte],
      subprodutos: o.subprodutos.map((sp, i) => ({ ...sp, qtd_gerada: sp.qtd_gerada + (subprodsReporte[i]?.qtd_reportar || 0) })),
    } : o));
    setShowReporte(false);
    setShowEtiqueta(opSel);
    toast.success(`Reporte registrado! ${qtdNovaTotal >= opSel.qtd_planejada ? 'OP concluída — estoque atualizado.' : 'Produção parcial registrada.'}`);
  };

  const imprimirEtiquetas = () => {
    toast.success(`${qtdEtiquetas} etiqueta(s) enviada(s) para impressão!`);
    setShowEtiqueta(null);
  };

  const StatusChip = ({ s }) => <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_REP[s] || 'bg-muted'}`}>{s}</span>;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Reporte da Produção</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registre a produção, subprodutos, refugos e gere etiquetas de identificação</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'OPs em produção', value: kpis.em_producao, color: 'text-blue-600' },
          { label: 'OPs concluídas', value: kpis.concluidas, color: 'text-green-600' },
          { label: 'Total de OPs', value: kpis.total_ops, color: '' },
          { label: 'Qtd. total reportada', value: kpis.total_reportado + ' pcs', color: 'text-primary' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div className="border-b border-border flex gap-0">
        {[
          { id: 'reportes', label: 'Reporte de Produção' },
          { id: 'subprodutos', label: 'Subprodutos e Co-produtos' },
          { id: 'etiquetas', label: 'Etiquetas' },
        ].map((a) => (
          <button key={a.id} type="button" onClick={() => setAba(a.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${aba === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ABA REPORTES */}
      {aba === 'reportes' && (
        <div className="space-y-3">
          <div className="relative max-w-xs">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="erp-input pl-7 text-xs w-full" placeholder="Buscar OP..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <div className="space-y-2">
            {listaFiltrada.map((op) => {
              const pct = op.qtd_planejada > 0 ? Math.round((op.qtd_reportada / op.qtd_planejada) * 100) : 0;
              return (
                <div key={op.id} className="erp-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-primary">{op.id}</span>
                        <StatusChip s={op.status} />
                        {op.qtd_reportada > 0 && op.qtd_reportada < op.qtd_planejada && (
                          <span className="text-[11px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Parcial</span>
                        )}
                      </div>
                      <p className="font-medium mt-0.5">{op.produto}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>Prazo: <strong>{fmtD(op.prazo)}</strong></span>
                        <span>{op.reportes.length} reporte(s)</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold text-primary">{op.qtd_reportada}<span className="text-sm text-muted-foreground">/{op.qtd_planejada}</span></p>
                      <p className="text-[10px] text-muted-foreground">produzido/planejado</p>
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>{pct}% concluído</span>
                      {op.qtd_refugo > 0 && <span className="text-red-600">Refugo: {op.qtd_refugo}</span>}
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>

                  {/* Histórico de reportes */}
                  {op.reportes.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {op.reportes.map((r) => (
                        <div key={r.id} className="text-[10px] bg-muted/30 px-2 py-1 rounded flex items-center gap-1">
                          <CheckCircle size={9} className="text-green-500" />
                          <span>{r.qtd} pcs · {fmtDT(r.data)} · {r.operador}</span>
                          {r.lote && <span className="text-muted-foreground">L:{r.lote}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ações */}
                  <div className="mt-3 flex gap-2">
                    {op.status !== 'Concluído' && (
                      <button type="button" onClick={() => abrirReporte(op)} className="erp-btn-primary text-xs flex items-center gap-1.5">
                        <Plus size={12} /> Registrar Produção
                      </button>
                    )}
                    <button type="button" onClick={() => setShowEtiqueta(op)} className="erp-btn-ghost text-xs flex items-center gap-1.5">
                      <Tag size={12} /> Emitir Etiquetas
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA SUBPRODUTOS */}
      {aba === 'subprodutos' && (
        <div className="space-y-3">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
            Registre subprodutos (aparas, resíduos) e co-produtos gerados nas ordens de produção para controle de perdas e produção conjunta.
          </div>
          {ops.filter((o) => o.subprodutos.length > 0 || o.co_produtos.length > 0).map((op) => (
            <div key={op.id} className="erp-card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">{op.id} — {op.produto}</span>
                <StatusChip s={op.status} />
              </div>
              {op.subprodutos.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Subprodutos</p>
                  <table className="w-full text-xs">
                    <thead><tr className="bg-muted"><th className="text-left p-2">Código</th><th className="text-left p-2">Descrição</th><th className="text-right p-2">Qtd Esperada</th><th className="text-right p-2">Qtd Gerada</th><th className="text-right p-2">Diferença</th><th className="text-center p-2">Status</th></tr></thead>
                    <tbody>
                      {op.subprodutos.map((sp, i) => {
                        const diff = sp.qtd_gerada - sp.qtd_esperada;
                        return (
                          <tr key={i} className="border-b border-border/30">
                            <td className="p-2 font-mono">{sp.codigo}</td>
                            <td className="p-2">{sp.descricao}</td>
                            <td className="p-2 text-right">{sp.qtd_esperada} {sp.unidade}</td>
                            <td className="p-2 text-right font-medium">{sp.qtd_gerada || '—'} {sp.qtd_gerada ? sp.unidade : ''}</td>
                            <td className={`p-2 text-right ${diff < 0 ? 'text-red-600' : diff > 0 ? 'text-green-600' : ''}`}>{sp.qtd_gerada ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)} ${sp.unidade}` : '—'}</td>
                            <td className="p-2 text-center">
                              {sp.qtd_gerada >= sp.qtd_esperada
                                ? <CheckCircle size={13} className="text-green-500 mx-auto" />
                                : sp.qtd_gerada > 0
                                  ? <AlertTriangle size={13} className="text-yellow-500 mx-auto" />
                                  : <XCircle size={13} className="text-muted-foreground mx-auto" />}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {op.co_produtos.length === 0 && op.subprodutos.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum subproduto ou co-produto cadastrado na BOM.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ABA ETIQUETAS */}
      {aba === 'etiquetas' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Selecione uma OP para gerar etiquetas de identificação dos produtos fabricados.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ops.map((op) => (
              <button key={op.id} type="button" onClick={() => setShowEtiqueta(op)}
                className="erp-card p-4 text-left hover:bg-primary/5 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-semibold text-primary text-sm">{op.id}</span>
                  <Tag size={15} className="text-muted-foreground" />
                </div>
                <p className="text-sm font-medium leading-tight">{op.produto}</p>
                <p className="text-xs text-muted-foreground mt-1">{op.qtd_reportada} pcs produzidas</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal Reporte */}
      {showReporte && opSel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div><h2 className="font-semibold">Registrar Produção</h2><p className="text-xs text-muted-foreground">{opSel.id} — {opSel.produto}</p></div>
              <button type="button" onClick={() => setShowReporte(false)}><XCircle size={18} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="erp-label">Quantidade Produzida *</label>
                  <input type="number" step="1" min="0" className="erp-input w-full text-lg font-bold" value={qtdReporte} onChange={(e) => setQtdReporte(Number(e.target.value))} />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Planejado: {opSel.qtd_planejada} · Já reportado: {opSel.qtd_reportada}</p>
                </div>
                <div>
                  <label className="erp-label">Refugo / Rejeitos</label>
                  <input type="number" step="1" min="0" className="erp-input w-full" value={refugoReporte} onChange={(e) => setRefugoReporte(Number(e.target.value))} />
                </div>
                <div className="col-span-2">
                  <label className="erp-label">Lote de Rastreabilidade</label>
                  <input className="erp-input w-full font-mono" placeholder="Ex: LT-2025-0055" value={loteReporte} onChange={(e) => setLoteReporte(e.target.value)} />
                </div>
              </div>

              {/* Subprodutos */}
              {subprodsReporte.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Subprodutos Gerados</p>
                  {subprodsReporte.map((sp, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm mb-2">
                      <span className="flex-1 text-xs">{sp.descricao} ({sp.codigo})</span>
                      <input type="number" step="0.01" min="0" className="erp-input w-24 text-xs"
                        placeholder={`Esp: ${sp.qtd_esperada}`}
                        value={sp.qtd_reportar}
                        onChange={(e) => setSubprodsReporte(subprodsReporte.map((s, j) => j === i ? { ...s, qtd_reportar: Number(e.target.value) } : s))} />
                      <span className="text-xs text-muted-foreground">{sp.unidade}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowReporte(false)} className="erp-btn-ghost">Cancelar</button>
              <button type="button" onClick={salvarReporte} className="erp-btn-primary flex items-center gap-1.5"><CheckCircle size={13} /> Salvar Reporte</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Etiquetas */}
      {showEtiqueta && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Emitir Etiquetas — {showEtiqueta.id}</h2>
              <button type="button" onClick={() => setShowEtiqueta(null)}><XCircle size={18} /></button>
            </div>
            <div className="p-4 space-y-4">
              {/* Preview etiqueta */}
              <div className="border-2 border-dashed border-border rounded-lg p-4 font-mono text-xs bg-white">
                <div className="text-center mb-2">
                  <div className="text-sm font-bold uppercase">{showEtiqueta.produto}</div>
                  <div className="text-muted-foreground">Cód: {showEtiqueta.codigo_produto}</div>
                </div>
                <div className="border-t border-border pt-2 grid grid-cols-2 gap-1 text-[10px]">
                  <div><span className="text-muted-foreground">OP:</span> {showEtiqueta.id}</div>
                  <div><span className="text-muted-foreground">Qtd:</span> 1 pcs</div>
                  <div><span className="text-muted-foreground">Data:</span> {new Date().toLocaleDateString('pt-BR')}</div>
                  <div><span className="text-muted-foreground">Lote:</span> {loteReporte || '—'}</div>
                </div>
                <div className="mt-2 flex justify-center">
                  <div className="bg-gray-200 w-32 h-10 flex items-center justify-center text-[9px] text-muted-foreground rounded">[Código de Barras]</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <label className="erp-label shrink-0">Quantidade de etiquetas:</label>
                <input type="number" min="1" max="100" className="erp-input w-20" value={qtdEtiquetas} onChange={(e) => setQtdEtiquetas(Number(e.target.value))} />
              </div>

              <div className="text-xs text-muted-foreground bg-muted/20 rounded p-2">
                Layout personalizável via configurações de etiquetas. Suporte a impressoras de etiqueta térmica (ZEBRA, ARGOX, TSC).
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowEtiqueta(null)} className="erp-btn-ghost text-xs">Fechar</button>
              <button type="button" onClick={imprimirEtiquetas} className="erp-btn-primary text-xs flex items-center gap-1.5">
                <Printer size={13} /> Imprimir {qtdEtiquetas} Etiqueta(s)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
