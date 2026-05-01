import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Plus } from 'lucide-react';
import { recordsServiceApi } from '@/services/recordsServiceApi';

const statusMaq = {'Ativo':'bg-green-100 text-green-700','Inativo':'bg-gray-100 text-gray-600','Manutenção':'bg-orange-100 text-orange-700'};

const columns = [
  { key:'codigo', label:'Código', width:80 },
  { key:'descricao', label:'Descrição' },
  { key:'tipo', label:'Tipo', width:120 },
  { key:'fabricante', label:'Fabricante', width:100 },
  { key:'setor', label:'Setor', width:100 },
  { key:'ultima_manutencao', label:'Últ. Manutenção', width:120, render:v=>v?new Date(v+'T00:00').toLocaleDateString('pt-BR'):'—' },
  { key:'proxima_manutencao', label:'Próx. Manutenção', width:130, render:v=>v?new Date(v+'T00:00').toLocaleDateString('pt-BR'):'—' },
  { key:'status', label:'Status', width:90, render:v=><span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${statusMaq[v]||'bg-gray-100 text-gray-600'}`}>{v}</span>, sortable:false },
];

export default function Maquinas() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const rows = await recordsServiceApi.list('producao_maquina');
        if (mounted) setData(rows);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const stats = useMemo(() => {
    const total = data.length;
    const ativos = data.filter(m=>m.status==='Ativo').length;
    const manut = data.filter(m=>m.status==='Manutenção').length;
    return { total, ativos, manut };
  }, [data]);

  return (
    <div>
      <PageHeader title="Máquinas e Equipamentos" breadcrumbs={['Início','Produção','Máquinas']}
        actions={<button className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Nova Máquina</button>}
      />
      <div className="grid grid-cols-3 gap-3 mb-3">
        {[
          {label:'Total',val:stats.total,color:'text-foreground'},
          {label:'Em Operação',val:stats.ativos,color:'text-success'},
          {label:'Em Manutenção',val:stats.manut,color:'text-orange-600'},
        ].map(s=>(
          <div key={s.label} className="bg-white border border-border rounded px-4 py-3 text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
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