import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FormModal, { inp, lbl } from '@/components/common/FormModal';
import { Clock, Plus, Download } from 'lucide-react';
import { exportPdfReport } from '@/services/pdfExport';
import { recordsServiceApi } from '@/services/recordsServiceApi';

const statusCor = {'Normal':'bg-green-100 text-green-700','Hora Extra':'bg-blue-100 text-blue-700','Falta':'bg-red-100 text-red-700','Atraso':'bg-yellow-100 text-yellow-700'};

export default function Ponto() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ data:'', entrada:'', saida_almoco:'', retorno:'', saida:'', status:'Normal' });
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  async function load() {
    setLoading(true);
    try {
      setRows(await recordsServiceApi.list('rh_ponto'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const ponto = useMemo(() => {
    const byMat = new Map();
    for (const r of rows) {
      const key = r.matricula || r.nome || '—';
      const existing = byMat.get(key) || { nome: r.nome || '—', matricula: r.matricula || '—', registros: [] };
      existing.registros.push({
        id: r.id,
        data: r.data,
        entrada: r.entrada,
        saida_almoco: r.saida_almoco,
        retorno: r.retorno,
        saida: r.saida,
        horas: r.horas,
        status: r.status,
      });
      byMat.set(key, existing);
    }
    // Ordena registros por data desc
    const list = Array.from(byMat.values()).map((f) => ({
      ...f,
      registros: f.registros.sort((a, b) => String(b.data || '').localeCompare(String(a.data || ''))),
    }));
    // Ordena funcionários por nome
    return list.sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || '')));
  }, [rows]);

  const func = ponto[sel];

  const handleSave = async () => {
    if(!form.data) return alert('Informe a data');
    setSaving(true);
    try {
      await recordsServiceApi.create('rh_ponto', {
        nome: func?.nome,
        matricula: func?.matricula,
        ...form,
        horas: '8:00',
      });
      await load();
      setShowModal(false);
      setForm({ data:'', entrada:'', saida_almoco:'', retorno:'', saida:'', status:'Normal' });
    } finally {
      setSaving(false);
    }
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
          registro.data ? new Date(String(registro.data) + 'T00:00:00').toLocaleDateString('pt-BR') : '—',
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
                <td className="px-4 py-2 font-medium">{r.data ? new Date(String(r.data) + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                <td className="px-4 py-2">{r.entrada||'—'}</td>
                <td className="px-4 py-2">{r.saida_almoco||'—'}</td>
                <td className="px-4 py-2">{r.retorno||'—'}</td>
                <td className="px-4 py-2">{r.saida||'—'}</td>
                <td className="px-4 py-2 font-medium">{r.horas}</td>
                <td className="px-4 py-2"><span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${statusCor[r.status]}`}>{r.status}</span></td>
              </tr>
            ))}
            {(!func || !func.registros?.length) && (
              <tr><td colSpan={7} className="px-4 py-4 text-center text-muted-foreground text-xs">
                {loading ? 'Carregando...' : 'Sem registros'}
              </td></tr>
            )}
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