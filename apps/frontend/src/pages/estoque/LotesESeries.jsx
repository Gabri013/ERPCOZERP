import { useState, useMemo } from 'react';
import { Search, ChevronRight, Package, Truck, Factory, ShoppingCart, ArrowRight, Filter } from 'lucide-react';
import { toast } from 'sonner';

const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';
const hoje = new Date().toISOString().split('T')[0];
const addDias = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };

const TIPO_ICONE = {
  'Compra':     <Truck size={13} className="text-blue-500" />,
  'Produção':   <Factory size={13} className="text-orange-500" />,
  'Venda':      <ShoppingCart size={13} className="text-green-500" />,
  'Requisição': <Package size={13} className="text-purple-500" />,
  'Transferência': <ArrowRight size={13} className="text-teal-500" />,
};

const MOCK_LOTES = [
  {
    id: 1, lote: 'LT-2025-0042', produto_codigo: 'MP-CHAPA-316L-3MM', produto: 'Chapa Inox 316L 3mm',
    qtd_entrada: 500, qtd_saldo: 234.5, unidade: 'kg', data_entrada: addDias(hoje, -20),
    fornecedor: 'Outokumpu Oy', nfe_entrada: 'NF-001234',
    data_validade: null, lote_fabricante: 'OTK-Q42-2025', tipo: 'Matéria Prima',
    rastreabilidade: [
      { data: addDias(hoje, -20), tipo: 'Compra',     doc: 'NF-001234',   descricao: 'Entrada por NF-e de compra', qtd: +500,   saldo: 500 },
      { data: addDias(hoje, -15), tipo: 'Requisição', doc: 'REQ-018',     descricao: 'Requisição para OP-2025-001', qtd: -120.3, saldo: 379.7 },
      { data: addDias(hoje, -10), tipo: 'Requisição', doc: 'REQ-022',     descricao: 'Requisição para OP-2025-003', qtd: -85,    saldo: 294.7 },
      { data: addDias(hoje, -5),  tipo: 'Transferência', doc: 'TRF-008',  descricao: 'Transferência Almox → Produção', qtd: -60.2, saldo: 234.5 },
    ],
    consumidoEm: [
      { op: 'OP-2025-001', produto_fab: 'Tanque Inox 316L 500L', qtd: 120.3, data: addDias(hoje, -15) },
      { op: 'OP-2025-003', produto_fab: 'Reator 200L',           qtd: 85,    data: addDias(hoje, -10) },
    ],
  },
  {
    id: 2, lote: 'LT-2025-0051', produto_codigo: 'TANK-500L', produto: 'Tanque Inox 316L 500L',
    qtd_entrada: 2, qtd_saldo: 1, unidade: 'pc', data_entrada: addDias(hoje, -3),
    fornecedor: null, op_origem: 'OP-2025-001', nfe_entrada: null,
    data_validade: null, lote_fabricante: null, tipo: 'Produto Acabado',
    rastreabilidade: [
      { data: addDias(hoje, -3), tipo: 'Produção', doc: 'OP-2025-001', descricao: 'Entrada por reporte de produção',   qtd: +2, saldo: 2 },
      { data: addDias(hoje, -1), tipo: 'Venda',    doc: 'NF-003045',   descricao: 'Saída por NF-e de venda PV-2025-018', qtd: -1, saldo: 1 },
    ],
    consumidoEm: [],
    faturadoPara: [
      { cliente: 'Indústria Química Beta', nfe: 'NF-003045', data: addDias(hoje, -1), qtd: 1 },
    ],
  },
  {
    id: 3, lote: 'LT-2025-0039', produto_codigo: 'MP-TUBO-1.5', produto: 'Tubo Inox 1.5" SCH10',
    qtd_entrada: 200, qtd_saldo: 0, unidade: 'm', data_entrada: addDias(hoje, -30),
    fornecedor: 'Salzgitter Mannesmann', nfe_entrada: 'NF-000892',
    data_validade: null, lote_fabricante: 'SM-2025-03', tipo: 'Matéria Prima',
    rastreabilidade: [
      { data: addDias(hoje, -30), tipo: 'Compra',     doc: 'NF-000892', descricao: 'Entrada por NF-e de compra', qtd: +200,  saldo: 200 },
      { data: addDias(hoje, -25), tipo: 'Requisição', doc: 'REQ-010',   descricao: 'Requisição OP-2025-002',     qtd: -95,   saldo: 105 },
      { data: addDias(hoje, -18), tipo: 'Requisição', doc: 'REQ-015',   descricao: 'Requisição OP-2025-004',     qtd: -105,  saldo: 0 },
    ],
    consumidoEm: [
      { op: 'OP-2025-002', produto_fab: 'Trocador Tubular 100m²', qtd: 95,  data: addDias(hoje, -25) },
      { op: 'OP-2025-004', produto_fab: 'Condensador 50m²',       qtd: 105, data: addDias(hoje, -18) },
    ],
  },
];

