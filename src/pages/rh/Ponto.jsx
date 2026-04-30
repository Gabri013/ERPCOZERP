import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FormModal, { inp, lbl } from '@/components/common/FormModal';
import { Clock, Plus, Download } from 'lucide-react';
import { storage } from '@/services/storage';
import { exportPdfReport } from '@/services/pdfExport';

const MOCK_INICIAL = [
  { nome:'João Melo', matricula:'MAT-001', registros:[
    {data:'21/04',entrada:'07:58',saida_almoco:'12:01',retorno:'13:02',saida:'17:05',horas:'8:04',status:'Normal'},
    {data:'20/04',entrada:'08:02',saida_almoco:'12:00',retorno:'13:00',saida:'17:10',horas:'8:08',status:'Normal'},
  ]},
  { nome:'Pedro Alves', matricula:'MAT-002', registros:[
    {data:'21/04',entrada:'07:45',saida_almoco:'12:00',retorno:'13:00',saida:'17:00',horas:'8:15',status:'Normal'},
    {data:'20/04',entrada:null,saida_almoco:null,retorno:null,saida:null,horas:'0:00',status:'Falta'},
  ]},
  { nome:'Maria Lima', matricula:'MAT-003', registros:[
    {data:'21/04',entrada:'08:05',saida_almoco:'12:00',retorno:'13:00',saida:'18:30',horas:'9:25',status:'Hora Extra'},
    {data:'20/04',entrada:'08:00',saida_almoco:'12:05',retorno:'13:10',saida:'17:00',horas:'7:45',status:'Normal'},
  ]},
];

const statusCor = {'Normal':'bg-green-100 text-green-700','Hora Extra':'bg-blue-100 text-blue-700','Falta':'bg-red-100 text-red-700','Atraso':'bg-yellow-100 text-yellow-700'};

if (!localStorage.getItem('nomus_erp_ponto')) storage.set('ponto', MOCK_INICIAL);
const getData = () => storage.get('ponto', MOCK_INICIAL);
const saveData = d => storage.set('ponto', d);

export default function Ponto() {
  const [ponto, setPonto] = useState(getData());
  const [sel, setSel] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ data:'', entrada:'', saida_almoco:'', retorno:'', saida:'', status:'Normal' });
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  const reload = () => setPonto([...getData()]);
  const func = ponto[sel];

  const handleSave = async () => {
    if(!form.data) return alert('Informe a data');
    setSaving(true);
    const all = getData();
    const atualizado = all.map((f,i) => i===sel ? {...f, registros:[{...form, horas:'8:00'}, ...f.registros]} : f);
    saveData(atualizado);
    setSaving(false);
    setShowModal(false);
    setForm({ data:'', entrada:'', saida_almoco:'', retorno:'', saida:'', status:'Normal' });
    reload();
  };

  const exportar = () => {
    exportPdfReport({
      title: 'Ponto Eletrônico',
      subtitle: 'Registros de jornada dos colaboradores',
      filename: 'ponto.pdf',
      table: {
        headers: ['Funcionário', 'Matrícula', 'Data', 'Entrada', 'Saída Almoço', 'Retorno', 'Saída', 'Horas', 'Status'],
        rows: ponto.flatMap((funcionario) => funcionario.registros.map((registro) => [
          funcionario.nome,
          funcionario.matricula,
          registro.data,
          registro.entrada || '—',
          registro.saida_almoco || '—',
          registro.retorno || '—',
          registro.saida || '—',
          registro.horas,
          registro.status,
        ])),
      },
    });
  };

  return (
    <div>
      <PageHeader title="Ponto Eletrônico" breadcrumbs={['Início','RH','Ponto Eletrônico']}
        actions={<div className="flex gap-2">
          <button onClick={exportar} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"><Download size={13}/> Exportar PDF</button>
          <button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Registrar Ponto</button>
        </div>}
      />
      <div className="grid grid-cols-4 gap-3 mb-4">
        {ponto.map((f,i)=>(
          <button key={i} onClick={()=>setSel(i)} className={`text-left bg-white border rounded-lg px-4 py-3 transition-all ${sel===i?'border-primary shadow-sm':'border-border hover:border-muted-foreground'}`}>
            <div className="text-xs font-semibold">{f.nome}</div>
            <div className="text-[10px] text-muted-foreground">{f.matricula}</div>
          </button>
        ))}
      </div>
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
          <Clock size={14} className="text-muted-foreground"/>
          <h3 className="text-sm font-semibold">{func?.nome} — Registros</h3>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="bg-muted border-b border-border">
            {['Data','Entrada','Saída Almoço','Retorno','Saída','Horas','Status'].map(h=>(
              <th key={h} className="text-left px-4 py-2 font-medium text-muted-foreground">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {func?.registros.map((r,i)=>(
              <tr key={i} className="border-b border-border last:border-0 hover:bg-nomus-blue-light">
                <td className="px-4 py-2 font-medium">{r.data}</td>
                <td className="px-4 py-2">{r.entrada||'—'}</td>
                <td className="px-4 py-2">{r.saida_almoco||'—'}</td>
                <td className="px-4 py-2">{r.retorno||'—'}</td>
                <td className="px-4 py-2">{r.saida||'—'}</td>
                <td className="px-4 py-2 font-medium">{r.horas}</td>
                <td className="px-4 py-2"><span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${statusCor[r.status]}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <FormModal title="Registrar Ponto" onClose={()=>setShowModal(false)} onSave={handleSave} saving={saving} size="sm">
          <div className="space-y-3">
            <div><label className={lbl}>Funcionário</label><input className={`${inp} bg-muted`} readOnly value={func?.nome}/></div>
            <div><label className={lbl}>Data</label><input type="date" className={inp} value={form.data} onChange={e=>upd('data',e.target.value)}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Entrada</label><input type="time" className={inp} value={form.entrada} onChange={e=>upd('entrada',e.target.value)}/></div>
              <div><label className={lbl}>Saída Almoço</label><input type="time" className={inp} value={form.saida_almoco} onChange={e=>upd('saida_almoco',e.target.value)}/></div>
              <div><label className={lbl}>Retorno</label><input type="time" className={inp} value={form.retorno} onChange={e=>upd('retorno',e.target.value)}/></div>
              <div><label className={lbl}>Saída</label><input type="time" className={inp} value={form.saida} onChange={e=>upd('saida',e.target.value)}/></div>
            </div>
            <div><label className={lbl}>Status</label>
              <select className={inp} value={form.status} onChange={e=>upd('status',e.target.value)}>
                {['Normal','Hora Extra','Falta','Atraso'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </FormModal>
      )}
    </div>
  );
}