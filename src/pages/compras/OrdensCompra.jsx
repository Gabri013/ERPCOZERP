import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ModalOrdemCompra from '@/components/compras/ModalOrdemCompra';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus, Download } from 'lucide-react';
import { storage } from '@/services/storage';
import { exportPdfReport } from '@/services/pdfExport';

const MOCK_INICIAL = [
  { id:'1', numero:'OC-00231', fornecedor_nome:'Rolamentos Nacionais Ltda', data_emissao:'2026-04-15', data_entrega_prevista:'2026-04-22', valor_total:4100.00, status:'Recebida', itens:[], observacoes:'' },
  { id:'2', numero:'OC-00230', fornecedor_nome:'AçoFlex Distribuidora', data_emissao:'2026-04-14', data_entrega_prevista:'2026-04-21', valor_total:16800.00, status:'Recebida', itens:[], observacoes:'' },
  { id:'3', numero:'OC-00229', fornecedor_nome:'Fixadores do Brasil', data_emissao:'2026-04-13', data_entrega_prevista:'2026-04-25', valor_total:3250.00, status:'Enviada', itens:[], observacoes:'' },
  { id:'4', numero:'OC-00228', fornecedor_nome:'Motores Elite S/A', data_emissao:'2026-04-12', data_entrega_prevista:'2026-04-28', valor_total:12760.00, status:'Enviada', itens:[], observacoes:'' },
  { id:'5', numero:'OC-00227', fornecedor_nome:'Correias e Polias Ltda', data_emissao:'2026-04-10', data_entrega_prevista:'2026-04-17', valor_total:1980.00, status:'Parcialmente Recebida', itens:[], observacoes:'' },
];

if (!localStorage.getItem('nomus_erp_ordens_compra')) storage.set('ordens_compra', MOCK_INICIAL);
const getData = () => storage.get('ordens_compra', MOCK_INICIAL);
const saveData = d => storage.set('ordens_compra', d);
const fmtR = v => `R$ ${Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
const fmtD = v => v ? new Date(v+'T00:00').toLocaleDateString('pt-BR') : '—';

export default function OrdensCompra() {
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
      const numero = `OC-${String(all.length + 232).padStart(5,'0')}`;
      saveData([{...form, id:Date.now().toString(), numero}, ...all]);
    }
    reload();
    setEditando(null);
  };

  const filtered = data.filter(o => {
    const s = search.toLowerCase();
    return (!s || o.numero?.toLowerCase().includes(s) || o.fornecedor_nome?.toLowerCase().includes(s))
      && (!filters.status || o.status === filters.status);
  });

  const columns = [
    { key:'numero', label:'Número', width:100, render:(v,row)=><button className="text-primary hover:underline font-medium" onClick={e=>{e.stopPropagation();setDetalhe(row)}}>{v}</button> },
    { key:'fornecedor_nome', label:'Fornecedor' },
    { key:'data_emissao', label:'Emissão', width:90, render:fmtD },
    { key:'data_entrega_prevista', label:'Prev. Entrega', width:100, render:fmtD },
    { key:'valor_total', label:'Valor Total', width:110, render:fmtR },
    { key:'status', label:'Status', width:160, render:v=><StatusBadge status={v}/>, sortable:false },
  ];

  return (
    <div>
      <PageHeader title="Ordens de Compra" breadcrumbs={['Início','Compras','Ordens de Compra']}
        actions={
          <div className="flex gap-2">
            <button onClick={()=>exportPdfReport({
              title: 'Ordens de Compra',
              subtitle: 'Compras emitidas e recebidas no ERP',
              filename: 'ordens-compra.pdf',
              table: {
                headers: ['Número', 'Fornecedor', 'Emissão', 'Prev. Entrega', 'Valor Total', 'Status'],
                rows: getData().map((ordem) => [
                  ordem.numero,
                  ordem.fornecedor_nome,
                  fmtD(ordem.data_emissao),
                  fmtD(ordem.data_entrega_prevista),
                  fmtR(ordem.valor_total),
                  ordem.status,
                ]),
              },
            })} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"><Download size={13}/> Exportar PDF</button>
            <button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs nomus-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Nova OC</button>
          </div>
        }
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar search={search} onSearch={setSearch}
          filters={[{key:'status',label:'Status',options:['Rascunho','Enviada','Parcialmente Recebida','Recebida','Cancelada'].map(s=>({value:s,label:s}))}]}
          activeFilters={filters} onFilterChange={(k,v)=>setFilters(f=>({...f,[k]:v}))} onClear={()=>{setSearch('');setFilters({});}}
        />
        <DataTable columns={columns} data={filtered} onRowClick={row=>setDetalhe(row)}/>
      </div>

      {(showModal || editando) && (
        <ModalOrdemCompra oc={editando} onClose={()=>{setShowModal(false);setEditando(null);}} onSave={handleSave}/>
      )}

      {detalhe && (
        <DetalheModal title={`OC — ${detalhe.numero}`} subtitle={detalhe.fornecedor_nome} onClose={()=>setDetalhe(null)} onExport={()=>exportPdfReport({
          title: `Ordem de Compra ${detalhe.numero}`,
          subtitle: detalhe.fornecedor_nome,
          filename: `${detalhe.numero}.pdf`,
          fields: [
            { label: 'Número', value: detalhe.numero },
            { label: 'Fornecedor', value: detalhe.fornecedor_nome },
            { label: 'Status', value: detalhe.status },
            { label: 'Emissão', value: fmtD(detalhe.data_emissao) },
            { label: 'Prev. Entrega', value: fmtD(detalhe.data_entrega_prevista) },
            { label: 'Valor Total', value: fmtR(detalhe.valor_total) },
          ],
          sections: detalhe.observacoes ? [{ title: 'Observações', fields: [{ label: 'Observação', value: detalhe.observacoes }] }] : [],
          preview: true,
        })}>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[['Número',detalhe.numero],['Fornecedor',detalhe.fornecedor_nome],['Status',detalhe.status],['Emissão',fmtD(detalhe.data_emissao)],['Prev. Entrega',fmtD(detalhe.data_entrega_prevista)],['Valor Total',fmtR(detalhe.valor_total)]].map(([k,v])=>(
              <div key={k} className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>
          {detalhe.observacoes && <div className="mt-3 text-xs"><div className="text-muted-foreground mb-1">Observações</div><div className="bg-muted rounded p-2">{detalhe.observacoes}</div></div>}
          <div className="mt-3 flex justify-end"><button onClick={()=>{setEditando(detalhe);setDetalhe(null);}} className="px-3 py-1.5 text-xs nomus-blue-bg text-white rounded hover:opacity-90">Editar</button></div>
        </DetalheModal>
      )}
    </div>
  );
}