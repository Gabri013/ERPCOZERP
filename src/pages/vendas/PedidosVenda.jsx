import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ModalPedidoVenda from '@/components/vendas/ModalPedidoVenda';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus, Download, Printer, CheckCircle, AlertTriangle } from 'lucide-react';
import { storage } from '@/services/storage';
import { aprovarPedido, CONFIG } from '@/services/businessLogic';
import { exportPdfReport } from '@/services/pdfExport';

const MOCK_INICIAL = [
  { id:'1', numero:'PV-00542', cliente_nome:'Metalúrgica ABC Ltda', data_emissao:'2026-04-18', data_entrega:'2026-04-30', vendedor:'Carlos Silva', valor_total:45200, status:'Aprovado', forma_pagamento:'Boleto 30 dias', itens:[], observacoes:'' },
  { id:'2', numero:'PV-00541', cliente_nome:'Ind. XYZ S/A', data_emissao:'2026-04-17', data_entrega:'2026-04-28', vendedor:'Ana Paula', valor_total:12800, status:'Em Produção', forma_pagamento:'À Vista', itens:[], observacoes:'' },
  { id:'3', numero:'PV-00540', cliente_nome:'Comércio Beta', data_emissao:'2026-04-16', data_entrega:'2026-04-25', vendedor:'Carlos Silva', valor_total:8900, status:'Faturado', forma_pagamento:'Boleto 30/60', itens:[], observacoes:'' },
  { id:'4', numero:'PV-00539', cliente_nome:'Grupo Delta', data_emissao:'2026-04-15', data_entrega:'2026-04-22', vendedor:'Rafael Costa', valor_total:31500, status:'Entregue', forma_pagamento:'Boleto 30/60/90', itens:[], observacoes:'' },
  { id:'5', numero:'PV-00538', cliente_nome:'TechParts Ltda', data_emissao:'2026-04-14', data_entrega:'2026-04-29', vendedor:'Ana Paula', valor_total:6700, status:'Orçamento', forma_pagamento:'À Vista', itens:[], observacoes:'' },
  { id:'6', numero:'PV-00537', cliente_nome:'Força Metais', data_emissao:'2026-04-13', data_entrega:'2026-04-20', vendedor:'Carlos Silva', valor_total:22100, status:'Aprovado', forma_pagamento:'Boleto 30 dias', itens:[], observacoes:'' },
];

if (!localStorage.getItem('nomus_erp_pedidos')) storage.set('pedidos', MOCK_INICIAL);

