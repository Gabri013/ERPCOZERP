import { useState, useRef, useEffect, useCallback } from 'react';
import { listDatabooks } from '@/services/qualityApi.js';
import {
  BookMarked, Plus, Download, Mail, CheckCircle, Clock,
  AlertTriangle, Upload, Search, ChevronDown, ChevronRight, Shield, Eye, X, RefreshCw, FilePlus,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Templates de Databook ───────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 1, nome: 'Databook Padrão Pharma',
    descricao: 'Template para clientes do setor farmacêutico seguindo normas ASME BPE.',
    secoes: [
      { id: 1, titulo: 'Capa e Índice',            docs: [],                              obrigatorio: true  },
      { id: 2, titulo: 'Dados do Pedido',           docs: ['Pedido de Venda','Memorial Desc.'], obrigatorio: true  },
      { id: 3, titulo: 'Certificados de Materiais', docs: ['Cert. Chapa','Cert. Tubo'],   obrigatorio: true  },
      { id: 4, titulo: 'Documentos de Inspeção',   docs: ['RI','CI','RLP'],              obrigatorio: true  },
      { id: 5, titulo: 'Ensaios Não Destrutivos',  docs: ['RLP','RPM','RUS'],            obrigatorio: false },
      { id: 6, titulo: 'Declaração de Conformidade',docs: ['DEC'],                       obrigatorio: true  },
    ],
  },
  {
    id: 2, nome: 'Databook Padrão Food & Bev',
    descricao: 'Template para clientes de alimentos e bebidas — norma 3A / EHEDG.',
    secoes: [
      { id: 1, titulo: 'Capa e Índice',            docs: [],                              obrigatorio: true  },
      { id: 2, titulo: 'Dados do Equipamento',     docs: ['Ficha Técnica'],               obrigatorio: true  },
      { id: 3, titulo: 'Certificados de Materiais',docs: ['Cert. Chapa'],                 obrigatorio: true  },
      { id: 4, titulo: 'Relatórios de Inspeção',  docs: ['RI','CI'],                     obrigatorio: true  },
    ],
  },
];

// ─── databooks ───────────────────────────────────────────────────────────────
const databooks = [
  {
    id: 'DB-2026-0031', pedido: 'PV-2026-0089', cliente: 'Pharma Brasil Ltda',
    produto: 'TANK-500L × 2 un.',  template: 'Databook Padrão Pharma',
    data_criacao: '2026-04-28', prazo: '2026-05-05',
    status: 'em_elaboracao',
    progresso: 68,
    ordens: ['OP-2026-0451','OP-2026-0452'],
    secoes: [
      { titulo: 'Capa e Índice',             status: 'ok',       docs: 2  },
      { titulo: 'Dados do Pedido',           status: 'ok',       docs: 2  },
      { titulo: 'Certificados de Materiais', status: 'ok',       docs: 3  },
      { titulo: 'Documentos de Inspeção',    status: 'pendente', docs: 1  },
      { titulo: 'Ensaios Não Destrutivos',   status: 'pendente', docs: 0  },
      { titulo: 'Declaração de Conformidade',status: 'pendente', docs: 0  },
    ],
  },
  {
    id: 'DB-2026-0029', pedido: 'PV-2026-0081', cliente: 'Alimentos SA',
    produto: 'AGIT-100L × 3 un.', template: 'Databook Padrão Food & Bev',
    data_criacao: '2026-04-15', prazo: '2026-04-30',
    status: 'concluido',
    progresso: 100,
    ordens: ['OP-2026-0440','OP-2026-0441','OP-2026-0442'],
    secoes: [
      { titulo: 'Capa e Índice',             status: 'ok', docs: 2 },
      { titulo: 'Dados do Equipamento',      status: 'ok', docs: 1 },
      { titulo: 'Certificados de Materiais', status: 'ok', docs: 2 },
      { titulo: 'Relatórios de Inspeção',    status: 'ok', docs: 3 },
    ],
  },
  {
    id: 'DB-2026-0027', pedido: 'PV-2026-0074', cliente: 'Cosméticos Norte',
    produto: 'REATOR-200L × 1 un.', template: 'Databook Padrão Pharma',
    data_criacao: '2026-04-01', prazo: '2026-04-20',
    status: 'enviado',
    progresso: 100,
    ordens: ['OP-2026-0430'],
    secoes: [
      { titulo: 'Capa e Índice',             status: 'ok', docs: 2 },
      { titulo: 'Dados do Pedido',           status: 'ok', docs: 2 },
      { titulo: 'Certificados de Materiais', status: 'ok', docs: 4 },
      { titulo: 'Documentos de Inspeção',    status: 'ok', docs: 3 },
      { titulo: 'Ensaios Não Destrutivos',   status: 'ok', docs: 2 },
      { titulo: 'Declaração de Conformidade',status: 'ok', docs: 1 },
    ],
  },
];

