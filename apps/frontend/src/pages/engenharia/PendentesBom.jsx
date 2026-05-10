/**
 * Dashboard do Projetista — produtos pendentes de BOM.
 * - Stats por status (EMPTY, PENDING_ENGINEERING)
 * - Ação rápida para mudar status inline
 * - Link direto à ficha do produto
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { productsApi } from '@/services/productsApi';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/lib/PermissaoContext';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react';

const STATUS_CFG = {
  EMPTY: {
    label: 'Sem BOM',
    cls: 'bg-red-100 text-red-700 border-red-200',
    badgeCls: 'bg-red-50 border-red-200',
    icon: AlertTriangle,
  },
  PENDING_ENGINEERING: {
    label: 'Em elaboração',
    cls: 'bg-amber-100 text-amber-700 border-amber-200',
    badgeCls: 'bg-amber-50 border-amber-200',
    icon: Clock,
  },
  COMPLETE: {
    label: 'Aprovada',
    cls: 'bg-green-100 text-green-700 border-green-200',
    badgeCls: 'bg-green-50 border-green-200',
    icon: CheckCircle2,
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.EMPTY;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium ${cfg.cls}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

/** Allowed next-status transitions for a given current status */
const NEXT_STATUSES = {
  EMPTY: [{ value: 'PENDING_ENGINEERING', label: '→ Em elaboração' }],
  PENDING_ENGINEERING: [
    { value: 'EMPTY', label: '← Sem BOM' },
    { value: 'COMPLETE', label: '→ Aprovada' },
  ],
};

export default function PendentesBom() {
  const { pode } = usePermissions();
  const canEdit = pode('editar_produtos');
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({}); // recordId → true while saving
  const [filterStatus, setFilterStatus] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productsApi.pendingBom();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro', description: e?.message });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChangeStatus = useCallback(
    async (recordId, newStatus) => {
      setUpdating((u) => ({ ...u, [recordId]: true }));
      try {
        await productsApi.putBomStatus(recordId, newStatus);
        setItems((prev) =>
          prev
            .map((p) => (p.record_id === recordId ? { ...p, bom_status: newStatus } : p))
            .filter((p) => p.bom_status !== 'COMPLETE'),
        );
        toast({ title: 'Status atualizado', description: STATUS_CFG[newStatus]?.label });
      } catch (e) {
        toast({ variant: 'destructive', title: 'Erro', description: e?.message });
      } finally {
        setUpdating((u) => ({ ...u, [recordId]: false }));
      }
    },
    [toast],
  );

  const stats = useMemo(() => {
    const empty = items.filter((p) => p.bom_status === 'EMPTY').length;
    const pending = items.filter((p) => p.bom_status === 'PENDING_ENGINEERING').length;
    return { empty, pending, total: empty + pending };
  }, [items]);

  const filtered = useMemo(() => {
    if (filterStatus === 'ALL') return items;
    return items.filter((p) => p.bom_status === filterStatus);
  }, [items, filterStatus]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <PageHeader
          title="Produtos pendentes de BOM"
          subtitle="Fila do projetista — status EMPTY ou PENDING_ENGINEERING"
        />
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5 shrink-0">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'ALL', label: 'Total pendentes', value: stats.total, color: 'blue' },
          { key: 'EMPTY', label: 'Sem BOM', value: stats.empty, color: 'red' },
          { key: 'PENDING_ENGINEERING', label: 'Em elaboração', value: stats.pending, color: 'amber' },
        ].map(({ key, label, value, color }) => {
          const colors = {
            blue: 'bg-blue-50 border-blue-200 text-blue-800',
            red: 'bg-red-50 border-red-200 text-red-800',
            amber: 'bg-amber-50 border-amber-200 text-amber-800',
          };
          const active = filterStatus === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilterStatus(key)}
              className={`rounded-lg border px-3 py-2 text-left transition-all ${colors[color]} ${active ? 'ring-2 ring-offset-1 ring-current opacity-100' : 'opacity-80 hover:opacity-100'}`}
            >
              <p className="text-[10px] uppercase font-medium opacity-70">{label}</p>
              <p className="text-2xl font-bold">{loading ? '…' : value}</p>
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <CheckCircle2 size={32} className="mx-auto mb-2 text-green-400" />
          <p className="font-medium text-sm">
            {filterStatus === 'ALL'
              ? 'Nenhum produto pendente!'
              : `Nenhum produto com status "${STATUS_CFG[filterStatus]?.label}"`}
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {filtered.map((p) => {
          const nextOptions = NEXT_STATUSES[p.bom_status] || [];
          const isUpdating = updating[p.record_id];
          return (
            <li
              key={p.record_id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm hover:border-primary/30 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-sm">{p.codigo}</span>
                  <StatusBadge status={p.bom_status} />
                </div>
                {p.descricao && (
                  <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                    {p.descricao}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Quick status transition buttons */}
                {canEdit &&
                  nextOptions.map(({ value, label }) => (
                    <Button
                      key={value}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUpdating}
                      onClick={() => handleChangeStatus(p.record_id, value)}
                      className="text-[11px] h-7 px-2"
                    >
                      {isUpdating ? <Loader2 size={11} className="animate-spin" /> : label}
                    </Button>
                  ))}

                <Link
                  to={`/estoque/produtos/bom/${p.record_id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Importar BOM <ExternalLink size={11} />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          {filtered.length} {filtered.length === 1 ? 'produto' : 'produtos'} · clique em "Importar BOM" para abrir a ficha
        </p>
      )}
    </div>
  );
}
