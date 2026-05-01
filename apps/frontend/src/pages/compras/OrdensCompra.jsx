import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ModalOrdemCompra from '@/components/compras/ModalOrdemCompra';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus, Download } from 'lucide-react';
import { exportPdfReport } from '@/services/pdfExport';
import { ordensCompraServiceApi } from '@/services/ordensCompraServiceApi';

const fmtR = v => `R$ ${Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
const fmtD = v => v ? new Date(v+'T00:00').toLocaleDateString('pt-BR') : '—';

export default function OrdensCompra() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = async (opts = {}) => {
    setLoading(true);
    try {
      const rows = await ordensCompraServiceApi.getAll({
        search: opts.search ?? search,
        status: opts.status ?? filters.status ?? '',
      });
      setData(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
     
  }, []);

  const handleSave = async (form) => {
    if (editando?.id) {
      await ordensCompraServiceApi.update(editando.id, { ...editando, ...form });
    } else {
      await ordensCompraServiceApi.create(form);
    }
    await reload();
    setEditando(null);
  };

  const filtered = useMemo(() => data.filter(o => {
    const s = search.toLowerCase();
    return (!s || o.numero?.toLowerCase().includes(s) || o.fornecedor_nome?.toLowerCase().includes(s))
      && (!filters.status || o.status === filters.status);
  }), [data, search, filters]);

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
                rows: data.map((ordem) => [
                  ordem.numero,
                  ordem.fornecedor_nome,
                  fmtD(ordem.data_emissao),
                  fmtD(ordem.data_entrega_prevista),
                  fmtR(ordem.valor_total),
                  ordem.status,
                ]),
              },
            })} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"><Download size={13}/> Exportar PDF</button>
            <button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Nova OC</button>
          </div>
        }
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar search={search} onSearch={setSearch}
          filters={[{key:'status',label:'Status',options:['Rascunho','Enviada','Parcialmente Recebida','Recebida','Cancelada'].map(s=>({value:s,label:s}))}]}
          activeFilters={filters}
          onFilterChange={(k,v)=>setFilters(f=>({...f,[k]:v}))}
          onClear={()=>{setSearch('');setFilters({}); reload({ search:'', status:'' });}}
        />
        <DataTable columns={columns} data={filtered} onRowClick={row=>setDetalhe(row)} loading={loading}/>
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
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={async () => {
                if (!confirm('Excluir esta OC?')) return;
                await ordensCompraServiceApi.delete(detalhe.id);
                setDetalhe(null);
                await reload();
              }}
              className="px-3 py-1.5 text-xs bg-destructive text-white rounded hover:opacity-90"
            >
              Excluir
            </button>
            <button onClick={()=>{setEditando(detalhe);setDetalhe(null);}} className="px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90">Editar</button>
          </div>
        </DetalheModal>
      )}
    </div>
  );
}