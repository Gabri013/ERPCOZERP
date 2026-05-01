import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';
import { Plus } from 'lucide-react';
import { recordsServiceApi } from '@/services/recordsServiceApi';

const statusMap = {'Recebida':'bg-blue-100 text-blue-700','Aprovada':'bg-green-100 text-green-700','Pendente':'bg-yellow-100 text-yellow-700','Cancelada':'bg-red-100 text-red-700'};

const columns = [
  { key:'numero', label:'Número', width:90 },
  { key:'descricao', label:'Descrição' },
  { key:'fornecedor', label:'Fornecedor', width:200 },
  { key:'data_envio', label:'Enviada em', width:100, render:v=>v?new Date(v+'T00:00').toLocaleDateString('pt-BR'):'—' },
  { key:'validade', label:'Validade', width:90, render:v=>v?new Date(v+'T00:00').toLocaleDateString('pt-BR'):'—' },
  { key:'valor', label:'Valor', width:110, render:v=>`R$ ${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2})}` },
  { key:'status', label:'Status', width:90, render:v=><span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${statusMap[v]||'bg-gray-100 text-gray-600'}`}>{v}</span>, sortable:false },
];

export default function Cotacoes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ numero:'', descricao:'', fornecedor:'', data_envio:'', validade:'', valor:0, status:'Pendente' });
  const upd = (k,v) => setForm(f=>({ ...f, [k]: v }));

  async function load() {
    setLoading(true);
    try {
      setData(await recordsServiceApi.list('cotacao_compra'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    if (!form.descricao) return alert('Informe a descrição');
    setSaving(true);
    try {
      const numero = form.numero || `COT-${String(Date.now()).slice(-4)}`;
      await recordsServiceApi.create('cotacao_compra', { ...form, numero });
      await load();
      setShowModal(false);
      setForm({ numero:'', descricao:'', fornecedor:'', data_envio:'', validade:'', valor:0, status:'Pendente' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Cotações" breadcrumbs={['Início','Compras','Cotações']}
        actions={<button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Nova Cotação</button>}
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <DataTable columns={columns} data={data} loading={loading} />
      </div>

      {showModal && (
        <FormModal title="Nova Cotação" onClose={()=>setShowModal(false)} onSave={handleSave} saving={saving} size="md">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Número</label><input className={inp} value={form.numero} onChange={e=>upd('numero',e.target.value)} placeholder="Opcional" /></div>
              <div><label className={lbl}>Status</label><select className={inp} value={form.status} onChange={e=>upd('status',e.target.value)}><option>Pendente</option><option>Recebida</option><option>Aprovada</option><option>Cancelada</option></select></div>
            </div>
            <div><label className={lbl}>Descrição {req}</label><input className={inp} value={form.descricao} onChange={e=>upd('descricao',e.target.value)} /></div>
            <div><label className={lbl}>Fornecedor</label><input className={inp} value={form.fornecedor} onChange={e=>upd('fornecedor',e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={lbl}>Enviada em</label><input className={inp} placeholder="YYYY-MM-DD" value={form.data_envio} onChange={e=>upd('data_envio',e.target.value)} /></div>
              <div><label className={lbl}>Validade</label><input className={inp} placeholder="YYYY-MM-DD" value={form.validade} onChange={e=>upd('validade',e.target.value)} /></div>
              <div><label className={lbl}>Valor (R$)</label><input type="number" min="0" step="0.01" className={inp} value={form.valor} onChange={e=>upd('valor',Number(e.target.value))} /></div>
            </div>
          </div>
        </FormModal>
      )}
    </div>
  );
}