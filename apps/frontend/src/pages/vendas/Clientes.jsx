import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ModalCliente from '@/components/vendas/ModalCliente';
import { Plus, Download, ShoppingCart, FileText, Phone, Mail, MapPin, CreditCard, AlertTriangle } from 'lucide-react';
import { exportPdfReport } from '@/services/pdfExport';
import { clientesServiceApi } from '@/services/clientesServiceApi';
import { toast } from 'sonner';

const fmtR = (v) => v ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—';

// Indicador de limite de crédito
function LimiteCredito({ limite, usado }) {
  if (!limite) return <span className="text-muted-foreground text-xs">—</span>;
  const pct = usado ? Math.min((Number(usado) / Number(limite)) * 100, 100) : 0;
  const cor = pct > 85 ? 'bg-red-400' : pct > 60 ? 'bg-yellow-400' : 'bg-green-400';
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 bg-muted rounded-full h-1.5">
        <div className={`${cor} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground">{pct.toFixed(0)}%</span>
    </div>
  );
}

export default function Clientes() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [abaDetalhe, setAbaDetalhe] = useState('dados');

  const reload = async (opts = {}) => {
    setLoading(true);
    try {
      const rows = await clientesServiceApi.getAll({
        search: opts.search ?? search,
        status: opts.status ?? filters.status ?? '',
      });
      setData(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const handleSave = async (form) => {
    if (editando?.id) {
      await clientesServiceApi.update(editando.id, { ...editando, ...form });
    } else {
      await clientesServiceApi.create(form);
    }
    await reload();
    setEditando(null);
    toast.success('Cliente salvo com sucesso!');
  };

  const handleExportar = () => {
    exportPdfReport({
      title: 'Clientes', subtitle: 'Cadastro de clientes', filename: 'clientes.pdf',
      table: {
        headers: ['Código', 'Razão Social', 'Fantasia', 'CNPJ/CPF', 'Cidade', 'UF', 'Telefone', 'Limite Crédito', 'Status'],
        rows: data.map((c) => [c.codigo, c.razao_social, c.nome_fantasia, c.cnpj_cpf, c.cidade, c.estado, c.telefone, fmtR(c.limite_credito), c.status]),
      },
    });
  };

  const filtered = useMemo(() => data.filter((c) => {
    const s = search.toLowerCase();
    return (
      (!s || c.razao_social?.toLowerCase().includes(s) || c.cnpj_cpf?.includes(s) || c.codigo?.includes(s)) &&
      (!filters.status || c.status === filters.status)
    );
  }), [data, search, filters]);

  // KPIs
  const kpis = useMemo(() => ({
    total: data.length,
    ativos: data.filter((c) => c.status === 'Ativo').length,
    inativos: data.filter((c) => c.status === 'Inativo').length,
    bloqueados: data.filter((c) => c.status === 'Bloqueado').length,
  }), [data]);

  const columns = [
    { key: 'codigo', label: 'Código', width: 80 },
    {
      key: 'razao_social', label: 'Razão Social',
      render: (v, row) => (
        <button type="button" className="text-primary hover:underline text-left font-medium" onClick={(e) => { e.stopPropagation(); setDetalhe(row); setAbaDetalhe('dados'); }}>
          {v}
        </button>
      ),
    },
    { key: 'nome_fantasia', label: 'Fantasia', width: 130 },
    { key: 'cnpj_cpf', label: 'CNPJ/CPF', width: 150 },
    { key: 'cidade', label: 'Cidade/UF', width: 120, render: (v, row) => v ? `${v}/${row.estado || ''}` : '—' },
    { key: 'telefone', label: 'Telefone', width: 120 },
    {
      key: 'limite_credito', label: 'Limite Crédito', width: 130,
      render: (v, row) => <LimiteCredito limite={v} usado={row.credito_utilizado} />,
    },
    { key: 'status', label: 'Status', width: 80, render: (v) => <StatusBadge status={v} />, sortable: false },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clientes"
        breadcrumbs={['Início', 'Vendas', 'Clientes']}
        actions={
          <div className="flex gap-2">
            <button type="button" onClick={handleExportar}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted">
              <Download size={13} /> Exportar PDF
            </button>
            <button type="button" onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90">
              <Plus size={13} /> Novo Cliente
            </button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Total', val: kpis.total, color: 'text-foreground' },
          { label: 'Ativos', val: kpis.ativos, color: 'text-green-600' },
          { label: 'Inativos', val: kpis.inativos, color: 'text-muted-foreground' },
          { label: 'Bloqueados', val: kpis.bloqueados, color: 'text-red-600' },
        ].map((k) => (
          <div key={k.label} className="erp-card px-4 py-3 text-center">
            <div className={`text-xl font-bold ${k.color}`}>{k.val}</div>
            <div className="text-[11px] text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar
          search={search} onSearch={setSearch}
          filters={[{ key: 'status', label: 'Status', options: ['Ativo', 'Inativo', 'Bloqueado'].map((s) => ({ value: s, label: s })) }]}
          activeFilters={filters}
          onFilterChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          onClear={() => { setSearch(''); setFilters({}); reload({ search: '', status: '' }); }}
        />
        <DataTable columns={columns} data={filtered} onRowClick={(row) => { setDetalhe(row); setAbaDetalhe('dados'); }} loading={loading} />
      </div>

      {(showModal || editando) && (
        <ModalCliente
          cliente={editando}
          onClose={() => { setShowModal(false); setEditando(null); }}
          onSave={handleSave}
        />
      )}

      {/* ── Modal Detalhe com Abas ─────────────────────────────────────────── */}
      {detalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setDetalhe(null); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex items-start justify-between shrink-0">
              <div>
                <h2 className="font-semibold text-base">{detalhe.razao_social}</h2>
                <p className="text-xs text-muted-foreground">Código: {detalhe.codigo} · {detalhe.cnpj_cpf}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={detalhe.status} />
                <button type="button" onClick={() => setDetalhe(null)} className="text-muted-foreground hover:text-foreground p-1">✕</button>
              </div>
            </div>

            {/* Abas */}
            <div className="flex gap-0 border-b border-border shrink-0">
              {[
                { id: 'dados', label: 'Dados Gerais' },
                { id: 'comercial', label: 'Cond. Comerciais' },
                { id: 'contatos', label: 'Contatos' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setAbaDetalhe(t.id)}
                  className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${abaDetalhe === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-5">
              {abaDetalhe === 'dados' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {[
                      ['Razão Social', detalhe.razao_social], ['Nome Fantasia', detalhe.nome_fantasia],
                      ['CNPJ/CPF', detalhe.cnpj_cpf], ['Inscrição Estadual', detalhe.inscricao_estadual || '—'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex flex-col gap-0.5 border-b border-border pb-2">
                        <span className="text-muted-foreground text-[11px]">{k}</span>
                        <span className="font-medium">{v || '—'}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                      <MapPin size={11} /> Endereço
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {[
                        ['Logradouro', detalhe.logradouro || detalhe.endereco || '—'],
                        ['Número/Compl.', detalhe.numero_end || '—'],
                        ['Bairro', detalhe.bairro || '—'],
                        ['Cidade/UF', `${detalhe.cidade || '—'}/${detalhe.estado || '—'}`],
                        ['CEP', detalhe.cep || '—'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex flex-col gap-0.5 border-b border-border pb-2">
                          <span className="text-muted-foreground text-[11px]">{k}</span>
                          <span className="font-medium">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {abaDetalhe === 'comercial' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {[
                      ['Condição de Pagamento', detalhe.condicao_pagamento || '—'],
                      ['Tabela de Preços', detalhe.tabela_precos || 'Padrão'],
                      ['Desconto Padrão', detalhe.desconto_padrao ? `${detalhe.desconto_padrao}%` : '—'],
                      ['Vendedor Responsável', detalhe.vendedor || '—'],
                      ['% Comissão', detalhe.pct_comissao ? `${detalhe.pct_comissao}%` : '—'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex flex-col gap-0.5 border-b border-border pb-2">
                        <span className="text-muted-foreground text-[11px]">{k}</span>
                        <span className="font-medium">{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Limite de crédito */}
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                      <CreditCard size={11} /> Limite de Crédito
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Limite:</span>
                      <span className="text-sm font-bold">{fmtR(detalhe.limite_credito)}</span>
                    </div>
                    {detalhe.limite_credito && (
                      <LimiteCredito limite={detalhe.limite_credito} usado={detalhe.credito_utilizado} />
                    )}
                    {detalhe.credito_utilizado > detalhe.limite_credito * 0.9 && (
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-red-600">
                        <AlertTriangle size={11} /> Limite de crédito próximo do máximo
                      </div>
                    )}
                  </div>
                </div>
              )}

              {abaDetalhe === 'contatos' && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { icon: Phone, label: 'Telefone', value: detalhe.telefone },
                      { icon: Mail, label: 'E-mail', value: detalhe.email },
                      { icon: Phone, label: 'WhatsApp', value: detalhe.whatsapp || detalhe.celular },
                    ].filter((c) => c.value).map((c) => {
                      const Icon = c.icon;
                      return (
                        <div key={c.label} className="flex items-center gap-3 p-3 bg-muted/30 rounded-md">
                          <Icon size={14} className="text-primary shrink-0" />
                          <div>
                            <div className="text-[11px] text-muted-foreground">{c.label}</div>
                            <div className="font-medium">{c.value}</div>
                          </div>
                        </div>
                      );
                    })}
                    {detalhe.contato && (
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-md">
                        <FileText size={14} className="text-primary shrink-0" />
                        <div>
                          <div className="text-[11px] text-muted-foreground">Pessoa de contato</div>
                          <div className="font-medium">{detalhe.contato}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border bg-muted/20 flex justify-between items-center shrink-0">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/vendas/pedidos')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"
                >
                  <ShoppingCart size={12} /> Ver Pedidos
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/vendas/orcamentos')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"
                >
                  <FileText size={12} /> Ver Orçamentos
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm('Excluir este cliente?')) return;
                    await clientesServiceApi.delete(detalhe.id);
                    setDetalhe(null);
                    await reload();
                    toast.success('Cliente excluído.');
                  }}
                  className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                >
                  Excluir
                </button>
                <button
                  type="button"
                  onClick={() => { setEditando(detalhe); setDetalhe(null); }}
                  className="px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
