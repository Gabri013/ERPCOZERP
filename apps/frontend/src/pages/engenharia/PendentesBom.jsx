import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import { productsApi } from '@/services/productsApi';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function PendentesBom() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const data = await productsApi.pendingBom();
        if (ok) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (ok) {
          toast({ variant: 'destructive', title: 'Erro', description: e?.message });
          setItems([]);
        }
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, [toast]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
      <PageHeader
        title="Produtos pendentes de BOM"
        subtitle="Status EMPTY ou PENDING_ENGINEERING — visão do projetista"
      />
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
        </div>
      )}
      {!loading && items.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum produto pendente no momento.</p>
      )}
      <ul className="space-y-2">
        {items.map((p) => (
          <li
            key={p.record_id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
          >
            <div>
              <div className="font-mono font-semibold">{p.codigo}</div>
              <div className="text-xs text-muted-foreground">{p.descricao || '—'}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs rounded bg-amber-500/15 text-amber-800 dark:text-amber-200 px-2 py-0.5">
                {p.bom_status}
              </span>
              <Link
                to={`/estoque/produtos/${p.record_id}`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Abrir ficha
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
