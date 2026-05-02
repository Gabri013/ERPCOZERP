import { useState, useMemo, useEffect, useCallback } from 'react';
import { listStandardCosts, upsertStandardCost } from '@/services/accountingApi.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Calculator, ChevronRight, ChevronDown, TrendingUp, Target, DollarSign, Package, AlertTriangle, CheckCircle, Printer, Download } from 'lucide-react';
import { toast } from 'sonner';

const R$ = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (v) => `${Number(v).toFixed(1)}%`;

// ─── Centros de Custo + Taxas Hora ───────────────────────────────────────────
const CENTROS_CUSTO = [
  { id: 1, nome: 'Corte / Plasma',   cap_horas: 160, custo_fixo: 18400, custo_var_h: 12.5,  total_mes: 23600, ocupacao: 78, taxa_h: null },
  { id: 2, nome: 'Dobra / Prensa',   cap_horas: 160, custo_fixo: 12800, custo_var_h: 8.0,   total_mes: 17600, ocupacao: 62, taxa_h: null },
  { id: 3, nome: 'Soldagem MIG/TIG', cap_horas: 320, custo_fixo: 28000, custo_var_h: 15.0,  total_mes: 42800, ocupacao: 88, taxa_h: null },
  { id: 4, nome: 'Acabamento',       cap_horas: 160, custo_fixo: 9600,  custo_var_h: 9.5,   total_mes: 14720, ocupacao: 55, taxa_h: null },
  { id: 5, nome: 'Montagem Final',   cap_horas: 160, custo_fixo: 11200, custo_var_h: 10.0,  total_mes: 16200, ocupacao: 70, taxa_h: null },
].map((c) => ({ ...c, taxa_h: Number((c.total_mes / (c.cap_horas * c.ocupacao / 100)).toFixed(2)) }));

// ─── Produtos com estrutura de custo ─────────────────────────────────────────
const PRODUTOS = [
  {
    id: 1, codigo: 'TANK-500L', nome: 'Tanque Inox 316L 500L', unidade: 'pc', lote_std: 1,
    materiais: [
      { codigo: 'MP-CHAPA-316L-3MM', descricao: 'Chapa Inox 316L 3mm',   qtd: 120.3, unidade: 'kg', custo_u: 45.80, perda: 5 },
      { codigo: 'MP-TUBO-1.5',       descricao: 'Tubo Inox 1.5" SCH10',  qtd: 8.2,   unidade: 'm',  custo_u: 28.50, perda: 2 },
      { codigo: 'CP-BOCAL-2',        descricao: 'Bocal 2" Inox 316L',    qtd: 4,     unidade: 'pc', custo_u: 18.20, perda: 0 },
      { codigo: 'CP-VALVULA',        descricao: 'Válvula Inox 1"',        qtd: 2,     unidade: 'pc', custo_u: 42.00, perda: 0 },
    ],
    operacoes: [
      { centro: 'Corte / Plasma',   operacao: 'Corte Chapa',   t_std_h: 2.0 },
      { centro: 'Dobra / Prensa',   operacao: 'Dobra Flanges', t_std_h: 1.0 },
      { centro: 'Soldagem MIG/TIG', operacao: 'Soldagem MIG',  t_std_h: 4.0 },
      { centro: 'Acabamento',       operacao: 'Polimento',     t_std_h: 2.0 },
      { centro: 'Montagem Final',   operacao: 'Montagem',      t_std_h: 1.5 },
    ],
    overhead_pct: 20,
    preco_mercado: 12500,
  },
  {
    id: 2, codigo: 'REATOR-200L', nome: 'Reator Inox 316L 200L', unidade: 'pc', lote_std: 1,
    materiais: [
      { codigo: 'MP-CHAPA-316L-3MM', descricao: 'Chapa Inox 316L 3mm',   qtd: 85.0,  unidade: 'kg', custo_u: 45.80, perda: 4 },
      { codigo: 'MP-TUBO-1.5',       descricao: 'Tubo Inox 1.5" SCH10',  qtd: 12.5,  unidade: 'm',  custo_u: 28.50, perda: 3 },
      { codigo: 'CP-BOCAL-2',        descricao: 'Bocal 2" Inox 316L',    qtd: 3,     unidade: 'pc', custo_u: 18.20, perda: 0 },
    ],
    operacoes: [
      { centro: 'Corte / Plasma',   operacao: 'Corte',         t_std_h: 1.5 },
      { centro: 'Soldagem MIG/TIG', operacao: 'Soldagem TIG',  t_std_h: 5.5 },
      { centro: 'Acabamento',       operacao: 'Acabamento',    t_std_h: 1.5 },
      { centro: 'Montagem Final',   operacao: 'Montagem',      t_std_h: 1.0 },
    ],
    overhead_pct: 20,
    preco_mercado: 8800,
  },
];

