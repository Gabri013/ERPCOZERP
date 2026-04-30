import PageHeader from '@/components/common/PageHeader';

const estagios = [
  { nome:'Contato Inicial', cor:'bg-gray-200', cards:[
    {titulo:'Fornecimento flanges especiais',empresa:'TechParts Ltda',valor:'R$ 28.500',responsavel:'Ana Paula'},
  ]},
  { nome:'Qualificação', cor:'bg-blue-200', cards:[
    {titulo:'Manutenção preventiva anual',empresa:'Grupo Delta',valor:'R$ 42.000',responsavel:'Carlos Silva'},
  ]},
  { nome:'Proposta', cor:'bg-yellow-200', cards:[
    {titulo:'Fornecimento anual rolamentos',empresa:'Metalúrgica ABC',valor:'R$ 180.000',responsavel:'Carlos Silva'},
  ]},
  { nome:'Negociação', cor:'bg-orange-200', cards:[
    {titulo:'Projeto eixos transmissão lote',empresa:'SiderTech S/A',valor:'R$ 95.000',responsavel:'Rafael Costa'},
  ]},
  { nome:'Fechado Ganho', cor:'bg-green-200', cards:[
    {titulo:'Contrato serviços usinagem',empresa:'Usinagem Precisa',valor:'R$ 65.000',responsavel:'Rafael Costa'},
  ]},
];

export default function Pipeline() {
  return (
    <div>
      <PageHeader title="Pipeline de Vendas" breadcrumbs={['Início','CRM','Pipeline']}/>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {estagios.map(e=>(
          <div key={e.nome} className="min-w-[220px] flex-1">
            <div className={`rounded-t-lg px-3 py-2 ${e.cor}`}>
              <div className="text-xs font-bold">{e.nome}</div>
              <div className="text-[10px] text-muted-foreground">{e.cards.length} oportunidade(s)</div>
            </div>
            <div className="bg-muted/50 rounded-b-lg p-2 space-y-2 min-h-[300px]">
              {e.cards.map((c,i)=>(
                <div key={i} className="bg-white border border-border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="text-xs font-semibold text-foreground leading-tight mb-1">{c.titulo}</div>
                  <div className="text-[11px] text-muted-foreground mb-2">{c.empresa}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">{c.valor}</span>
                    <span className="text-[10px] text-muted-foreground">{c.responsavel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}