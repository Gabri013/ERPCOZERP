import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Package, ShoppingCart, Factory, AlertTriangle, CheckCircle, Loader2, ChevronDown, ChevronRight, TrendingUp, Zap, Clock } from 'lucide-react';
import { toast } from 'sonner';

const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const ANO = new Date().getFullYear();
const MES_ATUAL = new Date().getMonth();
const PERIODOS = Array.from({ length: 6 }, (_, i) => {
  const m = (MES_ATUAL + i) % 12;
  const a = MES_ATUAL + i >= 12 ? ANO + 1 : ANO;
  return { label: `${MESES_ABREV[m]}/${a}`, mes: m, ano: a, idx: i };
});

// ─── Mock: Insumos com cálculo MRP ───────────────────────────────────────────
const MOCK_MRP = [
  {
    id: 1, codigo: 'MP-CHAPA-316L-3MM', descricao: 'Chapa Inox 316L 3mm', tipo: 'MP', unidade: 'kg',
    estoque_atual: 234.5, estoque_minimo: 200, lead_time: 15,
    necessidade_bruta: [240.6, 170.0, 205.0, 240.0, 85.0, 170.0],
    recepcao_pc:       [500.0, 0, 0, 0, 0, 0],
    empenhos:          [0, 0, 85.0, 0, 0, 0],
    lote_minimo: 500,
  },
  {
    id: 2, codigo: 'MP-TUBO-1.5', descricao: 'Tubo Inox 1.5" SCH10', tipo: 'MP', unidade: 'm',
    estoque_atual: 0, estoque_minimo: 80, lead_time: 20,
    necessidade_bruta: [16.4, 12.5, 25.0, 12.5, 16.4, 8.2],
    recepcao_pc:       [200.0, 0, 0, 0, 0, 0],
    empenhos:          [0, 0, 0, 0, 0, 0],
    lote_minimo: 100,
  },
  {
    id: 3, codigo: 'CP-BOCAL-2', descricao: 'Bocal 2" Inox 316L', tipo: 'CP', unidade: 'pc',
    estoque_atual: 24, estoque_minimo: 10, lead_time: 7,
    necessidade_bruta: [8, 4, 8, 4, 8, 4],
    recepcao_pc:       [0, 50, 0, 0, 0, 0],
    empenhos:          [0, 0, 0, 0, 0, 0],
    lote_minimo: 50,
  },
  {
    id: 4, codigo: 'SA-CORPO-TANK', descricao: 'Corpo Tanque (Semi-acabado)', tipo: 'SA', unidade: 'pc',
    estoque_atual: 0, estoque_minimo: 0, lead_time: 5,
    necessidade_bruta: [3, 4, 3, 4, 5, 4],
    recepcao_pc:       [0, 0, 0, 0, 0, 0],
    empenhos:          [0, 0, 0, 0, 0, 0],
    lote_minimo: 1,
  },
];

function calcMRP(item) {
  let saldo = item.estoque_atual;
  return PERIODOS.map((p, i) => {
    const nb = item.necessidade_bruta[i] || 0;
    const recepcao = item.recepcao_pc[i] || 0;
    const empenho = item.empenhos[i] || 0;
    const estDisp = saldo + recepcao - empenho;
    const nl = Math.max(0, nb - estDisp);
    const a_comprar = nl > 0 ? Math.ceil(nl / item.lote_minimo) * item.lote_minimo : 0;
    saldo = Math.max(0, estDisp + a_comprar - nb);
    return {
      ...p,
      nb,
      recepcao,
      empenho,
      est_disp: Math.max(0, estDisp),
      nl,
      a_comprar,
      saldo_proj: saldo,
      critico: a_comprar > 0 && saldo < item.estoque_minimo,
    };
  });
}

// ─── Mock CRP — Centro de Trabalho ───────────────────────────────────────────
const CENTROS = ['Corte', 'Soldagem', 'Acabamento', 'Montagem Final'];
const MOCK_CRP = CENTROS.map((c, ci) => ({
  centro: c,
  capacidade: 160,
  periodos: PERIODOS.map((p, i) => ({
    ...p,
    carga: [110, 140, 165, 130, 155, 125][i] + ci * 10 + Math.floor(Math.random() * 15),
  })),
}));

