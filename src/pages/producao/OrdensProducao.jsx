import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ModalNovaOP from '@/components/producao/ModalNovaOP';
import { opService } from '@/services/opService';
import { Plus, Download, Kanban } from 'lucide-react';
import { exportPdfReport } from '@/services/pdfExport';
import FluxoProducao from '@/components/producao/FluxoProducao';

const STATUS_LABEL = {
  aberta: 'Aberta', em_andamento: 'Em Andamento', pausada: 'Pausada', concluida: 'Concluída', cancelada: 'Cancelada'
};

const columns = [
  { key: 'numero', label: 'Número', width: 100, render: (v, row) => <Link to={`/producao/ordens/${row.id}`} className="text-primary hover:underline font-medium">{v}</Link> },
  { key: 'clienteNome', label: 'Cliente', width: 180 },
  { key: 'produtoDescricao', label: 'Produto' },
  { key: 'quantidade', label: 'Qtd', width: 60 },
  { key: 'unidade', label: 'UN', width: 50 },
  { key: 'dataEmissao', label: 'Abertura', width: 90, render: v => v ? new Date(v).toLocaleDateString('pt-BR') : '—' },
  { key: 'prazo', label: 'Prazo', width: 90, render: (v, row) => {
    const atrasada = v && new Date(v) < new Date() && row.status !== 'concluida';
    return <span className={atrasada ? 'text-red-600 font-medium' : ''}>{v ? new Date(v).toLocaleDateString('pt-BR') : '—'}</span>;
  }},
  { key: 'responsavel', label: 'Responsável', width: 100 },
  { key: 'prioridade', label: 'Prioridade', width: 90, render: v => <StatusBadge status={v} />, sortable: false },
  { key: 'status', label: 'Status', width: 120, render: v => <StatusBadge status={STATUS_LABEL[v] || v} />, sortable: false },
];

export default function OrdensProducao() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await opService.getAll();
      setData(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleSalvar = async (form) => {
    await opService.create(form);
    await load();
  };

  const filtered = useMemo(() => {
    return data.filter(o => {
      const s = search.toLowerCase();
      return (!s || o.numero?.toLowerCase().includes(s) || o.produtoDescricao?.toLowerCase().includes(s) || o.clienteNome?.toLowerCase().includes(s))
        && (!filters.status || (STATUS_LABEL[o.status] || o.status) === filters.status)
        && (!filters.prioridade || o.prioridade === filters.prioridade);
    });
  }, [data, search, filters.status, filters.prioridade]);

  const counts = {
    total: data.length,
    abertas: data.filter(o => o.status === 'aberta').length,
    andamento: data.filter(o => o.status === 'em_andamento').length,
    concluidas: data.filter(o => o.status === 'concluida').length,
  };

  return (
    <div>
      <PageHeader
        title="Ordens de Produção"
        breadcrumbs={['Início', 'Produção', 'Ordens de Produção']}
        actions={
          <div className="flex gap-2">
            <Link to="/producao/kanban" className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted">
              <Kanban size={13} /> Kanban
            </Link>
            <button
              onClick={() => exportPdfReport({
                title: 'Ordens de Produção',
                subtitle: 'Resumo operacional das OPs cadastradas',
                filename: 'ordens-producao.pdf',
                table: {
                  headers: ['Número', 'Cliente', 'Produto', 'Qtd', 'UN', 'Abertura', 'Prazo', 'Responsável', 'Prioridade', 'Status'],
                  rows: data.map((op) => [
                    op.numero,
                    op.clienteNome,
                    op.produtoDescricao,
                    op.quantidade,
                    op.unidade,
                    op.dataEmissao ? new Date(op.dataEmissao).toLocaleDateString('pt-BR') : '—',
                    op.prazo ? new Date(op.prazo).toLocaleDateString('pt-BR') : '—',
                    op.responsavel,
                    op.prioridade,
                    STATUS_LABEL[op.status] || op.status,
                  ]),
                },
              })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"
            >
              <Download size={13} /> Exportar PDF
            </button>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90">
              <Plus size={13} /> Nova OP
            </button>
          </div>
        }
      />
      <FluxoProducao />
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: 'Total', val: counts.total, color: 'text-foreground' },
          { label: 'Abertas', val: counts.abertas, color: 'text-blue-600' },
          { label: 'Em Andamento', val: counts.andamento, color: 'text-orange-600' },
          { label: 'Concluídas', val: counts.concluidas, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-border rounded px-3 py-2 text-center">
            <div className={`text-lg font-bold ${s.color}`}>{s.val}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar
          search={search} onSearch={setSearch}
          filters={[
            { key: 'status', label: 'Status', options: ['Aberta','Em Andamento','Pausada','Concluída','Cancelada'].map(s => ({ value: s, label: s })) },
            { key: 'prioridade', label: 'Prioridade', options: ['Baixa','Normal','Alta','Urgente'].map(s => ({ value: s, label: s })) },
          ]}
          activeFilters={filters}
          onFilterChange={(k,v) => setFilters(f => ({ ...f, [k]: v }))}
          onClear={() => { setSearch(''); setFilters({}); }}
        />
        <DataTable columns={columns} data={filtered} loading={loading} onRowClick={row => window.location.href = `/producao/ordens/${row.id}`} />
      </div>

      {showModal && <ModalNovaOP onClose={() => setShowModal(false)} onSave={handleSalvar} />}
    </div>
  );
}