import { useState, useRef } from 'react';
import {
  Link2, Upload, Download, CheckCircle, AlertTriangle, RefreshCw,
  FileText, Settings, Package, DollarSign, BookOpen, Plus, Eye,
  ChevronRight, Building2, FileCode2, Globe, Users,
} from 'lucide-react';
import { toast } from 'sonner';

const R$ = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── Softwares Contábeis ────────────────────────────────────────────────────
const SOFTWARES = [
  { id: 'dominio', nome: 'Domínio (Thomson Reuters)', logo: '🏢', descricao: 'Integração via XML padrão Domínio. Importa NF-es, lançamentos contábeis e SPED.' },
  { id: 'contabilizei', nome: 'Contabilizei', logo: '📊', descricao: 'Integração via API REST. Indicado para escritórios contábeis modernos.' },
  { id: 'alterdata', nome: 'Alterdata (W3 ERP)', logo: '🔷', descricao: 'Exportação de lançamentos em layout Alterdata padrão.' },
  { id: 'totvs', nome: 'TOTVS Protheus', logo: '⚙️', descricao: 'Integração via arquivos TXT no padrão TOTVS SIGACON.' },
  { id: 'sap', nome: 'SAP Business One', logo: '🔵', descricao: 'Integração via DI-API / B1i com mapeamento de contas.' },
  { id: 'generico', nome: 'Outro / Personalizado', logo: '📁', descricao: 'Exportação em layouts CSV / TXT personalizados configurados pelo usuário.' },
];

// ─── Exportações disponíveis ─────────────────────────────────────────────────
const EXPORTACOES = [
  {
    id: 'nfe_saida', grupo: 'Fiscal',
    titulo: 'NF-es de Saída',
    descricao: 'Exporta todas as NF-es de saída emitidas no período para apuração de PIS/COFINS, ICMS e IRPJ.',
    icone: <FileText size={18} className="text-green-600" />,
    registros: 48, ultima: '2026-04-30', status: 'ok',
  },
  {
    id: 'nfe_entrada', grupo: 'Fiscal',
    titulo: 'NF-es de Entrada',
    descricao: 'Exporta todas as NF-es de entrada (compras e importação) para apuração de créditos de PIS/COFINS.',
    icone: <FileText size={18} className="text-blue-600" />,
    registros: 31, ultima: '2026-04-28', status: 'ok',
  },
  {
    id: 'lancamentos', grupo: 'Contábil',
    titulo: 'Lançamentos Contábeis',
    descricao: 'Exporta todos os lançamentos contábeis gerados automaticamente no período (faturamento, financeiro, estoque, produção).',
    icone: <BookOpen size={18} className="text-purple-600" />,
    registros: 214, ultima: '2026-04-30', status: 'ok',
  },
  {
    id: 'bloco_k', grupo: 'SPED Fiscal',
    titulo: 'Bloco K — SPED Fiscal',
    descricao: 'Exporta o arquivo Bloco K completo integrado ao controle de produção, estoque e terceiros.',
    icone: <FileCode2 size={18} className="text-orange-600" />,
    registros: 892, ultima: '2026-04-01', status: 'pendente',
  },
  {
    id: 'sped_contrib', grupo: 'SPED Contribuições',
    titulo: 'SPED Contribuições (PIS/COFINS)',
    descricao: 'Exporta NF-es de saída e entrada para geração do SPED Contribuições e apuração de PIS e COFINS.',
    icone: <FileCode2 size={18} className="text-red-600" />,
    registros: 79, ultima: '2026-04-01', status: 'ok',
  },
  {
    id: 'sped_contabil', grupo: 'SPED Contábil / ECF',
    titulo: 'SPED Contábil + ECF',
    descricao: 'Exporta lançamentos contábeis para geração do SPED Contábil, ECF e apuração de IRPJ e CSLL.',
    icone: <FileCode2 size={18} className="text-indigo-600" />,
    registros: 214, ultima: '2026-04-01', status: 'ok',
  },
  {
    id: 'plano_contas', grupo: 'Contábil',
    titulo: 'Plano de Contas',
    descricao: 'Exporta / importa o plano de contas contábil completo para sincronização com o software contábil.',
    icone: <BookOpen size={18} className="text-teal-600" />,
    registros: 24, ultima: '2026-03-01', status: 'ok',
  },
  {
    id: 'cpv', grupo: 'Contábil',
    titulo: 'CPV — Custo dos Produtos Vendidos',
    descricao: 'Exporta o custo real efetivo apurado por produto para geração dos demonstrativos contábeis.',
    icone: <Package size={18} className="text-yellow-600" />,
    registros: 48, ultima: '2026-04-30', status: 'ok',
  },
];

