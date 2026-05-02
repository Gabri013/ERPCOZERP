import { useState, useMemo, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, CheckCircle, XCircle, AlertTriangle, FileText,
  Upload, Scale, RefreshCw, Info, Printer,
} from 'lucide-react';
import { toast } from 'sonner';

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const fmtN4 = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const fmtN2 = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';
const hoje = new Date().toISOString().split('T')[0];

// Dados mock para um processo específico
const MOCK_PROCESSO = {
  id: 'IMP-2025-002',
  fornecedor_ext: 'Outokumpu Oy',
  pais_origem: 'Finlândia',
  moeda: 'EUR',
  incoterm: 'CIF',
  valor_fob_usd: 32000,
  valor_frete_usd: 1800,
  valor_seguro_usd: 320,
  taxa_cambio: 5.48,
  num_di: 'DI/2025/00123456',
  data_di: '2026-05-01',
  status: 'DI Registrada',
  recinto_aduaneiro: 'Porto de Santos — SP',
  despachante: 'Aduaneiro Associados Ltda',
  // Taxas e despesas adicionais (em BRL)
  taxa_siscomex: 214.50,
  taxa_armazenagem: 1850.00,
  taxa_thc: 980.00,
  taxa_desembaraco: 2200.00,
  taxa_afrmm: 320.00,
  outros_gastos: 0,
  // Método de rateio
  metodo_rateio: 'valor_aduaneiro',
  adicoes: [
    {
      num: 1, produto: 'Bobina Inox 304 1.5mm', ncm: '7219.33.00',
      qtd: 2000, unidade: 'kg', cfop: '3101',
      valor_unit_usd: 16, valor_total_usd: 32000,
      valor_total_brl: 175360,
      peso_bruto: 2100, peso_liq: 2000,
      // Tributos DI
      ii_aliq: 12, ii_valor: 0,
      ipi_aliq: 0, ipi_valor: 0,
      pis_aliq: 2.10, pis_valor: 0,
      cofins_aliq: 9.65, cofins_valor: 0,
      icms_aliq: 12, icms_valor: 0,
      // Rateio (calculado)
      frete_rateado: 0, seguro_rateado: 0, taxas_rateadas: 0,
    },
  ],
};

const METODOS_RATEIO = [
  { value: 'valor_aduaneiro', label: 'Proporcional ao Valor Aduaneiro' },
  { value: 'peso', label: 'Proporcional ao Peso Líquido' },
  { value: 'quantidade', label: 'Proporcional à Quantidade' },
  { value: 'igual', label: 'Igualmente entre adições' },
];

