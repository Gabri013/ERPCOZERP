import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { Clock } from 'lucide-react';
import { api } from '@/services/api';

async function fetchConciliation() {
  const res = await api.get('/api/financial/conciliation');
  if (!res?.data?.success) throw new Error('Resposta inválida');
  return res.data.data;
}

const iconStatus = {
  Pendente: <Clock size={13} className="text-warning" />,
};

export default function ConciliacaoBancaria() {
  const [filtro, setFiltro] = useState('Todos');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['financial-conciliation'],
    queryFn: fetchConciliation,
  });

  const items = useMemo(() => {
    const raw = Array.isArray(data?.items) ? data.items : [];
    return raw.map((it) => ({
      id: it.id,
      data: it.vencimento ? String(it.vencimento).slice(0, 10) : '—',
      descricao: `${it.tipo || 'Lançamento'} · ${it.id?.slice(0, 8)}`,
      tipo: '—',
      valor: Number(it.valor || 0),
      status: 'Pendente',
    }));
  }, [data]);

  const lista = filtro === 'Todos' ? items : items.filter((l) => l.status === filtro);
  const saldo = items.reduce((s, l) => s + l.valor, 0);

  return (
    <div>
      <PageHeader title="Conciliação Bancária" breadcrumbs={['Início', 'Financeiro', 'Conciliação Bancária']} />
      {isError && <p className="mb-3 text-sm text-destructive">Erro ao carregar pendências.</p>}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Itens pendentes', val: data?.pendencias ?? items.length, color: 'text-foreground' },
              { label: 'Conta', val: data?.bankAccount ?? 'Principal', color: 'text-muted-foreground' },
              { label: 'Soma valores', val: `R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'text-primary' },
            ].map((k) => (
              <div key={k.label} className="rounded border border-border bg-white px-4 py-3 text-center">
                <div className={`text-lg font-bold ${k.color}`}>{k.val}</div>
                <div className="text-[11px] text-muted-foreground">{k.label}</div>
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-white">
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
              {['Todos', 'Pendente'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFiltro(f)}
                  className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                    filtro === f ? 'cozinha-blue-bg text-white' : 'bg-muted text-muted-foreground hover:bg-border'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Vencimento</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Descrição</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Valor</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((l) => (
                  <tr key={l.id} className="border-b border-border bg-yellow-50 last:border-0">
                    <td className="px-4 py-2">{l.data !== '—' ? new Date(l.data + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                    <td className="px-4 py-2">{l.descricao}</td>
                    <td className={`px-4 py-2 text-right font-medium ${l.valor >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                      R$ {Math.abs(l.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        {iconStatus[l.status]}
                        <span>{l.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {lista.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">Nenhuma pendência aberta.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
