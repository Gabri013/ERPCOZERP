import { useState, useMemo, useEffect, useCallback } from 'react';
import { RefreshCw, Download, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const anoAtual = new Date().getFullYear();

const EMPTY_MES = { receitaBruta: 0, impostos: 0, comissoes: 0, receitaLiq: 0, matPrima: 0, servIndustr: 0, margContrib: 0, pessoal: 0, infraestrutura: 0, marketing: 0, custosFixos: 0, ebitda: 0 };

const fmtN = (v, zero = true) => {
  if (!zero && (!v || v === 0)) return '';
  return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};
const fmtPct = (v, total) => total > 0 ? `${Math.round((v / total) * 100)} %` : '0 %';

export default function PainelFinanceiro() {
  const [ano, setAno] = useState(anoAtual);
  const [showFuncoes, setShowFuncoes] = useState(false);
  const [dados, setDados] = useState(MESES.map(() => ({ ...EMPTY_MES })));

  const loadData = useCallback(async () => {
    try {
      const res = await api.get(`/api/financial/panel?ano=${ano}`);
      const body = res?.data?.data ?? res?.data ?? {};
      const meses = Array.isArray(body.meses) ? body.meses : [];
      if (meses.length === 12) {
        setDados(meses.map((m) => ({ ...EMPTY_MES, ...m })));
      } else {
        setDados(MESES.map((_, i) => ({ ...EMPTY_MES, ...(meses[i] ?? {}) })));
      }
    } catch {
      setDados(MESES.map(() => ({ ...EMPTY_MES })));
    }
  }, [ano]);

  useEffect(() => { loadData(); }, [loadData]);

  const total = (key) => dados.reduce((s, d) => s + (d[key] || 0), 0);

  const LINHAS = [
    { key: 'receitaBruta', label: 'Receita operacional bruta', negrito: true, cor: '' },
    { key: 'receita10',    label: '[+] 10 - Receita', indent: 1, ref: 'receitaBruta' },
    { key: 'cheque12',     label: '12 - Cheques a receber', indent: 1, valor: 0 },
    { key: 'vazio1',       label: '', vazio: true },
    { key: 'impostos',     label: 'Custos de venda', negrito: true, cor: 'text-red-600' },
    { key: 'impostos20',   label: '20 - Impostos sobre a receita', indent: 1, ref: 'impostos', cor: 'text-red-600' },
    { key: 'comissoes22',  label: '22 - Comissões de venda', indent: 1, ref: 'comissoes', cor: 'text-red-600' },
    { key: 'vazio2',       label: '', vazio: true },
    { key: 'receitaLiq',   label: '(=) Receita operacional líquida', negrito: true, cor: '' },
    { key: 'pctRL',        label: 'Receita operacional líquida (%)', pct: true, cor: 'text-muted-foreground text-[10px]' },
    { key: 'vazio3',       label: '', vazio: true },
    { key: 'custoVar',     label: 'Custos operacionais variáveis', negrito: true, cor: 'text-red-600' },
    { key: 'matPrima30',   label: '30 - Compra de Matérias primas', indent: 1, ref: 'matPrima', cor: 'text-red-600' },
    { key: 'servIndustr33',label: '[+] 33 - Serviços de industrialização', indent: 1, ref: 'servIndustr', cor: 'text-red-600' },
    { key: 'vazio4',       label: '', vazio: true },
    { key: 'margContrib',  label: '(=) Margem de contribuição', negrito: true, cor: '' },
    { key: 'pctMC',        label: 'Margem de contribuição (%)', pct: true, cor: 'text-muted-foreground text-[10px]' },
    { key: 'vazio5',       label: '', vazio: true },
    { key: 'custosFixos',  label: 'Custos e despesas operacionais', negrito: true, cor: 'text-red-600' },
    { key: 'pessoal40',    label: '[+] 40 - Pessoal', indent: 1, ref: 'pessoal', cor: 'text-red-600' },
    { key: 'infra41',      label: '[+] 41 - Infra-estrutura', indent: 1, ref: 'infraestrutura', cor: 'text-red-600' },
    { key: 'market44',     label: '44 - Marketing e vendas', indent: 1, ref: 'marketing', cor: 'text-red-600' },
    { key: 'vazio6',       label: '', vazio: true },
    { key: 'ebitda',       label: '(=) EBITDA / Resultado', negrito: true, cor: 'text-green-700' },
  ];

  const getValor = (linha, idx) => {
    const d = dados[idx];
    if (linha.vazio) return null;
    if (linha.pct) return null;
    if (linha.ref) return d[linha.ref];
    if (typeof linha.valor === 'number') return linha.valor;
    return d[linha.key] || null;
  };

  const getCelula = (linha, idx) => {
    const d = dados[idx];
    if (!d || linha.vazio) return '';
    if (linha.pct) {
      if (linha.key === 'pctRL') return d.receitaLiq > 0 ? fmtPct(d.receitaLiq, d.receitaBruta) : '';
      if (linha.key === 'pctMC') return d.receitaBruta > 0 ? fmtPct(d.margContrib, d.receitaBruta) : '';
      return '';
    }
    let v;
    if (linha.ref) v = d[linha.ref];
    else if (typeof linha.valor === 'number') v = linha.valor;
    else v = d[linha.key];
    if (!v || v === 0) return '';
    const isNeg = ['impostos', 'comissoes', 'matPrima', 'servIndustr', 'pessoal', 'infraestrutura', 'marketing', 'custosFixos'].includes(linha.ref || linha.key);
    return isNeg ? `-${fmtN(Math.abs(v))}` : fmtN(v);
  };

  const getTotal = (linha) => {
    if (linha.vazio) return '';
    if (linha.pct) {
      const rl = total('receitaLiq'); const rb = total('receitaBruta');
      if (linha.key === 'pctRL') return rb > 0 ? fmtPct(rl, rb) : '';
      if (linha.key === 'pctMC') return rb > 0 ? fmtPct(total('margContrib'), rb) : '';
      return '';
    }
    let k = linha.ref || linha.key;
    if (typeof linha.valor === 'number') return fmtN(linha.valor);
    const v = total(k);
    if (!v) return '';
    const isNeg = ['impostos', 'comissoes', 'matPrima', 'servIndustr', 'pessoal', 'infraestrutura', 'marketing', 'custosFixos'].includes(k);
    return isNeg ? `-${fmtN(Math.abs(v))}` : fmtN(v);
  };

  return (
    <div className="space-y-4" onClick={() => setShowFuncoes(false)}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <h1 className="text-xl font-bold">Relatório painel financeiro</h1>
        <div className="flex gap-2 items-center">
          <select className="erp-input text-xs" value={ano} onChange={(e) => setAno(Number(e.target.value))}>
            {[anoAtual, anoAtual - 1, anoAtual - 2].map((y) => <option key={y}>{y}</option>)}
          </select>
          <button type="button" onClick={() => toast.success('Relatório gerado!')} className="erp-btn-primary text-xs">Gerar relatório</button>
          <div className="relative">
            <button type="button" onClick={(e) => { e.stopPropagation(); setShowFuncoes(!showFuncoes); }}
              className="erp-btn-ghost text-xs flex items-center gap-1">Funções especiais <ChevronDown size={11} /></button>
            {showFuncoes && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-border rounded-lg shadow-lg overflow-hidden w-44">
                {['Exportar Excel', 'Exportar PDF', 'Imprimir'].map((l) => (
                  <button key={l} type="button" onClick={() => toast.info(l)} className="flex w-full px-3 py-2 text-xs hover:bg-muted">{l}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="erp-card p-3 text-xs text-muted-foreground">
        O relatório está sendo gerado na moeda <strong>Real (R$)</strong>
      </div>

      <div className="erp-card overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-primary text-white">
              <th className="text-left px-3 py-2 font-semibold sticky left-0 bg-primary min-w-[220px]">Resultado</th>
              {MESES.map((m) => <th key={m} className="px-2 py-2 text-right font-medium min-w-[80px]">{m}/{String(ano).slice(2)}</th>)}
              <th className="px-2 py-2 text-right font-semibold min-w-[90px]">Total</th>
            </tr>
          </thead>
          <tbody>
            {LINHAS.map((linha, li) => {
              if (linha.vazio) return <tr key={li} className="h-2"><td colSpan={14} /></tr>;
              return (
                <tr key={li} className={`border-b border-border/40 hover:bg-muted/20 ${linha.negrito ? 'bg-blue-50/60' : ''}`}>
                  <td className={`px-3 py-1.5 sticky left-0 ${linha.negrito ? 'bg-blue-50/60 font-bold text-foreground' : 'bg-white text-muted-foreground'} ${linha.cor || ''}`}
                    style={{ paddingLeft: linha.indent ? `${linha.indent * 16 + 12}px` : '12px' }}>
                    {linha.label}
                  </td>
                  {MESES.map((_, i) => {
                    const val = getCelula(linha, i);
                    const isNeg = val.startsWith?.('-');
                    return (
                      <td key={i} className={`px-2 py-1.5 text-right ${linha.negrito ? 'font-bold' : ''} ${isNeg ? 'text-red-600' : ''} ${linha.cor || ''}`}>
                        {val}
                      </td>
                    );
                  })}
                  <td className={`px-2 py-1.5 text-right font-bold border-l border-border/40 ${linha.cor || ''} ${getTotal(linha).startsWith?.('-') ? 'text-red-600' : ''}`}>
                    {getTotal(linha)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
