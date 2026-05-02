import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ModalPedidoVenda from '@/components/vendas/ModalPedidoVenda';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus, Download } from 'lucide-react';
import { exportPdfReport } from '@/services/pdfExport';
import { orcamentosServiceApi } from '@/services/orcamentosServiceApi';
import { cozincaApi } from '@/services/cozincaApi';
import { toast } from 'sonner';

const fmtR = v => `R$ ${Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
const fmtD = v => v ? new Date(v+'T00:00').toLocaleDateString('pt-BR') : '—';

export default function Orcamentos() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalhe, setDetalhe] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const rows = await orcamentosServiceApi.getAll();
      setData(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (form) => {
    if (editando?.id) {
      await orcamentosServiceApi.update(editando.id, { ...editando, ...form });
    } else {
      await orcamentosServiceApi.create(form);
    }
    await load();
    setEditando(null);
  };

  const aprovar = async (row) => {
    if (!row?.id) return;
    await orcamentosServiceApi.update(row.id, { ...row, status: 'Aprovado' });
    await load();
    setDetalhe(null);
  };

  const gerarPedido = async (row) => {
    if (!row?.id) return;
    try {
      const pedido = await cozincaApi.gerarPedidoDeOrcamento(row.id);
      toast.success(`Pedido ${pedido?.numero || ''} gerado e CRM atualizado quando aplicável.`);
      await load();
      setDetalhe(null);
    } catch (e) {
      toast.error(e?.message || 'Falha ao gerar pedido.');
    }
  };

  const filtered = useMemo(() => {
    return data.filter(p => {
      const s = search.toLowerCase();
      return (!s || p.numero?.toLowerCase().includes(s) || p.cliente_nome?.toLowerCase().includes(s))
        && (!filters.status || p.status === filters.status);
    });
  }, [data, search, filters.status]);

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
                rows: data.map((orcamento) => [
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
        <DataTable columns={columns} data={filtered} onRowClick={row=>setDetalhe(row)} loading={loading}/>
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
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            {detalhe.status === 'Orçamento' && <button type="button" onClick={()=>aprovar(detalhe)} className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:opacity-90">✓ Aprovar</button>}
            <button type="button" onClick={()=>gerarPedido(detalhe)} className="px-3 py-1.5 text-xs border border-border rounded hover:bg-muted">Gerar pedido de venda</button>
            <button type="button" onClick={()=>{setEditando(detalhe);setDetalhe(null);}} className="px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90">Editar</button>
          </div>
        </DetalheModal>
      )}
    </div>
  );
}