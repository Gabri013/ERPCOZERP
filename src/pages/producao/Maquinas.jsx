import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Plus } from 'lucide-react';

const MOCK = [
  { id:'1', codigo:'TNC-01', descricao:'Torno CNC 1', tipo:'Torno CNC', fabricante:'Romi', modelo:'Sprint 32', ano:2019, setor:'Usinagem', status:'Ativo', ultima_manutencao:'2026-03-10', proxima_manutencao:'2026-06-10' },
  { id:'2', codigo:'TNC-02', descricao:'Torno CNC 2', tipo:'Torno CNC', fabricante:'Romi', modelo:'Sprint 32', ano:2020, setor:'Usinagem', status:'Ativo', ultima_manutencao:'2026-03-12', proxima_manutencao:'2026-06-12' },
  { id:'3', codigo:'CUS-01', descricao:'Centro de Usinagem', tipo:'Fresadora CNC', fabricante:'Mazak', modelo:'Variaxis 500', ano:2021, setor:'Usinagem', status:'Manutenção', ultima_manutencao:'2026-04-18', proxima_manutencao:'2026-04-25' },
  { id:'4', codigo:'RET-01', descricao:'Retífica CIL-01', tipo:'Retífica', fabricante:'Jones', modelo:'J-412', ano:2015, setor:'Acabamento', status:'Ativo', ultima_manutencao:'2026-02-20', proxima_manutencao:'2026-05-20' },
  { id:'5', codigo:'FRE-01', descricao:'Fresadora Conv.', tipo:'Fresadora', fabricante:'Dmáquinas', modelo:'FV-1', ano:2010, setor:'Usinagem', status:'Ativo', ultima_manutencao:'2026-01-15', proxima_manutencao:'2026-04-15' },
];

const statusMaq = {'Ativo':'bg-green-100 text-green-700','Inativo':'bg-gray-100 text-gray-600','Manutenção':'bg-orange-100 text-orange-700'};

const columns = [
  { key:'codigo', label:'Código', width:80 },
  { key:'descricao', label:'Descrição' },
  { key:'tipo', label:'Tipo', width:120 },
  { key:'fabricante', label:'Fabricante', width:100 },
  { key:'setor', label:'Setor', width:100 },
  { key:'ultima_manutencao', label:'Últ. Manutenção', width:120, render:v=>v?new Date(v+'T00:00').toLocaleDateString('pt-BR'):'—' },
  { key:'proxima_manutencao', label:'Próx. Manutenção', width:130, render:v=>v?new Date(v+'T00:00').toLocaleDateString('pt-BR'):'—' },
  { key:'status', label:'Status', width:90, render:v=><span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${statusMaq[v]||'bg-gray-100 text-gray-600'}`}>{v}</span>, sortable:false },
];

export default function Maquinas() {
  return (
    <div>
      <PageHeader title="Máquinas e Equipamentos" breadcrumbs={['Início','Produção','Máquinas']}
        actions={<button className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Nova Máquina</button>}
      />
      <div className="grid grid-cols-3 gap-3 mb-3">
        {[
          {label:'Total',val:MOCK.length,color:'text-foreground'},
          {label:'Em Operação',val:MOCK.filter(m=>m.status==='Ativo').length,color:'text-success'},
          {label:'Em Manutenção',val:MOCK.filter(m=>m.status==='Manutenção').length,color:'text-orange-600'},
        ].map(s=>(
          <div key={s.label} className="bg-white border border-border rounded px-4 py-3 text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <DataTable columns={columns} data={MOCK} />
      </div>
    </div>
  );
}