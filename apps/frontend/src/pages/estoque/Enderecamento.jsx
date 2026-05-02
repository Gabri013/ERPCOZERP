import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';
import { Button } from '@/components/ui/button';
import { MapPin, Package, Plus, Trash2 } from 'lucide-react';
import { stockApi } from '@/services/stockApi';
import { usePermissions } from '@/lib/PermissaoContext';

export default function Enderecamento() {
  const { pode } = usePermissions();
  const podeGerir = pode('enderecamento.manage') || pode('editar_produtos');
  const [locais, setLocais] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLoc, setModalLoc] = useState(null);
  const [assoc, setAssoc] = useState({
    productId: '',
    locationId: '',
    qtyNova: '',
  });
  const [plRows, setPlRows] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [l, p] = await Promise.all([stockApi.listLocations(), stockApi.listProducts({ take: 3000 })]);
      setLocais(l);
      setProdutos(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let ok = true;
    (async () => {
      if (!assoc.productId) {
        setPlRows([]);
        return;
      }
      const rows = await stockApi.listProductLocations(assoc.productId);
      if (ok) setPlRows(rows);
    })();
    return () => {
      ok = false;
    };
  }, [assoc.productId]);

  const salvarLocal = async (form, id) => {
    if (id) await stockApi.patchLocation(id, form);
    else await stockApi.createLocation(form);
    setModalLoc(null);
    await load();
  };

  const excluirLocal = async (loc) => {
    if (!podeGerir) return;
    if (!confirm(`Excluir endereço ${loc.code}?`)) return;
    setBusy(true);
    try {
      await stockApi.deleteLocation(loc.id);
      await load();
    } catch (e) {
      alert(e?.message || 'Não foi possível excluir (pode haver saldo vinculado).');
    } finally {
      setBusy(false);
    }
  };

  const aplicarAjuste = async () => {
    if (!assoc.productId) return alert('Selecione o produto');
    const defaultLoc = locais.find((x) => x.code === 'DEFAULT');
    const locId =
      assoc.locationId || plRows[0]?.locationId || defaultLoc?.id || locais[0]?.id;
    if (!locId) return alert('Cadastre ao menos um endereço de estoque.');
    const alvo = Number(assoc.qtyNova);
    if (Number.isNaN(alvo) || alvo < 0) return alert('Informe quantidade final válida.');
    const atualRow = assoc.locationId
      ? plRows.find((r) => r.locationId === assoc.locationId)
      : plRows.find((r) => r.locationId === locId);
    const atual = atualRow?.quantity ?? 0;
    const delta = alvo - atual;
    if (delta === 0) return alert('Sem alteração de saldo.');
    setBusy(true);
    try {
      const tipo = delta > 0 ? 'ENTRADA' : 'SAIDA';
      const q = Math.abs(delta);
      await stockApi.createMovement({
        productId: assoc.productId,
        locationId: locId,
        type: tipo,
        quantity: q,
        reference: 'Endereçamento',
        notes: `Ajuste manual → ${alvo} un`,
      });
      setAssoc((a) => ({ ...a, qtyNova: '' }));
      const rows = await stockApi.listProductLocations(assoc.productId);
      setPlRows(rows);
    } catch (e) {
      alert(e?.message || 'Falha no ajuste');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'code', label: 'Código', width: 90 },
    { key: 'name', label: 'Nome' },
    { key: 'warehouse', label: 'Armazém', width: 100, mobileHidden: true },
    { key: 'aisle', label: 'Rua', width: 70, mobileHidden: true },
    { key: 'rack', label: 'Prat.', width: 70, mobileHidden: true },
    { key: 'bin', label: 'Pos.', width: 70, mobileHidden: true },
    {
      key: 'active',
      label: 'Ativo',
      width: 60,
      render: (v) => (v ? 'Sim' : 'Não'),
    },
    podeGerir
      ? {
          key: '_a',
          label: '',
          width: 72,
          render: (_, row) => (
            <button
              type="button"
              className="text-destructive p-1"
              title="Excluir"
              onClick={(e) => {
                e.stopPropagation();
                excluirLocal(row);
              }}
            >
              <Trash2 size={14} />
            </button>
          ),
        }
      : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Endereçamento"
        breadcrumbs={['Início', 'Estoque', 'Endereçamento']}
        actions={
          podeGerir ? (
            <Button type="button" size="sm" className="gap-1 text-xs h-8" onClick={() => setModalLoc({})}>
              <Plus size={14} /> Novo endereço
            </Button>
          ) : null
        }
      />

      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-border flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <MapPin size={14} /> Locais de estoque
        </div>
        <DataTable
          columns={columns}
          data={locais}
          loading={loading}
          onRowClick={podeGerir ? (row) => setModalLoc(row) : undefined}
        />
      </div>

      <div className="bg-white border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Package size={16} /> Saldo por produto e endereço
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className={lbl}>Produto</label>
            <select
              className={inp}
              value={assoc.productId}
              onChange={(e) => setAssoc((a) => ({ ...a, productId: e.target.value }))}
            >
              <option value="">Selecionar…</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} — {p.descricao}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Endereço para ajuste (opcional)</label>
            <select
              className={inp}
              value={assoc.locationId}
              onChange={(e) => setAssoc((a) => ({ ...a, locationId: e.target.value }))}
            >
              <option value="">Principal / primeiro com saldo</option>
              {locais.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} — {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={lbl}>Quantidade final desejada neste endereço</label>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="number"
                min="0"
                step="any"
                className={`${inp} max-w-[140px]`}
                value={assoc.qtyNova}
                onChange={(e) => setAssoc((a) => ({ ...a, qtyNova: e.target.value }))}
                placeholder="Ex: 120"
              />
              <Button type="button" size="sm" disabled={busy || !podeGerir} onClick={aplicarAjuste}>
                Aplicar ajuste
              </Button>
              {!podeGerir && (
                <span className="text-muted-foreground">Sem permissão para ajustar saldos.</span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              O sistema calcula a diferença e registra movimentações no endereço escolhido.
            </p>
          </div>
        </div>
        {assoc.productId && (
          <div className="mt-4 overflow-x-auto border rounded-md">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2">Endereço</th>
                  <th className="text-right p-2">Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {plRows.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-3 text-muted-foreground">
                      Sem saldo registrado — use ajuste para definir quantidade.
                    </td>
                  </tr>
                ) : (
                  plRows.map((r) => (
                    <tr key={r.locationId} className="border-t border-border/60">
                      <td className="p-2 font-mono">
                        {r.locationCode} — {r.locationName}
                      </td>
                      <td className="p-2 text-right font-medium">{r.quantity}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalLoc !== null && podeGerir && (
        <ModalLocal
          initial={modalLoc.id ? modalLoc : null}
          onClose={() => setModalLoc(null)}
          onSave={salvarLocal}
        />
      )}
    </div>
  );
}

function ModalLocal({ initial, onClose, onSave }) {
  const [form, setForm] = useState({
    code: initial?.code || '',
    name: initial?.name || '',
    warehouse: initial?.warehouse || '',
    aisle: initial?.aisle || '',
    rack: initial?.rack || '',
    bin: initial?.bin || '',
    active: initial?.active !== false,
  });
  const [saving, setSaving] = useState(false);
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.code?.trim() || !form.name?.trim()) return alert('Código e nome são obrigatórios.');
    setSaving(true);
    try {
      await onSave(
        {
          code: form.code.trim(),
          name: form.name.trim(),
          warehouse: form.warehouse?.trim() || null,
          aisle: form.aisle?.trim() || null,
          rack: form.rack?.trim() || null,
          bin: form.bin?.trim() || null,
          active: form.active,
        },
        initial?.id,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal title={initial?.id ? 'Editar endereço' : 'Novo endereço'} onClose={onClose} onSave={submit} saving={saving}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>
            Código {req}
          </label>
          <input className={inp} value={form.code} onChange={(e) => upd('code', e.target.value)} disabled={!!initial?.id} />
        </div>
        <div>
          <label className={lbl}>
            Nome {req}
          </label>
          <input className={inp} value={form.name} onChange={(e) => upd('name', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Armazém</label>
          <input className={inp} value={form.warehouse} onChange={(e) => upd('warehouse', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Rua</label>
          <input className={inp} value={form.aisle} onChange={(e) => upd('aisle', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Prateleira</label>
          <input className={inp} value={form.rack} onChange={(e) => upd('rack', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Posição</label>
          <input className={inp} value={form.bin} onChange={(e) => upd('bin', e.target.value)} />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input type="checkbox" id="act" checked={form.active} onChange={(e) => upd('active', e.target.checked)} />
          <label htmlFor="act" className="text-xs">
            Ativo
          </label>
        </div>
      </div>
    </FormModal>
  );
}
