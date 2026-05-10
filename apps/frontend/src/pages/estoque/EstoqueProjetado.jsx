import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, AlertTriangle, CheckCircle, BarChart2, List, Info } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const fmtN = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';
const hoje = new Date().toISOString().split('T')[0];
const addDias = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };


const TIPO_COR = {
  'Entrada':    { bg: 'bg-green-100 text-green-700',  sinal: '+', classe: 'text-green-700' },
  'Saída':      { bg: 'bg-red-100 text-red-700',      sinal: '−', classe: 'text-red-600' },
  'Empenho':    { bg: 'bg-orange-100 text-orange-700', sinal: '−', classe: 'text-orange-600' },
  'Requisição': { bg: 'bg-blue-100 text-blue-700',    sinal: '−', classe: 'text-blue-700' },
  'Sol. Compra':{ bg: 'bg-teal-100 text-teal-700',    sinal: '+', classe: 'text-teal-700' },
};

function calcularProjecao(produto) {
  const movs = [...produto.movimentacoes_futuras].sort((a, b) => a.data.localeCompare(b.data));
  let saldo = produto.saldo_atual;
  const linha = [{ data: 'Hoje', saldo, label: 'Hoje' }];
  movs.forEach((m) => {
    saldo = Math.round((saldo + m.qtd) * 1000) / 1000;
    linha.push({ data: fmtD(m.data), saldo, label: m.descricao, tipo: m.tipo, qtd: m.qtd, origem: m.origem });
  });
  return linha;
}

