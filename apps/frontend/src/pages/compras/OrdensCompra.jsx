import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';
import DetalheModal from '@/components/common/DetalheModal';
import { Button } from '@/components/ui/button';
import { Plus, Download, SendHorizonal, PackageCheck, Loader2 } from 'lucide-react';
import { exportPdfReport } from '@/services/pdfExport';
import {
  listPurchaseOrders,
  createPurchaseOrder,
  sendPurchaseOrder,
  receivePurchaseOrder,
  listSuppliers,
} from '@/services/purchasesApi';
import { listStockProducts } from '@/services/stockApi';
import { usePermissions } from '@/lib/PermissaoContext';

const fmtR = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const fmtD = (v) => (v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—');

const STATUS_OPTS = [
  'Rascunho',
  'Enviado',
  'Parcialmente Recebido',
  'Recebido',
  'Cancelado',
];

export default function OrdensCompra() {
  const { pode } = usePermissions();
  const podeCriar = pode('criar_oc') || pode('ordem_compra.edit') || pode('editar_fornecedores');
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [showReceber, setShowReceber] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const rows = await listPurchaseOrders();
      setData(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return data.filter(
      (o) =>
        (!s || o.numero?.toLowerCase().includes(s) || o.fornecedor_nome?.toLowerCase().includes(s)) &&
        (!filters.status || o.status === filters.status),
    );
  }, [data, search, filters]);

  const columns = [
    {
      key: 'numero',
      label: 'Número',
      width: 110,
      render: (v, row) => (
        <button
          className="text-primary hover:underline font-medium"
          onClick={(e) => {
            e.stopPropagation();
            setDetalhe(row);
          }}
        >
          {v}
        </button>
      ),
    },
    { key: 'fornecedor_nome', label: 'Fornecedor' },
    { key: 'data_emissao', label: 'Emissão', width: 90, render: fmtD, mobileHidden: true },
    { key: 'data_entrega_prevista', label: 'Prev. Entrega', width: 100, render: fmtD, mobileHidden: true },
    { key: 'valor_total', label: 'Valor Total', width: 110, render: fmtR },
    { key: 'status', label: 'Status', width: 170, render: (v) => <StatusBadge status={v} />, sortable: false },
  ];

  const handleEnviar = async (oc) => {
    if (!confirm(`Marcar OC ${oc.numero} como ENVIADA ao fornecedor?`)) return;
    setActionBusy(true);
    try {
      await sendPurchaseOrder(oc.id);
      setDetalhe(null);
      await reload();
    } catch (e) {
      alert(e?.message || 'Erro ao enviar');
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Ordens de Compra"
        breadcrumbs={['Início', 'Compras', 'Ordens de Compra']}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() =>
                exportPdfReport({
                  title: 'Ordens de Compra',
                  subtitle: 'Compras emitidas e recebidas no ERP',
                  filename: 'ordens-compra.pdf',
                  table: {
                    headers: ['Número', 'Fornecedor', 'Emissão', 'Prev. Entrega', 'Valor Total', 'Status'],
                    rows: data.map((o) => [
                      o.numero,
                      o.fornecedor_nome,
                      fmtD(o.data_emissao),
                      fmtD(o.data_entrega_prevista),
                      fmtR(o.valor_total),
                      o.status,
                    ]),
                  },
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"
            >
              <Download size={13} /> Exportar PDF
            </button>
            {podeCriar && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"
              >
                <Plus size={13} /> Nova OC
              </button>
            )}
          </div>
        }
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar
          search={search}
          onSearch={setSearch}
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: STATUS_OPTS.map((s) => ({ value: s, label: s })),
            },
          ]}
          activeFilters={filters}
          onFilterChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          onClear={() => {
            setSearch('');
            setFilters({});
          }}
        />
        <DataTable columns={columns} data={filtered} onRowClick={(row) => setDetalhe(row)} loading={loading} />
      </div>

      {showModal && podeCriar && (
        <ModalNovaOC
          onClose={() => setShowModal(false)}
          onSaved={async () => {
            setShowModal(false);
            await reload();
          }}
        />
      )}

      {detalhe && (
        <DetalheModal
          title={`OC — ${detalhe.numero}`}
          subtitle={detalhe.fornecedor_nome}
          onClose={() => setDetalhe(null)}
          onExport={() =>
            exportPdfReport({
              title: `Ordem de Compra ${detalhe.numero}`,
              subtitle: detalhe.fornecedor_nome,
              filename: `${detalhe.numero}.pdf`,
              fields: [
                { label: 'Número', value: detalhe.numero },
                { label: 'Fornecedor', value: detalhe.fornecedor_nome },
                { label: 'Status', value: detalhe.status },
                { label: 'Emissão', value: fmtD(detalhe.data_emissao) },
                { label: 'Prev. Entrega', value: fmtD(detalhe.data_entrega_prevista) },
                { label: 'Valor Total', value: fmtR(detalhe.valor_total) },
              ],
              preview: true,
            })
          }
        >
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              ['Número', detalhe.numero],
              ['Fornecedor', detalhe.fornecedor_nome],
              ['Status', detalhe.status],
              ['Emissão', fmtD(detalhe.data_emissao)],
              ['Prev. Entrega', fmtD(detalhe.data_entrega_prevista)],
              ['Valor Total', fmtR(detalhe.valor_total)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border pb-1">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>

          {detalhe.itens?.length > 0 && (
            <div className="mt-3">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase mb-1">Itens</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-1.5">Produto</th>
                    <th className="text-right p-1.5">Qtd</th>
                    <th className="text-right p-1.5">Recebido</th>
                    <th className="text-right p-1.5">Custo Unit.</th>
                  </tr>
                </thead>
                <tbody>
                  {detalhe.itens.map((it) => (
                    <tr key={it.id} className="border-b border-border/60">
                      <td className="p-1.5">{it.produto_descricao}</td>
                      <td className="p-1.5 text-right">{it.quantidade}</td>
                      <td className="p-1.5 text-right">{it.quantidade_recebida}</td>
                      <td className="p-1.5 text-right">{fmtR(it.custo_unitario)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {detalhe.observacoes && (
            <div className="mt-3 text-xs">
              <div className="text-muted-foreground mb-1">Observações</div>
              <div className="bg-muted rounded p-2">{detalhe.observacoes}</div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap justify-end gap-2">
            {detalhe.statusRaw === 'RASCUNHO' && podeCriar && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={actionBusy}
                className="gap-1.5 text-xs"
                onClick={() => handleEnviar(detalhe)}
              >
                {actionBusy ? <Loader2 size={13} className="animate-spin" /> : <SendHorizonal size={13} />}
                Enviar ao fornecedor
              </Button>
            )}
            {(detalhe.statusRaw === 'ENVIADO' || detalhe.statusRaw === 'PARCIALMENTE_RECEBIDO') && podeCriar && (
              <Button
                type="button"
                size="sm"
                className="gap-1.5 text-xs"
                disabled={actionBusy}
                onClick={() => setShowReceber(detalhe)}
              >
                <PackageCheck size={13} />
                Receber mercadoria
              </Button>
            )}
          </div>
        </DetalheModal>
      )}

      {showReceber && (
        <ModalReceber
          oc={showReceber}
          onClose={() => setShowReceber(null)}
          onDone={async () => {
            setShowReceber(null);
            setDetalhe(null);
            await reload();
          }}
        />
      )}
    </div>
  );
}

function ModalNovaOC({ onClose, onSaved }) {
  const [suppliers, setSuppliers] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [form, setForm] = useState({
    supplierId: '',
    expectedDate: '',
    notes: '',
    items: [{ productId: '', quantity: 1, unitCost: 0 }],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ok = true;
    (async () => {
      const [sups, prods] = await Promise.all([
        listSuppliers().catch(() => []),
        listStockProducts({ take: 3000 }).catch(() => []),
      ]);
      if (!ok) return;
      setSuppliers(sups);
      setProdutos(prods);
    })();
    return () => {
      ok = false;
    };
  }, []);

  const updItem = (i, k, v) =>
    setForm((f) => {
      const items = [...f.items];
      items[i] = { ...items[i], [k]: v };
      return { ...f, items };
    });
  const addItem = () =>
    setForm((f) => ({
      ...f,
      items: [...f.items, { productId: '', quantity: 1, unitCost: 0 }],
    }));
  const removeItem = (i) =>
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, idx) => idx !== i),
    }));

  const submit = async () => {
    if (!form.supplierId) return alert('Selecione um fornecedor');
    const validItems = form.items.filter((it) => it.productId);
    if (!validItems.length) return alert('Adicione ao menos um produto');
    setSaving(true);
    try {
      await createPurchaseOrder({
        supplierId: form.supplierId,
        expectedDate: form.expectedDate || null,
        notes: form.notes?.trim() || null,
        items: validItems.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity),
          unitCost: Number(it.unitCost) || null,
        })),
      });
      await onSaved();
    } catch (e) {
      alert(e?.message || 'Erro ao criar OC');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal title="Nova Ordem de Compra" onClose={onClose} onSave={submit} saving={saving} size="lg">
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className={lbl}>
              Fornecedor {req}
            </label>
            <select
              className={inp}
              value={form.supplierId}
              onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}
            >
              <option value="">Selecionar fornecedor…</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Data prevista de entrega</label>
            <input
              type="date"
              className={inp}
              value={form.expectedDate}
              onChange={(e) => setForm((f) => ({ ...f, expectedDate: e.target.value }))}
            />
          </div>
          <div>
            <label className={lbl}>Observações</label>
            <input
              className={inp}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase">Itens {req}</div>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={addItem}>
              <Plus size={12} /> Adicionar item
            </Button>
          </div>
          <div className="space-y-2">
            {form.items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6">
                  <select
                    className={inp}
                    value={it.productId}
                    onChange={(e) => updItem(i, 'productId', e.target.value)}
                  >
                    <option value="">Produto…</option>
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0.0001"
                    step="any"
                    className={inp}
                    value={it.quantity}
                    onChange={(e) => updItem(i, 'quantity', e.target.value)}
                    placeholder="Qtd"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inp}
                    value={it.unitCost}
                    onChange={(e) => updItem(i, 'unitCost', e.target.value)}
                    placeholder="Custo unit."
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    className="text-destructive hover:opacity-70 text-xs"
                    onClick={() => removeItem(i)}
                    disabled={form.items.length === 1}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FormModal>
  );
}

