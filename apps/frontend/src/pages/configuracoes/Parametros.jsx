import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { getPlatformSettings, putPlatformSettings } from '@/services/platformApi';

const SECTIONS = [
  { titulo:'Estoque', params:[
    {key:'estoque_negativo', label:'Permitir Estoque Negativo', tipo:'bool', valor:false},
    {key:'lote_obrigatorio', label:'Controle de Lote Obrigatório', tipo:'bool', valor:true},
    {key:'metodo_custo', label:'Método de Custeio', tipo:'select', opcoes:['PEPS','UEPS','Médio Ponderado'], valor:'Médio Ponderado'},
  ]},
  { titulo:'Vendas', params:[
    {key:'aprovacao_desconto', label:'Requer Aprovação para Desconto acima de (%)', tipo:'number', valor:10},
    {key:'prazo_orcamento', label:'Validade Padrão de Orçamentos (dias)', tipo:'number', valor:30},
    {key:'bloq_cliente', label:'Bloquear Pedido de Cliente Inadimplente', tipo:'bool', valor:true},
  ]},
  { titulo:'Financeiro', params:[
    {key:'moeda', label:'Moeda Padrão', tipo:'select', opcoes:['BRL','USD','EUR'], valor:'BRL'},
    {key:'juros_atraso', label:'Juros de Atraso ao dia (%)', tipo:'number', valor:0.033},
    {key:'multa_atraso', label:'Multa por Atraso (%)', tipo:'number', valor:2},
  ]},
  { titulo:'Produção', params:[
    {key:'considera_setup', label:'Considerar Tempo de Setup no Cálculo', tipo:'bool', valor:true},
    {key:'eficiencia_padrao', label:'Eficiência Padrão de Produção (%)', tipo:'number', valor:85},
  ]},
];

function buildDefaults() {
  const d = {};
  SECTIONS.forEach((s) => s.params.forEach((p) => { d[p.key] = p.valor; }));
  return d;
}

export default function Parametros() {
  const [dados, setDados] = useState(buildDefaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const data = await getPlatformSettings();
        const p = data?.parametros && typeof data.parametros === 'object' ? data.parametros : {};
        if (!ok) return;
        setDados({ ...buildDefaults(), ...p });
      } catch {
        if (ok) toast.error('Não foi possível carregar parâmetros.');
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => { ok = false; };
  }, []);

  const upd = (k,v) => setDados(d=>({...d,[k]:v}));
  const inp = 'border border-border rounded px-2.5 py-1.5 text-xs bg-white outline-none focus:border-primary';

  const salvar = async () => {
    setSaving(true);
    try {
      await putPlatformSettings({ parametros: dados });
      toast.success('Parâmetros salvos.');
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Parâmetros do Sistema" breadcrumbs={['Início','Configurações','Parâmetros']}
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
      <div className="space-y-4">
        {SECTIONS.map(s=>(
          <div key={s.titulo} className="bg-white border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{s.titulo}</h3>
            </div>
            <div className="divide-y divide-border">
              {s.params.map(p=>(
                <div key={p.key} className="flex items-center justify-between px-4 py-3">
                  <label className="text-xs text-foreground">{p.label}</label>
                  {p.tipo==='bool' && (
                    <button type="button" onClick={()=>upd(p.key,!dados[p.key])}
                      className={`w-9 h-5 rounded-full transition-colors relative ${dados[p.key]?'cozinha-blue-bg':'bg-muted'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${dados[p.key]?'left-4':'left-0.5'}`}/>
                    </button>
                  )}
                  {p.tipo==='number' && (
                    <input type="number" className={`${inp} w-28 text-right`} value={dados[p.key]} onChange={e=>upd(p.key,Number(e.target.value))}/>
                  )}
                  {p.tipo==='select' && (
                    <select className={`${inp} w-44`} value={dados[p.key]} onChange={e=>upd(p.key,e.target.value)}>
                      {p.opcoes.map(o=><option key={o}>{o}</option>)}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
