import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';
import { Plus, Tag, Download, TrendingUp, AlertTriangle } from 'lucide-react';
import { tabelaPrecosServiceApi } from '@/services/tabelaPrecosServiceApi';
import { exportPdfReport } from '@/services/pdfExport';
import { toast } from 'sonner';

const UNIDADES = ['UN', 'KG', 'MT', 'PC', 'CX', 'L', 'M²', 'M³', 'PAR', 'JG'];
const GRUPOS = ['Chapas de Inox', 'Tubos e Perfis', 'Conexões', 'Fixadores', 'Rolamentos', 'Flanges', 'Motores', 'Válvulas', 'Acessórios', 'Serviços', 'Outros'];

// Regras de aplicação automática por critério
const REGRAS_TABELA = [
  { id: 'cliente_especifico', label: 'Cliente específico', desc: 'Aplica automaticamente para um cliente cadastrado' },
  { id: 'volume_minimo', label: 'Volume mínimo', desc: 'Aplica quando a quantidade é maior que o mínimo definido' },
  { id: 'regiao', label: 'Região/Estado', desc: 'Aplica para clientes de determinada região' },
  { id: 'padrao', label: 'Padrão', desc: 'Tabela base para todos os clientes sem regra específica' },
];

const fmtR = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const calcMargem = (custo, venda) => custo > 0 ? (((venda - custo) / custo) * 100).toFixed(1) : '0.0';

