import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Plus } from 'lucide-react';

const MOCK = [
  { id:'1', numero:'REC-001', ordem_compra:'OC-00231', fornecedor:'Rolamentos Nacionais Ltda', data_recebimento:'2026-04-15', nf:'12345', valor:4100, conferente:'Pedro A.', status:'Conferido' },
  { id:'2', numero:'REC-002', ordem_compra:'OC-00228', fornecedor:'Motores Elite S/A', data_recebimento:'2026-04-12', nf:'67890', valor:12760, conferente:'João M.', status:'Conferido' },
  { id:'3', numero:'REC-003', ordem_compra:'OC-00230', fornecedor:'AçoFlex Distribuidora', data_recebimento:'2026-04-18', nf:'11223', valor:8200, conferente:'Maria L.', status:'Divergência' },
  { id:'4', numero:'REC-004', ordem_compra:'OC-00232', fornecedor:'Fixadores do Brasil', data_recebimento:'2026-04-20', nf:null, valor:1540, conferente:null, status:'Aguardando NF' },
];

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
  return (
    <div>
      <PageHeader title="Recebimentos" breadcrumbs={['Início','Compras','Recebimentos']}
        actions={<button className="flex items-center gap-1.5 px-3 py-1.5 text-xs nomus-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Registrar Recebimento</button>}
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <DataTable columns={columns} data={MOCK} />
      </div>
    </div>
  );
}