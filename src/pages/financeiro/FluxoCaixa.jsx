import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import PageHeader from '@/components/common/PageHeader';

const fluxo = [
  { data: '01/04', entradas: 18000, saidas: 12000, saldo: 6000 },
  { data: '05/04', entradas: 35000, saidas: 8500, saldo: 26500 },
  { data: '10/04', entradas: 12000, saidas: 42000, saldo: -30000 },
  { data: '15/04', entradas: 45000, saidas: 15000, saldo: 30000 },
  { data: '20/04', entradas: 8000, saidas: 18000, saldo: -10000 },
  { data: '25/04', entradas: 55000, saidas: 12000, saldo: 43000 },
  { data: '30/04', entradas: 15000, saidas: 38500, saldo: -23500 },
];

const projecao = [
  { mes: 'Abr', realizado: 188400, previsto: 195000 },
  { mes: 'Mai', realizado: null, previsto: 205000 },
  { mes: 'Jun', realizado: null, previsto: 215000 },
  { mes: 'Jul', realizado: null, previsto: 220000 },
];

export default function FluxoCaixa() {
  return (
    <div>
      <PageHeader
        title="Fluxo de Caixa"
        breadcrumbs={['Início', 'Financeiro', 'Fluxo de Caixa']}
        actions={
          <select className="text-xs border border-border rounded px-2 py-1.5 bg-white outline-none">
            <option>Abril 2026</option>
            <option>Maio 2026</option>
          </select>
        }
      />

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Saldo Atual', val: 'R$ 82.400', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
          { label: 'Entradas Previstas (mês)', val: 'R$ 142.000', color: 'text-success', bg: 'bg-green-50 border-green-200' },
          { label: 'Saídas Previstas (mês)', val: 'R$ 98.700', color: 'text-destructive', bg: 'bg-red-50 border-red-200' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} border rounded px-4 py-3`}>
            <p className="text-[11px] text-muted-foreground mb-1">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>{k.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Entradas x Saídas — Abril</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fluxo} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="data" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => `R$ ${Number(v).toLocaleString('pt-BR')}`} />
              <Bar dataKey="entradas" fill="#22c55e" name="Entradas" radius={2} />
              <Bar dataKey="saidas" fill="#ef4444" name="Saídas" radius={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Saldo Acumulado</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={fluxo} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="data" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => `R$ ${Number(v).toLocaleString('pt-BR')}`} />
              <Line type="monotone" dataKey="saldo" stroke="#0066cc" strokeWidth={2} dot={{ r: 3 }} name="Saldo" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-white border border-border rounded-lg">
          <div className="px-4 py-2.5 border-b border-border">
            <h3 className="text-sm font-semibold">Lançamentos do Período</h3>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Data</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Entradas</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Saídas</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Saldo do Dia</th>
              </tr>
            </thead>
            <tbody>
              {fluxo.map((f, i) => (
                <tr key={i} className="border-b border-border hover:bg-nomus-blue-light last:border-0">
                  <td className="px-4 py-2">{f.data}</td>
                  <td className="px-4 py-2 text-success font-medium">R$ {f.entradas.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-2 text-destructive font-medium">R$ {f.saidas.toLocaleString('pt-BR')}</td>
                  <td className={`px-4 py-2 font-bold ${f.saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                    R$ {f.saldo.toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}