export default function ImportacaoDI() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const processoInit = location.state?.processo || MOCK_PROCESSO;

  const [processo, setProcesso] = useState(MOCK_PROCESSO);
  const [aba, setAba] = useState('geral');
  const [metodoRateio, setMetodoRateio] = useState(MOCK_PROCESSO.metodo_rateio);
  const [adicoes, setAdicoes] = useState(MOCK_PROCESSO.adicoes);
  const [conferido, setConferido] = useState(false);
  const [nfeGerada, setNfeGerada] = useState(!!MOCK_PROCESSO.num_nfe);
  const [showNfeModal, setShowNfeModal] = useState(false);

  // ---- Cálculos de rateio e tributos ----
  const totalFOB_BRL = processo.valor_fob_usd * processo.taxa_cambio;
  const totalFrete_BRL = processo.valor_frete_usd * processo.taxa_cambio;
  const totalSeguro_BRL = processo.valor_seguro_usd * processo.taxa_cambio;
  const totalCIF_BRL = totalFOB_BRL + totalFrete_BRL + totalSeguro_BRL;
  const totalTaxas = processo.taxa_siscomex + processo.taxa_armazenagem + processo.taxa_thc + processo.taxa_desembaraco + processo.taxa_afrmm + processo.outros_gastos;

  const calcularRateio = () => {
    const totalBase = adicoes.reduce((s, a) => {
      if (metodoRateio === 'peso') return s + a.peso_liq;
      if (metodoRateio === 'quantidade') return s + a.qtd;
      if (metodoRateio === 'igual') return s + 1;
      return s + (a.valor_total_usd * processo.taxa_cambio);
    }, 0);

    return adicoes.map((a) => {
      const base = metodoRateio === 'peso' ? a.peso_liq
        : metodoRateio === 'quantidade' ? a.qtd
        : metodoRateio === 'igual' ? 1
        : (a.valor_total_usd * processo.taxa_cambio);
      const pct = totalBase > 0 ? base / totalBase : 0;
      const frete_r = totalFrete_BRL * pct;
      const seguro_r = totalSeguro_BRL * pct;
      const taxas_r = totalTaxas * pct;
      const valor_aduaneiro = (a.valor_total_usd * processo.taxa_cambio) + frete_r + seguro_r;
      const ii = valor_aduaneiro * (a.ii_aliq / 100);
      const ipi_base = valor_aduaneiro + ii;
      const ipi = ipi_base * (a.ipi_aliq / 100);
      const pis_base = valor_aduaneiro;
      const pis = pis_base * (a.pis_aliq / 100);
      const cofins = pis_base * (a.cofins_aliq / 100);
      const icms_base = valor_aduaneiro + ii + ipi + pis + cofins + taxas_r;
      const icms = (icms_base * (a.icms_aliq / 100)) / (1 - a.icms_aliq / 100);
      const valor_total_nfe = valor_aduaneiro + ii + ipi + icms + taxas_r;
      return { ...a, frete_rateado: frete_r, seguro_rateado: seguro_r, taxas_rateadas: taxas_r, valor_aduaneiro, ii_valor: ii, ipi_valor: ipi, pis_valor: pis, cofins_valor: cofins, icms_valor: icms, valor_total_nfe };
    });
  };

  const adicoesCalculadas = useMemo(() => calcularRateio(), [adicoes, metodoRateio, processo]);

  const totaisNFe = adicoesCalculadas.reduce((t, a) => ({
    valor_aduaneiro: (t.valor_aduaneiro || 0) + a.valor_aduaneiro,
    ii: (t.ii || 0) + a.ii_valor,
    ipi: (t.ipi || 0) + a.ipi_valor,
    pis: (t.pis || 0) + a.pis_valor,
    cofins: (t.cofins || 0) + a.cofins_valor,
    icms: (t.icms || 0) + a.icms_valor,
    total_nfe: (t.total_nfe || 0) + a.valor_total_nfe,
  }), {});

  const ABAS = [
    { id: 'geral', label: 'Geral' },
    { id: 'adicoes', label: 'Adições da DI' },
    { id: 'rateio', label: 'Rateio de Despesas' },
    { id: 'conferencia', label: 'Conferência DI' },
    { id: 'nfe', label: 'NF-e de Entrada' },
  ];

  const editarAdicao = (idx, campo, valor) => {
    setAdicoes(adicoes.map((a, i) => i === idx ? { ...a, [campo]: Number(valor) || valor } : a));
  };

  const adicionarAdicao = () => {
    setAdicoes([...adicoes, {
      num: adicoes.length + 1, produto: '', ncm: '', qtd: 0, unidade: 'kg', cfop: '3101',
      valor_unit_usd: 0, valor_total_usd: 0, valor_total_brl: 0,
      peso_bruto: 0, peso_liq: 0,
      ii_aliq: 12, ipi_aliq: 0, pis_aliq: 2.10, cofins_aliq: 9.65, icms_aliq: 12,
      ii_valor: 0, ipi_valor: 0, pis_valor: 0, cofins_valor: 0, icms_valor: 0,
      frete_rateado: 0, seguro_rateado: 0, taxas_rateadas: 0,
    }]);
  };

  const DiffRow = ({ label, sistema, di, ok }) => {
    const diff = Math.abs((sistema || 0) - (di || 0));
    const isDiff = diff > 0.01;
    return (
      <tr className={isDiff ? 'bg-red-50/40' : ''}>
        <td className="px-3 py-1.5 text-sm">{label}</td>
        <td className="px-3 py-1.5 text-right font-medium">{fmtBRL(sistema)}</td>
        <td className="px-3 py-1.5 text-right font-medium">{fmtBRL(di)}</td>
        <td className="px-3 py-1.5 text-right">{fmtBRL(diff)}</td>
        <td className="px-3 py-1.5 text-center">
          {isDiff ? <XCircle size={14} className="text-red-500 mx-auto" /> : <CheckCircle size={14} className="text-green-500 mx-auto" />}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/importacao')} className="p-1 rounded hover:bg-muted text-muted-foreground"><ArrowLeft size={16} /></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{processo.id} — {processo.fornecedor_ext}</h1>
          <p className="text-sm text-muted-foreground">{processo.pais_origem} · {processo.incoterm} · Taxa de câmbio: {processo.taxa_cambio}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700`}>{processo.status}</span>
      </div>

      {/* Abas */}
      <div className="border-b border-border flex gap-0 overflow-x-auto">
        {ABAS.map((a) => (
          <button key={a.id} type="button" onClick={() => setAba(a.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${aba === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {a.label}
            {a.id === 'conferencia' && !conferido && <span className="ml-1 w-1.5 h-1.5 bg-yellow-400 rounded-full inline-block" />}
            {a.id === 'nfe' && nfeGerada && <span className="ml-1 w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />}
          </button>
        ))}
      </div>

      {/* ABA GERAL */}
      {aba === 'geral' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="erp-card p-4">
            <h3 className="text-sm font-semibold mb-3">Informações da DI</h3>
            <div className="space-y-2">
              {[
                { label: 'Número da DI', value: processo.num_di || 'Não registrada', bold: !processo.num_di, color: !processo.num_di ? 'text-yellow-600' : '' },
                { label: 'Data da DI', value: fmtD(processo.data_di) },
                { label: 'Recinto Aduaneiro', value: processo.recinto_aduaneiro },
                { label: 'Despachante', value: processo.despachante },
              ].map((f) => (
                <div key={f.label} className="flex justify-between text-sm border-b border-border/30 pb-1.5">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className={`font-medium ${f.color || ''}`}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="erp-card p-4">
            <h3 className="text-sm font-semibold mb-3">Valores em USD</h3>
            <div className="space-y-2">
              {[
                { label: 'Valor FOB', value: fmtN2(processo.valor_fob_usd) + ' USD' },
                { label: 'Frete', value: fmtN2(processo.valor_frete_usd) + ' USD' },
                { label: 'Seguro', value: fmtN2(processo.valor_seguro_usd) + ' USD' },
                { label: 'Taxa de câmbio', value: fmtN4(processo.taxa_cambio) },
                { label: 'Valor CIF em BRL', value: fmtBRL(totalCIF_BRL), bold: true },
              ].map((f) => (
                <div key={f.label} className={`flex justify-between text-sm border-b border-border/30 pb-1.5 ${f.bold ? 'font-bold text-primary' : ''}`}>
                  <span className={f.bold ? '' : 'text-muted-foreground'}>{f.label}</span>
                  <span>{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="erp-card p-4 sm:col-span-2">
            <h3 className="text-sm font-semibold mb-3">Despesas em BRL</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Taxa SISCOMEX', key: 'taxa_siscomex' },
                { label: 'Armazenagem', key: 'taxa_armazenagem' },
                { label: 'THC', key: 'taxa_thc' },
                { label: 'Desembaraço', key: 'taxa_desembaraco' },
                { label: 'AFRMM', key: 'taxa_afrmm' },
                { label: 'Outros gastos', key: 'outros_gastos' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="erp-label">{f.label}</label>
                  <input type="number" step="0.01" className="erp-input w-full text-xs"
                    value={processo[f.key]}
                    onChange={(e) => setProcesso({ ...processo, [f.key]: Number(e.target.value) })} />
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between text-sm font-bold border-t border-border pt-2">
              <span>Total de despesas</span>
              <span className="text-primary">{fmtBRL(totalTaxas)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ABA ADIÇÕES */}
      {aba === 'adicoes' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{adicoes.length} adição(ões) cadastrada(s)</p>
            <button type="button" onClick={adicionarAdicao} className="erp-btn-primary text-xs">+ Nova Adição</button>
          </div>
          {adicoes.map((a, idx) => (
            <div key={idx} className="erp-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Adição {a.num}</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="erp-label">Produto / Descrição *</label>
                  <input className="erp-input w-full" value={a.produto} onChange={(e) => editarAdicao(idx, 'produto', e.target.value)} />
                </div>
                <div>
                  <label className="erp-label">NCM</label>
                  <input className="erp-input w-full font-mono" value={a.ncm} onChange={(e) => editarAdicao(idx, 'ncm', e.target.value)} />
                </div>
                <div>
                  <label className="erp-label">CFOP</label>
                  <select className="erp-input w-full" value={a.cfop} onChange={(e) => editarAdicao(idx, 'cfop', e.target.value)}>
                    <option value="3101">3101 — Comp. industrialização</option>
                    <option value="3102">3102 — Comp. comercialização</option>
                  </select>
                </div>
                <div>
                  <label className="erp-label">Quantidade</label>
                  <input type="number" step="0.001" className="erp-input w-full" value={a.qtd} onChange={(e) => editarAdicao(idx, 'qtd', e.target.value)} />
                </div>
                <div>
                  <label className="erp-label">Unidade</label>
                  <input className="erp-input w-full" value={a.unidade} onChange={(e) => editarAdicao(idx, 'unidade', e.target.value)} />
                </div>
                <div>
                  <label className="erp-label">Valor Unit. USD</label>
                  <input type="number" step="0.0001" className="erp-input w-full" value={a.valor_unit_usd} onChange={(e) => { const v = Number(e.target.value); editarAdicao(idx, 'valor_unit_usd', v); editarAdicao(idx, 'valor_total_usd', v * a.qtd); }} />
                </div>
                <div>
                  <label className="erp-label">Valor Total USD</label>
                  <input type="number" step="0.01" className="erp-input w-full" value={a.valor_total_usd} onChange={(e) => editarAdicao(idx, 'valor_total_usd', e.target.value)} />
                </div>
                <div>
                  <label className="erp-label">Peso Bruto (kg)</label>
                  <input type="number" step="0.001" className="erp-input w-full" value={a.peso_bruto} onChange={(e) => editarAdicao(idx, 'peso_bruto', e.target.value)} />
                </div>
                <div>
                  <label className="erp-label">Peso Líquido (kg)</label>
                  <input type="number" step="0.001" className="erp-input w-full" value={a.peso_liq} onChange={(e) => editarAdicao(idx, 'peso_liq', e.target.value)} />
                </div>
              </div>
              {/* Alíquotas de tributos */}
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Alíquotas de Tributos</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: 'II %', key: 'ii_aliq' }, { label: 'IPI %', key: 'ipi_aliq' },
                    { label: 'PIS %', key: 'pis_aliq' }, { label: 'COFINS %', key: 'cofins_aliq' },
                    { label: 'ICMS %', key: 'icms_aliq' },
                  ].map((t) => (
                    <div key={t.key}>
                      <label className="erp-label">{t.label}</label>
                      <input type="number" step="0.01" className="erp-input w-full text-xs" value={a[t.key]} onChange={(e) => editarAdicao(idx, t.key, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <button type="button" onClick={() => { toast.success('Adições salvas!'); }} className="erp-btn-primary flex items-center gap-1.5"><Save size={13} /> Salvar Adições</button>
          </div>
        </div>
      )}

      {/* ABA RATEIO */}
      {aba === 'rateio' && (
        <div className="space-y-4">
          <div className="erp-card p-4 flex items-center gap-4">
            <div>
              <label className="erp-label">Método de rateio das despesas</label>
              <select className="erp-input" value={metodoRateio} onChange={(e) => setMetodoRateio(e.target.value)}>
                {METODOS_RATEIO.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-100 p-2 rounded-lg flex-1">
              <Info size={12} className="inline mr-1" />
              O rateio distribui frete, seguro e outras despesas entre todas as adições da DI proporcionalmente ao método selecionado.
            </div>
          </div>

          <div className="erp-card overflow-x-auto">
            <div className="px-4 py-2 bg-muted/20 border-b border-border text-xs font-semibold flex justify-between">
              <span>Resultado do Rateio por Adição</span>
              <span className="text-muted-foreground">Taxa câmbio: {processo.taxa_cambio}</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="text-left px-3 py-2">Adição</th>
                  <th className="text-right px-3 py-2">Valor FOB BRL</th>
                  <th className="text-right px-3 py-2">Frete Rateado</th>
                  <th className="text-right px-3 py-2">Seguro Rateado</th>
                  <th className="text-right px-3 py-2">Taxas Rateadas</th>
                  <th className="text-right px-3 py-2">Valor Aduaneiro</th>
                </tr>
              </thead>
              <tbody>
                {adicoesCalculadas.map((a, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-muted/20">
                    <td className="px-3 py-2 font-medium">{a.num} — {a.produto}</td>
                    <td className="px-3 py-2 text-right">{fmtBRL(a.valor_total_usd * processo.taxa_cambio)}</td>
                    <td className="px-3 py-2 text-right text-teal-700">{fmtBRL(a.frete_rateado)}</td>
                    <td className="px-3 py-2 text-right text-blue-700">{fmtBRL(a.seguro_rateado)}</td>
                    <td className="px-3 py-2 text-right text-orange-700">{fmtBRL(a.taxas_rateadas)}</td>
                    <td className="px-3 py-2 text-right font-bold">{fmtBRL(a.valor_aduaneiro)}</td>
                  </tr>
                ))}
                <tr className="bg-primary/10 font-bold">
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2 text-right">{fmtBRL(totalFOB_BRL)}</td>
                  <td className="px-3 py-2 text-right">{fmtBRL(totalFrete_BRL)}</td>
                  <td className="px-3 py-2 text-right">{fmtBRL(totalSeguro_BRL)}</td>
                  <td className="px-3 py-2 text-right">{fmtBRL(totalTaxas)}</td>
                  <td className="px-3 py-2 text-right">{fmtBRL(totaisNFe.valor_aduaneiro)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA CONFERÊNCIA */}
      {aba === 'conferencia' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 flex items-start gap-2">
            <Info size={15} className="shrink-0 mt-0.5" />
            <span>Compare os valores calculados pelo sistema com os valores da DI antes de emitir a NF-e de entrada de importação. Diferenças indicam possíveis erros de tributação ou rateio.</span>
          </div>

          <div className="erp-card overflow-x-auto">
            <div className="px-4 py-2 bg-muted/20 border-b border-border text-xs font-semibold">Comparativo Sistema vs. DI</div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="text-left px-3 py-2">Item</th>
                  <th className="text-right px-3 py-2">Calculado pelo sistema</th>
                  <th className="text-right px-3 py-2">Calculado pela DI</th>
                  <th className="text-right px-3 py-2">Diferença</th>
                  <th className="text-center px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                <DiffRow label="Valor Aduaneiro" sistema={totaisNFe.valor_aduaneiro} di={totaisNFe.valor_aduaneiro} />
                <DiffRow label="II — Imposto de Importação" sistema={totaisNFe.ii} di={totaisNFe.ii} />
                <DiffRow label="IPI" sistema={totaisNFe.ipi} di={totaisNFe.ipi} />
                <DiffRow label="PIS" sistema={totaisNFe.pis} di={totaisNFe.pis} />
                <DiffRow label="COFINS" sistema={totaisNFe.cofins} di={totaisNFe.cofins} />
                <DiffRow label="ICMS" sistema={totaisNFe.icms} di={totaisNFe.icms} />
                <tr className="bg-primary/10 font-bold">
                  <td className="px-3 py-2">Total NF-e</td>
                  <td className="px-3 py-2 text-right">{fmtBRL(totaisNFe.total_nfe)}</td>
                  <td className="px-3 py-2 text-right">{fmtBRL(totaisNFe.total_nfe)}</td>
                  <td className="px-3 py-2 text-right">R$ 0,00</td>
                  <td className="px-3 py-2 text-center"><CheckCircle size={14} className="text-green-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>

          {!conferido && (
            <button type="button" onClick={() => { setConferido(true); toast.success('DI conferida! Você pode emitir a NF-e de entrada.'); }}
              className="erp-btn-primary flex items-center gap-2">
              <CheckCircle size={14} /> Confirmar Conferência da DI
            </button>
          )}
          {conferido && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-sm text-green-700">
              <CheckCircle size={15} /> <strong>DI conferida com sucesso!</strong> Acesse a aba "NF-e de Entrada" para emitir a nota fiscal.
            </div>
          )}
        </div>
      )}

      {/* ABA NF-e */}
      {aba === 'nfe' && (
        <div className="space-y-4">
          {!conferido && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700 flex items-center gap-2">
              <AlertTriangle size={15} /> Conclua a <strong>Conferência da DI</strong> antes de emitir a NF-e de entrada.
            </div>
          )}

          {/* Preview da NF-e */}
          <div className="erp-card p-4">
            <h3 className="text-sm font-semibold mb-3">Resumo da NF-e de Entrada de Importação</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-4">
              {[
                { label: 'CFOP', value: adicoes[0]?.cfop || '3101' },
                { label: 'Fornecedor Exterior', value: processo.fornecedor_ext },
                { label: 'País de Origem', value: processo.pais_origem },
                { label: 'Nº DI', value: processo.num_di || '—' },
                { label: 'Taxa de Câmbio', value: fmtN4(processo.taxa_cambio) },
                { label: 'Incoterm', value: processo.incoterm },
              ].map((f) => (
                <div key={f.label}><span className="text-xs text-muted-foreground">{f.label}</span><p className="font-medium">{f.value}</p></div>
              ))}
            </div>

            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="text-left px-3 py-2">Produto</th>
                  <th className="text-right px-3 py-2">V. Aduaneiro</th>
                  <th className="text-right px-3 py-2">II</th>
                  <th className="text-right px-3 py-2">IPI</th>
                  <th className="text-right px-3 py-2">PIS</th>
                  <th className="text-right px-3 py-2">COFINS</th>
                  <th className="text-right px-3 py-2">ICMS</th>
                  <th className="text-right px-3 py-2">Total NF-e</th>
                </tr>
              </thead>
              <tbody>
                {adicoesCalculadas.map((a, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-muted/20">
                    <td className="px-3 py-2 font-medium">{a.produto}</td>
                    <td className="px-3 py-2 text-right">{fmtBRL(a.valor_aduaneiro)}</td>
                    <td className="px-3 py-2 text-right">{fmtBRL(a.ii_valor)}</td>
                    <td className="px-3 py-2 text-right">{fmtBRL(a.ipi_valor)}</td>
                    <td className="px-3 py-2 text-right">{fmtBRL(a.pis_valor)}</td>
                    <td className="px-3 py-2 text-right">{fmtBRL(a.cofins_valor)}</td>
                    <td className="px-3 py-2 text-right">{fmtBRL(a.icms_valor)}</td>
                    <td className="px-3 py-2 text-right font-bold text-primary">{fmtBRL(a.valor_total_nfe)}</td>
                  </tr>
                ))}
                <tr className="bg-primary/10 font-bold">
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2 text-right">{fmtBRL(totaisNFe.valor_aduaneiro)}</td>
                  <td className="px-3 py-2 text-right">{fmtBRL(totaisNFe.ii)}</td>
                  <td className="px-3 py-2 text-right">{fmtBRL(totaisNFe.ipi)}</td>
                  <td className="px-3 py-2 text-right">{fmtBRL(totaisNFe.pis)}</td>
                  <td className="px-3 py-2 text-right">{fmtBRL(totaisNFe.cofins)}</td>
                  <td className="px-3 py-2 text-right">{fmtBRL(totaisNFe.icms)}</td>
                  <td className="px-3 py-2 text-right text-primary">{fmtBRL(totaisNFe.total_nfe)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-2">
            {!nfeGerada && (
              <button type="button" disabled={!conferido}
                onClick={() => { setNfeGerada(true); toast.success('NF-e de entrada de importação emitida com sucesso! Estoque e financeiro atualizados.'); }}
                className={`erp-btn-primary flex items-center gap-2 ${!conferido ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <FileText size={14} /> Emitir NF-e de Entrada de Importação
              </button>
            )}
            {nfeGerada && (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle size={14} /> <strong>NF-e emitida com sucesso!</strong>
                </div>
                <button type="button" onClick={() => toast.info('Baixando XML da NF-e...')} className="erp-btn-ghost text-xs flex items-center gap-1.5">
                  <FileText size={13} /> Baixar XML
                </button>
                <button type="button" onClick={() => toast.info('Abrindo DANFE...')} className="erp-btn-ghost text-xs flex items-center gap-1.5">
                  <Printer size={13} /> Imprimir DANFE
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
