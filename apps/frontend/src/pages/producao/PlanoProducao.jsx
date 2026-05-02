import { useState, useMemo } from 'react';
import { Factory, CheckCircle, AlertTriangle, Plus, Loader2, ChevronDown, ChevronRight, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const ANO = new Date().getFullYear();
const MES_ATUAL = new Date().getMonth();
const PERIODOS = Array.from({ length: 6 }, (_, i) => {
  const m = (MES_ATUAL + i) % 12;
  const a = MES_ATUAL + i >= 12 ? ANO + 1 : ANO;
  return { label: `${MESES_ABREV[m]}/${a}`, mes: m, ano: a, idx: i };
});

// Plano de produção: calcula necessidade = Previsão + Pedidos em carteira - Estoque atual - Estoque mínimo
const MOCK_PLANO = [
  {
    id: 1, codigo: 'TANK-500L', descricao: 'Tanque Inox 316L 500L', tipo: 'PA', unidade: 'pc',
    estoque_atual: 2, estoque_minimo: 1,
    previsao:         [3, 4, 3, 4, 5, 4],
    pedidos_carteira: [2, 1, 0, 1, 0, 0],
    ops_abertas:      [2, 0, 0, 0, 0, 0],
  },
  {
    id: 2, codigo: 'REATOR-200L', descricao: 'Reator Inox 316L 200L', tipo: 'PA', unidade: 'pc',
    estoque_atual: 0, estoque_minimo: 1,
    previsao:         [2, 2, 1, 2, 2, 1],
    pedidos_carteira: [1, 1, 0, 0, 0, 0],
    ops_abertas:      [1, 0, 0, 0, 0, 0],
  },
  {
    id: 3, codigo: 'COND-50M2', descricao: 'Condensador Tubular 50m²', tipo: 'PA', unidade: 'pc',
    estoque_atual: 0, estoque_minimo: 0,
    previsao:         [1, 1, 2, 1, 1, 1],
    pedidos_carteira: [0, 1, 0, 0, 0, 0],
    ops_abertas:      [0, 0, 0, 0, 0, 0],
  },
  {
    id: 4, codigo: 'TANKMIX-1000L', descricao: 'Tanque Misturador 1000L', tipo: 'PA', unidade: 'pc',
    estoque_atual: 1, estoque_minimo: 1,
    previsao:         [1, 2, 1, 2, 1, 2],
    pedidos_carteira: [1, 0, 0, 0, 0, 0],
    ops_abertas:      [0, 0, 0, 0, 0, 0],
  },
];

function calcPlano(prod) {
  let saldoProjetado = prod.estoque_atual;
  return PERIODOS.map((p, i) => {
    const demanda = (prod.previsao[i] || 0) + (prod.pedidos_carteira[i] || 0);
    const recepcao = prod.ops_abertas[i] || 0;
    const necessidade_bruta = Math.max(0, demanda - saldoProjetado - recepcao);
    const necessidade_liq = Math.max(0, necessidade_bruta + prod.estoque_minimo - saldoProjetado - recepcao);
    const a_produzir = necessidade_liq > 0 ? necessidade_liq : 0;
    saldoProjetado = saldoProjetado + recepcao + a_produzir - demanda;
    saldoProjetado = Math.max(0, saldoProjetado);
    return {
      ...p,
      previsao: prod.previsao[i] || 0,
      pedidos: prod.pedidos_carteira[i] || 0,
      demanda,
      recepcao,
      a_produzir,
      saldo_proj: saldoProjetado,
      alerta: a_produzir > 0,
    };
  });
}

export default function PlanoProducao() {
  const [expandido, setExpandido] = useState({});
  const [gerandoTudo, setGerandoTudo] = useState(false);
  const [opsGeradas, setOpsGeradas] = useState({});

  const plano = useMemo(() => MOCK_PLANO.map((p) => ({ ...p, periodos: calcPlano(p) })), []);

  const totalOpsNecessarias = useMemo(() =>
    plano.reduce((s, p) => s + p.periodos.reduce((ss, per) => ss + (per.a_produzir > 0 ? 1 : 0), 0), 0),
    [plano]);

  const totalAProduzir = useMemo(() =>
    plano.map((p) => ({ codigo: p.codigo, total: p.periodos.reduce((s, per) => s + per.a_produzir, 0) })),
    [plano]);

  const gerarOPs = async (prodId, periodo) => {
    const key = `${prodId}-${periodo}`;
    setOpsGeradas((prev) => ({ ...prev, [key]: 'gerando' }));
    await new Promise((r) => setTimeout(r, 800));
    setOpsGeradas((prev) => ({ ...prev, [key]: 'gerada' }));
    toast.success(`OP gerada para o período ${periodo}!`);
  };

  const gerarTodasOPs = async () => {
    setGerandoTudo(true);
    await new Promise((r) => setTimeout(r, 1800));
    const novas = {};
    plano.forEach((p) => {
      p.periodos.forEach((per) => {
        if (per.a_produzir > 0) novas[`${p.id}-${per.label}`] = 'gerada';
      });
    });
    setOpsGeradas(novas);
    setGerandoTudo(false);
    toast.success(`${totalOpsNecessarias} ordens de produção geradas automaticamente!`);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Factory size={20} className="text-primary" /> Plano de Produção</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Cálculo a partir da previsão de vendas, pedidos em carteira e saldo atual de estoque</p>
        </div>
        <button type="button" onClick={gerarTodasOPs} disabled={gerandoTudo || totalOpsNecessarias === 0}
          className="erp-btn-primary flex items-center gap-2 disabled:opacity-60">
          {gerandoTudo ? <><Loader2 size={14} className="animate-spin" /> Gerando OPs...</> : <><Plus size={14} /> Gerar Todas OPs ({totalOpsNecessarias})</>}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">Produtos no plano</p><p className="text-lg font-bold">{plano.length}</p></div>
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">OPs necessárias</p><p className="text-lg font-bold text-orange-600">{totalOpsNecessarias}</p></div>
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">OPs já geradas</p><p className="text-lg font-bold text-green-600">{Object.values(opsGeradas).filter((v) => v === 'gerada').length}</p></div>
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">Horizonte planejado</p><p className="text-lg font-bold text-primary">{PERIODOS.length} meses</p></div>
      </div>

      {/* Legenda */}
      <div className="erp-card p-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-200 inline-block" /> Previsão de Vendas</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 inline-block" /> Pedidos em Carteira</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-200 inline-block" /> A Produzir (sugestão)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-200 inline-block" /> Saldo Projetado</span>
      </div>

      {/* Plano por produto */}
      <div className="space-y-2">
        {plano.map((prod) => {
          const expKey = `prod-${prod.id}`;
          const totalProd = prod.periodos.reduce((s, p) => s + p.a_produzir, 0);
          return (
            <div key={prod.id} className="erp-card overflow-hidden">
              <button type="button" className="w-full flex items-center justify-between p-3 hover:bg-muted/10 transition-colors text-left" onClick={() => setExpandido((p) => ({ ...p, [expKey]: !p[expKey] }))}>
                <div className="flex items-center gap-3">
                  <Factory size={15} className="text-primary shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-primary">{prod.codigo}</span>
                      <span className="font-medium text-sm">{prod.descricao}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${prod.tipo === 'PA' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{prod.tipo}</span>
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground mt-0.5">
                      <span>Estoque atual: <strong>{prod.estoque_atual} {prod.unidade}</strong></span>
                      <span>Mínimo: <strong>{prod.estoque_minimo} {prod.unidade}</strong></span>
                      {totalProd > 0 && <span className="text-orange-600 font-semibold">A produzir (6m): {totalProd} {prod.unidade}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {totalProd > 0 ? <AlertTriangle size={14} className="text-orange-500" /> : <CheckCircle size={14} className="text-green-500" />}
                  {expandido[expKey] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </button>

              {expandido[expKey] && (
                <div className="border-t border-border/40 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/20">
                        <th className="text-left px-3 py-2 sticky left-0 bg-white min-w-[140px]">Linha</th>
                        {PERIODOS.map((p) => <th key={p.label} className="text-right px-3 py-2 whitespace-nowrap">{p.label}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Previsão de Vendas', key: 'previsao', cls: 'bg-blue-50/40 text-blue-700' },
                        { label: 'Pedidos em Carteira', key: 'pedidos', cls: 'bg-green-50/40 text-green-700' },
                        { label: 'Demanda Total', key: 'demanda', cls: 'bg-gray-50 font-semibold' },
                        { label: 'Recepção Planejada (OPs abertas)', key: 'recepcao', cls: 'text-muted-foreground' },
                        { label: '→ A Produzir (sugestão)', key: 'a_produzir', cls: 'bg-orange-50/60 text-orange-700 font-bold' },
                        { label: 'Saldo Projetado', key: 'saldo_proj', cls: 'bg-purple-50/40 text-purple-700 font-semibold' },
                      ].map((row) => (
                        <tr key={row.key} className={`border-b border-border/20 ${row.cls}`}>
                          <td className={`px-3 py-1.5 sticky left-0 ${row.cls}`}>{row.label}</td>
                          {prod.periodos.map((per, i) => (
                            <td key={i} className="px-3 py-1.5 text-right">
                              {row.key === 'a_produzir' && per.a_produzir > 0 ? (
                                <div className="flex items-center justify-end gap-1">
                                  <span>{per[row.key]}</span>
                                  {opsGeradas[`${prod.id}-${per.label}`] === 'gerada'
                                    ? <CheckCircle size={11} className="text-green-500" />
                                    : opsGeradas[`${prod.id}-${per.label}`] === 'gerando'
                                    ? <Loader2 size={11} className="animate-spin text-primary" />
                                    : (
                                      <button type="button" onClick={() => gerarOPs(prod.id, per.label)}
                                        className="text-[9px] bg-primary text-white px-1 rounded hover:opacity-80 ml-1">OP</button>
                                    )}
                                </div>
                              ) : (
                                <span className={per[row.key] === 0 ? 'text-muted-foreground/40' : ''}>{per[row.key]}</span>
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
      </div>

      {/* Sumário total */}
      <div className="erp-card p-4">
        <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><TrendingUp size={13} className="text-primary" /> Resumo do Plano — próximos 6 meses</h3>
        <table className="w-full text-xs">
          <thead><tr className="bg-muted"><th className="text-left p-2">Produto</th><th className="text-right p-2">Total a Produzir</th>{PERIODOS.map((p) => <th key={p.label} className="text-right p-2 whitespace-nowrap">{p.label}</th>)}</tr></thead>
          <tbody>
            {plano.map((prod) => (
              <tr key={prod.id} className="border-b border-border/30">
                <td className="p-2"><div className="font-mono font-semibold text-primary">{prod.codigo}</div></td>
                <td className="p-2 text-right font-bold">{prod.periodos.reduce((s, p) => s + p.a_produzir, 0)} {prod.unidade}</td>
                {prod.periodos.map((per, i) => (
                  <td key={i} className={`p-2 text-right ${per.a_produzir > 0 ? 'text-orange-600 font-semibold' : 'text-muted-foreground/40'}`}>
                    {per.a_produzir > 0 ? per.a_produzir : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
