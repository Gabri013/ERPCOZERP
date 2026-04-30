import PageHeader from '@/components/common/PageHeader';
import { BarChart2, ShoppingCart, Package, Factory, DollarSign } from 'lucide-react';

const RELATORIOS = [
  { categoria:'Vendas', icone:ShoppingCart, cor:'bg-blue-100 text-blue-700', items:[
    {nome:'Faturamento por Período',desc:'Resumo de vendas com comparativo mensal'},
    {nome:'Ranking de Clientes',desc:'Top clientes por volume e valor'},
    {nome:'Performance de Vendedores',desc:'Metas e realizações por vendedor'},
    {nome:'Análise de Mix',desc:'Composição das vendas por categoria'},
  ]},
  { categoria:'Estoque', icone:Package, cor:'bg-green-100 text-green-700', items:[
    {nome:'Posição de Estoque',desc:'Saldo atual por produto e localização'},
    {nome:'Curva ABC',desc:'Classificação de produtos por giro'},
    {nome:'Produtos Abaixo do Mínimo',desc:'Alertas de reposição'},
    {nome:'Movimentações do Período',desc:'Entradas e saídas por produto'},
  ]},
  { categoria:'Produção', icone:Factory, cor:'bg-orange-100 text-orange-700', items:[
    {nome:'OEE — Eficiência de Equipamentos',desc:'Disponibilidade, performance e qualidade'},
    {nome:'Ordens por Status',desc:'Acompanhamento das OPs abertas e concluídas'},
    {nome:'Apontamento de Produção',desc:'Horas trabalhadas e produzidas'},
  ]},
  { categoria:'Financeiro', icone:DollarSign, cor:'bg-purple-100 text-purple-700', items:[
    {nome:'DRE Gerencial',desc:'Demonstração de resultado simplificada'},
    {nome:'Fluxo de Caixa Projetado',desc:'Previsão de entradas e saídas'},
    {nome:'Inadimplência',desc:'Contas a receber vencidas'},
    {nome:'Contas a Pagar — Vencimentos',desc:'Agenda de pagamentos da semana'},
  ]},
];

export default function Relatorios() {
  return (
    <div>
      <PageHeader title="Central de Relatórios" breadcrumbs={['Início','Relatórios']}/>
      <div className="grid grid-cols-2 gap-4">
        {RELATORIOS.map(cat=>(
          <div key={cat.categoria} className="bg-white border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <div className={`w-7 h-7 rounded flex items-center justify-center ${cat.cor}`}><cat.icone size={14}/></div>
              <h3 className="text-sm font-semibold">{cat.categoria}</h3>
            </div>
            <div className="divide-y divide-border">
              {cat.items.map((r,i)=>(
                <button key={i} className="w-full text-left px-4 py-2.5 hover:bg-nomus-blue-light transition-colors flex items-center justify-between group">
                  <div>
                    <div className="text-xs font-medium">{r.nome}</div>
                    <div className="text-[11px] text-muted-foreground">{r.desc}</div>
                  </div>
                  <BarChart2 size={13} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-4"/>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}