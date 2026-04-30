import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import { storage } from '@/services/storage';

const MOCK_INICIAL = [
  { id:'1', nome:'João Melo', matricula:'MAT-001', cargo:'Operador CNC', data_inicio:'2026-07-01', data_fim:'2026-07-30', dias:30, status:'Aprovadas', observacoes:'' },
  { id:'2', nome:'Pedro Alves', matricula:'MAT-002', cargo:'Torneiro Mecânico', data_inicio:'2026-08-01', data_fim:'2026-08-14', dias:14, status:'Aprovadas', observacoes:'' },
  { id:'3', nome:'Fernanda Souza', matricula:'MAT-007', cargo:'Analista de RH', data_inicio:'2026-04-15', data_fim:'2026-05-14', dias:30, status:'Em Gozo', observacoes:'' },
  { id:'4', nome:'Carlos Santos', matricula:'MAT-004', cargo:'Gerente de Vendas', data_inicio:'2026-06-01', data_fim:'2026-06-30', dias:30, status:'Pendente', observacoes:'' },
  { id:'5', nome:'Ana Paula', matricula:'MAT-005', cargo:'Analista Financeiro', data_inicio:'2026-09-01', data_fim:'2026-09-30', dias:30, status:'Solicitada', observacoes:'' },
];

const FUNCIONARIOS = ['João Melo (MAT-001)','Pedro Alves (MAT-002)','Maria Lima (MAT-003)','Carlos Santos (MAT-004)','Ana Paula (MAT-005)','Rafael Costa (MAT-006)','Fernanda Souza (MAT-007)'];
const statusCor = {'Aprovadas':'bg-green-100 text-green-700','Em Gozo':'bg-blue-100 text-blue-700','Pendente':'bg-yellow-100 text-yellow-700','Solicitada':'bg-gray-100 text-gray-600','Rejeitada':'bg-red-100 text-red-700'};

if (!localStorage.getItem('nomus_erp_ferias')) storage.set('ferias', MOCK_INICIAL);
const getData = () => storage.get('ferias', MOCK_INICIAL);
const saveData = d => storage.set('ferias', d);
const fmtD = v => v ? new Date(v+'T00:00').toLocaleDateString('pt-BR') : '—';

export default function Ferias() {
  const [data, setData] = useState(getData());
  const [showModal, setShowModal] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [form, setForm] = useState({ nome:'', matricula:'', cargo:'', data_inicio:'', data_fim:'', dias:30, status:'Solicitada', observacoes:'' });
  const [saving, setSaving] = useState(false);
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  const reload = () => setData([...getData()]);

  const calcDias = (ini, fim) => {
    if(!ini||!fim) return 0;
    const d = (new Date(fim) - new Date(ini)) / (1000*60*60*24) + 1;
    return Math.max(0, Math.floor(d));
  };

  const handleSave = async () => {
    if(!form.nome) return alert('Informe o funcionário');
    if(!form.data_inicio || !form.data_fim) return alert('Informe as datas');
    setSaving(true);
    const all = getData();
    saveData([...all, {...form, id:Date.now().toString(), dias:calcDias(form.data_inicio,form.data_fim)}]);
    setSaving(false);
    setShowModal(false);
    setForm({ nome:'', matricula:'', cargo:'', data_inicio:'', data_fim:'', dias:30, status:'Solicitada', observacoes:'' });
    reload();
  };

  const aprovar = (id) => {
    saveData(getData().map(f => f.id===id ? {...f, status:'Aprovadas'} : f));
    reload(); setDetalhe(null);
  };

  const rejeitar = (id) => {
    saveData(getData().map(f => f.id===id ? {...f, status:'Rejeitada'} : f));
    reload(); setDetalhe(null);
  };

  const columns = [
    { key:'nome', label:'Funcionário' },
    { key:'matricula', label:'Matrícula', width:90 },
    { key:'cargo', label:'Cargo', width:150 },
    { key:'data_inicio', label:'Início', width:100, render:fmtD },
    { key:'data_fim', label:'Fim', width:100, render:fmtD },
    { key:'dias', label:'Dias', width:60 },
    { key:'status', label:'Status', width:100, render:v=><span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${statusCor[v]||'bg-gray-100'}`}>{v}</span>, sortable:false },
  ];

  return (
    <div>
      <PageHeader title="Férias" breadcrumbs={['Início','RH','Férias']}
        actions={<button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Solicitar Férias</button>}
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <DataTable columns={columns} data={data} onRowClick={row=>setDetalhe(row)}/>
      </div>

      {showModal && (
        <FormModal title="Solicitar Férias" onClose={()=>setShowModal(false)} onSave={handleSave} saving={saving} size="md">
          <div className="space-y-3">
            <div><label className={lbl}>Funcionário {req}</label>
              <select className={inp} value={form.nome} onChange={e=>{ const n=e.target.value.split(' (')[0]; const m=e.target.value.match(/\((.+)\)/)?.[1]||''; upd('nome',n); upd('matricula',m); }}>
                <option value="">Selecionar...</option>
                {FUNCIONARIOS.map(f=><option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Data Início {req}</label><input type="date" className={inp} value={form.data_inicio} onChange={e=>{upd('data_inicio',e.target.value); upd('dias',calcDias(e.target.value,form.data_fim));}}/></div>
              <div><label className={lbl}>Data Fim {req}</label><input type="date" className={inp} value={form.data_fim} onChange={e=>{upd('data_fim',e.target.value); upd('dias',calcDias(form.data_inicio,e.target.value));}}/></div>
            </div>
            <div className="bg-muted rounded px-3 py-2 text-xs">Dias calculados: <strong>{form.dias} dias</strong></div>
            <div><label className={lbl}>Observações</label><textarea rows={2} className={inp} value={form.observacoes} onChange={e=>upd('observacoes',e.target.value)}/></div>
          </div>
        </FormModal>
      )}

      {detalhe && (
        <DetalheModal title={`Férias — ${detalhe.nome}`} subtitle={`${detalhe.matricula} · ${detalhe.cargo}`} onClose={()=>setDetalhe(null)}>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[['Status',<span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${statusCor[detalhe.status]}`}>{detalhe.status}</span>],['Período',`${fmtD(detalhe.data_inicio)} a ${fmtD(detalhe.data_fim)}`],['Dias',detalhe.dias]].map(([k,v],i)=>(
              <div key={i} className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>
          {detalhe.observacoes && <div className="mt-3 text-xs bg-muted rounded p-2">{detalhe.observacoes}</div>}
          {(detalhe.status==='Solicitada'||detalhe.status==='Pendente') && (
            <div className="mt-3 flex gap-2 justify-end">
              <button onClick={()=>rejeitar(detalhe.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50"><XCircle size={12}/> Rejeitar</button>
              <button onClick={()=>aprovar(detalhe.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:opacity-90"><CheckCircle size={12}/> Aprovar</button>
            </div>
          )}
        </DetalheModal>
      )}
    </div>
  );
}