function ModalReceber({ oc, onClose, onDone }) {
  const [quantities, setQuantities] = useState(() => {
    const q = {};
    for (const it of oc.itens ?? []) {
      q[it.productId] = it.quantidade - it.quantidade_recebida;
    }
    return q;
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const lines = Object.entries(quantities)
      .filter(([, q]) => Number(q) > 0)
      .map(([productId, q]) => ({ productId, quantity: Number(q) }));
    if (!lines.length) return alert('Informe ao menos uma quantidade > 0');
    setSaving(true);
    try {
      await receivePurchaseOrder(oc.id, lines);
      await onDone();
    } catch (e) {
      alert(e?.message || 'Erro ao receber');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal title={`Receber — ${oc.numero}`} onClose={onClose} onSave={submit} saving={saving} size="md">
      <p className="text-[11px] text-muted-foreground mb-3">
        Informe as quantidades fisicamente recebidas. Será gerada movimentação de entrada no estoque automaticamente.
      </p>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-1.5">Produto</th>
            <th className="text-right p-1.5">Pedido</th>
            <th className="text-right p-1.5">Já Recebido</th>
            <th className="text-right p-1.5">Receber agora</th>
          </tr>
        </thead>
        <tbody>
          {(oc.itens ?? []).map((it) => (
            <tr key={it.productId} className="border-b border-border/60">
              <td className="p-1.5">{it.produto_descricao}</td>
              <td className="p-1.5 text-right">{it.quantidade}</td>
              <td className="p-1.5 text-right">{it.quantidade_recebida}</td>
              <td className="p-1.5 text-right">
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="w-20 border rounded px-1 py-0.5 text-right"
                  value={quantities[it.productId] ?? 0}
                  onChange={(e) =>
                    setQuantities((q) => ({ ...q, [it.productId]: e.target.value }))
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </FormModal>
  );
}
