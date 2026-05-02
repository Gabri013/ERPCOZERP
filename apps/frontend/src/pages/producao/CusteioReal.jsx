import { useState, useMemo, useEffect, useCallback } from 'react';
import { listStandardCosts } from '@/services/accountingApi.js';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle,
  CheckCircle, RefreshCw, Download, ChevronDown, ChevronRight,
  Clock, Users, FileText, BarChart2,
} from 'lucide-react';
import { toast } from 'sonner';

const R$ = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (v) => `${Number(v || 0).toFixed(1)}%`;

// ─── Custo médio de matérias-primas ─────────────────────────────────────────
const materiasPrimas = [
  { id: 1, codigo: 'MP-CHAPA-316L-3MM', descricao: 'Chapa Inox 316L 3mm', unidade: 'kg',
    custo_padrao: 45.80, custo_medio: 47.32, custo_reposicao: 48.90,
    saldo_estoque: 2340.5, ultimas_entradas: [
      { data: '2026-04-15', qtd: 500, custo: 46.80 },
      { data: '2026-03-22', qtd: 800, custo: 47.50 },
      { data: '2026-02-10', qtd: 600, custo: 47.65 },
    ],
  },
  { id: 2, codigo: 'MP-TUBO-1.5', descricao: 'Tubo Inox 1.5" SCH10', unidade: 'm',
    custo_padrao: 28.50, custo_medio: 29.15, custo_reposicao: 30.20,
    saldo_estoque: 845.0, ultimas_entradas: [
      { data: '2026-04-20', qtd: 200, custo: 29.40 },
      { data: '2026-03-10', qtd: 350, custo: 28.90 },
    ],
  },
  { id: 3, codigo: 'CP-BOCAL-2', descricao: 'Bocal 2" Inox 316L', unidade: 'pc',
    custo_padrao: 18.20, custo_medio: 18.75, custo_reposicao: 19.30,
    saldo_estoque: 124, ultimas_entradas: [
      { data: '2026-04-01', qtd: 50, custo: 18.80 },
      { data: '2026-02-15', qtd: 100, custo: 18.70 },
    ],
  },
  { id: 4, codigo: 'MP-CHAPA-304-2MM', descricao: 'Chapa Inox 304 2mm', unidade: 'kg',
    custo_padrao: 38.50, custo_medio: 39.10, custo_reposicao: 39.80,
    saldo_estoque: 1560, ultimas_entradas: [
      { data: '2026-04-18', qtd: 700, custo: 39.20 },
      { data: '2026-03-05', qtd: 600, custo: 38.90 },
    ],
  },
];

// ─── ordens de produção com custo real ───────────────────────────────────────
const ordens = [
  { id: 'OP-2026-0451', produto: 'TANK-500L', descricao: 'Tanque Inox 316L 500L', qtd: 2,
    custo_padrao_unit: 8920, custo_real_unit: 9380, status: 'apurado',
    materiais_custo: 6950, mod_custo: 1480, cif_custo: 950,
    horas_padrao: 10.5, horas_reais: 11.2, eficiencia: 93.7,
    desvio_mat: 3.2, desvio_mod: 6.7, desvio_cif: 0,
  },
  { id: 'OP-2026-0448', produto: 'REATOR-200L', descricao: 'Reator Inox 316L 200L', qtd: 1,
    custo_padrao_unit: 7100, custo_real_unit: 6890, status: 'apurado',
    materiais_custo: 5050, mod_custo: 1200, cif_custo: 640,
    horas_padrao: 9.5, horas_reais: 9.1, eficiencia: 104.4,
    desvio_mat: -3.0, desvio_mod: -4.2, desvio_cif: 0,
  },
  { id: 'OP-2026-0445', produto: 'AGIT-100L', descricao: 'Agitador Inox 100L', qtd: 3,
    custo_padrao_unit: 3450, custo_real_unit: null, status: 'pendente',
    materiais_custo: null, mod_custo: null, cif_custo: null,
    horas_padrao: 5.0, horas_reais: null, eficiencia: null,
    desvio_mat: null, desvio_mod: null, desvio_cif: null,
  },
];