// ─── Documentos disponíveis para vincular ────────────────────────────────────
const DOCS_DISPONIVEIS = [
  { id: 'RI-2026-0482',  tipo: 'RI',   titulo: 'Rel. Inspeção — OP-2026-0451', assinado: true,  lote: 'LT-2026-0041' },
  { id: 'CI-2026-0093',  tipo: 'CI',   titulo: 'Certificado — TANK-500L',       assinado: true,  lote: 'LT-2026-0041' },
  { id: 'RLP-2026-0041', tipo: 'RLP',  titulo: 'Liq. Penetrante — OP-2026-0451',assinado: false, lote: 'LT-2026-0041' },
  { id: 'CERT-CHAPA-012',tipo: 'Cert', titulo: 'Cert. Chapa 316L 3mm',          assinado: true,  lote: 'LT-2026-0031' },
  { id: 'CERT-TUBO-008', tipo: 'Cert', titulo: 'Cert. Tubo 1.5" SCH10',         assinado: true,  lote: 'LT-2026-0022' },
  { id: 'DEC-2026-0012', tipo: 'DEC',  titulo: 'Decl. de Conformidade',         assinado: false, lote: null },
];

const STATUS_DB = {
  em_elaboracao: { label: 'Em Elaboração', cls: 'erp-badge-warning' },
  concluido:     { label: 'Concluído',     cls: 'erp-badge-success' },
  enviado:       { label: 'Enviado',       cls: 'erp-badge-info'    },
  atrasado:      { label: 'Atrasado',      cls: 'erp-badge-danger'  },
};

