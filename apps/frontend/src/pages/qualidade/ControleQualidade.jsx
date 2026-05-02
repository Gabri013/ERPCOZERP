import { useState, useRef, useEffect, useCallback } from 'react';
import { listInspections, createInspection, listNonConformities, createNonConformity, updateNonConformity, listInstruments, listInspectionPlans, getQualityStats } from '@/services/qualityApi.js';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import {
  ClipboardCheck, AlertTriangle, CheckCircle, XCircle, Plus, Download,
  Upload, Printer, Mail, Search, ChevronDown, ChevronRight, Eye,
  Thermometer, Gauge, Ruler, RefreshCw, FileText, Star,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (v, d = 2) => Number(v || 0).toFixed(d);
const badge = (status) => {
  const map = { aprovado: 'erp-badge-success', reprovado: 'erp-badge-danger', pendente: 'erp-badge-warning', parcial: 'erp-badge-warning' };
  return map[status] || 'erp-badge-default';
};

// ─── planos de Inspeção ─────────────────────────────────────────────────────
const planos = [
  {
    id: 1, codigo: 'PI-001', produto: 'TANK-500L', tipo: 'Produto Fabricado', ativo: true,
    itens: [
      { id: 1, caracteristica: 'Espessura da chapa (mm)',    metodo: 'Ultrassom',       min: 2.8,  max: 3.2,  unidade: 'mm',  instrumento: 'Medidor Ultrassônico' },
      { id: 2, caracteristica: 'Teste de estanqueidade',     metodo: 'Pressão hidrost.', min: null, max: null, unidade: 'bar', instrumento: 'Manômetro digital' },
      { id: 3, caracteristica: 'Acabamento superficial Ra',  metodo: 'Rugosímetro',     min: 0.4,  max: 0.8,  unidade: 'μm',  instrumento: 'Rugosímetro TR200' },
      { id: 4, caracteristica: 'Dimensional (Altura, mm)',   metodo: 'Trena / Paquímetro', min: 1195, max: 1205, unidade: 'mm', instrumento: 'Trena Inox 5m' },
      { id: 5, caracteristica: 'Visual — Cordões de solda',  metodo: 'Inspeção visual', min: null, max: null, unidade: 'OK/NOK', instrumento: 'Lupa 10x' },
    ],
  },
  {
    id: 2, codigo: 'PI-002', produto: 'MP — Chapa Inox', tipo: 'Recebimento de MP', ativo: true,
    itens: [
      { id: 1, caracteristica: 'Espessura (mm)',            metodo: 'Micrômetro',      min: 2.9,  max: 3.1,  unidade: 'mm',  instrumento: 'Micrômetro externo' },
      { id: 2, caracteristica: 'Composição química',        metodo: 'Certificado',     min: null, max: null, unidade: 'Conf/NC', instrumento: '—' },
      { id: 3, caracteristica: 'Planicidade (mm/m)',        metodo: 'Régua + Relógio', min: 0,    max: 1.5,  unidade: 'mm/m', instrumento: 'Régua de precisão' },
    ],
  },
];

// ─── Inspeções realizadas ────────────────────────────────────────────────────
const inspecoes = [
  { id: 'INS-2026-0312', data: '2026-04-30', tipo: 'Produto Fabricado', ref: 'OP-2026-0451', produto: 'TANK-500L', inspetor: 'Paulo Qualidade', status: 'aprovado',  nc: 0 },
  { id: 'INS-2026-0311', data: '2026-04-29', tipo: 'Produto Fabricado', ref: 'OP-2026-0448', produto: 'REATOR-200L', inspetor: 'Paulo Qualidade', status: 'aprovado',nc: 0 },
  { id: 'INS-2026-0310', data: '2026-04-28', tipo: 'Recebimento MP',    ref: 'NF-e 004812',  produto: 'Chapa 316L 3mm', inspetor: 'Maria Insp.', status: 'aprovado',  nc: 0 },
  { id: 'INS-2026-0308', data: '2026-04-25', tipo: 'Produto Fabricado', ref: 'OP-2026-0440', produto: 'AGIT-100L', inspetor: 'Paulo Qualidade', status: 'reprovado', nc: 2 },
  { id: 'INS-2026-0305', data: '2026-04-22', tipo: 'Processo',          ref: 'CC-SOLDA',     produto: 'Processo Soldagem', inspetor: 'Maria Insp.', status: 'aprovado',nc: 0 },
  { id: 'INS-2026-0301', data: '2026-04-18', tipo: 'Recebimento MP',    ref: 'NF-e 004790',  produto: 'Tubo 1.5" SCH10', inspetor: 'Maria Insp.', status: 'parcial', nc: 1 },
];

// ─── Não Conformidades ───────────────────────────────────────────────────────
const NCS = [
  { id: 'NC-2026-045', data: '2026-04-25', produto: 'AGIT-100L', defeito: 'Cordão de solda irregular', tipo: 'Fabricação', gravidade: 'maior', status: 'em_analise', causa: 'Operador sem treinamento adequado na posição vertical', acao: 'Treinamento + reinspeção 100%' },
  { id: 'NC-2026-046', data: '2026-04-25', produto: 'AGIT-100L', defeito: 'Dimensional fora da tolerância (altura)', tipo: 'Fabricação', gravidade: 'menor', status: 'encerrada', causa: 'Setup incorreto no gabarito', acao: 'Atualização procedimento de setup' },
  { id: 'NC-2026-041', data: '2026-04-18', produto: 'Tubo 1.5" SCH10', defeito: 'Espessura fora do tolerado em 3 barras', tipo: 'Recebimento', gravidade: 'maior', status: 'encerrada', causa: 'Fornecedor fora da especificação', acao: 'Devolução + qualificação alternativo' },
  { id: 'NC-2026-038', data: '2026-04-10', produto: 'TANK-500L', defeito: 'Marcas de lixamento excessivo', tipo: 'Acabamento', gravidade: 'menor', status: 'encerrada', causa: 'Discos de lixa muito abrasivos', acao: 'Substituição de disco + atualização de ITP' },
];

// ─── Indicadores ─────────────────────────────────────────────────────────────
const INDICADORES_MENSAL = [
  { mes: 'Nov', inspecoes: 28, aprovadas: 26, ncs: 4, fq_ppm: 1850 },
  { mes: 'Dez', inspecoes: 24, aprovadas: 23, ncs: 2, fq_ppm: 1200 },
  { mes: 'Jan', inspecoes: 20, aprovadas: 19, ncs: 3, fq_ppm: 1600 },
  { mes: 'Fev', inspecoes: 30, aprovadas: 29, ncs: 2, fq_ppm: 980  },
  { mes: 'Mar', inspecoes: 32, aprovadas: 31, ncs: 1, fq_ppm: 750  },
  { mes: 'Abr', inspecoes: 30, aprovadas: 28, ncs: 3, fq_ppm: 1100 },
];

const NC_POR_TIPO = [
  { name: 'Soldagem', value: 6 },
  { name: 'Dimensional', value: 4 },
  { name: 'Acabamento', value: 3 },
  { name: 'Recebimento MP', value: 3 },
  { name: 'Processo', value: 1 },
];

const RADAR_QUALIDADE = [
  { area: 'Soldagem', meta: 95, real: 92 },
  { area: 'Dimensional', meta: 98, real: 97 },
  { area: 'Acabamento', meta: 90, real: 88 },
  { area: 'Recebimento', meta: 96, real: 94 },
  { area: 'Processo', meta: 95, real: 96 },
];

// ─── instrumentos ────────────────────────────────────────────────────────────
const instrumentos = [
  { id: 1, codigo: 'INST-001', nome: 'Micrômetro Externo 0-25mm', marca: 'Mitutoyo', serie: 'MT-2026-1', calibracao: '2026-01-15', proxima: '2026-07-15', status: 'ok' },
  { id: 2, codigo: 'INST-002', nome: 'Rugosímetro TR200',          marca: 'Time',     serie: 'TR-2025-8', calibracao: '2025-11-20', proxima: '2026-05-20', status: 'vencendo' },
  { id: 3, codigo: 'INST-003', nome: 'Medidor Ultrassônico',       marca: 'Olympus',  serie: 'OL-2024-4', calibracao: '2025-08-10', proxima: '2026-08-10', status: 'ok' },
  { id: 4, codigo: 'INST-004', nome: 'Manômetro Digital 0-10 bar', marca: 'Wika',     serie: 'WK-2026-2', calibracao: '2026-02-28', proxima: '2026-08-28', status: 'ok' },
  { id: 5, codigo: 'INST-005', nome: 'Trena Inox 5m',              marca: 'Starrett', serie: 'ST-2023-7', calibracao: '2025-03-10', proxima: '2026-03-10', status: 'vencido' },
];

const CORES_NC = ['#ef4444', '#f97316', '#f59e0b', '#8b5cf6', '#6b7280'];

export default function ControleQualidade() {
  const [aba, setAba] = useState('painel');
  const [planos, setPlanos] = useState([]);
  const [planoSel, setPlanoSel] = useState(planos[0]);
  const [inspecoes, setInspecoes] = useState([]);
  const [instrumentos, setInstrumentos] = useState([]);
  const [naoConformidades, setNaoConformidades] = useState([]);
  const [inspecaoSel, setInspecaoSel] = useState(null);
  const [showNovaInsp, setShowNovaInsp] = useState(false);
  const [showCertificado, setShowCertificado] = useState(false);
  const [ncSel, setNcSel] = useState(null);
  const fileRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      const [insps, ncs, insts, plans] = await Promise.all([
        listInspections(),
        listNonConformities(),
        listInstruments(),
        listInspectionPlans(),
      ]);
      if (insps && insps.length > 0) {
        setInspecoes(insps.map((i) => ({
          id: i.code,
          _id: i.id,
          tipo: i.type,
          produto: i.productName || '',
          codProduto: i.productCode || '',
          docRef: i.referenceDoc || '',
          resultado: i.status,
          inspetor: i.inspector || '',
          data: i.inspectedAt ? i.inspectedAt.slice(0, 10) : '',
          criterios: Array.isArray(i.results) ? i.results : [],
          obs: i.notes || '',
        })));
      }
      if (ncs && ncs.length > 0) {
        setNaoConformidades(ncs.map((n) => ({
          id: n.code,
          _id: n.id,
          titulo: n.title,
          descricao: n.description || '',
          origem: n.origin || '',
          gravidade: n.severity,
          status: n.status,
          causaRaiz: n.rootCause || '',
          acaoCorretiva: n.correctiveAction || '',
          responsavel: n.responsible || '',
          prazo: n.dueDate ? n.dueDate.slice(0, 10) : '',
          fechamento: n.closedAt ? n.closedAt.slice(0, 10) : null,
        })));
      }
      if (insts && insts.length > 0) {
        setInstrumentos(insts.map((i) => ({
          id: i.code,
          _id: i.id,
          nome: i.name,
          tipo: i.instrumentType || '',
          local: i.location || '',
          status: i.status,
          ultCalib: i.lastCalibration ? i.lastCalibration.slice(0, 10) : '',
          proxCalib: i.nextCalibration ? i.nextCalibration.slice(0, 10) : '',
          responsavel: i.responsible || '',
          certificado: i.certificate || '',
        })));
      }
      if (plans && plans.length > 0) {
        setPlanos(plans.map((p) => ({
          id: p.code,
          _id: p.id,
          nome: p.name,
          produto: p.productCode || '',
          etapa: p.stage,
          ativo: p.active,
          criterios: Array.isArray(p.criteria) ? p.criteria : [],
        })));
        setPlanoSel(plans.length > 0 ? { id: plans[0].code, nome: plans[0].name, criterios: Array.isArray(plans[0].criteria) ? plans[0].criteria : [] } : null);
      }
    } catch {
      // keep mock data on error
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const totalInsp = INDICADORES_MENSAL.reduce((s, m) => s + m.inspecoes, 0);
  const totalAprov = INDICADORES_MENSAL.reduce((s, m) => s + m.aprovadas, 0);
  const totalNCs = INDICADORES_MENSAL.reduce((s, m) => s + m.ncs, 0);
  const txAprovacao = (totalAprov / totalInsp * 100).toFixed(1);

  const ABAS = [
    { id: 'painel',       label: 'Painel de Qualidade' },
    { id: 'planos',       label: 'planos de Inspeção' },
    { id: 'inspecoes',    label: 'Inspeções' },
    { id: 'nao_conform',  label: 'Não Conformidades' },
    { id: 'instrumentos', label: 'instrumentos' },
    { id: 'indicadores',  label: 'Indicadores' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><ClipboardCheck size={20} className="text-primary" />Controle da Qualidade</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Inspeções, não conformidades, certificados e indicadores de qualidade integrados à produção</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowNovaInsp(true)} className="erp-btn text-xs flex items-center gap-1.5"><Plus size={13} />Nova Inspeção</button>
          <button type="button" onClick={() => fileRef.current?.click()} className="erp-btn-ghost text-xs flex items-center gap-1.5"><Upload size={13} />Importar Excel</button>
          <input ref={fileRef} type="file" className="hidden" accept=".xlsx,.csv" onChange={() => toast.success('Inspeções importadas com sucesso!')} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Inspeções (6m)',    val: totalInsp,           sub: 'realizadas',       icon: <ClipboardCheck size={14} className="text-primary" />,    cor: 'text-primary' },
          { label: 'Taxa de Aprovação', val: `${txAprovacao}%`,   sub: 'últimos 6 meses',  icon: <CheckCircle size={14} className="text-green-600" />,     cor: 'text-green-700' },
          { label: 'Não Conformidades', val: totalNCs,            sub: 'últimos 6 meses',  icon: <AlertTriangle size={14} className="text-red-600" />,     cor: 'text-red-600' },
          { label: 'Calibrações Venc.', val: instrumentos.filter((i) => i.status !== 'ok').length, sub: 'instrumentos', icon: <Gauge size={14} className="text-yellow-600" />, cor: 'text-yellow-600' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3 flex items-center gap-3">
            {k.icon}
            <div><p className="text-[10px] text-muted-foreground">{k.label}</p><p className={`font-bold text-lg ${k.cor}`}>{k.val} <span className="text-[10px] font-normal text-muted-foreground">{k.sub}</span></p></div>
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

      {/* ── PAINEL ──────────────────────────────────────────────────────── */}
      {aba === 'painel' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Evolução aprovação */}
            <div className="erp-card p-4 lg:col-span-2" style={{ height: 220 }}>
              <p className="text-xs font-semibold mb-2">Inspeções × Aprovadas × Não Conformidades</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={INDICADORES_MENSAL}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="inspecoes" name="Inspeções" fill="#2563eb" radius={[2,2,0,0]} />
                  <Bar dataKey="aprovadas" name="Aprovadas" fill="#10b981" radius={[2,2,0,0]} />
                  <Bar dataKey="ncs" name="NCs" fill="#ef4444" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* NCs por tipo */}
            <div className="erp-card p-4" style={{ height: 220 }}>
              <p className="text-xs font-semibold mb-2">NCs por Tipo de Defeito</p>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={NC_POR_TIPO} dataKey="value" cx="50%" cy="45%" outerRadius={60} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {NC_POR_TIPO.map((_, i) => <Cell key={i} fill={CORES_NC[i % CORES_NC.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar qualidade */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="erp-card p-4" style={{ height: 230 }}>
              <p className="text-xs font-semibold mb-2">Índice de Qualidade por Área</p>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={RADAR_QUALIDADE}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="area" tick={{ fontSize: 9 }} />
                  <Radar name="Meta" dataKey="meta" stroke="#d1d5db" fill="#d1d5db" fillOpacity={0.3} />
                  <Radar name="Real" dataKey="real" stroke="#2563eb" fill="#2563eb" fillOpacity={0.4} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Tendência PPM */}
            <div className="erp-card p-4" style={{ height: 230 }}>
              <p className="text-xs font-semibold mb-2">Tendência FQ — PPM (partes por milhão defeituosas)</p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={INDICADORES_MENSAL}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(v) => `${v} PPM`} />
                  <Line dataKey="fq_ppm" name="PPM" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                  {/* meta */}
                  <Line dataKey={() => 800} name="Meta" stroke="#10b981" strokeDasharray="5 4" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Inspeções pendentes */}
          <div className="erp-card overflow-hidden">
            <div className="px-4 py-2.5 bg-yellow-50 border-b border-yellow-200 text-xs font-semibold text-yellow-700 flex items-center gap-2">
              <AlertTriangle size={12} />Inspeções Pendentes / NCs em Aberto
            </div>
            <div className="divide-y divide-border/30">
              {[
                { ref: 'OP-2026-0455', produto: 'TANK-500L', tipo: 'Produto Fabricado', prazo: 'Hoje', urgente: true },
                { ref: 'NC-2026-045', produto: 'AGIT-100L — Solda irregular', tipo: 'NC em Análise', prazo: '03/05', urgente: false },
                { ref: 'NF-e 004850', produto: 'Chapa 316L 2mm', tipo: 'Recebimento MP', prazo: '02/05', urgente: true },
              ].map((item, i) => (
                <div key={i} className={`flex items-center justify-between px-4 py-2.5 text-xs ${item.urgente ? 'bg-red-50/50' : ''}`}>
                  <div className="flex items-center gap-3">
                    {item.urgente ? <AlertTriangle size={13} className="text-red-500" /> : <ClipboardCheck size={13} className="text-yellow-500" />}
                    <div>
                      <span className="font-semibold">{item.ref}</span>
                      <span className="text-muted-foreground ml-2">{item.produto}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="erp-badge erp-badge-warning">{item.tipo}</span>
                    <span className={`text-xs font-semibold ${item.urgente ? 'text-red-600' : 'text-muted-foreground'}`}>{item.prazo}</span>
                    <button type="button" onClick={() => setShowNovaInsp(true)} className="erp-btn text-xs py-0.5 px-2">Inspecionar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── planos DE INSPEÇÃO ───────────────────────────────────────────── */}
      {aba === 'planos' && (
        <div className="flex gap-3 flex-col lg:flex-row">
          <div className="w-full lg:w-52 shrink-0 space-y-1">
            <div className="flex items-center justify-between px-1 mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">planos</p>
              <button type="button" onClick={() => toast.info('Novo plano criado!')} className="erp-btn text-[10px] py-0.5 px-1.5 flex items-center gap-0.5"><Plus size={9} />Novo</button>
            </div>
            {planos.map((p) => (
              <button key={p.id} type="button" onClick={() => setPlanoSel(p)}
                className={`w-full text-left p-2.5 rounded-lg border transition-colors ${planoSel.id === p.id ? 'bg-primary/10 border-primary' : 'bg-white border-border hover:bg-muted/20'}`}>
                <div className="font-mono text-[10px] font-bold text-primary">{p.codigo}</div>
                <div className="text-xs font-medium truncate">{p.produto}</div>
                <div className="text-[10px] text-muted-foreground">{p.tipo}</div>
                <div className="text-[10px] mt-0.5">{p.itens.length} itens de inspeção</div>
              </button>
            ))}
          </div>

          <div className="flex-1 erp-card overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/20 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold">{planoSel.codigo} — {planoSel.produto}</p>
                <p className="text-[10px] text-muted-foreground">{planoSel.tipo} · {planoSel.itens.length} características</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => toast.info('Plano exportado!')} className="erp-btn-ghost text-xs flex items-center gap-1"><Download size={11} />PDF</button>
                <button type="button" className="erp-btn text-xs flex items-center gap-1"><Plus size={11} />Add Item</button>
              </div>
            </div>
            <table className="erp-table w-full">
              <thead><tr><th>#</th><th>Característica</th><th>Método</th><th className="text-right">Mín.</th><th className="text-right">Máx.</th><th>Unidade</th><th>Instrumento</th></tr></thead>
              <tbody>
                {planoSel.itens.map((item) => (
                  <tr key={item.id}>
                    <td className="text-muted-foreground">{item.id}</td>
                    <td className="font-medium">{item.caracteristica}</td>
                    <td className="text-muted-foreground text-xs">{item.metodo}</td>
                    <td className="text-right font-mono">{item.min ?? '—'}</td>
                    <td className="text-right font-mono">{item.max ?? '—'}</td>
                    <td className="text-xs">{item.unidade}</td>
                    <td className="text-xs text-muted-foreground">{item.instrumento}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── INSPEÇÕES ────────────────────────────────────────────────────── */}
      {aba === 'inspecoes' && (
        <div className="space-y-3">
          <div className="erp-card overflow-x-auto">
            <table className="erp-table w-full min-w-[780px]">
              <thead><tr><th>Código</th><th>Data</th><th>Tipo</th><th>Referência</th><th>Produto</th><th>Inspetor</th><th>Status</th><th>NCs</th><th></th></tr></thead>
              <tbody>
                {inspecoes.map((ins) => (
                  <tr key={ins.id} className="cursor-pointer" onClick={() => setInspecaoSel(ins.id === inspecaoSel ? null : ins.id)}>
                    <td className="font-mono font-bold text-primary text-xs">{ins.id}</td>
                    <td>{ins.data}</td>
                    <td><span className="erp-badge erp-badge-info text-[10px]">{ins.tipo}</span></td>
                    <td className="font-mono text-xs">{ins.ref}</td>
                    <td className="font-medium">{ins.produto}</td>
                    <td className="text-muted-foreground text-xs">{ins.inspetor}</td>
                    <td><span className={`erp-badge ${badge(ins.status)}`}>{ins.status}</span></td>
                    <td>{ins.nc > 0 ? <span className="text-red-600 font-bold">{ins.nc}</span> : <span className="text-muted-foreground">0</span>}</td>
                    <td>
                      <div className="flex gap-1">
                        <button type="button" title="Ver inspeção" onClick={(e) => { e.stopPropagation(); setInspecaoSel(ins.id); }} className="erp-btn-ghost text-xs p-1"><Eye size={12} /></button>
                        <button type="button" title="Certificado" onClick={(e) => { e.stopPropagation(); setShowCertificado(true); }} className="erp-btn-ghost text-xs p-1"><Printer size={12} /></button>
                        <button type="button" title="Enviar por email" onClick={(e) => { e.stopPropagation(); toast.success('Certificado enviado por e-mail!'); }} className="erp-btn-ghost text-xs p-1"><Mail size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detalhe inspeção */}
          {inspecaoSel && (() => {
            const ins = inspecoes.find((i) => i.id === inspecaoSel);
            if (!ins) return null;
            const plano = planos.find((p) => p.tipo === ins.tipo.replace(' MP', ' de MP') || p.produto.startsWith(ins.produto.split(' ')[0])) || planos[0];
            return (
              <div className="erp-card overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/20 border-b border-border flex items-center justify-between">
                  <p className="text-xs font-semibold">{ins.id} — Resultado da Inspeção</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowCertificado(true)} className="erp-btn text-xs flex items-center gap-1"><Printer size={11} />Certificado</button>
                    <button type="button" onClick={() => toast.success('E-mail enviado!')} className="erp-btn-ghost text-xs flex items-center gap-1"><Mail size={11} />Enviar</button>
                  </div>
                </div>
                <table className="erp-table w-full">
                  <thead><tr><th>Característica</th><th>Método</th><th className="text-right">Mín.</th><th className="text-right">Máx.</th><th className="text-right">Resultado</th><th>UN</th><th>Conformidade</th></tr></thead>
                  <tbody>
                    {plano.itens.map((item, i) => {
                      const resultado = item.min != null ? Number((item.min + (item.max - item.min) * (0.3 + i * 0.15)).toFixed(2)) : 'OK';
                      const conforme = item.min == null || (resultado >= item.min && resultado <= item.max);
                      return (
                        <tr key={item.id} className={!conforme ? 'bg-red-50' : ''}>
                          <td className="font-medium text-xs">{item.caracteristica}</td>
                          <td className="text-muted-foreground text-xs">{item.metodo}</td>
                          <td className="text-right font-mono text-xs">{item.min ?? '—'}</td>
                          <td className="text-right font-mono text-xs">{item.max ?? '—'}</td>
                          <td className={`text-right font-mono font-bold ${conforme ? 'text-green-700' : 'text-red-600'}`}>{resultado}</td>
                          <td className="text-xs">{item.unidade}</td>
                          <td>{conforme ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── NÃO CONFORMIDADES ─────────────────────────────────────────────── */}
      {aba === 'nao_conform' && (
        <div className="space-y-3">
          <div className="erp-card overflow-x-auto">
            <div className="px-4 py-2.5 bg-muted/20 border-b border-border flex items-center justify-between">
              <p className="text-xs font-semibold">Registro de Não Conformidades</p>
              <button type="button" onClick={() => toast.info('Nova NC registrada!')} className="erp-btn text-xs flex items-center gap-1.5"><Plus size={12} />Nova NC</button>
            </div>
            <table className="erp-table w-full min-w-[900px]">
              <thead><tr><th>Código</th><th>Data</th><th>Produto</th><th>Defeito</th><th>Tipo</th><th>Gravidade</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {NCS.map((nc) => (
                  <tr key={nc.id} className="cursor-pointer" onClick={() => setNcSel(nc.id === ncSel ? null : nc.id)}>
                    <td className="font-mono font-bold text-primary text-xs">{nc.id}</td>
                    <td>{nc.data}</td>
                    <td className="font-medium">{nc.produto}</td>
                    <td className="max-w-[180px] truncate text-xs">{nc.defeito}</td>
                    <td><span className="erp-badge erp-badge-info">{nc.tipo}</span></td>
                    <td><span className={`erp-badge ${nc.gravidade === 'maior' ? 'erp-badge-danger' : 'erp-badge-warning'}`}>{nc.gravidade}</span></td>
                    <td><span className={`erp-badge ${nc.status === 'encerrada' ? 'erp-badge-success' : 'erp-badge-warning'}`}>{nc.status === 'encerrada' ? 'Encerrada' : 'Em Análise'}</span></td>
                    <td><button type="button" className="erp-btn-ghost text-xs p-1"><Eye size={12} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detalhe NC */}
          {ncSel && (() => {
            const nc = NCS.find((n) => n.id === ncSel);
            if (!nc) return null;
            return (
              <div className="erp-card p-5 border-2 border-red-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-sm text-red-700">{nc.id} — Análise de Causa Raiz</p>
                    <p className="text-xs text-muted-foreground">{nc.produto} · {nc.defeito}</p>
                  </div>
                  <span className={`erp-badge ${nc.status === 'encerrada' ? 'erp-badge-success' : 'erp-badge-warning'}`}>{nc.status === 'encerrada' ? 'Encerrada' : 'Em Análise'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { titulo: 'Defeito Identificado', conteudo: nc.defeito, cor: 'border-red-200 bg-red-50' },
                    { titulo: 'Causa Raiz (Ishikawa)', conteudo: nc.causa, cor: 'border-yellow-200 bg-yellow-50' },
                    { titulo: 'Ação de Melhoria', conteudo: nc.acao, cor: 'border-green-200 bg-green-50' },
                  ].map((s) => (
                    <div key={s.titulo} className={`rounded-lg border-2 p-3 ${s.cor}`}>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">{s.titulo}</p>
                      <p className="text-xs">{s.conteudo}</p>
                    </div>
                  ))}
                </div>
                {nc.status === 'em_analise' && (
                  <div className="mt-3 flex gap-2">
                    <input className="erp-input flex-1 text-xs" placeholder="Registrar ação de melhoria..." />
                    <button type="button" onClick={() => { toast.success('Ação registrada e NC encerrada!'); setNcSel(null); }} className="erp-btn text-xs flex items-center gap-1"><CheckCircle size={11} />Encerrar NC</button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── instrumentos ─────────────────────────────────────────────────── */}
      {aba === 'instrumentos' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Gestão de calibração dos instrumentos de medição utilizados nas inspeções.</p>
            <button type="button" onClick={() => toast.info('Novo instrumento cadastrado!')} className="erp-btn text-xs flex items-center gap-1.5"><Plus size={12} />Novo Instrumento</button>
          </div>
          {instrumentos.filter((i) => i.status !== 'ok').length > 0 && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 flex items-center gap-2 text-xs text-yellow-800">
              <AlertTriangle size={14} className="shrink-0" />
              <span><strong>{instrumentos.filter((i) => i.status !== 'ok').length} instrumentos</strong> com calibração vencida ou vencendo. Realize ou agende a calibração.</span>
            </div>
          )}
          <div className="erp-card overflow-x-auto">
            <table className="erp-table w-full min-w-[700px]">
              <thead><tr><th>Código</th><th>Instrumento</th><th>Marca / Série</th><th>Última Calibração</th><th>Próxima Calibração</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {instrumentos.map((inst) => (
                  <tr key={inst.id} className={inst.status === 'vencido' ? 'bg-red-50' : inst.status === 'vencendo' ? 'bg-yellow-50' : ''}>
                    <td className="font-mono font-bold text-xs text-primary">{inst.codigo}</td>
                    <td className="font-medium">{inst.nome}</td>
                    <td className="text-muted-foreground text-xs">{inst.marca} · {inst.serie}</td>
                    <td>{inst.calibracao}</td>
                    <td className={inst.status !== 'ok' ? 'font-bold text-red-600' : ''}>{inst.proxima}</td>
                    <td>
                      <span className={`erp-badge ${inst.status === 'ok' ? 'erp-badge-success' : inst.status === 'vencendo' ? 'erp-badge-warning' : 'erp-badge-danger'}`}>
                        {inst.status === 'ok' ? 'Calibrado' : inst.status === 'vencendo' ? 'Vencendo' : 'Vencido'}
                      </span>
                    </td>
                    <td><button type="button" onClick={() => toast.success('Calibração renovada!')} className="erp-btn-ghost text-xs">Renovar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── INDICADORES ───────────────────────────────────────────────────── */}
      {aba === 'indicadores' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Taxa de Aprovação (Abr)', val: `${(28/30*100).toFixed(1)}%`, meta: '95%', ok: true },
              { label: 'NCs abertas (Abr)',        val: '1',   meta: '0',    ok: false },
              { label: 'PPM (Abr)',                val: '1100',meta: '≤800', ok: false },
              { label: 'instrumentos calibrados',  val: `${instrumentos.filter((i) => i.status === 'ok').length}/${instrumentos.length}`, meta: '100%', ok: false },
            ].map((k) => (
              <div key={k.label} className={`erp-card p-3 border-l-4 ${k.ok ? 'border-l-green-500' : 'border-l-red-400'}`}>
                <p className="text-[10px] text-muted-foreground">{k.label}</p>
                <p className={`text-xl font-bold ${k.ok ? 'text-green-700' : 'text-red-600'}`}>{k.val}</p>
                <p className="text-[10px] text-muted-foreground">Meta: {k.meta}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="erp-card p-4" style={{ height: 220 }}>
              <p className="text-xs font-semibold mb-2">Taxa de Aprovação por Mês (%)</p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={INDICADORES_MENSAL.map((m) => ({ ...m, tx: Number((m.aprovadas/m.inspecoes*100).toFixed(1)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                  <YAxis domain={[85, 100]} tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line dataKey="tx" name="Taxa Aprovação" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                  <Line dataKey={() => 95} name="Meta 95%" stroke="#10b981" strokeDasharray="5 4" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="erp-card overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/20 border-b border-border text-xs font-semibold">Qualificação de Fornecedores — Inspeção de Recebimento</div>
              <table className="erp-table w-full">
                <thead><tr><th>Fornecedor</th><th className="text-right">Inspeções</th><th className="text-right">Aprovadas</th><th className="text-right">Índice</th><th>Classe</th></tr></thead>
                <tbody>
                  {[
                    { fornecedor: 'AcerMetal Ltda',      insp: 12, aprov: 12 },
                    { fornecedor: 'TuboInox Brasil',     insp: 8,  aprov: 7  },
                    { fornecedor: 'Componentes SA',      insp: 6,  aprov: 6  },
                    { fornecedor: 'Válvulas Premium',    insp: 4,  aprov: 3  },
                  ].map((f) => {
                    const idx = (f.aprov / f.insp * 100).toFixed(0);
                    const classe = Number(idx) >= 95 ? { label: 'A — Qualificado', cor: 'erp-badge-success' } : Number(idx) >= 80 ? { label: 'B — Atenção', cor: 'erp-badge-warning' } : { label: 'C — Crítico', cor: 'erp-badge-danger' };
                    return (
                      <tr key={f.fornecedor}>
                        <td className="font-medium text-xs">{f.fornecedor}</td>
                        <td className="text-right">{f.insp}</td>
                        <td className="text-right">{f.aprov}</td>
                        <td className="text-right font-bold">{idx}%</td>
                        <td><span className={`erp-badge ${classe.cor}`}>{classe.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Inspeção */}
      {showNovaInsp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <p className="font-semibold flex items-center gap-2"><ClipboardCheck size={15} />Nova Inspeção</p>
              <button type="button" onClick={() => setShowNovaInsp(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="erp-label">Tipo de Inspeção</label>
                  <select className="erp-input w-full"><option>Produto Fabricado</option><option>Recebimento de MP</option><option>Processo Produtivo</option></select>
                </div>
                <div><label className="erp-label">Referência (OP / NF-e)</label><input className="erp-input w-full" placeholder="OP-2026-..." /></div>
                <div><label className="erp-label">Plano de Inspeção</label>
                  <select className="erp-input w-full">{planos.map((p) => <option key={p.id}>{p.codigo} — {p.produto}</option>)}</select>
                </div>
                <div><label className="erp-label">Inspetor Responsável</label><input className="erp-input w-full" defaultValue="Paulo Qualidade" /></div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowNovaInsp(false)} className="erp-btn-ghost flex-1">Cancelar</button>
                <button type="button" onClick={() => { toast.success('Inspeção iniciada!'); setShowNovaInsp(false); }} className="erp-btn flex-1">Iniciar Inspeção</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Certificado */}
      {showCertificado && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <p className="font-semibold flex items-center gap-2"><FileText size={15} />Certificado de Inspeção</p>
              <button type="button" onClick={() => setShowCertificado(false)} className="text-muted-foreground">✕</button>
            </div>
            <div className="p-6 space-y-3">
              <div className="border-2 border-primary/20 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b pb-2"><span className="font-bold text-base text-primary">CERTIFICADO DE INSPEÇÃO</span><span className="text-muted-foreground">INS-2026-0312</span></div>
                <div><strong>Produto:</strong> Tanque Inox 316L 500L — TANK-500L</div>
                <div><strong>Ordem de Produção:</strong> OP-2026-0451</div>
                <div><strong>Data de Inspeção:</strong> 30/04/2026</div>
                <div><strong>Inspetor:</strong> Paulo Qualidade</div>
                <div className="pt-1 text-green-700 font-bold flex items-center gap-1"><CheckCircle size={13} />Produto APROVADO — Todas as características dentro das especificações</div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { toast.success('Certificado gerado!'); setShowCertificado(false); }} className="erp-btn flex-1 text-xs flex items-center justify-center gap-1"><Download size={12} />Baixar PDF</button>
                <button type="button" onClick={() => { toast.success('Certificado enviado por e-mail!'); setShowCertificado(false); }} className="erp-btn-ghost flex-1 text-xs flex items-center justify-center gap-1"><Mail size={12} />Enviar por E-mail</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