const getData = () => storage.get('pedidos', MOCK_INICIAL);
const saveData = (d) => storage.set('pedidos', d);
const fmtR = v => `R$ ${Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
const fmtD = v => v ? new Date(v+'T00:00').toLocaleDateString('pt-BR') : '—';

export default function PedidosVenda() {
  const [data, setData] = useState(getData());
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalhe, setDetalhe] = useState(null);

  const reload = () => setData([...getData()]);

  const handleSave = (form) => {
    const all = getData();
    if (editando) {
      saveData(all.map(p => p.id === editando.id ? { ...editando, ...form } : p));
    } else {
      const nextNum = `PV-${String(all.length + 543).padStart(5,'0')}`;
      saveData([{ ...form, id: Date.now().toString(), numero: nextNum }, ...all]);
    }
    reload();
    setEditando(null);
  };

  const handleAprovar = (pedidoId) => {
    const resultado = aprovarPedido(pedidoId);
    reload();
    setDetalhe(null);
    if (resultado.precisaAprovacao) {
      alert(`Pedido acima de R$ ${CONFIG.LIMITE_APROVACAO.toLocaleString('pt-BR')} — enviado para aprovação gerencial.\nAcesse: Financeiro → Aprovação de Pedidos.`);
    }
  };

  const handleExportar = () => {
    exportPdfReport({
      title: 'Pedidos de Venda',
      subtitle: 'Listagem consolidada de pedidos cadastrados no ERP',
      filename: 'pedidos-venda.pdf',
      table: {
        headers: ['Número', 'Cliente', 'Emissão', 'Entrega', 'Vendedor', 'Valor Total', 'Status'],
        rows: getData().map((pedido) => [
          pedido.numero,
          pedido.cliente_nome,
          fmtD(pedido.data_emissao),
          fmtD(pedido.data_entrega),
          pedido.vendedor,
          fmtR(pedido.valor_total),
          pedido.status,
        ]),
      },
    });
  };

  const filtered = data.filter(p => {
    const s = search.toLowerCase();
    return (!s || p.numero?.toLowerCase().includes(s) || p.cliente_nome?.toLowerCase().includes(s))
      && (!filters.status || p.status === filters.status)
      && (!filters.vendedor || p.vendedor === filters.vendedor);
  });

  const columns = [
    { key:'numero', label:'Número', width:100, render:(v,row)=><button className="text-primary hover:underline font-medium" onClick={e=>{e.stopPropagation();setDetalhe(row)}}>{v}</button> },
    { key:'cliente_nome', label:'Cliente' },
    { key:'data_emissao', label:'Emissão', width:90, render:fmtD },
    { key:'data_entrega', label:'Entrega', width:90, render:fmtD },
    { key:'vendedor', label:'Vendedor', width:120 },
    { key:'valor_total', label:'Valor Total', width:120, render:fmtR },
    { key:'status', label:'Status', width:120, render:v=><StatusBadge status={v}/>, sortable:false },
  ];

  const vendedores = [...new Set(data.map(p=>p.vendedor).filter(Boolean))];

  return (
    <div>
      <PageHeader title="Pedidos de Venda" breadcrumbs={['Início','Vendas','Pedidos de Venda']}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={()=>window.print()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"><Printer size={13}/> Imprimir</button>
            <button onClick={handleExportar} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"><Download size={13}/> Exportar</button>
            <button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs nomus-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Novo Pedido</button>
          </div>
        }
      />
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
        {[
          {label:'Total',val:data.length,color:'text-foreground'},
          {label:'Orçamento',val:data.filter(p=>p.status==='Orçamento').length,color:'text-muted-foreground'},
          {label:'Aprovado',val:data.filter(p=>p.status==='Aprovado').length,color:'text-blue-600'},
          {label:'Em Produção',val:data.filter(p=>p.status==='Em Produção').length,color:'text-orange-600'},
          {label:'Faturado',val:data.filter(p=>p.status==='Faturado').length,color:'text-purple-600'},
          {label:'Entregue',val:data.filter(p=>p.status==='Entregue').length,color:'text-green-600'},
        ].map(s=>(
          <div key={s.label} className="bg-white border border-border rounded px-3 py-2 text-center">
            <div className={`text-lg font-bold ${s.color}`}>{s.val}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar search={search} onSearch={setSearch}
          filters={[
            {key:'status',label:'Status',options:['Orçamento','Aprovado','Em Produção','Faturado','Entregue','Cancelado'].map(s=>({value:s,label:s}))},
            {key:'vendedor',label:'Vendedor',options:vendedores.map(v=>({value:v,label:v}))},
          ]}
          activeFilters={filters} onFilterChange={(k,v)=>setFilters(f=>({...f,[k]:v}))} onClear={()=>{setSearch('');setFilters({});}}
        />
        <DataTable columns={columns} data={filtered} onRowClick={row=>setDetalhe(row)}/>
      </div>

      {(showModal || editando) && (
        <ModalPedidoVenda pedido={editando} onClose={()=>{setShowModal(false);setEditando(null);}} onSave={handleSave}/>
      )}

      {detalhe && (
        <DetalheModal title={`Pedido — ${detalhe.numero}`} subtitle={detalhe.cliente_nome}
          onClose={()=>setDetalhe(null)} onExport={()=>exportPdfReport({
            title: `Pedido ${detalhe.numero}`,
            subtitle: detalhe.cliente_nome,
            filename: `${detalhe.numero}.pdf`,
            fields: [
              { label: 'Número', value: detalhe.numero },
              { label: 'Cliente', value: detalhe.cliente_nome },
              { label: 'Vendedor', value: detalhe.vendedor },
              { label: 'Forma Pagamento', value: detalhe.forma_pagamento || '—' },
              { label: 'Status', value: detalhe.status },
              { label: 'Emissão', value: fmtD(detalhe.data_emissao) },
              { label: 'Entrega', value: fmtD(detalhe.data_entrega) },
              { label: 'Valor Total', value: fmtR(detalhe.valor_total) },
            ],
            sections: detalhe.observacoes ? [{ title: 'Observações', fields: [{ label: 'Observação', value: detalhe.observacoes }] }] : [],
            preview: true,
          })}>
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div className="space-y-2">
              {[['Número',detalhe.numero],['Cliente',detalhe.cliente_nome],['Vendedor',detalhe.vendedor],['Forma Pagamento',detalhe.forma_pagamento||'—']].map(([k,v])=>(
                <div key={k} className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
              ))}
            </div>
            <div className="space-y-2">
              {[['Status',detalhe.status],['Emissão',fmtD(detalhe.data_emissao)],['Entrega',fmtD(detalhe.data_entrega)],['Valor Total',fmtR(detalhe.valor_total)]].map(([k,v])=>(
                <div key={k} className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
              ))}
            </div>
            {detalhe.observacoes && <div className="col-span-2"><div className="text-muted-foreground mb-1">Observações</div><div className="bg-muted rounded p-2">{detalhe.observacoes}</div></div>}
          </div>
          {detalhe.valor_total > CONFIG.LIMITE_APROVACAO && detalhe.status === 'Aguardando Aprovação' && (
            <div className="mt-3 flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded px-3 py-2 text-xs text-yellow-800">
              <AlertTriangle size={12}/> Valor acima de {fmtR(CONFIG.LIMITE_APROVACAO)} — requer aprovação gerencial
            </div>
          )}
          <div className="mt-3 flex justify-end gap-2">
            {(detalhe.status === 'Orçamento') && (
              <button onClick={()=>handleAprovar(detalhe.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:opacity-90"><CheckCircle size={12}/> Aprovar Pedido</button>
            )}
            <button onClick={()=>{setEditando(detalhe);setDetalhe(null);}} className="px-3 py-1.5 text-xs nomus-blue-bg text-white rounded hover:opacity-90">Editar</button>
          </div>
        </DetalheModal>
      )}
    </div>
  );
}