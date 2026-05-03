import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus, ArrowRight, ShoppingCart, CheckCircle, XCircle } from 'lucide-react';
import { recordsServiceApi } from '@/services/recordsServiceApi';
import { api } from '@/services/api';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';

/** Alinhado ao backend `/api/crm/pipeline` e validação de estágios */
const ESTAGIOS = [
  { value: 'Novo', label: 'Novo', color: 'bg-slate-100 text-slate-800', descricao: 'Entrada no funil', prob: 10 },
  { value: 'Qualificado', label: 'Qualificado', color: 'bg-blue-100 text-blue-800', descricao: 'Qualificado para seguir', prob: 25 },
  { value: 'Em orçamento', label: 'Em orçamento', color: 'bg-indigo-100 text-indigo-800', descricao: 'Proposta em elaboração', prob: 45 },
  { value: 'Proposta enviada', label: 'Proposta enviada', color: 'bg-sky-100 text-sky-800', descricao: 'Aguardando retorno', prob: 55 },
  { value: 'Negociação', label: 'Negociação', color: 'bg-orange-100 text-orange-800', descricao: 'Negociando termos', prob: 75 },
  { value: 'Aguardando cliente', label: 'Aguardando cliente', color: 'bg-amber-100 text-amber-900', descricao: 'Aguardando cliente ou áreas internas', prob: 85 },
  { value: 'Fechado ganho', label: 'Fechado ganho', color: 'bg-green-100 text-green-800', descricao: 'Venda ganha', prob: 100 },
  { value: 'Fechado perdido', label: 'Fechado perdido', color: 'bg-red-100 text-red-800', descricao: 'Oportunidade perdida', prob: 0 },
];

const STAGE_FLOW = ['Novo', 'Qualificado', 'Em orçamento', 'Proposta enviada', 'Negociação', 'Aguardando cliente'];

function nextPipelineStage(current) {
  const i = STAGE_FLOW.indexOf(current);
  if (i < 0 || i >= STAGE_FLOW.length - 1) return null;
  return STAGE_FLOW[i + 1];
}

