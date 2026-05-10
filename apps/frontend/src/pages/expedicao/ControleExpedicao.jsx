import { useState, useRef, useEffect, useCallback } from 'react';
import { listExpeditionOrders, listManifests } from '@/services/expeditionApi.js';
import {
  Truck, Package, Plus, Download, Printer, Mail, CheckCircle,
  AlertTriangle, QrCode, Barcode, Layers, ClipboardList,
  X, Tag, Smartphone, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Pedidos prontos para expedir ───────────────────────────────────────────
const pedidos = [
  { id: 'PV-2026-0089', cliente: 'Pharma Brasil Ltda', produto: 'TANK-500L × 2 un.',  prazo: '2026-05-05', peso_total: 1240, volumes: 2, status: 'aguardando_separacao', nfe: null },
  { id: 'PV-2026-0087', cliente: 'Alimentos SA',       produto: 'AGIT-100L × 3 un.',  prazo: '2026-05-03', peso_total: 630,  volumes: 3, status: 'separacao_ok',        nfe: '000324' },
  { id: 'PV-2026-0082', cliente: 'Cosméticos Norte',   produto: 'REATOR-200L × 1 un.',prazo: '2026-04-30', peso_total: 520,  volumes: 1, status: 'conferido',           nfe: '000321' },
  { id: 'PV-2026-0078', cliente: 'Biotech Solutions',  produto: 'MISTURADOR × 2 un.', prazo: '2026-04-28', peso_total: 480,  volumes: 2, status: 'expedido',            nfe: '000318', rastreio: 'NX-2026-0041' },
];

// ─── cargas / Pallets ────────────────────────────────────────────────────────
const cargas = [
  { id: 'CRG-2026-0041', tipo: 'Pallet', pedido: 'PV-2026-0087', cliente: 'Alimentos SA',     peso: 630, volumes: 3, status: 'formado',   etiqueta: 'EQ-CARGA-0041' },
  { id: 'CRG-2026-0040', tipo: 'Pallet', pedido: 'PV-2026-0082', cliente: 'Cosméticos Norte', peso: 520, volumes: 1, status: 'expedido',  etiqueta: 'EQ-CARGA-0040' },
  { id: 'CRG-2026-0038', tipo: 'Caixa',  pedido: 'PV-2026-0078', cliente: 'Biotech Solutions',peso: 240, volumes: 1, status: 'expedido',  etiqueta: 'EQ-CARGA-0038' },
];

// ─── romaneios ────────────────────────────────────────────────────────────────
const romaneios = [
  {
    id: 'ROM-2026-0089', pedido: 'PV-2026-0087', cliente: 'Alimentos SA',
    data: '2026-05-02', transportadora: 'Transportes Brasil Ltda',
    nfe: '000324', peso_total: 630, volumes: 3,
    itens: [
      { codigo: 'AGIT-100L', descricao: 'Agitador Inox 100L', qtd: 3, peso_unit: 210, etiqueta: 'EQ-2026-1841' },
    ],
    status: 'emitido',
  },
  {
    id: 'ROM-2026-0087', pedido: 'PV-2026-0082', cliente: 'Cosméticos Norte',
    data: '2026-04-30', transportadora: 'Expresso Rápido',
    nfe: '000321', peso_total: 520, volumes: 1,
    itens: [
      { codigo: 'REATOR-200L', descricao: 'Reator Inox 316L 200L', qtd: 1, peso_unit: 520, etiqueta: 'EQ-2026-1835' },
    ],
    status: 'expedido',
  },
];

// ─── Etiquetas de produto ────────────────────────────────────────────────────
const ETIQUETAS_PRODUTO = [
  { codigo: 'EQ-2026-1845', produto: 'TANK-500L',   descricao: 'Tanque Inox 316L 500L', op: 'OP-2026-0451', lote: 'LT-2026-0041', data: '2026-04-30', status: 'aguardando' },
  { codigo: 'EQ-2026-1846', produto: 'TANK-500L',   descricao: 'Tanque Inox 316L 500L', op: 'OP-2026-0452', lote: 'LT-2026-0042', data: '2026-04-30', status: 'aguardando' },
  { codigo: 'EQ-2026-1841', produto: 'AGIT-100L',   descricao: 'Agitador Inox 100L',    op: 'OP-2026-0440', lote: 'LT-2026-0038', data: '2026-04-25', status: 'expedido'   },
  { codigo: 'EQ-2026-1835', produto: 'REATOR-200L', descricao: 'Reator Inox 316L 200L', op: 'OP-2026-0448', lote: 'LT-2026-0035', data: '2026-04-29', status: 'expedido'   },
];

const STATUS_PED = {
  aguardando_separacao: { label: 'Aguardando Sep.',  cls: 'erp-badge-warning' },
  separacao_ok:         { label: 'Separado',          cls: 'erp-badge-info'    },
  conferido:            { label: 'Conferido',         cls: 'erp-badge-success' },
  expedido:             { label: 'Expedido',          cls: 'erp-badge-default' },
};

const PRODUCAO_SEMANA = [
  { dia: 'Seg', separados: 4, conferidos: 3, expedidos: 3 },
  { dia: 'Ter', separados: 6, conferidos: 5, expedidos: 5 },
  { dia: 'Qua', separados: 3, conferidos: 3, expedidos: 2 },
  { dia: 'Qui', separados: 5, conferidos: 4, expedidos: 4 },
  { dia: 'Sex', separados: 7, conferidos: 6, expedidos: 6 },
];

export default function ControleExpedicao() {
  const [aba, setAba] = useState('painel');
  const [pedidos, setPedidos] = useState([]);
  const [cargas, setCargas] = useState([]);
  const [romaneios, setRomaneios] = useState([]);
  const [pedidoSel, setPedidoSel] = useState(null);
  const [romaneioSel, setRomaneioSel] = useState(null);
  const [showFormCarga, setShowFormCarga] = useState(false);
  const [showNovoRom, setShowNovoRom] = useState(false);
  const [leituraBarras, setLeituraBarras] = useState('');
  const [itensLidos, setItensLidos] = useState([]);

  const loadExpedicao = useCallback(async () => {
    try {
      const [orders, manifests] = await Promise.all([listExpeditionOrders(), listManifests()]);
      if (orders && orders.length > 0) {
        setPedidos(orders.map((o) => ({
          id: o.code,
          _id: o.id,
          cliente: o.clientName,
          produto: Array.isArray(o.items) ? o.items.map((i) => i.desc || i.code).join(', ') : '',
          prazo: o.scheduledAt ? o.scheduledAt.slice(0, 10) : '',
          peso_total: 0,
          volumes: (o.loads || []).length,
          status: o.status,
          nfe: null,
        })));
        setCargas(orders.flatMap((o) => (o.loads || []).map((l) => ({
          id: l.code,
          _id: l.id,
          tipo: l.loadType,
          pedido: o.code,
          cliente: o.clientName,
          peso: Number(l.weight || 0),
          volumes: 1,
          status: o.status,
          etiqueta: l.code,
        }))));
      }
      if (manifests && manifests.length > 0) {
        setRomaneios(manifests.map((m) => ({
          id: m.code,
          _id: m.id,
          pedido: '',
          cliente: '',
          data: m.createdAt?.slice(0, 10) || '',
          transportadora: m.carrier || '',
          nfe: m.nfeRef || '',
          peso_total: 0,
          volumes: 0,
          itens: [],
          status: m.status,
        })));
      }
    } catch {
      // keep mock on error
    }
  }, []);

  useEffect(() => { loadExpedicao(); }, [loadExpedicao]);
  const [showEtiqueta, setShowEtiqueta] = useState(null);
  const inputLeituraRef = useRef(null);

  const totalAguardando = pedidos.filter((p) => p.status === 'aguardando_separacao').length;
  const totalSeparados = pedidos.filter((p) => p.status === 'separacao_ok').length;
  const totalConferidos = pedidos.filter((p) => p.status === 'conferido').length;
  const totalExpedidos = pedidos.filter((p) => p.status === 'expedido').length;

  const handleLeituraBarras = (e) => {
    if (e.key === 'Enter' && leituraBarras.trim()) {
      const etiqueta = ETIQUETAS_PRODUTO.find((et) => et.codigo === leituraBarras.trim());
      if (etiqueta) {
        setItensLidos((prev) => [...prev.filter((i) => i.codigo !== etiqueta.codigo), etiqueta]);
        toast.success(`Produto lido: ${etiqueta.produto} — ${etiqueta.codigo}`);
      } else {
        toast.error(`Código não encontrado: ${leituraBarras}`);
      }
      setLeituraBarras('');
    }
  };

  const ABAS = [
    { id: 'painel',    label: 'Painel' },
    { id: 'separacao', label: 'Separação / Conferência' },
    { id: 'cargas',    label: 'cargas e Pallets' },
    { id: 'romaneios', label: 'romaneios' },
    { id: 'etiquetas', label: 'Etiquetas' },
    { id: 'mobile',    label: 'App Mobile' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Truck size={20} className="text-primary" />Controle da Expedição</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Separação, conferência e expedição com leitura de código de barras</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowNovoRom(true)} className="erp-btn text-xs flex items-center gap-1.5"><Plus size={13} />Novo Romaneio</button>
          <button type="button" onClick={() => setShowFormCarga(true)} className="erp-btn-ghost text-xs flex items-center gap-1.5"><Layers size={13} />Formar Carga</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Aguard. Separação', val: totalAguardando, cor: 'text-yellow-600', icon: <Clock size={14} className="text-yellow-500" /> },
          { label: 'Separados',         val: totalSeparados,  cor: 'text-blue-600',   icon: <Package size={14} className="text-blue-500" /> },
          { label: 'Conferidos',        val: totalConferidos, cor: 'text-green-700',  icon: <CheckCircle size={14} className="text-green-500" /> },
          { label: 'Expedidos Hoje',    val: totalExpedidos,  cor: 'text-muted-foreground', icon: <Truck size={14} className="text-muted-foreground" /> },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3 flex items-center gap-3">
            {k.icon}
            <div><p className="text-[10px] text-muted-foreground">{k.label}</p><p className={`font-bold text-xl ${k.cor}`}>{k.val}</p></div>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="erp-card p-4" style={{ height: 200 }}>
              <p className="text-xs font-semibold mb-2">Expedições por Dia — Semana Atual</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={PRODUCAO_SEMANA} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="dia" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="separados"  name="Separados"  fill="#f59e0b" radius={[2,2,0,0]} />
                  <Bar dataKey="conferidos" name="Conferidos" fill="#2563eb" radius={[2,2,0,0]} />
                  <Bar dataKey="expedidos"  name="Expedidos"  fill="#10b981" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="erp-card overflow-hidden">
              <div className="px-4 py-2.5 bg-yellow-50 border-b border-yellow-200 text-xs font-semibold text-yellow-700 flex items-center gap-1.5">
                <AlertTriangle size={12} />Pedidos Urgentes — Prazo Próximo
              </div>
              <div className="divide-y divide-border/30">
                {pedidos.filter((p) => p.status !== 'expedido').sort((a, b) => new Date(a.prazo) - new Date(b.prazo)).map((p) => {
                  const dias = Math.ceil((new Date(p.prazo) - new Date()) / 86400000);
                  return (
                    <div key={p.id} className={`flex items-center justify-between px-4 py-2.5 text-xs ${dias <= 2 ? 'bg-red-50/40' : ''}`}>
                      <div>
                        <span className="font-bold text-primary">{p.id}</span>
                        <span className="text-muted-foreground ml-2">{p.cliente}</span>
                        <div className="text-[10px] text-muted-foreground">{p.produto}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-semibold ${dias <= 1 ? 'text-red-600' : dias <= 3 ? 'text-yellow-600' : 'text-muted-foreground'}`}>{dias <= 0 ? 'ATRASADO' : `${dias}d`}</span>
                        <span className={`erp-badge ${STATUS_PED[p.status]?.cls}`}>{STATUS_PED[p.status]?.label}</span>
                        <button type="button" onClick={() => { setPedidoSel(p.id); setAba('separacao'); }} className="erp-btn text-xs py-0.5 px-2">Iniciar</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pipeline expedição */}
          <div className="erp-card p-4">
            <p className="text-xs font-semibold mb-3">Pipeline de Expedição</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { label: 'Aguardando Separação', items: pedidos.filter((p) => p.status === 'aguardando_separacao'), cor: 'border-yellow-300 bg-yellow-50' },
                { label: 'Separados',            items: pedidos.filter((p) => p.status === 'separacao_ok'),         cor: 'border-blue-300 bg-blue-50' },
                { label: 'Conferidos',           items: pedidos.filter((p) => p.status === 'conferido'),            cor: 'border-green-300 bg-green-50' },
                { label: 'Expedidos',            items: pedidos.filter((p) => p.status === 'expedido'),             cor: 'border-muted bg-muted/10' },
              ].map((col, i) => (
                <div key={i} className="flex-1 min-w-[160px]">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5 px-1">{col.label} ({col.items.length})</p>
                  <div className="space-y-1.5">
                    {col.items.map((p) => (
                      <div key={p.id} className={`rounded-lg border-2 p-2 text-xs cursor-pointer hover:shadow-sm transition-shadow ${col.cor}`} onClick={() => { setPedidoSel(p.id); setAba('separacao'); }}>
                        <p className="font-bold text-primary">{p.id}</p>
                        <p className="truncate">{p.cliente}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{p.produto}</p>
                      </div>
                    ))}
                    {col.items.length === 0 && <div className="rounded-lg border-2 border-dashed border-muted/50 p-3 text-center text-[10px] text-muted-foreground">Vazio</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SEPARAÇÃO / CONFERÊNCIA ──────────────────────────────────────── */}
      {aba === 'separacao' && (
        <div className="space-y-3">
          {/* Seleção de pedido */}
          {!pedidoSel ? (
            <div className="erp-card overflow-x-auto">
              <div className="px-4 py-2.5 bg-muted/20 border-b border-border text-xs font-semibold">Selecione um pedido para iniciar a separação / conferência</div>
              <table className="erp-table w-full">
                <thead><tr><th>Pedido</th><th>Cliente</th><th>Produto</th><th>Prazo</th><th>Volumes</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {pedidos.filter((p) => p.status !== 'expedido').map((p) => (
                    <tr key={p.id} className="cursor-pointer" onClick={() => setPedidoSel(p.id)}>
                      <td className="font-mono font-bold text-primary text-xs">{p.id}</td>
                      <td className="font-medium">{p.cliente}</td>
                      <td className="text-muted-foreground text-xs">{p.produto}</td>
                      <td>{p.prazo}</td>
                      <td>{p.volumes}</td>
                      <td><span className={`erp-badge ${STATUS_PED[p.status]?.cls}`}>{STATUS_PED[p.status]?.label}</span></td>
                      <td><button type="button" className="erp-btn text-xs">Abrir</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (() => {
            const ped = pedidos.find((p) => p.id === pedidoSel);
            if (!ped) return null;
            return (
              <div className="space-y-3">
                <div className="erp-card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold">{ped.id} — {ped.cliente}</p>
                    <p className="text-xs text-muted-foreground">{ped.produto} · Prazo: {ped.prazo} · {ped.volumes} volumes · {ped.peso_total} kg</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPedidoSel(null)} className="erp-btn-ghost text-xs">← Voltar</button>
                    <span className={`erp-badge ${STATUS_PED[ped.status]?.cls}`}>{STATUS_PED[ped.status]?.label}</span>
                  </div>
                </div>

                {/* Leitor de código de barras */}
                <div className="erp-card p-4 space-y-3">
                  <p className="text-xs font-semibold flex items-center gap-2"><QrCode size={14} className="text-primary" />Leitura de Código de Barras</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Barcode size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input ref={inputLeituraRef} className="erp-input pl-9 w-full font-mono" placeholder="Leia o código de barras ou digite manualmente..." value={leituraBarras} onChange={(e) => setLeituraBarras(e.target.value)} onKeyDown={handleLeituraBarras} autoFocus />
                    </div>
                    <button type="button" onClick={() => {
                      setLeituraBarras('EQ-2026-1845');
                      setTimeout(() => {
                        const et = ETIQUETAS_PRODUTO.find((e) => e.codigo === 'EQ-2026-1845');
                        if (et) { setItensLidos((prev) => [...prev.filter((i) => i.codigo !== et.codigo), et]); toast.success(`Produto lido: ${et.produto}`); setLeituraBarras(''); }
                      }, 300);
                    }} className="erp-btn-ghost text-xs flex items-center gap-1"><QrCode size={12} />Simular Leitura</button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Pressione Enter após cada leitura. O sistema verificará automaticamente se o produto pertence a este pedido.</p>
                </div>

                {/* Itens lidos */}
                <div className="erp-card overflow-hidden">
                  <div className="px-4 py-2.5 bg-muted/20 border-b border-border text-xs font-semibold flex items-center justify-between">
                    <span>Itens Conferidos ({itensLidos.length} / {ped.volumes})</span>
                    {itensLidos.length > 0 && <button type="button" onClick={() => setItensLidos([])} className="erp-btn-ghost text-xs text-red-500"><X size={11} />Limpar</button>}
                  </div>
                  {itensLidos.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">Nenhum item lido ainda. Inicie a leitura dos códigos de barras.</div>
                  ) : (
                    <table className="erp-table w-full">
                      <thead><tr><th>Etiqueta</th><th>Produto</th><th>OP</th><th>Lote</th><th>Data Fab.</th><th></th></tr></thead>
                      <tbody>
                        {itensLidos.map((item) => (
                          <tr key={item.codigo}>
                            <td className="font-mono font-bold text-primary text-xs">{item.codigo}</td>
                            <td className="font-medium">{item.produto}</td>
                            <td className="font-mono text-xs text-muted-foreground">{item.op}</td>
                            <td className="font-mono text-xs">{item.lote}</td>
                            <td>{item.data}</td>
                            <td><button type="button" onClick={() => setItensLidos((prev) => prev.filter((i) => i.codigo !== item.codigo))} className="erp-btn-ghost text-xs p-1 text-red-500"><X size={11} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => toast.info('Separação confirmada!')} className="erp-btn-ghost flex-1 text-xs">Confirmar Separação</button>
                  <button type="button" onClick={() => { toast.success('Conferência concluída! Romaneio pronto para emissão.'); setPedidoSel(null); }} className="erp-btn flex-1 text-xs flex items-center justify-center gap-1.5">
                    <CheckCircle size={13} />Concluir Conferência
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── cargas E PALLETS ─────────────────────────────────────────────── */}
      {aba === 'cargas' && (
        <div className="space-y-3">
          <div className="erp-card overflow-x-auto">
            <div className="px-4 py-2.5 bg-muted/20 border-b border-border text-xs font-semibold flex items-center justify-between">
              <span>cargas Formadas</span>
              <button type="button" onClick={() => setShowFormCarga(true)} className="erp-btn text-xs flex items-center gap-1.5"><Plus size={12} />Formar Nova Carga</button>
            </div>
            <table className="erp-table w-full">
              <thead><tr><th>Código</th><th>Tipo</th><th>Pedido</th><th>Cliente</th><th className="text-right">Peso (kg)</th><th className="text-right">Volumes</th><th>Etiqueta</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {cargas.map((carga) => (
                  <tr key={carga.id}>
                    <td className="font-mono font-bold text-primary text-xs">{carga.id}</td>
                    <td><span className="erp-badge erp-badge-info">{carga.tipo}</span></td>
                    <td className="font-mono text-xs">{carga.pedido}</td>
                    <td className="font-medium text-xs">{carga.cliente}</td>
                    <td className="text-right">{carga.peso}</td>
                    <td className="text-right">{carga.volumes}</td>
                    <td className="font-mono text-xs text-muted-foreground">{carga.etiqueta}</td>
                    <td><span className={`erp-badge ${carga.status === 'expedido' ? 'erp-badge-default' : 'erp-badge-success'}`}>{carga.status === 'expedido' ? 'Expedido' : 'Formado'}</span></td>
                    <td>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => { setShowEtiqueta(carga); }} title="Imprimir etiqueta de carga" className="erp-btn-ghost p-1 text-xs"><Tag size={12} /></button>
                        <button type="button" onClick={() => toast.success('Etiqueta impressa!')} title="Imprimir" className="erp-btn-ghost p-1 text-xs"><Printer size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── romaneios ────────────────────────────────────────────────────── */}
      {aba === 'romaneios' && (
        <div className="space-y-3">
          <div className="erp-card overflow-x-auto">
            <div className="px-4 py-2.5 bg-muted/20 border-b border-border text-xs font-semibold flex items-center justify-between">
              <span>romaneios de Expedição</span>
              <button type="button" onClick={() => setShowNovoRom(true)} className="erp-btn text-xs flex items-center gap-1.5"><Plus size={12} />Novo Romaneio</button>
            </div>
            <table className="erp-table w-full">
              <thead><tr><th>Código</th><th>Data</th><th>Pedido</th><th>Cliente</th><th>NF-e</th><th>Transportadora</th><th className="text-right">Peso (kg)</th><th className="text-right">Vol.</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {romaneios.map((rom) => (
                  <>
                    <tr key={rom.id} className="cursor-pointer" onClick={() => setRomaneioSel(romaneioSel === rom.id ? null : rom.id)}>
                      <td className="font-mono font-bold text-primary text-xs">{rom.id}</td>
                      <td>{rom.data}</td>
                      <td className="font-mono text-xs">{rom.pedido}</td>
                      <td className="font-medium text-xs">{rom.cliente}</td>
                      <td className="font-mono text-xs">{rom.nfe}</td>
                      <td className="text-muted-foreground text-xs">{rom.transportadora}</td>
                      <td className="text-right">{rom.peso_total}</td>
                      <td className="text-right">{rom.volumes}</td>
                      <td><span className={`erp-badge ${rom.status === 'expedido' ? 'erp-badge-default' : 'erp-badge-success'}`}>{rom.status === 'expedido' ? 'Expedido' : 'Emitido'}</span></td>
                      <td>
                        <div className="flex gap-1">
                          <button type="button" onClick={(e) => { e.stopPropagation(); toast.success('Romaneio PDF gerado!'); }} className="erp-btn-ghost p-1 text-xs"><Printer size={12} /></button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); toast.success('Romaneio enviado por e-mail!'); }} className="erp-btn-ghost p-1 text-xs"><Mail size={12} /></button>
                        </div>
                      </td>
                    </tr>
                    {romaneioSel === rom.id && (
                      <tr key={`${rom.id}-detail`}>
                        <td colSpan={10} className="p-0 bg-muted/5">
                          <div className="px-6 py-4 border-t border-border/30">
                            <p className="text-xs font-semibold mb-2">Itens do Romaneio</p>
                            <table className="w-full text-xs">
                              <thead className="bg-muted/20"><tr><th className="text-left px-3 py-1.5">Código</th><th className="text-left px-3 py-1.5">Produto</th><th className="text-right px-3 py-1.5">Qtd</th><th className="text-right px-3 py-1.5">Peso Unit.</th><th className="text-right px-3 py-1.5">Peso Total</th><th className="px-3 py-1.5">Etiqueta</th></tr></thead>
                              <tbody>
                                {rom.itens.map((item, i) => (
                                  <tr key={i} className="border-b border-border/20">
                                    <td className="px-3 py-1.5 font-mono font-bold text-primary">{item.codigo}</td>
                                    <td className="px-3 py-1.5 font-medium">{item.descricao}</td>
                                    <td className="px-3 py-1.5 text-right">{item.qtd}</td>
                                    <td className="px-3 py-1.5 text-right">{item.peso_unit} kg</td>
                                    <td className="px-3 py-1.5 text-right font-semibold">{item.qtd * item.peso_unit} kg</td>
                                    <td className="px-3 py-1.5 font-mono text-[10px] text-muted-foreground">{item.etiqueta}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
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

      {/* ── ETIQUETAS ────────────────────────────────────────────────────── */}
      {aba === 'etiquetas' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Etiquetas de identificação de produtos e cargas com código de barras.</p>
            <button type="button" onClick={() => toast.success('Etiquetas impressas!')} className="erp-btn text-xs flex items-center gap-1.5"><Printer size={12} />Imprimir Selecionadas</button>
          </div>
          <div className="erp-card overflow-x-auto">
            <table className="erp-table w-full">
              <thead><tr><th>Código Etiqueta</th><th>Produto</th><th>OP</th><th>Lote</th><th>Data Fab.</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {ETIQUETAS_PRODUTO.map((et) => (
                  <tr key={et.codigo}>
                    <td className="font-mono font-bold text-primary text-xs">{et.codigo}</td>
                    <td className="font-medium">{et.produto}</td>
                    <td className="font-mono text-xs text-muted-foreground">{et.op}</td>
                    <td className="font-mono text-xs">{et.lote}</td>
                    <td>{et.data}</td>
                    <td><span className={`erp-badge ${et.status === 'expedido' ? 'erp-badge-default' : 'erp-badge-warning'}`}>{et.status === 'expedido' ? 'Expedido' : 'Em estoque'}</span></td>
                    <td>
                      <button type="button" onClick={() => setShowEtiqueta({ ...et, tipo: 'produto' })} className="erp-btn text-xs flex items-center gap-1"><Printer size={11} />Imprimir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── APP MOBILE ───────────────────────────────────────────────────── */}
      {aba === 'mobile' && (
        <div className="space-y-3">
          <div className="erp-card p-6 text-center border-2 border-primary/20 max-w-md mx-auto">
            <Smartphone size={48} className="text-primary mx-auto mb-3" />
            <p className="font-bold text-base">ERPCOZERP Expedição App</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Acesse as funções de expedição diretamente do celular Android. Realize leituras de código de barras com a câmera do dispositivo.</p>
            <div className="grid grid-cols-2 gap-3 mb-4 text-left">
              {[
                { icon: <QrCode size={14} className="text-primary" />, label: 'Leitura de CB', desc: 'Câmera ou leitor bluetooth' },
                { icon: <ClipboardList size={14} className="text-primary" />, label: 'romaneios', desc: 'Emissão e consulta' },
                { icon: <Layers size={14} className="text-primary" />, label: 'Formação de cargas', desc: 'Pallets e caixas' },
                { icon: <CheckCircle size={14} className="text-primary" />, label: 'Conferência', desc: 'Check por pedido' },
              ].map((f) => (
                <div key={f.label} className="flex items-start gap-2 bg-muted/20 rounded-lg p-3">
                  {f.icon}
                  <div><p className="text-xs font-semibold">{f.label}</p><p className="text-[10px] text-muted-foreground">{f.desc}</p></div>
                </div>
              ))}
            </div>
            <div className="w-32 h-32 mx-auto bg-muted/30 rounded-lg flex items-center justify-center mb-3 border-2 border-dashed border-muted-foreground/30">
              <div className="text-center"><QrCode size={40} className="text-muted-foreground/50 mx-auto" /><p className="text-[10px] text-muted-foreground mt-1">QR Code download</p></div>
            </div>
            <button type="button" onClick={() => toast.info('Link de download enviado!')} className="erp-btn w-full text-xs flex items-center justify-center gap-2"><Download size={13} />Baixar APK / Enviar Link</button>
          </div>
        </div>
      )}

      {/* Modal Formar Carga */}
      {showFormCarga && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <p className="font-semibold flex items-center gap-2"><Layers size={15} />Formar Nova Carga</p>
              <button type="button" onClick={() => setShowFormCarga(false)} className="text-muted-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="erp-label">Tipo de Carga</label><select className="erp-input w-full"><option>Pallet</option><option>Caixa</option><option>Engradado</option><option>Volume Avulso</option></select></div>
                <div><label className="erp-label">Pedido de Venda</label><select className="erp-input w-full">{pedidos.map((p) => <option key={p.id}>{p.id} — {p.cliente}</option>)}</select></div>
                <div><label className="erp-label">Peso Total (kg)</label><input type="number" className="erp-input w-full" placeholder="0" /></div>
                <div><label className="erp-label">N° de Volumes</label><input type="number" className="erp-input w-full" defaultValue={1} /></div>
              </div>
              <div className="bg-muted/20 rounded-lg p-3 text-xs">
                <p className="font-semibold mb-1.5 flex items-center gap-1.5"><Barcode size={12} />Vincular Produtos (leitura de CB)</p>
                <input className="erp-input w-full font-mono text-xs" placeholder="Leia o código de barras do produto..." />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowFormCarga(false)} className="erp-btn-ghost flex-1">Cancelar</button>
                <button type="button" onClick={() => { toast.success('Carga formada! Etiqueta gerada.'); setShowFormCarga(false); }} className="erp-btn flex-1 flex items-center justify-center gap-1.5"><Tag size={12} />Formar e Gerar Etiqueta</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Romaneio */}
      {showNovoRom && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <p className="font-semibold flex items-center gap-2"><ClipboardList size={15} />Novo Romaneio de Expedição</p>
              <button type="button" onClick={() => setShowNovoRom(false)} className="text-muted-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="erp-label">Pedido de Venda</label><select className="erp-input w-full">{pedidos.map((p) => <option key={p.id}>{p.id}</option>)}</select></div>
                <div><label className="erp-label">NF-e Vinculada</label><input className="erp-input w-full" placeholder="000321" /></div>
                <div className="sm:col-span-2"><label className="erp-label">Transportadora</label><input className="erp-input w-full" placeholder="Nome da transportadora" /></div>
                <div><label className="erp-label">Data de Expedição</label><input type="date" className="erp-input w-full" defaultValue="2026-05-02" /></div>
                <div><label className="erp-label">Peso Total (kg)</label><input type="number" className="erp-input w-full" /></div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNovoRom(false)} className="erp-btn-ghost flex-1">Cancelar</button>
                <button type="button" onClick={() => { toast.success('Romaneio emitido!'); setShowNovoRom(false); }} className="erp-btn flex-1 flex items-center justify-center gap-1.5"><Printer size={12} />Emitir Romaneio</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Etiqueta */}
      {showEtiqueta && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <p className="font-semibold flex items-center gap-2"><Tag size={14} />Etiqueta de Identificação</p>
              <button type="button" onClick={() => setShowEtiqueta(null)} className="text-muted-foreground">✕</button>
            </div>
            <div className="p-5">
              <div className="border-2 border-gray-800 rounded-lg p-4 font-mono text-sm space-y-2 bg-white">
                <div className="text-center font-bold text-base border-b pb-2">INDÚSTRIA INOX LTDA</div>
                <div className="flex gap-3">
                  <div className="flex-1 text-xs space-y-0.5">
                    <div><strong>Cód:</strong> {showEtiqueta.codigo || showEtiqueta.etiqueta}</div>
                    <div><strong>Prod:</strong> {showEtiqueta.produto || showEtiqueta.cliente}</div>
                    {showEtiqueta.op && <div><strong>OP:</strong> {showEtiqueta.op}</div>}
                    {showEtiqueta.lote && <div><strong>Lote:</strong> {showEtiqueta.lote}</div>}
                    {showEtiqueta.peso && <div><strong>Peso:</strong> {showEtiqueta.peso} kg</div>}
                    {showEtiqueta.data && <div><strong>Data:</strong> {showEtiqueta.data}</div>}
                  </div>
                  <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center border border-gray-300 shrink-0">
                    <div className="text-center"><Barcode size={28} className="text-gray-400 mx-auto" /><p className="text-[8px] text-gray-400 mt-0.5">|||||||||||</p></div>
                  </div>
                </div>
                <div className="text-center text-[10px] tracking-widest border-t pt-1">{showEtiqueta.codigo || showEtiqueta.etiqueta}</div>
              </div>
              <div className="flex gap-2 mt-3">
                <button type="button" onClick={() => { toast.success('Etiqueta impressa!'); setShowEtiqueta(null); }} className="erp-btn flex-1 text-xs flex items-center justify-center gap-1.5"><Printer size={12} />Imprimir</button>
                <button type="button" onClick={() => setShowEtiqueta(null)} className="erp-btn-ghost flex-1 text-xs">Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