export default function EstoqueProjetado() {
  const [busca, setBusca] = useState('');
  const [produtoSel, setProdutoSel] = useState(null);
  const [modo, setModo] = useState('lista'); // 'lista' | 'grafico'
  const [produtos, setProdutos] = useState([]);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/api/stock/projected');
      setProdutos(res.data ?? []);
    } catch {
      toast.error('Erro ao carregar estoque projetado');
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const produtosFiltrados = useMemo(() => {
    const q = busca.toLowerCase();
    return produtos.filter((p) => !q || p.codigo.toLowerCase().includes(q) || p.descricao.toLowerCase().includes(q));
  }, [produtos, busca]);

  const projecao = useMemo(() => produtoSel ? calcularProjecao(produtoSel) : [], [produtoSel]);

  const saldoMinimo = projecao.length > 1 ? Math.min(...projecao.map((p) => p.saldo)) : 0;
  const alertaRuptura = produtoSel && saldoMinimo < produtoSel.estoque_minimo;

  const totaisSugestao = useMemo(() => produtos.map((p) => {
    const proj = calcularProjecao(p);
    const minSaldo = Math.min(...proj.map((x) => x.saldo));
    const abaixoMinimo = minSaldo < p.estoque_minimo;
    const qtdSugerida = abaixoMinimo ? Math.ceil(p.estoque_maximo - minSaldo) : 0;
    return { ...p, minSaldo, abaixoMinimo, qtdSugerida };
  }), [produtos]);

  const precisamCompra = totaisSugestao.filter((p) => p.abaixoMinimo);

  const chartData = projecao.map((p) => ({
    name: p.data,
    saldo: Math.max(p.saldo, 0),
    saldoReal: p.saldo,
    tipo: p.tipo,
  }));

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-3">
      {/* Painel esquerdo — lista */}
      <div className="w-72 shrink-0 flex flex-col gap-2">
        <div>
          <h1 className="font-bold text-base flex items-center gap-1.5"><BarChart2 size={16} className="text-primary" /> Estoque Projetado</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5">Projeção considerando todas as entradas e saídas futuras</p>
        </div>

        {/* Alertas */}
        {precisamCompra.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-[11px] text-red-700 flex items-start gap-1.5">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            <span><strong>{precisamCompra.length} produto(s)</strong> irão ficar abaixo do estoque mínimo</span>
          </div>
        )}

        {/* Busca */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="erp-input pl-7 text-xs w-full" placeholder="Buscar produto..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>

        {/* Lista de produtos */}
        <div className="overflow-y-auto flex-1 space-y-1 pr-1">
          {produtosFiltrados.map((p) => {
            const projecaoProd = calcularProjecao(p);
            const min = Math.min(...projecaoProd.map((x) => x.saldo));
            const ok = min >= p.estoque_minimo;
            return (
              <button key={p.id} type="button" onClick={() => setProdutoSel(p)}
                className={`w-full text-left p-2.5 rounded-lg border transition-colors ${produtoSel?.id === p.id ? 'bg-primary/10 border-primary' : 'bg-white border-border hover:bg-muted/30'}`}>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-xs font-semibold text-primary truncate">{p.codigo}</span>
                  {ok ? <CheckCircle size={12} className="text-green-500 shrink-0" /> : <AlertTriangle size={12} className="text-red-500 shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight truncate">{p.descricao}</p>
                <div className="flex justify-between mt-1 text-[10px]">
                  <span>Atual: <strong>{fmtN(p.saldo_atual)} {p.unidade}</strong></span>
                  <span className={min < p.estoque_minimo ? 'text-red-600 font-bold' : 'text-green-600'}>Mín proj: {fmtN(min)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Painel direito — detalhe */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!produtoSel ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <BarChart2 size={40} className="opacity-20" />
            <p>Selecione um produto para ver a projeção de estoque</p>
            {precisamCompra.length > 0 && (
              <div className="erp-card p-4 w-full max-w-lg">
                <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"><AlertTriangle size={14} className="text-red-500" /> Produtos que precisam de compra/produção</p>
                <table className="w-full text-xs">
                  <thead><tr className="bg-muted"><th className="p-2 text-left">Produto</th><th className="p-2 text-right">Saldo Mín</th><th className="p-2 text-right">Mín Estoque</th><th className="p-2 text-right">Qtd Sugerida</th></tr></thead>
                  <tbody>
                    {precisamCompra.map((p) => (
                      <tr key={p.id} className="border-b border-border/30 hover:bg-muted/20 cursor-pointer" onClick={() => setProdutoSel(p)}>
                        <td className="p-2"><div className="font-mono text-[10px]">{p.codigo}</div><div className="text-muted-foreground">{p.descricao}</div></td>
                        <td className="p-2 text-right text-red-600 font-bold">{fmtN(p.minSaldo)} {p.unidade}</td>
                        <td className="p-2 text-right">{fmtN(p.estoque_minimo)} {p.unidade}</td>
                        <td className="p-2 text-right font-bold text-primary">{p.qtdSugerida} {p.unidade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Header do produto */}
            <div className="bg-white border border-border rounded-lg p-3 mb-2 shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-primary">{produtoSel.codigo}</span>
                    <span className="text-sm font-medium">{produtoSel.descricao}</span>
                    {alertaRuptura && <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded"><AlertTriangle size={11} /> Risco de ruptura</span>}
                  </div>
                  <div className="flex gap-4 mt-1.5 text-xs text-muted-foreground">
                    <span>Saldo atual: <strong className="text-foreground">{fmtN(produtoSel.saldo_atual)} {produtoSel.unidade}</strong></span>
                    <span>Estoque mínimo: <strong className="text-foreground">{fmtN(produtoSel.estoque_minimo)} {produtoSel.unidade}</strong></span>
                    <span>Estoque máximo: <strong className="text-foreground">{fmtN(produtoSel.estoque_maximo)} {produtoSel.unidade}</strong></span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => setModo('lista')} className={`px-2.5 py-1 text-xs rounded ${modo === 'lista' ? 'bg-primary text-white' : 'bg-muted'}`}><List size={12} className="inline mr-1" />Tabela</button>
                  <button type="button" onClick={() => setModo('grafico')} className={`px-2.5 py-1 text-xs rounded ${modo === 'grafico' ? 'bg-primary text-white' : 'bg-muted'}`}><BarChart2 size={12} className="inline mr-1" />Gráfico</button>
                </div>
              </div>
            </div>

            {/* Legenda de origens */}
            <div className="flex flex-wrap gap-1.5 mb-2 shrink-0">
              {Object.entries(TIPO_COR).map(([k, v]) => (
                <span key={k} className={`px-2 py-0.5 rounded text-[10px] font-medium ${v.bg}`}>{k}</span>
              ))}
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-1"><Info size={9} /> Origens das movimentações futuras</span>
            </div>

            {/* Modo gráfico */}
            {modo === 'grafico' && (
              <div className="flex-1 bg-white border border-border rounded-lg p-4 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [`${fmtN(v)} ${produtoSel.unidade}`, 'Saldo']} />
                    <ReferenceLine y={produtoSel.estoque_minimo} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Mín', fill: '#ef4444', fontSize: 10 }} />
                    <ReferenceLine y={produtoSel.estoque_maximo} stroke="#22c55e" strokeDasharray="5 5" label={{ value: 'Máx', fill: '#22c55e', fontSize: 10 }} />
                    <Bar dataKey="saldo" name="Saldo Projetado" fill="#2563eb" radius={[3, 3, 0, 0]}
                      label={{ position: 'top', fontSize: 9, formatter: (v) => fmtN(v) }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Modo tabela */}
            {modo === 'lista' && (
              <div className="flex-1 bg-white border border-border rounded-lg overflow-hidden flex flex-col min-h-0">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-primary text-white">
                    <tr>
                      <th className="text-left px-3 py-2">Data</th>
                      <th className="text-left px-3 py-2">Tipo</th>
                      <th className="text-left px-3 py-2">Origem</th>
                      <th className="text-left px-3 py-2">Descrição</th>
                      <th className="text-right px-3 py-2">Quantidade</th>
                      <th className="text-right px-3 py-2">Saldo Projetado</th>
                      <th className="text-center px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="overflow-auto">
                    {projecao.map((p, i) => {
                      const tipo = TIPO_COR[p.tipo] || {};
                      const abaixoMin = p.saldo < produtoSel.estoque_minimo;
                      const acimaMx = p.saldo > produtoSel.estoque_maximo;
                      return (
                        <tr key={i} className={`border-b border-border/40 ${i === 0 ? 'bg-primary/5 font-semibold' : 'hover:bg-muted/20'} ${abaixoMin && i > 0 ? 'bg-red-50/40' : ''}`}>
                          <td className="px-3 py-2">{p.data}</td>
                          <td className="px-3 py-2">
                            {p.tipo ? <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${tipo.bg}`}>{p.tipo}</span> : <span className="text-muted-foreground">Saldo Atual</span>}
                          </td>
                          <td className="px-3 py-2 font-mono text-muted-foreground">{p.origem || '—'}</td>
                          <td className="px-3 py-2">{p.label}</td>
                          <td className={`px-3 py-2 text-right font-medium ${p.qtd > 0 ? 'text-green-700' : p.qtd < 0 ? 'text-red-600' : ''}`}>
                            {p.qtd !== undefined ? `${p.qtd > 0 ? '+' : ''}${fmtN(p.qtd)}` : '—'}
                          </td>
                          <td className={`px-3 py-2 text-right font-bold ${abaixoMin ? 'text-red-600' : acimaMx ? 'text-orange-500' : 'text-green-700'}`}>
                            {fmtN(p.saldo)} {produtoSel.unidade}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {i === 0 ? <span className="text-[10px] text-muted-foreground">—</span>
                              : abaixoMin ? <AlertTriangle size={13} className="text-red-500 mx-auto" title="Abaixo do mínimo" />
                              : acimaMx ? <AlertTriangle size={13} className="text-orange-400 mx-auto" title="Acima do máximo" />
                              : <CheckCircle size={13} className="text-green-500 mx-auto" />}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
