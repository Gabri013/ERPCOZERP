import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

function formatYm(ym) {
  const [y, m] = String(ym || '').split('-');
  if (!y || !m) return String(ym || '');
  const map = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const idx = Number(m) - 1;
  return map[idx] ? map[idx] : `${m}/${y}`;
}

export default function WidgetGraficoVendas({ series }) {
  const data = (series?.clientesPorMes || []).map((p) => ({
    mes: formatYm(p.ym),
    valor: Number(p.count || 0),
    meta: 0,
  }));

  return (
    <div className="bg-white border border-border rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h3 className="text-sm font-semibold">Captação de Clientes</h3>
          <p className="text-[11px] text-muted-foreground">Cadastros (últimos 6 meses)</p>
        </div>
        <Link to="/vendas/clientes" className="text-xs text-primary hover:underline flex items-center gap-1">Ver clientes <ArrowRight size={11}/></Link>
      </div>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => `${Number(v || 0)} cliente(s)`} />
            <Area type="monotone" dataKey="valor" stroke="#0066cc" fill="#cce0ff" name="Clientes" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}