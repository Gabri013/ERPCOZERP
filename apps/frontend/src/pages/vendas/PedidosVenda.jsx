import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ModalPedidoVenda from '@/components/vendas/ModalPedidoVenda';
import DetalheModal from '@/components/common/DetalheModal';
import {
  Plus, Download, Printer, AlertTriangle, Factory, DollarSign,
  FileText, CheckCircle, Clock, Truck, XCircle, ArrowRight,
} from 'lucide-react';
import { pedidosVendaServiceApi } from '@/services/pedidosVendaServiceApi';
import { exportPdfReport } from '@/services/pdfExport';
import { CONFIG } from '@/services/businessLogicApi';
import { cozincaApi } from '@/services/cozincaApi';
import { toast } from 'sonner';

const fmtR = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';

// ─── Workflow de status ────────────────────────────────────────────────────────
const STATUS_FLOW = [
  { id: 'Orçamento',              label: 'Orçamento',              color: 'bg-gray-100 text-gray-600',      icon: FileText },
  { id: 'Aguardando Aprovação',   label: 'Aguard. Aprovação',       color: 'bg-yellow-100 text-yellow-700',  icon: Clock },
  { id: 'Aprovado',               label: 'Aprovado',               color: 'bg-blue-100 text-blue-700',      icon: CheckCircle },
  { id: 'Em Produção',            label: 'Em Produção',            color: 'bg-orange-100 text-orange-700',  icon: Factory },
  { id: 'Faturado',               label: 'Faturado',               color: 'bg-purple-100 text-purple-700',  icon: DollarSign },
  { id: 'Entregue',               label: 'Entregue',               color: 'bg-green-100 text-green-700',    icon: Truck },
];

