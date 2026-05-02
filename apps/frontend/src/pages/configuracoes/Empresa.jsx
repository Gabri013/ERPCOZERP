import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Save, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { getPlatformSettings, putPlatformSettings } from '@/services/platformApi';

const emptyCompany = {
  razao_social: '',
  nome_fantasia: '',
  cnpj: '',
  ie: '',
  im: '',
  regime: 'Lucro Real',
  cep: '',
  endereco: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: 'SP',
  telefone: '',
  email: '',
  site: '',
};

export default function Empresa() {
  const [form, setForm] = useState(emptyCompany);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const data = await getPlatformSettings();
        if (!ok) return;
        const c = data?.company && typeof data.company === 'object' ? data.company : {};
        setForm({ ...emptyCompany, ...c });
      } catch {
        if (ok) toast.error('Não foi possível carregar dados da empresa.');
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => { ok = false; };
  }, []);

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const inp = 'w-full border border-border rounded px-2.5 py-1.5 text-xs bg-white outline-none focus:border-primary';
  const lbl = 'block text-[11px] text-muted-foreground mb-0.5';

  const salvar = async () => {
    setSaving(true);
    try {
      await putPlatformSettings({ company: form });
      toast.success('Dados da empresa salvos.');
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Dados da Empresa" breadcrumbs={['Início','Configurações','Empresa']}
        actions={(
          <button
            type="button"
            disabled={loading || saving}
            onClick={salvar}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90 disabled:opacity-50"
          >
            <Save size={13}/> {saving ? 'Salvando…' : 'Salvar'}
          </button>
        )}
      />
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
      <div className="bg-white border border-border rounded-lg p-5">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
          <div className="w-14 h-14 cozinha-blue-bg rounded-lg flex items-center justify-center"><Building2 size={28} className="text-white"/></div>
          <div>
            <div className="font-semibold text-sm">{form.razao_social || '—'}</div>
            <div className="text-xs text-muted-foreground">CNPJ: {form.cnpj || '—'}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="col-span-2"><label className={lbl}>Razão Social</label><input className={inp} value={form.razao_social} onChange={e=>upd('razao_social',e.target.value)}/></div>
          <div><label className={lbl}>Nome Fantasia</label><input className={inp} value={form.nome_fantasia} onChange={e=>upd('nome_fantasia',e.target.value)}/></div>
          <div><label className={lbl}>CNPJ</label><input className={inp} value={form.cnpj} onChange={e=>upd('cnpj',e.target.value)}/></div>
          <div><label className={lbl}>Inscrição Estadual</label><input className={inp} value={form.ie} onChange={e=>upd('ie',e.target.value)}/></div>
          <div><label className={lbl}>Regime Tributário</label>
            <select className={inp} value={form.regime} onChange={e=>upd('regime',e.target.value)}>
              {['Simples Nacional','Lucro Presumido','Lucro Real'].map(r=><option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 pt-2 border-t border-border">Endereço</div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div><label className={lbl}>CEP</label><input className={inp} value={form.cep} onChange={e=>upd('cep',e.target.value)}/></div>
          <div className="col-span-2"><label className={lbl}>Endereço</label><input className={inp} value={form.endereco} onChange={e=>upd('endereco',e.target.value)}/></div>
          <div><label className={lbl}>Complemento</label><input className={inp} value={form.complemento} onChange={e=>upd('complemento',e.target.value)}/></div>
          <div><label className={lbl}>Bairro</label><input className={inp} value={form.bairro} onChange={e=>upd('bairro',e.target.value)}/></div>
          <div className="col-span-2"><label className={lbl}>Cidade</label><input className={inp} value={form.cidade} onChange={e=>upd('cidade',e.target.value)}/></div>
          <div><label className={lbl}>Estado</label><input className={inp} value={form.estado} onChange={e=>upd('estado',e.target.value)}/></div>
        </div>
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 pt-2 border-t border-border">Contato</div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className={lbl}>Telefone</label><input className={inp} value={form.telefone} onChange={e=>upd('telefone',e.target.value)}/></div>
          <div><label className={lbl}>E-mail</label><input className={inp} value={form.email} onChange={e=>upd('email',e.target.value)}/></div>
          <div><label className={lbl}>Site</label><input className={inp} value={form.site} onChange={e=>upd('site',e.target.value)}/></div>
        </div>
      </div>
      )}
    </div>
  );
}
