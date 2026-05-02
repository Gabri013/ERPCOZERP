import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus, Instagram, Facebook, Globe, MessageCircle, Users, Phone, Mail, ArrowRight } from 'lucide-react';
import { recordsServiceApi } from '@/services/recordsServiceApi';
import { toast } from 'sonner';

// ─── Origens de leads ─────────────────────────────────────────────────────────
const ORIGENS = [
  { value: 'Instagram',    label: 'Instagram',    color: 'bg-pink-100 text-pink-700',   icon: Instagram },
  { value: 'Facebook',     label: 'Facebook',     color: 'bg-blue-100 text-blue-700',   icon: Facebook },
  { value: 'OLX',          label: 'OLX',          color: 'bg-orange-100 text-orange-700', icon: Globe },
  { value: 'WhatsApp',     label: 'WhatsApp',     color: 'bg-green-100 text-green-700', icon: MessageCircle },
  { value: 'Indicação',    label: 'Indicação',    color: 'bg-purple-100 text-purple-700', icon: Users },
  { value: 'Site',         label: 'Site',         color: 'bg-slate-100 text-slate-700', icon: Globe },
  { value: 'Ligação',      label: 'Ligação',      color: 'bg-gray-100 text-gray-700',   icon: Phone },
  { value: 'E-mail',       label: 'E-mail',       color: 'bg-teal-100 text-teal-700',   icon: Mail },
  { value: 'Outro',        label: 'Outro',        color: 'bg-gray-100 text-gray-600',   icon: Globe },
];

const QUALIFICACAO = [
  { value: 'Quente', color: 'bg-red-100 text-red-700' },
  { value: 'Morno',  color: 'bg-yellow-100 text-yellow-700' },
  { value: 'Frio',   color: 'bg-blue-100 text-blue-700' },
];