const STATUS_CANCELADO = { id: 'Cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle };
const ALL_STATUS = [...STATUS_FLOW, STATUS_CANCELADO];

function BadgeStatus({ status }) {
  const cfg = ALL_STATUS.find((s) => s.id === status) || { color: 'bg-gray-100 text-gray-600', icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${cfg.color}`}>
      <Icon size={10} /> {status || '—'}
    </span>
  );
}

// Barra de progresso do pedido
function ProgressoWorkflow({ status }) {
  const idx = STATUS_FLOW.findIndex((s) => s.id === status);
  if (status === 'Cancelado') return (
    <div className="flex items-center gap-2 text-xs text-red-600">
      <XCircle size={13} /> Pedido cancelado
    </div>
  );
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {STATUS_FLOW.map((s, i) => {
        const done = i < idx;
        const current = i === idx;
        return (
          <div key={s.id} className="flex items-center gap-1 shrink-0">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${
              current ? s.color + ' ring-1 ring-offset-1 ring-current/50' : done ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground/50'
            }`}>
              {done && <CheckCircle size={9} />}
              {s.label}
            </div>
            {i < STATUS_FLOW.length - 1 && <ArrowRight size={10} className="text-muted-foreground/30 shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

// Próximos status disponíveis para avanço
const PROXIMOS = {
  'Orçamento':             ['Aguardando Aprovação', 'Aprovado', 'Cancelado'],
  'Aguardando Aprovação':  ['Aprovado', 'Cancelado'],
  'Aprovado':              ['Em Produção', 'Cancelado'],
  'Em Produção':           ['Faturado'],
  'Faturado':              ['Entregue'],
  'Entregue':              [],
  'Cancelado':             [],
};

export default function PedidosVenda() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);

  const reload = async (opts = {}) => {
    setLoading(true);
    try {
      const rows = await pedidosVendaServiceApi.getAll({
        search: opts.search ?? search,
        status: opts.status ?? filters.status ?? '',
        vendedor: opts.vendedor ?? filters.vendedor ?? '',
      });
      setData(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const handleSave = async (form) => {
    if (editando?.id) {
      await pedidosVendaServiceApi.update(editando.id, { ...editando, ...form });
    } else {
      await pedidosVendaServiceApi.create(form);
    }
    await reload();
    setEditando(null);
  };

  const mudarStatus = async (row, novoStatus) => {
    if (!row?.id) return;
    setSavingStatus(true);
    try {
      await pedidosVendaServiceApi.update(row.id, { ...row, status: novoStatus });
      toast.success(`Status atualizado para "${novoStatus}"`);
      await reload();
      setDetalhe((d) => d ? { ...d, status: novoStatus } : null);
    } catch (e) {
      toast.error(e?.message || 'Falha ao atualizar status');
    } finally {
      setSavingStatus(false);
    }
  };

  const resumo = useMemo(() => ({
    total: data.length,
    orcamento: data.filter((p) => p.status === 'Orçamento').length,
    aguardando: data.filter((p) => p.status === 'Aguardando Aprovação').length,
    aprovado: data.filter((p) => p.status === 'Aprovado').length,
    producao: data.filter((p) => p.status === 'Em Produção').length,
    faturado: data.filter((p) => p.status === 'Faturado').length,
    entregue: data.filter((p) => p.status === 'Entregue').length,
    totalValor: data
      .filter((p) => !['Cancelado'].includes(p.status))
      .reduce((s, p) => s + Number(p.valor_total || 0), 0),
  }), [data]);

  const filtered = useMemo(() => data.filter((p) => {
    const s = search.toLowerCase();
    return (
      (!s || p.numero?.toLowerCase().includes(s) || p.cliente_nome?.toLowerCase().includes(s)) &&
      (!filters.status || p.status === filters.status) &&
      (!filters.vendedor || p.vendedor === filters.vendedor)
    );
  }), [data, search, filters]);

  const vendedores = useMemo(() => [...new Set(data.map((p) => p.vendedor).filter(Boolean))], [data]);

  const columns = [
    {
      key: 'numero', label: 'Número', width: 110,
      render: (v, row) => (
        <button className="text-primary hover:underline font-medium" onClick={(e) => { e.stopPropagation(); setDetalhe(row); }}>
          {v}
        </button>
      ),
    },
    { key: 'cliente_nome', label: 'Cliente' },
    { key: 'data_emissao', label: 'Emissão', width: 90, render: fmtD },
    { key: 'data_entrega', label: 'Entrega', width: 90, render: fmtD },
    { key: 'vendedor', label: 'Vendedor', width: 120 },
    { key: 'forma_pagamento', label: 'Pagamento', width: 110 },
    { key: 'valor_total', label: 'Valor Total', width: 120, render: fmtR },
    { key: 'status', label: 'Status', width: 150, render: (v) => <BadgeStatus status={v} />, sortable: false },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pedidos de Venda"
        breadcrumbs={['Início', 'Vendas', 'Pedidos de Venda']}
        actions={
          <div className="flex gap-2">
            <button type="button" onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted">
              <Printer size={13} /> Imprimir
            </button>
            <button type="button"
              onClick={() => exportPdfReport({
                title: 'Pedidos de Venda', subtitle: 'Listagem consolidada', filename: 'pedidos-venda.pdf',
                table: { headers: ['Número', 'Cliente', 'Emissão', 'Entrega', 'Vendedor', 'Valor Total', 'Status'], rows: data.map((p) => [p.numero, p.cliente_nome, fmtD(p.data_emissao), fmtD(p.data_entrega), p.vendedor, fmtR(p.valor_total), p.status]) },
              })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted">
              <Download size={13} /> Exportar
            </button>
            <button type="button" onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90">
              <Plus size={13} /> Novo Pedido
            </button>
          </div>
        }
      />

      {/* ── KPIs de status ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="erp-card px-4 py-3 sm:col-span-1">
          <div className="text-xl font-bold text-primary">{fmtR(resumo.totalValor)}</div>
          <div className="text-[11px] text-muted-foreground">Carteira Ativa</div>
        </div>
        {[
          { label: 'Orçamentos', val: resumo.orcamento, color: 'text-muted-foreground' },
          { label: 'Aguard. Aprovação', val: resumo.aguardando, color: 'text-yellow-600' },
          { label: 'Aprovados', val: resumo.aprovado, color: 'text-blue-600' },
        ].map((s) => (
          <div key={s.label} className="erp-card px-4 py-3 text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Em Produção', val: resumo.producao, color: 'text-orange-600' },
          { label: 'Faturados', val: resumo.faturado, color: 'text-purple-600' },
          { label: 'Entregues', val: resumo.entregue, color: 'text-green-600' },
        ].map((s) => (
          <div key={s.label} className="erp-card px-4 py-3 text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tabela ────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar
          search={search} onSearch={setSearch}
          filters={[
            { key: 'status', label: 'Status', options: ALL_STATUS.map((s) => ({ value: s.id, label: s.label })) },
            { key: 'vendedor', label: 'Vendedor', options: vendedores.map((v) => ({ value: v, label: v })) },
          ]}
          activeFilters={filters}
          onFilterChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          onClear={() => { setSearch(''); setFilters({}); }}
        />
        <DataTable columns={columns} data={filtered} onRowClick={(row) => setDetalhe(row)} loading={loading} />
      </div>

      {(showModal || editando) && (
        <ModalPedidoVenda pedido={editando} onClose={() => { setShowModal(false); setEditando(null); }} onSave={handleSave} />
      )}

      {detalhe && (
        <DetalheModal
          title={`Pedido — ${detalhe.numero}`}
          subtitle={detalhe.cliente_nome}
          onClose={() => setDetalhe(null)}
          onExport={() => exportPdfReport({
            title: `Pedido ${detalhe.numero}`, subtitle: detalhe.cliente_nome, filename: `${detalhe.numero}.pdf`,
            fields: [
              { label: 'Número', value: detalhe.numero }, { label: 'Cliente', value: detalhe.cliente_nome },
              { label: 'Vendedor', value: detalhe.vendedor }, { label: 'Forma Pagamento', value: detalhe.forma_pagamento || '—' },
              { label: 'Status', value: detalhe.status }, { label: 'Emissão', value: fmtD(detalhe.data_emissao) },
              { label: 'Entrega', value: fmtD(detalhe.data_entrega) }, { label: 'Valor Total', value: fmtR(detalhe.valor_total) },
            ],
            preview: true,
          })}
        >
          {/* Progresso do workflow */}
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Progresso do Pedido</p>
            <ProgressoWorkflow status={detalhe.status} />
          </div>

          {/* Dados do pedido */}
          <div className="grid grid-cols-2 gap-2.5 text-xs mb-4">
            {[
              ['Número', detalhe.numero], ['Cliente', detalhe.cliente_nome],
              ['Vendedor', detalhe.vendedor], ['Forma Pagamento', detalhe.forma_pagamento || '—'],
              ['Emissão', fmtD(detalhe.data_emissao)], ['Entrega Prevista', fmtD(detalhe.data_entrega)],
              ['Valor Total', fmtR(detalhe.valor_total)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">{k}</span>
                <span className={`font-medium ${k === 'Valor Total' ? 'text-primary' : ''}`}>{v}</span>
              </div>
            ))}
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-muted-foreground">Status</span>
              <BadgeStatus status={detalhe.status} />
            </div>
          </div>

          {/* Alerta de aprovação */}
          {detalhe.valor_total > (CONFIG?.LIMITE_APROVACAO || 50000) && detalhe.status === 'Aguardando Aprovação' && (
            <div className="mb-3 flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded px-3 py-2 text-xs text-yellow-800">
              <AlertTriangle size={12} /> Valor acima do limite — requer aprovação gerencial
            </div>
          )}

          {/* Avançar status */}
          {PROXIMOS[detalhe.status]?.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Avançar para</p>
              <div className="flex flex-wrap gap-2">
                {PROXIMOS[detalhe.status].map((novoStatus) => {
                  const cfg = ALL_STATUS.find((s) => s.id === novoStatus);
                  const Icon = cfg?.icon || ArrowRight;
                  return (
                    <button
                      key={novoStatus}
                      type="button"
                      disabled={savingStatus}
                      onClick={() => mudarStatus(detalhe, novoStatus)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors disabled:opacity-50 ${
                        novoStatus === 'Cancelado'
                          ? 'text-red-600 border-red-200 hover:bg-red-50'
                          : `${cfg?.color || ''} border-current hover:opacity-90`
                      }`}
                    >
                      <Icon size={11} /> {novoStatus}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ações de integração */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            <button type="button"
              onClick={async () => {
                try { await cozincaApi.reservarEstoquePedido(detalhe.id); toast.success('Estoque reservado.'); await reload(); setDetalhe(null); }
                catch (e) { toast.error(e?.message || 'Falha na reserva.'); }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted">
              <Factory size={11} /> Reservar Estoque
            </button>
            <button type="button"
              onClick={async () => {
                try {
                  const ops = await cozincaApi.gerarOpPedido(detalhe.id);
                  toast.success(`OPs: ${(ops || []).map((o) => o.numero).filter(Boolean).join(', ') || 'ok'}`);
                  await reload(); setDetalhe(null);
                } catch (e) { toast.error(e?.message || 'Falha ao gerar OP.'); }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted">
              <Factory size={11} /> Gerar OP
            </button>
            <button type="button"
              onClick={async () => {
                try { await cozincaApi.gerarContasReceberPedido(detalhe.id); toast.success('Contas a receber geradas.'); await reload(); }
                catch (e) { toast.error(e?.message || 'Falha financeiro.'); }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted">
              <DollarSign size={11} /> Gerar Cobrança
            </button>
            <button type="button"
              onClick={() => navigate('/financeiro/fiscal')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted">
              <FileText size={11} /> Emitir NF-e
            </button>
            <button type="button"
              onClick={() => navigate(`/vendas/comissoes`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted">
              <DollarSign size={11} /> Ver Comissão
            </button>
            <button type="button"
              onClick={() => { setEditando(detalhe); setDetalhe(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90">
              Editar Pedido
            </button>
          </div>
        </DetalheModal>
      )}
    </div>
  );
}
