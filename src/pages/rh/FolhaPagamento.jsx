import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Download } from 'lucide-react';
import { exportPdfReport } from '@/services/pdfExport';

const MOCK = [
  { id:'1', nome:'João Melo', matricula:'MAT-001', cargo:'Operador CNC', salario_base:3200, horas_extras:320, descontos:580, liquido:2940 },
  { id:'2', nome:'Pedro Alves', matricula:'MAT-002', cargo:'Torneiro Mecânico', salario_base:3800, horas_extras:0, descontos:684, liquido:3116 },
  { id:'3', nome:'Maria Lima', matricula:'MAT-003', cargo:'Analista de Qualidade', salario_base:4500, horas_extras:675, descontos:940, liquido:4235 },
  { id:'4', nome:'Carlos Santos', matricula:'MAT-004', cargo:'Gerente de Vendas', salario_base:7200, horas_extras:0, descontos:1728, liquido:5472 },
  { id:'5', nome:'Ana Paula', matricula:'MAT-005', cargo:'Analista Financeiro', salario_base:5100, horas_extras:0, descontos:1122, liquido:3978 },
  { id:'6', nome:'Rafael Costa', matricula:'MAT-006', cargo:'Vendedor Externo', salario_base:3000, horas_extras:0, descontos:540, liquido:2460 },
];

const fmt = v=>`R$ ${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
const columns = [
  { key:'nome', label:'Funcionário' },
  { key:'matricula', label:'Matrícula', width:90 },
  { key:'cargo', label:'Cargo', width:160 },
  { key:'salario_base', label:'Salário Base', width:110, render:fmt },
  { key:'horas_extras', label:'Extras', width:90, render:v=>v?fmt(v):'—' },
  { key:'descontos', label:'Descontos', width:100, render:v=><span className="text-destructive">{fmt(v)}</span> },
  { key:'liquido', label:'Líquido', width:110, render:v=><span className="text-success font-bold">{fmt(v)}</span> },
];

export default function FolhaPagamento() {
  const total = MOCK.reduce((s,m)=>s+m.liquido,0);
  return (
    <div>
      <PageHeader title="Folha de Pagamento" breadcrumbs={['Início','RH','Folha de Pagamento']}
        actions={<div className="flex gap-2">
          <button
            onClick={() => exportPdfReport({
              title: 'Folha de Pagamento',
              subtitle: 'Resumo da folha mensal',
              filename: 'folha-pagamento.pdf',
              table: {
                headers: ['Funcionário', 'Matrícula', 'Cargo', 'Salário Base', 'Extras', 'Descontos', 'Líquido'],
                rows: MOCK.map((registro) => [
                  registro.nome,
                  registro.matricula,
                  registro.cargo,
                  fmt(registro.salario_base),
                  registro.horas_extras ? fmt(registro.horas_extras) : '—',
                  fmt(registro.descontos),
                  fmt(registro.liquido),
                ]),
              },
            })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"
          >
            <Download size={13}/> Exportar PDF
          </button>
          <select className="text-xs border border-border rounded px-2 py-1.5 bg-white outline-none"><option>Abril 2026</option></select>
        </div>}
      />
      <div className="grid grid-cols-3 gap-3 mb-3">
        {[
          {label:'Total Bruto',val:fmt(MOCK.reduce((s,m)=>s+m.salario_base+m.horas_extras,0)),color:'text-foreground'},
          {label:'Total Descontos',val:fmt(MOCK.reduce((s,m)=>s+m.descontos,0)),color:'text-destructive'},
          {label:'Total Líquido',val:fmt(total),color:'text-success'},
        ].map(k=>(
          <div key={k.label} className="bg-white border border-border rounded px-4 py-3">
            <div className={`text-lg font-bold ${k.color}`}>{k.val}</div>
            <div className="text-[11px] text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <DataTable columns={columns} data={MOCK} />
      </div>
    </div>
  );
}