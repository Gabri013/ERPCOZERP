import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const PRODUCAO_SEMANA = [
  { dia: 'Seg', produzido: 45, planejado: 50 },
  { dia: 'Ter', produzido: 52, planejado: 50 },
  { dia: 'Qua', produzido: 48, planejado: 50 },
  { dia: 'Qui', produzido: 55, planejado: 55 },
  { dia: 'Sex', produzido: 40, planejado: 50 },
];

export default function WidgetGraficoProducao() {
  return (
    <div className="bg-white border border-border rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h3 className="text-sm font-semibold">Produção da Semana</h3>
          <p className="text-[11px] text-muted-foreground">Produzido vs Planejado</p>
        </div>
        <Link to="/producao/ordens" className="text-xs text-primary hover:underline flex items-center gap-1">Ver OPs <ArrowRight size={11}/></Link>
      </div>
      <div className="flex-1 min-h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={PRODUCAO_SEMANA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="planejado" name="Planejado" fill="#bfdbfe" radius={[3,3,0,0]} />
            <Bar dataKey="produzido" name="Produzido" fill="#0066cc" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}