import { useEffect, useState } from 'react';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';
import { stockApi } from '@/services/stockApi';

const TIPO_TO_API = { Entrada: 'ENTRADA', Saída: 'SAIDA', Ajuste: 'AJUSTE' };
const TIPOS = Object.keys(TIPO_TO_API);

export default function ModalMovimentacao({ onClose, onSave }) {
  const [form, setForm] = useState({
    tipo: 'Entrada',
    productId: '',
    locationId: '',
    quantidade: 1,
    origem: '',
    observacoes: '',
  });
  const [saving, setSaving] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [locais, setLocais] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    let ok = true;
    (async () => {
      setLoadingMeta(true);
      try {
        const [p, l] = await Promise.all([stockApi.listProducts({ take: 3000 }), stockApi.listLocations()]);
        if (!ok) return;
        setProdutos(p);
        setLocais(l);
        setForm((f) => ({
          ...f,
          locationId: f.locationId || l[0]?.id || '',
        }));
      } catch {
        if (ok) {
          setProdutos([]);
          setLocais([]);
        }
      } finally {
        if (ok) setLoadingMeta(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, []);

  const handleSave = async () => {
    if (!form.productId) return alert('Selecione o produto');
    if (!form.quantidade || form.quantidade <= 0) return alert('Quantidade deve ser > 0');
    const type = TIPO_TO_API[form.tipo];
    if (!type) return alert('Tipo inválido');
    setSaving(true);
    try {
      await onSave({
        productId: form.productId,
        locationId: form.locationId || null,
        type,
        quantity: Number(form.quantidade),
        reference: form.origem?.trim() || null,
        notes: form.observacoes?.trim() || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      title="Nova Movimentação de Estoque"
      onClose={onClose}
      onSave={handleSave}
      saving={saving || loadingMeta}
      size="md"
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>
              Tipo {req}
            </label>
            <select className={inp} value={form.tipo} onChange={(e) => upd('tipo', e.target.value)}>
              {TIPOS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Documento / referência</label>
            <input className={inp} value={form.origem} onChange={(e) => upd('origem', e.target.value)} placeholder="NF, OC, manual…" />
          </div>
          <div className="col-span-2">
            <label className={lbl}>
              Produto {req}
            </label>
            <select className={inp} value={form.productId} onChange={(e) => upd('productId', e.target.value)}>
              <option value="">Selecionar produto…</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} — {p.descricao}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Endereço (estoque)</label>
            <select className={inp} value={form.locationId} onChange={(e) => upd('locationId', e.target.value)}>
              <option value="">Padrão (depósito principal)</option>
              {locais.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.code} — {loc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Quantidade {req}</label>
            <input
              type="number"
              min="0.0001"
              step="any"
              className={inp}
              value={form.quantidade}
              onChange={(e) => upd('quantidade', Number(e.target.value))}
            />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Entrada e saída alteram o saldo no endereço escolhido. Ajuste aplica a diferença (aceita reduzir saldo).
        </p>
        <div>
          <label className={lbl}>Observações</label>
          <textarea rows={2} className={inp} value={form.observacoes} onChange={(e) => upd('observacoes', e.target.value)} />
        </div>
      </div>
    </FormModal>
  );
}
