import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ModalPedidoVenda from '@/components/vendas/ModalPedidoVenda';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus, Download } from 'lucide-react';
import { storage } from '@/services/storage';
import { exportPdfReport } from '@/services/pdfExport';

const MOCK_INICIAL = [
  { id:'1', numero:'ORC-00120', cliente_nome:'Metalúrgica ABC Ltda', data_emissao:'2026-04-18', validade:'2026-05-18', vendedor:'Carlos Silva', valor_total:45200, status:'Aprovado', itens:[], observacoes:'' },
  { id:'2', numero:'ORC-00119', cliente_nome:'SiderTech S/A', data_emissao:'2026-04-16', validade:'2026-05-16', vendedor:'Ana Paula', valor_total:18700, status:'Orçamento', itens:[], observacoes:'' },
  { id:'3', numero:'ORC-00118', cliente_nome:'Grupo Delta', data_emissao:'2026-04-14', validade:'2026-05-14', vendedor:'Rafael Costa', valor_total:7300, status:'Cancelado', itens:[], observacoes:'' },
  { id:'4', numero:'ORC-00117', cliente_nome:'TechParts Ltda', data_emissao:'2026-04-10', validade:'2026-05-10', vendedor:'Carlos Silva', valor_total:32100, status:'Orçamento', itens:[], observacoes:'' },
  { id:'5', numero:'ORC-00116', cliente_nome:'Comércio Beta', data_emissao:'2026-04-08', validade:'2026-05-08', vendedor:'Ana Paula', valor_total:9800, status:'Aprovado', itens:[], observacoes:'' },
];

if (!localStorage.getItem('nomus_erp_orcamentos')) storage.set('orcamentos', MOCK_INICIAL);
const getData = () => storage.get('orcamentos', MOCK_INICIAL);
const saveData = d => storage.set('orcamentos', d);
const fmtR = v => `R$ ${Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
const fmtD = v => v ? new Date(v+'T00:00').toLocaleDateString('pt-BR') : '—';

export default function Orcamentos() {
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
      saveData(all.map(o => o.id === editando.id ? {...editando,...form} : o));
    } else {
      const numero = `ORC-${String(all.length + 121).padStart(5,'0')}`;
      saveData([{...form, id:Date.now().toString(), numero}, ...all]);
    }
    reload();
    setEditando(null);
  };

  const aprovar = (id) => {
    saveData(getData().map(o => o.id === id ? {...o, status:'Aprovado'} : o));
    reload();
    setDetalhe(null);
  };

  const filtered = data.filter(p => {
    const s = search.toLowerCase();
    return (!s || p.numero?.toLowerCase().includes(s) || p.cliente_nome?.toLowerCase().includes(s))
      && (!filters.status || p.status === filters.status);
  });

  const columns = [
    { key:'numero', label:'Número', width:100, render:(v,row)=><button className="text-primary hover:underline font-medium" onClick={e=>{e.stopPropagation();setDetalhe(row)}}>{v}</button> },
    { key:'cliente_nome', label:'Cliente' },
    { key:'data_emissao', label:'Emissão', width:90, render:fmtD },
    { key:'validade', label:'Validade', width:90, render:fmtD },
    { key:'vendedor', label:'Vendedor', width:120 },
    { key:'valor_total', label:'Valor', width:110, render:fmtR },
    { key:'status', label:'Status', width:90, render:v=><StatusBadge status={v}/>, sortable:false },
  ];

  return (
    <div>
      <PageHeader title="Orçamentos" breadcrumbs={['Início','Vendas','Orçamentos']}
        actions={
          <div className="flex gap-2">
            <button onClick={()=>exportPdfReport({
              title: 'Orçamentos',
              subtitle: 'Lista de orçamentos e propostas comerciais',
              filename: 'orcamentos.pdf',
              table: {
                headers: ['Número', 'Cliente', 'Emissão', 'Validade', 'Vendedor', 'Valor', 'Status'],
                rows: getData().map((orcamento) => [
                  orcamento.numero,
                  orcamento.cliente_nome,
                  fmtD(orcamento.data_emissao),
                  fmtD(orcamento.validade),
                  orcamento.vendedor,
                  fmtR(orcamento.valor_total),
                  orcamento.status,
                ]),
              },
            })} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"><Download size={13}/> Exportar PDF</button>
            <button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Novo Orçamento</button>
          </div>
        }
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar search={search} onSearch={setSearch}
          filters={[{key:'status',label:'Status',options:['Orçamento','Aprovado','Cancelado'].map(s=>({value:s,label:s}))}]}
          activeFilters={filters} onFilterChange={(k,v)=>setFilters(f=>({...f,[k]:v}))} onClear={()=>{setSearch('');setFilters({});}}
        />
        <DataTable columns={columns} data={filtered} onRowClick={row=>setDetalhe(row)}/>
      </div>

      {(showModal || editando) && (
        <ModalPedidoVenda pedido={editando} onClose={()=>{setShowModal(false);setEditando(null);}} onSave={handleSave}/>
      )}

      {detalhe && (
        <DetalheModal title={`Orçamento — ${detalhe.numero}`} subtitle={detalhe.cliente_nome} onClose={()=>setDetalhe(null)} onExport={()=>exportPdfReport({
          title: `Orçamento ${detalhe.numero}`,
          subtitle: detalhe.cliente_nome,
          filename: `${detalhe.numero}.pdf`,
          fields: [
            { label: 'Cliente', value: detalhe.cliente_nome },
            { label: 'Vendedor', value: detalhe.vendedor },
            { label: 'Status', value: detalhe.status },
            { label: 'Emissão', value: fmtD(detalhe.data_emissao) },
            { label: 'Validade', value: fmtD(detalhe.validade) },
            { label: 'Valor', value: fmtR(detalhe.valor_total) },
          ],
          sections: detalhe.observacoes ? [{ title: 'Observações', fields: [{ label: 'Observação', value: detalhe.observacoes }] }] : [],
          preview: true,
        })}>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[['Cliente',detalhe.cliente_nome],['Vendedor',detalhe.vendedor],['Status',detalhe.status],['Emissão',fmtD(detalhe.data_emissao)],['Validade',fmtD(detalhe.validade)],['Valor',fmtR(detalhe.valor_total)]].map(([k,v])=>(
              <div key={k} className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            {detalhe.status === 'Orçamento' && <button onClick={()=>aprovar(detalhe.id)} className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:opacity-90">✓ Aprovar</button>}
            <button onClick={()=>{setEditando(detalhe);setDetalhe(null);}} className="px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90">Editar</button>
          </div>
        </DetalheModal>
      )}
    </div>
  );
}