function BadgeEstagio({ estagio }) {
  const cfg = ESTAGIOS.find((e) => e.value === estagio);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${cfg?.color || 'bg-gray-100 text-gray-600'}`}>
      {estagio || '—'}
    </span>
  );
}

const fmtR = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const FORM_EMPTY = {
  titulo: '',
  empresa: '',
  contato: '',
  produto_interesse: '',
  valor: 0,
  estagio: 'Novo',
  probabilidade: 10,
  fechamento: '',
  responsavel: '',
  responsavelId: '',
  observacoes: '',
};

export default function Oportunidades() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(FORM_EMPTY);
  const [detalhe, setDetalhe] = useState(null);
  const [filtroEstagio, setFiltroEstagio] = useState('');
  const [search, setSearch] = useState('');
  const [assignable, setAssignable] = useState([]);

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    let ok = true;
    api.get('/api/crm/assignable-users').then((res) => {
      const rows = res?.data?.data;
      if (ok && Array.isArray(rows)) setAssignable(rows);
    }).catch(() => {});
    return () => { ok = false; };
  }, []);

  useEffect(() => {
    if (!showModal) return;
    setForm({
      ...FORM_EMPTY,
      responsavelId: user?.id || '',
      responsavel: user?.fullName || user?.nome || '',
    });
  }, [showModal, user]);

  async function load() {
    setLoading(true);
    try {
      setData(await recordsServiceApi.list('crm_oportunidade'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const avancarEstagio = async (opp, novoEstagio) => {
    try {
      await recordsServiceApi.update(opp.id, { ...opp, estagio: novoEstagio });
      await load();
      setDetalhe((d) => d ? { ...d, estagio: novoEstagio } : null);
      toast.success(`Estágio avançado para "${novoEstagio}"`);
    } catch (e) {
      toast.error((e?.body && e.body.error) || e?.message || 'Falha ao atualizar estágio');
    }
  };

  const criarOrcamento = (opp) => {
    navigate('/vendas/orcamentos');
    toast.info('Crie o orçamento vinculado a esta oportunidade.');
    setDetalhe(null);
  };

  const handleSave = async () => {
    if (!form.titulo) return toast.error('Informe o título da oportunidade');
    if (!form.responsavelId && !String(form.responsavel || '').trim()) {
      return toast.error('Selecione o responsável.');
    }
    setSaving(true);
    try {
      await recordsServiceApi.create('crm_oportunidade', { ...form, estagio: 'Novo' });
      await load();
      setShowModal(false);
      setForm(FORM_EMPTY);
      toast.success('Oportunidade criada!');
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    return data.filter((r) => {
      const s = search.toLowerCase();
      return (
        (!s || r.titulo?.toLowerCase().includes(s) || r.empresa?.toLowerCase().includes(s) || r.contato?.toLowerCase().includes(s)) &&
        (!filtroEstagio || r.estagio === filtroEstagio)
      );
    });
  }, [data, search, filtroEstagio]);

  // KPIs
  const kpis = useMemo(() => {
    const ativas = data.filter((d) => !['Fechado ganho', 'Fechado perdido'].includes(d.estagio));
    const ganhas = data.filter((d) => d.estagio === 'Fechado ganho');
    const pipeline = ativas.reduce((s, d) => s + Number(d.valor || 0), 0);
    const taxaConv = data.length > 0 ? Math.round((ganhas.length / data.length) * 100) : 0;
    return { ativas: ativas.length, ganhas: ganhas.length, pipeline, taxaConv };
  }, [data]);

  // Contagem por estágio para o funil
  const porEstagio = useMemo(() => {
    const c = {};
    for (const r of data) c[r.estagio] = (c[r.estagio] || 0) + 1;
    return c;
  }, [data]);

  const columns = [
    {
      key: 'titulo', label: 'Oportunidade',
      render: (v, row) => (
        <button className="text-primary hover:underline font-medium" onClick={(e) => { e.stopPropagation(); setDetalhe(row); }}>
          {v}
        </button>
      ),
    },
    { key: 'empresa', label: 'Empresa', width: 150 },
    { key: 'contato', label: 'Contato', width: 120 },
    { key: 'produto_interesse', label: 'Produto', width: 160 },
    { key: 'valor', label: 'Valor', width: 110, render: fmtR },
    {
      key: 'estagio', label: 'Estágio', width: 150,
      render: (v) => <BadgeEstagio estagio={v} />, sortable: false,
    },
    {
      key: 'probabilidade', label: '%', width: 55,
      render: (v) => (
        <span className={`font-bold ${v >= 80 ? 'text-green-600' : v >= 50 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
          {v}%
        </span>
      ),
    },
    {
      key: 'fechamento', label: 'Fechamento', width: 95,
      render: (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—',
    },
    { key: 'responsavel', label: 'Responsável', width: 110 },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Oportunidades"
        breadcrumbs={['Início', 'CRM', 'Oportunidades']}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/crm/leads')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"
            >
              Ver Leads
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"
            >
              <Plus size={13} /> Nova Oportunidade
            </button>
          </div>
        }
      />

      {/* ── KPIs ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pipeline Total', value: fmtR(kpis.pipeline), color: 'text-primary' },
          { label: 'Oportunidades Ativas', value: kpis.ativas, color: 'text-foreground' },
          { label: 'Ganhas (total)', value: kpis.ganhas, color: 'text-green-600' },
          { label: 'Taxa de Conversão', value: `${kpis.taxaConv}%`, color: kpis.taxaConv >= 50 ? 'text-green-600' : 'text-yellow-600' },
        ].map((k) => (
          <div key={k.label} className="erp-card px-4 py-3">
            <div className={`text-lg font-bold ${k.color}`}>{k.value}</div>
            <div className="text-[11px] text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Funil por estágio ─────────────────────────────────────────────── */}
      <div className="erp-card p-3">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Funil de Vendas</p>
        <div className="flex flex-wrap gap-2">
          {ESTAGIOS.filter((e) => !['Fechado perdido'].includes(e.value)).map((e) => {
            const n = porEstagio[e.value] || 0;
            return (
              <button
                key={e.value}
                type="button"
                onClick={() => setFiltroEstagio(filtroEstagio === e.value ? '' : e.value)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-colors ${
                  filtroEstagio === e.value
                    ? `${e.color} border-current ring-1 ring-current/30`
                    : 'border-border hover:bg-muted'
                }`}
              >
                <span>{e.label}</span>
                <span className={`font-bold rounded-full px-1.5 py-0.5 text-[10px] ${n > 0 ? e.color : 'bg-muted text-muted-foreground'}`}>
                  {n}
                </span>
              </button>
            );
          })}
          {filtroEstagio && (
            <button
              type="button"
              onClick={() => setFiltroEstagio('')}
              className="text-xs text-muted-foreground hover:text-foreground px-2"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* ── Tabela ───────────────────────────────────────────────────────── */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-4 pt-3 pb-2 flex items-center gap-3 border-b border-border">
          <input
            type="search"
            placeholder="Buscar oportunidade, empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 px-3 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="text-xs text-muted-foreground hover:text-foreground">
              Limpar
            </button>
          )}
        </div>
        <DataTable columns={columns} data={filtered} onRowClick={(row) => setDetalhe(row)} loading={loading} />
      </div>

      {/* ── Modal Nova Oportunidade ───────────────────────────────────────── */}
      {showModal && (
        <FormModal title="Nova Oportunidade" onClose={() => setShowModal(false)} onSave={handleSave} saving={saving} size="md">
          <div className="space-y-3">
            <div>
              <label className={lbl}>Título da Oportunidade {req}</label>
              <input className={inp} value={form.titulo} onChange={(e) => upd('titulo', e.target.value)} placeholder="Ex.: Tanque inox 500L — Empresa X" />
            </div>
            <div>
              <label className={lbl}>Produto / Serviço de Interesse</label>
              <input className={inp} value={form.produto_interesse} onChange={(e) => upd('produto_interesse', e.target.value)} placeholder="Descrição do produto solicitado pelo cliente" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Empresa</label><input className={inp} value={form.empresa} onChange={(e) => upd('empresa', e.target.value)} /></div>
              <div><label className={lbl}>Contato</label><input className={inp} value={form.contato} onChange={(e) => upd('contato', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Valor Estimado (R$)</label><input type="number" min="0" step="0.01" className={inp} value={form.valor} onChange={(e) => upd('valor', Number(e.target.value))} /></div>
              <div>
                <label className={lbl}>Estágio inicial</label>
                <input className={`${inp} bg-muted`} readOnly value="Novo (use Pipeline para avançar)" title="Novas oportunidades entram como Novo" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={lbl}>Probabilidade (%)</label><input type="number" min="0" max="100" className={inp} value={form.probabilidade} onChange={(e) => upd('probabilidade', Number(e.target.value))} /></div>
              <div><label className={lbl}>Data de Fechamento</label><input type="date" className={inp} value={form.fechamento} onChange={(e) => upd('fechamento', e.target.value)} /></div>
              <div>
                <label className={lbl}>Responsável {req}</label>
                <select
                  className={inp}
                  value={form.responsavelId}
                  onChange={(e) => {
                    const u = assignable.find((x) => x.id === e.target.value);
                    upd('responsavelId', e.target.value);
                    upd('responsavel', u?.fullName || '');
                  }}
                >
                  <option value="">Selecione...</option>
                  {assignable.map((u) => (
                    <option key={u.id} value={u.id}>{u.fullName || u.email}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={lbl}>Observações</label>
              <textarea className={`${inp} resize-none`} rows={2} value={form.observacoes} onChange={(e) => upd('observacoes', e.target.value)} />
            </div>
          </div>
        </FormModal>
      )}

      {/* ── Modal Detalhe ─────────────────────────────────────────────────── */}
      {detalhe && (
        <DetalheModal title={detalhe.titulo} subtitle={detalhe.empresa} onClose={() => setDetalhe(null)}>
          <div className="grid grid-cols-2 gap-2.5 text-xs mb-4">
            {[
              ['Empresa', detalhe.empresa], ['Contato', detalhe.contato],
              ['Responsável', detalhe.responsavel],
              ['Fechamento', detalhe.fechamento ? new Date(detalhe.fechamento + 'T00:00').toLocaleDateString('pt-BR') : '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v || '—'}</span>
              </div>
            ))}
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-muted-foreground">Valor</span>
              <span className="font-bold text-foreground">{fmtR(detalhe.valor)}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-muted-foreground">Probabilidade</span>
              <span className={`font-bold ${detalhe.probabilidade >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>{detalhe.probabilidade}%</span>
            </div>
          </div>

          {/* Estágio atual + descrição */}
          <div className="mb-4 p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Estágio Atual</span>
              <BadgeEstagio estagio={detalhe.estagio} />
            </div>
            <p className="text-xs text-muted-foreground">
              {ESTAGIOS.find((e) => e.value === detalhe.estagio)?.descricao}
            </p>
          </div>

          {/* Produto de interesse */}
          {detalhe.produto_interesse && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <p className="text-[11px] font-semibold text-blue-700 mb-1">Produto / Serviço</p>
              <p className="text-xs text-blue-800">{detalhe.produto_interesse}</p>
            </div>
          )}

          {/* Ações de avanço no funil */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Avançar no Funil</p>
            <p className="text-[10px] text-muted-foreground mb-2">
              Fora do estágio &quot;Novo&quot;, o CRM exige atividade pendente (data ≥ hoje) vinculada por <code className="text-[10px]">oportunidade_id</code>.
              Prefira arrastar no Pipeline (menu CRM).
            </p>
            <div className="flex flex-wrap gap-2">
              {nextPipelineStage(detalhe.estagio) && !['Fechado ganho', 'Fechado perdido'].includes(detalhe.estagio) && (
                <button
                  type="button"
                  onClick={() => avancarEstagio(detalhe, nextPipelineStage(detalhe.estagio))}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"
                >
                  <ArrowRight size={12} /> Próximo: {nextPipelineStage(detalhe.estagio)}
                </button>
              )}
              {detalhe.estagio === 'Em orçamento' && (
                <button
                  type="button"
                  onClick={() => criarOrcamento(detalhe)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"
                >
                  <ShoppingCart size={12} /> Ir a Orçamentos
                </button>
              )}
              {!['Fechado ganho', 'Fechado perdido'].includes(detalhe.estagio) && (
                <button type="button" onClick={() => avancarEstagio(detalhe, 'Fechado ganho')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:opacity-90">
                  <CheckCircle size={12} /> Marcar Ganho
                </button>
              )}
              {!['Fechado ganho', 'Fechado perdido'].includes(detalhe.estagio) && (
                <button type="button" onClick={() => avancarEstagio(detalhe, 'Fechado perdido')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50">
                  <XCircle size={12} /> Marcar Perdido
                </button>
              )}
            </div>
          </div>
        </DetalheModal>
      )}
    </div>
  );
}
