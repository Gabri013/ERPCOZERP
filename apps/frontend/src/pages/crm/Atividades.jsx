import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Phone, Mail, Users, Calendar, Plus } from 'lucide-react';
import { recordsServiceApi } from '@/services/recordsServiceApi';
import { toast } from 'sonner';

const tipoIcon = { 'Reunião': <Users size={13} />, 'Ligação': <Phone size={13} />, 'E-mail': <Mail size={13} />, 'Visita': <Calendar size={13} />, Tarefa: <Calendar size={13} />, Outro: <Calendar size={13} /> };
const tipoCor = { 'Reunião': 'bg-blue-100 text-blue-700', 'Ligação': 'bg-green-100 text-green-700', 'E-mail': 'bg-purple-100 text-purple-700', 'Visita': 'bg-orange-100 text-orange-700', Tarefa: 'bg-slate-100 text-slate-700', Outro: 'bg-slate-100 text-slate-700' };

export default function Atividades() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const list = await recordsServiceApi.list('crm_atividade');
        if (!ok) return;
        setRows(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!ok) return;
        toast.error(e?.message || 'Erro ao carregar atividades.');
        setRows([]);
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => { ok = false; };
  }, []);

  return (
    <div>
      <PageHeader title="Atividades" breadcrumbs={['Início', 'CRM', 'Atividades']}
        actions={<button type="button" className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Nova Atividade</button>}
      />
      <div className="bg-white border border-border rounded-lg divide-y divide-border">
        {loading && <div className="px-4 py-8 text-center text-xs text-muted-foreground">Carregando…</div>}
        {!loading && rows.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">Nenhuma atividade cadastrada (entidade crm_atividade).</div>
        )}
        {!loading && rows.map((a) => {
          const tipo = a.tipo || 'Tarefa';
          const dataStr = a.data ? String(a.data).slice(0, 10) : '';
          const horaStr = a.data && String(a.data).length > 12 ? new Date(a.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
          const icon = tipoIcon[tipo] || tipoIcon.Tarefa;
          const cor = tipoCor[tipo] || tipoCor.Tarefa;
          const statusOk = String(a.status || '').toLowerCase().includes('concl');
          return (
            <div key={a.id} className="flex items-start gap-4 px-4 py-3 hover:bg-nomus-blue-light transition-colors">
              <div className="w-20 text-center shrink-0">
                <div className="text-xs font-bold text-foreground">{dataStr ? new Date(dataStr + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '—'}</div>
                <div className="text-[11px] text-muted-foreground">{horaStr || '—'}</div>
              </div>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium shrink-0 ${cor}`}>
                {icon}{tipo}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold">{a.titulo || '—'}</div>
                <div className="text-[11px] text-muted-foreground">{a.relacionamento || '—'}{a.observacao ? ` — ${a.observacao}` : ''}</div>
              </div>
              <div className="text-[11px] text-muted-foreground shrink-0">{a.responsavel || '—'}</div>
              <div className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 ${statusOk ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {a.status || '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