export default function TabelaPrecos() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showReajuste, setShowReajuste] = useState(false);
  const [editando, setEditando] = useState(null);
  const [pctReajuste, setPctReajuste] = useState('');
  const [reajusteGrupo, setReajusteGrupo] = useState('');
  const [saving, setSaving] = useState(false);
  const [aba, setAba] = useState('itens'); // 'itens' | 'regras'
  const [form, setForm] = useState({
    codigo: '', descricao: '', grupo: '', unidade: 'UN',
    preco_custo: 0, preco_venda: 0, margem_minima: 20,
    ativo: true, observacao: '',
  });
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function load() {
    setLoading(true);
    try {
      const rows = await tabelaPrecosServiceApi.getAll({ search: '', grupo: '' });
      setData(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const openEdit = (row) => {
    setEditando(row);
    setForm(row);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.descricao) return toast.error('Informe a descrição');
    if (form.preco_venda > 0 && form.preco_custo > 0) {
      const margem = Number(calcMargem(form.preco_custo, form.preco_venda));
      if (margem < Number(form.margem_minima || 0)) {
        if (!confirm(`Margem de ${margem}% está abaixo do mínimo de ${form.margem_minima}%. Continuar?`)) return;
      }
    }
    setSaving(true);
    try {
      if (editando?.id) {
        await tabelaPrecosServiceApi.update(editando.id, { ...form, id: editando.id });
      } else {
        await tabelaPrecosServiceApi.create(form);
      }
      await load();
      setShowModal(false);
      setEditando(null);
      setForm({ codigo: '', descricao: '', grupo: '', unidade: 'UN', preco_custo: 0, preco_venda: 0, margem_minima: 20, ativo: true, observacao: '' });
      toast.success('Item salvo com sucesso!');
    } finally {
      setSaving(false);
    }
  };

  const aplicarReajuste = async () => {
    const pct = Number(pctReajuste);
    if (!pct) return toast.error('Informe o percentual');
    setSaving(true);
    try {
      const targets = reajusteGrupo ? data.filter((p) => p.grupo === reajusteGrupo) : data;
      await Promise.all(
        targets.map((p) =>
          tabelaPrecosServiceApi.update(p.id, {
            ...p,
            preco_venda: +(Number(p.preco_venda || 0) * (1 + pct / 100)).toFixed(2),
          })
        )
      );
      await load();
      setPctReajuste('');
      setReajusteGrupo('');
      setShowReajuste(false);
      toast.success(`Reajuste de ${pct > 0 ? '+' : ''}${pct}% aplicado em ${targets.length} itens`);
    } finally {
      setSaving(false);
    }
  };

  const grupos = useMemo(() => [...new Set(data.map((m) => m.grupo).filter(Boolean))], [data]);

  const filtered = useMemo(() => {
    return data.filter((p) => {
      const s = search.toLowerCase();
      return (
        (!s || p.codigo?.toLowerCase().includes(s) || p.descricao?.toLowerCase().includes(s)) &&
        (!filters.grupo || p.grupo === filters.grupo)
      );
    });
  }, [data, search, filters.grupo]);

  // KPIs
  const kpis = useMemo(() => {
    const margemMedia = data.length > 0
      ? data.filter((d) => d.preco_custo > 0).reduce((s, d) => s + Number(calcMargem(d.preco_custo, d.preco_venda)), 0) / Math.max(1, data.filter((d) => d.preco_custo > 0).length)
      : 0;
    const abaixoMargem = data.filter((d) => d.preco_custo > 0 && Number(calcMargem(d.preco_custo, d.preco_venda)) < (d.margem_minima || 20)).length;
    return { total: data.length, margemMedia: margemMedia.toFixed(1), abaixoMargem };
  }, [data]);

  const columns = [
    { key: 'codigo', label: 'Código', width: 90 },
    {
      key: 'descricao', label: 'Descrição',
      render: (v, row) => (
        <button className="text-primary hover:underline text-left" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
          {v}
        </button>
      ),
    },
    { key: 'grupo', label: 'Grupo', width: 120 },
    { key: 'unidade', label: 'UN', width: 50 },
    { key: 'preco_custo', label: 'Custo', width: 110, render: fmtR },
    { key: 'preco_venda', label: 'Venda', width: 110, render: fmtR },
    {
      key: 'margem_pct',
      label: 'Margem %',
      width: 90,
      sortable: false,
      render: (_v, row) => {
        const m = Number(calcMargem(row.preco_custo, row.preco_venda));
        const minima = row.margem_minima || 20;
        return (
          <div className="flex items-center gap-1">
            {m < minima && <AlertTriangle size={11} className="text-yellow-500 shrink-0" />}
            <span className={`font-medium ${m > 50 ? 'text-green-600' : m > 20 ? 'text-yellow-600' : 'text-red-600'}`}>
              {m.toFixed(1)}%
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tabela de Preços"
        breadcrumbs={['Início', 'Vendas', 'Tabela de Preços']}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => exportPdfReport({
                title: 'Tabela de Preços', subtitle: 'Preços de venda e margens', filename: 'tabela-precos.pdf',
                table: { headers: ['Código', 'Descrição', 'Grupo', 'UN', 'Custo', 'Venda', 'Margem %'], rows: data.map((p) => [p.codigo, p.descricao, p.grupo, p.unidade, fmtR(p.preco_custo), fmtR(p.preco_venda), `${calcMargem(p.preco_custo, p.preco_venda)}%`]) },
              })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"
            >
              <Download size={13} /> Exportar
            </button>
            <button onClick={() => setShowReajuste(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted">
              <TrendingUp size={13} /> Reajuste em Lote
            </button>
            <button
              onClick={() => { setEditando(null); setForm({ codigo: '', descricao: '', grupo: '', unidade: 'UN', preco_custo: 0, preco_venda: 0, margem_minima: 20, ativo: true, observacao: '' }); setShowModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"
            >
              <Plus size={13} /> Novo Item
            </button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="erp-card px-4 py-3 text-center">
          <div className="text-xl font-bold text-foreground">{kpis.total}</div>
          <div className="text-[11px] text-muted-foreground">Total de Itens</div>
        </div>
        <div className="erp-card px-4 py-3 text-center">
          <div className={`text-xl font-bold ${Number(kpis.margemMedia) > 40 ? 'text-green-600' : Number(kpis.margemMedia) > 20 ? 'text-yellow-600' : 'text-red-600'}`}>
            {kpis.margemMedia}%
          </div>
          <div className="text-[11px] text-muted-foreground">Margem Média</div>
        </div>
        <div className="erp-card px-4 py-3 text-center">
          <div className={`text-xl font-bold ${kpis.abaixoMargem > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
            {kpis.abaixoMargem}
          </div>
          <div className="text-[11px] text-muted-foreground">Abaixo da Margem Mínima</div>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-0 border-b border-border">
        {[{ id: 'itens', label: 'Itens da Tabela' }, { id: 'regras', label: 'Regras de Aplicação' }].map((t) => (
          <button key={t.id} type="button" onClick={() => setAba(t.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${aba === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {aba === 'itens' && (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <FilterBar
            search={search} onSearch={setSearch}
            filters={[{ key: 'grupo', label: 'Grupo', options: grupos.map((g) => ({ value: g, label: g })) }]}
            activeFilters={filters}
            onFilterChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
            onClear={() => { setSearch(''); setFilters({}); }}
          />
          <DataTable columns={columns} data={filtered} onRowClick={(row) => openEdit(row)} loading={loading} />
        </div>
      )}

      {aba === 'regras' && (
        <div className="erp-card p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure regras para aplicação automática da tabela de preços correta no processo de vendas.
            O sistema sugere automaticamente a tabela mais adequada para cada cliente e situação.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {REGRAS_TABELA.map((r) => (
              <div key={r.id} className="flex items-start gap-3 p-4 border border-border rounded-lg hover:bg-muted/30 cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Tag size={14} className="text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">{r.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-blue-50 rounded-md">
            <p className="text-xs text-blue-700 font-medium mb-1">Como funciona a sugestão automática:</p>
            <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
              <li>Cliente tem tabela específica cadastrada → usa essa tabela</li>
              <li>Volume do pedido atinge mínimo definido → aplica desconto de volume</li>
              <li>Cliente é de região com tabela regional → aplica tabela regional</li>
              <li>Nenhuma regra específica → usa tabela Padrão</li>
            </ol>
          </div>
        </div>
      )}

      {/* Modal edição/criação */}
      {showModal && (
        <FormModal
          title={editando ? `Editar — ${editando.descricao}` : 'Novo Item'}
          onClose={() => { setShowModal(false); setEditando(null); }}
          onSave={handleSave}
          saving={saving}
          size="md"
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Código</label><input className={inp} value={form.codigo} onChange={(e) => upd('codigo', e.target.value)} /></div>
              <div><label className={lbl}>Unidade</label><select className={inp} value={form.unidade} onChange={(e) => upd('unidade', e.target.value)}>{UNIDADES.map((u) => <option key={u}>{u}</option>)}</select></div>
            </div>
            <div><label className={lbl}>Descrição {req}</label><input className={inp} value={form.descricao} onChange={(e) => upd('descricao', e.target.value)} /></div>
            <div><label className={lbl}>Grupo</label><select className={inp} value={form.grupo} onChange={(e) => upd('grupo', e.target.value)}><option value="">Selecionar...</option>{GRUPOS.map((g) => <option key={g}>{g}</option>)}</select></div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={lbl}>Custo (R$)</label>
                <input type="number" min="0" step="0.01" className={inp} value={form.preco_custo} onChange={(e) => { upd('preco_custo', Number(e.target.value)); }} />
              </div>
              <div>
                <label className={lbl}>Venda (R$)</label>
                <input type="number" min="0" step="0.01" className={inp} value={form.preco_venda} onChange={(e) => upd('preco_venda', Number(e.target.value))} />
              </div>
              <div>
                <label className={lbl}>Margem Atual</label>
                <div className={`${inp} bg-muted flex items-center gap-1`}>
                  <span className={`font-medium ${Number(calcMargem(form.preco_custo, form.preco_venda)) < Number(form.margem_minima) ? 'text-red-600' : 'text-green-600'}`}>
                    {calcMargem(form.preco_custo, form.preco_venda)}%
                  </span>
                </div>
              </div>
            </div>
            <div>
              <label className={lbl}>Margem Mínima (%)</label>
              <input type="number" min="0" max="100" step="0.1" className={inp} value={form.margem_minima} onChange={(e) => upd('margem_minima', Number(e.target.value))} />
            </div>
            {form.preco_custo > 0 && form.preco_venda > 0 && Number(calcMargem(form.preco_custo, form.preco_venda)) < Number(form.margem_minima) && (
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-700">
                <AlertTriangle size={12} />
                Margem atual ({calcMargem(form.preco_custo, form.preco_venda)}%) abaixo do mínimo de {form.margem_minima}%
              </div>
            )}
            <div><label className={lbl}>Observação</label><input className={inp} value={form.observacao || ''} onChange={(e) => upd('observacao', e.target.value)} /></div>
          </div>
        </FormModal>
      )}

      {/* Modal reajuste */}
      {showReajuste && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5">
            <h3 className="text-sm font-semibold mb-1 flex items-center gap-2"><TrendingUp size={14} /> Reajuste em Lote</h3>
            <p className="text-xs text-muted-foreground mb-4">Aplica o percentual ao preço de venda. Use valor negativo para redução.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Grupo (deixe em branco para todos)</label>
                <select className={inp} value={reajusteGrupo} onChange={(e) => setReajusteGrupo(e.target.value)}>
                  <option value="">Todos os grupos</option>
                  {grupos.map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Percentual de reajuste</label>
                <div className="flex items-center gap-2">
                  <input type="number" step="0.1" className={`${inp} flex-1`} value={pctReajuste} onChange={(e) => setPctReajuste(e.target.value)} placeholder="Ex: 5 para +5% ou -3 para -3%" />
                  <span className="text-sm font-medium">%</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Afetará: {reajusteGrupo ? data.filter((d) => d.grupo === reajusteGrupo).length : data.length} itens
              </p>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowReajuste(false)} className="px-4 py-1.5 text-xs border border-border rounded hover:bg-muted">Cancelar</button>
              <button onClick={aplicarReajuste} disabled={saving} className="px-4 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90 disabled:opacity-50">
                Aplicar Reajuste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
