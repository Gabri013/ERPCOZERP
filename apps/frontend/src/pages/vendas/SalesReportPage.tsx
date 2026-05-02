// @ts-nocheck — Recharts + PageHeader JSX
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { Loader2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { salesReportSummary } from '@/services/salesApi';

export default function SalesReportPage() {
  const q = useQuery({
    queryKey: ['sales-report-summary'],
    queryFn: salesReportSummary,
  });

  const chartData = (q.data?.monthly ?? []).map((m) => ({
    name: m.month,
    valor: Math.round(m.value * 100) / 100,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Relatório de vendas" subtitle="" breadcrumbs={['Início', 'Vendas', 'Relatórios']} actions={null} />
      {q.isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border p-4">
              <div className="text-xs text-muted-foreground">Receita (pedidos)</div>
              <div className="text-2xl font-semibold">
                R$ {(q.data?.totalRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-xs text-muted-foreground">Pedidos</div>
              <div className="text-2xl font-semibold">{q.data?.orderCount ?? 0}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-xs text-muted-foreground">Status (distintos)</div>
              <div className="text-sm">
                {Object.entries(q.data?.byStatus ?? {}).map(([k, v]) => (
                  <div key={k}>
                    {k}: {v}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="h-[320px] w-full rounded-lg border p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number) => [`R$ ${v.toFixed(2)}`, 'Valor']}
                  labelFormatter={(l) => `Mês ${l}`}
                />
                <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
