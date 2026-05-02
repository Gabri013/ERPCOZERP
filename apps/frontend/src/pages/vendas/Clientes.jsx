import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ModalCliente from '@/components/vendas/ModalCliente';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus, Download } from 'lucide-react';
import { exportPdfReport } from '@/services/pdfExport';
import { clientesServiceApi } from '@/services/clientesServiceApi';

const fmtR = v => v ? `R$ ${Number(v).toLocaleString('pt-BR')}` : '—';

export default function Clientes() {
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
      const rows = await clientesServiceApi.getAll({
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
      await clientesServiceApi.update(editando.id, { ...editando, ...form });
    } else {
      await clientesServiceApi.create(form);
    }
    await reload();
    setEditando(null);
  };

  const handleExportar = () => {
    exportPdfReport({
      title: 'Clientes',
      subtitle: 'Cadastro de clientes e limites comerciais',
      filename: 'clientes.pdf',
      table: {
        headers: ['Código', 'Razão Social', 'Fantasia', 'CNPJ/CPF', 'Cidade', 'UF', 'Telefone', 'Limite Crédito', 'Status'],
        rows: data.map((cliente) => [
          cliente.codigo,
          cliente.razao_social,
          cliente.nome_fantasia,
          cliente.cnpj_cpf,
          cliente.cidade,
          cliente.estado,
          cliente.telefone,
          fmtR(cliente.limite_credito),
          cliente.status,
        ]),
      },
    });
  };

  const filtered = useMemo(() => data.filter(c => {
    const s = search.toLowerCase();
    return (!s || c.razao_social?.toLowerCase().includes(s) || c.cnpj_cpf?.includes(s) || c.codigo?.includes(s))
      && (!filters.status || c.status === filters.status);
  }), [data, search, filters]);

  const columns = [
    { key:'codigo', label:'Código', width:80 },
    { key:'razao_social', label:'Razão Social', render:(v,row)=><button type="button" className="text-primary hover:underline text-left font-medium" onClick={e=>{e.stopPropagation();setDetalhe(row)}}>{v}</button> },
    { key:'nome_fantasia', label:'Fantasia', width:130, mobileHidden: true },
    { key:'cnpj_cpf', label:'CNPJ/CPF', width:150 },
    { key:'cidade', label:'Cidade', width:110, mobileHidden: true },
    { key:'estado', label:'UF', width:50, mobileHidden: true },
    { key:'telefone', label:'Telefone', width:120 },
    { key:'limite_credito', label:'Limite Crédito', width:120, render:fmtR, mobileHidden: true },
    { key:'status', label:'Status', width:80, render:v=><StatusBadge status={v}/>, sortable:false },
  ];

  return (
    <div>
      <PageHeader title="Clientes" breadcrumbs={['Início','Vendas','Clientes']}
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button type="button" onClick={handleExportar} className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs border border-border rounded hover:bg-muted"><Download size={13}/> Exportar PDF</button>
            <button type="button" onClick={()=>setShowModal(true)} className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Novo Cliente</button>
          </div>
        }
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar search={search} onSearch={setSearch}
          filters={[{key:'status',label:'Status',options:['Ativo','Inativo','Bloqueado'].map(s=>({value:s,label:s}))}]}
          activeFilters={filters}
          onFilterChange={(k,v)=>setFilters(f=>({...f,[k]:v}))}
          onClear={()=>{setSearch('');setFilters({}); reload({ search:'', status:'' });}}
        />
        <DataTable columns={columns} data={filtered} onRowClick={row=>setDetalhe(row)} loading={loading}/>
      </div>

      {(showModal || editando) && (
        <ModalCliente cliente={editando} onClose={()=>{setShowModal(false);setEditando(null);}} onSave={handleSave}/>
      )}

      {detalhe && (
        <DetalheModal title={detalhe.razao_social} subtitle={`Código: ${detalhe.codigo}`} onClose={()=>setDetalhe(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {[['Razão Social',detalhe.razao_social],['Nome Fantasia',detalhe.nome_fantasia],['CNPJ/CPF',detalhe.cnpj_cpf],['Status',detalhe.status],['Cidade/UF',`${detalhe.cidade||'—'}/${detalhe.estado||'—'}`],['Telefone',detalhe.telefone],['E-mail',detalhe.email||'—'],['Contato',detalhe.contato||'—'],['Limite Crédito',fmtR(detalhe.limite_credito)]].map(([k,v])=>(
              <div key={k} className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>
          <div className="mt-3 flex flex-col sm:flex-row justify-end gap-2">
            <button
              onClick={async () => {
                if (!confirm('Excluir este cliente?')) return;
                await clientesServiceApi.delete(detalhe.id);
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