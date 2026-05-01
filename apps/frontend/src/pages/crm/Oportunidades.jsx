import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';
import { Plus } from 'lucide-react';
import { recordsServiceApi } from '@/services/recordsServiceApi';

const estagioColors = {'Contato Inicial':'bg-gray-100 text-gray-600','Qualificação':'bg-blue-100 text-blue-700','Proposta':'bg-yellow-100 text-yellow-700','Negociação':'bg-orange-100 text-orange-700','Fechado Ganho':'bg-green-100 text-green-700','Fechado Perdido':'bg-red-100 text-red-700'};

const columns = [
  { key:'titulo', label:'Oportunidade' },
  { key:'empresa', label:'Empresa', width:150 },
  { key:'contato', label:'Contato', width:120 },
  { key:'valor', label:'Valor', width:110, render:v=>`R$ ${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2})}` },
  { key:'estagio', label:'Estágio', width:130, render:v=><span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${estagioColors[v]||'bg-gray-100 text-gray-600'}`}>{v}</span>, sortable:false },
  { key:'probabilidade', label:'%', width:60, render:v=><span className={`font-bold ${v>=80?'text-success':v>=50?'text-warning':'text-muted-foreground'}`}>{v}%</span> },
  { key:'fechamento', label:'Fechamento', width:100, render:v=>v?new Date(v+'T00:00').toLocaleDateString('pt-BR'):'—' },
  { key:'responsavel', label:'Responsável', width:110 },
];

export default function Oportunidades() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ titulo:'', empresa:'', contato:'', valor:0, estagio:'Contato Inicial', probabilidade:20, fechamento:'', responsavel:'' });
  const upd = (k,v) => setForm(f=>({ ...f, [k]: v }));

  async function load() {
    setLoading(true);
    try {
      setData(await recordsServiceApi.list('crm_oportunidade'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const pipeline = useMemo(
    () => data.filter(m=>m.estagio!=='Fechado Ganho'&&m.estagio!=='Fechado Perdido').reduce((s,m)=>s+Number(m.valor||0),0),
    [data]
  );

  const handleSave = async () => {
    if (!form.titulo) return alert('Informe o título');
    setSaving(true);
    try {
      await recordsServiceApi.create('crm_oportunidade', form);
      await load();
      setShowModal(false);
      setForm({ titulo:'', empresa:'', contato:'', valor:0, estagio:'Contato Inicial', probabilidade:20, fechamento:'', responsavel:'' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Oportunidades" breadcrumbs={['Início','CRM','Oportunidades']}
        actions={<button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Nova Oportunidade</button>}
      />
      <div className="grid grid-cols-3 gap-3 mb-3">
        {[
          {label:'Pipeline Total',val:`R$ ${pipeline.toLocaleString('pt-BR',{minimumFractionDigits:2})}`,color:'text-primary'},
          {label:'Oportunidades Ativas',val:data.filter(m=>!String(m.estagio||'').startsWith('Fechado')).length,color:'text-foreground'},
          {label:'Ganhas no Mês',val:data.filter(m=>m.estagio==='Fechado Ganho').length,color:'text-success'},
        ].map(k=>(
          <div key={k.label} className="bg-white border border-border rounded px-4 py-3">
            <div className={`text-lg font-bold ${k.color}`}>{k.val}</div>
            <div className="text-[11px] text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <DataTable columns={columns} data={data} loading={loading} />
      </div>

      {showModal && (
        <FormModal title="Nova Oportunidade" onClose={()=>setShowModal(false)} onSave={handleSave} saving={saving} size="md">
          <div className="space-y-3">
            <div><label className={lbl}>Título {req}</label><input className={inp} value={form.titulo} onChange={e=>upd('titulo',e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Empresa</label><input className={inp} value={form.empresa} onChange={e=>upd('empresa',e.target.value)} /></div>
              <div><label className={lbl}>Contato</label><input className={inp} value={form.contato} onChange={e=>upd('contato',e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={lbl}>Valor (R$)</label><input type="number" min="0" step="0.01" className={inp} value={form.valor} onChange={e=>upd('valor',Number(e.target.value))} /></div>
              <div><label className={lbl}>Estágio</label><select className={inp} value={form.estagio} onChange={e=>upd('estagio',e.target.value)}><option>Contato Inicial</option><option>Qualificação</option><option>Proposta</option><option>Negociação</option><option>Fechado Ganho</option><option>Fechado Perdido</option></select></div>
              <div><label className={lbl}>Prob. (%)</label><input type="number" min="0" max="100" step="1" className={inp} value={form.probabilidade} onChange={e=>upd('probabilidade',Number(e.target.value))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Fechamento</label><input className={inp} placeholder="YYYY-MM-DD" value={form.fechamento} onChange={e=>upd('fechamento',e.target.value)} /></div>
              <div><label className={lbl}>Responsável</label><input className={inp} value={form.responsavel} onChange={e=>upd('responsavel',e.target.value)} /></div>
            </div>
          </div>
        </FormModal>
      )}
    </div>
  );
}