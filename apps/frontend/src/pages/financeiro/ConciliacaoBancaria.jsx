import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

const LANCAMENTOS = [
  { id:'1', data:'2026-04-15', descricao:'Depósito cliente Grupo Delta', valor:10500, tipo:'C', status:'Conciliado' },
  { id:'2', data:'2026-04-15', descricao:'Pagamento Rolamentos Nacionais', valor:-4100, tipo:'D', status:'Conciliado' },
  { id:'3', data:'2026-04-16', descricao:'TED recebida - Comércio Beta', valor:8900, tipo:'C', status:'Conciliado' },
  { id:'4', data:'2026-04-17', descricao:'Pagamento energia elétrica CPFL', valor:-3840, tipo:'D', status:'Conciliado' },
  { id:'5', data:'2026-04-18', descricao:'Depósito - TechParts Ltda', valor:6700, tipo:'C', status:'Pendente' },
  { id:'6', data:'2026-04-18', descricao:'Débito automático aluguel', valor:-12000, tipo:'D', status:'Divergente' },
  { id:'7', data:'2026-04-19', descricao:'Transferência interna', valor:5000, tipo:'C', status:'Pendente' },
];

const iconStatus = { 'Conciliado':<CheckCircle size={13} className="text-success"/>, 'Pendente':<Clock size={13} className="text-warning"/>, 'Divergente':<AlertCircle size={13} className="text-destructive"/> };
const bgStatus = { 'Conciliado':'bg-green-50', 'Pendente':'bg-yellow-50', 'Divergente':'bg-red-50' };

export default function ConciliacaoBancaria() {
  const [filtro, setFiltro] = useState('Todos');
  const lista = filtro==='Todos' ? LANCAMENTOS : LANCAMENTOS.filter(l=>l.status===filtro);
  const saldo = LANCAMENTOS.reduce((s,l)=>s+l.valor,0);
  return (
    <div>
      <PageHeader title="Conciliação Bancária" breadcrumbs={['Início','Financeiro','Conciliação Bancária']}
        actions={<select className="text-xs border border-border rounded px-2 py-1.5 bg-white outline-none"><option>Abril 2026</option></select>}
      />
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          {label:'Saldo Banco',val:`R$ ${saldo.toLocaleString('pt-BR',{minimumFractionDigits:2})}`,color:'text-foreground'},
          {label:'Conciliados',val:LANCAMENTOS.filter(l=>l.status==='Conciliado').length,color:'text-success'},
          {label:'Pendentes',val:LANCAMENTOS.filter(l=>l.status==='Pendente').length,color:'text-warning'},
          {label:'Divergentes',val:LANCAMENTOS.filter(l=>l.status==='Divergente').length,color:'text-destructive'},
        ].map(k=>(
          <div key={k.label} className="bg-white border border-border rounded px-4 py-3 text-center">
            <div className={`text-lg font-bold ${k.color}`}>{k.val}</div>
            <div className="text-[11px] text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
          {['Todos','Conciliado','Pendente','Divergente'].map(f=>(
            <button key={f} onClick={()=>setFiltro(f)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filtro===f?'cozinha-blue-bg text-white':'bg-muted text-muted-foreground hover:bg-border'}`}>
              {f}
            </button>
          ))}
        </div>
        <table className="w-full text-xs">
          <thead><tr className="bg-muted border-b border-border">
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Data</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Descrição</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Tipo</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Valor</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
          </tr></thead>
          <tbody>
            {lista.map((l,i)=>(
              <tr key={i} className={`border-b border-border last:border-0 ${bgStatus[l.status]}`}>
                <td className="px-4 py-2">{new Date(l.data+'T00:00').toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-2">{l.descricao}</td>
                <td className="px-4 py-2"><span className={`font-bold ${l.tipo==='C'?'text-success':'text-destructive'}`}>{l.tipo==='C'?'Crédito':'Débito'}</span></td>
                <td className={`px-4 py-2 font-medium ${l.valor>0?'text-success':'text-destructive'}`}>
                  {l.valor>0?'+':''}R$ {Math.abs(l.valor).toLocaleString('pt-BR',{minimumFractionDigits:2})}
                </td>
                <td className="px-4 py-2"><div className="flex items-center gap-1.5">{iconStatus[l.status]}<span>{l.status}</span></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}