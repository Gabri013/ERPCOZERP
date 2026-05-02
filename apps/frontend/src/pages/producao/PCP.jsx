import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import FluxoProducao from '@/components/producao/FluxoProducao';
import { api } from '@/services/api';
import { opService } from '@/services/opService';
import { RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';

const STATUS_COLOR = {
  em_andamento: 'bg-orange-400',
  aberta: 'bg-blue-400',
  concluida: 'bg-green-400',
  planejada: 'bg-purple-400',
  pausada: 'bg-yellow-400',
  cancelada: 'bg-red-400',
};

function isoToWeekday(iso) {
  if (!iso) return null;
  return new Date(iso).getDay(); // 0=dom, 1=seg...
}

function buildWeekDays() {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      label: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
      date: d,
    };
  });
}

export default function PCP() {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const weekDays = buildWeekDays();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [woRes, pcpRes] = await Promise.allSettled([
        opService.getAll(),
        api.get('/api/production/pcp'),
      ]);
      if (woRes.status === 'fulfilled') setWorkOrders(woRes.value?.data ?? []);
      if (pcpRes.status === 'fulfilled') setAppointments(pcpRes.value?.data?.data ?? []);
    } catch (e) {
      setError(e?.message || 'Erro ao carregar PCP');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // KPIs from real data
  const abertas = workOrders.filter(o => ['aberta', 'planejada'].includes(o.status)).length;
  const emAndamento = workOrders.filter(o => o.status === 'em_andamento').length;
  const concluidas = workOrders.filter(o => o.status === 'concluida').length;
  const total = workOrders.length;

  // Build Gantt: for each WO, mark which weekdays it spans (start→due)
  const ganttRows = workOrders.filter(o => o.status !== 'concluida' && o.status !== 'cancelada').slice(0, 12).map(o => {
    const startDay = o.scheduledStart ? new Date(o.scheduledStart).getDay() : null;
    const endDay = o.dueDate ? new Date(o.dueDate).getDay() : null;

    const marks = weekDays.map(({ date }) => {
      const dd = date.getDay();
      if (startDay !== null && endDay !== null) {
        return dd >= startDay && dd <= endDay ? 1 : 0;
      }
      // If due date falls on this day
      if (o.dueDate && date.toDateString() === new Date(o.dueDate).toDateString()) return 1;
      return 0;
    });

    return {
      op: o.number || o.orderNumber || '—',
      id: o.id,
      produto: o.product?.name || o.productName || '—',
      maquina: o.routing?.code || '—',
      prioridade: o.priority || 'Normal',
      status: o.status || 'aberta',
      dias: marks,
    };
  });

  const cor = (status) => STATUS_COLOR[status] || 'bg-gray-400';

  return (
    <div>
      <PageHeader
        title="Planejamento e Controle de Produção (PCP)"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </button>
            <button
              type="button"
              onClick={() => navigate('/producao/ordens')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"
            >
              <ExternalLink size={12} /> Ver Ordens
            </button>
          </div>
        }
      />

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded px-3 py-2 mb-4">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <FluxoProducao />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'OPs Abertas', val: loading ? '…' : String(abertas), color: 'text-blue-600' },
          { label: 'Em Andamento', val: loading ? '…' : String(emAndamento), color: 'text-orange-600' },
          { label: 'Concluídas', val: loading ? '…' : String(concluidas), color: 'text-success' },
          { label: 'Total OPs', val: loading ? '…' : String(total), color: 'text-foreground' },
        ].map(k => (
          <div key={k.label} className="bg-white border border-border rounded px-4 py-3 text-center">
            <div className={`text-xl font-bold ${k.color}`}>{k.val}</div>
            <div className="text-[11px] text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Gantt da Semana */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold">Gantt da Semana</h3>
          <span className="text-[11px] text-muted-foreground">
            {weekDays[0]?.label} — {weekDays[4]?.label}
          </span>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Carregando ordens de produção…</div>
        ) : ganttRows.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma OP ativa para exibir no Gantt.
            <div className="mt-2">
              <button onClick={() => navigate('/producao/ordens')} className="text-primary text-xs hover:underline">
                Criar uma Ordem de Produção
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground w-24">OP</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Produto</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground w-28">Prioridade</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground w-24">Status</th>
                  {weekDays.map(d => (
                    <th key={d.label} className="px-3 py-2 font-medium text-muted-foreground text-center w-24">
                      {d.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ganttRows.map((o, i) => (
                  <tr
                    key={o.id || i}
                    className="border-b border-border hover:bg-muted/40 last:border-0 cursor-pointer"
                    onClick={() => o.id && navigate(`/producao/ordens/${o.id}`)}
                  >
                    <td className="px-3 py-2 font-medium text-primary">{o.op}</td>
                    <td className="px-3 py-2 max-w-[200px] truncate">{o.produto}</td>
                    <td className="px-3 py-2"><StatusBadge status={o.prioridade} /></td>
                    <td className="px-3 py-2"><StatusBadge status={o.status} /></td>
                    {o.dias.map((d, j) => (
                      <td key={j} className="px-3 py-2 text-center">
                        {d === 1 && <div className={`${cor(o.status)} rounded h-5 mx-1 opacity-80`} />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 py-2 border-t border-border flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          {Object.entries(STATUS_COLOR).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded ${v}`} />
              <span className="capitalize">{k.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
