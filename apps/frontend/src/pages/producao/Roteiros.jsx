import { useCallback, useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Plus, ChevronDown, ChevronRight, RefreshCw, Search, AlertCircle, Clock, Wrench } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';

function RoteiItem({ r }) {
  const [open, setOpen] = useState(false);
  const stages = r.stages || r.operacoes || [];
  const totalTempo = stages.reduce((s, e) => s + Number(e.timeMinutes || e.tempo || 0), 0);

  return (
    <div className="border border-border rounded-lg overflow-hidden mb-2 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {open
            ? <ChevronDown size={14} className="text-muted-foreground shrink-0" />
            : <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
          <div className="min-w-0">
            <span className="text-xs font-semibold truncate">{r.product?.name || r.produto || r.name || '—'}</span>
            <span className="text-[11px] text-muted-foreground ml-2">{r.code || r.codigo || ''}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {totalTempo > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock size={11} />
              {totalTempo} min/pc
            </div>
          )}
          <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {stages.length} operação{stages.length !== 1 ? 'ões' : ''}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-border">
          {stages.length === 0 ? (
            <div className="px-4 py-3 text-[12px] text-muted-foreground italic">Nenhuma operação cadastrada.</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground w-12">Seq.</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Operação</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground w-40">Máquina / Recurso</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground w-28">Tempo</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground w-24">Setup</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((o, i) => (
                  <tr key={o.id || i} className="border-t border-border hover:bg-muted/40">
                    <td className="px-4 py-2 font-bold text-primary">{o.sortOrder ?? o.seq ?? (i + 1) * 10}</td>
                    <td className="px-4 py-2">{o.name || o.descricao || '—'}</td>
                    <td className="px-4 py-2 text-muted-foreground">{o.machine?.name || o.maquina || '—'}</td>
                    <td className="px-4 py-2 text-right">{o.timeMinutes || o.tempo || 0} min/pc</td>
                    <td className="px-4 py-2 text-right">{o.setupMinutes || o.setup || 0} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default function Roteiros() {
  const [roteiros, setRoteiros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', productName: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/production/routings');
      setRoteiros(res.data?.data ?? res.data ?? []);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Erro ao carregar roteiros');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = roteiros.filter(r => {
    const q = search.toLowerCase();
    return !q
      || (r.product?.name || '').toLowerCase().includes(q)
      || (r.code || '').toLowerCase().includes(q);
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) return toast.error('Informe o código do roteiro.');
    setSaving(true);
    try {
      await api.post('/api/production/routings', { code: form.code, productName: form.productName || form.code });
      toast.success('Roteiro criado com sucesso.');
      setShowForm(false);
      setForm({ code: '', productName: '' });
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Erro ao criar roteiro.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Roteiros de Produção"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="p-1.5 border border-border rounded hover:bg-muted text-muted-foreground disabled:opacity-50"
              title="Atualizar"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"
            >
              <Plus size={13} /> Novo Roteiro
            </button>
          </div>
        }
      />

      {/* Formulário de criação */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-border rounded-lg p-4 mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Código *</label>
            <input
              className="border border-border rounded px-2.5 py-1.5 text-xs bg-white outline-none focus:border-primary w-36"
              placeholder="ROT-001"
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Produto / Nome</label>
            <input
              className="border border-border rounded px-2.5 py-1.5 text-xs bg-white outline-none focus:border-primary w-52"
              placeholder="Nome do produto / roteiro"
              value={form.productName}
              onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Criando…' : 'Criar'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Busca */}
      <div className="relative mb-3">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="w-full sm:w-72 border border-border rounded pl-7 pr-3 py-1.5 text-xs bg-white outline-none focus:border-primary"
          placeholder="Buscar por produto ou código..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded px-3 py-2 mb-3">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-sm text-muted-foreground">Carregando roteiros…</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center">
          <Wrench size={32} className="text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {search ? 'Nenhum roteiro encontrado.' : 'Nenhum roteiro cadastrado ainda.'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Criar o primeiro roteiro
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="text-[11px] text-muted-foreground mb-2">{filtered.length} roteiro{filtered.length !== 1 ? 's' : ''}</div>
          {filtered.map(r => <RoteiItem key={r.id || r.code} r={r} />)}
        </div>
      )}
    </div>
  );
}