const TIPO_COR = {
  RI: 'bg-blue-50 text-blue-700 border-blue-200',
  CI: 'bg-green-50 text-green-700 border-green-200',
  RLP:'bg-purple-50 text-purple-700 border-purple-200',
  RPM:'bg-orange-50 text-orange-700 border-orange-200',
  Cert:'bg-teal-50 text-teal-700 border-teal-200',
  DEC:'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export default function Databooks() {
  const [aba, setAba] = useState('databooks');
  const [databooks, setDatabooks] = useState([]);
  const [dbSel, setDbSel] = useState(null);
  const [secaoExpandida, setSecaoExpandida] = useState({});
  const [showNovoDb, setShowNovoDb] = useState(false);
  const [showVincularDoc, setShowVincularDoc] = useState(null);
  const [gerandoPdf, setGerandoPdf] = useState(null);
  const fileRef = useRef(null);
  const [docsSelecionados, setDocsSelecionados] = useState([]);
  const [busca, setBusca] = useState('');

  const loadDatabooks = useCallback(async () => {
    try {
      const data = await listDatabooks();
      if (data && data.length > 0) {
        setDatabooks(data.map((d) => ({
          id: d.code,
          _id: d.id,
          titulo: d.title,
          pedido: d.orderRef || '',
          produto: d.productCode || '',
          cliente: d.clientName || '',
          template: d.template || 'padrao',
          status: d.status,
          avanco: d.progress,
          prazo: d.updatedAt?.slice(0, 10) || '',
          secoes: (d.documents || []).map((doc) => ({
            id: doc.id,
            titulo: doc.title,
            tipo: doc.docType || 'Documento',
            status: doc.status,
            obrigatorio: doc.required,
            documentos: [],
          })),
        })));
      }
    } catch {
      // keep mock on error
    }
  }, []);

  useEffect(() => { loadDatabooks(); }, [loadDatabooks]);

  const dbAtivo = databooks.find((d) => d.id === dbSel);
  const atrasados = databooks.filter((d) => d.status === 'em_elaboracao' && new Date(d.prazo) < new Date()).length;

  const toggleDoc = (id) => setDocsSelecionados((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);

  const handleGerarPdf = (id) => {
    setGerandoPdf(id);
    setTimeout(() => { setGerandoPdf(null); toast.success('PDF do databook gerado com sucesso!'); }, 2200);
  };

  const ABAS = [
    { id: 'databooks',  label: 'databooks' },
    { id: 'detalhe',    label: 'Detalhe / Elaboração', disabled: !dbSel },
    { id: 'templates',  label: 'Templates' },
    { id: 'lotes',      label: 'Vinculação por Lote/Série' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><BookMarked size={20} className="text-primary" />databooks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Elaboração de databooks eletrônicos integrados à qualidade, produção e pedidos de venda</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowNovoDb(true)} className="erp-btn text-xs flex items-center gap-1.5"><Plus size={13} />Novo Databook</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total databooks',   val: databooks.length,                                                    cor: 'text-primary',   icon: <BookMarked size={14} className="text-primary" /> },
          { label: 'Em Elaboração',     val: databooks.filter((d) => d.status === 'em_elaboracao').length,         cor: 'text-yellow-600',icon: <Clock size={14} className="text-yellow-600" /> },
          { label: 'Concluídos / Env.', val: databooks.filter((d) => ['concluido','enviado'].includes(d.status)).length, cor: 'text-green-700', icon: <CheckCircle size={14} className="text-green-600" /> },
          { label: 'Atrasados',         val: atrasados,                                                            cor: atrasados > 0 ? 'text-red-600' : 'text-muted-foreground', icon: <AlertTriangle size={14} className={atrasados > 0 ? 'text-red-500' : 'text-muted-foreground'} /> },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3 flex items-center gap-3">
            {k.icon}
            <div><p className="text-[10px] text-muted-foreground">{k.label}</p><p className={`font-bold text-lg ${k.cor}`}>{k.val}</p></div>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div className="border-b border-border flex gap-0 overflow-x-auto">
        {ABAS.map((a) => (
          <button key={a.id} type="button" disabled={a.disabled} onClick={() => !a.disabled && setAba(a.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors disabled:opacity-40 ${aba === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ── LISTA DE databooks ───────────────────────────────────────────── */}
      {aba === 'databooks' && (
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="erp-input pl-7 w-full" placeholder="Buscar databook..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <div className="space-y-3">
            {databooks.filter((d) => !busca || d.id.toLowerCase().includes(busca.toLowerCase()) || d.cliente.toLowerCase().includes(busca.toLowerCase())).map((db) => {
              const atrasado = db.status === 'em_elaboracao' && new Date(db.prazo) < new Date();
              const diasRestantes = Math.ceil((new Date(db.prazo) - new Date()) / 86400000);
              return (
                <div key={db.id} className={`erp-card p-4 border-l-4 ${db.status === 'concluido' || db.status === 'enviado' ? 'border-l-green-500' : atrasado ? 'border-l-red-500' : 'border-l-yellow-400'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-primary text-sm">{db.id}</span>
                        <span className={`erp-badge ${STATUS_DB[db.status]?.cls}`}>{STATUS_DB[db.status]?.label}</span>
                        {atrasado && <span className="erp-badge erp-badge-danger flex items-center gap-0.5"><AlertTriangle size={9} />Atrasado</span>}
                      </div>
                      <p className="font-semibold mt-0.5">{db.cliente}</p>
                      <p className="text-xs text-muted-foreground">{db.produto} · Pedido {db.pedido} · Template: {db.template}</p>
                      <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Criado: {db.data_criacao}</span>
                        <span className={atrasado ? 'text-red-600 font-semibold' : ''}>Prazo: {db.prazo} {!atrasado && db.status === 'em_elaboracao' && diasRestantes > 0 ? `(${diasRestantes}d)` : ''}</span>
                        <span>OPs: {db.ordens.join(', ')}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right text-xs">
                        <span className="font-bold text-sm">{db.progresso}%</span>
                        <span className="text-muted-foreground ml-1">completo</span>
                      </div>
                      <div className="w-36 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${db.progresso === 100 ? 'bg-green-500' : db.progresso >= 50 ? 'bg-primary' : 'bg-yellow-400'}`} style={{ width: `${db.progresso}%` }} />
                      </div>
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => { setDbSel(db.id); setAba('detalhe'); }} className="erp-btn-ghost text-xs flex items-center gap-1"><Eye size={11} />Abrir</button>
                        <button type="button" disabled={gerandoPdf === db.id} onClick={() => handleGerarPdf(db.id)} className="erp-btn text-xs flex items-center gap-1 disabled:opacity-60">
                          {gerandoPdf === db.id ? <RefreshCw size={11} className="animate-spin" /> : <Download size={11} />}PDF
                        </button>
                        <button type="button" onClick={() => toast.success('Databook enviado por e-mail!')} className="erp-btn-ghost text-xs flex items-center gap-1"><Mail size={11} /></button>
                      </div>
                    </div>
                  </div>

                  {/* Progresso por seção */}
                  <div className="mt-3 flex gap-1.5 flex-wrap">
                    {db.secoes.map((s, i) => (
                      <div key={i} className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border ${s.status === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                        {s.status === 'ok' ? <CheckCircle size={9} /> : <Clock size={9} />}
                        {s.titulo} ({s.docs} docs)
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── DETALHE / ELABORAÇÃO ─────────────────────────────────────────── */}
      {aba === 'detalhe' && dbAtivo && (
        <div className="space-y-3">
          <div className="erp-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-base">{dbAtivo.id} — {dbAtivo.cliente}</p>
              <p className="text-xs text-muted-foreground">{dbAtivo.produto} · {dbAtivo.pedido} · Template: {dbAtivo.template}</p>
              <p className="text-xs text-muted-foreground">OPs vinculadas: {dbAtivo.ordens.join(' · ')}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="erp-btn-ghost text-xs flex items-center gap-1.5"><Upload size={12} />Digitalizar Doc.</button>
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.png" onChange={() => toast.success('Documento digitalizado e vinculado!')} />
              <button type="button" disabled={gerandoPdf === dbAtivo.id} onClick={() => handleGerarPdf(dbAtivo.id)}
                className="erp-btn text-xs flex items-center gap-1.5 disabled:opacity-60">
                {gerandoPdf === dbAtivo.id ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
                {gerandoPdf === dbAtivo.id ? 'Gerando PDF...' : 'Gerar PDF Completo'}
              </button>
              <button type="button" onClick={() => toast.success('Databook enviado por e-mail!')} className="erp-btn-ghost text-xs flex items-center gap-1.5"><Mail size={12} />Enviar</button>
            </div>
          </div>

          {/* Progresso geral */}
          <div className="erp-card p-4">
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <span className="font-semibold">Progresso Geral</span>
              <span className="font-bold text-primary">{dbAtivo.progresso}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${dbAtivo.progresso}%` }} />
            </div>
          </div>

          {/* Seções */}
          <div className="space-y-2">
            {dbAtivo.secoes.map((secao, idx) => {
              const aberto = secaoExpandida[idx] !== false;
              const template = TEMPLATES.find((t) => t.nome === dbAtivo.template);
              const reqSecao = template?.secoes[idx];
              return (
                <div key={idx} className={`erp-card overflow-hidden border-l-4 ${secao.status === 'ok' ? 'border-l-green-400' : 'border-l-yellow-400'}`}>
                  <button type="button" className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/10" onClick={() => setSecaoExpandida((p) => ({ ...p, [idx]: !aberto }))}>
                    <div className="flex items-center gap-3">
                      {secao.status === 'ok' ? <CheckCircle size={14} className="text-green-500 shrink-0" /> : <Clock size={14} className="text-yellow-500 shrink-0" />}
                      <div>
                        <p className="text-xs font-semibold">{idx + 1}. {secao.titulo}</p>
                        <p className="text-[10px] text-muted-foreground">{secao.docs} documento(s) vinculado(s)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setShowVincularDoc(idx); }} className="erp-btn text-[10px] py-0.5 px-2 flex items-center gap-0.5 z-10"><Plus size={9} />Vincular Doc.</button>
                      {aberto ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </div>
                  </button>
                  {aberto && (
                    <div className="px-4 pb-3 space-y-2 border-t border-border/30">
                      {reqSecao && reqSecao.docs.length > 0 && (
                        <p className="text-[10px] text-muted-foreground pt-2">Documentos exigidos: <strong>{reqSecao.docs.join(', ')}</strong></p>
                      )}
                      {secao.docs > 0 ? (
                        <div className="space-y-1">
                          {DOCS_DISPONIVEIS.slice(0, secao.docs).map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between bg-muted/10 rounded-lg px-3 py-2 text-xs">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${TIPO_COR[doc.tipo] || 'bg-muted border-border text-muted-foreground'}`}>{doc.tipo}</span>
                                <span>{doc.titulo}</span>
                                {doc.assinado ? <Shield size={11} className="text-green-500" /> : <AlertTriangle size={11} className="text-yellow-500" />}
                              </div>
                              <div className="flex gap-1">
                                <button type="button" onClick={() => toast.success('PDF aberto!')} className="erp-btn-ghost text-[10px] p-0.5"><Eye size={11} /></button>
                                <button type="button" onClick={() => toast.info('Documento desvinculado!')} className="erp-btn-ghost text-[10px] p-0.5 text-red-500"><X size={11} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                          <AlertTriangle size={12} className="text-yellow-500" />Nenhum documento vinculado nesta seção.
                          <button type="button" onClick={() => setShowVincularDoc(idx)} className="underline text-primary">Vincular agora</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TEMPLATES ───────────────────────────────────────────────────── */}
      {aba === 'templates' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Defina os templates de databook com seções, requisitos de documentação e layouts.</p>
            <button type="button" onClick={() => toast.info('Novo template criado!')} className="erp-btn text-xs flex items-center gap-1.5"><Plus size={12} />Novo Template</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {TEMPLATES.map((tpl) => (
              <div key={tpl.id} className="erp-card overflow-hidden">
                <div className="px-4 py-3 bg-primary/5 border-b border-border flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{tpl.nome}</p>
                    <p className="text-xs text-muted-foreground">{tpl.descricao}</p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => toast.info('Template duplicado!')} className="erp-btn-ghost text-xs">Duplicar</button>
                    <button type="button" className="erp-btn text-xs">Editar</button>
                  </div>
                </div>
                <table className="w-full text-xs">
                  <thead className="bg-muted/20"><tr><th className="text-left px-3 py-1.5">#</th><th className="text-left px-3 py-1.5">Seção</th><th className="text-left px-3 py-1.5">Documentos Exigidos</th><th className="px-3 py-1.5">Obrig.</th></tr></thead>
                  <tbody>
                    {tpl.secoes.map((s) => (
                      <tr key={s.id} className="border-b border-border/20">
                        <td className="px-3 py-1.5 text-muted-foreground">{s.id}</td>
                        <td className="px-3 py-1.5 font-medium">{s.titulo}</td>
                        <td className="px-3 py-1.5">
                          {s.docs.length > 0
                            ? <div className="flex gap-1 flex-wrap">{s.docs.map((d) => <span key={d} className={`text-[10px] font-bold px-1 py-0.5 rounded border ${TIPO_COR[d] || 'bg-muted border-border text-muted-foreground'}`}>{d}</span>)}</div>
                            : <span className="text-muted-foreground text-[10px]">Automático</span>}
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          {s.obrigatorio ? <CheckCircle size={12} className="text-green-500 mx-auto" /> : <span className="text-[10px] text-muted-foreground">Opt.</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── VINCULAÇÃO POR LOTE / SÉRIE ──────────────────────────────────── */}
      {aba === 'lotes' && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <p className="font-semibold mb-1">Vinculação automática por Lote / Série</p>
            <p>O sistema analisa os lotes e séries dos materiais requisitados para as ordens de produção vinculadas ao databook e sugere automaticamente os documentos (certificados de materiais) relacionados a esses lotes.</p>
          </div>

          <div className="erp-card overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/20 border-b border-border text-xs font-semibold flex items-center justify-between">
              <span>Databook DB-2026-0031 — Rastreabilidade de Materiais</span>
              <button type="button" onClick={() => toast.success('Documentos vinculados automaticamente!')} className="erp-btn text-xs flex items-center gap-1.5"><RefreshCw size={11} />Vincular Automático</button>
            </div>
            <table className="erp-table w-full">
              <thead><tr><th>Lote / Série</th><th>Material</th><th>Qtd Usada</th><th>OP Vinculada</th><th>Documentos do Lote</th><th>Vinculado ao DB?</th></tr></thead>
              <tbody>
                {[
                  { lote: 'LT-2026-0041', material: 'Chapa Inox 316L 3mm', qtd: '240.6 kg', op: 'OP-2026-0451 / 0452', docs: ['Cert. Chapa','RI'], vinculado: true  },
                  { lote: 'LT-2026-0031', material: 'Chapa Inox 316L 3mm', qtd: '120.3 kg', op: 'OP-2026-0451',        docs: ['Cert. Chapa'],       vinculado: true  },
                  { lote: 'LT-2026-0022', material: 'Tubo Inox 1.5" SCH10',qtd: '16.4 m',  op: 'OP-2026-0451 / 0452', docs: ['Cert. Tubo'],         vinculado: true  },
                  { lote: 'LT-2026-0018', material: 'Bocal 2" Inox 316L',  qtd: '8 pc',    op: 'OP-2026-0451 / 0452', docs: [],                     vinculado: false },
                ].map((row, i) => (
                  <tr key={i} className={!row.vinculado ? 'bg-yellow-50' : ''}>
                    <td className="font-mono font-bold text-primary text-xs">{row.lote}</td>
                    <td className="font-medium text-xs">{row.material}</td>
                    <td className="text-muted-foreground">{row.qtd}</td>
                    <td className="font-mono text-xs text-muted-foreground">{row.op}</td>
                    <td>
                      {row.docs.length > 0
                        ? <div className="flex gap-1 flex-wrap">{row.docs.map((d) => <span key={d} className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${TIPO_COR[d] || 'bg-muted border-border text-muted-foreground'}`}>{d}</span>)}</div>
                        : <span className="text-yellow-600 text-xs flex items-center gap-1"><AlertTriangle size={11} />Sem certificado</span>}
                    </td>
                    <td>
                      {row.vinculado
                        ? <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle size={11} />Sim</span>
                        : <button type="button" onClick={() => toast.success('Documentos do lote vinculados!')} className="erp-btn text-xs py-0.5 px-2">Vincular</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Novo Databook */}
      {showNovoDb && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <p className="font-semibold flex items-center gap-2"><BookMarked size={15} />Novo Databook</p>
              <button type="button" onClick={() => setShowNovoDb(false)} className="text-muted-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="erp-label">Pedido de Venda</label><input className="erp-input w-full" placeholder="PV-2026-..." /></div>
                <div><label className="erp-label">Cliente</label><input className="erp-input w-full" placeholder="Nome do cliente" /></div>
                <div><label className="erp-label">Template de Databook</label>
                  <select className="erp-input w-full">{TEMPLATES.map((t) => <option key={t.id}>{t.nome}</option>)}</select>
                </div>
                <div><label className="erp-label">Prazo de Entrega</label><input type="date" className="erp-input w-full" /></div>
              </div>
              <div><label className="erp-label">OPs Vinculadas (separadas por vírgula)</label><input className="erp-input w-full" placeholder="OP-2026-0455, OP-2026-0456" /></div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowNovoDb(false)} className="erp-btn-ghost flex-1">Cancelar</button>
                <button type="button" onClick={() => { toast.success('Databook criado!'); setShowNovoDb(false); }} className="erp-btn flex-1">Criar Databook</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Vincular Documento */}
      {showVincularDoc !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <p className="font-semibold flex items-center gap-2"><FilePlus size={15} />Vincular Documentos à Seção</p>
              <button type="button" onClick={() => { setShowVincularDoc(null); setDocsSelecionados([]); }} className="text-muted-foreground">✕</button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-xs text-muted-foreground">Selecione os documentos para vincular ou digitalize um novo documento.</p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {DOCS_DISPONIVEIS.map((doc) => (
                  <label key={doc.id} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${docsSelecionados.includes(doc.id) ? 'bg-primary/10 border-primary' : 'border-border hover:bg-muted/20'}`}>
                    <input type="checkbox" checked={docsSelecionados.includes(doc.id)} onChange={() => toggleDoc(doc.id)} className="rounded" />
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${TIPO_COR[doc.tipo] || 'bg-muted border-border text-muted-foreground'}`}>{doc.tipo}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{doc.titulo}</p>
                      {doc.lote && <p className="text-[10px] text-muted-foreground">Lote: {doc.lote}</p>}
                    </div>
                    {doc.assinado ? <Shield size={11} className="text-green-500 shrink-0" /> : <AlertTriangle size={11} className="text-yellow-500 shrink-0" />}
                  </label>
                ))}
              </div>
              <div className="border-t pt-3 flex gap-2">
                <button type="button" onClick={() => { fileRef.current?.click(); }} className="erp-btn-ghost flex-1 text-xs flex items-center justify-center gap-1.5"><Upload size={12} />Digitalizar Novo</button>
                <button type="button" onClick={() => { toast.success(`${docsSelecionados.length} documento(s) vinculado(s)!`); setShowVincularDoc(null); setDocsSelecionados([]); }} className="erp-btn flex-1 text-xs" disabled={docsSelecionados.length === 0}>Vincular Selecionados ({docsSelecionados.length})</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
