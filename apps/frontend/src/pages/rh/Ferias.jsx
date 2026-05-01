import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import { recordsServiceApi } from '@/services/recordsServiceApi';

const statusCor = {'Aprovadas':'bg-green-100 text-green-700','Em Gozo':'bg-blue-100 text-blue-700','Pendente':'bg-yellow-100 text-yellow-700','Solicitada':'bg-gray-100 text-gray-600','Rejeitada':'bg-red-100 text-red-700'};

const fmtD = v => v ? new Date(v+'T00:00').toLocaleDateString('pt-BR') : '—';

export default function Ferias() {
  const [data, setData] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [form, setForm] = useState({ nome:'', matricula:'', cargo:'', data_inicio:'', data_fim:'', dias:30, status:'Solicitada', observacoes:'' });
  const [saving, setSaving] = useState(false);
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  async function load() {
    setLoading(true);
    try {
      const [feriasRows, funcRows] = await Promise.all([
        recordsServiceApi.list('rh_ferias'),
        recordsServiceApi.list('rh_funcionario'),
      ]);
      setData(feriasRows);
      setFuncionarios(funcRows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const calcDias = (ini, fim) => {
    if(!ini||!fim) return 0;
    const d = (new Date(fim) - new Date(ini)) / (1000*60*60*24) + 1;
    return Math.max(0, Math.floor(d));
  };

  const handleSave = async () => {
    if(!form.nome) return alert('Informe o funcionário');
    if(!form.data_inicio || !form.data_fim) return alert('Informe as datas');
    setSaving(true);
    try {
      await recordsServiceApi.create('rh_ferias', { ...form, dias: calcDias(form.data_inicio, form.data_fim) });
      await load();
      setShowModal(false);
      setForm({ nome:'', matricula:'', cargo:'', data_inicio:'', data_fim:'', dias:30, status:'Solicitada', observacoes:'' });
    } finally {
      setSaving(false);
    }
  };

  const aprovar = async (row) => {
    if (!row?.id) return;
    await recordsServiceApi.update(row.id, { ...row, status: 'Aprovadas' });
    await load();
    setDetalhe(null);
  };

  const rejeitar = async (row) => {
    if (!row?.id) return;
    await recordsServiceApi.update(row.id, { ...row, status: 'Rejeitada' });
    await load();
    setDetalhe(null);
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

  const funcionarioOptions = useMemo(() => {
    return funcionarios.map((f) => `${f.nome} (${f.matricula})`);
  }, [funcionarios]);

  return (
    <div>
      <PageHeader title="Férias" breadcrumbs={['Início','RH','Férias']}
        actions={<button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Solicitar Férias</button>}
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <DataTable columns={columns} data={data} onRowClick={row=>setDetalhe(row)} loading={loading}/>
      </div>

      {showModal && (
        <FormModal title="Solicitar Férias" onClose={()=>setShowModal(false)} onSave={handleSave} saving={saving} size="md">
          <div className="space-y-3">
            <div><label className={lbl}>Funcionário {req}</label>
              <select className={inp} value={form.nome ? `${form.nome} (${form.matricula})` : ''} onChange={e=>{ const n=e.target.value.split(' (')[0]; const m=e.target.value.match(/\((.+)\)/)?.[1]||''; const cargo = funcionarios.find(x=>x.matricula===m)?.cargo || ''; upd('nome',n); upd('matricula',m); upd('cargo',cargo); }}>
                <option value="">Selecionar...</option>
                {funcionarioOptions.map(f=><option key={f}>{f}</option>)}
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
              <button onClick={()=>rejeitar(detalhe)} className="flex items-center gap-1 px-3 py-1.5 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50"><XCircle size={12}/> Rejeitar</button>
              <button onClick={()=>aprovar(detalhe)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:opacity-90"><CheckCircle size={12}/> Aprovar</button>
            </div>
          )}
        </DetalheModal>
      )}
    </div>
  );
}