// ─── Histórico de exportações ────────────────────────────────────────────────
const HISTORICO = [
  { data: '2026-04-30 18:42', tipo: 'NF-es de Saída',    formato: 'XML Domínio',      usuario: 'Ana Contadora', registros: 48,  status: 'ok' },
  { data: '2026-04-30 18:40', tipo: 'Lançamentos Contábeis', formato: 'XML Domínio',  usuario: 'Ana Contadora', registros: 214, status: 'ok' },
  { data: '2026-04-28 09:10', tipo: 'NF-es de Entrada',  formato: 'XML Domínio',      usuario: 'Ana Contadora', registros: 31,  status: 'ok' },
  { data: '2026-04-01 07:30', tipo: 'SPED Contribuições',formato: 'TXT SPED',         usuario: 'Carlos ERP',    registros: 79,  status: 'ok' },
  { data: '2026-04-01 07:28', tipo: 'SPED Contábil + ECF',formato: 'TXT SPED',        usuario: 'Carlos ERP',    registros: 214, status: 'ok' },
  { data: '2026-04-01 07:25', tipo: 'Bloco K',           formato: 'TXT SPED',         usuario: 'Carlos ERP',    registros: 892, status: 'ok' },
];

// ─── Mapeamento de contas ────────────────────────────────────────────────────
const MAPEAMENTO_CONTAS = [
  { evento: 'Receita de Venda (NF-e)',       conta_erp: '4.1', conta_contabil: '3.1.1.01.001', nome_contabil: 'Receita Bruta de Vendas' },
  { evento: 'Baixa de Estoque (CPV)',        conta_erp: '5.1', conta_contabil: '4.1.1.01.001', nome_contabil: 'CMV — Custo da Mercadoria Vendida' },
  { evento: 'Contas a Receber',             conta_erp: '1.1.02', conta_contabil: '1.1.2.01.001', nome_contabil: 'Clientes — Duplicatas a Receber' },
  { evento: 'Fornecedores',                 conta_erp: '2.1.01', conta_contabil: '2.1.1.01.001', nome_contabil: 'Fornecedores Nacionais' },
  { evento: 'Estoques',                     conta_erp: '1.1.03', conta_contabil: '1.1.3.01.001', nome_contabil: 'Estoques de Matéria-Prima' },
  { evento: 'Caixa e Bancos',               conta_erp: '1.1.01', conta_contabil: '1.1.1.01.001', nome_contabil: 'Bancos — Conta Corrente' },
  { evento: 'Despesas Administrativas',     conta_erp: '5.2.02', conta_contabil: '4.2.1.01.001', nome_contabil: 'Despesas Administrativas Gerais' },
  { evento: 'Impostos sobre Venda (ICMS)',  conta_erp: '5.2.01', conta_contabil: '3.2.1.01.001', nome_contabil: 'ICMS sobre Vendas — Dedução' },
];

