import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Download } from 'lucide-react';
import { exportPdfReport } from '@/services/pdfExport';
import { recordsServiceApi } from '@/services/recordsServiceApi';

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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [competencia, setCompetencia] = useState('2026-04');

  async function load() {
    setLoading(true);
    try {
      const rows = await recordsServiceApi.list('rh_folha_pagamento');
      setData(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => data.filter((r) => (r.competencia || '2026-04') === competencia), [data, competencia]);
  const total = useMemo(() => filtered.reduce((s,m)=>s+Number(m.liquido||0),0), [filtered]);
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
                rows: filtered.map((registro) => [
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
          <select value={competencia} onChange={(e)=>setCompetencia(e.target.value)} className="text-xs border border-border rounded px-2 py-1.5 bg-white outline-none">
            {[...new Set(data.map(d=>d.competencia).filter(Boolean))].map(c=><option key={c} value={c}>{c}</option>)}
            <option value="2026-04">2026-04</option>
          </select>
        </div>}
      />
      <div className="grid grid-cols-3 gap-3 mb-3">
        {[
          {label:'Total Bruto',val:fmt(filtered.reduce((s,m)=>s+Number(m.salario_base||0)+Number(m.horas_extras||0),0)),color:'text-foreground'},
          {label:'Total Descontos',val:fmt(filtered.reduce((s,m)=>s+Number(m.descontos||0),0)),color:'text-destructive'},
          {label:'Total Líquido',val:fmt(total),color:'text-success'},
        ].map(k=>(
          <div key={k.label} className="bg-white border border-border rounded px-4 py-3">
            <div className={`text-lg font-bold ${k.color}`}>{k.val}</div>
            <div className="text-[11px] text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <DataTable columns={columns} data={filtered} loading={loading} />
      </div>
    </div>
  );
}