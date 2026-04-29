import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Search } from 'lucide-react';

const MOCK = [
  { chave:'35260412345678901234550010002450011', numero:'000.001.245', emitente:'Nomus Ind. e Com. Ltda', destinatario:'Metalúrgica ABC', emissao:'18/04/2026', valor:'R$ 45.200,00', status:'Autorizada' },
  { chave:'35260412345678901234550010002440012', numero:'000.001.244', emitente:'Nomus Ind. e Com. Ltda', destinatario:'Ind. XYZ S/A', emissao:'16/04/2026', valor:'R$ 12.800,00', status:'Autorizada' },
  { chave:'35260412345678901234550010002430013', numero:'000.001.243', emitente:'Nomus Ind. e Com. Ltda', destinatario:'Comércio Beta', emissao:'14/04/2026', valor:'R$ 8.900,00', status:'Cancelada' },
];

const statusCor = {'Autorizada':'bg-green-100 text-green-700','Cancelada':'bg-red-100 text-red-700'};

export default function NFeConsulta() {
  const [chave, setChave] = useState('');
  return (
    <div>
      <PageHeader title="Consulta NF-e" breadcrumbs={['Início','Fiscal','NF-e Consulta']}/>
      <div className="bg-white border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-muted rounded px-3 py-2 flex-1 max-w-xl">
            <Search size={13} className="text-muted-foreground shrink-0"/>
            <input value={chave} onChange={e=>setChave(e.target.value)} placeholder="Informe a chave de acesso (44 dígitos)..."
              className="bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground w-full"/>
          </div>
          <button className="px-4 py-2 text-xs nomus-blue-bg text-white rounded hover:opacity-90">Consultar</button>
        </div>
      </div>
      <div className="bg-white border border-border rounded-lg divide-y divide-border">
        <div className="px-4 py-2.5 border-b border-border"><h3 className="text-sm font-semibold">Notas Emitidas — Abril 2026</h3></div>
        {MOCK.map((n,i)=>(
          <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-nomus-blue-light text-xs">
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{n.numero} — {n.destinatario}</div>
              <div className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">{n.chave}</div>
            </div>
            <div className="text-muted-foreground shrink-0">{n.emissao}</div>
            <div className="font-medium shrink-0">{n.valor}</div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium shrink-0 ${statusCor[n.status]}`}>{n.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}