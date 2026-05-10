import { useState, useCallback, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Clock } from 'lucide-react';
import { api } from '@/services/api';

const fmtMin = (v) => `${Math.floor(v / 60)}h${String(v % 60).padStart(2, '0')}`;

const MEDALHA = ['🥇', '🥈', '🥉'];
const COR_CENTROS = { Corte: '#2563eb', Soldagem: '#f59e0b', Acabamento: '#10b981', Dobra: '#8b5cf6', Montagem: '#ef4444' };

export default function AnaliseTempos() {
  const [aba, setAba] = useState('tempos');
  const [tempos, setTempos] = useState([]);
  const [rankingOp, setRankingOp] = useState([]);
  const [rankingMaq, setRankingMaq] = useState([]);
  const [utilizacao, setUtilizacao] = useState([]);
  const [tendencia, setTendencia] = useState([]);
  const [maqSel, setMaqSel] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get('/api/production/time-analysis');
      const d = res.data?.data ?? res.data ?? {};
      setTempos(d.tempos ?? []);
      setRankingOp(d.ranking_operadores ?? d.rankingOp ?? []);
      const maqData = d.ranking_maquinas ?? d.rankingMaq ?? [];
      setRankingMaq(maqData);
      if (maqData.length > 0) setMaqSel(maqData[0]);
      setUtilizacao(d.utilizacao ?? []);
      setTendencia(d.tendencia ?? []);
    } catch {
      setTempos([]); setRankingOp([]); setRankingMaq([]); setUtilizacao([]); setTendencia([]);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const radarData = maqSel ? [
    { subject: 'Disponib.', A: maqSel.disponibilidade },
    { subject: 'Performance', A: maqSel.performance },
    { subject: 'Qualidade', A: maqSel.qualidade },
    { subject: 'OEE',      A: maqSel.oee },
  ] : [];

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><Clock size={20} className="text-primary" /> Análise de Tempos e Produtividade</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Tempos reais de fabricação, ranking de produtividade e utilização de capacidade</p>
      </div>

      {/* Abas */}
      <div className="border-b border-border flex gap-0">
        {[
          { id: 'tempos',     label: 'Tempos de Produção' },
          { id: 'ranking_op', label: 'Ranking Operadores' },
          { id: 'ranking_maq',label: 'Ranking Máquinas / OEE' },
          { id: 'utilizacao', label: 'Utilização de Capacidade' },
        ].map((a) => (
          <button key={a.id} type="button" onClick={() => setAba(a.id)}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${aba === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ── TEMPOS DE PRODUÇÃO ─────────────────────────────────────────────── */}
      {aba === 'tempos' && (
        <div className="space-y-3">
          <div className="erp-card overflow-x-auto">
            <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
              <p className="text-xs font-semibold">Apontamentos de Tempo — Tempo Padrão vs. Real</p>
            </div>
            <table className="erp-table w-full min-w-[800px]">
              <thead><tr><th>OP</th><th>Produto</th><th>Operação</th><th>Centro</th><th>Operador</th><th>Máquina</th><th className="text-right">T. Padrão</th><th className="text-right">T. Real</th><th className="text-right">Setup</th><th className="text-right">Eficiência</th></tr></thead>
              <tbody>
                {tempos.map((r, i) => (
                  <tr key={i}>
                    <td className="font-mono font-semibold text-primary">{r.op}</td>
                    <td className="text-muted-foreground">{r.produto}</td>
                    <td className="font-medium">{r.operacao}</td>
                    <td>{r.centro}</td>
                    <td>{r.operador}</td>
                    <td className="font-mono text-xs">{r.maquina}</td>
                    <td className="text-right">{fmtMin(r.t_padrao)}</td>
                    <td className={`text-right font-medium ${r.t_real > r.t_padrao ? 'text-red-600' : 'text-green-600'}`}>{fmtMin(r.t_real)}</td>
                    <td className="text-right text-muted-foreground">{fmtMin(r.t_setup)}</td>
                    <td className="text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${r.eficiencia >= 100 ? 'bg-green-100 text-green-700' : r.eficiencia >= 85 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {r.eficiencia}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Gráfico comparativo */}
          <div className="erp-card p-4" style={{ height: 260 }}>
            <p className="text-xs font-semibold mb-2">Tempo Padrão × Real por Operação (min)</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tempos.map((r) => ({ name: r.operacao, Padrão: r.t_padrao, Real: r.t_real }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v) => `${fmtMin(v)}`} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Padrão" fill="#94a3b8" radius={[3,3,0,0]} />
                <Bar dataKey="Real"   fill="#2563eb" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── RANKING OPERADORES ────────────────────────────────────────────── */}
      {aba === 'ranking_op' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {rankingOp.slice(0, 3).map((op, i) => (
              <div key={op.nome} className={`erp-card p-4 text-center border-2 ${i === 0 ? 'border-yellow-400 bg-yellow-50/40' : i === 1 ? 'border-gray-300 bg-gray-50/40' : 'border-orange-300 bg-orange-50/40'}`}>
                <div className="text-2xl mb-1">{MEDALHA[i]}</div>
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold mx-auto mb-1">{op.foto}</div>
                <p className="font-bold text-sm">{op.nome}</p>
                <p className="text-[10px] text-muted-foreground">{op.setor}</p>
                <div className="mt-2 space-y-0.5 text-xs">
                  <div className="flex justify-between"><span>Eficiência:</span><span className="font-bold text-green-600">{op.eficiencia}%</span></div>
                  <div className="flex justify-between"><span>OPs concluídas:</span><span className="font-bold">{op.ops_concluidas}</span></div>
                  <div className="flex justify-between"><span>Horas apontadas:</span><span className="font-bold">{op.horas}h</span></div>
                  <div className="flex justify-between"><span>Pontuação:</span><span className="font-bold text-primary">{op.pontos}</span></div>
                </div>
              </div>
            ))}
          </div>
          <div className="erp-card overflow-x-auto">
            <table className="erp-table w-full">
              <thead><tr><th>#</th><th>Operador</th><th>Setor</th><th className="text-right">Eficiência</th><th className="text-right">OPs</th><th className="text-right">Horas</th><th className="text-right">Pontuação</th></tr></thead>
              <tbody>
                {rankingOp.map((op, i) => (
                  <tr key={op.nome}>
                    <td className="text-center font-bold">{MEDALHA[i] || `${i+1}º`}</td>
                    <td><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-bold">{op.foto}</div>{op.nome}</div></td>
                    <td>{op.setor}</td>
                    <td className="text-right"><span className={`font-bold ${op.eficiencia >= 95 ? 'text-green-600' : op.eficiencia >= 85 ? 'text-yellow-600' : 'text-red-600'}`}>{op.eficiencia}%</span></td>
                    <td className="text-right">{op.ops_concluidas}</td>
                    <td className="text-right">{op.horas}h</td>
                    <td className="text-right font-bold text-primary">{op.pontos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── RANKING MÁQUINAS / OEE ────────────────────────────────────────── */}
      {aba === 'ranking_maq' && (
        <div className="space-y-3">
          <div className="flex gap-3 flex-col lg:flex-row">
            <div className="flex-1 erp-card overflow-x-auto">
              <table className="erp-table w-full">
                <thead><tr><th>#</th><th>Máquina</th><th>Centro</th><th className="text-right">OEE</th><th className="text-right">Disponib.</th><th className="text-right">Perf.</th><th className="text-right">Qualidade</th><th className="text-right">Horas Prod.</th></tr></thead>
                <tbody>
                  {rankingMaq.map((maq, i) => (
                    <tr key={maq.codigo} className={`cursor-pointer ${maqSel.codigo === maq.codigo ? 'bg-primary/5' : ''}`} onClick={() => setMaqSel(maq)}>
                      <td className="text-center font-bold">{MEDALHA[i] || `${i+1}º`}</td>
                      <td><div className="font-mono font-semibold text-primary">{maq.codigo}</div><div className="text-muted-foreground text-[10px]">{maq.nome}</div></td>
                      <td>{maq.setor}</td>
                      <td className="text-right"><span className={`font-bold text-sm ${maq.oee >= 85 ? 'text-green-600' : maq.oee >= 65 ? 'text-yellow-600' : 'text-red-600'}`}>{maq.oee}%</span></td>
                      <td className="text-right">{maq.disponibilidade}%</td>
                      <td className="text-right">{maq.performance}%</td>
                      <td className="text-right">{maq.qualidade}%</td>
                      <td className="text-right">{maq.horas_prod}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Radar OEE */}
            <div className="w-full lg:w-64 erp-card p-4 flex flex-col items-center">
              <p className="text-xs font-semibold mb-1">{maqSel?.nome ?? '—'}</p>
              <p className="text-2xl font-bold text-primary mb-1">{maqSel?.oee ?? 0}%</p>
              <p className="text-[10px] text-muted-foreground mb-3">OEE</p>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} />
                  <Radar dataKey="A" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Tendência OEE */}
          <div className="erp-card p-4" style={{ height: 220 }}>
            <p className="text-xs font-semibold mb-2">Tendência OEE por Centro (últimas 5 semanas)</p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tendencia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="semana" tick={{ fontSize: 9 }} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 9 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {Object.keys(COR_CENTROS).map((c) => (
                  <Line key={c} dataKey={c} stroke={COR_CENTROS[c]} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── UTILIZAÇÃO DE CAPACIDADE ─────────────────────────────────────── */}
      {aba === 'utilizacao' && (
        <div className="space-y-3">
          <div className="erp-card p-4" style={{ height: 280 }}>
            <p className="text-xs font-semibold mb-2">Composição das Horas por Centro de Trabalho (h/mês)</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizacao} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="centro" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 200]} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="utilizado"  name="Produzindo"  fill="#22c55e" stackId="a" />
                <Bar dataKey="setup"      name="Setup"       fill="#f59e0b" stackId="a" />
                <Bar dataKey="manutencao" name="Manutenção"  fill="#f97316" stackId="a" />
                <Bar dataKey="parada"     name="Parada"      fill="#ef4444" stackId="a" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {utilizacao.map((ct) => {
              const total = ct.utilizado + ct.setup + ct.manutencao + ct.parada;
              const pct_prod = Math.round((ct.utilizado / ct.capacidade) * 100);
              const pct_total = Math.round((total / ct.capacidade) * 100);
              return (
                <div key={ct.centro} className="erp-card p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div><p className="font-semibold text-sm">{ct.centro}</p><p className="text-[10px] text-muted-foreground">Cap. {ct.capacidade}h/mês</p></div>
                    <div className="text-right"><p className={`text-xl font-bold ${pct_prod >= 85 ? 'text-green-600' : pct_prod >= 65 ? 'text-primary' : 'text-muted-foreground'}`}>{pct_prod}%</p><p className="text-[10px] text-muted-foreground">utiliz. prod.</p></div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { label: 'Produzindo',  valor: ct.utilizado,  cor: 'bg-green-500',  pct: Math.round(ct.utilizado/ct.capacidade*100) },
                      { label: 'Setup',       valor: ct.setup,      cor: 'bg-yellow-500', pct: Math.round(ct.setup/ct.capacidade*100) },
                      { label: 'Manutenção',  valor: ct.manutencao, cor: 'bg-orange-500', pct: Math.round(ct.manutencao/ct.capacidade*100) },
                      { label: 'Parada',      valor: ct.parada,     cor: 'bg-red-500',    pct: Math.round(ct.parada/ct.capacidade*100) },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between mb-0.5"><span className="text-muted-foreground">{item.label}</span><span className="font-medium">{item.valor}h ({item.pct}%)</span></div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className={`h-full ${item.cor} rounded-full`} style={{ width: `${item.pct}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
