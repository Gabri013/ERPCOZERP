import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PageHeader from '@/components/common/PageHeader';

const vendasMes = [
  { mes:'Jan', valor:148000, meta:170000 },
  { mes:'Fev', valor:173000, meta:175000 },
  { mes:'Mar', valor:210000, meta:190000 },
  { mes:'Abr', valor:188400, meta:195000 },
];

const topClientes = [
  { nome:'Usinagem Precisa', valor:54000 },
  { nome:'Metalúrgica ABC', valor:45200 },
  { nome:'Grupo Delta', valor:31500 },
  { nome:'Força Metais', valor:22100 },
  { nome:'Ind. XYZ', valor:12800 },
];

const porVendedor = [
  { name:'Carlos Silva', value:38, color:'#0066cc' },
  { name:'Ana Paula', value:32, color:'#3399ff' },
  { name:'Rafael Costa', value:30, color:'#99ccff' },
];

export default function RelatoriosVendas() {
  return (
    <div>
      <PageHeader title="Relatórios de Vendas" breadcrumbs={['Início','Vendas','Relatórios']}
        actions={<select className="text-xs border border-border rounded px-2 py-1.5 bg-white outline-none"><option>Abril 2026</option><option>Março 2026</option></select>}
      />
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          {label:'Faturamento Abril',val:'R$ 188.400',sub:'Meta: R$ 195.000',ok:false},
          {label:'Ticket Médio',val:'R$ 22.550',sub:'+12% vs março',ok:true},
          {label:'Pedidos Fechados',val:'8',sub:'3 em negociação',ok:true},
        ].map(k=>(
          <div key={k.label} className="bg-white border border-border rounded px-4 py-3">
            <p className="text-[11px] text-muted-foreground">{k.label}</p>
            <p className="text-xl font-bold text-foreground mt-1">{k.val}</p>
            <p className={`text-[11px] mt-0.5 ${k.ok?'text-success':'text-warning'}`}>{k.sub}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Vendas x Meta (R$)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={vendasMes} margin={{top:0,right:0,left:-15,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="mes" tick={{fontSize:11}}/>
              <YAxis tick={{fontSize:10}} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={v=>`R$ ${Number(v).toLocaleString('pt-BR')}`}/>
              <Bar dataKey="meta" fill="#cce0ff" name="Meta" radius={2}/>
              <Bar dataKey="valor" fill="#0066cc" name="Realizado" radius={2}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Vendas por Vendedor</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={porVendedor} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({name,value})=>`${value}%`} labelLine={false}>
                {porVendedor.map((c,i)=><Cell key={i} fill={c.color}/>)}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {porVendedor.map(c=>(
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{background:c.color}}/><span className="text-muted-foreground">{c.name}</span></div>
                <span className="font-medium">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white border border-border rounded-lg">
        <div className="px-4 py-2.5 border-b border-border"><h3 className="text-sm font-semibold">Top Clientes do Mês</h3></div>
        <table className="w-full text-xs">
          <thead><tr className="bg-muted border-b border-border">
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Cliente</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Valor</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Participação</th>
          </tr></thead>
          <tbody>
            {topClientes.map((c,i)=>(
              <tr key={i} className="border-b border-border hover:bg-nomus-blue-light last:border-0">
                <td className="px-4 py-2 font-medium">{c.nome}</td>
                <td className="px-4 py-2">R$ {c.valor.toLocaleString('pt-BR')}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-1.5"><div className="cozinha-blue-bg h-1.5 rounded-full" style={{width:`${(c.valor/54000*100).toFixed(0)}%`}}/></div>
                    <span className="text-muted-foreground w-8 text-right">{(c.valor/165600*100).toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}