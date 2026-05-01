import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ModalFuncionario from '@/components/rh/ModalFuncionario';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus } from 'lucide-react';
import { recordsServiceApi } from '@/services/recordsServiceApi';

const fmtR = v => `R$ ${Number(v||0).toLocaleString('pt-BR')}`;
const fmtD = v => v ? new Date(v+'T00:00').toLocaleDateString('pt-BR') : '—';

export default function Funcionarios() {
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
      setData(await recordsServiceApi.list('rh_funcionario'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (form) => {
    if (editando?.id) {
      await recordsServiceApi.update(editando.id, { ...editando, ...form });
    } else {
      const matricula = form?.matricula || `MAT-${String(Date.now()).slice(-3).padStart(3,'0')}`;
      await recordsServiceApi.create('rh_funcionario', { ...form, matricula });
    }
    await load();
    setEditando(null);
  };

  const filtered = useMemo(() => {
    return data.filter(f => {
      const s = search.toLowerCase();
      return (!s || f.nome?.toLowerCase().includes(s) || f.cargo?.toLowerCase().includes(s))
        && (!filters.departamento || f.departamento === filters.departamento)
        && (!filters.status || f.status === filters.status);
    });
  }, [data, search, filters.departamento, filters.status]);

  const deptos = useMemo(() => [...new Set(data.map(m => m.departamento).filter(Boolean))], [data]);

  const columns = [
    { key:'matricula', label:'Matrícula', width:90 },
    { key:'nome', label:'Nome', render:(v,row)=><button className="text-primary hover:underline text-left font-medium" onClick={e=>{e.stopPropagation();setDetalhe(row)}}>{v}</button> },
    { key:'cargo', label:'Cargo', width:150 },
    { key:'departamento', label:'Depto.', width:110 },
    { key:'tipo_contrato', label:'Contrato', width:80 },
    { key:'salario', label:'Salário', width:100, render:fmtR },
    { key:'data_admissao', label:'Admissão', width:90, render:fmtD },
    { key:'status', label:'Status', width:80, render:v=><StatusBadge status={v}/>, sortable:false },
  ];

  return (
    <div>
      <PageHeader title="Funcionários" breadcrumbs={['Início','RH','Funcionários']}
        actions={<button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Novo Funcionário</button>}
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar search={search} onSearch={setSearch}
          filters={[
            {key:'departamento',label:'Departamento',options:deptos.map(d=>({value:d,label:d}))},
            {key:'status',label:'Status',options:['Ativo','Inativo','Férias','Afastado'].map(s=>({value:s,label:s}))},
          ]}
          activeFilters={filters} onFilterChange={(k,v)=>setFilters(f=>({...f,[k]:v}))} onClear={()=>{setSearch('');setFilters({});}}
        />
        <DataTable columns={columns} data={filtered} onRowClick={row=>setDetalhe(row)} loading={loading}/>
      </div>

      {(showModal || editando) && (
        <ModalFuncionario funcionario={editando} onClose={()=>{setShowModal(false);setEditando(null);}} onSave={handleSave}/>
      )}

      {detalhe && (
        <DetalheModal title={detalhe.nome} subtitle={`${detalhe.matricula} · ${detalhe.cargo}`} onClose={()=>setDetalhe(null)}>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[['Departamento',detalhe.departamento],['Cargo',detalhe.cargo],['Contrato',detalhe.tipo_contrato],['Salário',fmtR(detalhe.salario)],['Admissão',fmtD(detalhe.data_admissao)],['Status',detalhe.status],['E-mail',detalhe.email||'—'],['Telefone',detalhe.telefone||'—']].map(([k,v])=>(
              <div key={k} className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>
          <div className="mt-3 flex justify-end"><button onClick={()=>{setEditando(detalhe);setDetalhe(null);}} className="px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90">Editar</button></div>
        </DetalheModal>
      )}
    </div>
  );
}