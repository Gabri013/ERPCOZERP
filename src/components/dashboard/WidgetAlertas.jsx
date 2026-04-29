import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { AlertTriangle, Clock, DollarSign, CheckCircle } from 'lucide-react';
import { getEstoqueCritico, getSaldoFinanceiro, getPedidosAguardando, CONFIG } from '@/services/businessLogic';

const fmtR = v => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function WidgetAlertas() {
  const critico = useMemo(() => getEstoqueCritico(), []);
  const saldo = useMemo(() => getSaldoFinanceiro(), []);
  const aguardando = useMemo(() => getPedidosAguardando(), []);

  const alertas = [
    critico.length > 0 && { tipo: 'danger', icone: AlertTriangle, texto: `${critico.length} produto(s) abaixo do mínimo`, link: '/estoque/produtos' },
    aguardando.length > 0 && { tipo: 'warning', icone: Clock, texto: `${aguardando.length} pedido(s) aguardando aprovação`, link: '/financeiro/aprovacao' },
    saldo.totalVencidoPagar > 0 && { tipo: 'warning', icone: DollarSign, texto: `${fmtR(saldo.totalVencidoPagar)} em contas vencidas`, link: '/financeiro/pagar' },
    { tipo: 'success', icone: CheckCircle, texto: 'Meta de vendas de março superada em 10,5%' },
  ].filter(Boolean);

  return (
    <div className="bg-white border border-border rounded-lg h-full flex flex-col overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold">Alertas do Sistema</h3>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {alertas.map((a, i) => (
          <div key={i} className={`flex items-start gap-2 p-2 rounded text-xs ${a.tipo === 'danger' ? 'bg-red-50 text-red-700' : a.tipo === 'warning' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
            <a.icone size={13} className="shrink-0 mt-0.5" />
            {a.link ? <Link to={a.link} className="hover:underline">{a.texto}</Link> : <span>{a.texto}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}