export default function MRP() {
  const [aba, setAba] = useState('mrp');
  const [expandido, setExpandido] = useState({});
  const [gerando, setGerando] = useState(false);
  const [gerado, setGerado] = useState({});

  const mrpCalc = useMemo(() => MOCK_MRP.map((item) => ({ ...item, periodos: calcMRP(item) })), []);

  const totalSCs = useMemo(() =>
    mrpCalc.filter((i) => i.tipo !== 'SA').reduce((s, i) => s + i.periodos.filter((p) => p.a_comprar > 0).length, 0),
    [mrpCalc]);
  const totalOPsSA = useMemo(() =>
    mrpCalc.filter((i) => i.tipo === 'SA').reduce((s, i) => s + i.periodos.filter((p) => p.a_comprar > 0).length, 0),
    [mrpCalc]);

  const gerarTudo = async () => {
    setGerando(true);
    await new Promise((r) => setTimeout(r, 2000));
    const resultado = {};
    mrpCalc.forEach((item) => {
      item.periodos.forEach((per) => {
        if (per.a_comprar > 0) resultado[`${item.id}-${per.label}`] = item.tipo === 'SA' ? 'op' : 'sc';
      });
    });
    setGerado(resultado);
    setGerando(false);
    toast.success(`MRP executado! ${totalSCs} solicitações de compra e ${totalOPsSA} OPs de semi-acabados geradas.`);
  };

  const gerarItem = async (itemId, periodoLabel, tipo) => {
    const key = `${itemId}-${periodoLabel}`;
    setGerado((p) => ({ ...p, [key]: 'gerando' }));
    await new Promise((r) => setTimeout(r, 700));
    setGerado((p) => ({ ...p, [key]: tipo === 'SA' ? 'op' : 'sc' }));
    toast.success(tipo === 'SA' ? 'OP de semi-acabado gerada!' : 'Solicitação de compra gerada!');
  };

  const crpChartData = useMemo(() => PERIODOS.map((p, i) => {
    const d = { name: p.label, capacidade: 160 };
    CENTROS.forEach((c, ci) => { d[c] = MOCK_CRP[ci].periodos[i].carga; });
    return d;
  }), []);

  const TIPO_COR = { 'MP': 'bg-blue-100 text-blue-700', 'CP': 'bg-teal-100 text-teal-700', 'SA': 'bg-orange-100 text-orange-700' };
  const TIPO_DESC = { 'MP': 'Matéria Prima', 'CP': 'Componente', 'SA': 'Semi-acabado' };
  const COR_CENTROS = ['#2563eb','#f59e0b','#10b981','#8b5cf6'];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Zap size={20} className="text-primary" /> MRP — Planejamento de Materiais</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Cálculo integrado com plano de produção, empenhos, pedidos de compra e estoque atual</p>
        </div>
        <button type="button" onClick={gerarTudo} disabled={gerando}
          className="erp-btn-primary flex items-center gap-2 disabled:opacity-60">
          {gerando ? <><Loader2 size={14} className="animate-spin" /> Executando MRP...</> : <><Zap size={14} /> Executar MRP</>}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Itens no MRP',         value: mrpCalc.length, color: 'text-primary' },
          { label: 'SC a gerar',           value: totalSCs, color: 'text-blue-600' },
          { label: 'OPs semi-acabados',    value: totalOPsSA, color: 'text-orange-600' },
          { label: 'Itens críticos',       value: mrpCalc.filter((i) => i.periodos.some((p) => p.critico)).length, color: 'text-red-600' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div className="border-b border-border flex gap-0">
        {[
          { id: 'mrp',  label: 'MRP — Necessidade de Materiais', icon: Package },
          { id: 'crp',  label: 'CRP — Necessidade de Capacidade', icon: TrendingUp },
        ].map((a) => (
          <button key={a.id} type="button" onClick={() => setAba(a.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${aba === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <a.icon size={12} /> {a.label}
          </button>
        ))}
      </div>

      {/* ── ABA MRP ─────────────────────────────────────────────────────────── */}
      {aba === 'mrp' && (
        <div className="space-y-2">
          {/* Legenda */}
          <div className="erp-card p-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 inline-block" /> Necessidade Bruta (do plano de produção)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 inline-block" /> Recepção Planejada (PCs em aberto)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-200 inline-block" /> A Comprar / A Produzir (lote mínimo)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-200 inline-block" /> Saldo Projetado</span>
          </div>

          {/* Por item */}
          {mrpCalc.map((item) => {
            const expKey = `item-${item.id}`;
            const totalAC = item.periodos.reduce((s, p) => s + p.a_comprar, 0);
            const temCritico = item.periodos.some((p) => p.critico);
            return (
              <div key={item.id} className="erp-card overflow-hidden">
                <button type="button" className="w-full flex items-center justify-between p-3 hover:bg-muted/10 text-left" onClick={() => setExpandido((p) => ({ ...p, [expKey]: !p[expKey] }))}>
                  <div className="flex items-center gap-3">
                    {item.tipo === 'SA' ? <Factory size={14} className="text-orange-500 shrink-0" /> : <Package size={14} className="text-blue-500 shrink-0" />}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-primary">{item.codigo}</span>
                        <span className="font-medium text-sm">{item.descricao}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${TIPO_COR[item.tipo]}`}>{TIPO_DESC[item.tipo]}</span>
                        {temCritico && <span className="flex items-center gap-0.5 text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded"><AlertTriangle size={9} /> Crítico</span>}
                      </div>
                      <div className="flex gap-3 mt-0.5 text-[10px] text-muted-foreground">
                        <span>Estoque: <strong>{item.estoque_atual} {item.unidade}</strong></span>
                        <span>Mínimo: <strong>{item.estoque_minimo} {item.unidade}</strong></span>
                        <span>Lead time: <strong>{item.lead_time}d</strong></span>
                        <span>Lote mín: <strong>{item.lote_minimo} {item.unidade}</strong></span>
                        {totalAC > 0 && <span className={`font-semibold ${item.tipo === 'SA' ? 'text-orange-600' : 'text-blue-600'}`}>
                          {item.tipo === 'SA' ? 'A produzir' : 'A comprar'}: {totalAC} {item.unidade}
                        </span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {totalAC > 0 ? <AlertTriangle size={14} className="text-orange-400" /> : <CheckCircle size={14} className="text-green-500" />}
                    {expandido[expKey] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </button>

                {expandido[expKey] && (
                  <div className="border-t border-border/40 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/20">
                          <th className="text-left px-3 py-2 sticky left-0 bg-white min-w-[200px]">Linha</th>
                          {PERIODOS.map((p) => <th key={p.label} className="text-right px-3 py-2 whitespace-nowrap">{p.label}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: 'Necessidade Bruta', key: 'nb', cls: 'bg-red-50/40 text-red-700' },
                          { label: 'Recepção Planejada (PC/OP abertas)', key: 'recepcao', cls: 'bg-green-50/40 text-green-700' },
                          { label: 'Empenhos não atendidos', key: 'empenho', cls: 'text-muted-foreground' },
                          { label: 'Estoque Disponível', key: 'est_disp', cls: 'bg-gray-50 font-semibold' },
                          { label: 'Necessidade Líquida', key: 'nl', cls: 'text-orange-600 font-semibold' },
                          { label: item.tipo === 'SA' ? '→ A Produzir (semi-acabado)' : '→ A Comprar (lote mín. aplicado)', key: 'a_comprar', cls: 'bg-blue-50/60 text-blue-700 font-bold' },
                          { label: 'Saldo Projetado', key: 'saldo_proj', cls: 'bg-purple-50/40 text-purple-700 font-semibold' },
                        ].map((row) => (
                          <tr key={row.key} className={`border-b border-border/20 ${row.cls}`}>
                            <td className={`px-3 py-1.5 sticky left-0 text-[11px] ${row.cls}`}>{row.label}</td>
                            {item.periodos.map((per, i) => (
                              <td key={i} className={`px-3 py-1.5 text-right ${per.critico && row.key === 'saldo_proj' ? 'text-red-600 font-bold' : ''}`}>
                                {row.key === 'a_comprar' && per.a_comprar > 0 ? (
                                  <div className="flex items-center justify-end gap-1">
                                    <span>{per.a_comprar}</span>
                                    {gerado[`${item.id}-${per.label}`] === 'gerando'
                                      ? <Loader2 size={10} className="animate-spin text-primary" />
                                      : gerado[`${item.id}-${per.label}`]
                                      ? <CheckCircle size={10} className={item.tipo === 'SA' ? 'text-orange-500' : 'text-blue-500'} />
                                      : (
                                        <button type="button" onClick={() => gerarItem(item.id, per.label, item.tipo)}
                                          className={`text-[9px] ${item.tipo === 'SA' ? 'bg-orange-500' : 'bg-blue-500'} text-white px-1 rounded hover:opacity-80 ml-0.5`}>
                                          {item.tipo === 'SA' ? 'OP' : 'SC'}
                                        </button>
                                      )}
                                  </div>
                                ) : (
                                  <span className={per[row.key] === 0 ? 'text-muted-foreground/30' : ''}>{per[row.key]}</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {/* Resumo de sugestões */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Solicitações de compra */}
            <div className="erp-card p-4">
              <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><ShoppingCart size={13} className="text-blue-500" /> Solicitações de Compra Sugeridas</h3>
              <table className="w-full text-xs">
                <thead><tr className="bg-muted"><th className="p-1.5 text-left">Código</th><th className="p-1.5 text-left">Período</th><th className="p-1.5 text-right">Qtd</th><th className="p-1.5 text-center">Status</th></tr></thead>
                <tbody>
                  {mrpCalc.filter((i) => i.tipo !== 'SA').flatMap((item) =>
                    item.periodos.filter((p) => p.a_comprar > 0).map((per) => {
                      const key = `${item.id}-${per.label}`;
                      return (
                        <tr key={key} className="border-b border-border/30">
                          <td className="p-1.5 font-mono text-[10px]">{item.codigo}</td>
                          <td className="p-1.5">{per.label}</td>
                          <td className="p-1.5 text-right font-medium">{per.a_comprar} {item.unidade}</td>
                          <td className="p-1.5 text-center">
                            {gerado[key] === 'sc' ? <CheckCircle size={11} className="text-green-500 mx-auto" /> : <Clock size={11} className="text-muted-foreground mx-auto" />}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {/* OPs de semi-acabados */}
            <div className="erp-card p-4">
              <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Factory size={13} className="text-orange-500" /> OPs Semi-acabados Sugeridas</h3>
              {mrpCalc.filter((i) => i.tipo === 'SA').flatMap((item) => item.periodos.filter((p) => p.a_comprar > 0)).length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma OP de semi-acabado necessária no período</p>
              ) : (
                <table className="w-full text-xs">
                  <thead><tr className="bg-muted"><th className="p-1.5 text-left">Código</th><th className="p-1.5 text-left">Período</th><th className="p-1.5 text-right">Qtd</th><th className="p-1.5 text-center">Status</th></tr></thead>
                  <tbody>
                    {mrpCalc.filter((i) => i.tipo === 'SA').flatMap((item) =>
                      item.periodos.filter((p) => p.a_comprar > 0).map((per) => {
                        const key = `${item.id}-${per.label}`;
                        return (
                          <tr key={key} className="border-b border-border/30">
                            <td className="p-1.5 font-mono text-[10px]">{item.codigo}</td>
                            <td className="p-1.5">{per.label}</td>
                            <td className="p-1.5 text-right font-medium">{per.a_comprar} {item.unidade}</td>
                            <td className="p-1.5 text-center">
                              {gerado[key] === 'op' ? <CheckCircle size={11} className="text-orange-500 mx-auto" /> : <Clock size={11} className="text-muted-foreground mx-auto" />}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ABA CRP ─────────────────────────────────────────────────────────── */}
      {aba === 'crp' && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
            <TrendingUp size={12} className="shrink-0 mt-0.5" />
            <span>O CRP (Planejamento da Necessidade de Capacidade) mostra a carga de trabalho projetada em cada centro de produção. Barras em vermelho indicam gargalos onde a carga supera a capacidade disponível.</span>
          </div>

          {/* Gráfico de carga */}
          <div className="erp-card p-4" style={{ height: 320 }}>
            <p className="text-xs font-semibold mb-3">Carga por Centro de Trabalho vs. Capacidade (horas/mês)</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={crpChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 220]} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine y={160} stroke="#ef4444" strokeDasharray="6 3" label={{ value: 'Cap. 160h', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
                {CENTROS.map((c, i) => <Bar key={c} dataKey={c} fill={COR_CENTROS[i]} radius={[3,3,0,0]} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela detalhe por centro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MOCK_CRP.map((ct, ci) => {
              const gargalos = ct.periodos.filter((p) => p.carga > ct.capacidade);
              return (
                <div key={ct.centro} className="erp-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold">{ct.centro}</h3>
                    <div className="flex items-center gap-1">
                      {gargalos.length > 0
                        ? <span className="flex items-center gap-0.5 text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded"><AlertTriangle size={9} /> {gargalos.length} gargalo(s)</span>
                        : <span className="flex items-center gap-0.5 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded"><CheckCircle size={9} /> OK</span>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {ct.periodos.map((p, i) => {
                      const perc = Math.min(100, Math.round((p.carga / ct.capacidade) * 100));
                      const supera = p.carga > ct.capacidade;
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-[10px] mb-0.5">
                            <span>{p.label}</span>
                            <span className={supera ? 'text-red-600 font-bold' : 'text-muted-foreground'}>{p.carga}h / {ct.capacidade}h ({perc}%)</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${supera ? 'bg-red-500' : perc > 80 ? 'bg-orange-400' : 'bg-green-500'}`} style={{ width: `${Math.min(100, perc)}%` }} />
                          </div>
                          {supera && <p className="text-[9px] text-red-500 mt-0.5">Gargalo: {p.carga - ct.capacidade}h acima da capacidade</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
