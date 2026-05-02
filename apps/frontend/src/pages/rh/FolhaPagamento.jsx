import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Download } from 'lucide-react';
import { exportPdfReport } from '@/services/pdfExport';
import { api } from '@/services/api';
import { toast } from 'sonner';

const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function FolhaPagamento() {
  const [competencia, setCompetencia] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(true);
  const [run, setRun] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get(`/api/hr/payroll/${competencia}`);
      setRun(res?.data?.data || null);
    } catch {
      setRun(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [competencia]);

  const rows = useMemo(() => {
    const lines = run?.lines || [];
    return lines.map((ln) => ({
      id: ln.id,
      nome: ln.employee?.fullName || '—',
      matricula: ln.employee?.code || '—',
      cargo: ln.employee?.department || '—',
      salario_base: Number(ln.gross ?? 0),
      horas_extras: null,
      descontos: Number(ln.inss ?? 0) + Number(ln.irrf ?? 0),
      liquido: Number(ln.net ?? 0),
    }));
  }, [run]);

  const filtered = rows;

  const calcular = async () => {
    try {
      await api.post('/api/hr/payroll/calculate', { month: competencia });
      toast.success('Folha calculada.');
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || 'Erro ao calcular.');
    }
  };

  const total = useMemo(() => filtered.reduce((s, m) => s + Number(m.liquido || 0), 0), [filtered]);

  const columns = [
    { key: 'nome', label: 'Funcionário' },
    { key: 'matricula', label: 'Matrícula', width: 90 },
    { key: 'cargo', label: 'Cargo', width: 160 },
    { key: 'salario_base', label: 'Salário Base', width: 110, render: fmt },
    { key: 'horas_extras', label: 'Extras', width: 90, render: (v) => (v ? fmt(v) : '—') },
    {
      key: 'descontos',
      label: 'Descontos',
      width: 100,
      render: (v) => <span className="text-destructive">{fmt(v)}</span>,
    },
    { key: 'liquido', label: 'Líquido', width: 110, render: (v) => <span className="font-bold text-success">{fmt(v)}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Folha de Pagamento"
        breadcrumbs={['Início', 'RH', 'Folha de Pagamento']}
        actions={(
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                exportPdfReport({
                  title: 'Folha de Pagamento',
                  subtitle: `Competência ${competencia}`,
                  filename: 'folha-pagamento.pdf',
                  table: {
                    headers: ['Funcionário', 'Matrícula', 'Cargo', 'Bruto', 'Descontos', 'Líquido'],
                    rows: filtered.map((registro) => [
                      registro.nome,
                      registro.matricula,
                      registro.cargo,
                      fmt(registro.salario_base),
                      fmt(registro.descontos),
                      fmt(registro.liquido),
                    ]),
                  },
                })}
              className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs hover:bg-muted"
            >
              <Download size={13} /> Exportar PDF
            </button>
            <button type="button" onClick={calcular} className="rounded px-3 py-1.5 text-xs cozinha-blue-bg text-white hover:opacity-90">
              Calcular folha
            </button>
            <input
              type="month"
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
              className="rounded border border-border bg-white px-2 py-1.5 text-xs outline-none"
            />
          </div>
        )}
      />
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            label: 'Total bruto',
            val: fmt(filtered.reduce((s, m) => s + Number(m.salario_base || 0), 0)),
            color: 'text-foreground',
          },
          {
            label: 'Total descontos',
            val: fmt(filtered.reduce((s, m) => s + Number(m.descontos || 0), 0)),
            color: 'text-destructive',
          },
          { label: 'Total líquido', val: fmt(total), color: 'text-success' },
        ].map((k) => (
          <div key={k.label} className="rounded border border-border bg-white px-4 py-3">
            <div className={`text-lg font-bold ${k.color}`}>{k.val}</div>
            <div className="text-[11px] text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <DataTable columns={columns} data={filtered} loading={loading} />
      </div>
      {!loading && !filtered.length && (
        <p className="mt-3 text-xs text-muted-foreground">Nenhuma linha nesta competência. Use Calcular folha.</p>
      )}
    </div>
  );
}
