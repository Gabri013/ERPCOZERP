import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Plus, FileText, X } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';

const statusCor = {
  AUTORIZADA: 'bg-green-100 text-green-700',
  RASCUNHO: 'bg-yellow-100 text-yellow-700',
  CANCELADA: 'bg-red-100 text-red-700',
};

function mapStatus(s) {
  const u = String(s || '').toUpperCase();
  if (u === 'AUTORIZADA') return 'Autorizada';
  if (u === 'CANCELADA') return 'Cancelada';
  if (u === 'RASCUNHO') return 'Em Digitação';
  return s || '—';
}

function EmitirModal({ onClose, onConfirm }) {
  const [form, setForm] = useState({ customerName: '', totalAmount: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim()) { toast.error('Informe o destinatário.'); return; }
    const amount = parseFloat(String(form.totalAmount).replace(',', '.'));
    if (!amount || amount <= 0) { toast.error('Informe um valor válido.'); return; }
    setSaving(true);
    try {
      await onConfirm({ customerName: form.customerName.trim(), totalAmount: amount });
      onClose();
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Nova NF-e (mock)</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Destinatário *</label>
            <input className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.customerName} onChange={(e) => set('customerName', e.target.value)} placeholder="Nome do cliente / empresa" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Valor total (R$) *</label>
            <input type="number" min="0.01" step="0.01" className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.totalAmount} onChange={(e) => set('totalAmount', e.target.value)} placeholder="Ex: 12500.00" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 rounded-md px-3 py-2 text-sm cozinha-blue-bg text-white hover:opacity-90 disabled:opacity-60">
              {saving ? 'Emitindo…' : 'Emitir NF-e'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NFe() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/fiscal/nfes');
      const rows = Array.isArray(res?.data?.data) ? res.data.data : [];
      setData(
        rows.map((n) => ({
          id: n.id,
          numero: n.number || '—',
          serie: n.series || '—',
          destinatario: n.customerName || '—',
          cnpj: '—',
          data_emissao: n.issuedAt ? String(n.issuedAt).slice(0, 10) : '',
          valor: n.totalAmount != null ? Number(n.totalAmount) : 0,
          status: mapStatus(n.status),
          _rawStatus: String(n.status || ''),
        })),
      );
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || 'Erro ao carregar NF-e.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const emitirMock = async (payload) => {
    try {
      await api.post('/api/fiscal/nfes/issue-mock', payload);
      toast.success('NF-e mock emitida com sucesso.');
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || 'Falha na emissão.');
      throw e;
    }
  };

  const cancelar = async (row) => {
    if (!row?.id) return;
    if (!confirm('Cancelar esta NF-e?')) return;
    try {
      await api.post(`/api/fiscal/nfes/${row.id}/cancel`);
      toast.success('NF-e cancelada.');
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || 'Falha ao cancelar.');
    }
  };

  const columns = [
    { key: 'numero', label: 'Número', width: 120 },
    { key: 'serie', label: 'Série', width: 50 },
    { key: 'destinatario', label: 'Destinatário' },
    { key: 'cnpj', label: 'CNPJ', width: 150 },
    {
      key: 'data_emissao',
      label: 'Emissão',
      width: 90,
      render: (v) => (v ? new Date(v + 'T12:00:00').toLocaleDateString('pt-BR') : '—'),
    },
    {
      key: 'valor',
      label: 'Valor',
      width: 110,
      render: (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'status',
      label: 'Status',
      width: 140,
      render: (v, row) => (
        <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${statusCor[row._rawStatus] || 'bg-gray-100 text-gray-600'}`}>
          {v}
        </span>
      ),
      sortable: false,
    },
    {
      key: 'id',
      label: '',
      width: 90,
      sortable: false,
      render: (_v, row) =>
        row._rawStatus !== 'CANCELADA' ? (
          <button type="button" className="text-[11px] text-destructive hover:underline" onClick={() => cancelar(row)}>
            Cancelar
          </button>
        ) : null,
    },
  ];

  return (
    <div>
      {showModal && <EmitirModal onClose={() => setShowModal(false)} onConfirm={emitirMock} />}
      <PageHeader
        title="Emissão de NF-e"
        breadcrumbs={['Início', 'Fiscal', 'NF-e Emissão']}
        actions={(
          <div className="flex gap-2">
            <button type="button" className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs hover:bg-muted">
              <FileText size={13} /> Importar XML
            </button>
            <button type="button" onClick={() => setShowModal(true)} className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs cozinha-blue-bg text-white hover:opacity-90">
              <Plus size={13} /> Nova NF-e (mock)
            </button>
          </div>
        )}
      />
      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <DataTable columns={columns} data={data} loading={loading} />
      </div>
    </div>
  );
}
