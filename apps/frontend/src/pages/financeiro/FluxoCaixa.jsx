import { useState, useMemo } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, AlertCircle, Calendar, DollarSign } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';
const hoje = new Date().toISOString().split('T')[0];
const addDias = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };

const CONTAS_BANCARIAS = [
  { id: 1, banco: 'Banco do Brasil', agencia: '0001', conta: '12345-6', saldo: 18432.50, ativa: true },
  { id: 2, banco: 'SICOOB', agencia: '3012', conta: '000008-8', saldo: -2104.25, ativa: true },
  { id: 3, banco: 'Itaú', agencia: '1234', conta: '56789-0', saldo: 5000.00, ativa: false },
];

const saldoTotal = CONTAS_BANCARIAS.filter((c) => c.ativa).reduce((s, c) => s + c.saldo, 0);

const AGENDAMENTOS_ATRASO = [
  { data_agend: addDias(hoje, -30), data_venc: addDias(hoje, -30), codigo: 29, classif: '10.01 - Receita com produto', empresa: 'COZINCA INOX LTDA', banco: 'Bradesco', pessoa: 'Cliente Exemplo RJ', descricao: 'Documento 19 - Parcela 1 de 1', valor: 10, saldo: saldoTotal },
  { data_agend: addDias(hoje, -30), data_venc: addDias(hoje, -30), codigo: 30, classif: '10.01 - Receita com produto', empresa: 'COZINCA INOX LTDA', banco: 'Bradesco', pessoa: 'Cliente Exemplo RJ', descricao: 'Documento 20 - Parcela 1 de 1', valor: 100, saldo: saldoTotal + 10 },
  { data_agend: addDias(hoje, -30), data_venc: addDias(hoje, -30), codigo: 31, classif: '10.01 - Receita com produto', empresa: 'COZINCA INOX LTDA', banco: 'Bradesco', pessoa: 'Cliente Exemplo RJ', descricao: 'Documento 21 - Parcela 1 de 1', valor: 100, saldo: saldoTotal + 110 },
  { data_agend: addDias(hoje, -30), data_venc: addDias(hoje, -30), codigo: 32, classif: '10.01 - Receita com produto', empresa: 'COZINCA INOX LTDA', banco: 'Bradesco', pessoa: 'Cliente Exemplo RJ', descricao: 'Documento 22 - Parcela 1 de 1', valor: 100, saldo: saldoTotal + 210 },
];

// Dados para gráfico de projeção
const gerarProjecao = () => {
  const dias = 30;
  let saldo = saldoTotal;
  return Array.from({ length: dias }, (_, i) => {
    const entradas = Math.random() * 5000 + 500;
    const saidas = Math.random() * 4000 + 300;
    saldo = saldo + entradas - saidas;
    return {
      data: addDias(hoje, i + 1).split('-').reverse().slice(0, 2).join('/'),
      entradas: Math.round(entradas),
      saidas: Math.round(saidas),
      saldo: Math.round(saldo),
    };
  });
};

