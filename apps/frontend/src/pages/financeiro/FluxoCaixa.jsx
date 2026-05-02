import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import PageHeader from '@/components/common/PageHeader';
import { api } from '@/services/api';

async function fetchCashflow(from, to) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const res = await api.get(`/api/financial/cashflow?${params.toString()}`);
  if (!res?.data?.success) throw new Error('Resposta inválida');
  return res.data.data;
}

export default function FluxoCaixa() {
  const [periodo, setPeriodo] = useState('2026-04');
  const from = `${periodo}-01`;
  const toDate = new Date(from);
  toDate.setMonth(toDate.getMonth() + 1);
  toDate.setDate(0);
  const to = toDate.toISOString().slice(0, 10);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['financial-cashflow', from, to],
    queryFn: () => fetchCashflow(from, to),
  });

  const rows = data?.rows || [];
  const fluxo = useMemo(() => {
    const byDay = {};
    for (const r of rows) {
      const d = String(r.date || '').slice(0, 10);
      if (!d) continue;
      if (!byDay[d]) {
        byDay[d] = {
          data: `${d.slice(8, 10)}/${d.slice(5, 7)}`,
          entradas: 0,
          saidas: 0,
        };
      }
      if (r.tipo === 'ENTRADA') byDay[d].entradas += Number(r.valor || 0);
      else byDay[d].saidas += Number(r.valor || 0);
    }
    const keys = Object.keys(byDay).sort();
    let run = 0;
    return keys.map((k) => {
      const x = byDay[k];
      run += x.entradas - x.saidas;
      return { data: x.data, entradas: x.entradas, saidas: x.saidas, saldo: run };
    });
  }, [rows]);

  const totais = useMemo(() => {
    let ent = 0;
    let sai = 0;
    for (const r of rows) {
      if (r.tipo === 'ENTRADA') ent += Number(r.valor || 0);
      else sai += Number(r.valor || 0);
    }
    return { ent, sai, saldo: ent - sai };
  }, [rows]);

  return (
    <div>
      <PageHeader
        title="Fluxo de Caixa"
        breadcrumbs={['Início', 'Financeiro', 'Fluxo de Caixa']}
        actions={(
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="rounded border border-border bg-white px-2 py-1.5 text-xs outline-none"
          >
            <option value="2026-04">Abril 2026</option>
            <option value="2026-05">Maio 2026</option>
            <option value="2026-03">Março 2026</option>
          </select>
        )}
      />

      {isError && (
        <p className="mb-3 text-sm text-destructive">Não foi possível carregar o fluxo de caixa.</p>
      )}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: 'Entradas (período)', val: totais.ent, color: 'text-success', bg: 'bg-green-50 border-green-200' },
              { label: 'Saídas (período)', val: totais.sai, color: 'text-destructive', bg: 'bg-red-50 border-red-200' },
              { label: 'Saldo acumulado (aprox.)', val: totais.saldo, color: 'text-primary', bg: 'bg-blue-50 border-blue-200' },
            ].map((k) => (
              <div key={k.label} className={`rounded border px-4 py-3 ${k.bg}`}>
                <p className="mb-1 text-[11px] text-muted-foreground">{k.label}</p>
                <p className={`text-xl font-bold ${k.color}`}>
                  R$ {k.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold">Entradas x Saídas</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={fluxo.length ? fluxo : [{ data: '—', entradas: 0, saidas: 0 }]} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="data" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => `R$ ${Number(v).toLocaleString('pt-BR')}`} />
                  <Bar dataKey="entradas" fill="#22c55e" name="Entradas" radius={2} />
                  <Bar dataKey="saidas" fill="#ef4444" name="Saídas" radius={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border border-border bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold">Saldo acumulado</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={fluxo.length ? fluxo : [{ data: '—', saldo: 0 }]} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="data" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => `R$ ${Number(v).toLocaleString('pt-BR')}`} />
                  <Line type="monotone" dataKey="saldo" stroke="#0066cc" strokeWidth={2} dot={{ r: 3 }} name="Saldo" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-2 rounded-lg border border-border bg-white">
              <div className="border-b border-border px-4 py-2.5">
                <h3 className="text-sm font-semibold">Lançamentos</h3>
              </div>
              <div className="max-h-64 overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Data</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Tipo</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Descrição</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 80).map((r, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-3 py-2">{String(r.date || '').slice(0, 10)}</td>
                        <td className="px-3 py-2">{r.tipo}</td>
                        <td className="px-3 py-2">{r.desc}</td>
                        <td className={`px-3 py-2 text-right font-medium ${r.tipo === 'ENTRADA' ? 'text-success' : 'text-destructive'}`}>
                          R$ {Number(r.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length === 0 && (
                  <p className="p-4 text-center text-xs text-muted-foreground">Sem lançamentos conciliados no período.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