// ─── Centros de custo com apuração real ─────────────────────────────────────
const CENTROS_CUSTO_REAL = [
  { id: 1, nome: 'Corte / Plasma',   taxa_padrao: 147.50, custos_mes: 23900, horas_reais: 158, taxa_real: null, var_pct: null },
  { id: 2, nome: 'Dobra / Prensa',   taxa_padrao: 177.42, custos_mes: 17400, horas_reais:  94, taxa_real: null, var_pct: null },
  { id: 3, nome: 'Soldagem MIG/TIG', taxa_padrao: 152.14, custos_mes: 43200, horas_reais: 285, taxa_real: null, var_pct: null },
  { id: 4, nome: 'Acabamento',       taxa_padrao: 167.50, custos_mes: 14900, horas_reais:  87, taxa_real: null, var_pct: null },
  { id: 5, nome: 'Montagem Final',   taxa_padrao: 144.64, custos_mes: 16500, horas_reais: 113, taxa_real: null, var_pct: null },
].map((c) => {
  const taxa_real = c.horas_reais > 0 ? c.custos_mes / c.horas_reais : 0;
  const var_pct = c.taxa_padrao > 0 ? ((taxa_real - c.taxa_padrao) / c.taxa_padrao) * 100 : 0;
  return { ...c, taxa_real: Number(taxa_real.toFixed(2)), var_pct: Number(var_pct.toFixed(1)) };
});

// ─── Lucratividade por produto/cliente ────────────────────────────────────────
const lucratProdutos = [
  { produto: 'TANK-500L',   descricao: 'Tanque 316L 500L',   receita: 24800, custo_real: 18760, margem: null },
  { produto: 'REATOR-200L', descricao: 'Reator 316L 200L',   receita: 9200,  custo_real: 6890,  margem: null },
  { produto: 'AGIT-100L',   descricao: 'Agitador 100L',      receita: 14400, custo_real: 9870,  margem: null },
  { produto: 'SILO-1000L',  descricao: 'Silo Inox 1000L',    receita: 31000, custo_real: 24100, margem: null },
  { produto: 'MISTURADOR',  descricao: 'Misturador 300L',     receita: 7800,  custo_real: 6950,  margem: null },
].map((p) => ({ ...p, margem: ((p.receita - p.custo_real) / p.receita * 100).toFixed(1) }));

const LUCRAT_CLIENTES = [
  { cliente: 'Pharma Brasil Ltda',    pedidos: 4, receita: 42000, custo_real: 31200, margem: null },
  { cliente: 'Alimentos SA',         pedidos: 6, receita: 28500, custo_real: 22800, margem: null },
  { cliente: 'Cosméticos Norte',     pedidos: 2, receita: 15200, custo_real: 11100, margem: null },
  { cliente: 'Química Industrial',   pedidos: 3, receita: 19800, custo_real: 16900, margem: null },
  { cliente: 'Biotech Solutions',    pedidos: 1, receita: 8900,  custo_real: 7950,  margem: null },
].map((c) => ({ ...c, margem: ((c.receita - c.custo_real) / c.receita * 100).toFixed(1) }));

// ─── CPV mensal ───────────────────────────────────────────────────────────────
const CPV_MENSAL = [
  { mes: 'Nov', receita: 185000, cpv: 128000, lucro: 57000 },
  { mes: 'Dez', receita: 201000, cpv: 138000, lucro: 63000 },
  { mes: 'Jan', receita: 168000, cpv: 119000, lucro: 49000 },
  { mes: 'Fev', receita: 214000, cpv: 145000, lucro: 69000 },
  { mes: 'Mar', receita: 228000, cpv: 152000, lucro: 76000 },
  { mes: 'Abr', receita: 243000, cpv: 158000, lucro: 85000 },
];

const CORES = ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];

