import { useState, useMemo, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Upload, Download, Plus, Pencil, Trash2, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const ANO = new Date().getFullYear();
const MES_ATUAL = new Date().getMonth(); // 0-based

function mediaMovel(hist, n = 3) {
  if (hist.length < n) return hist.length ? hist[hist.length - 1] : 0;
  return Math.round(hist.slice(-n).reduce((s, v) => s + v, 0) / n);
}

const MOCK_PRODUTOS = [
  {
    id: 1, codigo: 'TANK-500L', descricao: 'Tanque Inox 316L 500L', unidade: 'pc',
    historico: [2, 3, 1, 2, 4, 3, 2, 3, 5, 4, 3, 4],
    previsao_manual: null,
  },
  {
    id: 2, codigo: 'REATOR-200L', descricao: 'Reator Inox 316L 200L', unidade: 'pc',
    historico: [1, 0, 2, 1, 2, 1, 3, 2, 1, 2, 2, 3],
    previsao_manual: null,
  },
  {
    id: 3, codigo: 'COND-50M2', descricao: 'Condensador Tubular 50m²', unidade: 'pc',
    historico: [0, 1, 0, 1, 1, 2, 1, 1, 0, 2, 1, 1],
    previsao_manual: null,
  },
  {
    id: 4, codigo: 'TANKMIX-1000L', descricao: 'Tanque Misturador 1000L', unidade: 'pc',
    historico: [1, 1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 2],
    previsao_manual: null,
  },
];

const MESES_FUTUROS = 6;

export default function PrevisaoVendas() {
  const [produtos, setProdutos] = useState(MOCK_PRODUTOS);
  const [produtoSel, setProdutoSel] = useState(MOCK_PRODUTOS[0]);
  const [editandoId, setEditandoId] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [aba, setAba] = useState('grafico');
  const [metodoPrev, setMetodoPrev] = useState('mm3'); // mm3 | mm6 | tendencia | manual
  const [importStep, setImportStep] = useState(null); // null | 'drag' | 'preview'
  const fileRef = useRef();

  const previsaoCalc = useMemo(() => {
    return produtos.map((p) => {
      const previsoes = [];
      for (let i = 0; i < MESES_FUTUROS; i++) {
        if (p.previsao_manual != null && metodoPrev === 'manual') {
          previsoes.push(p.previsao_manual);
        } else if (metodoPrev === 'mm6') {
          previsoes.push(mediaMovel(p.historico, 6));
        } else if (metodoPrev === 'tendencia') {
          const mm3 = mediaMovel(p.historico, 3);
          const mm6 = mediaMovel(p.historico, 6);
          const tend = mm3 > mm6 ? 1.08 : mm3 < mm6 ? 0.95 : 1;
          previsoes.push(Math.round(mm3 * Math.pow(tend, i + 1)));
        } else {
          previsoes.push(mediaMovel(p.historico, 3));
        }
      }
      return { ...p, previsoes };
    });
  }, [produtos, metodoPrev]);

  const selComPrevisao = useMemo(() => previsaoCalc.find((p) => p.id === produtoSel.id) || produtoSel, [previsaoCalc, produtoSel]);

  const chartDataHistorico = useMemo(() => {
    return selComPrevisao.historico.map((v, i) => ({
      mes: `${MESES_ABREV[i]}/${ANO - 1}`,
      realizado: v,
    }));
  }, [selComPrevisao]);

  const chartDataFuturo = useMemo(() => {
    return selComPrevisao.previsoes.map((v, i) => {
      const mesIdx = (MES_ATUAL + i) % 12;
      const anoFut = MES_ATUAL + i >= 12 ? ANO + 1 : ANO;
      return { mes: `${MESES_ABREV[mesIdx]}/${anoFut}`, previsto: v };
    });
  }, [selComPrevisao]);

  const salvarPrevisao = (prodId) => {
    const val = Number(editVal);
    if (isNaN(val) || val < 0) { toast.error('Valor inválido'); return; }
    setProdutos(produtos.map((p) => p.id === prodId ? { ...p, previsao_manual: val } : p));
    setEditandoId(null);
    toast.success('Previsão atualizada!');
  };

  const gerarCSV = () => {
    const header = ['Código', 'Produto', ...Array.from({ length: MESES_FUTUROS }, (_, i) => {
      const m = (MES_ATUAL + i) % 12; const a = MES_ATUAL + i >= 12 ? ANO + 1 : ANO;
      return `${MESES_ABREV[m]}/${a}`;
    })].join(';');
    const rows = previsaoCalc.map((p) => [p.codigo, p.descricao, ...p.previsoes].join(';'));
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `PrevisaoVendas_${ANO}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const simularImport = () => {
    toast.success('Previsão importada da planilha Excel com sucesso!');
    setImportStep(null);
    setProdutos(produtos.map((p) => ({ ...p, previsao_manual: mediaMovel(p.historico, 3) + 1 })));
    setMetodoPrev('manual');
  };

  const totalPrevisoes = previsaoCalc.map((p) => p.previsoes.reduce((s, v) => s + v, 0));

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><TrendingUp size={20} className="text-primary" /> Previsão de Vendas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Cálculo a partir da análise histórica dos pedidos de venda dos últimos 12 meses</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={() => setImportStep('drag')} className="erp-btn-ghost text-xs flex items-center gap-1.5"><FileSpreadsheet size={13} /> Importar Excel</button>
          <button type="button" onClick={gerarCSV} className="erp-btn-ghost text-xs flex items-center gap-1.5"><Download size={13} /> Exportar CSV</button>
        </div>
      </div>

      {/* Método de cálculo */}
      <div className="erp-card p-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="text-xs font-medium shrink-0">Método de previsão:</span>
        <div className="flex gap-1 flex-wrap">
          {[
            { id: 'mm3', label: 'Média Móvel 3 meses' },
            { id: 'mm6', label: 'Média Móvel 6 meses' },
            { id: 'tendencia', label: 'Tendência' },
            { id: 'manual', label: 'Manual / Importado' },
          ].map((m) => (
            <button key={m.id} type="button" onClick={() => setMetodoPrev(m.id)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${metodoPrev === m.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 h-[calc(100vh-18rem)]">
        {/* Lista de produtos */}
        <div className="w-64 shrink-0 flex flex-col gap-1 overflow-y-auto pr-1">
          {previsaoCalc.map((p, idx) => (
            <button key={p.id} type="button" onClick={() => setProdutoSel(p)}
              className={`text-left p-2.5 rounded-lg border transition-colors ${produtoSel.id === p.id ? 'bg-primary/10 border-primary' : 'bg-white border-border hover:bg-muted/30'}`}>
              <div className="font-mono text-xs font-semibold text-primary">{p.codigo}</div>
              <div className="text-xs text-muted-foreground truncate">{p.descricao}</div>
              <div className="flex justify-between mt-1 text-[10px]">
                <span>Total previsto:</span>
                <span className="font-semibold text-foreground">{totalPrevisoes[idx]} {p.unidade}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Painel direito */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          {/* Abas */}
          <div className="flex gap-0 border-b border-border shrink-0">
            {[{ id: 'grafico', label: 'Gráfico' }, { id: 'tabela', label: 'Tabela Mensal' }].map((a) => (
              <button key={a.id} type="button" onClick={() => setAba(a.id)}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${aba === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
                {a.label}
              </button>
            ))}
          </div>

          {aba === 'grafico' && (
            <div className="flex-1 grid grid-rows-2 gap-3 overflow-hidden">
              <div className="erp-card p-4 flex flex-col overflow-hidden">
                <p className="text-xs font-semibold mb-2">Histórico de Vendas — 12 meses</p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataHistorico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="realizado" name="Realizado" fill="#2563eb" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="erp-card p-4 flex flex-col overflow-hidden">
                <p className="text-xs font-semibold mb-2">Previsão — próximos {MESES_FUTUROS} meses ({metodoPrev === 'mm3' ? 'Média Móvel 3m' : metodoPrev === 'mm6' ? 'Média Móvel 6m' : metodoPrev === 'tendencia' ? 'Tendência' : 'Manual'})</p>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataFuturo}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                    <Tooltip />
                    <Line dataKey="previsto" name="Previsto" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {aba === 'tabela' && (
            <div className="flex-1 overflow-auto erp-card">
              <table className="erp-table w-full min-w-[800px]">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-white z-10">Produto</th>
                    {selComPrevisao.historico.map((_, i) => (
                      <th key={i} className="text-right whitespace-nowrap text-muted-foreground font-normal">{MESES_ABREV[i]}/{ANO-1}</th>
                    ))}
                    <th className="text-center bg-amber-50 text-amber-700 font-semibold" colSpan={MESES_FUTUROS}>↓ Previsão ↓</th>
                  </tr>
                  <tr className="bg-amber-50">
                    <th className="sticky left-0 bg-amber-50 z-10 text-amber-700">Meses futuros →</th>
                    {selComPrevisao.historico.map((_, i) => <th key={i}></th>)}
                    {selComPrevisao.previsoes.map((_, i) => {
                      const m = (MES_ATUAL + i) % 12; const a = MES_ATUAL + i >= 12 ? ANO + 1 : ANO;
                      return <th key={i} className="text-right whitespace-nowrap text-amber-700">{MESES_ABREV[m]}/{a}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {previsaoCalc.map((p) => (
                    <tr key={p.id}>
                      <td className="sticky left-0 bg-white z-10">
                        <div className="font-mono text-xs font-semibold text-primary">{p.codigo}</div>
                        <div className="text-muted-foreground text-[10px]">{p.descricao}</div>
                      </td>
                      {p.historico.map((v, i) => <td key={i} className="text-right font-medium">{v}</td>)}
                      {p.previsoes.map((v, i) => (
                        <td key={i} className="text-right bg-amber-50/60">
                          {editandoId === `${p.id}-${i}` ? (
                            <input type="number" min="0" className="w-12 text-xs border rounded px-1 text-right" value={editVal}
                              onChange={(e) => setEditVal(e.target.value)}
                              onBlur={() => salvarPrevisao(p.id)}
                              onKeyDown={(e) => e.key === 'Enter' && salvarPrevisao(p.id)}
                              autoFocus />
                          ) : (
                            <span className="cursor-pointer text-amber-700 font-semibold" onClick={() => { setEditandoId(`${p.id}-${i}`); setEditVal(String(v)); }}>{v}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal importar Excel */}
      {importStep && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2"><FileSpreadsheet size={15} className="text-green-600" /> Importar Previsão de Vendas — Excel</h2>
              <button type="button" onClick={() => setImportStep(null)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div
                className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center cursor-pointer hover:bg-primary/5 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); simularImport(); }}>
                <Upload size={28} className="mx-auto text-primary/40 mb-2" />
                <p className="text-sm font-medium">Arraste o arquivo ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground mt-1">Formatos: .xlsx, .xls, .csv</p>
                <input ref={fileRef} type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={() => simularImport()} />
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Formato esperado da planilha:</p>
                <p>• Coluna A: Código do produto</p>
                <p>• Coluna B: Descrição do produto</p>
                <p>• Colunas C em diante: Previsão mensal (ex: Jan/2026, Fev/2026, ...)</p>
                <button type="button" className="text-primary hover:underline mt-1 flex items-center gap-1"><Download size={10} /> Baixar modelo de planilha</button>
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button type="button" onClick={() => setImportStep(null)} className="erp-btn-ghost text-xs">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
