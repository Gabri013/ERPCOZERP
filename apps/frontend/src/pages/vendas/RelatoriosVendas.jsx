import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import PageHeader from '@/components/common/PageHeader';
import { api } from '@/services/api';
import { exportPdfReport } from '@/services/pdfExport';
import { RefreshCw, TrendingUp, TrendingDown, Download, DollarSign, ShoppingCart, Users, Percent } from 'lucide-react';

const COLORS = ['#0066cc', '#3399ff', '#00aa5b', '#ff6b35', '#8b5cf6', '#ec4899'];
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

function KPICard({ label, value, sub, icon: Icon, trend, color = 'text-primary' }) {
  return (
    <div className="erp-card px-4 py-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
        <Icon size={18} className={color} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-muted-foreground truncate">{label}</div>
        <div className={`text-xl font-bold leading-tight ${color}`}>{value}</div>
        {sub && (
          <div className={`flex items-center gap-1 text-[11px] mt-0.5 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground'}`}>
            {trend === 'up' ? <TrendingUp size={10} /> : trend === 'down' ? <TrendingDown size={10} /> : null}
            <span>{sub}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RelatoriosVendas() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [aba, setAba] = useState('mensal'); // 'mensal' | 'clientes' | 'status' | 'vendedores'

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/sales/sale-orders?limit=1000');
      const data = res?.data?.data ?? res?.data ?? [];
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredByYear = useMemo(() => orders.filter((o) => {
    const y = o.createdAt ? new Date(o.createdAt).getFullYear() : 0;
    return y === ano;
  }), [orders, ano]);

  const aprovados = useMemo(() => filteredByYear.filter((o) =>
    ['APPROVED', 'DELIVERED', 'INVOICED', 'Aprovado', 'Faturado', 'Entregue'].includes(o.status)
  ), [filteredByYear]);

  // ── Vendas por mês ──────────────────────────────────────────────────────────
  const vendasMes = useMemo(() => MESES.map((mes, i) => {
    const valor = aprovados.filter((o) => new Date(o.createdAt).getMonth() === i)
      .reduce((s, o) => s + Number(o.totalAmount || 0), 0);
    const qtd = aprovados.filter((o) => new Date(o.createdAt).getMonth() === i).length;
    return { mes, valor, qtd };
  }), [aprovados]);

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalAno = aprovados.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
    const totalPedidos = aprovados.length;
    const ticketMedio = totalPedidos > 0 ? totalAno / totalPedidos : 0;

    // Mês atual
    const mesAtual = new Date().getMonth();
    const totalMesAtual = aprovados.filter((o) => new Date(o.createdAt).getMonth() === mesAtual)
      .reduce((s, o) => s + Number(o.totalAmount || 0), 0);
    const totalMesAnterior = aprovados.filter((o) => new Date(o.createdAt).getMonth() === mesAtual - 1)
      .reduce((s, o) => s + Number(o.totalAmount || 0), 0);
    const varMes = totalMesAnterior > 0 ? ((totalMesAtual - totalMesAnterior) / totalMesAnterior) * 100 : 0;

    return { totalAno, totalPedidos, ticketMedio, totalMesAtual, varMes };
  }, [aprovados]);

  // ── Top clientes ────────────────────────────────────────────────────────────
  const topClientes = useMemo(() => {
    const map = {};
    aprovados.forEach((o) => {
      const nome = o.customer?.name || o.customerName || 'Sem nome';
      map[nome] = (map[nome] || 0) + Number(o.totalAmount || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([nome, valor]) => ({ nome, valor }));
  }, [aprovados]);

  // ── Por status ──────────────────────────────────────────────────────────────
  const pieData = useMemo(() => {
    const map = {};
    filteredByYear.forEach((o) => { map[o.status] = (map[o.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredByYear]);

  // ── Por vendedor ─────────────────────────────────────────────────────────────
  const porVendedor = useMemo(() => {
    const map = {};
    aprovados.forEach((o) => {
      const v = o.salesRepName || o.vendedor || 'N/D';
      if (!map[v]) map[v] = { vendedor: v, total: 0, qtd: 0 };
      map[v].total += Number(o.totalAmount || 0);
      map[v].qtd += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [aprovados]);

  const anosDisponiveis = useMemo(() => {
    const years = new Set(orders.map((o) => o.createdAt ? new Date(o.createdAt).getFullYear() : 0).filter((y) => y > 2000));
    const sorted = [...years].sort((a, b) => b - a);
    if (!sorted.includes(new Date().getFullYear())) sorted.unshift(new Date().getFullYear());
    return sorted;
  }, [orders]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Relatórios de Vendas"
        breadcrumbs={['Início', 'Vendas', 'Relatórios']}
        actions={
          <div className="flex items-center gap-2">
            <select
              className="h-8 px-2 text-xs border border-border rounded-md bg-white outline-none"
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
            >
              {anosDisponiveis.map((y) => <option key={y}>{y}</option>)}
            </select>
            <button type="button" onClick={load} disabled={loading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-border rounded hover:bg-muted disabled:opacity-50">
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Atualizar
            </button>
            <button type="button"
              onClick={() => exportPdfReport({
                title: `Relatório de Vendas ${ano}`, subtitle: `Período: ${ano}`, filename: `relatorio-vendas-${ano}.pdf`,
                table: { headers: ['Mês', 'Qtd. Pedidos', 'Valor'], rows: vendasMes.map((m) => [m.mes, String(m.qtd), fmtBRL(m.valor)]) },
              })}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-border rounded hover:bg-muted">
              <Download size={12} /> Exportar
            </button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard
          label={`Faturamento ${ano}`}
          value={loading ? '…' : fmtBRL(kpis.totalAno)}
          sub={`${kpis.totalPedidos} pedidos aprovados`}
          icon={DollarSign} trend={kpis.totalAno > 0 ? 'up' : undefined} color="text-primary"
        />
        <KPICard
          label="Faturamento do Mês"
          value={loading ? '…' : fmtBRL(kpis.totalMesAtual)}
          sub={kpis.varMes !== 0 ? `${kpis.varMes > 0 ? '+' : ''}${kpis.varMes.toFixed(1)}% vs mês ant.` : 'Sem comparação'}
          icon={TrendingUp} trend={kpis.varMes > 0 ? 'up' : kpis.varMes < 0 ? 'down' : undefined} color="text-indigo-600"
        />
        <KPICard
          label="Ticket Médio"
          value={loading ? '…' : fmtBRL(kpis.ticketMedio)}
          sub="por pedido aprovado"
          icon={Percent} color="text-orange-500"
        />
        <KPICard
          label="Pedidos no Ano"
          value={loading ? '…' : String(kpis.totalPedidos)}
          sub={`${filteredByYear.length} registrados em ${ano}`}
          icon={ShoppingCart} color="text-foreground"
        />
      </div>

      {/* Abas de gráficos */}
      <div className="flex gap-0 border-b border-border">
        {[
          { id: 'mensal', label: 'Evolução Mensal' },
          { id: 'clientes', label: 'Top Clientes' },
          { id: 'status', label: 'Por Status' },
          { id: 'vendedores', label: 'Por Vendedor' },
        ].map((t) => (
          <button key={t.id} type="button" onClick={() => setAba(t.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${aba === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {aba === 'mensal' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="erp-card p-4">
            <h3 className="text-sm font-semibold mb-3">Faturamento Mensal — {ano}</h3>
            {loading ? <div className="h-52 flex items-center justify-center text-xs text-muted-foreground">Carregando…</div> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={vendasMes} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => fmtBRL(v)} />
                  <Bar dataKey="valor" fill="#0066cc" name="Faturamento" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="erp-card p-4">
            <h3 className="text-sm font-semibold mb-3">Quantidade de Pedidos — {ano}</h3>
            {loading ? <div className="h-52 flex items-center justify-center text-xs text-muted-foreground">Carregando…</div> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={vendasMes} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="qtd" stroke="#00aa5b" name="Pedidos" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {aba === 'clientes' && (
        <div className="erp-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Top Clientes — {ano}</h3>
          </div>
          {loading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">Carregando…</div>
          ) : topClientes.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">Sem dados para {ano}.</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  {['#', 'Cliente', 'Faturamento', 'Participação'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase text-[11px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topClientes.map((c, i) => {
                  const totalAno = kpis.totalAno;
                  const pct = totalAno > 0 ? (c.valor / totalAno * 100) : 0;
                  return (
                    <tr key={i} className="border-b border-border hover:bg-muted/20 last:border-0">
                      <td className="px-4 py-2.5 font-bold text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium">{c.nome}</td>
                      <td className="px-4 py-2.5 font-bold text-primary">{fmtBRL(c.valor)}</td>
                      <td className="px-4 py-2.5 w-40">
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
            </table>
          )}
        </div>
      )}

      {aba === 'status' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="erp-card p-4">
            <h3 className="text-sm font-semibold mb-3">Pedidos por Status — {ano}</h3>
            {loading ? <div className="h-52 flex items-center justify-center text-xs text-muted-foreground">Carregando…</div> : (
              pieData.length === 0
                ? <div className="h-52 flex items-center justify-center text-xs text-muted-foreground">Sem dados para {ano}</div>
                : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${value}`} labelLine={false}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )
            )}
          </div>
          <div className="erp-card p-4">
            <h3 className="text-sm font-semibold mb-3">Resumo por Status</h3>
            <div className="space-y-2">
              {pieData.sort((a, b) => b.value - a.value).map((s, i) => (
                <div key={s.name} className="flex items-center justify-between text-xs py-1 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span>{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{s.value}</span>
                    <span className="text-muted-foreground">
                      {filteredByYear.length > 0 ? `${((s.value / filteredByYear.length) * 100).toFixed(0)}%` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {aba === 'vendedores' && (
        <div className="erp-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Desempenho por Vendedor — {ano}</h3>
          </div>
          {loading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">Carregando…</div>
          ) : porVendedor.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">Sem dados de vendedores para {ano}.</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  {['Vendedor', 'Qtd. Pedidos', 'Faturamento', 'Ticket Médio', 'Participação'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase text-[11px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {porVendedor.map((v, i) => {
                  const totalAno = kpis.totalAno;
                  const pct = totalAno > 0 ? (v.total / totalAno * 100) : 0;
                  const ticket = v.qtd > 0 ? v.total / v.qtd : 0;
                  return (
                    <tr key={v.vendedor} className="border-b border-border hover:bg-muted/20 last:border-0">
                      <td className="px-4 py-2.5 font-medium">{v.vendedor}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{v.qtd}</td>
                      <td className="px-4 py-2.5 font-bold text-primary">{fmtBRL(v.total)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{fmtBRL(ticket)}</td>
                      <td className="px-4 py-2.5 w-32">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-1.5">
                            <div className="h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length], width: `${pct.toFixed(0)}%` }} />
                          </div>
                          <span className="text-muted-foreground w-8 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
