import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ModalLancamento from '@/components/financeiro/ModalLancamento';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus, DollarSign, CheckCircle } from 'lucide-react';
import { storage } from '@/services/storage';

const MOCK_INICIAL = [
  { id:'1', numero:'PAG-001', descricao:'OC-00231 - Rolamentos Nacionais', cliente_fornecedor:'Rolamentos Nacionais Ltda', valor:4100.00, data_emissao:'2026-04-15', data_vencimento:'2026-04-25', status:'Aberto', categoria:'Fornecedor' },
  { id:'2', numero:'PAG-002', descricao:'Aluguel Galpão Industrial', cliente_fornecedor:'Imóveis Galpão', valor:12000.00, data_emissao:'2026-04-01', data_vencimento:'2026-04-30', status:'Aberto', categoria:'Aluguel' },
  { id:'3', numero:'PAG-003', descricao:'Energia Elétrica Março', cliente_fornecedor:'CPFL', valor:3840.00, data_emissao:'2026-04-10', data_vencimento:'2026-04-18', status:'Pago', categoria:'Utilidades' },
  { id:'4', numero:'PAG-004', descricao:'OC-00228 - Motores Elite', cliente_fornecedor:'Motores Elite S/A', valor:12760.00, data_emissao:'2026-04-12', data_vencimento:'2026-05-10', status:'Aberto', categoria:'Fornecedor' },
  { id:'5', numero:'PAG-005', descricao:'Salários Abril', cliente_fornecedor:'Folha de Pagamento', valor:38500.00, data_emissao:'2026-04-01', data_vencimento:'2026-04-30', status:'Aberto', categoria:'RH' },
  { id:'6', numero:'PAG-006', descricao:'Telefone/Internet', cliente_fornecedor:'Vivo Empresas', valor:890.00, data_emissao:'2026-04-05', data_vencimento:'2026-04-15', status:'Vencido', categoria:'Utilidades' },
];

if (!localStorage.getItem('nomus_erp_contas_pagar')) storage.set('contas_pagar', MOCK_INICIAL);
const getData = () => storage.get('contas_pagar', MOCK_INICIAL);
const saveData = d => storage.set('contas_pagar', d);
const fmtR = v => `R$ ${Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
const fmtD = v => v ? new Date(v+'T00:00').toLocaleDateString('pt-BR') : '—';

export default function ContasPagar() {
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
      saveData(all.map(c => c.id === editando.id ? {...editando,...form} : c));
    } else {
      const numero = `PAG-${String(all.length + 7).padStart(3,'0')}`;
      saveData([{...form, tipo:'Pagar', id:Date.now().toString(), numero}, ...all]);
    }
    reload();
    setEditando(null);
  };

  const marcarPago = (id) => {
    saveData(getData().map(c => c.id === id ? {...c, status:'Pago', data_pagamento:new Date().toISOString().slice(0,10)} : c));
    reload();
    setDetalhe(null);
  };

  const filtered = data.filter(c => {
    const s = search.toLowerCase();
    return (!s || c.descricao?.toLowerCase().includes(s) || c.cliente_fornecedor?.toLowerCase().includes(s))
      && (!filters.status || c.status === filters.status)
      && (!filters.categoria || c.categoria === filters.categoria);
  });

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
        actions={<button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs nomus-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Novo Lançamento</button>}
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
        <DataTable columns={columns} data={filtered} onRowClick={row=>setDetalhe(row)}/>
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
            <button onClick={()=>{setEditando(detalhe);setDetalhe(null);}} className="px-3 py-1.5 text-xs nomus-blue-bg text-white rounded hover:opacity-90">Editar</button>
          </div>
        </DetalheModal>
      )}
    </div>
  );
}