export default function FluxoCaixa() {
  const [aba, setAba] = useState('geral');
  const [showContas, setShowContas] = useState(true);
  const [showAtraso, setShowAtraso] = useState(true);
  const [layout, setLayout] = useState('Detalhado');

  const projecao = useMemo(() => gerarProjecao(), []);

  const ABAS = [
    { id: 'geral', label: 'Geral' },
    { id: 'periodo', label: 'Período da projeção' },
    { id: 'saldo', label: 'Saldo da projeção' },
    { id: 'grafico', label: 'Gráfico' },
    { id: 'avancado', label: 'Avançado' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <h1 className="text-xl font-bold">Relatório fluxo de caixa</h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => toast.success('Relatório gerado!')} className="erp-btn-primary text-xs">Gerar relatório</button>
          <button type="button" onClick={() => toast.info('Reprogramando contas...')} className="erp-btn-ghost text-xs">Reprogramar contas a receber/pagar</button>
        </div>
      </div>

      {/* Abas */}
      <div className="border-b border-border flex gap-0 overflow-x-auto">
        {ABAS.map((a) => (
          <button key={a.id} type="button" onClick={() => setAba(a.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${aba === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {a.label}
          </button>
        ))}
      </div>

      {aba === 'geral' && (
        <div className="space-y-4">
          {/* Configuração */}
          <div className="erp-card p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <label className="erp-label">Layout do relatório</label>
                <select className="erp-input" value={layout} onChange={(e) => setLayout(e.target.value)}>
                  <option>Detalhado</option><option>Resumido</option><option>Por classificação</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contas bancárias */}
          <div className="erp-card">
            <button type="button" onClick={() => setShowContas(!showContas)}
              className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold hover:bg-muted/30 transition-colors">
              <span className="flex items-center gap-2"><DollarSign size={15} /> Contas bancárias</span>
              {showContas ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {showContas && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {CONTAS_BANCARIAS.filter((c) => c.ativa).map((c) => (
                    <div key={c.id} className={`p-3 rounded-lg border ${c.saldo < 0 ? 'border-red-200 bg-red-50' : 'border-border bg-muted/20'}`}>
                      <p className="text-xs font-semibold">{c.banco}</p>
                      <p className="text-[10px] text-muted-foreground">Ag. {c.agencia} | C/C {c.conta}</p>
                      <p className={`text-lg font-bold mt-1 ${c.saldo < 0 ? 'text-red-600' : 'text-green-700'}`}>{fmtBRL(c.saldo)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-semibold">Saldo em caixa:</span>
                  <span className={`text-lg font-bold ${saldoTotal < 0 ? 'text-red-600' : 'text-primary'}`}>{fmtBRL(saldoTotal)}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                  <span>Saldo inicial para projeção: <strong>{fmtBRL(saldoTotal)}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Agendamentos em atraso */}
          {AGENDAMENTOS_ATRASO.length > 0 && (
            <div className="erp-card border-red-200">
              <button type="button" onClick={() => setShowAtraso(!showAtraso)}
                className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-red-700 bg-red-50/60 rounded-t-lg hover:bg-red-50 transition-colors">
                <span className="flex items-center gap-2"><AlertCircle size={15} /> Agendamentos em atraso ({AGENDAMENTOS_ATRASO.length})</span>
                {showAtraso ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
              {showAtraso && (
                <div className="overflow-x-auto">
                  <table className="erp-table w-full text-xs min-w-[900px]">
                    <thead>
                      <tr className="bg-primary text-white">
                        <th>Data agend.</th><th>Data venc.</th><th>Cód. conta</th>
                        <th>Classificação</th><th>Empresa</th><th>Conta bancária</th>
                        <th>Pessoa</th><th>Descrição</th><th>Valor</th><th>Saldo projetado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {AGENDAMENTOS_ATRASO.map((a, i) => (
                        <tr key={i} className="bg-red-50/20 hover:bg-red-50/40">
                          <td className="text-red-600 font-medium">{fmtD(a.data_agend)}</td>
                          <td className="text-red-600 font-bold">{fmtD(a.data_venc)}</td>
                          <td className="font-mono text-primary">{a.codigo}</td>
                          <td className="text-muted-foreground">{a.classif}</td>
                          <td className="text-[10px]">{a.empresa}</td>
                          <td>{a.banco}</td>
                          <td className="font-medium">{a.pessoa}</td>
                          <td className="text-muted-foreground text-[10px]">{a.descricao}</td>
                          <td className="font-medium text-green-700">{fmtBRL(a.valor)}</td>
                          <td className="font-medium">{fmtBRL(a.saldo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {aba === 'grafico' && (
        <div className="space-y-4">
          <div className="erp-card p-4">
            <h3 className="text-sm font-semibold mb-4">Projeção de Fluxo de Caixa — próximos 30 dias</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projecao} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="data" tick={{ fontSize: 9 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmtBRL(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="entradas" fill="#22c55e" name="Entradas" radius={[2, 2, 0, 0]} />
                <Bar dataKey="saidas" fill="#ef4444" name="Saídas" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="erp-card p-4">
            <h3 className="text-sm font-semibold mb-4">Saldo projetado</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={projecao} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="data" tick={{ fontSize: 9 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmtBRL(v)} />
                <Line type="monotone" dataKey="saldo" stroke="#0066cc" strokeWidth={2} dot={false} name="Saldo" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {aba === 'periodo' && (
        <div className="erp-card p-4 space-y-3">
          <h3 className="font-semibold">Configuração do período de projeção</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><label className="erp-label">Data inicial</label><input type="date" className="erp-input w-full" defaultValue={hoje} /></div>
            <div><label className="erp-label">Data final</label><input type="date" className="erp-input w-full" defaultValue={addDias(hoje, 90)} /></div>
            <div><label className="erp-label">Periodicidade</label>
              <select className="erp-input w-full"><option>Diário</option><option>Semanal</option><option>Mensal</option></select>
            </div>
            <div className="flex items-end">
              <button type="button" onClick={() => toast.success('Período atualizado!')} className="erp-btn-primary w-full text-xs">Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {aba === 'saldo' && (
        <div className="erp-card p-4 space-y-3">
          <h3 className="font-semibold">Configuração do saldo da projeção</h3>
          <div className="space-y-3">
            {CONTAS_BANCARIAS.filter((c) => c.ativa).map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="text-sm font-medium">{c.banco}</p>
                  <p className="text-xs text-muted-foreground">Ag. {c.agencia} | C/C {c.conta}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Saldo atual</p>
                  <p className={`font-bold ${c.saldo < 0 ? 'text-red-600' : 'text-green-700'}`}>{fmtBRL(c.saldo)}</p>
                </div>
                <div>
                  <label className="erp-label text-[10px]">Saldo para projeção</label>
                  <input type="number" step="0.01" className="erp-input text-xs w-32" defaultValue={c.saldo} />
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => toast.success('Saldo da projeção atualizado!')} className="erp-btn-primary text-xs">Salvar configuração</button>
        </div>
      )}
    </div>
  );
}
