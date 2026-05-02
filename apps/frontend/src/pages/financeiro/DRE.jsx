import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/services/api';

async function fetchDre(from, to) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const res = await api.get(`/api/financial/dre?${params.toString()}`);
  if (!res?.data?.success) throw new Error('Resposta inválida');
  return res.data.data;
}

export default function DRE() {
  const [periodo, setPeriodo] = useState('2026-03');
  const from = `${periodo}-01`;
  const end = new Date(from);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  const to = end.toISOString().slice(0, 10);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['financial-dre', from, to],
    queryFn: () => fetchDre(from, to),
  });

  const receita = Number(data?.receita ?? 0);
  const despesa = Number(data?.despesa ?? 0);
  const resultado = Number(data?.resultado ?? receita - despesa);

  const grafico = [
    { label: 'Receitas', val: receita },
    { label: 'Despesas', val: despesa },
    { label: 'Resultado', val: resultado },
  ];

  return (
    <div>
      <PageHeader
        title="DRE — Demonstração do Resultado"
        breadcrumbs={['Início', 'Financeiro', 'DRE']}
        actions={(
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="rounded border border-border bg-white px-2 py-1.5 text-xs outline-none"
          >
            <option value="2026-03">Março 2026</option>
            <option value="2026-04">Abril 2026</option>
            <option value="2026-05">Maio 2026</option>
          </select>
        )}
      />

      {isError && <p className="mb-3 text-sm text-destructive">Erro ao carregar DRE.</p>}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold">Resumo (lançamentos conciliados)</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between rounded bg-muted/50 px-2 py-2">
                <span>Receitas</span>
                <span className="font-semibold text-success">
                  R$ {receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between rounded px-2 py-2">
                <span>Despesas</span>
                <span className="font-semibold text-destructive">
                  R$ {despesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-bold">
                <span>Resultado</span>
                <span className={resultado >= 0 ? 'text-success' : 'text-destructive'}>
                  R$ {resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold">Visão gráfica</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={grafico} margin={{ top: 0, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => `R$ ${Number(v).toLocaleString('pt-BR')}`} />
                <Bar dataKey="val" fill="#0066cc" radius={4} name="Valor" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
