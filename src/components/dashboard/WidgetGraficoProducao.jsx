import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

function formatYm(ym) {
  const [y, m] = String(ym || '').split('-');
  if (!y || !m) return String(ym || '');
  const map = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const idx = Number(m) - 1;
  return map[idx] ? map[idx] : `${m}/${y}`;
}

export default function WidgetGraficoProducao({ series }) {
  const data = (series?.opsPorMes || []).map((p) => ({
    periodo: formatYm(p.ym),
    ops: Number(p.count || 0),
  }));

  return (
    <div className="bg-white border border-border rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h3 className="text-sm font-semibold">Ordens de Produção</h3>
          <p className="text-[11px] text-muted-foreground">OPs criadas (últimos 6 meses)</p>
        </div>
        <Link to="/producao/ordens" className="text-xs text-primary hover:underline flex items-center gap-1">Ver OPs <ArrowRight size={11}/></Link>
      </div>
      <div className="flex-1 min-h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="ops" name="OPs" fill="#0066cc" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}