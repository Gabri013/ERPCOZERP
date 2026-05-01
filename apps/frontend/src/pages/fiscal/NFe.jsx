import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Plus, FileText } from 'lucide-react';
import { recordsServiceApi } from '@/services/recordsServiceApi';

const statusCor = {'Autorizada':'bg-green-100 text-green-700','Cancelada':'bg-red-100 text-red-700','Em Digitação':'bg-yellow-100 text-yellow-700','Rejeitada':'bg-orange-100 text-orange-700'};

const columns = [
  { key:'numero', label:'Número', width:120 },
  { key:'serie', label:'Série', width:50 },
  { key:'destinatario', label:'Destinatário' },
  { key:'cnpj', label:'CNPJ', width:150 },
  { key:'data_emissao', label:'Emissão', width:90, render:v=>v?new Date(v+'T00:00').toLocaleDateString('pt-BR'):'—' },
  { key:'valor', label:'Valor', width:110, render:v=>`R$ ${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2})}` },
  { key:'status', label:'Status', width:110, render:v=><span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${statusCor[v]||'bg-gray-100 text-gray-600'}`}>{v}</span>, sortable:false },
];

export default function NFe() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const rows = await recordsServiceApi.list('fiscal_nfe');
        if (mounted) setData(rows);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <PageHeader title="Emissão de NF-e" breadcrumbs={['Início','Fiscal','NF-e Emissão']}
        actions={<div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"><FileText size={13}/> Importar XML</button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Nova NF-e</button>
        </div>}
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <DataTable columns={columns} data={data} loading={loading} />
      </div>
    </div>
  );
}