export default function IntegracaoContabil() {
  const [aba, setAba] = useState('visao_geral');
  const [softwareSel, setSoftwareSel] = useState('dominio');
  const [periodoMes, setPeriodoMes] = useState(3); // Abril (0-indexed)
  const [periodoAno, setPeriodoAno] = useState(2026);
  const [exportando, setExportando] = useState(null);
  const [importandoPC, setImportandoPC] = useState(false);
  const fileRef = useRef(null);

  const softwareAtual = SOFTWARES.find((s) => s.id === softwareSel);
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  const handleExportar = (id, titulo) => {
    setExportando(id);
    setTimeout(() => {
      setExportando(null);
      toast.success(`${titulo} exportado com sucesso!`);
    }, 1800);
  };

  const handleImportarPC = () => {
    setImportandoPC(true);
    setTimeout(() => { setImportandoPC(false); toast.success('Plano de contas importado: 24 contas sincronizadas!'); }, 2000);
  };

  const ABAS = [
    { id: 'visao_geral',  label: 'Visão Geral' },
    { id: 'exportacoes',  label: 'Exportações' },
    { id: 'mapeamento',   label: 'Mapeamento de Contas' },
    { id: 'sped',         label: 'SPED / ECF' },
    { id: 'dp',           label: 'Depto. Pessoal' },
    { id: 'configuracao', label: 'Configuração' },
  ];

  const gruposExportacao = [...new Set(EXPORTACOES.map((e) => e.grupo))];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Link2 size={20} className="text-primary" />Integração com Softwares Contábeis e Fiscais</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Exporte NF-es, lançamentos, Bloco K e SPED para o software contábil da sua empresa</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="erp-input text-xs w-28" value={periodoMes} onChange={(e) => setPeriodoMes(Number(e.target.value))}>
            {meses.map((m, i) => <option key={i} value={i}>{m}/{periodoAno}</option>)}
          </select>
          <button type="button" onClick={() => toast.info('Exportação completa iniciada...')} className="erp-btn text-xs flex items-center gap-1.5"><Download size={13} />Exportar Tudo</button>
        </div>
      </div>

      {/* Status da integração */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Software Integrado', val: softwareAtual?.nome.split(' ')[0], icon: <Building2 size={14} className="text-primary" />, cor: 'text-primary' },
          { label: 'NF-es Exportadas', val: '79', sub: 'no mês', icon: <FileText size={14} className="text-green-600" />, cor: 'text-green-700' },
          { label: 'Lançamentos Contábeis', val: '214', sub: 'no mês', icon: <BookOpen size={14} className="text-purple-600" />, cor: 'text-purple-700' },
          { label: 'Última Exportação', val: '30/04', sub: '18:42h', icon: <CheckCircle size={14} className="text-teal-600" />, cor: 'text-teal-700' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3 flex items-center gap-3">
            {k.icon}
            <div><p className="text-[10px] text-muted-foreground">{k.label}</p><p className={`font-bold text-sm ${k.cor}`}>{k.val} <span className="text-[10px] font-normal text-muted-foreground">{k.sub}</span></p></div>
          </div>
        ))}
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

      {/* ── VISÃO GERAL ─────────────────────────────────────────────────── */}
      {aba === 'visao_geral' && (
        <div className="space-y-3">
          {/* Fluxo de integração */}
          <div className="erp-card p-5">
            <p className="text-xs font-semibold mb-4">Fluxo de Integração com o Software Contábil</p>
            <div className="flex flex-col sm:flex-row items-center gap-2 text-xs">
              {[
                { label: 'ERPCOZERP', sub: 'Faturamento · Financeiro\nEstoque · Produção · Custos', cor: 'bg-primary text-white', icon: <Package size={18} /> },
                null,
                { label: 'Exportações', sub: 'NF-e Saída · NF-e Entrada\nLançamentos · Bloco K · CPV', cor: 'bg-muted/30 border border-border', icon: <Download size={18} className="text-primary" /> },
                null,
                { label: softwareAtual?.nome.split(' (')[0], sub: 'SPED Contrib · SPED Contábil\nECF · DRE · Balanço · E-Social', cor: 'bg-green-50 border border-green-200 text-green-800', icon: <Building2 size={18} className="text-green-600" /> },
              ].map((item, i) => item === null
                ? <ChevronRight key={i} size={18} className="text-muted-foreground shrink-0 hidden sm:block" />
                : (
                  <div key={i} className={`flex-1 rounded-xl p-4 text-center ${item.cor}`}>
                    <div className="flex justify-center mb-1">{item.icon}</div>
                    <div className="font-bold text-xs">{item.label}</div>
                    <div className="text-[10px] mt-0.5 opacity-70 whitespace-pre-line">{item.sub}</div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Status das exportações */}
          <div className="erp-card overflow-x-auto">
            <div className="px-4 py-2.5 bg-muted/20 border-b border-border text-xs font-semibold">Status das Exportações — {meses[periodoMes]}/{periodoAno}</div>
            <table className="erp-table w-full">
              <thead><tr><th>Tipo de Exportação</th><th>Grupo</th><th className="text-right">Registros</th><th>Última Exportação</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {EXPORTACOES.map((exp) => (
                  <tr key={exp.id}>
                    <td className="font-medium">{exp.titulo}</td>
                    <td><span className="erp-badge erp-badge-info">{exp.grupo}</span></td>
                    <td className="text-right font-mono font-semibold">{exp.registros.toLocaleString('pt-BR')}</td>
                    <td className="text-muted-foreground">{exp.ultima}</td>
                    <td>
                      {exp.status === 'ok'
                        ? <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle size={11} />Exportado</span>
                        : <span className="flex items-center gap-1 text-yellow-600 text-xs"><AlertTriangle size={11} />Pendente</span>}
                    </td>
                    <td>
                      <button type="button" disabled={exportando === exp.id}
                        onClick={() => handleExportar(exp.id, exp.titulo)}
                        className="erp-btn-ghost text-xs flex items-center gap-1 disabled:opacity-60">
                        {exportando === exp.id ? <RefreshCw size={11} className="animate-spin" /> : <Download size={11} />}
                        Exportar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Histórico */}
          <div className="erp-card overflow-x-auto">
            <div className="px-4 py-2.5 bg-muted/20 border-b border-border text-xs font-semibold">Histórico de Exportações</div>
            <table className="erp-table w-full">
              <thead><tr><th>Data / Hora</th><th>Tipo</th><th>Formato</th><th>Usuário</th><th className="text-right">Registros</th><th>Status</th></tr></thead>
              <tbody>
                {HISTORICO.map((h, i) => (
                  <tr key={i}>
                    <td className="font-mono text-xs">{h.data}</td>
                    <td>{h.tipo}</td>
                    <td><span className="erp-badge erp-badge-default">{h.formato}</span></td>
                    <td className="text-muted-foreground">{h.usuario}</td>
                    <td className="text-right font-semibold">{h.registros.toLocaleString('pt-BR')}</td>
                    <td><CheckCircle size={13} className="text-green-500" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── EXPORTAÇÕES ─────────────────────────────────────────────────── */}
      {aba === 'exportacoes' && (
        <div className="space-y-4">
          {/* Período */}
          <div className="erp-card p-4 flex flex-col sm:flex-row gap-3 items-end">
            <div><label className="erp-label">Mês</label>
              <select className="erp-input" value={periodoMes} onChange={(e) => setPeriodoMes(Number(e.target.value))}>
                {meses.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
            <div><label className="erp-label">Ano</label>
              <input type="number" className="erp-input w-24" value={periodoAno} onChange={(e) => setPeriodoAno(Number(e.target.value))} />
            </div>
            <div><label className="erp-label">Formato de Saída</label>
              <select className="erp-input w-44">
                <option>XML Domínio</option>
                <option>TXT SPED</option>
                <option>CSV Genérico</option>
                <option>JSON API</option>
              </select>
            </div>
            <button type="button" onClick={() => toast.info('Exportação completa iniciada para ' + meses[periodoMes] + '/' + periodoAno)}
              className="erp-btn text-xs flex items-center gap-1.5"><Download size={13} />Exportar Período Completo</button>
          </div>

          {gruposExportacao.map((grupo) => (
            <div key={grupo}>
              <p className="text-[10px] font-bold text-muted-foreground uppercase px-1 mb-2">{grupo}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EXPORTACOES.filter((e) => e.grupo === grupo).map((exp) => (
                  <div key={exp.id} className="erp-card p-4 flex items-start gap-3">
                    <div className="mt-0.5">{exp.icone}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm">{exp.titulo}</p>
                        {exp.status === 'ok'
                          ? <span className="flex items-center gap-1 text-green-600 text-[10px] shrink-0"><CheckCircle size={10} />ok</span>
                          : <span className="flex items-center gap-1 text-yellow-600 text-[10px] shrink-0"><AlertTriangle size={10} />pendente</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{exp.descricao}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-muted-foreground">{exp.registros.toLocaleString('pt-BR')} registros</span>
                        <span className="text-[10px] text-muted-foreground">· Última: {exp.ultima}</span>
                      </div>
                    </div>
                    <button type="button" disabled={exportando === exp.id}
                      onClick={() => handleExportar(exp.id, exp.titulo)}
                      className="erp-btn shrink-0 text-xs flex items-center gap-1 disabled:opacity-60">
                      {exportando === exp.id ? <RefreshCw size={11} className="animate-spin" /> : <Download size={11} />}
                      Baixar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MAPEAMENTO DE CONTAS ─────────────────────────────────────────── */}
      {aba === 'mapeamento' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Configure o mapeamento entre as contas do ERPCOZERP e as contas do plano contábil do seu software contábil.</p>
            <div className="flex gap-2">
              <input type="file" ref={fileRef} className="hidden" accept=".csv,.xlsx" onChange={() => handleImportarPC()} />
              <button type="button" onClick={() => fileRef.current?.click()} className="erp-btn-ghost text-xs flex items-center gap-1.5">
                <Upload size={12} />Importar Plano de Contas
              </button>
              <button type="button" onClick={() => toast.info('Mapeamento exportado!')} className="erp-btn-ghost text-xs flex items-center gap-1.5">
                <Download size={12} />Exportar
              </button>
              <button type="button" className="erp-btn text-xs flex items-center gap-1.5"><Plus size={12} />Novo Mapeamento</button>
            </div>
          </div>
          <div className="erp-card overflow-x-auto">
            <table className="erp-table w-full">
              <thead>
                <tr>
                  <th>Evento / Origem</th>
                  <th>Conta ERP</th>
                  <th>Conta no Software Contábil</th>
                  <th>Nome Contábil</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {MAPEAMENTO_CONTAS.map((m, i) => (
                  <tr key={i}>
                    <td className="font-medium text-xs">{m.evento}</td>
                    <td><span className="font-mono text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{m.conta_erp}</span></td>
                    <td><input className="erp-input text-xs w-36 font-mono" defaultValue={m.conta_contabil} /></td>
                    <td><input className="erp-input text-xs w-52" defaultValue={m.nome_contabil} /></td>
                    <td><button type="button" onClick={() => toast.success('Mapeamento salvo!')} className="erp-btn-ghost text-xs">Salvar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
            <p className="font-semibold">Importação do Plano de Contas</p>
            <p>Importe o plano de contas do seu software contábil em Excel (CSV) para sincronizar automaticamente os mapeamentos. O sistema identifica as contas por código e cria o mapeamento automaticamente.</p>
            <button type="button" onClick={handleImportarPC} disabled={importandoPC} className="mt-1 erp-btn-ghost text-xs flex items-center gap-1.5 border border-blue-300 disabled:opacity-60">
              {importandoPC ? <RefreshCw size={11} className="animate-spin" /> : <Upload size={11} />}
              {importandoPC ? 'Importando...' : 'Importar Plano de Contas (.xlsx / .csv)'}
            </button>
          </div>
        </div>
      )}

      {/* ── SPED / ECF ──────────────────────────────────────────────────── */}
      {aba === 'sped' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                titulo: 'SPED Contribuições',
                subtitulo: 'PIS / COFINS',
                cor: 'border-red-200 bg-red-50',
                corIcon: 'text-red-600',
                icon: <FileCode2 size={22} />,
                obrigacoes: ['EFD-Contribuições mensal','Apuração PIS e COFINS','Blocos 0, A, C, D, F, M, P, 1, 9'],
                periodo: meses[periodoMes] + '/' + periodoAno,
                status: 'pronto',
                registros: 79,
              },
              {
                titulo: 'SPED Contábil',
                subtitulo: 'Escrituração Contábil Digital',
                cor: 'border-indigo-200 bg-indigo-50',
                corIcon: 'text-indigo-600',
                icon: <BookOpen size={22} />,
                obrigacoes: ['Lançamentos contábeis completos','Balancetes mensais','Balanço Patrimonial e DRE'],
                periodo: meses[periodoMes] + '/' + periodoAno,
                status: 'pronto',
                registros: 214,
              },
              {
                titulo: 'ECF',
                subtitulo: 'Escrituração Contábil Fiscal',
                cor: 'border-orange-200 bg-orange-50',
                corIcon: 'text-orange-600',
                icon: <FileText size={22} />,
                obrigacoes: ['Apuração IRPJ e CSLL','Livro de Apuração do Lucro Real','Demonstrativo de Resultado'],
                periodo: 'Ano 2025',
                status: 'pendente',
                registros: 0,
              },
            ].map((s) => (
              <div key={s.titulo} className={`erp-card border-2 p-5 ${s.cor}`}>
                <div className={`flex items-start gap-3 mb-3 ${s.corIcon}`}>
                  {s.icon}
                  <div>
                    <p className="font-bold text-sm">{s.titulo}</p>
                    <p className="text-xs text-muted-foreground">{s.subtitulo}</p>
                  </div>
                </div>
                <ul className="space-y-1 mb-3">
                  {s.obrigacoes.map((o) => (
                    <li key={o} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle size={10} className="text-green-500 shrink-0" />{o}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-muted-foreground">Período: <strong>{s.periodo}</strong></span>
                  {s.status === 'pronto'
                    ? <span className="text-green-600 font-semibold flex items-center gap-1"><CheckCircle size={11} />Pronto</span>
                    : <span className="text-yellow-600 font-semibold flex items-center gap-1"><AlertTriangle size={11} />Pendente</span>}
                </div>
                <button type="button"
                  onClick={() => toast.success(`${s.titulo} exportado!`)}
                  className="erp-btn w-full text-xs flex items-center justify-center gap-1.5">
                  <Download size={12} />Exportar {s.titulo}
                </button>
              </div>
            ))}
          </div>

          <div className="erp-card p-4 space-y-3">
            <p className="text-xs font-semibold">Regimes e Opções Fiscais</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { label: 'Regime Tributário',    val: 'Lucro Real' },
                { label: 'Apuração PIS/COFINS',  val: 'Regime Não-Cumulativo' },
                { label: 'Periodicidade SPED',   val: 'Mensal' },
                { label: 'Regime ICMS',          val: 'Normal' },
              ].map((c) => (
                <div key={c.label} className="bg-muted/20 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground">{c.label}</p>
                  <p className="font-bold mt-0.5">{c.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DEPARTAMENTO PESSOAL ─────────────────────────────────────────── */}
      {aba === 'dp' && (
        <div className="space-y-3">
          <div className="erp-card p-5 border-2 border-blue-200 bg-blue-50/30">
            <div className="flex items-start gap-4">
              <Users size={32} className="text-blue-600 shrink-0 mt-1" />
              <div>
                <p className="font-bold text-base">Departamento Pessoal — Integração com Software Contábil</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                  Utilize o módulo de Departamento Pessoal do software contábil da sua empresa para registro de ponto eletrônico, apuração de folha de pagamento e atendimento ao e-Social. O ERPCOZERP integra os dados de funcionários e horas apontadas no chão de fábrica com o módulo DP do seu software contábil.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="erp-card p-4 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2"><Users size={15} className="text-primary" />Dados Exportados para o DP</p>
              {[
                { titulo: 'Cadastro de Funcionários', descricao: 'Exporta dados de admissão, função, setor e salário base para o módulo DP.', status: 'ok', registros: 34 },
                { titulo: 'Horas Apontadas', descricao: 'Exporta horas produtivas, paradas e extras registradas no chão de fábrica para cálculo de folha.', status: 'ok', registros: 1248 },
                { titulo: 'Centros de Custo', descricao: 'Exporta os centros de custo para rateio das despesas de folha na contabilidade.', status: 'ok', registros: 5 },
                { titulo: 'Afastamentos / Férias', descricao: 'Exporta registros de afastamentos, férias e licenças para o DP.', status: 'pendente', registros: 0 },
              ].map((item) => (
                <div key={item.titulo} className="flex items-center gap-3 p-2.5 bg-muted/20 rounded-lg text-xs">
                  {item.status === 'ok'
                    ? <CheckCircle size={14} className="text-green-500 shrink-0" />
                    : <AlertTriangle size={14} className="text-yellow-500 shrink-0" />}
                  <div className="flex-1">
                    <p className="font-semibold">{item.titulo}</p>
                    <p className="text-muted-foreground">{item.descricao}</p>
                    {item.registros > 0 && <p className="text-[10px] mt-0.5">{item.registros.toLocaleString('pt-BR')} registros disponíveis</p>}
                  </div>
                  <button type="button" onClick={() => toast.success(`${item.titulo} exportado!`)} className="erp-btn-ghost text-[10px] flex items-center gap-1"><Download size={10} />Exportar</button>
                </div>
              ))}
            </div>

            <div className="erp-card p-4 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2"><Globe size={15} className="text-primary" />e-Social — Integração</p>
              <p className="text-xs text-muted-foreground">O e-Social é atendido pelo módulo de DP do software contábil. O ERPCOZERP fornece os dados necessários para geração dos eventos.</p>
              <div className="space-y-1.5">
                {[
                  { evento: 'S-1000 — Informações do Empregador', status: 'ok' },
                  { evento: 'S-1005 — Tabela de Estabelecimentos', status: 'ok' },
                  { evento: 'S-2200 — Admissão', status: 'ok' },
                  { evento: 'S-2230 — Afastamento Temporário', status: 'pendente' },
                  { evento: 'S-2299 — Desligamento', status: 'ok' },
                  { evento: 'S-1200 — Remuneração', status: 'ok' },
                  { evento: 'S-1210 — Pagamentos', status: 'ok' },
                ].map((e) => (
                  <div key={e.evento} className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs ${e.status === 'ok' ? 'bg-green-50' : 'bg-yellow-50'}`}>
                    {e.status === 'ok' ? <CheckCircle size={11} className="text-green-500" /> : <AlertTriangle size={11} className="text-yellow-500" />}
                    <span className={e.status === 'ok' ? 'text-green-700' : 'text-yellow-700'}>{e.evento}</span>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-2.5 text-xs text-blue-800">
                Os eventos do e-Social são transmitidos pelo módulo de DP do software contábil. O ERPCOZERP disponibiliza as informações de forma integrada.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIGURAÇÃO ────────────────────────────────────────────────── */}
      {aba === 'configuracao' && (
        <div className="space-y-3">
          <div className="erp-card p-5 space-y-4">
            <p className="text-sm font-semibold flex items-center gap-2"><Settings size={15} className="text-primary" />Software Contábil Integrado</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SOFTWARES.map((sw) => (
                <button key={sw.id} type="button" onClick={() => { setSoftwareSel(sw.id); toast.success(`Software alterado para ${sw.nome.split(' (')[0]}`); }}
                  className={`p-4 rounded-xl border-2 text-left transition-colors ${softwareSel === sw.id ? 'border-primary bg-primary/5' : 'border-border bg-white hover:bg-muted/20'}`}>
                  <div className="text-2xl mb-1">{sw.logo}</div>
                  <div className="font-semibold text-xs">{sw.nome.split(' (')[0]}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{sw.descricao.substring(0, 50)}...</div>
                  {softwareSel === sw.id && <div className="mt-1.5 text-[10px] text-primary font-bold flex items-center gap-0.5"><CheckCircle size={10} />Ativo</div>}
                </button>
              ))}
            </div>
          </div>

          <div className="erp-card p-5 space-y-4">
            <p className="text-sm font-semibold">Parâmetros de Integração — {softwareAtual?.nome.split(' (')[0]}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {softwareSel === 'dominio' && (
                <>
                  <div><label className="erp-label">Diretório de Exportação</label><input className="erp-input w-full text-xs font-mono" defaultValue="C:\Dominio\Importacao\ERPCOZERP\" /></div>
                  <div><label className="erp-label">Empresa no Domínio</label><input className="erp-input w-full text-xs" defaultValue="001 — Indústria Inox Ltda" /></div>
                  <div><label className="erp-label">Formato de Data</label><select className="erp-input w-full text-xs"><option>DD/MM/AAAA</option><option>AAAA-MM-DD</option></select></div>
                  <div><label className="erp-label">Encoding do Arquivo</label><select className="erp-input w-full text-xs"><option>UTF-8</option><option>ISO-8859-1 (Latin1)</option></select></div>
                </>
              )}
              {softwareSel !== 'dominio' && (
                <>
                  <div><label className="erp-label">URL da API / Endpoint</label><input className="erp-input w-full text-xs font-mono" placeholder="https://api.software.com.br/v1/" /></div>
                  <div><label className="erp-label">Token / Chave de API</label><input type="password" className="erp-input w-full text-xs" placeholder="••••••••••••••••" /></div>
                  <div><label className="erp-label">Código da Empresa</label><input className="erp-input w-full text-xs" placeholder="001" /></div>
                  <div><label className="erp-label">Formato de Exportação</label><select className="erp-input w-full text-xs"><option>JSON</option><option>XML</option><option>TXT/CSV</option></select></div>
                </>
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => toast.success('Conexão testada com sucesso!')} className="erp-btn-ghost text-xs flex items-center gap-1.5"><RefreshCw size={12} />Testar Conexão</button>
              <button type="button" onClick={() => toast.success('Configurações salvas!')} className="erp-btn text-xs flex items-center gap-1.5"><CheckCircle size={12} />Salvar Configurações</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
