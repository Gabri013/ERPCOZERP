import { useState, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, DollarSign, ArrowUpCircle, ArrowDownCircle, Calendar } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { getFluxoCaixaProjetado, getSaldoFinanceiro } from '@/services/businessLogic';
import { storage } from '@/services/storage';

const fmtR = v => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

function KpiCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="bg-white border border-border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
          <p className={`text-lg font-bold ${color}`}>{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color === 'text-success' ? 'bg-green-100' : color === 'text-destructive' ? 'bg-red-100' : 'bg-blue-100'}`}>
          <Icon size={15} className={color} />
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded shadow-lg p-3 text-xs">
      <div className="font-medium mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{fmtR(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function RelatorioFinanceiro() {
  const [horizonte, setHorizonte] = useState(30);

  const fluxo = useMemo(() => getFluxoCaixaProjetado(horizonte), [horizonte]);
  const saldo = useMemo(() => getSaldoFinanceiro(), []);

  // Agrupa por semana para gráfico de barras (quando horizonte = 30)
  const dadosGrafico = useMemo(() => {
    if (horizonte <= 15) return fluxo.filter((_, i) => i % 1 === 0);
    // Agrupa de 3 em 3 dias para não poluir o eixo X
    return fluxo.filter((_, i) => i % 3 === 0);
  }, [fluxo, horizonte]);

  const totalEntradas = fluxo.reduce((s, d) => s + d.entradas, 0);
  const totalSaidas = fluxo.reduce((s, d) => s + d.saidas, 0);
  const saldoFinal = fluxo[fluxo.length - 1]?.saldo || 0;

  // Contas vencendo nos próximos 7 dias
  const receber = storage.get('contas_receber', []);
  const pagar = storage.get('contas_pagar', []);
  const hoje = new Date().toISOString().slice(0, 10);
  const em7dias = new Date(); em7dias.setDate(em7dias.getDate() + 7);
  const em7str = em7dias.toISOString().slice(0, 10);

  const vencendoReceber = receber.filter(c => c.status === 'Aberto' && c.data_vencimento >= hoje && c.data_vencimento <= em7str);
  const vencendoPagar = pagar.filter(c => c.status === 'Aberto' && c.data_vencimento >= hoje && c.data_vencimento <= em7str);

  return (
    <div>
      <PageHeader
        title="Relatório Financeiro"
        subtitle={`Fluxo de Caixa Projetado — próximos ${horizonte} dias`}
        breadcrumbs={['Início', 'Financeiro', 'Relatório Financeiro']}
        actions={
          <div className="flex items-center gap-2">
            <Calendar size={13} className="text-muted-foreground" />
            <select
              className="text-xs border border-border rounded px-2 py-1.5 bg-white outline-none"
              value={horizonte}
              onChange={e => setHorizonte(Number(e.target.value))}
            >
              <option value={7}>7 dias</option>
              <option value={15}>15 dias</option>
              <option value={30}>30 dias</option>
              <option value={60}>60 dias</option>
            </select>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Total a Receber (em aberto)" value={fmtR(saldo.totalReceber)} color="text-success" icon={ArrowUpCircle} sub="Aberto + Vencido" />
        <KpiCard label="Total a Pagar (em aberto)" value={fmtR(saldo.totalPagar)} color="text-destructive" icon={ArrowDownCircle} sub="Aberto + Vencido" />
        <KpiCard label={`Entradas (${horizonte}d)`} value={fmtR(totalEntradas)} color="text-blue-600" icon={TrendingUp} sub="Vencimentos no período" />
        <KpiCard label={`Saldo Projetado (${horizonte}d)`} value={fmtR(saldoFinal)} color={saldoFinal >= 0 ? 'text-success' : 'text-destructive'} icon={DollarSign} sub="Acumulado ao final do período" />
      </div>

      {/* Gráfico área — saldo acumulado */}
      <div className="bg-white border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">Fluxo de Caixa Projetado</h3>
            <p className="text-[11px] text-muted-foreground">Entradas, Saídas e Saldo Acumulado (R$)</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dadosGrafico} margin={{ top: 0, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
            <Bar dataKey="entradas" name="Entradas" fill="#22c55e" radius={[2, 2, 0, 0]} />
            <Bar dataKey="saidas" name="Saídas" fill="#ef4444" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Saldo acumulado */}
      <div className="bg-white border border-border rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold mb-3">Saldo Acumulado</h3>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={dadosGrafico} margin={{ top: 0, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
            <Area type="monotone" dataKey="saldo" name="Saldo" stroke="#0066cc" fill="#cce0ff" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Vencimentos próximos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* A Receber nos próx 7 dias */}
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-green-700">↑ A Receber — próximos 7 dias</h3>
            <span className="text-xs font-bold text-green-700">{fmtR(vencendoReceber.reduce((s, c) => s + c.valor, 0))}</span>
          </div>
          {vencendoReceber.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhum vencimento nos próximos 7 dias</p>
          ) : (
            <table className="w-full text-xs">
              <thead><tr className="bg-muted border-b border-border">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Descrição</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Vencimento</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Valor</th>
              </tr></thead>
              <tbody>
                {vencendoReceber.map(c => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 truncate max-w-[160px]">{c.descricao}</td>
                    <td className="px-3 py-2">{new Date(c.data_vencimento + 'T00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="px-3 py-2 text-right font-medium text-green-700">{fmtR(c.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* A Pagar nos próx 7 dias */}
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-red-700">↓ A Pagar — próximos 7 dias</h3>
            <span className="text-xs font-bold text-red-700">{fmtR(vencendoPagar.reduce((s, c) => s + c.valor, 0))}</span>
          </div>
          {vencendoPagar.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhum vencimento nos próximos 7 dias</p>
          ) : (
            <table className="w-full text-xs">
              <thead><tr className="bg-muted border-b border-border">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Descrição</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Vencimento</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Valor</th>
              </tr></thead>
              <tbody>
                {vencendoPagar.map(c => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 truncate max-w-[160px]">{c.descricao}</td>
                    <td className="px-3 py-2">{new Date(c.data_vencimento + 'T00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="px-3 py-2 text-right font-medium text-red-700">{fmtR(c.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}