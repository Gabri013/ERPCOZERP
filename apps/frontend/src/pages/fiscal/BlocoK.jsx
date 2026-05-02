import { useState, useMemo, useEffect, useCallback } from 'react';
import { Download, RefreshCw, CheckCircle, AlertTriangle, FileText, ChevronDown, ChevronRight, Loader2, Eye, Factory, Package, ArrowLeftRight, Users, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

const fmtN = (v, d = 3) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const ANO_ATUAL = new Date().getFullYear();


// ─────────────────────────────────────────────────────────────────────────────
// Gerador de arquivo SPED Bloco K (layout EFD-ICMS/IPI)
// ─────────────────────────────────────────────────────────────────────────────
function gerarArquivoSPED(mes, ano, dados, empresa = 'INDUSTRIA INOX LTDA', cnpj = '12.345.678/0001-99') {
  const { reg0210 = [], k200 = [], k220 = [], k230 = [], k235 = [], k250 = [], k255 = [], h005 = [] } = dados;
  const dtIni = `${String(1).padStart(2,'0')}${String(mes+1).padStart(2,'0')}${ano}`;
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();
  const dtFin = `${String(ultimoDia).padStart(2,'0')}${String(mes+1).padStart(2,'0')}${ano}`;
  const lines = [];
  const pipe = (...f) => `|${f.join('|')}|`;

  // Abertura
  lines.push(pipe('0000','013','0',dtIni,dtFin,empresa,cnpj,'35','','SP','','','1','','','0','0'));
  lines.push(pipe('0001','0'));

  // Registro 0210 — consumo específico padronizado
  reg0210.forEach(r => {
    const qtdC = r.qtd_consumo.toFixed(3).replace('.', ',');
    const perda = r.perda_perc.toFixed(2).replace('.', ',');
    lines.push(pipe('0210',r.codigo_insumo,r.codigo_produto,'',qtdC,r.unid,perda));
  });
  lines.push(pipe('0990',String(reg0210.length + 2)));

  // Bloco K abertura
  lines.push(pipe('K001','0'));
  lines.push(pipe('K010',cnpj,''));

  // K200 — estoque escriturado
  k200.forEach(r => {
    const qtd = r.qtd_final.toFixed(3).replace('.', ',');
    lines.push(pipe('K200',dtFin,r.codigo,qtd,r.unid,r.ind_part));
  });

  // K220 — movimentações internas
  k220.forEach(r => {
    const dt = r.data.split('-').reverse().join('');
    lines.push(pipe('K220',dt,r.codigo_prod_orig,r.qtd_orig.toFixed(3).replace('.',','),r.codigo_prod_dest,r.qtd_dest.toFixed(3).replace('.',',')));
  });

  // K230 / K235
  k230.forEach(r => {
    const dtI = r.data_ini.split('-').reverse().join('');
    const dtF = r.data_fin.split('-').reverse().join('');
    lines.push(pipe('K230',dtI,dtF,r.codigo_prod,r.qtd_prod.toFixed(3).replace('.',','),r.unid,'',r.cod_op));
    const insumos = k235.filter(k => k.cod_op === r.cod_op);
    insumos.forEach(k => {
      const dt = k.data.split('-').reverse().join('');
      lines.push(pipe('K235',dt,k.codigo_insumo,k.qtd_consumida.toFixed(3).replace('.',','),k.unid,k.qtd_perda.toFixed(3).replace('.',',')));
    });
  });

  // K250 / K255
  k250.forEach(r => {
    const dtI = r.data_ini.split('-').reverse().join('');
    const dtF = r.data_fin.split('-').reverse().join('');
    lines.push(pipe('K250',dtI,dtF,r.codigo_prod,r.qtd_prod.toFixed(3).replace('.',','),r.unid,'',r.cod_opt));
    const insumos = k255.filter(k => k.cod_opt === r.cod_opt);
    insumos.forEach(k => {
      const dt = k.data.split('-').reverse().join('');
      lines.push(pipe('K255',dt,k.codigo_insumo,k.qtd_consumida.toFixed(3).replace('.',','),k.unid,k.qtd_perda.toFixed(3).replace('.',',')));
    });
  });

  // K990 — encerramento bloco K
  lines.push(pipe('K990',String(lines.filter(l => l.startsWith('|K')).length + 3)));

  // Bloco H
  lines.push(pipe('H001','0'));
  lines.push(pipe('H005',dtFin,'','01'));
  h005.forEach(r => {
    const qtd = r.qtd.toFixed(3).replace('.', ',');
    const custo = r.custo_unit.toFixed(2).replace('.', ',');
    lines.push(pipe('H010',r.codigo,r.unid,qtd,'03',custo,''));
  });
  lines.push(pipe('H990',String(h005.length + 4)));

  // Encerramento
  lines.push(pipe('9001','0'));
  lines.push(pipe('9900','0000','1'));
  lines.push(pipe('9990',String(lines.length + 3)));
  lines.push(pipe('9999',String(lines.length + 1)));

  return lines.join('\r\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function BlocoK() {
  const [mesSel, setMesSel] = useState(new Date().getMonth());
  const [anoSel, setAnoSel] = useState(ANO_ATUAL);
  const [aba, setAba] = useState('visao-geral');
  const [expandido, setExpandido] = useState({});
  const [gerando, setGerando] = useState(false);
  const [gerado, setGerado] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [dadosBloco, setDadosBloco] = useState({ reg0210: [], k200: [], k220: [], k230: [], k235: [], k250: [], k255: [], h005: [] });

  const carregar = useCallback(async () => {
    try {
      const res = await api.get(`/api/fiscal/bloco-k?mes=${mesSel + 1}&ano=${anoSel}`);
      if (res.data && typeof res.data === 'object') {
        setDadosBloco({
          reg0210: res.data.reg0210 ?? [],
          k200:    res.data.k200    ?? [],
          k220:    res.data.k220    ?? [],
          k230:    res.data.k230    ?? [],
          k235:    res.data.k235    ?? [],
          k250:    res.data.k250    ?? [],
          k255:    res.data.k255    ?? [],
          h005:    res.data.h005    ?? [],
        });
      }
    } catch {
      // keep empty arrays if API not available
    }
  }, [mesSel, anoSel]);

  useEffect(() => { carregar(); }, [carregar]);

  const { reg0210: MOCK_0210, k200: MOCK_K200, k220: MOCK_K220, k230: MOCK_K230, k235: MOCK_K235, k250: MOCK_K250, k255: MOCK_K255, h005: MOCK_H005 } = dadosBloco;

  const conteudoSPED = useMemo(() => gerarArquivoSPED(mesSel, anoSel, dadosBloco), [mesSel, anoSel, dadosBloco]);
  const totalLinhas = conteudoSPED.split('\n').length;

  const toggleExpand = (key) => setExpandido((p) => ({ ...p, [key]: !p[key] }));

  const gerarSPED = async () => {
    setGerando(true);
    await new Promise((r) => setTimeout(r, 1800));
    setGerando(false);
    setGerado(true);
    toast.success('Bloco K gerado com sucesso!');
  };

  const baixarSPED = () => {
    const blob = new Blob([conteudoSPED], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SPED_BlocoK_${String(mesSel+1).padStart(2,'0')}_${anoSel}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ABAS = [
    { id: 'visao-geral', label: 'Visão Geral',  icon: FileText },
    { id: 'reg0210',     label: 'Reg. 0210',     icon: Package,       qtd: MOCK_0210.length },
    { id: 'regK200',     label: 'Reg. K200',     icon: Package,       qtd: MOCK_K200.length },
    { id: 'regK220',     label: 'Reg. K220',     icon: ArrowLeftRight, qtd: MOCK_K220.length },
    { id: 'regK230',     label: 'K230/K235',     icon: Factory,       qtd: MOCK_K230.length },
    { id: 'regK250',     label: 'K250/K255',     icon: Users,          qtd: MOCK_K250.length },
    { id: 'blocoH',      label: 'Bloco H',       icon: Building2,     qtd: MOCK_H005.length },
  ];

  const REGISTROS_RESUMO = [
    { reg: '0210', nome: 'Consumo Específico Padronizado', qtd: MOCK_0210.length, origem: 'Lista de Materiais (BOM)', ok: true },
    { reg: 'K200', nome: 'Estoque Escriturado',           qtd: MOCK_K200.length, origem: 'Controle de Estoque',      ok: true },
    { reg: 'K220', nome: 'Movimentações Internas',         qtd: MOCK_K220.length, origem: 'Reclassificação de Produtos', ok: true },
    { reg: 'K230', nome: 'Itens Produzidos',               qtd: MOCK_K230.length, origem: 'Reporte de Produção',      ok: true },
    { reg: 'K235', nome: 'Insumos Consumidos',             qtd: MOCK_K235.length, origem: 'Requisições de Produção',  ok: true },
    { reg: 'K250', nome: 'Itens Produzidos (em Terceiros)', qtd: MOCK_K250.length, origem: 'Produção em Terceiros',   ok: true },
    { reg: 'K255', nome: 'Insumos em Terceiros',           qtd: MOCK_K255.length, origem: 'Produção em Terceiros',    ok: true },
    { reg: 'H010', nome: 'Inventário (Bloco H)',           qtd: MOCK_H005.length, origem: 'Inventário de Estoque',    ok: true },
  ];

  const IND_PART_DESC = { '0': 'Próprio', '1': 'Terceiro (em nosso poder)', '2': 'Nosso (em poder de terceiro)' };

  return (
    <div className="space-y-3">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><FileText size={20} className="text-primary" /> Bloco K — SPED Fiscal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Geração integrada ao controle de produção, estoque, produção em terceiros e para terceiros</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select className="erp-input text-xs" value={mesSel} onChange={(e) => { setMesSel(Number(e.target.value)); setGerado(false); }}>
            {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select className="erp-input text-xs" value={anoSel} onChange={(e) => { setAnoSel(Number(e.target.value)); setGerado(false); }}>
            {[ANO_ATUAL - 1, ANO_ATUAL, ANO_ATUAL + 1].map((a) => <option key={a}>{a}</option>)}
          </select>
          <button type="button" onClick={() => setShowPreview(true)} className="erp-btn-ghost text-xs flex items-center gap-1.5"><Eye size={13} /> Preview</button>
          {gerado ? (
            <button type="button" onClick={baixarSPED} className="erp-btn-primary text-xs flex items-center gap-1.5"><Download size={13} /> Baixar .TXT</button>
          ) : (
            <button type="button" onClick={gerarSPED} disabled={gerando} className="erp-btn-primary text-xs flex items-center gap-1.5 disabled:opacity-60">
              {gerando ? <><Loader2 size={13} className="animate-spin" /> Gerando...</> : <><RefreshCw size={13} /> Gerar Bloco K</>}
            </button>
          )}
        </div>
      </div>

      {/* Banner status */}
      {gerado && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm text-green-800">
          <CheckCircle size={15} />
          <span>Bloco K gerado — competência <strong>{MESES[mesSel]} / {anoSel}</strong> — <strong>{totalLinhas} linhas</strong> · Arquivo pronto para download</span>
        </div>
      )}

      {/* Abas */}
      <div className="border-b border-border flex gap-0 overflow-x-auto">
        {ABAS.map((a) => (
          <button key={a.id} type="button" onClick={() => setAba(a.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${aba === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <a.icon size={12} />
            {a.label}
            {a.qtd != null && <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${aba === a.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>{a.qtd}</span>}
          </button>
        ))}
      </div>

      {/* ── VISÃO GERAL ─────────────────────────────────────────────────────── */}
      {aba === 'visao-geral' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total de registros',  value: REGISTROS_RESUMO.reduce((s, r) => s + r.qtd, 0), color: 'text-primary' },
              { label: 'Registros K230/K235', value: MOCK_K230.length + MOCK_K235.length, color: 'text-orange-600' },
              { label: 'Prod. em Terceiros',  value: MOCK_K250.length + MOCK_K255.length, color: 'text-teal-600' },
              { label: 'Linhas arquivo',      value: totalLinhas, color: 'text-muted-foreground' },
            ].map((k) => (
              <div key={k.label} className="erp-card p-3">
                <p className="text-[10px] text-muted-foreground">{k.label}</p>
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          <div className="erp-card overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
              <h3 className="text-xs font-semibold">Registros do Bloco K — Resumo de Validação</h3>
            </div>
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/20"><th className="text-left px-4 py-2">Registro</th><th className="text-left px-4 py-2">Nome</th><th className="text-left px-4 py-2">Origem no Sistema</th><th className="text-right px-4 py-2">Linhas</th><th className="text-center px-4 py-2">Status</th></tr></thead>
              <tbody>
                {REGISTROS_RESUMO.map((r) => (
                  <tr key={r.reg} className="border-b border-border/40 hover:bg-muted/10">
                    <td className="px-4 py-2.5 font-mono font-bold text-primary">{r.reg}</td>
                    <td className="px-4 py-2.5 font-medium">{r.nome}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.origem}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{r.qtd}</td>
                    <td className="px-4 py-2.5 text-center">
                      {r.ok ? <CheckCircle size={13} className="text-green-500 mx-auto" /> : <AlertTriangle size={13} className="text-red-500 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="erp-card p-4">
              <h3 className="text-xs font-semibold mb-2">Fontes de Dados</h3>
              <div className="space-y-2 text-xs">
                {[
                  { icon: <Package size={12} className="text-blue-500" />, label: 'Lista de Materiais (BOM)', desc: 'Gera Registro 0210 com consumo padronizado e % de perda' },
                  { icon: <Factory size={12} className="text-orange-500" />, label: 'Ordens de Produção', desc: 'Gera K230 (produzido) e K235 (insumos) por OP' },
                  { icon: <Users size={12} className="text-teal-500" />, label: 'Produção em Terceiros', desc: 'Gera K250 (produzido) e K255 (insumos) por OPT' },
                  { icon: <ArrowLeftRight size={12} className="text-purple-500" />, label: 'Movimentações de Estoque', desc: 'Gera K220 para reclassificações internas de produto' },
                  { icon: <Building2 size={12} className="text-gray-500" />, label: 'Inventário de Estoque', desc: 'Gera K200 com saldo final, incl. terceiros (ind. 1 e 2) e Bloco H' },
                ].map((f) => (
                  <div key={f.label} className="flex items-start gap-2 p-2 rounded bg-muted/20">
                    <span className="mt-0.5 shrink-0">{f.icon}</span>
                    <div><p className="font-medium">{f.label}</p><p className="text-muted-foreground">{f.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="erp-card p-4">
              <h3 className="text-xs font-semibold mb-2">Indicador de Participação (K200/H010)</h3>
              <div className="space-y-1.5 text-xs mb-3">
                {Object.entries(IND_PART_DESC).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2"><span className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">{k}</span><span>{v}</span></div>
                ))}
              </div>
              <div className="border-t border-border/40 pt-2 space-y-1 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Materiais de Terceiros em K200</p>
                <p className="flex gap-1"><span className="text-teal-600 font-mono">ind=1</span> Mat. de clientes em nosso poder (Prod. para Terceiros)</p>
                <p className="flex gap-1"><span className="text-orange-600 font-mono">ind=2</span> Nossos mat. em poder de terceiros (Prod. em Terceiros)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REGISTRO 0210 ────────────────────────────────────────────────────── */}
      {aba === 'reg0210' && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
            <Package size={12} className="shrink-0 mt-0.5" />
            <span>O Registro 0210 informa o consumo específico padronizado de cada insumo por produto fabricado, conforme a Lista de Materiais (BOM), incluindo a % de perda cadastrada.</span>
          </div>
          <div className="erp-card overflow-x-auto">
            <table className="erp-table w-full min-w-[700px]">
              <thead><tr><th>Produto Fabricado</th><th>Código Insumo</th><th>Insumo</th><th className="text-right">Qtd Base</th><th className="text-right">Qtd Consumo</th><th>UN</th><th className="text-right">% Perda</th></tr></thead>
              <tbody>
                {MOCK_0210.map((r, i) => (
                  <tr key={i}>
                    <td><div className="font-mono text-xs font-semibold text-primary">{r.codigo_produto}</div><div className="text-muted-foreground text-[10px]">{r.descricao_prod}</div></td>
                    <td className="font-mono text-xs">{r.codigo_insumo}</td>
                    <td className="text-muted-foreground text-xs">{r.descricao_insumo}</td>
                    <td className="text-right">{r.qtd_base}</td>
                    <td className="text-right font-medium">{fmtN(r.qtd_consumo)}</td>
                    <td>{r.unid}</td>
                    <td className="text-right">{r.perda_perc > 0 ? <span className="text-orange-600 font-medium">{r.perda_perc.toFixed(1)}%</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── REGISTRO K200 ────────────────────────────────────────────────────── */}
      {aba === 'regK200' && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
            <Package size={12} className="shrink-0 mt-0.5" />
            <span>O Registro K200 informa o saldo escriturado de cada produto no final do período, incluindo materiais de terceiros em nosso poder (ind=1) e nossos materiais em poder de terceiros (ind=2).</span>
          </div>
          <div className="erp-card overflow-x-auto">
            <table className="erp-table w-full min-w-[600px]">
              <thead><tr><th>Código Produto</th><th>Descrição</th><th>UN</th><th className="text-right">Qtd Final</th><th>Ind. Participação</th></tr></thead>
              <tbody>
                {MOCK_K200.map((r, i) => (
                  <tr key={i} className={r.tipo === 'terceiro_poder' ? 'bg-teal-50/30' : r.tipo === 'poder_terceiro' ? 'bg-orange-50/30' : ''}>
                    <td className="font-mono font-semibold text-primary">{r.codigo}</td>
                    <td>{r.descricao}</td>
                    <td>{r.unid}</td>
                    <td className="text-right font-medium">{fmtN(r.qtd_final)}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${r.ind_part === '1' ? 'bg-teal-100 text-teal-700' : r.ind_part === '2' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{r.ind_part}</span>
                        <span className="text-xs text-muted-foreground">{IND_PART_DESC[r.ind_part]}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── REGISTRO K220 ────────────────────────────────────────────────────── */}
      {aba === 'regK220' && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
            <ArrowLeftRight size={12} className="shrink-0 mt-0.5" />
            <span>O Registro K220 informa as movimentações internas de reclassificação de produtos (ex: quando o cliente exige um código específico de produto em seu faturamento).</span>
          </div>
          {MOCK_K220.length === 0 ? (
            <div className="erp-card p-8 text-center text-muted-foreground text-sm">Nenhuma reclassificação no período</div>
          ) : (
            <div className="erp-card overflow-x-auto">
              <table className="erp-table w-full min-w-[600px]">
                <thead><tr><th>Data</th><th>Produto Origem</th><th className="text-right">Qtd Origem</th><th>Produto Destino</th><th className="text-right">Qtd Destino</th><th>Observação</th></tr></thead>
                <tbody>
                  {MOCK_K220.map((r, i) => (
                    <tr key={i}>
                      <td>{fmtD(r.data)}</td>
                      <td className="font-mono font-semibold text-primary">{r.codigo_prod_orig}</td>
                      <td className="text-right">{fmtN(r.qtd_orig)}</td>
                      <td className="font-mono font-semibold text-primary">{r.codigo_prod_dest}</td>
                      <td className="text-right">{fmtN(r.qtd_dest)}</td>
                      <td className="text-muted-foreground text-xs">{r.obs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── K230 / K235 ──────────────────────────────────────────────────────── */}
      {aba === 'regK230' && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
            <Factory size={12} className="shrink-0 mt-0.5" />
            <span>K230 lista os itens produzidos em cada Ordem de Produção. K235 detalha os insumos efetivamente consumidos (requisições) com a quantidade de perda por insumo.</span>
          </div>
          <div className="space-y-2">
            {MOCK_K230.map((op, i) => {
              const insumos = MOCK_K235.filter((k) => k.cod_op === op.cod_op);
              const expKey = `k230-${i}`;
              return (
                <div key={i} className="erp-card overflow-hidden">
                  <button type="button" className="w-full flex items-center justify-between p-3 hover:bg-muted/20 transition-colors text-left" onClick={() => toggleExpand(expKey)}>
                    <div className="flex items-center gap-3">
                      <Factory size={14} className="text-orange-500 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary">{op.cod_op}</span>
                          <span className="font-medium text-sm">{op.codigo_prod}</span>
                          <span className="text-muted-foreground text-xs">— {op.descricao}</span>
                        </div>
                        <div className="flex gap-3 text-[10px] text-muted-foreground mt-0.5">
                          <span>Período: {fmtD(op.data_ini)} → {fmtD(op.data_fin)}</span>
                          <span>Qtd produzida: <strong>{op.qtd_prod} {op.unid}</strong></span>
                          <span>{insumos.length} insumo(s) consumido(s)</span>
                        </div>
                      </div>
                    </div>
                    {expandido[expKey] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {expandido[expKey] && (
                    <div className="border-t border-border/40 bg-muted/10">
                      <table className="w-full text-xs">
                        <thead><tr className="bg-muted/30"><th className="text-left px-4 py-1.5">Código Insumo</th><th className="text-right px-4 py-1.5">Qtd Consumida</th><th className="text-center px-4 py-1.5">UN</th><th className="text-right px-4 py-1.5">Qtd Perda</th><th className="text-center px-4 py-1.5">Data Req.</th></tr></thead>
                        <tbody>
                          {insumos.map((k, j) => (
                            <tr key={j} className="border-b border-border/20">
                              <td className="px-4 py-1.5 font-mono">{k.codigo_insumo}</td>
                              <td className="px-4 py-1.5 text-right font-medium">{fmtN(k.qtd_consumida)}</td>
                              <td className="px-4 py-1.5 text-center">{k.unid}</td>
                              <td className="px-4 py-1.5 text-right">{k.qtd_perda > 0 ? <span className="text-orange-600">{fmtN(k.qtd_perda)}</span> : '—'}</td>
                              <td className="px-4 py-1.5 text-center text-muted-foreground">{fmtD(k.data)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── K250 / K255 ──────────────────────────────────────────────────────── */}
      {aba === 'regK250' && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
            <Users size={12} className="shrink-0 mt-0.5" />
            <span>K250 lista os itens produzidos por terceiros (industrialização em terceiros — OPTs). K255 detalha os insumos remetidos e consumidos pelo terceiro na produção.</span>
          </div>
          <div className="space-y-2">
            {MOCK_K250.map((opt, i) => {
              const insumos = MOCK_K255.filter((k) => k.cod_opt === opt.cod_opt);
              const expKey = `k250-${i}`;
              return (
                <div key={i} className="erp-card overflow-hidden">
                  <button type="button" className="w-full flex items-center justify-between p-3 hover:bg-muted/20 transition-colors text-left" onClick={() => toggleExpand(expKey)}>
                    <div className="flex items-center gap-3">
                      <Users size={14} className="text-teal-500 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary">{opt.cod_opt}</span>
                          <span className="font-medium text-sm">{opt.codigo_prod}</span>
                          <span className="text-muted-foreground text-xs">— {opt.descricao}</span>
                        </div>
                        <div className="flex gap-3 text-[10px] text-muted-foreground mt-0.5">
                          <span>Fornecedor: <strong>{opt.fornecedor}</strong></span>
                          <span>Período: {fmtD(opt.data_ini)} → {fmtD(opt.data_fin)}</span>
                          <span>Qtd produzida: <strong>{opt.qtd_prod} {opt.unid}</strong></span>
                        </div>
                      </div>
                    </div>
                    {expandido[expKey] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {expandido[expKey] && (
                    <div className="border-t border-border/40 bg-muted/10">
                      <table className="w-full text-xs">
                        <thead><tr className="bg-muted/30"><th className="text-left px-4 py-1.5">Código Insumo</th><th className="text-right px-4 py-1.5">Qtd Consumida</th><th className="text-center px-4 py-1.5">UN</th><th className="text-right px-4 py-1.5">Qtd Perda</th><th className="text-center px-4 py-1.5">Data</th></tr></thead>
                        <tbody>
                          {insumos.map((k, j) => (
                            <tr key={j} className="border-b border-border/20">
                              <td className="px-4 py-1.5 font-mono">{k.codigo_insumo}</td>
                              <td className="px-4 py-1.5 text-right font-medium">{fmtN(k.qtd_consumida)}</td>
                              <td className="px-4 py-1.5 text-center">{k.unid}</td>
                              <td className="px-4 py-1.5 text-right">{k.qtd_perda > 0 ? <span className="text-orange-600">{fmtN(k.qtd_perda)}</span> : '—'}</td>
                              <td className="px-4 py-1.5 text-center text-muted-foreground">{fmtD(k.data)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── BLOCO H ──────────────────────────────────────────────────────────── */}
      {aba === 'blocoH' && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
            <Building2 size={12} className="shrink-0 mt-0.5" />
            <span>O Bloco H (Inventário Físico) apresenta o saldo de todos os produtos no final do período, incluindo materiais de terceiros em nosso poder e nossos materiais em poder de terceiros, com custo unitário para fins de escrituração contábil.</span>
          </div>
          <div className="erp-card overflow-x-auto">
            <table className="erp-table w-full min-w-[700px]">
              <thead><tr><th>Código</th><th>Descrição</th><th>UN</th><th className="text-right">Qtd Inventariada</th><th className="text-right">Custo Unitário</th><th className="text-right">Valor Total</th><th>Ind. Part.</th></tr></thead>
              <tbody>
                {MOCK_H005.map((r, i) => (
                  <tr key={i} className={r.ind_part === '1' ? 'bg-teal-50/30' : ''}>
                    <td className="font-mono font-semibold text-primary">{r.codigo}</td>
                    <td>{r.descricao}</td>
                    <td>{r.unid}</td>
                    <td className="text-right font-medium">{fmtN(r.qtd)}</td>
                    <td className="text-right">R$ {fmtN(r.custo_unit, 2)}</td>
                    <td className="text-right font-bold">R$ {fmtN(r.qtd * r.custo_unit, 2)}</td>
                    <td><span className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${r.ind_part === '1' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'}`}>{r.ind_part}</span></td>
                  </tr>
                ))}
                <tr className="bg-muted/30 font-bold border-t-2 border-border">
                  <td colSpan={5} className="px-4 py-2 text-right text-xs">Total do Inventário</td>
                  <td className="px-4 py-2 text-right">R$ {fmtN(MOCK_H005.reduce((s, r) => s + r.qtd * r.custo_unit, 0), 2)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL PREVIEW ────────────────────────────────────────────────────── */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-semibold text-sm">Preview do Arquivo SPED — Bloco K + H</h2>
                <p className="text-[10px] text-muted-foreground">{MESES[mesSel]} / {anoSel} · {totalLinhas} linhas</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={baixarSPED} className="erp-btn-primary text-xs flex items-center gap-1.5"><Download size={12} /> Download</button>
                <button type="button" onClick={() => setShowPreview(false)} className="erp-btn-ghost text-xs">Fechar</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-950">
              <pre className="text-[10px] text-green-400 font-mono leading-relaxed whitespace-pre">
                {conteudoSPED.split('\n').map((line, i) => {
                  const reg = line.match(/^\|([A-Z0-9]+)\|/)?.[1];
                  const color = reg?.startsWith('K') ? 'text-cyan-300' : reg?.startsWith('H') ? 'text-yellow-300' : reg === '0210' ? 'text-purple-300' : 'text-green-400';
                  return <span key={i} className={color}>{line}{'\n'}</span>;
                })}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
