import { useState, useRef } from 'react';
import {
  FileText, Plus, Download, Printer, Mail, CheckCircle, Clock,
  Edit3, Eye, Search, Upload, PenTool, Layers, AlertTriangle,
  Shield, FilePlus, Tag, ChevronDown, ChevronRight, X,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Tipos de Documento ──────────────────────────────────────────────────────
const TIPOS_DOC = [
  { id: 1, codigo: 'RI', nome: 'Relatório de Inspeção',             campos: ['produto','op','data','inspetor','resultado'], requer_assinatura: true  },
  { id: 2, codigo: 'RLP', nome: 'Relatório de Líquido Penetrante',  campos: ['produto','op','data','inspetor','norma','resultado'], requer_assinatura: true  },
  { id: 3, codigo: 'RPM', nome: 'Relatório de Partícula Magnética', campos: ['produto','op','data','inspetor','norma','resultado'], requer_assinatura: true  },
  { id: 4, codigo: 'RUS', nome: 'Relatório de Ultrassom',           campos: ['produto','op','data','inspetor','equipamento','resultado'], requer_assinatura: true  },
  { id: 5, codigo: 'RAD', nome: 'Relatório de Radiografia',         campos: ['produto','op','data','inspetor','norma','resultado'], requer_assinatura: true  },
  { id: 6, codigo: 'CI',  nome: 'Certificado de Inspeção',          campos: ['produto','op','data','inspetor','aprovado'], requer_assinatura: true  },
  { id: 7, codigo: 'ITP', nome: 'Plano de Inspeção e Teste (ITP)',  campos: ['produto','revisao','aprovador'], requer_assinatura: true  },
  { id: 8, codigo: 'POP', nome: 'Procedimento Operacional Padrão',  campos: ['titulo','revisao','elaborador','aprovador'], requer_assinatura: true  },
  { id: 9, codigo: 'NCR', nome: 'Relatório de Não Conformidade',    campos: ['descricao','causa','acao','responsavel'], requer_assinatura: false },
];

// ─── Documentos registrados ──────────────────────────────────────────────────
const DOCUMENTOS = [
  { id: 'RI-2026-0482', tipo: 'RI',  titulo: 'Rel. de Inspeção — OP-2026-0451 / TANK-500L', data: '2026-04-30', criado_por: 'Paulo Qualidade', status: 'assinado', assinaturas: ['Paulo Qualidade','Ana Diretora'], ref: 'OP-2026-0451' },
  { id: 'CI-2026-0093', tipo: 'CI',  titulo: 'Certificado de Inspeção — TANK-500L',          data: '2026-04-30', criado_por: 'Paulo Qualidade', status: 'assinado', assinaturas: ['Paulo Qualidade'], ref: 'OP-2026-0451' },
  { id: 'RI-2026-0481', tipo: 'RI',  titulo: 'Rel. de Inspeção — OP-2026-0448 / REATOR-200L',data: '2026-04-29', criado_por: 'Maria Inspetora', status: 'assinado', assinaturas: ['Maria Inspetora','Carlos Eng.'], ref: 'OP-2026-0448' },
  { id: 'RLP-2026-0041',tipo: 'RLP', titulo: 'Liq. Penetrante — Soldagem OP-2026-0448',      data: '2026-04-28', criado_por: 'Carlos Eng.', status: 'pendente_assinatura', assinaturas: ['Carlos Eng.'], ref: 'OP-2026-0448' },
  { id: 'NCR-2026-045', tipo: 'NCR', titulo: 'Rel. de NC — Solda irregular AGIT-100L',        data: '2026-04-25', criado_por: 'Paulo Qualidade', status: 'assinado', assinaturas: ['Paulo Qualidade','Ana Diretora'], ref: 'NC-2026-045' },
  { id: 'ITP-TANK-500L',tipo: 'ITP', titulo: 'ITP — Tanque Inox 316L 500L Rev.3',            data: '2026-03-10', criado_por: 'Carlos Eng.', status: 'assinado', assinaturas: ['Carlos Eng.','Ana Diretora'], ref: 'TANK-500L' },
  { id: 'POP-SOLD-001', tipo: 'POP', titulo: 'POP Soldagem MIG/TIG — Rev.2',                  data: '2026-02-15', criado_por: 'Carlos Eng.', status: 'assinado', assinaturas: ['Carlos Eng.','Ana Diretora'], ref: 'CC-SOLDA' },
  { id: 'RI-2026-0470', tipo: 'RI',  titulo: 'Rel. de Inspeção — OP-2026-0440 / AGIT-100L',  data: '2026-04-25', criado_por: 'Maria Inspetora', status: 'reprovado', assinaturas: ['Maria Inspetora'], ref: 'OP-2026-0440' },
];

// ─── Requisitos de documentação ──────────────────────────────────────────────
const REQUISITOS = [
  { id: 1, produto: 'TANK-500L',   operacao: 'Soldagem MIG',    docs: ['RI', 'RLP', 'CI'], obrigatorio: true  },
  { id: 2, produto: 'TANK-500L',   operacao: 'Acabamento',      docs: ['RI'],              obrigatorio: true  },
  { id: 3, produto: 'TANK-500L',   operacao: 'Teste Hidrost.',  docs: ['RI', 'CI'],        obrigatorio: true  },
  { id: 4, produto: 'REATOR-200L', operacao: 'Soldagem TIG',    docs: ['RI', 'RLP', 'RPM', 'CI'], obrigatorio: true },
  { id: 5, produto: 'REATOR-200L', operacao: 'Inspeção Final',  docs: ['RI', 'CI'],        obrigatorio: true  },
  { id: 6, produto: 'AGIT-100L',   operacao: 'Soldagem MIG',    docs: ['RI'],              obrigatorio: true  },
];

// ─── Usuários com assinatura digital ─────────────────────────────────────────
const USUARIOS_ASSINATURA = [
  { nome: 'Paulo Qualidade',  cargo: 'Inspetor de Qualidade', iniciais: 'PQ', ativo: true },
  { nome: 'Maria Inspetora',  cargo: 'Inspetora Sênior',       iniciais: 'MI', ativo: true },
  { nome: 'Carlos Eng.',      cargo: 'Engenheiro de Processo', iniciais: 'CE', ativo: true },
  { nome: 'Ana Diretora',     cargo: 'Diretora Industrial',    iniciais: 'AD', ativo: true },
  { nome: 'João Soldador',    cargo: 'Soldador Qualificado',   iniciais: 'JS', ativo: false },
];

const STATUS_MAP = {
  assinado:             { label: 'Assinado',            cls: 'erp-badge-success' },
  pendente_assinatura:  { label: 'Pendente Assinatura', cls: 'erp-badge-warning' },
  rascunho:             { label: 'Rascunho',            cls: 'erp-badge-default' },
  reprovado:            { label: 'Reprovado',           cls: 'erp-badge-danger'  },
};

const TIPO_COR = {
  RI:  'bg-blue-50 text-blue-700 border-blue-200',
  CI:  'bg-green-50 text-green-700 border-green-200',
  RLP: 'bg-purple-50 text-purple-700 border-purple-200',
  RPM: 'bg-orange-50 text-orange-700 border-orange-200',
  RUS: 'bg-teal-50 text-teal-700 border-teal-200',
  RAD: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  ITP: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  POP: 'bg-pink-50 text-pink-700 border-pink-200',
  NCR: 'bg-red-50 text-red-700 border-red-200',
};

export default function GestaoDocumentos() {
  const [aba, setAba] = useState('documentos');
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [docSel, setDocSel] = useState(null);
  const [showNovoDoc, setShowNovoDoc] = useState(false);
  const [showAssinatura, setShowAssinatura] = useState(null);
  const [novoDoc, setNovoDoc] = useState({ tipo: 'RI', titulo: '', ref: '', responsavel: '' });
  const [expandedProd, setExpandedProd] = useState({});
  const canvasRef = useRef(null);
  const [desenhando, setDesenhando] = useState(false);
  const [assinado, setAssinado] = useState(false);

  const docsFiltrados = DOCUMENTOS.filter((d) => {
    const matchBusca = !busca || d.titulo.toLowerCase().includes(busca.toLowerCase()) || d.id.toLowerCase().includes(busca.toLowerCase());
    const matchTipo = !filtroTipo || d.tipo === filtroTipo;
    const matchStatus = !filtroStatus || d.status === filtroStatus;
    return matchBusca && matchTipo && matchStatus;
  });

  const pendentes = DOCUMENTOS.filter((d) => d.status === 'pendente_assinatura').length;
  const assinados = DOCUMENTOS.filter((d) => d.status === 'assinado').length;
  const produtosRequisitos = [...new Set(REQUISITOS.map((r) => r.produto))];

  // Canvas signature
  const startDraw = (e) => {
    setDesenhando(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) { ctx.beginPath(); ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY); }
  };
  const draw = (e) => {
    if (!desenhando) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) { ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY); ctx.stroke(); }
  };
  const stopDraw = () => setDesenhando(false);
  const limparAssinatura = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, 320, 120);
    setAssinado(false);
  };

  const ABAS = [
    { id: 'documentos', label: 'Documentos' },
    { id: 'novo',       label: 'Preencher Documento' },
    { id: 'requisitos', label: 'Requisitos de Documentação' },
    { id: 'assinaturas',label: 'Assinaturas Digitais' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><FileText size={20} className="text-primary" />Gestão de Documentos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Documentação eletrônica com assinatura digital integrada à qualidade e produção</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { setAba('novo'); setShowNovoDoc(true); }} className="erp-btn text-xs flex items-center gap-1.5"><Plus size={13} />Novo Documento</button>
          <button type="button" onClick={() => toast.info('Exportando documentos...')} className="erp-btn-ghost text-xs flex items-center gap-1.5"><Download size={13} />Exportar</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total de Documentos', val: DOCUMENTOS.length, icon: <FileText size={14} className="text-primary" />,        cor: 'text-primary' },
          { label: 'Assinados',           val: assinados,          icon: <Shield size={14} className="text-green-600" />,        cor: 'text-green-700' },
          { label: 'Pend. Assinatura',    val: pendentes,          icon: <PenTool size={14} className="text-yellow-600" />,      cor: 'text-yellow-600' },
          { label: 'Tipos de Documento',  val: TIPOS_DOC.length,   icon: <Layers size={14} className="text-purple-600" />,       cor: 'text-purple-700' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3 flex items-center gap-3">
            {k.icon}
            <div><p className="text-[10px] text-muted-foreground">{k.label}</p><p className={`font-bold text-lg ${k.cor}`}>{k.val}</p></div>
          </div>
        ))}
      </div>

      {/* Alerta pendentes */}
      {pendentes > 0 && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 flex items-center gap-2 text-xs text-yellow-800">
          <AlertTriangle size={14} className="shrink-0" />
          <span><strong>{pendentes} documento(s)</strong> aguardando assinatura digital.</span>
          <button type="button" onClick={() => setAba('documentos')} className="ml-auto underline">Ver documentos</button>
        </div>
      )}

      {/* Abas */}
      <div className="border-b border-border flex gap-0 overflow-x-auto">
        {ABAS.map((a) => (
          <button key={a.id} type="button" onClick={() => setAba(a.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${aba === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {a.label}
            {a.id === 'documentos' && pendentes > 0 && <span className="ml-1.5 bg-yellow-500 text-white text-[9px] font-bold px-1 rounded-full">{pendentes}</span>}
          </button>
        ))}
      </div>

      {/* ── DOCUMENTOS ──────────────────────────────────────────────────── */}
      {aba === 'documentos' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="erp-input pl-7 w-full" placeholder="Buscar por título, código ou referência..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <select className="erp-input w-36" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="">Todos os tipos</option>
              {TIPOS_DOC.map((t) => <option key={t.id} value={t.codigo}>{t.codigo} — {t.nome}</option>)}
            </select>
            <select className="erp-input w-40" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
              <option value="">Todos os status</option>
              <option value="assinado">Assinado</option>
              <option value="pendente_assinatura">Pendente Assinatura</option>
              <option value="rascunho">Rascunho</option>
              <option value="reprovado">Reprovado</option>
            </select>
          </div>

          <div className="erp-card overflow-x-auto">
            <table className="erp-table w-full min-w-[800px]">
              <thead><tr><th>Código</th><th>Tipo</th><th>Título</th><th>Data</th><th>Criado por</th><th>Assinaturas</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {docsFiltrados.map((doc) => (
                  <>
                    <tr key={doc.id} className="cursor-pointer" onClick={() => setDocSel(docSel === doc.id ? null : doc.id)}>
                      <td className="font-mono font-bold text-primary text-xs">{doc.id}</td>
                      <td><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${TIPO_COR[doc.tipo] || 'bg-muted text-muted-foreground border-border'}`}>{doc.tipo}</span></td>
                      <td className="font-medium text-xs max-w-xs truncate">{doc.titulo}</td>
                      <td className="text-muted-foreground">{doc.data}</td>
                      <td className="text-muted-foreground text-xs">{doc.criado_por}</td>
                      <td>
                        <div className="flex gap-1">
                          {doc.assinaturas.map((a, i) => (
                            <span key={i} className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center" title={a}>
                              {a.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td><span className={`erp-badge ${STATUS_MAP[doc.status]?.cls || 'erp-badge-default'}`}>{STATUS_MAP[doc.status]?.label}</span></td>
                      <td>
                        <div className="flex gap-1">
                          <button type="button" title="Visualizar" onClick={(e) => { e.stopPropagation(); setDocSel(doc.id); }} className="erp-btn-ghost p-1 text-xs"><Eye size={12} /></button>
                          {doc.status === 'pendente_assinatura' && (
                            <button type="button" title="Assinar" onClick={(e) => { e.stopPropagation(); setShowAssinatura(doc); }} className="erp-btn p-1 text-xs flex items-center gap-0.5"><PenTool size={11} />Assinar</button>
                          )}
                          <button type="button" title="Download PDF" onClick={(e) => { e.stopPropagation(); toast.success('PDF gerado!'); }} className="erp-btn-ghost p-1 text-xs"><Download size={12} /></button>
                          <button type="button" title="Enviar por email" onClick={(e) => { e.stopPropagation(); toast.success('Documento enviado por e-mail!'); }} className="erp-btn-ghost p-1 text-xs"><Mail size={12} /></button>
                        </div>
                      </td>
                    </tr>
                    {/* Preview inline */}
                    {docSel === doc.id && (
                      <tr key={`${doc.id}-detail`}>
                        <td colSpan={8} className="p-0">
                          <div className="bg-muted/10 border-t border-border/40 px-6 py-4">
                            <div className="max-w-2xl mx-auto border-2 border-primary/20 rounded-xl bg-white p-5 space-y-3 text-xs">
                              <div className="flex items-center justify-between border-b pb-2">
                                <div>
                                  <p className="font-bold text-sm">{TIPOS_DOC.find((t) => t.codigo === doc.tipo)?.nome}</p>
                                  <p className="text-muted-foreground">{doc.titulo}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded border ${TIPO_COR[doc.tipo]}`}>{doc.tipo}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><span className="text-muted-foreground">Código: </span><strong>{doc.id}</strong></div>
                                <div><span className="text-muted-foreground">Data: </span><strong>{doc.data}</strong></div>
                                <div><span className="text-muted-foreground">Referência: </span><strong>{doc.ref}</strong></div>
                                <div><span className="text-muted-foreground">Elaborado por: </span><strong>{doc.criado_por}</strong></div>
                              </div>
                              <div className="border-t pt-3">
                                <p className="font-semibold mb-1.5">Assinaturas Digitais</p>
                                <div className="flex gap-3 flex-wrap">
                                  {doc.assinaturas.map((a, i) => {
                                    const usr = USUARIOS_ASSINATURA.find((u) => u.nome === a);
                                    return (
                                      <div key={i} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                        <Shield size={12} className="text-green-500" />
                                        <div>
                                          <p className="font-bold">{a}</p>
                                          <p className="text-[10px] text-muted-foreground">{usr?.cargo || 'Signatário'}</p>
                                          <p className="text-[10px] text-green-600">✓ Assinado digitalmente</p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {doc.status === 'pendente_assinatura' && (
                                    <button type="button" onClick={() => setShowAssinatura(doc)} className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-yellow-700 hover:bg-yellow-100">
                                      <PenTool size={12} />
                                      <div className="text-left"><p className="font-bold">Pendente</p><p className="text-[10px]">Clique para assinar</p></div>
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button type="button" onClick={() => toast.success('PDF gerado!')} className="erp-btn text-xs flex items-center gap-1"><Printer size={11} />Gerar PDF</button>
                                <button type="button" onClick={() => toast.success('E-mail enviado!')} className="erp-btn-ghost text-xs flex items-center gap-1"><Mail size={11} />Enviar por E-mail</button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PREENCHER DOCUMENTO ──────────────────────────────────────────── */}
      {aba === 'novo' && (
        <div className="space-y-3 max-w-3xl">
          <div className="erp-card p-5 space-y-4">
            <p className="text-sm font-semibold flex items-center gap-2"><FilePlus size={15} className="text-primary" />Preencher Novo Documento</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="erp-label">Tipo de Documento</label>
                <select className="erp-input w-full" value={novoDoc.tipo} onChange={(e) => setNovoDoc({ ...novoDoc, tipo: e.target.value })}>
                  {TIPOS_DOC.map((t) => <option key={t.id} value={t.codigo}>{t.codigo} — {t.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="erp-label">Referência (OP / NF-e / Produto)</label>
                <input className="erp-input w-full" placeholder="OP-2026-..." value={novoDoc.ref} onChange={(e) => setNovoDoc({ ...novoDoc, ref: e.target.value })} />
              </div>
            </div>

            {/* Campos dinâmicos por tipo */}
            <div className="border border-border rounded-lg p-4 bg-muted/10 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Campos do Documento — {TIPOS_DOC.find((t) => t.codigo === novoDoc.tipo)?.nome}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(TIPOS_DOC.find((t) => t.codigo === novoDoc.tipo)?.campos || []).map((campo) => {
                  const labels = { produto: 'Produto', op: 'Ordem de Produção', data: 'Data', inspetor: 'Inspetor Responsável', resultado: 'Resultado', norma: 'Norma Aplicada', equipamento: 'Equipamento Utilizado', aprovado: 'Produto Aprovado?', revisao: 'Revisão', aprovador: 'Aprovador', elaborador: 'Elaborador', titulo: 'Título do Documento', descricao: 'Descrição do Defeito', causa: 'Causa Raiz', acao: 'Ação Corretiva', responsavel: 'Responsável' };
                  if (campo === 'resultado') return (
                    <div key={campo} className="sm:col-span-2">
                      <label className="erp-label">{labels[campo]}</label>
                      <textarea className="erp-input w-full h-20 resize-none" placeholder="Descreva os resultados da inspeção..." />
                    </div>
                  );
                  if (campo === 'aprovado') return (
                    <div key={campo}>
                      <label className="erp-label">{labels[campo]}</label>
                      <select className="erp-input w-full"><option>Aprovado</option><option>Reprovado</option><option>Aprovado com Ressalva</option></select>
                    </div>
                  );
                  if (campo === 'data') return (
                    <div key={campo}>
                      <label className="erp-label">{labels[campo]}</label>
                      <input type="date" className="erp-input w-full" defaultValue="2026-04-30" />
                    </div>
                  );
                  return (
                    <div key={campo}>
                      <label className="erp-label">{labels[campo] || campo}</label>
                      <input className="erp-input w-full" placeholder={labels[campo] || campo} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="erp-label">Observações Adicionais</label>
              <textarea className="erp-input w-full h-16 resize-none" placeholder="Observações..." />
            </div>

            {/* Assinatura */}
            <div className="border border-border rounded-lg p-4 bg-muted/5">
              <p className="text-xs font-semibold mb-3 flex items-center gap-1.5"><PenTool size={13} className="text-primary" />Assinatura Digital do Elaborador</p>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Assine no campo abaixo</p>
                  <canvas ref={canvasRef} width={320} height={100}
                    className="border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-crosshair bg-white"
                    style={{ touchAction: 'none' }}
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                  />
                  <div className="flex gap-2 mt-1.5">
                    <button type="button" onClick={limparAssinatura} className="erp-btn-ghost text-xs flex items-center gap-1"><X size={10} />Limpar</button>
                    <button type="button" onClick={() => setAssinado(true)} className="erp-btn text-xs flex items-center gap-1"><CheckCircle size={10} />Confirmar</button>
                  </div>
                </div>
                <div className="flex-1 space-y-2 text-xs">
                  <div><label className="erp-label">Usuário</label><input className="erp-input w-full" defaultValue="Paulo Qualidade" /></div>
                  <div><label className="erp-label">Cargo</label><input className="erp-input w-full" defaultValue="Inspetor de Qualidade" /></div>
                  {assinado && <div className="flex items-center gap-1.5 text-green-600 font-semibold bg-green-50 border border-green-200 rounded p-2"><Shield size={13} />Assinatura digital confirmada</div>}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => toast.info('Rascunho salvo!')} className="erp-btn-ghost flex-1 text-xs">Salvar Rascunho</button>
              <button type="button" onClick={() => { toast.success('Documento registrado e assinado!'); setAba('documentos'); }} className="erp-btn flex-1 text-xs flex items-center justify-center gap-1.5"><Shield size={12} />Registrar com Assinatura</button>
            </div>
          </div>
        </div>
      )}

      {/* ── REQUISITOS DE DOCUMENTAÇÃO ──────────────────────────────────── */}
      {aba === 'requisitos' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Define quais documentos devem ser elaborados por produto e operação do roteiro de fabricação.</p>
            <button type="button" onClick={() => toast.info('Novo requisito adicionado!')} className="erp-btn text-xs flex items-center gap-1.5"><Plus size={12} />Novo Requisito</button>
          </div>

          {produtosRequisitos.map((produto) => {
            const reqs = REQUISITOS.filter((r) => r.produto === produto);
            const aberto = expandedProd[produto] !== false;
            return (
              <div key={produto} className="erp-card overflow-hidden">
                <button type="button" className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 border-b border-border text-left" onClick={() => setExpandedProd((p) => ({ ...p, [produto]: !aberto }))}>
                  <span className="text-xs font-semibold flex items-center gap-2"><Tag size={12} className="text-primary" />{produto}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground">{reqs.length} operações com requisitos</span>
                    {aberto ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </div>
                </button>
                {aberto && (
                  <table className="erp-table w-full">
                    <thead><tr><th>Operação do Roteiro</th><th>Documentos Exigidos</th><th>Obrigatoriedade</th><th>Atendido?</th></tr></thead>
                    <tbody>
                      {reqs.map((req) => {
                        const docsExistentes = DOCUMENTOS.filter((d) => d.ref.includes(produto.split('-')[0]) && req.docs.includes(d.tipo)).length;
                        const atendido = docsExistentes >= req.docs.length;
                        return (
                          <tr key={req.id}>
                            <td className="font-medium">{req.operacao}</td>
                            <td>
                              <div className="flex gap-1 flex-wrap">
                                {req.docs.map((d) => (
                                  <span key={d} className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${TIPO_COR[d] || 'bg-muted text-muted-foreground border-border'}`}>{d}</span>
                                ))}
                              </div>
                            </td>
                            <td><span className={`erp-badge ${req.obrigatorio ? 'erp-badge-danger' : 'erp-badge-warning'}`}>{req.obrigatorio ? 'Obrigatório' : 'Recomendado'}</span></td>
                            <td>
                              {atendido
                                ? <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle size={11} />Sim</span>
                                : <span className="flex items-center gap-1 text-yellow-600 text-xs"><AlertTriangle size={11} />Pendente</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── ASSINATURAS DIGITAIS ─────────────────────────────────────────── */}
      {aba === 'assinaturas' && (
        <div className="space-y-3">
          <div className="erp-card p-4 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2"><Shield size={15} className="text-primary" />Usuários com Assinatura Digital Cadastrada</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {USUARIOS_ASSINATURA.map((u) => (
                <div key={u.nome} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${u.ativo ? 'border-green-200 bg-green-50/40' : 'border-muted bg-muted/20 opacity-60'}`}>
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">{u.iniciais}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs">{u.nome}</p>
                    <p className="text-[10px] text-muted-foreground">{u.cargo}</p>
                    {u.ativo
                      ? <span className="flex items-center gap-1 text-[10px] text-green-600"><Shield size={9} />Assinatura digital ativa</span>
                      : <span className="text-[10px] text-muted-foreground">Inativo</span>}
                  </div>
                  <button type="button" onClick={() => toast.info(`Assinatura de ${u.nome} gerenciada!`)} className="erp-btn-ghost text-[10px] p-1"><Edit3 size={11} /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => toast.info('Novo usuário adicionado!')} className="erp-btn text-xs flex items-center gap-1.5"><Plus size={12} />Adicionar Usuário</button>
          </div>

          <div className="erp-card p-4 space-y-2">
            <p className="text-sm font-semibold">Documentos Aguardando Assinatura</p>
            {DOCUMENTOS.filter((d) => d.status === 'pendente_assinatura').length === 0
              ? <p className="text-xs text-muted-foreground">Nenhum documento pendente de assinatura.</p>
              : DOCUMENTOS.filter((d) => d.status === 'pendente_assinatura').map((doc) => (
                <div key={doc.id} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5 text-xs">
                  <div>
                    <p className="font-semibold">{doc.id} — {doc.titulo}</p>
                    <p className="text-muted-foreground">Criado por {doc.criado_por} em {doc.data}</p>
                  </div>
                  <button type="button" onClick={() => setShowAssinatura(doc)} className="erp-btn text-xs flex items-center gap-1"><PenTool size={11} />Assinar Agora</button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Modal Assinatura Digital */}
      {showAssinatura && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <p className="font-semibold flex items-center gap-2"><PenTool size={15} />Assinar Documento Digitalmente</p>
              <button type="button" onClick={() => { setShowAssinatura(null); setAssinado(false); }} className="text-muted-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-muted/20 rounded-lg p-3 text-xs">
                <p className="font-semibold">{showAssinatura.id}</p>
                <p className="text-muted-foreground">{showAssinatura.titulo}</p>
              </div>
              <div>
                <label className="erp-label">Usuário Signatário</label>
                <select className="erp-input w-full">
                  {USUARIOS_ASSINATURA.filter((u) => u.ativo).map((u) => <option key={u.nome}>{u.nome} — {u.cargo}</option>)}
                </select>
              </div>
              <div>
                <p className="erp-label mb-1">Assinatura Manual (desenhe abaixo)</p>
                <canvas ref={canvasRef} width={380} height={100}
                  className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-crosshair bg-white"
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                />
                <button type="button" onClick={limparAssinatura} className="mt-1 erp-btn-ghost text-xs flex items-center gap-1"><X size={10} />Limpar</button>
              </div>
              <div>
                <label className="erp-label">Confirmação de Senha</label>
                <input type="password" className="erp-input w-full" placeholder="••••••••" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowAssinatura(null); setAssinado(false); }} className="erp-btn-ghost flex-1">Cancelar</button>
                <button type="button" onClick={() => { toast.success('Documento assinado digitalmente!'); setShowAssinatura(null); setAssinado(false); }} className="erp-btn flex-1 flex items-center justify-center gap-1.5"><Shield size={13} />Confirmar Assinatura</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
