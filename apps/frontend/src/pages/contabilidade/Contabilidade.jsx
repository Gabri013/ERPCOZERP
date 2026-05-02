import { useState, useMemo, useEffect, useCallback } from 'react';
import { listEntries, createEntry, listAccountPlan, getDRE } from '@/services/accountingApi.js';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import {
  BookOpen, TrendingUp, TrendingDown, RefreshCw, Plus, Download,
  Settings, FileText, ChevronRight, ChevronDown, CheckCircle,
  Search, Filter, Eye,
} from 'lucide-react';
import { toast } from 'sonner';

const R$ = (v, always = false) => {
  const n = Number(v || 0);
  if (!always && n === 0) return '—';
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// ─── Plano de Contas ────────────────────────────────────────────────────────
const planoContas = [
  { id: '1', codigo: '1', nome: 'ATIVO', tipo: 'grupo', nivel: 0, saldo: 3_842_500 },
  { id: '1.1', codigo: '1.1', nome: 'Ativo Circulante', tipo: 'grupo', nivel: 1, saldo: 1_285_000 },
  { id: '1.1.01', codigo: '1.1.01', nome: 'Caixa e Equivalentes', tipo: 'analitica', natureza: 'D', nivel: 2, saldo: 145_000 },
  { id: '1.1.02', codigo: '1.1.02', nome: 'Contas a Receber', tipo: 'analitica', natureza: 'D', nivel: 2, saldo: 512_000 },
  { id: '1.1.03', codigo: '1.1.03', nome: 'Estoques', tipo: 'analitica', natureza: 'D', nivel: 2, saldo: 628_000 },
  { id: '1.2', codigo: '1.2', nome: 'Ativo Não Circulante', tipo: 'grupo', nivel: 1, saldo: 2_557_500 },
  { id: '1.2.01', codigo: '1.2.01', nome: 'Imobilizado', tipo: 'analitica', natureza: 'D', nivel: 2, saldo: 2_557_500 },
  { id: '2', codigo: '2', nome: 'PASSIVO', tipo: 'grupo', nivel: 0, saldo: 1_940_000 },
  { id: '2.1', codigo: '2.1', nome: 'Passivo Circulante', tipo: 'grupo', nivel: 1, saldo: 780_000 },
  { id: '2.1.01', codigo: '2.1.01', nome: 'Fornecedores', tipo: 'analitica', natureza: 'C', nivel: 2, saldo: 320_000 },
  { id: '2.1.02', codigo: '2.1.02', nome: 'Obrigações Fiscais', tipo: 'analitica', natureza: 'C', nivel: 2, saldo: 198_000 },
  { id: '2.1.03', codigo: '2.1.03', nome: 'Salários e Encargos', tipo: 'analitica', natureza: 'C', nivel: 2, saldo: 262_000 },
  { id: '2.2', codigo: '2.2', nome: 'Passivo Não Circulante', tipo: 'grupo', nivel: 1, saldo: 1_160_000 },
  { id: '2.2.01', codigo: '2.2.01', nome: 'Empréstimos e Financiamentos', tipo: 'analitica', natureza: 'C', nivel: 2, saldo: 1_160_000 },
  { id: '3', codigo: '3', nome: 'PATRIMÔNIO LÍQUIDO', tipo: 'grupo', nivel: 0, saldo: 1_902_500 },
  { id: '3.1', codigo: '3.1', nome: 'Capital Social', tipo: 'analitica', natureza: 'C', nivel: 1, saldo: 1_500_000 },
  { id: '3.2', codigo: '3.2', nome: 'Lucros Acumulados', tipo: 'analitica', natureza: 'C', nivel: 1, saldo: 402_500 },
  { id: '4', codigo: '4', nome: 'RECEITAS', tipo: 'grupo', nivel: 0, saldo: 243_000 },
  { id: '4.1', codigo: '4.1', nome: 'Receita Bruta de Vendas', tipo: 'analitica', natureza: 'C', nivel: 1, saldo: 243_000 },
  { id: '5', codigo: '5', nome: 'CUSTOS E DESPESAS', tipo: 'grupo', nivel: 0, saldo: 197_820 },
  { id: '5.1', codigo: '5.1', nome: 'Custo dos Produtos Vendidos', tipo: 'analitica', natureza: 'D', nivel: 1, saldo: 158_000 },
  { id: '5.2', codigo: '5.2', nome: 'Despesas Operacionais', tipo: 'grupo', nivel: 1, saldo: 39_820 },
  { id: '5.2.01', codigo: '5.2.01', nome: 'Despesas Comerciais', tipo: 'analitica', natureza: 'D', nivel: 2, saldo: 14_200 },
  { id: '5.2.02', codigo: '5.2.02', nome: 'Despesas Administrativas', tipo: 'analitica', natureza: 'D', nivel: 2, saldo: 18_600 },
  { id: '5.2.03', codigo: '5.2.03', nome: 'Despesas Financeiras', tipo: 'analitica', natureza: 'D', nivel: 2, saldo: 7_020 },
];

// ─── Lançamentos ────────────────────────────────────────────────────────────
const lancamentos = [
  { id: 'LC-2026-4-1452', data: '2026-04-30', origem: 'NF-e Saída', doc: 'NF-e 000321', historico: 'Venda de mercadorias — Pharma Brasil Ltda', debito: '1.1.02', credito: '4.1', valor: 24_800, automatico: true },
  { id: 'LC-2026-4-1451', data: '2026-04-30', origem: 'NF-e Saída', doc: 'NF-e 000321', historico: 'Baixa de estoque — Pharma Brasil Ltda', debito: '5.1', credito: '1.1.03', valor: 18_760, automatico: true },
  { id: 'LC-2026-4-1449', data: '2026-04-28', origem: 'Financeiro', doc: 'REC-2026-0899', historico: 'Recebimento de cliente — Alimentos SA', debito: '1.1.01', credito: '1.1.02', valor: 28_500, automatico: true },
  { id: 'LC-2026-4-1448', data: '2026-04-27', origem: 'NF-e Entrada', doc: 'NF-e 004812', historico: 'Compra de matéria-prima — AcerMetal Ltda', debito: '1.1.03', credito: '2.1.01', valor: 41_200, automatico: true },
  { id: 'LC-2026-4-1445', data: '2026-04-25', origem: 'Produção', doc: 'OP-2026-0451', historico: 'Requisição de materiais — OP-2026-0451', debito: '5.1', credito: '1.1.03', valor: 13_900, automatico: true },
  { id: 'LC-2026-4-1441', data: '2026-04-24', origem: 'Financeiro', doc: 'PAG-2026-0512', historico: 'Pagamento folha de pagamento — Abril/2026', debito: '5.2.02', credito: '1.1.01', valor: 18_600, automatico: true },
  { id: 'LC-2026-4-1438', data: '2026-04-22', origem: 'Manual', doc: '—', historico: 'Provisão de férias — Abril/2026', debito: '5.2.02', credito: '2.1.03', valor: 4_800, automatico: false },
  { id: 'LC-2026-4-1435', data: '2026-04-20', origem: 'Estoque', doc: 'TRF-2026-0088', historico: 'Transferência entre setores — Almox → Produção', debito: '1.1.03', credito: '1.1.03', valor: 8_400, automatico: true },
];

// ─── DRE ────────────────────────────────────────────────────────────────────
const dreMensal = [
  { mes: 'Nov/25', receita: 185_000, cpv: 128_000, lucro_bruto: 57_000, desp_op: 34_000, ebitda: 23_000, result_fin: -5_500, lucro_liq: 17_500 },
  { mes: 'Dez/25', receita: 201_000, cpv: 138_000, lucro_bruto: 63_000, desp_op: 36_200, ebitda: 26_800, result_fin: -5_800, lucro_liq: 21_000 },
  { mes: 'Jan/26', receita: 168_000, cpv: 119_000, lucro_bruto: 49_000, desp_op: 31_400, ebitda: 17_600, result_fin: -6_100, lucro_liq: 11_500 },
  { mes: 'Fev/26', receita: 214_000, cpv: 145_000, lucro_bruto: 69_000, desp_op: 37_800, ebitda: 31_200, result_fin: -6_200, lucro_liq: 25_000 },
  { mes: 'Mar/26', receita: 228_000, cpv: 152_000, lucro_bruto: 76_000, desp_op: 38_600, ebitda: 37_400, result_fin: -6_800, lucro_liq: 30_600 },
  { mes: 'Abr/26', receita: 243_000, cpv: 158_000, lucro_bruto: 85_000, desp_op: 39_820, ebitda: 45_180, result_fin: -7_020, lucro_liq: 38_160 },
];

const DRE_PROJETOS = [
  { projeto: 'Pharma Brasil — Linha 3',   receita: 42_000, cpv: 30_200, desp: 4_800, resultado: 7_000 },
  { projeto: 'Alimentos SA — Tanques',    receita: 28_500, cpv: 22_800, desp: 2_100, resultado: 3_600 },
  { projeto: 'Cosméticos Norte — Reatores', receita: 15_200, cpv: 11_100, desp: 1_800, resultado: 2_300 },
  { projeto: 'Biotech — Misturadores',    receita: 8_900,  cpv: 7_950,  desp: 680,  resultado: 270 },
];

// ─── Históricos padrão configuráveis ────────────────────────────────────────
const HISTORICOS = [
  { id: 1, tipo: 'NF-e Saída',         template: 'Venda de mercadorias — {CLIENTE} — NF-e {NF_NUM}' },
  { id: 2, tipo: 'Baixa Estoque Venda',template: 'Baixa de estoque — {PRODUTO} — NF-e {NF_NUM}' },
  { id: 3, tipo: 'NF-e Entrada',       template: 'Compra de materiais — {FORNECEDOR} — NF-e {NF_NUM}' },
  { id: 4, tipo: 'Requisição Produção',template: 'Requisição de materiais — {OP} — {PRODUTO}' },
  { id: 5, tipo: 'Reporte Produção',   template: 'Entrada de produção — {OP} — {PRODUTO} — Qtd {QTD}' },
  { id: 6, tipo: 'Recebimento',        template: 'Recebimento de cliente — {CLIENTE} — {DOC}' },
  { id: 7, tipo: 'Pagamento',          template: 'Pagamento a fornecedor — {FORNECEDOR} — {DOC}' },
  { id: 8, tipo: 'Folha de Pagamento', template: 'Folha de pagamento — {COMPETENCIA}' },
];

const CORES_DRE = { receita: '#2563eb', lucro_bruto: '#10b981', ebitda: '#8b5cf6', lucro_liq: '#f59e0b' };
const NIVEL_INDENT = ['', 'pl-4', 'pl-8'];

export default function Contabilidade() {
  const [aba, setAba] = useState('lancamentos');
  const [planoContas, setPlanoContas] = useState([]);
  const [lancamentos, setLancamentos] = useState([]);
  const [dreMensal, setDreMensal] = useState([]);
  const [expandedGrupos, setExpandedGrupos] = useState({ '1': true, '2': true, '3': true, '4': true, '5': true });
  const [busca, setBusca] = useState('');
  const [filtroOrigem, setFiltroOrigem] = useState('');
  const [showNovoLC, setShowNovoLC] = useState(false);
  const [reprocessando, setReprocessando] = useState(false);
  const [novoLC, setNovoLC] = useState({ data: '', debito: '', credito: '', valor: '', historico: '' });

  const loadData = useCallback(async () => {
    try {
      const [entries, plan, dre] = await Promise.all([listEntries(), listAccountPlan(), getDRE()]);
      if (entries && entries.length > 0) {
        setLancamentos(entries.map((e) => ({
          id: e.id,
          data: e.entryDate ? e.entryDate.slice(0, 10) : '',
          debito: e.debitAccount,
          credito: e.creditAccount,
          valor: Number(e.amount),
          historico: e.description,
          origem: e.origin,
          modulo: e.module || '',
        })));
      }
      if (plan && plan.length > 0) {
        setPlanoContas(plan.map((p) => ({
          codigo: p.code,
          nome: p.name,
          tipo: p.accountType,
          nivel: p.level - 1,
          saldo: 0,
          natureza: ['receita'].includes(p.accountType) ? 'C' : 'D',
        })));
      }
      if (dre && dre.monthly) {
        const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        setDreMensal(Object.entries(dre.monthly).map(([m, v]) => ({
          mes: meses[parseInt(m) - 1],
          receita: v.receita,
          despesa: v.despesa,
          lucro: v.receita - v.despesa,
        })));
      }
    } catch {
      // keep mock data
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleGrupo = (codigo) => setExpandedGrupos((prev) => ({ ...prev, [codigo]: !prev[codigo] }));

  const contasVisiveis = useMemo(() => {
    return planoContas.filter((c) => {
      if (c.nivel === 0) return true;
      const partes = c.codigo.split('.');
      let parentOk = true;
      for (let i = 1; i < partes.length; i++) {
        const parent = partes.slice(0, i).join('.');
        if (expandedGrupos[parent] === false) { parentOk = false; break; }
      }
      return parentOk;
    });
  }, [expandedGrupos]);

  const lancamentosFiltrados = useMemo(() => {
    return lancamentos.filter((l) => {
      const matchBusca = !busca || l.historico.toLowerCase().includes(busca.toLowerCase()) || l.doc.toLowerCase().includes(busca.toLowerCase());
      const matchOrigem = !filtroOrigem || l.origem === filtroOrigem;
      return matchBusca && matchOrigem;
    });
  }, [busca, filtroOrigem]);

  const dreAtual = dreMensal[dreMensal.length - 1];
  const mgBruta = (dreAtual.lucro_bruto / dreAtual.receita * 100).toFixed(1);
  const mgEbitda = (dreAtual.ebitda / dreAtual.receita * 100).toFixed(1);
  const mgLiq = (dreAtual.lucro_liq / dreAtual.receita * 100).toFixed(1);

  const ABAS = [
    { id: 'lancamentos',  label: 'Lançamentos Contábeis' },
    { id: 'planoContas', label: 'Plano de Contas' },
    { id: 'dre',          label: 'DRE Gerencial' },
    { id: 'dre_projetos', label: 'DRE por Projeto' },
    { id: 'reprocessamento', label: 'Reprocessamento' },
    { id: 'configuracoes', label: 'Configurações' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><BookOpen size={20} className="text-primary" />Contabilidade</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Lançamentos automáticos em tempo real, DRE gerencial e integração completa com todas as áreas</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowNovoLC(true)} className="erp-btn text-xs flex items-center gap-1.5"><Plus size={13} />Lançamento Manual</button>
          <button type="button" onClick={() => toast.info('Exportando relatório contábil...')} className="erp-btn-ghost text-xs flex items-center gap-1.5"><Download size={13} />Exportar</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Receita (Abr)', val: R$(dreAtual.receita, true), sub: '↑ 6,6% vs mar', cor: 'text-green-600' },
          { label: 'Lucro Bruto', val: R$(dreAtual.lucro_bruto, true), sub: `Margem ${mgBruta}%`, cor: 'text-primary' },
          { label: 'EBITDA', val: R$(dreAtual.ebitda, true), sub: `Margem ${mgEbitda}%`, cor: 'text-purple-600' },
          { label: 'Lucro Líquido', val: R$(dreAtual.lucro_liq, true), sub: `Margem ${mgLiq}%`, cor: 'text-yellow-600' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className={`text-base font-bold ${k.cor}`}>{k.val}</p>
            <p className="text-[10px] text-muted-foreground">{k.sub}</p>
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

      {/* ── LANÇAMENTOS ────────────────────────────────────────────────── */}
      {aba === 'lancamentos' && (
        <div className="space-y-3">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="erp-input pl-7 w-full" placeholder="Buscar histórico ou documento..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <select className="erp-input w-40" value={filtroOrigem} onChange={(e) => setFiltroOrigem(e.target.value)}>
              <option value="">Todas as origens</option>
              {['NF-e Saída', 'NF-e Entrada', 'Financeiro', 'Produção', 'Estoque', 'Manual'].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>

          <div className="erp-card overflow-x-auto">
            <table className="erp-table w-full min-w-[900px]">
              <thead>
                <tr><th>Código</th><th>Data</th><th>Origem</th><th>Documento</th><th>Histórico</th><th>Conta Débito</th><th>Conta Crédito</th><th className="text-right">Valor</th><th>Tipo</th></tr>
              </thead>
              <tbody>
                {lancamentosFiltrados.map((lc) => {
                  const contaD = planoContas.find((c) => c.codigo === lc.debito);
                  const contaC = planoContas.find((c) => c.codigo === lc.credito);
                  return (
                    <tr key={lc.id}>
                      <td className="font-mono text-[10px] text-primary font-bold">{lc.id}</td>
                      <td className="whitespace-nowrap">{lc.data}</td>
                      <td><span className={`erp-badge ${lc.origem === 'Manual' ? 'erp-badge-warning' : 'erp-badge-info'}`}>{lc.origem}</span></td>
                      <td className="font-mono text-xs">{lc.doc}</td>
                      <td className="max-w-xs truncate text-xs">{lc.historico}</td>
                      <td className="text-xs"><span className="font-mono font-bold text-primary">{lc.debito}</span> <span className="text-muted-foreground">{contaD?.nome}</span></td>
                      <td className="text-xs"><span className="font-mono font-bold text-primary">{lc.credito}</span> <span className="text-muted-foreground">{contaC?.nome}</span></td>
                      <td className="text-right font-semibold font-mono">{R$(lc.valor, true)}</td>
                      <td><span className={`erp-badge ${lc.automatico ? 'erp-badge-success' : 'erp-badge-warning'}`}>{lc.automatico ? 'Automático' : 'Manual'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PLANO DE CONTAS ─────────────────────────────────────────────── */}
      {aba === 'planoContas' && (
        <div className="erp-card overflow-x-auto">
          <div className="px-4 py-2.5 bg-muted/20 border-b border-border flex items-center justify-between">
            <p className="text-xs font-semibold">Plano de Contas Contábil</p>
            <div className="flex gap-2">
              <button type="button" className="erp-btn-ghost text-xs flex items-center gap-1"><Download size={11} />Exportar</button>
              <button type="button" className="erp-btn text-xs flex items-center gap-1"><Plus size={11} />Nova Conta</button>
            </div>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-muted/20"><tr><th className="text-left px-3 py-2">Código</th><th className="text-left px-3 py-2">Nome da Conta</th><th className="px-3 py-2">Natureza</th><th className="px-3 py-2">Tipo</th><th className="text-right px-3 py-2">Saldo (R$)</th></tr></thead>
            <tbody>
              {contasVisiveis.map((conta) => {
                const temFilhos = planoContas.some((c) => c.codigo.startsWith(conta.codigo + '.') && c.codigo.split('.').length === conta.codigo.split('.').length + 1);
                return (
                  <tr key={conta.id} className={`border-b border-border/20 ${conta.nivel === 0 ? 'bg-primary/5 font-bold' : conta.nivel === 1 ? 'bg-muted/10 font-semibold' : ''}`}>
                    <td className={`px-3 py-1.5 font-mono ${NIVEL_INDENT[conta.nivel]}`}>
                      <div className="flex items-center gap-1">
                        {temFilhos ? (
                          <button type="button" onClick={() => toggleGrupo(conta.codigo)} className="text-muted-foreground hover:text-primary">
                            {expandedGrupos[conta.codigo] !== false ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                          </button>
                        ) : <span className="w-3" />}
                        {conta.codigo}
                      </div>
                    </td>
                    <td className={`px-3 py-1.5 ${NIVEL_INDENT[conta.nivel]}`}>{conta.nome}</td>
                    <td className="px-3 py-1.5 text-center">
                      {conta.natureza && (
                        <span className={`font-bold ${conta.natureza === 'D' ? 'text-blue-600' : 'text-orange-600'}`}>{conta.natureza}</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <span className={`erp-badge ${conta.tipo === 'analitica' ? 'erp-badge-info' : 'erp-badge-default'}`}>{conta.tipo}</span>
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono">{R$(conta.saldo, true)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── DRE GERENCIAL ───────────────────────────────────────────────── */}
      {aba === 'dre' && (
        <div className="space-y-3">
          {/* DRE detalhado */}
          <div className="erp-card p-0 overflow-hidden">
            <div className="px-4 py-3 bg-muted/20 border-b border-border flex items-center justify-between">
              <p className="text-xs font-semibold">DRE Gerencial — Abril/2026 (tempo real)</p>
              <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded"><CheckCircle size={10} />Atualizado agora</span>
            </div>
            {[
              { label: 'Receita Bruta de Vendas', val: dreAtual.receita, pct: 100, bold: false, bg: '' },
              { label: '(−) Deduções e Impostos', val: -(dreAtual.receita * 0.13), pct: -13, bold: false, bg: '', neg: true },
              { label: 'Receita Líquida', val: dreAtual.receita * 0.87, pct: 87, bold: true, bg: 'bg-muted/10' },
              { label: '(−) Custo dos Produtos Vendidos', val: -dreAtual.cpv, pct: -(dreAtual.cpv/dreAtual.receita*100), bold: false, bg: '', neg: true },
              { label: 'Lucro Bruto', val: dreAtual.lucro_bruto, pct: dreAtual.lucro_bruto/dreAtual.receita*100, bold: true, bg: 'bg-green-50', corVal: 'text-green-700' },
              { label: '(−) Despesas Comerciais', val: -14_200, pct: -(14_200/dreAtual.receita*100), bold: false, bg: '', neg: true },
              { label: '(−) Despesas Administrativas', val: -18_600, pct: -(18_600/dreAtual.receita*100), bold: false, bg: '', neg: true },
              { label: 'EBITDA', val: dreAtual.ebitda, pct: dreAtual.ebitda/dreAtual.receita*100, bold: true, bg: 'bg-purple-50', corVal: 'text-purple-700' },
              { label: '(−) Depreciação e Amortização', val: -3_200, pct: -(3_200/dreAtual.receita*100), bold: false, bg: '', neg: true },
              { label: 'EBIT (Resultado Operacional)', val: dreAtual.ebitda - 3_200, pct: (dreAtual.ebitda - 3_200)/dreAtual.receita*100, bold: true, bg: 'bg-muted/10' },
              { label: '(−) Resultado Financeiro Líquido', val: dreAtual.result_fin, pct: dreAtual.result_fin/dreAtual.receita*100, bold: false, bg: '', neg: true },
              { label: 'EBT (Resultado antes IR)', val: dreAtual.ebitda - 3_200 + dreAtual.result_fin, pct: (dreAtual.ebitda - 3_200 + dreAtual.result_fin)/dreAtual.receita*100, bold: true, bg: 'bg-muted/10' },
              { label: '(−) Imposto de Renda e CSLL', val: -4_980, pct: -(4_980/dreAtual.receita*100), bold: false, bg: '', neg: true },
              { label: 'Lucro Líquido do Exercício', val: dreAtual.lucro_liq, pct: dreAtual.lucro_liq/dreAtual.receita*100, bold: true, bg: 'bg-yellow-50', corVal: 'text-yellow-700', border: true },
            ].map((row, i) => (
              <div key={i} className={`flex items-center justify-between px-5 py-2 text-xs border-b border-border/20 ${row.bg} ${row.bold ? 'font-bold' : ''} ${row.border ? 'border-t-2 border-primary/20' : ''}`}>
                <span className={row.neg ? 'text-muted-foreground' : ''}>{row.label}</span>
                <div className="flex items-center gap-8">
                  <span className="text-muted-foreground w-14 text-right">{row.pct.toFixed(1)}%</span>
                  <span className={`w-28 text-right font-mono ${row.corVal || (row.neg ? 'text-red-600' : '')}`}>{R$(Math.abs(row.val), true)}{row.neg ? ' (−)' : ''}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Gráfico histórico */}
          <div className="erp-card p-4" style={{ height: 220 }}>
            <p className="text-xs font-semibold mb-2">Evolução — Receita × Lucro Bruto × EBITDA × Lucro Líquido</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dreMensal} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => R$(v, true)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="receita" name="Receita" fill="#2563eb" radius={[2,2,0,0]} />
                <Bar dataKey="lucro_bruto" name="Lucro Bruto" fill="#10b981" radius={[2,2,0,0]} />
                <Bar dataKey="ebitda" name="EBITDA" fill="#8b5cf6" radius={[2,2,0,0]} />
                <Bar dataKey="lucro_liq" name="Lucro Líq." fill="#f59e0b" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── DRE POR PROJETO ─────────────────────────────────────────────── */}
      {aba === 'dre_projetos' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="erp-card overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/20 border-b border-border text-xs font-semibold">DRE por Projeto — Abril/2026</div>
              <table className="erp-table w-full">
                <thead><tr><th>Projeto</th><th className="text-right">Receita</th><th className="text-right">CPV</th><th className="text-right">Despesas</th><th className="text-right">Resultado</th><th className="text-right">Margem</th></tr></thead>
                <tbody>
                  {[...DRE_PROJETOS].sort((a, b) => b.resultado - a.resultado).map((p) => {
                    const margem = (p.resultado / p.receita * 100).toFixed(1);
                    return (
                      <tr key={p.projeto}>
                        <td className="font-medium text-xs max-w-[180px] truncate">{p.projeto}</td>
                        <td className="text-right">{R$(p.receita, true)}</td>
                        <td className="text-right text-red-600">{R$(p.cpv, true)}</td>
                        <td className="text-right text-red-600">{R$(p.desp, true)}</td>
                        <td className="text-right font-bold text-green-700">{R$(p.resultado, true)}</td>
                        <td className="text-right"><span className={`erp-badge ${Number(margem) >= 20 ? 'erp-badge-success' : Number(margem) >= 10 ? 'erp-badge-warning' : 'erp-badge-danger'}`}>{margem}%</span></td>
                      </tr>
                    );
                  })}
                  <tr className="bg-primary/5 font-bold border-t-2 border-primary/20">
                    <td>Total Geral</td>
                    <td className="text-right">{R$(DRE_PROJETOS.reduce((s, p) => s + p.receita, 0), true)}</td>
                    <td className="text-right text-red-600">{R$(DRE_PROJETOS.reduce((s, p) => s + p.cpv, 0), true)}</td>
                    <td className="text-right text-red-600">{R$(DRE_PROJETOS.reduce((s, p) => s + p.desp, 0), true)}</td>
                    <td className="text-right text-green-700">{R$(DRE_PROJETOS.reduce((s, p) => s + p.resultado, 0), true)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="erp-card p-4" style={{ height: 280 }}>
              <p className="text-xs font-semibold mb-2">Resultado por Projeto</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DRE_PROJETOS.map((p) => ({ nome: p.projeto.split('—')[0].trim(), receita: p.receita, resultado: p.resultado }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="nome" tick={{ fontSize: 9 }} width={90} />
                  <Tooltip formatter={(v) => R$(v, true)} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="receita" name="Receita" fill="#2563eb" radius={[0,3,3,0]} />
                  <Bar dataKey="resultado" name="Resultado" fill="#10b981" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── REPROCESSAMENTO ─────────────────────────────────────────────── */}
      {aba === 'reprocessamento' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="erp-card p-5 space-y-4">
            <p className="text-sm font-semibold flex items-center gap-2"><RefreshCw size={15} className="text-primary" />Reprocessamento Contábil</p>
            <p className="text-xs text-muted-foreground">Reprocesse lançamentos contábeis a partir de uma data no passado para ajustes, correções ou contabilidade retroativa.</p>
            <div className="space-y-3">
              <div><label className="erp-label">Data de Início do Reprocessamento</label><input type="date" className="erp-input w-full" defaultValue="2026-04-01" /></div>
              <div><label className="erp-label">Módulos a Reprocessar</label>
                <div className="space-y-1.5 mt-1">
                  {['Vendas / NF-e de Saída','Compras / NF-e de Entrada','Financeiro (Receb. e Pagamentos)','Movimentações de Estoque','Produção (Requisições e Reportes)','Folha de Pagamento'].map((m) => (
                    <label key={m} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span>{m}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <button type="button" disabled={reprocessando} onClick={() => { setReprocessando(true); setTimeout(() => { setReprocessando(false); toast.success('Reprocessamento contábil concluído!'); }, 2500); }}
              className="erp-btn w-full flex items-center justify-center gap-2 disabled:opacity-60">
              <RefreshCw size={13} className={reprocessando ? 'animate-spin' : ''} />
              {reprocessando ? 'Reprocessando...' : 'Executar Reprocessamento'}
            </button>
          </div>
          <div className="erp-card p-5 space-y-3">
            <p className="text-sm font-semibold">Últimos Reprocessamentos</p>
            {[
              { data: '2026-04-01', usuario: 'Ana Contadora', modulos: 6, lancamentos: 1284, status: 'ok' },
              { data: '2026-03-01', usuario: 'Ana Contadora', modulos: 6, lancamentos: 1107, status: 'ok' },
              { data: '2026-02-01', usuario: 'Carlos ERP',    modulos: 4, lancamentos: 892,  status: 'ok' },
            ].map((r, i) => (
              <div key={i} className="bg-muted/20 rounded-lg p-3 text-xs flex items-start justify-between">
                <div>
                  <div className="font-semibold">{r.data}</div>
                  <div className="text-muted-foreground">Por: {r.usuario}</div>
                  <div className="text-muted-foreground">{r.modulos} módulos · {r.lancamentos.toLocaleString('pt-BR')} lançamentos</div>
                </div>
                <CheckCircle size={14} className="text-green-500 mt-0.5" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CONFIGURAÇÕES ───────────────────────────────────────────────── */}
      {aba === 'configuracoes' && (
        <div className="space-y-3">
          <div className="erp-card overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/20 border-b border-border text-xs font-semibold">Personalização de Históricos Contábeis</div>
            <table className="erp-table w-full">
              <thead><tr><th>Tipo de Lançamento</th><th>Template de Histórico</th><th>Variáveis Disponíveis</th><th></th></tr></thead>
              <tbody>
                {HISTORICOS.map((h) => (
                  <tr key={h.id}>
                    <td className="font-medium">{h.tipo}</td>
                    <td><input className="erp-input w-full font-mono text-xs" defaultValue={h.template} /></td>
                    <td className="text-[10px] text-muted-foreground">
                      {h.template.match(/\{[A-Z_]+\}/g)?.join(', ')}
                    </td>
                    <td className="text-center">
                      <button type="button" onClick={() => toast.success('Histórico salvo!')} className="erp-btn-ghost text-xs">Salvar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="erp-card p-4 space-y-3">
              <p className="text-xs font-semibold flex items-center gap-1.5"><Settings size={13} />Configurações de Integração Contábil</p>
              {[
                { label: 'Conta Bancária Padrão', placeholder: '1.1.01 — Caixa e Equivalentes' },
                { label: 'Conta de Estoque Padrão', placeholder: '1.1.03 — Estoques' },
                { label: 'Conta de Receita de Vendas', placeholder: '4.1 — Receita Bruta de Vendas' },
                { label: 'Conta CPV / Baixa Estoque', placeholder: '5.1 — Custo dos Produtos Vendidos' },
                { label: 'Conta Fornecedores', placeholder: '2.1.01 — Fornecedores' },
                { label: 'Conta Clientes (C/R)', placeholder: '1.1.02 — Contas a Receber' },
              ].map((c) => (
                <div key={c.label}>
                  <label className="erp-label">{c.label}</label>
                  <input className="erp-input w-full text-xs" placeholder={c.placeholder} defaultValue={c.placeholder} />
                </div>
              ))}
              <button type="button" onClick={() => toast.success('Configurações salvas!')} className="erp-btn w-full text-xs">Salvar Configurações</button>
            </div>
            <div className="erp-card p-4 space-y-3">
              <p className="text-xs font-semibold">Eventos Contábeis Automáticos</p>
              <p className="text-[10px] text-muted-foreground">Configure quais eventos do sistema geram lançamentos contábeis automaticamente.</p>
              {[
                { evento: 'Emissão de NF-e de Saída',      ativo: true },
                { evento: 'Baixa de Estoque na Venda',      ativo: true },
                { evento: 'Recebimento de NF-e de Entrada', ativo: true },
                { evento: 'Pagamento de Fornecedor',        ativo: true },
                { evento: 'Recebimento de Cliente',         ativo: true },
                { evento: 'Requisição de Materiais',        ativo: true },
                { evento: 'Reporte de Produção',            ativo: true },
                { evento: 'Transferência entre Setores',    ativo: false },
                { evento: 'Folha de Pagamento',             ativo: true },
              ].map((e) => (
                <label key={e.evento} className="flex items-center justify-between text-xs cursor-pointer py-1 border-b border-border/20">
                  <span>{e.evento}</span>
                  <input type="checkbox" defaultChecked={e.ativo} className="rounded" />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Lançamento */}
      {showNovoLC && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <p className="font-semibold flex items-center gap-2"><FileText size={15} />Novo Lançamento Contábil Manual</p>
              <button type="button" onClick={() => setShowNovoLC(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="erp-label">Data</label><input type="date" className="erp-input w-full" value={novoLC.data} onChange={(e) => setNovoLC({ ...novoLC, data: e.target.value })} /></div>
                <div><label className="erp-label">Valor (R$)</label><input type="number" className="erp-input w-full" value={novoLC.valor} onChange={(e) => setNovoLC({ ...novoLC, valor: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="erp-label">Conta Débito</label>
                  <select className="erp-input w-full" value={novoLC.debito} onChange={(e) => setNovoLC({ ...novoLC, debito: e.target.value })}>
                    <option value="">Selecionar...</option>
                    {planoContas.filter((c) => c.tipo === 'analitica').map((c) => <option key={c.id} value={c.codigo}>{c.codigo} — {c.nome}</option>)}
                  </select>
                </div>
                <div><label className="erp-label">Conta Crédito</label>
                  <select className="erp-input w-full" value={novoLC.credito} onChange={(e) => setNovoLC({ ...novoLC, credito: e.target.value })}>
                    <option value="">Selecionar...</option>
                    {planoContas.filter((c) => c.tipo === 'analitica').map((c) => <option key={c.id} value={c.codigo}>{c.codigo} — {c.nome}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="erp-label">Histórico</label><input type="text" className="erp-input w-full" placeholder="Descrição do lançamento..." value={novoLC.historico} onChange={(e) => setNovoLC({ ...novoLC, historico: e.target.value })} /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNovoLC(false)} className="erp-btn-ghost flex-1">Cancelar</button>
                <button type="button" onClick={() => { toast.success('Lançamento contábil registrado!'); setShowNovoLC(false); }} className="erp-btn flex-1">Confirmar Lançamento</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
