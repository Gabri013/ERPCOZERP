import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import { Plus } from 'lucide-react';

const MOCK = [
  { id:'1', numero:'COT-0041', descricao:'Rolamentos diversos', fornecedor:'Rolamentos Nacionais Ltda', data_envio:'2026-04-10', validade:'2026-04-25', valor:4100, status:'Recebida' },
  { id:'2', numero:'COT-0040', descricao:'Rolamentos diversos', fornecedor:'Distribuidora Sul Ltda', data_envio:'2026-04-10', validade:'2026-04-25', valor:4380, status:'Recebida' },
  { id:'3', numero:'COT-0039', descricao:'Motores elétricos 5cv', fornecedor:'Motores Elite S/A', data_envio:'2026-04-08', validade:'2026-04-22', valor:12760, status:'Aprovada' },
  { id:'4', numero:'COT-0038', descricao:'Motores elétricos 5cv', fornecedor:'WEG Distribuidora', data_envio:'2026-04-08', validade:'2026-04-22', valor:13900, status:'Recebida' },
  { id:'5', numero:'COT-0037', descricao:'Parafusos M12 inox', fornecedor:'Fixadores do Brasil', data_envio:'2026-04-05', validade:'2026-04-19', valor:280, status:'Pendente' },
];

const statusMap = {'Recebida':'bg-blue-100 text-blue-700','Aprovada':'bg-green-100 text-green-700','Pendente':'bg-yellow-100 text-yellow-700','Cancelada':'bg-red-100 text-red-700'};

const columns = [
  { key:'numero', label:'Número', width:90 },
  { key:'descricao', label:'Descrição' },
  { key:'fornecedor', label:'Fornecedor', width:200 },
  { key:'data_envio', label:'Enviada em', width:100, render:v=>v?new Date(v+'T00:00').toLocaleDateString('pt-BR'):'—' },
  { key:'validade', label:'Validade', width:90, render:v=>v?new Date(v+'T00:00').toLocaleDateString('pt-BR'):'—' },
  { key:'valor', label:'Valor', width:110, render:v=>`R$ ${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2})}` },
  { key:'status', label:'Status', width:90, render:v=><span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${statusMap[v]||'bg-gray-100 text-gray-600'}`}>{v}</span>, sortable:false },
];

export default function Cotacoes() {
  return (
    <div>
      <PageHeader title="Cotações" breadcrumbs={['Início','Compras','Cotações']}
        actions={<button className="flex items-center gap-1.5 px-3 py-1.5 text-xs nomus-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Nova Cotação</button>}
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <DataTable columns={columns} data={MOCK} />
      </div>
    </div>
  );
}