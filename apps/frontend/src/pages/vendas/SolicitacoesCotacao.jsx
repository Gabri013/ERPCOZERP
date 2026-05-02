import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FilterBar from '@/components/common/FilterBar';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus, ArrowRight, FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { recordsServiceApi } from '@/services/recordsServiceApi';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  'Nova':               { color: 'bg-blue-100 text-blue-700',    icon: Clock },
  'Em Análise':         { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  'Proposta Gerada':    { color: 'bg-indigo-100 text-indigo-700', icon: FileText },
  'Aprovada':           { color: 'bg-green-100 text-green-700',   icon: CheckCircle },
  'Rejeitada':          { color: 'bg-red-100 text-red-700',       icon: XCircle },
  'Cancelada':          { color: 'bg-gray-100 text-gray-500',     icon: XCircle },
};

function BadgeStatus({ status }) {
  const cfg = STATUS_CONFIG[status] || { color: 'bg-gray-100 text-gray-600', icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${cfg.color}`}>
      <Icon size={10} />
      {status || '—'}
    </span>
  );
}

const fmtR = (v) => v ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—';
const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';

const FORM_EMPTY = {
  numero: '', cliente: '', contato: '', codigo_produto: '', descricao_produto: '',
  quantidade: 1, unidade: 'UN', preco_venda: 0, prazo_entrega: '', condicao_pagamento: '',
  status: 'Nova', responsavel: '', observacoes: '', data_solicitacao: new Date().toISOString().split('T')[0],
};

export default function SolicitacoesCotacao() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(FORM_EMPTY);
  const [detalhe, setDetalhe] = useState(null);

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function load() {
    setLoading(true);
    try {
      setData(await recordsServiceApi.list('solicitacao_cotacao'));
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const proximoNumero = () => {
    const ano = new Date().getFullYear();
    const seq = String(data.length + 1).padStart(4, '0');
    return `SC-${ano}-${seq}`;
  };

  const handleSave = async () => {
    if (!form.cliente) return toast.error('Informe o cliente');
    if (!form.descricao_produto) return toast.error('Informe a descrição do produto');
    setSaving(true);
    try {
      const numero = form.numero || proximoNumero();
      await recordsServiceApi.create('solicitacao_cotacao', { ...form, numero });
      await load();
      setShowModal(false);
      setForm(FORM_EMPTY);
      toast.success('Solicitação de cotação criada!');
    } finally {
      setSaving(false);
    }
  };

  const mudarStatus = async (item, novoStatus) => {
    try {
      await recordsServiceApi.update(item.id, { ...item, status: novoStatus });
      await load();
      setDetalhe((d) => d ? { ...d, status: novoStatus } : null);
      toast.success(`Status atualizado para "${novoStatus}"`);
    } catch (e) {
      toast.error(e?.message || 'Erro ao atualizar');
    }
  };

  const gerarOrcamento = async (item) => {
    await mudarStatus(item, 'Proposta Gerada');
    toast.info('Redirecionando para Orçamentos...', { duration: 2000 });
    setTimeout(() => navigate('/vendas/orcamentos'), 1500);
  };

  const filtered = useMemo(() => {
    return data.filter((r) => {
      const s = search.toLowerCase();
      return (
        (!s || r.numero?.toLowerCase().includes(s) || r.cliente?.toLowerCase().includes(s) || r.descricao_produto?.toLowerCase().includes(s)) &&
        (!filters.status || r.status === filters.status)
      );
    });
  }, [data, search, filters.status]);

  // KPIs
  const kpis = useMemo(() => ({
    total: data.length,
    novas: data.filter((d) => d.status === 'Nova').length,
    analise: data.filter((d) => d.status === 'Em Análise').length,
    propostas: data.filter((d) => d.status === 'Proposta Gerada').length,
    aprovadas: data.filter((d) => d.status === 'Aprovada').length,
  }), [data]);

  const columns = [
    {
      key: 'numero', label: 'Solicitação', width: 130,
      render: (v, row) => (
        <button className="text-primary hover:underline font-medium" onClick={(e) => { e.stopPropagation(); setDetalhe(row); }}>
          {v || '—'}
        </button>
      ),
    },
    { key: 'data_solicitacao', label: 'Data', width: 90, render: fmtD },
    { key: 'cliente', label: 'Cliente' },
    { key: 'contato', label: 'Contato', width: 120 },
    { key: 'codigo_produto', label: 'Cód. Produto', width: 110 },
    { key: 'descricao_produto', label: 'Descrição do Produto' },
    { key: 'quantidade', label: 'Qtd', width: 60, render: (v) => Number(v || 0).toLocaleString('pt-BR') },
    { key: 'preco_venda', label: 'Preço', width: 110, render: fmtR },
    { key: 'status', label: 'Status', width: 140, render: (v) => <BadgeStatus status={v} />, sortable: false },
    { key: 'responsavel', label: 'Responsável', width: 110 },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Solicitações de Cotação"
        breadcrumbs={['Início', 'Vendas', 'Solicitações de Cotação']}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"
          >
            <Plus size={13} /> Criar Solicitação
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: 'Total', value: kpis.total, color: 'text-foreground' },
          { label: 'Novas', value: kpis.novas, color: 'text-blue-600' },
          { label: 'Em Análise', value: kpis.analise, color: 'text-yellow-600' },
          { label: 'Proposta Gerada', value: kpis.propostas, color: 'text-indigo-600' },
          { label: 'Aprovadas', value: kpis.aprovadas, color: 'text-green-600' },
        ].map((k) => (
          <div key={k.label} className="erp-card px-3 py-2 text-center">
            <div className={`text-lg font-bold ${k.color}`}>{k.value}</div>
            <div className="text-[10px] text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar
          search={search} onSearch={setSearch}
          filters={[{ key: 'status', label: 'Status', options: Object.keys(STATUS_CONFIG).map((s) => ({ value: s, label: s })) }]}
          activeFilters={filters}
          onFilterChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          onClear={() => { setSearch(''); setFilters({}); }}
        />
        <DataTable columns={columns} data={filtered} onRowClick={(row) => setDetalhe(row)} loading={loading} />
      </div>

      {/* Modal Nova Solicitação */}
      {showModal && (
        <FormModal title="Nova Solicitação de Cotação" onClose={() => setShowModal(false)} onSave={handleSave} saving={saving} size="lg">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Data da Solicitação</label><input type="date" className={inp} value={form.data_solicitacao} onChange={(e) => upd('data_solicitacao', e.target.value)} /></div>
              <div><label className={lbl}>Responsável (Vendedor)</label><input className={inp} value={form.responsavel} onChange={(e) => upd('responsavel', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Cliente {req}</label><input className={inp} value={form.cliente} onChange={(e) => upd('cliente', e.target.value)} /></div>
              <div><label className={lbl}>Contato</label><input className={inp} value={form.contato} onChange={(e) => upd('contato', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={lbl}>Código do Produto (ERP)</label><input className={inp} value={form.codigo_produto} onChange={(e) => upd('codigo_produto', e.target.value)} placeholder="Se já cadastrado" /></div>
              <div><label className={lbl}>Quantidade</label><input type="number" min="0.01" step="0.01" className={inp} value={form.quantidade} onChange={(e) => upd('quantidade', Number(e.target.value))} /></div>
              <div><label className={lbl}>Unidade</label><select className={inp} value={form.unidade} onChange={(e) => upd('unidade', e.target.value)}>{['UN','KG','MT','L','M²','PC','CX'].map((u) => <option key={u}>{u}</option>)}</select></div>
            </div>
            <div><label className={lbl}>Descrição do Produto/Serviço {req}</label><textarea className={`${inp} resize-none`} rows={2} value={form.descricao_produto} onChange={(e) => upd('descricao_produto', e.target.value)} placeholder="Descreva em detalhes o que o cliente precisa" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={lbl}>Preço de Venda Estimado (R$)</label><input type="number" min="0" step="0.01" className={inp} value={form.preco_venda} onChange={(e) => upd('preco_venda', Number(e.target.value))} /></div>
              <div><label className={lbl}>Prazo de Entrega</label><input className={inp} value={form.prazo_entrega} onChange={(e) => upd('prazo_entrega', e.target.value)} placeholder="Ex: 30 dias" /></div>
              <div><label className={lbl}>Condição de Pagamento</label><input className={inp} value={form.condicao_pagamento} onChange={(e) => upd('condicao_pagamento', e.target.value)} placeholder="Ex: 30/60 dias" /></div>
            </div>
            <div><label className={lbl}>Observações</label><textarea className={`${inp} resize-none`} rows={2} value={form.observacoes} onChange={(e) => upd('observacoes', e.target.value)} /></div>
          </div>
        </FormModal>
      )}

      {/* Modal Detalhe */}
      {detalhe && (
        <DetalheModal title={`Solicitação ${detalhe.numero || ''}`} subtitle={detalhe.cliente} onClose={() => setDetalhe(null)}>
          <div className="grid grid-cols-2 gap-2.5 text-xs mb-4">
            {[
              ['Cliente', detalhe.cliente], ['Contato', detalhe.contato],
              ['Produto', detalhe.descricao_produto], ['Código ERP', detalhe.codigo_produto || '—'],
              ['Quantidade', `${detalhe.quantidade || 0} ${detalhe.unidade || ''}`],
              ['Preço Estimado', fmtR(detalhe.preco_venda)],
              ['Prazo', detalhe.prazo_entrega || '—'], ['Pagamento', detalhe.condicao_pagamento || '—'],
              ['Responsável', detalhe.responsavel || '—'],
              ['Data Solicitação', fmtD(detalhe.data_solicitacao)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium text-right max-w-[60%] truncate">{v}</span>
              </div>
            ))}
            <div className="flex justify-between border-b border-border pb-1.5 col-span-2">
              <span className="text-muted-foreground">Status</span>
              <BadgeStatus status={detalhe.status} />
            </div>
          </div>

          {detalhe.observacoes && (
            <div className="mb-4 p-3 bg-muted/30 rounded-md">
              <p className="text-[11px] font-semibold text-muted-foreground mb-1">Observações</p>
              <p className="text-xs text-foreground/70">{detalhe.observacoes}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {detalhe.status === 'Nova' && (
              <button type="button" onClick={() => mudarStatus(detalhe, 'Em Análise')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted">
                <Clock size={12} /> Colocar Em Análise
              </button>
            )}
            {['Nova', 'Em Análise'].includes(detalhe.status) && (
              <button type="button" onClick={() => gerarOrcamento(detalhe)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90">
                <FileText size={12} /> Gerar Orçamento →
              </button>
            )}
            {detalhe.status === 'Proposta Gerada' && (
              <>
                <button type="button" onClick={() => mudarStatus(detalhe, 'Aprovada')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:opacity-90">
                  <CheckCircle size={12} /> Aprovada pelo Cliente
                </button>
                <button type="button" onClick={() => mudarStatus(detalhe, 'Rejeitada')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50">
                  <XCircle size={12} /> Rejeitada
                </button>
              </>
            )}
            {!['Aprovada', 'Rejeitada', 'Cancelada'].includes(detalhe.status) && (
              <button type="button" onClick={() => mudarStatus(detalhe, 'Cancelada')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded hover:bg-gray-50">
                Cancelar
              </button>
            )}
          </div>
        </DetalheModal>
      )}
    </div>
  );
}