function BadgeOrigem({ origem }) {
  const cfg = ORIGENS.find((o) => o.value === origem);
  if (!cfg) return <span className="text-muted-foreground text-xs">{origem || '—'}</span>;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${cfg.color}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

function BadgeQualif({ q }) {
  const cfg = QUALIFICACAO.find((x) => x.value === q);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${cfg?.color || 'bg-gray-100 text-gray-600'}`}>
      {q || '—'}
    </span>
  );
}

const FORM_EMPTY = {
  nome: '', empresa: '', cargo: '', email: '', telefone: '',
  origem: 'Instagram', qualificacao: 'Morno', responsavel: '',
  observacoes: '', produto_interesse: '',
};

export default function Leads() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(FORM_EMPTY);
  const [detalhe, setDetalhe] = useState(null);
  const [search, setSearch] = useState('');
  const [filtroOrigem, setFiltroOrigem] = useState('');
  const [filtroQualif, setFiltroQualif] = useState('');

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function load() {
    setLoading(true);
    try {
      setData(await recordsServiceApi.list('crm_lead'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.nome) return toast.error('Informe o nome do lead');
    setSaving(true);
    try {
      await recordsServiceApi.create('crm_lead', form);
      await load();
      setShowModal(false);
      setForm(FORM_EMPTY);
      toast.success('Lead cadastrado com sucesso!');
    } finally {
      setSaving(false);
    }
  };

  const converterEmOportunidade = async (lead) => {
    try {
      await recordsServiceApi.create('crm_oportunidade', {
        titulo: lead.produto_interesse || `Oportunidade — ${lead.nome}`,
        empresa: lead.empresa || '',
        contato: lead.nome,
        valor: 0,
        estagio: 'Qualificação',
        probabilidade: 30,
        responsavel: lead.responsavel || '',
        lead_id: lead.id,
      });
      toast.success('Lead convertido em Oportunidade!');
      setDetalhe(null);
      navigate('/crm/oportunidades');
    } catch (e) {
      toast.error(e?.message || 'Falha ao converter lead');
    }
  };

  const filtered = useMemo(() => {
    return data.filter((r) => {
      const s = search.toLowerCase();
      return (
        (!s || r.nome?.toLowerCase().includes(s) || r.empresa?.toLowerCase().includes(s) || r.email?.toLowerCase().includes(s)) &&
        (!filtroOrigem || r.origem === filtroOrigem) &&
        (!filtroQualif || r.qualificacao === filtroQualif)
      );
    });
  }, [data, search, filtroOrigem, filtroQualif]);

  // Contagens por origem
  const porOrigem = useMemo(() => {
    const c = {};
    for (const r of data) c[r.origem] = (c[r.origem] || 0) + 1;
    return c;
  }, [data]);

  const columns = [
    {
      key: 'nome', label: 'Nome',
      render: (v, row) => (
        <button className="text-primary hover:underline font-medium" onClick={(e) => { e.stopPropagation(); setDetalhe(row); }}>
          {v}
        </button>
      ),
    },
    { key: 'empresa', label: 'Empresa', width: 150 },
    { key: 'produto_interesse', label: 'Produto de Interesse', width: 180 },
    { key: 'telefone', label: 'Telefone', width: 130 },
    { key: 'origem', label: 'Origem', width: 130, render: (v) => <BadgeOrigem origem={v} />, sortable: false },
    { key: 'qualificacao', label: 'Temperatura', width: 100, render: (v) => <BadgeQualif q={v} />, sortable: false },
    { key: 'responsavel', label: 'Responsável', width: 110 },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Leads"
        breadcrumbs={['Início', 'CRM', 'Leads']}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"
          >
            <Plus size={13} /> Novo Lead
          </button>
        }
      />

      {/* ── Estatísticas por origem ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
        {ORIGENS.filter((o) => porOrigem[o.value] > 0 || ['Instagram','Facebook','OLX','WhatsApp'].includes(o.value)).map((o) => {
          const Icon = o.icon;
          const count = porOrigem[o.value] || 0;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => setFiltroOrigem(filtroOrigem === o.value ? '' : o.value)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                filtroOrigem === o.value
                  ? `${o.color} border-current ring-2 ring-offset-1 ring-current/30`
                  : 'border-border hover:bg-muted'
              }`}
            >
              <Icon size={14} className="shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{o.label}</div>
                <div className="text-[11px] text-muted-foreground">{count} lead{count !== 1 ? 's' : ''}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Filtros de temperatura ───────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs text-muted-foreground">Temperatura:</span>
        {QUALIFICACAO.map((q) => (
          <button
            key={q.value}
            type="button"
            onClick={() => setFiltroQualif(filtroQualif === q.value ? '' : q.value)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
              filtroQualif === q.value ? `${q.color} border-current` : 'border-border hover:bg-muted text-muted-foreground'
            }`}
          >
            {q.value}
          </button>
        ))}
        {(filtroOrigem || filtroQualif || search) && (
          <button
            type="button"
            onClick={() => { setFiltroOrigem(''); setFiltroQualif(''); setSearch(''); }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Limpar filtros
          </button>
        )}
        <div className="ml-auto">
          <input
            type="search"
            placeholder="Buscar lead, empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 px-3 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* ── Tabela ───────────────────────────────────────────────────────── */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <DataTable columns={columns} data={filtered} onRowClick={(row) => setDetalhe(row)} loading={loading} />
      </div>

      {/* ── Modal Novo Lead ───────────────────────────────────────────────── */}
      {showModal && (
        <FormModal title="Novo Lead" onClose={() => setShowModal(false)} onSave={handleSave} saving={saving} size="md">
          <div className="space-y-3">
            <div>
              <label className={lbl}>Nome do Lead {req}</label>
              <input className={inp} value={form.nome} onChange={(e) => upd('nome', e.target.value)} placeholder="Nome do cliente/contato" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Empresa</label><input className={inp} value={form.empresa} onChange={(e) => upd('empresa', e.target.value)} /></div>
              <div><label className={lbl}>Cargo</label><input className={inp} value={form.cargo} onChange={(e) => upd('cargo', e.target.value)} /></div>
            </div>
            <div>
              <label className={lbl}>Produto / Serviço de Interesse</label>
              <input className={inp} value={form.produto_interesse} onChange={(e) => upd('produto_interesse', e.target.value)} placeholder="Ex.: Tanque inox 500L, Mesa de processamento..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>E-mail</label><input type="email" className={inp} value={form.email} onChange={(e) => upd('email', e.target.value)} /></div>
              <div><label className={lbl}>Telefone / WhatsApp</label><input className={inp} value={form.telefone} onChange={(e) => upd('telefone', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={lbl}>Canal de Origem {req}</label>
                <select className={inp} value={form.origem} onChange={(e) => upd('origem', e.target.value)}>
                  {ORIGENS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Temperatura</label>
                <select className={inp} value={form.qualificacao} onChange={(e) => upd('qualificacao', e.target.value)}>
                  {QUALIFICACAO.map((q) => <option key={q.value}>{q.value}</option>)}
                </select>
              </div>
              <div><label className={lbl}>Vendedor Responsável</label><input className={inp} value={form.responsavel} onChange={(e) => upd('responsavel', e.target.value)} /></div>
            </div>
            <div>
              <label className={lbl}>Observações</label>
              <textarea className={`${inp} resize-none`} rows={2} value={form.observacoes} onChange={(e) => upd('observacoes', e.target.value)} placeholder="Informações adicionais, contexto da conversa..." />
            </div>
          </div>
        </FormModal>
      )}

      {/* ── Modal Detalhe ─────────────────────────────────────────────────── */}
      {detalhe && (
        <DetalheModal
          title={detalhe.nome}
          subtitle={detalhe.empresa || 'Lead'}
          onClose={() => setDetalhe(null)}
        >
          <div className="grid grid-cols-2 gap-2.5 text-xs mb-4">
            {[
              ['Empresa', detalhe.empresa],
              ['Cargo', detalhe.cargo],
              ['Telefone', detalhe.telefone],
              ['E-mail', detalhe.email],
              ['Responsável', detalhe.responsavel],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v || '—'}</span>
              </div>
            ))}
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-muted-foreground">Origem</span>
              <BadgeOrigem origem={detalhe.origem} />
            </div>
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-muted-foreground">Temperatura</span>
              <BadgeQualif q={detalhe.qualificacao} />
            </div>
          </div>
          {detalhe.produto_interesse && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <p className="text-[11px] font-semibold text-blue-700 mb-1">Produto / Serviço de Interesse</p>
              <p className="text-xs text-blue-800">{detalhe.produto_interesse}</p>
            </div>
          )}
          {detalhe.observacoes && (
            <div className="mb-4 p-3 bg-muted/50 rounded-md">
              <p className="text-[11px] font-semibold text-muted-foreground mb-1">Observações</p>
              <p className="text-xs text-foreground/70">{detalhe.observacoes}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => converterEmOportunidade(detalhe)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"
            >
              <ArrowRight size={12} />
              Converter em Oportunidade
            </button>
            <button
              type="button"
              onClick={() => { setDetalhe(null); navigate('/crm/oportunidades'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"
            >
              Ver Oportunidades
            </button>
          </div>
        </DetalheModal>
      )}
    </div>
  );
}
