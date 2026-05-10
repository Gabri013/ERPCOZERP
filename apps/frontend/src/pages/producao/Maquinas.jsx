import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Plus } from 'lucide-react';
import { api } from '@/services/api';

const statusMaq = {'Ativo':'bg-green-100 text-green-700','Inativo':'bg-gray-100 text-gray-600','Manutenção':'bg-orange-100 text-orange-700'};

const OEEBadge = ({ oee }) => {
  const cor = oee >= 75 ? 'green' : oee >= 65 ? 'yellow' : 'red'
  const bg = { green: '#dcfce7', yellow: '#fef9c3', red: '#fee2e2' }
  const text = { green: '#166534', yellow: '#854d0e', red: '#991b1b' }
  return (
    <span style={{ background: bg[cor], color: text[cor],
                    padding: '2px 8px', borderRadius: 99, fontSize: 12 }}>
      {oee !== null ? `${oee}% OEE` : '—'}
    </span>
  )
}

const columns = [
  { key:'code', label:'Código', width:80 },
  { key:'name', label:'Nome' },
  { key:'sector', label:'Setor', width:100 },
  { key:'active', label:'Ativo', width:60, render:v=><span className={v?'text-green-600':'text-red-600'}>{v?'Sim':'Não'}</span> },
  { key:'oee', label:'OEE', width:80, render:v=><OEEBadge oee={v} />, sortable:false },
];

export default function Maquinas() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/production/machines');
        const machines = res.data.data;
        const now = new Date();
        const mes = now.getMonth() + 1;
        const ano = now.getFullYear();
        const machinesWithOEE = await Promise.all(machines.map(async (m) => {
          try {
            const oeeRes = await api.get(`/api/production/machines/${m.id}/oee?mes=${mes}&ano=${ano}`);
            return { ...m, oee: oeeRes.data.data.oee };
          } catch {
            return { ...m, oee: null };
          }
        }));
        if (mounted) setData(machinesWithOEE);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const stats = useMemo(() => {
    const total = data.length;
    const ativos = data.filter(m=>m.active).length;
    return { total, ativos };
  }, [data]);

  return (
    <div>
      <PageHeader title="Máquinas e Equipamentos" breadcrumbs={['Início','Produção','Máquinas']}
        actions={<button className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Nova Máquina</button>}
      />
      <div className="grid grid-cols-3 gap-3 mb-3">
        {[
          {label:'Total',val:stats.total,color:'text-foreground'},
          {label:'Ativas',val:stats.ativos,color:'text-success'},
          {label:'Inativas',val:stats.total - stats.ativos,color:'text-red-600'},
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