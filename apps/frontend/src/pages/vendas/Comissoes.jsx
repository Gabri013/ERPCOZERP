import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Download, RefreshCw, DollarSign, TrendingUp, Users, Percent } from 'lucide-react';
import { api } from '@/services/api';
import { exportPdfReport } from '@/services/pdfExport';
import { toast } from 'sonner';

const fmtR = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const fmtD = (v) => v ? new Date(v).toLocaleDateString('pt-BR') : '—';
const fmtPct = (v) => `${Number(v || 0).toFixed(1)}%`;

// Percentuais padrão por perfil de vendedor
const PERC_COMISSAO_PADRAO = {
  'Representante': 5.0,
  'Vendedor Interno': 2.5,
  'Gerente Comercial': 1.0,
};

// Meses para filtro
const MESES_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function Comissoes() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filtroVendedor, setFiltroVendedor] = useState('');
  const [percComissao, setPercComissao] = useState(3.0);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/sales/sale-orders?limit=500');
      const rows = res?.data?.data ?? res?.data ?? [];
      setPedidos(Array.isArray(rows) ? rows : []);
    } catch {
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Filtra pedidos pelo período selecionado
  const pedidosFiltrados = useMemo(() => {
    const [ano, mes] = periodo.split('-').map(Number);
    return pedidos.filter((p) => {
      const d = new Date(p.createdAt || p.orderDate || p.data_emissao || '');
      if (!d) return false;
      const match = d.getFullYear() === ano && d.getMonth() + 1 === mes;
      const statusOk = ['APPROVED', 'DELIVERED', 'INVOICED', 'Aprovado', 'Faturado', 'Entregue'].includes(p.status);
      return match && statusOk;
    });
  }, [pedidos, periodo]);

  // Vendedores únicos
  const vendedores = useMemo(() => {
    const v = new Set(pedidos.map((p) => p.salesRepName || p.vendedor || p.seller || '').filter(Boolean));
    return [...v];
  }, [pedidos]);

  // Linhas de comissão
  const linhasComissao = useMemo(() => {
    return pedidosFiltrados
      .filter((p) => !filtroVendedor || (p.salesRepName || p.vendedor || '') === filtroVendedor)
      .map((p) => {
        const vendedor = p.salesRepName || p.vendedor || p.seller || 'N/D';
        const valor = Number(p.totalAmount || p.valor_total || 0);
        const pct = Number(p.commissionPct || percComissao);
        const comissao = valor * (pct / 100);
        return {
          id: p.id,
          tipo: 'Pedido de Venda',
          data: p.createdAt || p.orderDate || p.data_emissao,
          numero: p.number || p.numero,
          cliente: p.customer?.name || p.cliente_nome || '—',
          vendedor,
          valor,
          pct_comissao: pct,
          valor_comissao: comissao,
          status: p.status,
        };
      });
  }, [pedidosFiltrados, filtroVendedor, percComissao]);

  // KPIs do período
  const kpis = useMemo(() => {
    const totalVendas = linhasComissao.reduce((s, l) => s + l.valor, 0);
    const totalComissao = linhasComissao.reduce((s, l) => s + l.valor_comissao, 0);
    const qtdPedidos = linhasComissao.length;
    const qtdVendedores = new Set(linhasComissao.map((l) => l.vendedor)).size;
    return { totalVendas, totalComissao, qtdPedidos, qtdVendedores };
  }, [linhasComissao]);

  // Resumo por vendedor
  const porVendedor = useMemo(() => {
    const map = {};
    for (const l of linhasComissao) {
      if (!map[l.vendedor]) map[l.vendedor] = { vendedor: l.vendedor, totalVendas: 0, totalComissao: 0, qtd: 0, pct: l.pct_comissao };
      map[l.vendedor].totalVendas += l.valor;
      map[l.vendedor].totalComissao += l.valor_comissao;
      map[l.vendedor].qtd += 1;
    }
    return Object.values(map).sort((a, b) => b.totalComissao - a.totalComissao);
  }, [linhasComissao]);

  const [aba, setAba] = useState('registros'); // 'registros' | 'resumo'

  const handleExport = () => {
    exportPdfReport({
      title: 'Apuração de Comissões',
      subtitle: `Período: ${MESES_LABELS[Number(periodo.split('-')[1]) - 1]}/${periodo.split('-')[0]}`,
      filename: `comissoes-${periodo}.pdf`,
      table: {
        headers: ['Tipo', 'Data', 'Nº Pedido', 'Cliente', 'Vendedor', 'Valor Venda', '% Comissão', 'Comissão'],
        rows: linhasComissao.map((l) => [
          l.tipo, fmtD(l.data), l.numero, l.cliente, l.vendedor,
          fmtR(l.valor), fmtPct(l.pct_comissao), fmtR(l.valor_comissao),
        ]),
      },
    });
  };

  const columns = [
    { key: 'tipo', label: 'Tipo', width: 130 },
    { key: 'data', label: 'Data', width: 90, render: fmtD },
    { key: 'numero', label: 'Nº Pedido', width: 120, render: (v) => <span className="font-medium text-primary">{v}</span> },
    { key: 'cliente', label: 'Cliente' },
    { key: 'vendedor', label: 'Vendedor', width: 130 },
    { key: 'valor', label: 'Valor Venda', width: 120, render: fmtR },
    { key: 'pct_comissao', label: '% Com.', width: 70, render: (v) => <span className="font-medium text-indigo-600">{fmtPct(v)}</span> },
    { key: 'valor_comissao', label: 'Comissão', width: 110, render: (v) => <span className="font-bold text-green-600">{fmtR(v)}</span> },
    {
      key: 'status', label: 'Status', width: 90,
      render: (v) => (
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${['APPROVED','Aprovado'].includes(v) ? 'bg-green-100 text-green-700' : ['DELIVERED','Entregue'].includes(v) ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'}`}>
          {v}
        </span>
      ),
      sortable: false,
    },
  ];

  const [anoAtual] = useState(new Date().getFullYear());
  const mesesOpcoes = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    return { value: `${anoAtual}-${m}`, label: `${MESES_LABELS[i]}/${anoAtual}` };
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Comissões de Venda"
        breadcrumbs={['Início', 'Vendas', 'Comissões']}
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"
            >
              <Download size={12} /> Exportar PDF
            </button>
          </div>
        }
      />

      {/* Filtros do período */}
      <div className="erp-card p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Parâmetros de Apuração</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Período</label>
            <select
              className="h-8 px-2 text-xs border border-border rounded-md bg-background outline-none focus:ring-1 focus:ring-primary"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
            >
              {mesesOpcoes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Vendedor</label>
            <select
              className="h-8 px-2 text-xs border border-border rounded-md bg-background outline-none"
              value={filtroVendedor}
              onChange={(e) => setFiltroVendedor(e.target.value)}
            >
              <option value="">Todos</option>
              {vendedores.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">% Comissão padrão</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="h-8 w-20 px-2 text-xs border border-border rounded-md bg-background outline-none"
                value={percComissao}
                onChange={(e) => setPercComissao(Number(e.target.value))}
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            {Object.entries(PERC_COMISSAO_PADRAO).map(([label, pct]) => (
              <button
                key={label}
                type="button"
                onClick={() => setPercComissao(pct)}
                className={`px-2 py-1 text-[11px] rounded border transition-colors ${percComissao === pct ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted text-muted-foreground'}`}
              >
                {label} ({pct}%)
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Vendas no Período', value: fmtR(kpis.totalVendas), icon: DollarSign, color: 'text-primary' },
          { label: 'Total de Comissões', value: fmtR(kpis.totalComissao), icon: Percent, color: 'text-green-600' },
          { label: 'Pedidos Comissionáveis', value: kpis.qtdPedidos, icon: TrendingUp, color: 'text-foreground' },
          { label: 'Vendedores', value: kpis.qtdVendedores, icon: Users, color: 'text-indigo-600' },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="erp-card px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Icon size={16} className={k.color} />
              </div>
              <div>
                <div className={`text-lg font-bold leading-tight ${k.color}`}>{k.value}</div>
                <div className="text-[11px] text-muted-foreground">{k.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Abas */}
      <div className="flex gap-1 border-b border-border">
        {[
          { id: 'registros', label: 'Registros de Comissão' },
          { id: 'resumo', label: 'Resumo por Vendedor' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setAba(t.id)}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${aba === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {aba === 'registros' && (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <DataTable columns={columns} data={linhasComissao} loading={loading} />
        </div>
      )}

      {aba === 'resumo' && (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Vendedor', 'Pedidos', 'Total Vendas', '% Comissão', 'Total Comissão', 'Participação'].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wide text-[11px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {porVendedor.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Sem dados para o período selecionado</td></tr>
              )}
              {porVendedor.map((v) => {
                const pct = kpis.totalVendas > 0 ? (v.totalVendas / kpis.totalVendas) * 100 : 0;
                return (
                  <tr key={v.vendedor} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-medium">{v.vendedor}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{v.qtd}</td>
                    <td className="px-4 py-2.5 font-medium">{fmtR(v.totalVendas)}</td>
                    <td className="px-4 py-2.5 text-indigo-600">{fmtPct(v.pct)}</td>
                    <td className="px-4 py-2.5 font-bold text-green-600">{fmtR(v.totalComissao)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-1.5">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct.toFixed(0)}%` }} />
                        </div>
                        <span className="text-muted-foreground w-8 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {porVendedor.length > 0 && (
              <tfoot className="border-t-2 border-border bg-muted/30">
                <tr>
                  <td className="px-4 py-2.5 font-bold">TOTAL</td>
                  <td className="px-4 py-2.5 font-bold">{kpis.qtdPedidos}</td>
                  <td className="px-4 py-2.5 font-bold">{fmtR(kpis.totalVendas)}</td>
                  <td className="px-4 py-2.5" />
                  <td className="px-4 py-2.5 font-bold text-green-600">{fmtR(kpis.totalComissao)}</td>
                  <td className="px-4 py-2.5 font-bold">100%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
