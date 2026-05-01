import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ModalLancamento from '@/components/financeiro/ModalLancamento';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus, DollarSign, CheckCircle } from 'lucide-react';
import { contasPagarService } from '@/services/financeiroService';

const fmtR = v => `R$ ${Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
const fmtD = v => v ? new Date(v+'T00:00').toLocaleDateString('pt-BR') : '—';

export default function ContasPagar() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try {
      const rows = await contasPagarService.getAll();
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
      await contasPagarService.update(editando.id, { ...editando, ...form });
    } else {
      await contasPagarService.create(form);
    }
    await reload();
    setEditando(null);
  };

  const marcarPago = async (id) => {
    const target = data.find(c => c.id === id);
    if (!target) return;
    await contasPagarService.update(id, { ...target, status: 'Pago' });
    await reload();
    setDetalhe(null);
  };

  const filtered = useMemo(() => data.filter(c => {
    const s = search.toLowerCase();
    return (!s || c.descricao?.toLowerCase().includes(s) || c.cliente_fornecedor?.toLowerCase().includes(s))
      && (!filters.status || c.status === filters.status)
      && (!filters.categoria || c.categoria === filters.categoria);
  }), [data, search, filters]);

  const totalAberto = data.filter(c=>c.status==='Aberto').reduce((s,c)=>s+(c.valor||0),0);
  const totalVencido = data.filter(c=>c.status==='Vencido').reduce((s,c)=>s+(c.valor||0),0);
  const totalPago = data.filter(c=>c.status==='Pago').reduce((s,c)=>s+(c.valor||0),0);

  const columns = [
    { key:'numero', label:'Número', width:90, render:(v,row)=><button className="text-primary hover:underline font-medium" onClick={e=>{e.stopPropagation();setDetalhe(row)}}>{v}</button> },
    { key:'descricao', label:'Descrição' },
    { key:'cliente_fornecedor', label:'Fornecedor', width:180 },
    { key:'categoria', label:'Categoria', width:100 },
    { key:'valor', label:'Valor', width:110, render:fmtR },
    { key:'data_vencimento', label:'Vencimento', width:100, render:fmtD },
    { key:'status', label:'Status', width:80, render:v=><StatusBadge status={v}/>, sortable:false },
  ];

  return (
    <div>
      <PageHeader title="Contas a Pagar" breadcrumbs={['Início','Financeiro','Contas a Pagar']}
        actions={<button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Novo Lançamento</button>}
      />
      <div className="grid grid-cols-3 gap-3 mb-3">
        {[{label:'Em Aberto',val:fmtR(totalAberto),color:'text-blue-600',bg:'bg-blue-50'},{label:'Vencido',val:fmtR(totalVencido),color:'text-destructive',bg:'bg-red-50'},{label:'Pago (mês)',val:fmtR(totalPago),color:'text-success',bg:'bg-green-50'}].map(s=>(
          <div key={s.label} className={`${s.bg} border border-border rounded px-4 py-3 flex items-center gap-3`}>
            <DollarSign size={18} className={s.color}/>
            <div><div className={`text-base font-bold ${s.color}`}>{s.val}</div><div className="text-[11px] text-muted-foreground">{s.label}</div></div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar search={search} onSearch={setSearch}
          filters={[
            {key:'status',label:'Status',options:['Aberto','Pago','Vencido','Cancelado'].map(s=>({value:s,label:s}))},
            {key:'categoria',label:'Categoria',options:['Fornecedor','Aluguel','Utilidades','RH','Imposto','Outros'].map(s=>({value:s,label:s}))},
          ]}
          activeFilters={filters} onFilterChange={(k,v)=>setFilters(f=>({...f,[k]:v}))} onClear={()=>{setSearch('');setFilters({});}}
        />
        <DataTable columns={columns} data={filtered} onRowClick={row=>setDetalhe(row)} loading={loading}/>
      </div>

      {(showModal || editando) && (
        <ModalLancamento tipo="Pagar" lancamento={editando} onClose={()=>{setShowModal(false);setEditando(null);}} onSave={handleSave}/>
      )}

      {detalhe && (
        <DetalheModal title={detalhe.numero} subtitle={detalhe.descricao} onClose={()=>setDetalhe(null)}>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[['Fornecedor',detalhe.cliente_fornecedor],['Categoria',detalhe.categoria],['Valor',fmtR(detalhe.valor)],['Status',detalhe.status],['Emissão',fmtD(detalhe.data_emissao)],['Vencimento',fmtD(detalhe.data_vencimento)]].map(([k,v])=>(
              <div key={k} className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            {detalhe.status !== 'Pago' && <button onClick={()=>marcarPago(detalhe.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:opacity-90"><CheckCircle size={12}/> Marcar como Pago</button>}
            <button
              onClick={async () => {
                if (!confirm('Excluir este lançamento?')) return;
                await contasPagarService.delete(detalhe.id);
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