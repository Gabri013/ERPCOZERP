import PageHeader from '@/components/common/PageHeader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const dre = [
  { label:'Receita Bruta de Vendas', valor:210000, tipo:'receita', nivel:0 },
  { label:'(-) Deduções e Impostos', valor:-28350, tipo:'deducao', nivel:1 },
  { label:'Receita Líquida', valor:181650, tipo:'total', nivel:0 },
  { label:'(-) Custo dos Produtos Vendidos (CPV)', valor:-105000, tipo:'deducao', nivel:1 },
  { label:'Lucro Bruto', valor:76650, tipo:'total', nivel:0 },
  { label:'(-) Despesas Operacionais', valor:-38200, tipo:'deducao', nivel:1 },
  { label:'  Vendas', valor:-15000, tipo:'sub', nivel:2 },
  { label:'  Administrativas', valor:-18200, tipo:'sub', nivel:2 },
  { label:'  Financeiras', valor:-5000, tipo:'sub', nivel:2 },
  { label:'EBITDA', valor:38450, tipo:'total', nivel:0 },
  { label:'(-) Depreciação e Amortização', valor:-4200, tipo:'deducao', nivel:1 },
  { label:'EBIT (Lucro Operacional)', valor:34250, tipo:'total', nivel:0 },
  { label:'(-) Imposto de Renda / CSLL', valor:-11642, tipo:'deducao', nivel:1 },
  { label:'Lucro Líquido', valor:22608, tipo:'resultado', nivel:0 },
];

const grafico = [
  {label:'Receita Líquida',val:181650},{label:'Lucro Bruto',val:76650},{label:'EBITDA',val:38450},{label:'Lucro Líquido',val:22608},
];

const cores = { receita:'text-foreground font-semibold', deducao:'text-muted-foreground', total:'text-primary font-bold border-t border-border', resultado:'text-success font-bold border-t-2 border-success text-lg', sub:'text-muted-foreground' };

export default function DRE() {
  return (
    <div>
      <PageHeader title="DRE — Demonstração do Resultado" breadcrumbs={['Início','Financeiro','DRE']}
        actions={<select className="text-xs border border-border rounded px-2 py-1.5 bg-white outline-none"><option>Março 2026</option><option>Fevereiro 2026</option></select>}
      />
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Demonstração — Março/2026</h3>
          <div className="space-y-0.5">
            {dre.map((r,i)=>(
              <div key={i} className={`flex items-center justify-between py-1.5 px-2 rounded text-xs ${cores[r.tipo]} ${r.nivel===1?'pl-6':r.nivel===2?'pl-10':''}`}>
                <span>{r.label}</span>
                <span className={r.valor<0?'text-destructive':r.tipo==='resultado'?'text-success':''}>
                  R$ {Math.abs(r.valor).toLocaleString('pt-BR',{minimumFractionDigits:2})}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Visão Gráfica</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={grafico} margin={{top:0,right:0,left:-10,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="label" tick={{fontSize:10}}/>
              <YAxis tick={{fontSize:10}} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={v=>`R$ ${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2})}`}/>
              <Bar dataKey="val" fill="#0066cc" radius={4} name="Valor"/>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              {label:'Margem Bruta',val:'42,2%',color:'text-blue-600'},
              {label:'Margem Líquida',val:'12,4%',color:'text-success'},
            ].map(k=>(
              <div key={k.label} className="bg-muted rounded p-3 text-center">
                <div className={`text-lg font-bold ${k.color}`}>{k.val}</div>
                <div className="text-[11px] text-muted-foreground">{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}