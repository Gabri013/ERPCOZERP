import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';
import { Plus } from 'lucide-react';
import { recordsServiceApi } from '@/services/recordsServiceApi';

const qualificacaoCor = { 'Quente':'bg-red-100 text-red-700', 'Morno':'bg-yellow-100 text-yellow-700', 'Frio':'bg-blue-100 text-blue-700' };

const columns = [
  { key:'nome', label:'Nome' },
  { key:'empresa', label:'Empresa', width:150 },
  { key:'cargo', label:'Cargo', width:130 },
  { key:'email', label:'E-mail', width:180 },
  { key:'telefone', label:'Telefone', width:130 },
  { key:'origem', label:'Origem', width:90 },
  { key:'qualificacao', label:'Temperatura', width:100, render:v=><span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${qualificacaoCor[v]||'bg-gray-100 text-gray-600'}`}>{v}</span>, sortable:false },
  { key:'responsavel', label:'Responsável', width:110 },
];

export default function Leads() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome:'', empresa:'', cargo:'', email:'', telefone:'', origem:'', qualificacao:'Morno', responsavel:'' });
  const upd = (k,v) => setForm(f=>({ ...f, [k]: v }));

  async function load() {
    setLoading(true);
    try {
      setData(await recordsServiceApi.list('crm_lead'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    if (!form.nome) return alert('Informe o nome');
    setSaving(true);
    try {
      await recordsServiceApi.create('crm_lead', form);
      await load();
      setShowModal(false);
      setForm({ nome:'', empresa:'', cargo:'', email:'', telefone:'', origem:'', qualificacao:'Morno', responsavel:'' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Leads" breadcrumbs={['Início','CRM','Leads']}
        actions={<button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Novo Lead</button>}
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <DataTable columns={columns} data={data} loading={loading} />
      </div>

      {showModal && (
        <FormModal title="Novo Lead" onClose={()=>setShowModal(false)} onSave={handleSave} saving={saving} size="md">
          <div className="space-y-3">
            <div><label className={lbl}>Nome {req}</label><input className={inp} value={form.nome} onChange={e=>upd('nome',e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Empresa</label><input className={inp} value={form.empresa} onChange={e=>upd('empresa',e.target.value)} /></div>
              <div><label className={lbl}>Cargo</label><input className={inp} value={form.cargo} onChange={e=>upd('cargo',e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>E-mail</label><input className={inp} value={form.email} onChange={e=>upd('email',e.target.value)} /></div>
              <div><label className={lbl}>Telefone</label><input className={inp} value={form.telefone} onChange={e=>upd('telefone',e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={lbl}>Origem</label><input className={inp} value={form.origem} onChange={e=>upd('origem',e.target.value)} /></div>
              <div><label className={lbl}>Temperatura</label><select className={inp} value={form.qualificacao} onChange={e=>upd('qualificacao',e.target.value)}><option>Quente</option><option>Morno</option><option>Frio</option></select></div>
              <div><label className={lbl}>Responsável</label><input className={inp} value={form.responsavel} onChange={e=>upd('responsavel',e.target.value)} /></div>
            </div>
          </div>
        </FormModal>
      )}
    </div>
  );
}