import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ModalPedidoVenda from '@/components/vendas/ModalPedidoVenda';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus, Download, Wrench, CheckCircle, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { exportPdfReport } from '@/services/pdfExport';
import { orcamentosServiceApi } from '@/services/orcamentosServiceApi';
import { cozincaApi } from '@/services/cozincaApi';
import { toast } from 'sonner';

const fmtR = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const fmtD = (v) => (v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—');

// ─── Estados do workflow de orçamento ────────────────────────────────────────
const STATUS_CONFIG = {
  'Orçamento':                { color: 'bg-blue-100 text-blue-700',    label: 'Orçamento',                icon: Clock },
  'Aguardando Engenharia':    { color: 'bg-violet-100 text-violet-700', label: 'Aguardando Engenharia',   icon: Wrench },
  'Em Análise':               { color: 'bg-yellow-100 text-yellow-700', label: 'Em Análise (Engenharia)', icon: Wrench },
  'Specs Recebidas':          { color: 'bg-indigo-100 text-indigo-700', label: 'Specs Recebidas',         icon: CheckCircle },
  'Enviado ao Cliente':       { color: 'bg-blue-100 text-blue-700',     label: 'Enviado ao Cliente',      icon: ArrowRight },
  'Em Negociação':            { color: 'bg-orange-100 text-orange-700', label: 'Em Negociação',           icon: Clock },
  'Aprovado':                 { color: 'bg-green-100 text-green-700',   label: 'Aprovado',                icon: CheckCircle },
  'Convertido em Pedido':     { color: 'bg-green-100 text-green-700',   label: 'Convertido em Pedido',    icon: CheckCircle },
  'Cancelado':                { color: 'bg-red-100 text-red-700',       label: 'Cancelado',               icon: AlertCircle },
  'Perdido':                  { color: 'bg-gray-100 text-gray-600',     label: 'Perdido',                 icon: AlertCircle },
};

// Próximos estados possíveis para cada status atual
const PROXIMOS_STATUS = {
  'Orçamento':             ['Aguardando Engenharia', 'Specs Recebidas', 'Enviado ao Cliente', 'Cancelado'],
  'Aguardando Engenharia': ['Em Análise', 'Specs Recebidas'],
  'Em Análise':            ['Specs Recebidas'],
  'Specs Recebidas':       ['Enviado ao Cliente', 'Em Negociação'],
  'Enviado ao Cliente':    ['Em Negociação', 'Aprovado', 'Perdido'],
  'Em Negociação':         ['Aprovado', 'Perdido', 'Enviado ao Cliente'],
  'Aprovado':              ['Convertido em Pedido', 'Cancelado'],
  'Convertido em Pedido':  [],
  'Cancelado':             [],
  'Perdido':               [],
};

// Rótulos dos status para o configurador do badge
function StatusOrcamento({ status }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return <StatusBadge status={status} />;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${cfg.color}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

// Pipeline visual com contagens por status
function PipelineBar({ data }) {
  const counts = useMemo(() => {
    const c = {};
    for (const row of data) {
      c[row.status] = (c[row.status] || 0) + 1;
    }
    return c;
  }, [data]);

  const stages = [
    { key: 'Orçamento',             color: 'bg-blue-400' },
    { key: 'Aguardando Engenharia', color: 'bg-violet-400' },
    { key: 'Specs Recebidas',       color: 'bg-indigo-400' },
    { key: 'Enviado ao Cliente',    color: 'bg-sky-400' },
    { key: 'Em Negociação',         color: 'bg-orange-400' },
    { key: 'Aprovado',              color: 'bg-green-400' },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      {stages.map((s) => (
        <div key={s.key} className="flex items-center gap-1.5 text-xs">
          <span className={`w-2 h-2 rounded-full ${s.color}`} />
          <span className="text-muted-foreground">{s.key}</span>
          <span className="font-bold text-foreground">{counts[s.key] || 0}</span>
        </div>
      ))}
    </div>
  );
}

export default function Orcamentos() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const rows = await orcamentosServiceApi.getAll();
      setData(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    if (editando?.id) {
      await orcamentosServiceApi.update(editando.id, { ...editando, ...form });
    } else {
      await orcamentosServiceApi.create(form);
    }
    await load();
    setEditando(null);
  };

  // Muda o status do orçamento
  const mudarStatus = async (row, novoStatus) => {
    if (!row?.id) return;
    setSavingStatus(true);
    try {
      await orcamentosServiceApi.update(row.id, { ...row, status: novoStatus });
      toast.success(`Status atualizado para "${novoStatus}"`);
      await load();
      // Atualiza o detalhe aberto
      setDetalhe((d) => d ? { ...d, status: novoStatus } : null);
    } catch (e) {
      toast.error(e?.message || 'Falha ao atualizar status');
    } finally {
      setSavingStatus(false);
    }
  };

  // Solicitar engenharia (muda status + navega)
  const solicitarEngenharia = async (row) => {
    await mudarStatus(row, 'Aguardando Engenharia');
    toast.info('Engenharia notificada. Acesse o módulo de Engenharia para criar a BOM.', { duration: 5000 });
  };

  // Aprovar orçamento
  const aprovar = async (row) => {
    await mudarStatus(row, 'Aprovado');
  };

  // Gerar pedido de venda
  const gerarPedido = async (row) => {
    if (!row?.id) return;
    try {
      const pedido = await cozincaApi.gerarPedidoDeOrcamento(row.id);
      await mudarStatus(row, 'Convertido em Pedido');
      toast.success(`Pedido ${pedido?.numero || ''} gerado! Aguarda validação financeira.`);
      setDetalhe(null);
    } catch (e) {
      toast.error(e?.message || 'Falha ao gerar pedido.');
    }
  };

  const filtered = useMemo(() => {
    return data.filter((p) => {
      const s = search.toLowerCase();
      return (
        (!s || p.numero?.toLowerCase().includes(s) || p.cliente_nome?.toLowerCase().includes(s)) &&
        (!filters.status || p.status === filters.status)
      );
    });
  }, [data, search, filters.status]);

  // KPIs
  const kpis = useMemo(() => {
    const ativos = data.filter((d) => !['Cancelado', 'Perdido', 'Convertido em Pedido'].includes(d.status));
    const aguardandoEng = data.filter((d) => ['Aguardando Engenharia', 'Em Análise'].includes(d.status)).length;
    const aprovados = data.filter((d) => d.status === 'Aprovado').length;
    const totalPipeline = ativos.reduce((s, d) => s + Number(d.valor_total || 0), 0);
    return { ativos: ativos.length, aguardandoEng, aprovados, totalPipeline };
  }, [data]);

  const columns = [
    {
      key: 'numero', label: 'Número', width: 100,
      render: (v, row) => (
        <button className="text-primary hover:underline font-medium" onClick={(e) => { e.stopPropagation(); setDetalhe(row); }}>
          {v}
        </button>
      ),
    },
    { key: 'cliente_nome', label: 'Cliente' },
    { key: 'data_emissao', label: 'Emissão', width: 90, render: fmtD },
    { key: 'validade', label: 'Validade', width: 90, render: fmtD },
    { key: 'vendedor', label: 'Vendedor', width: 120 },
    { key: 'valor_total', label: 'Valor', width: 110, render: fmtR },
    { key: 'status', label: 'Status', width: 160, render: (v) => <StatusOrcamento status={v} />, sortable: false },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Orçamentos"
        breadcrumbs={['Início', 'Vendas', 'Orçamentos']}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => exportPdfReport({
                title: 'Orçamentos', subtitle: 'Lista de orçamentos e propostas comerciais', filename: 'orcamentos.pdf',
                table: { headers: ['Número', 'Cliente', 'Emissão', 'Validade', 'Vendedor', 'Valor', 'Status'], rows: data.map((o) => [o.numero, o.cliente_nome, fmtD(o.data_emissao), fmtD(o.validade), o.vendedor, fmtR(o.valor_total), o.status]) },
              })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"
            >
              <Download size={13} /> Exportar PDF
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"
            >
              <Plus size={13} /> Novo Orçamento
            </button>
          </div>
        }
      />

      {/* ── KPIs ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pipeline Ativo', value: `R$ ${kpis.totalPipeline.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, color: 'text-primary' },
          { label: 'Orçamentos Ativos', value: kpis.ativos, color: 'text-foreground' },
          { label: 'Aguard. Engenharia', value: kpis.aguardandoEng, color: 'text-violet-600' },
          { label: 'Aprovados (pendente pedido)', value: kpis.aprovados, color: 'text-green-600' },
        ].map((k) => (
          <div key={k.label} className="erp-card px-4 py-3">
            <div className={`text-lg font-bold ${k.color}`}>{k.value}</div>
            <div className="text-[11px] text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tabela ────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-4 pt-3">
          <PipelineBar data={data} />
        </div>
        <FilterBar
          search={search}
          onSearch={setSearch}
          filters={[{
            key: 'status', label: 'Status',
            options: Object.keys(STATUS_CONFIG).map((s) => ({ value: s, label: s })),
          }]}
          activeFilters={filters}
          onFilterChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          onClear={() => { setSearch(''); setFilters({}); }}
        />
        <DataTable columns={columns} data={filtered} onRowClick={(row) => setDetalhe(row)} loading={loading} />
      </div>

      {/* ── Modal novo / edição ───────────────────────────────────────────── */}
      {(showModal || editando) && (
        <ModalPedidoVenda
          moduloOrcamento
          pedido={editando}
          onClose={() => { setShowModal(false); setEditando(null); }}
          onSave={handleSave}
        />
      )}

      {/* ── Modal detalhe ─────────────────────────────────────────────────── */}
      {detalhe && (
        <DetalheModal
          title={`Orçamento — ${detalhe.numero}`}
          subtitle={detalhe.cliente_nome}
          onClose={() => setDetalhe(null)}
          onExport={() => exportPdfReport({
            title: `Orçamento ${detalhe.numero}`, subtitle: detalhe.cliente_nome, filename: `${detalhe.numero}.pdf`,
            fields: [
              { label: 'Cliente', value: detalhe.cliente_nome }, { label: 'Vendedor', value: detalhe.vendedor },
              { label: 'Status', value: detalhe.status }, { label: 'Emissão', value: fmtD(detalhe.data_emissao) },
              { label: 'Validade', value: fmtD(detalhe.validade) }, { label: 'Valor', value: fmtR(detalhe.valor_total) },
            ],
          })}
        >
          {/* Campos do orçamento */}
          <div className="grid grid-cols-2 gap-2.5 text-xs mb-4">
            {[
              ['Cliente', detalhe.cliente_nome], ['Vendedor', detalhe.vendedor],
              ['Status', null], ['Emissão', fmtD(detalhe.data_emissao)],
              ['Validade', fmtD(detalhe.validade)], ['Valor', fmtR(detalhe.valor_total)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">{k}</span>
                {k === 'Status'
                  ? <StatusOrcamento status={detalhe.status} />
                  : <span className="font-medium">{v}</span>
                }
              </div>
            ))}
          </div>

          {/* Faixa de status do workflow */}
          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Progresso no Workflow</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(STATUS_CONFIG).filter(([k]) => !['Cancelado','Perdido','Convertido em Pedido'].includes(k)).map(([k]) => (
                <span
                  key={k}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                    detalhe.status === k
                      ? `${STATUS_CONFIG[k].color} ring-2 ring-offset-1 ring-current`
                      : 'bg-muted text-muted-foreground/50'
                  }`}
                >
                  {k}
                </span>
              ))}
            </div>
          </div>

          {/* Ações disponíveis conforme o status */}
          <div className="flex flex-wrap gap-2 mt-1">
            {/* Solicitar Engenharia — quando produto é novo */}
            {['Orçamento', 'Specs Recebidas'].includes(detalhe.status) && (
              <button
                type="button"
                disabled={savingStatus}
                onClick={() => solicitarEngenharia(detalhe)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-violet-600 text-white rounded hover:opacity-90 disabled:opacity-50"
              >
                <Wrench size={12} />
                Solicitar Engenharia
              </button>
            )}

            {/* Ver engenharia quando aguardando */}
            {['Aguardando Engenharia', 'Em Análise'].includes(detalhe.status) && (
              <button
                type="button"
                onClick={() => { setDetalhe(null); navigate('/engenharia'); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-violet-600 text-white rounded hover:opacity-90"
              >
                <Wrench size={12} />
                Ver Módulo Engenharia
              </button>
            )}

            {/* Marcar specs recebidas */}
            {['Aguardando Engenharia', 'Em Análise'].includes(detalhe.status) && (
              <button
                type="button"
                disabled={savingStatus}
                onClick={() => mudarStatus(detalhe, 'Specs Recebidas')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:opacity-90 disabled:opacity-50"
              >
                <CheckCircle size={12} />
                Specs Recebidas
              </button>
            )}

            {/* Enviar ao cliente */}
            {['Orçamento', 'Specs Recebidas', 'Em Negociação'].includes(detalhe.status) && (
              <button
                type="button"
                disabled={savingStatus}
                onClick={() => mudarStatus(detalhe, 'Enviado ao Cliente')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted disabled:opacity-50"
              >
                <ArrowRight size={12} />
                Enviado ao Cliente
              </button>
            )}

            {/* Aprovar */}
            {['Enviado ao Cliente', 'Em Negociação'].includes(detalhe.status) && (
              <button
                type="button"
                disabled={savingStatus}
                onClick={() => aprovar(detalhe)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:opacity-90 disabled:opacity-50"
              >
                <CheckCircle size={12} />
                Aprovado pelo Cliente
              </button>
            )}

            {/* Gerar pedido de venda */}
            {detalhe.status === 'Aprovado' && (
              <button
                type="button"
                disabled={savingStatus}
                onClick={() => gerarPedido(detalhe)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90 disabled:opacity-50"
              >
                <ArrowRight size={12} />
                Gerar Pedido de Venda →
              </button>
            )}

            {/* Editar */}
            {!['Convertido em Pedido'].includes(detalhe.status) && (
              <button
                type="button"
                onClick={() => { setEditando(detalhe); setDetalhe(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"
              >
                Editar
              </button>
            )}

            {/* Cancelar */}
            {!['Cancelado', 'Perdido', 'Convertido em Pedido'].includes(detalhe.status) && (
              <button
                type="button"
                disabled={savingStatus}
                onClick={() => mudarStatus(detalhe, 'Cancelado')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 disabled:opacity-50"
              >
                Cancelar Orçamento
              </button>
            )}
          </div>

          {/* Aviso após converter em pedido */}
          {detalhe.status === 'Convertido em Pedido' && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-xs text-green-700 font-medium">
                ✓ Pedido de venda gerado — aguardando validação financeira antes de ir para produção.
              </p>
            </div>
          )}
        </DetalheModal>
      )}
    </div>
  );
}
