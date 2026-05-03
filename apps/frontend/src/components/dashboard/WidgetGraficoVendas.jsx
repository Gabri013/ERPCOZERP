import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

function formatYm(ym) {
  const [y, m] = String(ym || '').split('-');
  if (!y || !m) return String(ym || '');
  const map = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const idx = Number(m) - 1;
  return map[idx] ? map[idx] : `${m}/${y}`;
}

const fmtBRL = (v) =>
  `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

/**
 * mode:
 * - clientes — cadastros de clientes por mês (entity_records)
 * - vendas_valor — faturamento dos PVs no período (series.vendasPorMes[].total)
 * - vendas_qtd — quantidade de pedidos por mês (series.vendasPorMes[].count)
 */
export default function WidgetGraficoVendas({
  series,
  title,
  subtitle,
  mode = 'clientes',
  linkTo = '/vendas/clientes',
  linkLabel = 'Ver clientes',
}) {
  const headerTitle =
    title ||
    (mode === 'vendas_valor'
      ? 'Faturamento mensal'
      : mode === 'vendas_qtd'
        ? 'Pedidos por mês'
        : 'Novos clientes');
  const headerSub =
    subtitle ||
    (mode === 'vendas_valor'
      ? 'Valor dos seus pedidos (últimos 6 meses)'
      : mode === 'vendas_qtd'
        ? 'Quantidade de pedidos registrados'
        : 'Cadastros de clientes (últimos 6 meses)');

  let data = [];
  if (mode === 'clientes') {
    data = (series?.clientesPorMes || []).map((p) => ({
      mes: formatYm(p.ym),
      valor: Number(p.count || 0),
      meta: 0,
    }));
  } else if (mode === 'vendas_valor') {
    data = (series?.vendasPorMes || []).map((p) => ({
      mes: formatYm(p.ym),
      valor: Number(p.total || 0),
      meta: 0,
    }));
  } else if (mode === 'vendas_qtd') {
    data = (series?.vendasPorMes || []).map((p) => ({
      mes: formatYm(p.ym),
      valor: Number(p.count || 0),
      meta: 0,
    }));
  }

  const tooltipFmt =
    mode === 'vendas_valor'
      ? (v) => fmtBRL(v)
      : mode === 'vendas_qtd'
        ? (v) => `${Number(v || 0)} pedido(s)`
        : (v) => `${Number(v || 0)} cliente(s)`;

  const ChartBody =
    mode === 'vendas_qtd' ? (
      <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip formatter={(v) => tooltipFmt(v)} />
        <Bar dataKey="valor" fill="#0066cc" name={mode === 'vendas_qtd' ? 'Pedidos' : ''} radius={[2, 2, 0, 0]} />
      </BarChart>
    ) : (
      <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => tooltipFmt(v)} />
        <Area type="monotone" dataKey="valor" stroke="#0066cc" fill="#cce0ff" name={mode === 'vendas_valor' ? 'Valor' : 'Clientes'} />
      </AreaChart>
    );

  return (
    <div className="bg-white border border-border rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h3 className="text-sm font-semibold">{headerTitle}</h3>
          <p className="text-[11px] text-muted-foreground">{headerSub}</p>
        </div>
        {linkLabel ? (
          <Link to={linkTo} className="text-xs text-primary hover:underline flex items-center gap-1">
            {linkLabel} <ArrowRight size={11} />
          </Link>
        ) : null}
      </div>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {ChartBody}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
