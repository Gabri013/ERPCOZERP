import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const VENDAS_MENSAIS = [
  { mes: 'Out', valor: 142000, meta: 150000 },
  { mes: 'Nov', valor: 168000, meta: 160000 },
  { mes: 'Dez', valor: 195000, meta: 180000 },
  { mes: 'Jan', valor: 148000, meta: 170000 },
  { mes: 'Fev', valor: 173000, meta: 175000 },
  { mes: 'Mar', valor: 210000, meta: 190000 },
  { mes: 'Abr', valor: 188000, meta: 195000 },
];

export default function WidgetGraficoVendas() {
  return (
    <div className="bg-white border border-border rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h3 className="text-sm font-semibold">Volume de Vendas Mensais</h3>
          <p className="text-[11px] text-muted-foreground">Realizado vs Meta (R$)</p>
        </div>
        <Link to="/vendas/pedidos" className="text-xs text-primary hover:underline flex items-center gap-1">Ver pedidos <ArrowRight size={11}/></Link>
      </div>
      <div className="flex-1 min-h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={VENDAS_MENSAIS} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={v => `R$ ${v.toLocaleString('pt-BR')}`} />
            <Area type="monotone" dataKey="meta" stroke="#99ccff" fill="#e6f2ff" strokeDasharray="4 4" name="Meta" />
            <Area type="monotone" dataKey="valor" stroke="#0066cc" fill="#cce0ff" name="Realizado" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}