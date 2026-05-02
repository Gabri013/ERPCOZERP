import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FilterBar from '@/components/common/FilterBar';
import FormModal, { inp, lbl } from '@/components/common/FormModal';
import { Button } from '@/components/ui/button';
import { ClipboardList, CheckCircle, Loader2 } from 'lucide-react';
import { mapInventoryStatusUi, stockApi } from '@/services/stockApi';
import { usePermissions } from '@/lib/PermissaoContext';

function num(v) {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && typeof v.toNumber === 'function') return v.toNumber();
  return Number(v);
}

export default function Inventario() {
  const { pode } = usePermissions();
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showNova, setShowNova] = useState(false);
  const [detalheId, setDetalheId] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [detalheLoading, setDetalheLoading] = useState(false);

  const podeCriar = pode('inventario.create') || pode('movimentar_estoque');
  const podeAprovar = pode('inventario.approve') || pode('movimentar_estoque');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await stockApi.listInventoryCounts();
      setCounts(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadDetalhe = async (id) => {
    setDetalheLoading(true);
    try {
      const d = await stockApi.getInventoryCount(id);
      setDetalhe(d);
    } catch {
      setDetalhe(null);
    } finally {
      setDetalheLoading(false);
    }
  };

  useEffect(() => {
    if (!detalheId) {
      setDetalhe(null);
      return;
    }
    loadDetalhe(detalheId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detalheId]);

  const rows = useMemo(() => {
    return counts.map((c) => {
      const items = c.items || [];
      let divergencias = 0;
      for (const it of items) {
        const sys = num(it.qtySystem);
        const ct = it.qtyCounted != null ? num(it.qtyCounted) : null;
        if (ct != null && sys != null && ct !== sys) divergencias += 1;
      }
      return {
        id: c.id,
        codigo: c.code,
        statusUi: mapInventoryStatusUi(c.status),
        statusRaw: c.status,
        createdAt: c.createdAt,
        nItems: items.length,
        divergencias,
      };
    });
  }, [counts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const okSearch = !q || r.codigo?.toLowerCase().includes(q);
      const okStatus = !filters.status || r.statusUi === filters.status;
      return okSearch && okStatus;
    });
  }, [rows, search, filters.status]);

  const stats = useMemo(() => {
    const aprovados = rows.filter((r) => r.statusRaw === 'APROVADO').length;
    const abertos = rows.filter((r) => r.statusRaw !== 'APROVADO').length;
    const comDiv = rows.filter((r) => r.divergencias > 0 && r.statusRaw !== 'APROVADO').length;
    return { aprovados, abertos, comDiv };
  }, [rows]);

  const columns = [
    {
      key: 'codigo',
      label: 'Contagem',
      width: 140,
      render: (v, row) => (
        <button type="button" className="text-primary hover:underline text-left font-mono text-[11px]" onClick={() => setDetalheId(row.id)}>
          {v}
        </button>
      ),
    },
    {
      key: 'statusUi',
      label: 'Status',
      width: 110,
      render: (v) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted">
          {v}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Criada em',
      width: 120,
      render: (v) => (v ? new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'),
    },
    { key: 'nItems', label: 'Itens', width: 60 },
    { key: 'divergencias', label: 'Diverg.', width: 70 },
  ];

  return (
    <div>
      <PageHeader
        title="Inventário"
        breadcrumbs={['Início', 'Estoque', 'Inventário']}
        actions={
          podeCriar ? (
            <button
              type="button"
              onClick={() => setShowNova(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"
            >
              <ClipboardList size={13} /> Nova contagem
            </button>
          ) : null
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        {[
          { label: 'Contagens abertas', val: stats.abertos, color: 'text-amber-800', bg: 'bg-amber-50' },
          { label: 'Com divergência (abertas)', val: stats.comDiv, color: 'text-red-700', bg: 'bg-red-50' },
          { label: 'Aprovadas', val: stats.aprovados, color: 'text-green-700', bg: 'bg-green-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border border-border rounded px-4 py-3 text-center`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar
          search={search}
          onSearch={setSearch}
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: ['Rascunho', 'Em contagem', 'Aprovado'].map((x) => ({ value: x, label: x })),
            },
          ]}
          activeFilters={filters}
          onFilterChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          onClear={() => {
            setSearch('');
            setFilters({});
          }}
        />
        <div className="overflow-x-auto min-w-0">
          <DataTable columns={columns} data={filtered} loading={loading} />
        </div>
      </div>

      {showNova && podeCriar && (
        <ModalNovaContagem
          onClose={() => setShowNova(false)}
          onCreated={async () => {
            setShowNova(false);
            await load();
          }}
        />
      )}

      {detalheId && (
        <DetalheContagemModal
          countId={detalheId}
          loading={detalheLoading}
          data={detalhe}
          podeAprovar={podeAprovar}
          onClose={() => setDetalheId(null)}
          onRefresh={load}
          onReloadDetalhe={() => loadDetalhe(detalheId)}
        />
      )}
    </div>
  );
}

function ModalNovaContagem({ onClose, onCreated }) {
  const [notes, setNotes] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [selected, setSelected] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ok = true;
    (async () => {
      const list = await stockApi.listProducts({ status: 'Ativo', take: 5000 });
      if (!ok) return;
      setProdutos(list);
    })();
    return () => {
      ok = false;
    };
  }, []);

  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const todosSel = produtos.length > 0 && produtos.every((p) => selected[p.id]);

  const toggleTodos = () => {
    if (todosSel) setSelected({});
    else {
      const n = {};
      produtos.forEach((p) => {
        n[p.id] = true;
      });
      setSelected(n);
    }
  };

  const salvar = async () => {
    const ids = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    setSaving(true);
    try {
      await stockApi.createInventoryCount({
        notes: notes.trim() || null,
        productIds: ids.length ? ids : undefined,
      });
      await onCreated();
    } catch (e) {
      alert(e?.message || 'Falha ao criar contagem');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal title="Nova contagem de inventário" onClose={onClose} onSave={salvar} saving={saving} size="lg">
      <p className="text-[11px] text-muted-foreground mb-2">
        Marque os produtos a incluir ou deixe vazio para incluir todos os ativos (até o limite do servidor).
      </p>
      <div className="mb-3">
        <label className={lbl}>Observações</label>
        <textarea className={inp} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Button type="button" variant="outline" size="sm" className="text-xs h-8" onClick={toggleTodos}>
          {todosSel ? 'Limpar seleção' : 'Selecionar todos'}
        </Button>
        <span className="text-[11px] text-muted-foreground">
          {Object.values(selected).filter(Boolean).length} selecionado(s)
        </span>
      </div>
      <div className="max-h-[280px] overflow-y-auto border border-border rounded-md divide-y">
        {produtos.map((p) => (
          <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer hover:bg-muted/50">
            <input type="checkbox" checked={!!selected[p.id]} onChange={() => toggle(p.id)} />
            <span className="font-mono text-[10px] text-muted-foreground w-24 shrink-0">{p.codigo}</span>
            <span className="truncate">{p.descricao}</span>
          </label>
        ))}
      </div>
    </FormModal>
  );
}

function DetalheContagemModal({ countId, loading, data, podeAprovar, onClose, onRefresh, onReloadDetalhe }) {
  const [busy, setBusy] = useState(false);

  const statusRaw = data?.status;
  const fechado = statusRaw === 'APROVADO';

  const marcarEmContagem = async () => {
    setBusy(true);
    try {
      await stockApi.patchInventoryCount(countId, { status: 'EM_CONTAGEM' });
      await onReloadDetalhe();
      await onRefresh();
    } catch (e) {
      alert(e?.message || 'Erro');
    } finally {
      setBusy(false);
    }
  };

  const aprovar = async () => {
    if (!confirm('Aprovar e aplicar ajustes de estoque conforme quantidades contadas?')) return;
    setBusy(true);
    try {
      await stockApi.approveInventoryCount(countId);
      await onReloadDetalhe();
      await onRefresh();
    } catch (e) {
      alert(e?.message || 'Erro ao aprovar');
    } finally {
      setBusy(false);
    }
  };

  const atualizarItem = async (itemId, qty) => {
    setBusy(true);
    try {
      await stockApi.patchInventoryItem(itemId, { qtyCounted: qty });
      await onReloadDetalhe();
      await onRefresh();
    } catch (e) {
      alert(e?.message || 'Erro ao salvar linha');
    } finally {
      setBusy(false);
    }
  };

  const items = data?.items || [];

  return (
    <FormModal title={data?.code || 'Contagem'} onClose={onClose} size="xl" hideFooter>
      {loading || !data ? (
        <div className="flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando…
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs">
            <div>
              Status: <strong>{mapInventoryStatusUi(statusRaw)}</strong>
              {data.approvedBy && (
                <span className="text-muted-foreground ml-2">
                  — {data.approvedBy.fullName || data.approvedBy.email}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {!fechado && (
                <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={marcarEmContagem}>
                  Marcar em contagem
                </Button>
              )}
              {!fechado && podeAprovar && (
                <Button type="button" size="sm" disabled={busy} onClick={aprovar} className="gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Aprovar ajustes
                </Button>
              )}
            </div>
          </div>
          {data.notes && <p className="text-xs text-muted-foreground mb-2">{data.notes}</p>}
          <div className="overflow-x-auto max-h-[420px] border rounded-md">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/80">
                <tr className="border-b">
                  <th className="text-left p-2">Código</th>
                  <th className="text-left p-2">Produto</th>
                  <th className="text-left p-2">Endereço</th>
                  <th className="text-right p-2">Sistema</th>
                  <th className="text-right p-2">Contado</th>
                  <th className="text-right p-2">Dif.</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const sys = num(it.qtySystem);
                  const ct = it.qtyCounted != null ? num(it.qtyCounted) : null;
                  const diff = ct != null && sys != null ? ct - sys : null;
                  return (
                    <tr key={it.id} className="border-b border-border/60">
                      <td className="p-2 font-mono">{it.product?.code}</td>
                      <td className="p-2">{it.product?.name}</td>
                      <td className="p-2">{it.location?.code || '—'}</td>
                      <td className="p-2 text-right">{sys}</td>
                      <td className="p-2 text-right">
                        {fechado ? (
                          ct ?? '—'
                        ) : (
                          <input
                            type="number"
                            min="0"
                            step="any"
                            className="w-20 border rounded px-1 py-0.5 text-right"
                            defaultValue={ct ?? ''}
                            disabled={busy}
                            onBlur={(e) => {
                              const raw = e.target.value.trim();
                              const q = raw === '' ? null : Number(raw);
                              if (q !== ct && (q === null || !Number.isNaN(q))) atualizarItem(it.id, q);
                            }}
                          />
                        )}
                      </td>
                      <td className={`p-2 text-right ${diff !== 0 && diff != null ? 'text-destructive font-semibold' : ''}`}>
                        {diff != null ? (diff > 0 ? `+${diff}` : diff) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </FormModal>
  );
}
