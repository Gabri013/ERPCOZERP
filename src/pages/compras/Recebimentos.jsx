import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Plus } from 'lucide-react';
import { recordsServiceApi } from '@/services/recordsServiceApi';

const statusMap = {'Conferido':'bg-green-100 text-green-700','Divergência':'bg-red-100 text-red-700','Aguardando NF':'bg-yellow-100 text-yellow-700'};

const columns = [
  { key:'numero', label:'Número', width:90 },
  { key:'ordem_compra', label:'Ordem Compra', width:120 },
  { key:'fornecedor', label:'Fornecedor' },
  { key:'data_recebimento', label:'Recebido em', width:100, render:v=>v?new Date(v+'T00:00').toLocaleDateString('pt-BR'):'—' },
  { key:'nf', label:'Nota Fiscal', width:100, render:v=>v||'—' },
  { key:'valor', label:'Valor', width:110, render:v=>`R$ ${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2})}` },
  { key:'conferente', label:'Conferente', width:100, render:v=>v||'—' },
  { key:'status', label:'Status', width:110, render:v=><span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${statusMap[v]||'bg-gray-100 text-gray-600'}`}>{v}</span>, sortable:false },
];

export default function Recebimentos() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const rows = await recordsServiceApi.list('compras_recebimento');
        if (mounted) setData(rows);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <PageHeader title="Recebimentos" breadcrumbs={['Início','Compras','Recebimentos']}
        actions={<button className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Registrar Recebimento</button>}
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <DataTable columns={columns} data={data} loading={loading} />
      </div>
    </div>
  );
}