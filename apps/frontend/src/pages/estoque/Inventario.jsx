import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { ClipboardList } from 'lucide-react';
import { recordsServiceApi } from '@/services/recordsServiceApi';

const statusMap = { 'Conferido':'bg-green-100 text-green-700', 'Divergente':'bg-red-100 text-red-700', 'Pendente':'bg-yellow-100 text-yellow-700' };

const columns = [
  { key:'codigo', label:'Código', width:80 },
  { key:'descricao', label:'Descrição' },
  { key:'localizacao', label:'Localização', width:100 },
  { key:'estoque_sistema', label:'Sistema', width:80, render:v=><span className="font-medium">{v}</span> },
  { key:'estoque_contado', label:'Contado', width:80, render:v=>v!=null?v:'—' },
  { key:'diferenca', label:'Diferença', width:80, render:v=>v!=null?<span className={v!==0?'text-destructive font-bold':'text-success'}>{v>0?'+':''}{v}</span>:'—' },
  { key:'status', label:'Status', width:90, render:v=><span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${statusMap[v]||'bg-gray-100 text-gray-600'}`}>{v}</span>, sortable:false },
];

export default function Inventario() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const rows = await recordsServiceApi.list('estoque_inventario');
        if (mounted) setData(rows);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const conf = useMemo(() => data.filter(m=>m.status==='Conferido').length, [data]);
  const div = useMemo(() => data.filter(m=>m.status==='Divergente').length, [data]);
  const pend = useMemo(() => data.filter(m=>m.status==='Pendente').length, [data]);
  return (
    <div>
      <PageHeader title="Inventário" breadcrumbs={['Início','Estoque','Inventário']}
        actions={<button className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><ClipboardList size={13}/> Iniciar Contagem</button>}
      />
      <div className="grid grid-cols-3 gap-3 mb-3">
        {[
          {label:'Conferidos',val:conf,color:'text-success',bg:'bg-green-50'},
          {label:'Divergentes',val:div,color:'text-destructive',bg:'bg-red-50'},
          {label:'Pendentes',val:pend,color:'text-warning',bg:'bg-yellow-50'},
        ].map(s=>(
          <div key={s.label} className={`${s.bg} border border-border rounded px-4 py-3 text-center`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <DataTable columns={columns} data={data} loading={loading} />
      </div>
    </div>
  );
}