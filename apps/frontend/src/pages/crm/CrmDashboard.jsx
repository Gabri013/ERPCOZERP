import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { api } from '@/services/api';

export default function CrmDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/api/crm/dashboard');
        const body = res?.data;
        if (mounted && body?.success) setData(body.data);
      } catch {
        if (mounted) setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <PageHeader title="CRM — Dashboard" breadcrumbs={['Início', 'CRM', 'Dashboard']} />
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border p-4">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Leads</p>
            <p className="text-2xl font-bold">{data?.counts?.leads ?? '—'}</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Oportunidades</p>
            <p className="text-2xl font-bold">{data?.counts?.opportunities ?? '—'}</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Atividades</p>
            <p className="text-2xl font-bold">{data?.counts?.activities ?? '—'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
