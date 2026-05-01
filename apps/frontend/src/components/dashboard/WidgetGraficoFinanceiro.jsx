import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchSaldoFinanceiroApi } from '@/services/businessLogicApi';

const fmtR = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function WidgetGraficoFinanceiro() {
  const [saldo, setSaldo] = useState({ totalReceber: 0, totalPagar: 0 });

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const s = await fetchSaldoFinanceiroApi();
        if (!m) return;
        setSaldo(s);
      } catch {
        if (!m) return;
        setSaldo({ totalReceber: 0, totalPagar: 0 });
      }
    })();
    return () => {
      m = false;
    };
  }, []);

  const data = [
    { nome: 'Receber', valor: saldo.totalReceber, fill: '#22c55e' },
    { nome: 'Pagar', valor: saldo.totalPagar, fill: '#ef4444' },
  ];

  return (
    <div className="bg-white border border-border rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-1 shrink-0">
        <h3 className="text-sm font-semibold">Receber vs Pagar</h3>
        <Link to="/financeiro/relatorio" className="text-xs text-primary hover:underline">
          Relatório
        </Link>
      </div>
      <p className="text-[11px] text-muted-foreground mb-2 shrink-0">Saldo em aberto (R$)</p>
      <div className="flex-1 min-h-[80px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip formatter={(v) => fmtR(v)} />
            <Bar dataKey="valor" name="Valor" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1 mt-2 shrink-0">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            A Receber
          </span>
          <span className="font-medium text-green-600">{fmtR(saldo.totalReceber)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            A Pagar
          </span>
          <span className="font-medium text-red-600">{fmtR(saldo.totalPagar)}</span>
        </div>
        <div className="flex justify-between text-xs border-t border-border pt-1">
          <span className="font-medium">Saldo</span>
          <span
            className={`font-bold ${saldo.totalReceber - saldo.totalPagar >= 0 ? 'text-success' : 'text-destructive'}`}
          >
            {fmtR(saldo.totalReceber - saldo.totalPagar)}
          </span>
        </div>
      </div>
    </div>
  );
}
