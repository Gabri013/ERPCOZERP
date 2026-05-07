import { useState } from 'react';
import { X } from 'lucide-react';

const inp = 'w-full border border-border rounded px-2.5 py-1.5 text-xs bg-white outline-none focus:border-primary';
const lbl = 'block text-[11px] text-muted-foreground mb-0.5';
const btn = 'px-3 py-1.5 rounded text-xs font-medium transition-colors';

export default function ConcluirOPModal({ op, itens = [], onClose, onSave }) {
  const [formItens, setFormItens] = useState(
    (itens || []).map((item) => ({
      workOrderItemId: item.id || item.workOrderItemId,
      quantidadeProduzida: item.quantidadeProduzida ? Number(item.quantidadeProduzida) : item.quantity ? Number(item.quantity) : '',
      quantidadeRefugo: item.quantidadeRefugo ? Number(item.quantidadeRefugo) : 0,
      product: item.product?.name || item.productName || `Produto ${item.productId}`,
      quantityPlanned: item.quantity ? Number(item.quantity) : 0,
    }))
  );
  const [saving, setSaving] = useState(false);

  const upd = (idx, key, val) => {
    setFormItens((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };
      return next;
    });
  };

  const handleConcluir = async () => {
    setSaving(true);
    try {
      await onSave({
        itens: formItens,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border flex items-center justify-between p-4">
          <h2 className="font-semibold text-sm">Concluir Ordem de Produção</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={16} />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4 text-xs text-muted-foreground">
            <p>Informar as quantidades produzidas e refugo para cada item da OP: <strong>{op.numero}</strong></p>
          </div>

          <div className="space-y-3">
            {formItens.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum item na OP</p>
            ) : (
              formItens.map((item, idx) => (
                <div key={idx} className="border border-border rounded p-3 space-y-2">
                  <div className="text-xs font-medium">{item.product}</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className={lbl}>Planejado</label>
                      <input
                        type="number"
                        value={item.quantityPlanned}
                        disabled
                        className={`${inp} bg-gray-50 text-gray-600`}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Produzido</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.quantidadeProduzida}
                        onChange={(e) => upd(idx, 'quantidadeProduzida', e.target.value ? Number(e.target.value) : '')}
                        placeholder="Ex: 10.5"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Refugo</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.quantidadeRefugo}
                        onChange={(e) => upd(idx, 'quantidadeRefugo', e.target.value ? Number(e.target.value) : 0)}
                        placeholder="Ex: 0.5"
                        className={inp}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={onClose}
              disabled={saving}
              className={`${btn} flex-1 bg-gray-100 hover:bg-gray-200 text-foreground`}
            >
              Cancelar
            </button>
            <button
              onClick={handleConcluir}
              disabled={saving}
              className={`${btn} flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50`}
            >
              {saving ? 'Concluindo...' : 'Concluir OP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