const SERIES = [
  { id: 1, serie: 'SN-2025-0001', produto: 'Motor WEG 7,5CV', produto_codigo: 'CP-MOTOR-7CV', data_entrada: addDias(hoje, -45), origem: 'Compra', doc_entrada: 'NF-000521', status: 'Em Estoque' },
  { id: 2, serie: 'SN-2025-0002', produto: 'Motor WEG 7,5CV', produto_codigo: 'CP-MOTOR-7CV', data_entrada: addDias(hoje, -45), origem: 'Compra', doc_entrada: 'NF-000521', status: 'Faturado', doc_saida: 'NF-002988', cliente: 'Laticínios Serra Verde' },
];

export default function LotesESeries() {
  const [aba, setAba] = useState('lotes');
  const [busca, setBusca] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('Todos');
  const [loteSel, setLoteSel] = useState(null);

  const lotesFiltrados = useMemo(() => {
    let d = MOCK_LOTES;
    if (tipoFiltro !== 'Todos') d = d.filter((l) => l.tipo === tipoFiltro);
    if (busca) { const q = busca.toLowerCase(); d = d.filter((l) => l.lote.toLowerCase().includes(q) || l.produto_codigo.toLowerCase().includes(q) || l.produto.toLowerCase().includes(q) || l.fornecedor?.toLowerCase().includes(q)); }
    return d;
  }, [busca, tipoFiltro]);

  const kpis = {
    lotes_ativos: MOCK_LOTES.filter((l) => l.qtd_saldo > 0).length,
    lotes_esgotados: MOCK_LOTES.filter((l) => l.qtd_saldo === 0).length,
    series_estoque: SERIES.filter((s) => s.status === 'Em Estoque').length,
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Rastreabilidade — Lote e Série</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Trace a origem e destino de cada lote e número de série no estoque</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">Lotes com saldo</p><p className="text-lg font-bold text-green-600">{kpis.lotes_ativos}</p></div>
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">Lotes esgotados</p><p className="text-lg font-bold text-muted-foreground">{kpis.lotes_esgotados}</p></div>
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">Séries em estoque</p><p className="text-lg font-bold text-primary">{kpis.series_estoque}</p></div>
      </div>

      {/* Abas */}
      <div className="border-b border-border flex gap-0">
        {[{ id: 'lotes', label: 'Controle de Lotes' }, { id: 'series', label: 'Controle de Séries' }].map((a) => (
          <button key={a.id} type="button" onClick={() => setAba(a.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${aba === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ABA LOTES */}
      {aba === 'lotes' && (
        <div className="flex gap-3 h-[calc(100vh-16rem)]">
          {/* Lista de lotes */}
          <div className="w-72 shrink-0 flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input className="erp-input pl-6 text-xs w-full" placeholder="Lote, produto..." value={busca} onChange={(e) => setBusca(e.target.value)} />
              </div>
              <select className="erp-input text-xs" value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
                <option>Todos</option><option>Matéria Prima</option><option>Produto Acabado</option>
              </select>
            </div>
            <div className="overflow-y-auto flex-1 space-y-1 pr-1">
              {lotesFiltrados.map((l) => (
                <button key={l.id} type="button" onClick={() => setLoteSel(l)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-colors ${loteSel?.id === l.id ? 'bg-primary/10 border-primary' : 'bg-white border-border hover:bg-muted/30'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-primary">{l.lote}</span>
                    <span className={`text-[10px] px-1 rounded ${l.qtd_saldo > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>{l.qtd_saldo > 0 ? `${l.qtd_saldo} ${l.unidade}` : 'Esgotado'}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{l.produto}</p>
                  <p className="text-[10px] text-muted-foreground">{fmtD(l.data_entrada)} · {l.tipo}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Detalhe do lote */}
          <div className="flex-1 overflow-y-auto">
            {!loteSel ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">Selecione um lote para ver a rastreabilidade</div>
            ) : (
              <div className="space-y-3">
                {/* Header */}
                <div className="erp-card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-base font-bold font-mono text-primary">{loteSel.lote}</h2>
                      <p className="font-medium">{loteSel.produto}</p>
                      <p className="text-xs text-muted-foreground">{loteSel.produto_codigo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{loteSel.qtd_saldo} {loteSel.unidade}</p>
                      <p className="text-[10px] text-muted-foreground">Saldo atual</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-xs">
                    {[
                      { label: 'Data Entrada', value: fmtD(loteSel.data_entrada) },
                      { label: 'Tipo', value: loteSel.tipo },
                      { label: 'Qtd. Entrada', value: `${loteSel.qtd_entrada} ${loteSel.unidade}` },
                      { label: 'Fornecedor', value: loteSel.fornecedor || loteSel.op_origem || '—' },
                      { label: 'NF-e Entrada', value: loteSel.nfe_entrada || '—' },
                      { label: 'Lote Fabricante', value: loteSel.lote_fabricante || '—' },
                    ].map((f) => (
                      <div key={f.label}><span className="text-muted-foreground">{f.label}</span><p className="font-medium">{f.value}</p></div>
                    ))}
                  </div>
                </div>

                {/* Linha do tempo de rastreabilidade */}
                <div className="erp-card p-4">
                  <h3 className="text-sm font-semibold mb-3">Rastreabilidade Completa</h3>
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="space-y-3">
                      {loteSel.rastreabilidade.map((r, i) => {
                        const icone = TIPO_ICONE[r.tipo];
                        return (
                          <div key={i} className="flex items-start gap-3 relative">
                            <div className="w-10 h-10 rounded-full bg-white border-2 border-border flex items-center justify-center shrink-0 relative z-10">{icone}</div>
                            <div className="flex-1 bg-muted/20 rounded-lg p-2.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{r.descricao}</span>
                                <span className="text-muted-foreground">{fmtD(r.data)}</span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                                <span className="font-mono">{r.doc}</span>
                                <span className={r.qtd > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{r.qtd > 0 ? '+' : ''}{r.qtd}</span>
                                <span>Saldo: <strong>{r.saldo}</strong></span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Consumido em */}
                {loteSel.consumidoEm?.length > 0 && (
                  <div className="erp-card p-4">
                    <h3 className="text-sm font-semibold mb-2">Consumido nas Ordens de Produção</h3>
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted"><th className="p-2 text-left">OP</th><th className="p-2 text-left">Produto Fabricado</th><th className="p-2 text-right">Qtd</th><th className="p-2">Data</th></tr></thead>
                      <tbody>{loteSel.consumidoEm.map((c, i) => (
                        <tr key={i} className="border-b border-border/30"><td className="p-2 font-mono font-semibold text-primary">{c.op}</td><td className="p-2">{c.produto_fab}</td><td className="p-2 text-right">{c.qtd}</td><td className="p-2 text-center">{fmtD(c.data)}</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
                {loteSel.faturadoPara?.length > 0 && (
                  <div className="erp-card p-4">
                    <h3 className="text-sm font-semibold mb-2">Faturado Para</h3>
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted"><th className="p-2 text-left">Cliente</th><th className="p-2">NF-e</th><th className="p-2 text-right">Qtd</th><th className="p-2">Data</th></tr></thead>
                      <tbody>{loteSel.faturadoPara.map((f, i) => (
                        <tr key={i} className="border-b border-border/30"><td className="p-2 font-medium">{f.cliente}</td><td className="p-2 font-mono">{f.nfe}</td><td className="p-2 text-right">{f.qtd}</td><td className="p-2 text-center">{fmtD(f.data)}</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA SÉRIES */}
      {aba === 'series' && (
        <div className="erp-card overflow-x-auto">
          <div className="px-4 py-2 bg-muted/20 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold">Números de Série Cadastrados</span>
            <button type="button" onClick={() => toast.info('Novo número de série')} className="erp-btn-primary text-xs">+ Nº Série</button>
          </div>
          <table className="erp-table w-full min-w-[700px]">
            <thead><tr><th>Nº Série</th><th>Produto</th><th>Código</th><th>Data Entrada</th><th>Origem</th><th>Doc. Entrada</th><th>Status</th><th>Saída/Cliente</th></tr></thead>
            <tbody>
              {SERIES.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono font-semibold text-primary">{s.serie}</td>
                  <td>{s.produto}</td>
                  <td className="font-mono text-xs">{s.produto_codigo}</td>
                  <td>{fmtD(s.data_entrada)}</td>
                  <td>{s.origem}</td>
                  <td className="font-mono">{s.doc_entrada}</td>
                  <td><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${s.status === 'Em Estoque' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s.status}</span></td>
                  <td className="text-muted-foreground text-xs">{s.doc_saida ? `${s.doc_saida} — ${s.cliente}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