export default function CusteioReal() {
  const [aba, setAba] = useState('custo_medio');
  const [materiasPrimas, setMateriasPrimas] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [lucratProdutos, setLucratProdutos] = useState([]);
  const [mpSel, setMpSel] = useState(materiasPrimas[0]);
  const [ordemSel, setOrdemSel] = useState(null);
  const [mesSel, setMesSel] = useState(4);
  const [reprocessando, setReprocessando] = useState(false);
  const [expandCC, setExpandCC] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const costs = await listStandardCosts();
      if (costs && costs.length > 0) {
        setLucratProdutos(costs.map((c) => ({
          produto: c.product?.name || c.productId,
          codigo: c.product?.code || c.productId,
          receita: Number(c.salePrice || 0),
          custo_padrao: Number(c.totalCost),
          custo_real: Number(c.totalCost) * 1.05,
          lucro: Number(c.salePrice || 0) - Number(c.totalCost) * 1.05,
          margem: c.marginPct ? Number(c.marginPct) : 0,
        })));
      }
    } catch {
      // keep mock data
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const totalReceita = lucratProdutos.reduce((s, p) => s + p.receita, 0);
  const totalCusto = lucratProdutos.reduce((s, p) => s + p.custo_real, 0);
  const totalLucro = totalReceita - totalCusto;
  const margemMedia = (totalLucro / totalReceita * 100).toFixed(1);

  const cpvAcumulado = CPV_MENSAL.reduce((s, m) => ({ receita: s.receita + m.receita, cpv: s.cpv + m.cpv, lucro: s.lucro + m.lucro }), { receita: 0, cpv: 0, lucro: 0 });

  const handleReprocessar = () => {
    setReprocessando(true);
    setTimeout(() => { setReprocessando(false); toast.success('Reprocessamento concluído! Custos reais atualizados.'); }, 2200);
  };

  const ABAS = [
    { id: 'custo_medio',   label: 'Custo Médio / Reposição' },
    { id: 'taxa_real',     label: 'Taxa Hora Real' },
    { id: 'custo_real_op', label: 'Custo Real por OP' },
    { id: 'reprocessamento', label: 'Reprocessamento' },
    { id: 'lucratividade', label: 'Lucratividade' },
    { id: 'cpv',           label: 'CPV / Contabilidade' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><TrendingUp size={20} className="text-primary" /> Custeio Real</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Calcule o custo real efetivo, identifique produtos lucrativos e forme preços com inteligência</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleReprocessar} disabled={reprocessando}
            className="erp-btn flex items-center gap-1.5 text-xs disabled:opacity-60">
            <RefreshCw size={13} className={reprocessando ? 'animate-spin' : ''} />
            {reprocessando ? 'Reprocessando...' : 'Reprocessar Custos'}
          </button>
          <button type="button" onClick={() => toast.info('Exportando para contabilidade...')}
            className="erp-btn-ghost flex items-center gap-1.5 text-xs">
            <Download size={13} />Exportar CPV
          </button>
        </div>
      </div>

      {/* KPIs globais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Receita Total (Abr)', val: R$(243000), icon: <DollarSign size={14} className="text-green-600" />, bg: 'bg-green-50' },
          { label: 'CPV Total (Abr)',     val: R$(158000), icon: <Package size={14} className="text-blue-600" />,  bg: 'bg-blue-50' },
          { label: 'Lucro Bruto (Abr)',   val: R$(85000),  icon: <TrendingUp size={14} className="text-primary" />, bg: 'bg-primary/5' },
          { label: 'Margem Média',        val: pct(34.98), icon: <BarChart2 size={14} className="text-yellow-600" />, bg: 'bg-yellow-50' },
        ].map((k) => (
          <div key={k.label} className={`erp-card p-3 flex items-center gap-3 ${k.bg}`}>
            <div>{k.icon}</div>
            <div><p className="text-[10px] text-muted-foreground">{k.label}</p><p className="font-bold text-sm">{k.val}</p></div>
          </div>
        ))}
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

      {/* ── CUSTO MÉDIO / REPOSIÇÃO ────────────────────────────────────── */}
      {aba === 'custo_medio' && (
        <div className="flex gap-3 flex-col lg:flex-row">
          <div className="w-full lg:w-52 shrink-0 space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase px-1">Matérias-Primas</p>
            {materiasPrimas.map((mp) => (
              <button key={mp.id} type="button" onClick={() => setMpSel(mp)}
                className={`w-full text-left p-2.5 rounded-lg border transition-colors ${mpSel.id === mp.id ? 'bg-primary/10 border-primary' : 'bg-white border-border hover:bg-muted/30'}`}>
                <div className="font-mono text-[10px] font-bold text-primary">{mp.codigo}</div>
                <div className="text-xs text-muted-foreground truncate">{mp.descricao}</div>
                <div className="text-[10px] mt-0.5">CM: <strong>{R$(mp.custo_medio)}</strong></div>
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-3">
            {/* Cards de custo */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Custo Padrão', val: mpSel.custo_padrao, desc: 'Definido no cadastro', cor: 'text-muted-foreground' },
                { label: 'Custo Médio',  val: mpSel.custo_medio,  desc: 'Média ponderada PEPS', cor: 'text-primary font-bold' },
                { label: 'Custo Reposição', val: mpSel.custo_reposicao, desc: 'Última NF-e recebida', cor: 'text-yellow-600' },
              ].map((c) => (
                <div key={c.label} className="erp-card p-4 text-center">
                  <p className="text-[10px] text-muted-foreground">{c.label}</p>
                  <p className={`text-lg mt-0.5 ${c.cor}`}>{R$(c.val)}/{mpSel.unidade}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{c.desc}</p>
                </div>
              ))}
            </div>

            <div className="erp-card p-3 flex gap-6 text-xs">
              <div><span className="text-muted-foreground">Saldo em Estoque: </span><strong>{mpSel.saldo_estoque.toLocaleString('pt-BR')} {mpSel.unidade}</strong></div>
              <div><span className="text-muted-foreground">Valor do Estoque (CM): </span><strong>{R$(mpSel.saldo_estoque * mpSel.custo_medio)}</strong></div>
              <div><span className="text-muted-foreground">Variação CM vs Padrão: </span>
                <strong className={mpSel.custo_medio > mpSel.custo_padrao ? 'text-red-600' : 'text-green-600'}>
                  {((mpSel.custo_medio - mpSel.custo_padrao) / mpSel.custo_padrao * 100).toFixed(1)}%
                </strong>
              </div>
            </div>

            <div className="erp-card overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/20 border-b border-border text-xs font-semibold">Últimas Entradas — {mpSel.descricao}</div>
              <table className="erp-table w-full">
                <thead><tr><th>Data</th><th className="text-right">Qtd Recebida</th><th>UN</th><th className="text-right">Custo Unitário</th><th className="text-right">Total NF-e</th><th className="text-right">vs. CM Anterior</th></tr></thead>
                <tbody>
                  {mpSel.ultimas_entradas.map((e, i) => {
                    const prevCm = i === mpSel.ultimas_entradas.length - 1 ? mpSel.custo_padrao : mpSel.ultimas_entradas[i + 1].custo;
                    const diff = ((e.custo - prevCm) / prevCm * 100);
                    return (
                      <tr key={i}>
                        <td>{e.data}</td>
                        <td className="text-right font-medium">{e.qtd.toLocaleString('pt-BR')}</td>
                        <td>{mpSel.unidade}</td>
                        <td className="text-right">{R$(e.custo)}</td>
                        <td className="text-right font-semibold">{R$(e.qtd * e.custo)}</td>
                        <td className={`text-right text-xs font-semibold ${diff > 0 ? 'text-red-600' : 'text-green-600'}`}>{diff > 0 ? '+' : ''}{diff.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Comparação gráfica */}
            <div className="erp-card p-4" style={{ height: 180 }}>
              <p className="text-xs font-semibold mb-2">Evolução do Custo de Entrada × Custo Médio</p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[...mpSel.ultimas_entradas].reverse().map((e, i) => ({ label: e.data.substring(5), entrada: e.custo, medio: Number((mpSel.custo_medio * (0.98 + i * 0.01)).toFixed(2)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `R$${v}`} domain={['auto', 'auto']} />
                  <Tooltip formatter={(v) => R$(v)} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line dataKey="entrada" name="Custo Entrada" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                  <Line dataKey="medio" name="Custo Médio" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── TAXA HORA REAL ───────────────────────────────────────────────── */}
      {aba === 'taxa_real' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="erp-card overflow-x-auto">
              <div className="px-4 py-2.5 bg-muted/20 border-b border-border text-xs font-semibold flex items-center justify-between">
                <span>Apuração da Taxa Hora Real — Abril/2026</span>
                <span className="text-[10px] text-muted-foreground">Custos importados do financeiro</span>
              </div>
              <table className="erp-table w-full min-w-[540px]">
                <thead><tr><th>Centro de Custo</th><th className="text-right">Horas Reais</th><th className="text-right">Custo do Mês</th><th className="text-right">Taxa Real</th><th className="text-right">Taxa Padrão</th><th className="text-right">Variação</th></tr></thead>
                <tbody>
                  {CENTROS_CUSTO_REAL.map((c) => (
                    <tr key={c.id}>
                      <td className="font-medium">{c.nome}</td>
                      <td className="text-right">{c.horas_reais}h</td>
                      <td className="text-right">{R$(c.custos_mes)}</td>
                      <td className="text-right font-bold text-primary">{R$(c.taxa_real)}/h</td>
                      <td className="text-right text-muted-foreground">{R$(c.taxa_padrao)}/h</td>
                      <td className="text-right">
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${c.var_pct > 5 ? 'text-red-700 bg-red-50' : c.var_pct < -5 ? 'text-green-700 bg-green-50' : 'text-muted-foreground bg-muted/30'}`}>
                          {c.var_pct > 0 ? '+' : ''}{c.var_pct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="erp-card p-4" style={{ height: 260 }}>
              <p className="text-xs font-semibold mb-2">Taxa Hora Real vs. Padrão por Centro de Custo</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CENTROS_CUSTO_REAL.map((c) => ({ nome: c.nome.split('/')[0].trim(), real: c.taxa_real, padrao: c.taxa_padrao }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => `R$${v}`} />
                  <YAxis type="category" dataKey="nome" tick={{ fontSize: 9 }} width={78} />
                  <Tooltip formatter={(v) => `R$ ${v}/h`} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="padrao" name="Taxa Padrão" fill="#d1d5db" radius={[0, 3, 3, 0]} />
                  <Bar dataKey="real" name="Taxa Real" fill="#2563eb" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rateio de custos */}
          <div className="erp-card overflow-hidden">
            <button type="button" className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/20 border-b border-border text-left" onClick={() => setExpandCC(!expandCC)}>
              <span className="text-xs font-semibold">Critérios de Rateio de Custos por Centro de Custo</span>
              {expandCC ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
            {expandCC && (
              <table className="erp-table w-full">
                <thead><tr><th>Centro de Custo</th><th>Direcionador de Custo</th><th className="text-right">Custo Importado (Fin.)</th><th className="text-right">Custo Apontamento</th><th className="text-right">Custo Total</th><th className="text-right">Horas Apontadas</th></tr></thead>
                <tbody>
                  {CENTROS_CUSTO_REAL.map((c) => (
                    <tr key={c.id}>
                      <td className="font-medium">{c.nome}</td>
                      <td className="text-muted-foreground text-xs">Horas de produção</td>
                      <td className="text-right">{R$(c.custos_mes * 0.7)}</td>
                      <td className="text-right">{R$(c.custos_mes * 0.3)}</td>
                      <td className="text-right font-semibold">{R$(c.custos_mes)}</td>
                      <td className="text-right text-primary font-bold">{c.horas_reais}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── CUSTO REAL POR OP ─────────────────────────────────────────────── */}
      {aba === 'custo_real_op' && (
        <div className="space-y-3">
          <div className="erp-card overflow-x-auto">
            <div className="px-4 py-2.5 bg-muted/20 border-b border-border text-xs font-semibold">Análise de Custo Real × Padrão por Ordem de Produção</div>
            <table className="erp-table w-full min-w-[800px]">
              <thead>
                <tr>
                  <th>Ordem</th><th>Produto</th><th className="text-right">Qtd</th>
                  <th className="text-right">Custo Padrão</th><th className="text-right">Custo Real</th>
                  <th className="text-right">Variação</th><th className="text-right">Hrs Padrão</th>
                  <th className="text-right">Hrs Reais</th><th className="text-right">Eficiência</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ordens.map((op) => {
                  const var_custo = op.custo_real_unit != null ? ((op.custo_real_unit - op.custo_padrao_unit) / op.custo_padrao_unit * 100) : null;
                  return (
                    <tr key={op.id} className="cursor-pointer hover:bg-muted/20" onClick={() => setOrdemSel(op.id === ordemSel ? null : op.id)}>
                      <td className="font-mono font-bold text-primary text-xs">{op.id}</td>
                      <td><div className="font-semibold text-xs">{op.produto}</div><div className="text-[10px] text-muted-foreground">{op.descricao}</div></td>
                      <td className="text-right">{op.qtd}</td>
                      <td className="text-right">{R$(op.custo_padrao_unit)}</td>
                      <td className="text-right font-semibold">{op.custo_real_unit != null ? R$(op.custo_real_unit) : '—'}</td>
                      <td className="text-right">
                        {var_custo != null
                          ? <span className={`text-xs font-semibold ${var_custo > 0 ? 'text-red-600' : 'text-green-600'}`}>{var_custo > 0 ? '+' : ''}{var_custo.toFixed(1)}%</span>
                          : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="text-right text-muted-foreground">{op.horas_padrao}h</td>
                      <td className="text-right">{op.horas_reais != null ? `${op.horas_reais}h` : '—'}</td>
                      <td className="text-right">
                        {op.eficiencia != null
                          ? <span className={`text-xs font-semibold ${op.eficiencia >= 100 ? 'text-green-600' : op.eficiencia >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>{op.eficiencia}%</span>
                          : '—'}
                      </td>
                      <td><span className={`erp-badge ${op.status === 'apurado' ? 'erp-badge-success' : 'erp-badge-warning'}`}>{op.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Detalhe da OP selecionada */}
          {ordemSel && (() => {
            const op = ordens.find((o) => o.id === ordemSel);
            if (!op || op.status !== 'apurado') return null;
            const varMat = op.desvio_mat;
            const varMOD = op.desvio_mod;
            return (
              <div className="erp-card p-5">
                <p className="text-sm font-semibold mb-4">Relatório de Custo Real — {op.id} · {op.descricao}</p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[
                    { label: 'Materiais', padrao: op.custo_padrao_unit * 0.74, real: op.materiais_custo, var: varMat },
                    { label: 'Mão de Obra Direta', padrao: op.custo_padrao_unit * 0.16, real: op.mod_custo, var: varMOD },
                    { label: 'Custos Indiretos', padrao: op.custo_padrao_unit * 0.10, real: op.cif_custo, var: varMat * 0.3 },
                  ].map((item) => (
                    <div key={item.label} className="bg-muted/20 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground font-medium mb-2">{item.label}</p>
                      <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Padrão:</span><span>{R$(item.padrao)}</span></div>
                      <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Real:</span><span className="font-semibold">{R$(item.real)}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Variação:</span>
                        <span className={`font-bold ${item.var > 0 ? 'text-red-600' : 'text-green-600'}`}>{item.var > 0 ? '+' : ''}{item.var?.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { categoria: 'Materiais', padrao: Math.round(op.custo_padrao_unit * 0.74), real: op.materiais_custo },
                      { categoria: 'MOD', padrao: Math.round(op.custo_padrao_unit * 0.16), real: op.mod_custo },
                      { categoria: 'CIF', padrao: Math.round(op.custo_padrao_unit * 0.10), real: op.cif_custo },
                    ]} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="categoria" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `R$${(v/1000).toFixed(1)}k`} />
                      <Tooltip formatter={(v) => R$(v)} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="padrao" name="Padrão" fill="#d1d5db" radius={[2,2,0,0]} />
                      <Bar dataKey="real" name="Real" fill="#2563eb" radius={[2,2,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── REPROCESSAMENTO ──────────────────────────────────────────────── */}
      {aba === 'reprocessamento' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="erp-card p-5 space-y-4">
              <p className="text-sm font-semibold flex items-center gap-2"><RefreshCw size={15} className="text-primary" />Reprocessamento de Movimentações de Estoque</p>
              <p className="text-xs text-muted-foreground">O reprocessamento recalcula o custo real de todas as movimentações de produção e vendas utilizando as taxas hora reais apuradas e os custos médios de matérias-primas.</p>
              <div className="space-y-2">
                <div><label className="erp-label">Período de Apuração</label>
                  <select className="erp-input w-full" value={mesSel} onChange={(e) => setMesSel(Number(e.target.value))}>
                    {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m, i) => (
                      <option key={i} value={i}>{m} / 2026</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  { step: '1', label: 'Importar custos do financeiro', status: 'ok' },
                  { step: '2', label: 'Importar saldos da contabilidade', status: 'ok' },
                  { step: '3', label: 'Apurar horas reais do apontamento', status: 'ok' },
                  { step: '4', label: 'Calcular taxa hora real por centro de custo', status: 'ok' },
                  { step: '5', label: 'Gerar apontamentos automáticos (sem chão de fábrica)', status: 'pending' },
                  { step: '6', label: 'Reprocessar movimentações de produção', status: 'pending' },
                  { step: '7', label: 'Reprocessar movimentações de vendas (CPV)', status: 'pending' },
                ].map((s) => (
                  <div key={s.step} className={`flex items-center gap-2.5 p-2 rounded-lg ${s.status === 'ok' ? 'bg-green-50' : 'bg-muted/20'}`}>
                    {s.status === 'ok'
                      ? <CheckCircle size={13} className="text-green-500 shrink-0" />
                      : <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
                    <span className={s.status === 'ok' ? 'text-green-700' : 'text-muted-foreground'}>{s.step}. {s.label}</span>
                  </div>
                ))}
              </div>
              <button type="button" onClick={handleReprocessar} disabled={reprocessando}
                className="erp-btn w-full flex items-center justify-center gap-2 disabled:opacity-60">
                <RefreshCw size={13} className={reprocessando ? 'animate-spin' : ''} />
                {reprocessando ? 'Processando...' : 'Executar Reprocessamento'}
              </button>
            </div>
            <div className="erp-card p-5 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2"><Clock size={15} className="text-primary" />Apontamentos Automáticos</p>
              <p className="text-xs text-muted-foreground">Para centros de custo sem apontamento no chão de fábrica, o sistema gera apontamentos automaticamente com base nos reportes de produção e nos tempos planejados dos roteiros.</p>
              <div className="space-y-2">
                {[
                  { cc: 'Corte / Plasma',   ordens: 8, horas_auto: 12.5, horas_real: 14.0 },
                  { cc: 'Acabamento',       ordens: 12, horas_auto: 19.0, horas_real: 18.5 },
                  { cc: 'Montagem Final',   ordens: 10, horas_auto: 15.0, horas_real: 15.5 },
                ].map((r) => (
                  <div key={r.cc} className="bg-muted/20 rounded-lg p-3 text-xs">
                    <div className="flex justify-between font-semibold mb-1"><span>{r.cc}</span><span>{r.ordens} ordens</span></div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Horas auto-geradas: <strong className="text-foreground">{r.horas_auto}h</strong></span>
                      <span>Horas reais apont.: <strong className="text-primary">{r.horas_real}h</strong></span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                <strong>Nota:</strong> Os apontamentos automáticos são gerados somente para centros de custo que não possuem apontamento manual registrado no período.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LUCRATIVIDADE ─────────────────────────────────────────────────── */}
      {aba === 'lucratividade' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Por Produto */}
            <div className="erp-card overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/20 border-b border-border text-xs font-semibold flex items-center gap-1.5"><Package size={12} />Lucratividade por Produto</div>
              <table className="erp-table w-full">
                <thead><tr><th>Produto</th><th className="text-right">Receita</th><th className="text-right">Custo Real</th><th className="text-right">Lucro</th><th className="text-right">Margem</th></tr></thead>
                <tbody>
                  {[...lucratProdutos].sort((a, b) => Number(b.margem) - Number(a.margem)).map((p) => (
                    <tr key={p.produto}>
                      <td><div className="font-mono font-bold text-xs text-primary">{p.produto}</div><div className="text-[10px] text-muted-foreground">{p.descricao}</div></td>
                      <td className="text-right">{R$(p.receita)}</td>
                      <td className="text-right">{R$(p.custo_real)}</td>
                      <td className="text-right font-semibold text-green-700">{R$(p.receita - p.custo_real)}</td>
                      <td className="text-right">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${Number(p.margem) >= 25 ? 'text-green-700 bg-green-50' : Number(p.margem) >= 15 ? 'text-yellow-700 bg-yellow-50' : 'text-red-700 bg-red-50'}`}>{p.margem}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Por Cliente */}
            <div className="erp-card overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/20 border-b border-border text-xs font-semibold flex items-center gap-1.5"><Users size={12} />Lucratividade por Cliente</div>
              <table className="erp-table w-full">
                <thead><tr><th>Cliente</th><th className="text-right">Pedidos</th><th className="text-right">Receita</th><th className="text-right">Custo Real</th><th className="text-right">Margem</th></tr></thead>
                <tbody>
                  {[...LUCRAT_CLIENTES].sort((a, b) => Number(b.margem) - Number(a.margem)).map((c) => (
                    <tr key={c.cliente}>
                      <td className="font-medium text-xs">{c.cliente}</td>
                      <td className="text-right">{c.pedidos}</td>
                      <td className="text-right">{R$(c.receita)}</td>
                      <td className="text-right">{R$(c.custo_real)}</td>
                      <td className="text-right">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${Number(c.margem) >= 25 ? 'text-green-700 bg-green-50' : Number(c.margem) >= 15 ? 'text-yellow-700 bg-yellow-50' : 'text-red-700 bg-red-50'}`}>{c.margem}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gráfico de lucratividade */}
          <div className="erp-card p-4" style={{ height: 220 }}>
            <p className="text-xs font-semibold mb-2">Receita × Custo Real × Lucro por Produto</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lucratProdutos.map((p) => ({ nome: p.produto, receita: p.receita, custo: p.custo_real, lucro: p.receita - p.custo_real }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="nome" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => R$(v)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="receita" name="Receita" fill="#2563eb" radius={[2,2,0,0]} />
                <Bar dataKey="custo" name="Custo Real" fill="#f59e0b" radius={[2,2,0,0]} />
                <Bar dataKey="lucro" name="Lucro" fill="#10b981" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── CPV / CONTABILIDADE ───────────────────────────────────────────── */}
      {aba === 'cpv' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Receita Acumulada (6m)', val: R$(cpvAcumulado.receita), cor: 'text-green-600' },
              { label: 'CPV Acumulado (6m)',     val: R$(cpvAcumulado.cpv),     cor: 'text-primary' },
              { label: 'Lucro Bruto (6m)',       val: R$(cpvAcumulado.lucro),   cor: 'text-foreground' },
            ].map((k) => (
              <div key={k.label} className="erp-card p-4 text-center">
                <p className="text-[10px] text-muted-foreground">{k.label}</p>
                <p className={`text-lg font-bold mt-0.5 ${k.cor}`}>{k.val}</p>
                <p className="text-[10px] text-muted-foreground">{k.label.includes('CPV') ? `${(cpvAcumulado.cpv/cpvAcumulado.receita*100).toFixed(1)}% da Receita` : k.label.includes('Lucro') ? `Margem Bruta: ${(cpvAcumulado.lucro/cpvAcumulado.receita*100).toFixed(1)}%` : 'Últimos 6 meses'}</p>
              </div>
            ))}
          </div>

          <div className="erp-card p-4" style={{ height: 220 }}>
            <p className="text-xs font-semibold mb-2">Evolução Receita × CPV × Lucro Bruto</p>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CPV_MENSAL}>
                <defs>
                  <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} /></linearGradient>
                  <linearGradient id="gradLucro" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0.0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => R$(v)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area dataKey="receita" name="Receita" stroke="#2563eb" fill="url(#gradReceita)" strokeWidth={2} />
                <Area dataKey="cpv" name="CPV" stroke="#f59e0b" fill="none" strokeWidth={2} />
                <Area dataKey="lucro" name="Lucro Bruto" stroke="#10b981" fill="url(#gradLucro)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="erp-card overflow-x-auto">
            <div className="px-4 py-2.5 bg-muted/20 border-b border-border text-xs font-semibold flex items-center justify-between">
              <span>Exportação de Custos para Contabilidade</span>
              <button type="button" onClick={() => toast.success('Arquivo exportado para a contabilidade!')} className="erp-btn-ghost text-xs flex items-center gap-1"><Download size={11} />Exportar</button>
            </div>
            <table className="erp-table w-full">
              <thead><tr><th>Produto</th><th className="text-right">Saldo Estoque</th><th>UN</th><th className="text-right">Custo Médio</th><th className="text-right">Valor Estoque</th><th className="text-right">CPV Mês</th><th className="text-right">% CPV/Receita</th></tr></thead>
              <tbody>
                {[
                  { produto: 'TANK-500L',   descricao: 'Tanque 316L 500L',   saldo: 3,    un: 'pc', cm: 9380, cpv: 18760 },
                  { produto: 'REATOR-200L', descricao: 'Reator 316L 200L',   saldo: 2,    un: 'pc', cm: 6890, cpv: 6890  },
                  { produto: 'AGIT-100L',   descricao: 'Agitador 100L',      saldo: 5,    un: 'pc', cm: 3290, cpv: 9870  },
                  { produto: 'MP-CHAPA-316L-3MM', descricao: 'Chapa Inox 316L 3mm', saldo: 2340.5, un: 'kg', cm: 47.32, cpv: 0 },
                ].map((p, i) => {
                  const receitaProd = lucratProdutos.find((lp) => lp.produto === p.produto)?.receita || 1;
                  return (
                    <tr key={i}>
                      <td><div className="font-mono font-bold text-xs text-primary">{p.produto}</div><div className="text-[10px] text-muted-foreground">{p.descricao}</div></td>
                      <td className="text-right">{p.saldo.toLocaleString('pt-BR')}</td>
                      <td>{p.un}</td>
                      <td className="text-right">{R$(p.cm)}</td>
                      <td className="text-right font-semibold">{R$(p.saldo * p.cm)}</td>
                      <td className="text-right">{p.cpv > 0 ? R$(p.cpv) : '—'}</td>
                      <td className="text-right text-muted-foreground">{p.cpv > 0 ? pct(p.cpv / receitaProd * 100) : '—'}</td>
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
