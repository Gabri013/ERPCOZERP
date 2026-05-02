import { useCallback, useEffect, useMemo, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import PageHeader from '@/components/common/PageHeader';
import { api } from '@/services/api';
import { toast } from 'sonner';

function parseRecord(row) {
  const d = row?.data && typeof row.data === 'object' ? row.data : {};
  return {
    id: row.id,
    titulo: String(d.titulo || d.title || '—'),
    empresa: String(d.empresa || d.company || '—'),
    valor: Number(d.valor || d.value || 0),
    responsavel: String(d.responsavel || d.owner || '—'),
    estagio: String(d.estagio || d.stage || ''),
  };
}

const COLORS = [
  'bg-slate-200',
  'bg-blue-200',
  'bg-yellow-200',
  'bg-orange-200',
  'bg-teal-200',
  'bg-green-200',
];

export default function Pipeline() {
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState([]);
  const [columns, setColumns] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/crm/pipeline');
      const body = res?.data;
      if (!body?.success) throw new Error('Resposta inválida');
      const st = Array.isArray(body.data?.stages) ? body.data.stages : [];
      const cols = body.data?.columns && typeof body.data.columns === 'object' ? body.data.columns : {};
      setStages(st);
      const mapped = {};
      for (const s of st) {
        mapped[s] = (cols[s] || []).map(parseRecord);
      }
      setColumns(mapped);
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || 'Erro ao carregar pipeline.');
      setStages([]);
      setColumns({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceStage = source.droppableId;
    const destStage = destination.droppableId;

    const next = { ...columns };
    const srcList = [...(next[sourceStage] || [])];
    const [removed] = srcList.splice(source.index, 1);
    if (!removed) return;

    if (sourceStage === destStage) {
      srcList.splice(destination.index, 0, removed);
      next[sourceStage] = srcList;
    } else {
      const destList = [...(next[destStage] || [])];
      const moved = { ...removed, estagio: destStage };
      destList.splice(destination.index, 0, moved);
      next[sourceStage] = srcList;
      next[destStage] = destList;
    }
    setColumns(next);

    try {
      await api.post('/api/crm/pipeline/move', { recordId: draggableId, stage: destStage });
      toast.success('Oportunidade atualizada.');
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || 'Falha ao mover.');
      await load();
    }
  };

  const stageMeta = useMemo(() => {
    return stages.map((s, i) => ({
      nome: s,
      cor: COLORS[i % COLORS.length],
    }));
  }, [stages]);

  return (
    <div>
      <PageHeader title="Pipeline de Vendas" breadcrumbs={['Início','CRM','Pipeline']} />
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando pipeline…</p>
      ) : (
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stageMeta.map((e) => (
            <div key={e.nome} className="min-w-[220px] flex-1">
              <div className={`rounded-t-lg px-3 py-2 ${e.cor}`}>
                <div className="text-xs font-bold">{e.nome}</div>
                <div className="text-[10px] text-muted-foreground">
                  {(columns[e.nome] || []).length} oportunidade(s)
                </div>
              </div>
              <Droppable droppableId={e.nome}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[300px] rounded-b-lg p-2 ${
                      snapshot.isDraggingOver ? 'bg-primary/5 ring-1 ring-primary/20' : 'bg-muted/50'
                    }`}
                  >
                    {(columns[e.nome] || []).map((c, idx) => (
                      <Draggable key={c.id} draggableId={c.id} index={idx}>
                        {(drag, snap) => (
                          <div
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            {...drag.dragHandleProps}
                            className={`rounded-lg border border-border bg-white p-3 transition-shadow ${
                              snap.isDragging ? 'shadow-lg ring-2 ring-primary/30' : 'hover:shadow-md'
                            }`}
                          >
                            <div className="text-xs font-semibold leading-tight text-foreground mb-1">{c.titulo}</div>
                            <div className="text-[11px] text-muted-foreground mb-2">{c.empresa}</div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-primary">
                                R$ {c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{c.responsavel}</span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
      )}
      {!loading && stages.length === 0 && (
        <p className="text-xs text-muted-foreground">Nenhuma etapa — verifique o seed das oportunidades CRM.</p>
      )}
    </div>
  );
}