function calcCusto(prod) {
  const taxaMap = Object.fromEntries(CENTROS_CUSTO.map((c) => [c.nome, c.taxa_h]));
  const custMat = prod.materiais.reduce((s, m) => s + m.qtd * m.custo_u * (1 + m.perda / 100), 0);
  const custMOD = prod.operacoes.reduce((s, o) => s + o.t_std_h * (taxaMap[o.centro] || 0), 0);
  const custCIF = custMOD * (prod.overhead_pct / 100);
  const custTotal = custMat + custMOD + custCIF;
  return { custMat, custMOD, custCIF, custTotal };
}

const CORES_CUSTO = ['#2563eb', '#f59e0b', '#10b981'];
const PIE_CORES = ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6'];

export default function CusteioPadrao() {
  const [aba, setAba] = useState('custo');
  const [produtos, setProdutos] = useState([]);
  const [prodSel, setProdSel] = useState(null);
  const [expandMat, setExpandMat] = useState(true);
  const [expandOp, setExpandOp] = useState(true);
  const [margem, setMargem] = useState(35);
  const [impostos, setImpostos] = useState(18);
  const [comissao, setComissao] = useState(5);
  const [frete, setFrete] = useState(2);
  const [loteSimul, setLoteSimul] = useState(1);
  const [margemAlvo, setMargemAlvo] = useState(30);

  const loadCosts = useCallback(async () => {
    try {
      const data = await listStandardCosts();
      if (data && data.length > 0) {
        const mapped = data.map((c) => {
          const base = produtos.find((p) => p.id === c.productId) || PRODUTOS[0];
          return {
            ...base,
            _costId: c.id,
            _productId: c.productId,
            custo_mat: Number(c.materialCost),
            custo_mdo_total: Number(c.laborCost),
            custo_overhead: Number(c.overheadCost),
            preco_venda: Number(c.salePrice || 0),
            margem_pct: Number(c.marginPct || 35),
            produto: c.product ? { codigo: c.product.code, nome: c.product.name } : base,
          };
        });
        setProdutos(mapped);
        setProdSel(mapped[0]);
      }
    } catch {
      // API unavailable — state stays empty
    }
  }, []);

  useEffect(() => { loadCosts(); }, [loadCosts]);

  const custo = useMemo(() => prodSel ? calcCusto(prodSel) : { custMat: 0, custMOD: 0, custCIF: 0, custTotal: 0 }, [prodSel]);
  const taxaMap = useMemo(() => Object.fromEntries(CENTROS_CUSTO.map((c) => [c.nome, c.taxa_h])), []);

  // Formação de preço
  const custUnitTotal = custo.custTotal / loteSimul;
  const percentCustoVenda = 100 - margem - impostos - comissao - frete;
  const precoSugerido = percentCustoVenda > 0 ? custUnitTotal / (percentCustoVenda / 100) : 0;
  const lucroR = precoSugerido * (margem / 100);
  const mrg_real_mercado = prodSel.preco_mercado > 0 ? ((prodSel.preco_mercado - custUnitTotal) / prodSel.preco_mercado) * 100 : 0;

  // Custeio alvo
  const custoAlvo = prodSel.preco_mercado * (1 - margemAlvo / 100 - impostos / 100 - comissao / 100 - frete / 100);
  const gap = custo.custTotal - custoAlvo;
  const atingeAlvo = gap <= 0;

  // Simul margem vs preço
  const simulData = [20, 25, 30, 35, 40, 45, 50].map((m) => {
    const pct_custo = 100 - m - impostos - comissao - frete;
    const preco = pct_custo > 0 ? custUnitTotal / (pct_custo / 100) : 0;
    return { margem: `${m}%`, preco: Math.round(preco), lucro: Math.round(preco * m / 100) };
  });

  const pieData = [
    { name: 'Matéria Prima', value: Math.round(custo.custMat) },
    { name: 'Mão de Obra Direta', value: Math.round(custo.custMOD) },
    { name: 'Custos Indiretos', value: Math.round(custo.custCIF) },
  ];

  const ABAS = [
    { id: 'custo',    label: 'Custo Padrão' },
    { id: 'taxas',    label: 'Taxa Hora Padrão' },
    { id: 'preco',    label: 'Formação de Preço' },
    { id: 'alvo',     label: 'Custeio Alvo' },
    { id: 'simulacao',label: 'Simulação de Preços' },
    { id: 'tabela',   label: 'Tabela de Preços' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Calculator size={20} className="text-primary" /> Custeio Padrão</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Calcule custo padrão, forme preços inteligentes e identifique oportunidades de lucratividade</p>
        </div>
      </div>

      {/* Abas */}
      <div className="border-b border-border flex gap-0 overflow-x-auto">
        {ABAS.map((a) => (
          <button key={a.id} type="button" onClick={() => setAba(a.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${aba === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ── CUSTO PADRÃO ─────────────────────────────────────────────────── */}
      {aba === 'custo' && (
        <div className="flex gap-3 flex-col lg:flex-row">
          {/* Lista de produtos */}
          <div className="w-full lg:w-56 shrink-0 space-y-1">
            <p className="text-[10px] text-muted-foreground px-1 font-semibold uppercase">Produtos</p>
            {produtos.map((p) => {
              const c = calcCusto(p);
              return (
                <button key={p.id} type="button" onClick={() => setProdSel(p)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-colors ${prodSel.id === p.id ? 'bg-primary/10 border-primary' : 'bg-white border-border hover:bg-muted/30'}`}>
                  <div className="font-mono text-xs font-bold text-primary">{p.codigo}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.nome}</div>
                  <div className="text-[10px] font-semibold mt-0.5">{R$(c.custTotal)} / {p.unidade}</div>
                </button>
              );
            })}
          </div>

          {/* Detalhe custo */}
          <div className="flex-1 space-y-3">
            {/* KPIs custo */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Matéria Prima',        value: R$(custo.custMat),   pct: (custo.custMat/custo.custTotal*100).toFixed(1)+'%', cor: 'text-blue-600' },
                { label: 'Mão de Obra Direta',   value: R$(custo.custMOD),   pct: (custo.custMOD/custo.custTotal*100).toFixed(1)+'%', cor: 'text-yellow-600' },
                { label: 'Custos Ind. Fabricação',value: R$(custo.custCIF),  pct: (custo.custCIF/custo.custTotal*100).toFixed(1)+'%', cor: 'text-green-600' },
              ].map((k) => (
                <div key={k.label} className="erp-card p-3">
                  <p className="text-[10px] text-muted-foreground">{k.label}</p>
                  <p className={`text-base font-bold ${k.cor}`}>{k.value}</p>
                  <p className="text-[10px] text-muted-foreground">{k.pct} do custo total</p>
                </div>
              ))}
            </div>

            <div className="erp-card p-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">Custo Padrão Total — {prodSel.nome}</p>
                <p className="text-2xl font-bold text-primary">{R$(custo.custTotal)}<span className="text-sm font-normal text-muted-foreground"> / {prodSel.unidade}</span></p>
              </div>
              <div className="w-32 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={36} innerRadius={15}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_CORES[i]} />)}
                  </Pie><Tooltip formatter={(v) => R$(v)} /></PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Materiais */}
            <div className="erp-card overflow-hidden">
              <button type="button" className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-50 border-b border-border/40 text-left" onClick={() => setExpandMat(!expandMat)}>
                <span className="text-xs font-semibold text-blue-700 flex items-center gap-1.5"><Package size={12} />Matérias Primas e Componentes — {R$(custo.custMat)}</span>
                {expandMat ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
              {expandMat && (
                <table className="w-full text-xs">
                  <thead><tr className="bg-muted/20"><th className="text-left px-3 py-1.5">Código</th><th className="text-left px-3 py-1.5">Descrição</th><th className="text-right px-3 py-1.5">Qtd</th><th className="px-3 py-1.5">UN</th><th className="text-right px-3 py-1.5">Custo Unit.</th><th className="text-right px-3 py-1.5">% Perda</th><th className="text-right px-3 py-1.5">Custo Total</th><th className="text-right px-3 py-1.5">% do Total</th></tr></thead>
                  <tbody>
                    {prodSel.materiais.map((m, i) => {
                      const custoItem = m.qtd * m.custo_u * (1 + m.perda / 100);
                      return (
                        <tr key={i} className="border-b border-border/30">
                          <td className="px-3 py-1.5 font-mono text-[10px]">{m.codigo}</td>
                          <td className="px-3 py-1.5">{m.descricao}</td>
                          <td className="px-3 py-1.5 text-right">{m.qtd}</td>
                          <td className="px-3 py-1.5">{m.unidade}</td>
                          <td className="px-3 py-1.5 text-right">{R$(m.custo_u)}</td>
                          <td className="px-3 py-1.5 text-right">{m.perda > 0 ? <span className="text-orange-600">{m.perda}%</span> : '—'}</td>
                          <td className="px-3 py-1.5 text-right font-semibold">{R$(custoItem)}</td>
                          <td className="px-3 py-1.5 text-right text-muted-foreground">{(custoItem/custo.custTotal*100).toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-blue-50/60 font-bold border-t-2 border-blue-200">
                      <td colSpan={6} className="px-3 py-1.5 text-right text-xs">Total Materiais</td>
                      <td className="px-3 py-1.5 text-right text-blue-700">{R$(custo.custMat)}</td>
                      <td className="px-3 py-1.5 text-right text-muted-foreground">{(custo.custMat/custo.custTotal*100).toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Operações */}
            <div className="erp-card overflow-hidden">
              <button type="button" className="w-full flex items-center justify-between px-4 py-2.5 bg-yellow-50 border-b border-border/40 text-left" onClick={() => setExpandOp(!expandOp)}>
                <span className="text-xs font-semibold text-yellow-700 flex items-center gap-1.5"><Calculator size={12} />Mão de Obra Direta + Custos Indiretos — {R$(custo.custMOD + custo.custCIF)}</span>
                {expandOp ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
              {expandOp && (
                <table className="w-full text-xs">
                  <thead><tr className="bg-muted/20"><th className="text-left px-3 py-1.5">Operação</th><th className="text-left px-3 py-1.5">Centro de Custo</th><th className="text-right px-3 py-1.5">Tempo Std (h)</th><th className="text-right px-3 py-1.5">Taxa/h</th><th className="text-right px-3 py-1.5">Custo MOD</th><th className="text-right px-3 py-1.5">CIF ({prodSel.overhead_pct}%)</th><th className="text-right px-3 py-1.5">Total Op.</th></tr></thead>
                  <tbody>
                    {prodSel.operacoes.map((o, i) => {
                      const taxa = taxaMap[o.centro] || 0;
                      const cMOD = o.t_std_h * taxa;
                      const cCIF = cMOD * (prodSel.overhead_pct / 100);
                      return (
                        <tr key={i} className="border-b border-border/30">
                          <td className="px-3 py-1.5 font-medium">{o.operacao}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">{o.centro}</td>
                          <td className="px-3 py-1.5 text-right">{o.t_std_h}h</td>
                          <td className="px-3 py-1.5 text-right">{R$(taxa)}/h</td>
                          <td className="px-3 py-1.5 text-right font-semibold">{R$(cMOD)}</td>
                          <td className="px-3 py-1.5 text-right text-green-700">{R$(cCIF)}</td>
                          <td className="px-3 py-1.5 text-right font-bold">{R$(cMOD + cCIF)}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-yellow-50/60 font-bold border-t-2 border-yellow-200">
                      <td colSpan={4} className="px-3 py-1.5 text-right text-xs">Total MOD + CIF</td>
                      <td className="px-3 py-1.5 text-right text-yellow-700">{R$(custo.custMOD)}</td>
                      <td className="px-3 py-1.5 text-right text-green-700">{R$(custo.custCIF)}</td>
                      <td className="px-3 py-1.5 text-right text-primary">{R$(custo.custMOD + custo.custCIF)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAXA HORA PADRÃO ─────────────────────────────────────────────── */}
      {aba === 'taxas' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="erp-card overflow-x-auto">
              <div className="px-4 py-2.5 bg-muted/30 border-b border-border"><p className="text-xs font-semibold">Apuração do Custo Hora Padrão por Centro de Custo</p></div>
              <table className="erp-table w-full min-w-[600px]">
                <thead><tr><th>Centro de Custo</th><th className="text-right">Cap. (h/mês)</th><th className="text-right">Ocupação</th><th className="text-right">Custo Fixo</th><th className="text-right">Custo Var.</th><th className="text-right">Total/Mês</th><th className="text-right">Taxa/h</th></tr></thead>
                <tbody>
                  {CENTROS_CUSTO.map((c) => (
                    <tr key={c.id}>
                      <td className="font-medium">{c.nome}</td>
                      <td className="text-right">{c.cap_horas}h</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${c.ocupacao >= 85 ? 'bg-red-500' : c.ocupacao >= 65 ? 'bg-primary' : 'bg-green-500'}`} style={{ width: `${c.ocupacao}%` }} /></div>
                          <span>{c.ocupacao}%</span>
                        </div>
                      </td>
                      <td className="text-right">{R$(c.custo_fixo)}</td>
                      <td className="text-right">{R$(c.custo_var_h * c.cap_horas * c.ocupacao / 100)}</td>
                      <td className="text-right font-semibold">{R$(c.total_mes)}</td>
                      <td className="text-right font-bold text-primary">{R$(c.taxa_h)}/h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="erp-card p-4" style={{ height: 280 }}>
              <p className="text-xs font-semibold mb-2">Taxa Hora por Centro de Custo (R$/h)</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CENTROS_CUSTO.map((c) => ({ nome: c.nome.split('/')[0].trim(), taxa: c.taxa_h }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => `R$${v}`} />
                  <YAxis type="category" dataKey="nome" tick={{ fontSize: 9 }} width={80} />
                  <Tooltip formatter={(v) => `R$ ${v}/h`} />
                  <Bar dataKey="taxa" name="Taxa/h" fill="#f59e0b" radius={[0,3,3,0]} label={{ position: 'right', fontSize: 9, formatter: (v) => `R$${v}` }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── FORMAÇÃO DE PREÇO ─────────────────────────────────────────────── */}
      {aba === 'preco' && (
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* Controles */}
          <div className="w-full lg:w-64 shrink-0 space-y-3">
            <div className="erp-card p-4 space-y-3">
              <p className="text-xs font-semibold">Produto</p>
              <div className="flex flex-col gap-1">
                {produtos.map((p) => (
                  <button key={p.id} type="button" onClick={() => setProdSel(p)}
                    className={`text-left text-xs px-2.5 py-1.5 rounded border transition-colors ${prodSel.id === p.id ? 'bg-primary/10 border-primary text-primary font-semibold' : 'bg-muted/20 border-border'}`}>
                    {p.codigo}
                  </button>
                ))}
              </div>
            </div>
            <div className="erp-card p-4 space-y-3">
              <p className="text-xs font-semibold">Parâmetros de Formação</p>
              {[
                { label: 'Margem de Lucro (%)', val: margem,  set: setMargem },
                { label: 'Impostos (%)',        val: impostos,set: setImpostos },
                { label: 'Comissão (%)',        val: comissao,set: setComissao },
                { label: 'Frete (%)',           val: frete,   set: setFrete },
                { label: 'Lote de produção',    val: loteSimul, set: setLoteSimul },
              ].map((f) => (
                <div key={f.label}>
                  <label className="erp-label">{f.label}</label>
                  <input type="number" min="0" step="0.5" className="erp-input w-full" value={f.val} onChange={(e) => f.set(Number(e.target.value))} />
                </div>
              ))}
            </div>
          </div>

          {/* Resultado */}
          <div className="flex-1 space-y-3">
            <div className="erp-card p-5 border-primary/30">
              <p className="text-xs font-semibold mb-4">Demonstrativo de Formação de Preço — {prodSel.nome}</p>
              <div className="space-y-0">
                {[
                  { label: 'Custo de Matéria Prima',         val: custo.custMat,      pct: custo.custMat/precoSugerido*100,   indent: 0, destaque: false },
                  { label: 'Mão de Obra Direta',             val: custo.custMOD,      pct: custo.custMOD/precoSugerido*100,   indent: 0, destaque: false },
                  { label: 'Custos Indiretos de Fabricação', val: custo.custCIF,      pct: custo.custCIF/precoSugerido*100,   indent: 0, destaque: false },
                  { label: 'CUSTO DE FABRICAÇÃO',            val: custo.custTotal,    pct: custo.custTotal/precoSugerido*100, indent: 0, destaque: true, sep: true },
                  { label: 'Impostos sobre Venda',           val: precoSugerido*impostos/100, pct: impostos,  indent: 1, destaque: false },
                  { label: 'Comissão de Vendas',             val: precoSugerido*comissao/100, pct: comissao,  indent: 1, destaque: false },
                  { label: 'Frete',                          val: precoSugerido*frete/100,    pct: frete,     indent: 1, destaque: false },
                  { label: 'LUCRO BRUTO',                    val: lucroR,             pct: margem,            indent: 0, destaque: true, corDestaque: 'text-green-600 bg-green-50', sep: true },
                  { label: 'PREÇO DE VENDA SUGERIDO',        val: precoSugerido,      pct: 100,               indent: 0, destaque: true, corDestaque: 'text-primary bg-primary/5 text-base font-bold', sep: true },
                ].map((row, i) => (
                  <div key={i} className={`flex items-center justify-between py-1.5 ${row.sep ? 'border-t border-border mt-1' : ''} ${row.destaque ? `font-semibold ${row.corDestaque || ''}` : ''} px-2 rounded`}>
                    <span className={`text-xs ${row.indent ? 'pl-4 text-muted-foreground' : ''}`}>{row.label}</span>
                    <div className="flex items-center gap-6 text-xs">
                      <span className="text-muted-foreground w-10 text-right">{row.pct.toFixed(1)}%</span>
                      <span className="w-28 text-right font-mono">{R$(row.val)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center gap-3">
                <div className="flex-1 text-xs text-muted-foreground">
                  Preço de mercado: <strong>{R$(prodSel.preco_mercado)}</strong>
                  {' · '}Margem real c/ preço mercado: <strong className={mrg_real_mercado >= margem ? 'text-green-600' : 'text-red-600'}>{mrg_real_mercado.toFixed(1)}%</strong>
                </div>
                <button type="button" onClick={() => toast.info('Orçamento PDF gerado!')} className="erp-btn-ghost text-xs flex items-center gap-1"><Printer size={11} />Orçamento PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTEIO ALVO ─────────────────────────────────────────────────── */}
      {aba === 'alvo' && (
        <div className="space-y-3">
          <div className="flex gap-3 flex-col lg:flex-row">
            {/* Config */}
            <div className="w-full lg:w-52 shrink-0 erp-card p-4 space-y-3">
              <p className="text-xs font-semibold">Parâmetros</p>
              {produtos.map((p) => (
                <button key={p.id} type="button" onClick={() => setProdSel(p)}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded border ${prodSel.id === p.id ? 'bg-primary/10 border-primary font-semibold text-primary' : 'bg-muted/20 border-border'}`}>{p.codigo}</button>
              ))}
              <div><label className="erp-label">Preço de Mercado (R$)</label><input type="number" className="erp-input w-full" defaultValue={prodSel.preco_mercado} /></div>
              <div><label className="erp-label">Margem Alvo (%)</label><input type="number" className="erp-input w-full" value={margemAlvo} onChange={(e) => setMargemAlvo(Number(e.target.value))} /></div>
            </div>

            {/* Resultado custeio alvo */}
            <div className="flex-1 space-y-3">
              <div className={`erp-card p-5 border-2 ${atingeAlvo ? 'border-green-300' : 'border-red-300'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold">{prodSel.nome}</p>
                    <p className="text-xs text-muted-foreground">Custeio Alvo — Técnica de Target Costing</p>
                  </div>
                  {atingeAlvo
                    ? <span className="flex items-center gap-1 text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded text-xs"><CheckCircle size={12} />Meta atingida</span>
                    : <span className="flex items-center gap-1 text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded text-xs"><AlertTriangle size={12} />Redução necessária</span>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Preço de Mercado', val: R$(prodSel.preco_mercado), cor: 'text-foreground' },
                    { label: `Margem Alvo (${margemAlvo}%)`, val: R$(prodSel.preco_mercado * margemAlvo / 100), cor: 'text-primary' },
                    { label: 'Custo Alvo', val: R$(custoAlvo), cor: 'text-blue-600' },
                    { label: 'Custo Atual', val: R$(custo.custTotal), cor: atingeAlvo ? 'text-green-600' : 'text-red-600' },
                  ].map((k) => (
                    <div key={k.label} className="bg-muted/20 rounded-lg p-3 text-center">
                      <p className="text-[10px] text-muted-foreground">{k.label}</p>
                      <p className={`text-sm font-bold ${k.cor}`}>{k.val}</p>
                    </div>
                  ))}
                </div>
                {!atingeAlvo && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 space-y-1">
                    <p className="font-semibold flex items-center gap-1"><AlertTriangle size={11} /> GAP de custo: {R$(gap)} a reduzir</p>
                    <p>Sugestões para redução de custo:</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>Negociar preços de matéria prima com fornecedores (maior peso: {(custo.custMat/custo.custTotal*100).toFixed(0)}% do custo)</li>
                      <li>Avaliar redesenho do produto para reduzir consumo de material</li>
                      <li>Aumentar a eficiência do processo produtivo reduzindo o tempo padrão</li>
                      <li>Avaliar terceirização de operações com maior custo/hora</li>
                    </ul>
                  </div>
                )}
                {/* Barra custo alvo vs atual */}
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between"><span>Custo atual</span><span className={atingeAlvo ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{R$(custo.custTotal)}</span></div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden relative">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (custo.custTotal / prodSel.preco_mercado) * 100)}%` }} />
                    <div className="absolute top-0 h-full w-0.5 bg-green-500" style={{ left: `${(custoAlvo / prodSel.preco_mercado) * 100}%` }} title={`Custo alvo: ${R$(custoAlvo)}`} />
                  </div>
                  <div className="flex justify-between text-muted-foreground"><span>R$ 0</span><span className="text-green-600">Custo alvo {R$(custoAlvo)}</span><span>{R$(prodSel.preco_mercado)}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SIMULAÇÃO DE PREÇOS ──────────────────────────────────────────── */}
      {aba === 'simulacao' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="erp-card p-4" style={{ height: 280 }}>
              <p className="text-xs font-semibold mb-2">Preço de Venda × Margem de Lucro</p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simulData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="margem" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => R$(v)} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line dataKey="preco" name="Preço Sugerido" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                  <Line dataKey="lucro" name="Lucro Bruto" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="erp-card overflow-x-auto">
              <div className="px-4 py-2.5 bg-muted/20 border-b border-border"><p className="text-xs font-semibold">Simulação por Margem de Lucro</p></div>
              <table className="erp-table w-full">
                <thead><tr><th>Margem</th><th className="text-right">Preço Sugerido</th><th className="text-right">Lucro Bruto</th><th className="text-right">vs. Mercado</th></tr></thead>
                <tbody>
                  {simulData.map((row) => {
                    const diffMercado = prodSel.preco_mercado - row.preco;
                    return (
                      <tr key={row.margem} className={row.margem === `${margem}%` ? 'bg-primary/5 font-semibold' : ''}>
                        <td><span className="font-bold">{row.margem}</span></td>
                        <td className="text-right">{R$(row.preco)}</td>
                        <td className="text-right text-green-600">{R$(row.lucro)}</td>
                        <td className={`text-right text-xs ${diffMercado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {diffMercado >= 0 ? `−${R$(diffMercado)}` : `+${R$(Math.abs(diffMercado))}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <strong>Nota:</strong> Custo base {R$(custo.custTotal)} · Impostos {impostos}% · Comissão {comissao}% · Frete {frete}% · Preço de mercado {R$(prodSel.preco_mercado)}
          </div>
        </div>
      )}

      {/* ── TABELA DE PREÇOS ─────────────────────────────────────────────── */}
      {aba === 'tabela' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Tabela de preços calculada automaticamente a partir do custo padrão e margem configurada</p>
            <button type="button" onClick={() => toast.info('Tabela de preços exportada!')} className="erp-btn-ghost text-xs flex items-center gap-1.5"><Download size={12} />Exportar</button>
          </div>
          <div className="erp-card overflow-x-auto">
            <table className="erp-table w-full min-w-[800px]">
              <thead><tr><th>Código</th><th>Produto</th><th className="text-right">Custo MP</th><th className="text-right">Custo MOD</th><th className="text-right">Custo CIF</th><th className="text-right">Custo Total</th><th className="text-right">Preço ({margem}% mg)</th><th className="text-right">Preço Mercado</th><th className="text-right">Margem Real</th></tr></thead>
              <tbody>
                {produtos.map((p) => {
                  const c = calcCusto(p);
                  const pctCusto = 100 - margem - impostos - comissao - frete;
                  const preco = pctCusto > 0 ? c.custTotal / (pctCusto / 100) : 0;
                  const mrgReal = p.preco_mercado > 0 ? ((p.preco_mercado - c.custTotal) / p.preco_mercado) * (100 - impostos - comissao - frete) / 100 * 100 : 0;
                  return (
                    <tr key={p.id}>
                      <td className="font-mono font-bold text-primary">{p.codigo}</td>
                      <td className="font-medium">{p.nome}</td>
                      <td className="text-right">{R$(c.custMat)}</td>
                      <td className="text-right">{R$(c.custMOD)}</td>
                      <td className="text-right">{R$(c.custCIF)}</td>
                      <td className="text-right font-semibold">{R$(c.custTotal)}</td>
                      <td className="text-right font-bold text-primary">{R$(preco)}</td>
                      <td className="text-right text-muted-foreground">{R$(p.preco_mercado)}</td>
                      <td className="text-right"><span className={`font-bold ${mrgReal >= margem ? 'text-green-600' : 'text-red-600'}`}>{mrgReal.toFixed(1)}%</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
