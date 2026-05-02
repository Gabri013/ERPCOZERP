import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Search } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';

const statusCor = { Autorizada: 'bg-green-100 text-green-700', Cancelada: 'bg-red-100 text-red-700' };

export default function NFeConsulta() {
  const [chave, setChave] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consultResult, setConsultResult] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/fiscal/nfes');
        const rows = Array.isArray(res?.data?.data) ? res.data.data : [];
        if (mounted) setData(rows);
      } catch {
        if (mounted) setData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const cards = useMemo(() => {
    return data.slice(0, 50).map((n) => ({
      id: n.id,
      chave: n.accessKey || '',
      numero: n.number || '—',
      destinatario: n.customerName || '—',
      emissao: n.issuedAt ? new Date(n.issuedAt).toLocaleDateString('pt-BR') : '—',
      valor: `R$ ${Number(n.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      status: n.status === 'AUTORIZADA' ? 'Autorizada' : n.status === 'CANCELADA' ? 'Cancelada' : n.status || '—',
    }));
  }, [data]);

  const consultar = async () => {
    const k = chave.trim();
    if (k.length < 10) {
      toast.error('Informe uma chave de acesso válida.');
      return;
    }
    try {
      const res = await api.get(`/api/fiscal/nfes/consult/${encodeURIComponent(k)}`);
      setConsultResult(res?.data?.data || null);
      if (!res?.data?.data) toast.info('NF-e não encontrada para esta chave.');
    } catch {
      setConsultResult(null);
      toast.error('Consulta falhou.');
    }
  };

  return (
    <div>
      <PageHeader title="Consulta NF-e" breadcrumbs={['Início', 'Fiscal', 'NF-e Consulta']} />
      <div className="mb-4 rounded-lg border border-border bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex max-w-xl flex-1 items-center gap-2 rounded bg-muted px-3 py-2">
            <Search size={13} className="shrink-0 text-muted-foreground" />
            <input
              value={chave}
              onChange={(e) => setChave(e.target.value)}
              placeholder="Chave de acesso (44 dígitos)…"
              className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button type="button" onClick={consultar} className="rounded px-4 py-2 text-xs cozinha-blue-bg text-white hover:opacity-90">
            Consultar
          </button>
        </div>
        {consultResult && (
          <div className="mt-3 rounded border border-border p-3 text-xs">
            <p className="font-semibold">{consultResult.customerName}</p>
            <p className="text-muted-foreground">
              Nº {consultResult.number} · R$ {Number(consultResult.totalAmount || 0).toLocaleString('pt-BR')} · {consultResult.status}
            </p>
          </div>
        )}
      </div>
      <div className="divide-y divide-border rounded-lg border border-border bg-white">
        <div className="border-b border-border px-4 py-2.5">
          <h3 className="text-sm font-semibold">Notas emitidas</h3>
        </div>
        {!loading &&
          cards.map((n) => (
            <div key={n.id || n.chave} className="flex items-center gap-4 px-4 py-3 text-xs hover:bg-muted/40">
              <div className="min-w-0 flex-1">
                <div className="font-semibold">
                  {n.numero} — {n.destinatario}
                </div>
                <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{n.chave || '—'}</div>
              </div>
              <div className="shrink-0 text-muted-foreground">{n.emissao}</div>
              <div className="shrink-0 font-medium">{n.valor}</div>
              <span className={`inline-flex shrink-0 items-center rounded px-2 py-0.5 text-[11px] font-medium ${statusCor[n.status] || 'bg-gray-100 text-gray-600'}`}>
                {n.status}
              </span>
            </div>
          ))}
        {!loading && cards.length === 0 && (
          <div className="px-4 py-6 text-center text-xs text-muted-foreground">Nenhuma NF-e cadastrada</div>
        )}
      </div>
    </div>
  );
}
