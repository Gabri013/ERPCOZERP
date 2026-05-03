import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import PageHeader from '@/components/common/PageHeader';
import { opService } from '@/services/opService';
import { historicoOPServiceApi } from '@/services/historicoOPServiceApi';
import { usePermissao } from '@/lib/PermissaoContext';
import { Clock, AlertTriangle, User, Package, History, X } from 'lucide-react';
import FluxoProducao from '@/components/producao/FluxoProducao';
import IndustrialCategoryBadge from '@/components/industrial/IndustrialCategoryBadge';

const COLUNAS = [
  { key: 'aberta',       label: 'Aguardando',        cor: 'border-t-blue-400',   header: 'bg-blue-50',   badge: 'bg-blue-100 text-blue-700' },
  { key: 'em_andamento', label: 'Em Produção',        cor: 'border-t-orange-400', header: 'bg-orange-50', badge: 'bg-orange-100 text-orange-700' },
  { key: 'pausada',      label: 'Pausada / Atraso',   cor: 'border-t-red-400',    header: 'bg-red-50',    badge: 'bg-red-100 text-red-700' },
  { key: 'concluida',    label: 'Finalizado',         cor: 'border-t-green-400',  header: 'bg-green-50',  badge: 'bg-green-100 text-green-700' },
];

const PRIORIDADE_COR = {
  Urgente: 'bg-pink-100 text-pink-800 border border-pink-300',
  urgente: 'bg-pink-100 text-pink-800 border border-pink-300',
  Alta:    'bg-orange-100 text-orange-700',
  Normal:  'bg-blue-100 text-blue-700',
  normal:  'bg-blue-100 text-blue-700',
  Baixa:   'bg-gray-100 text-gray-600',
};

const STATUS_LABEL = {
  aberta: 'Aguardando', em_andamento: 'Em Produção', pausada: 'Pausada', concluida: 'Finalizado'
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—';

function OPCard({ op, index }) {
  const atrasada = op.prazo && new Date(op.prazo) < new Date() && op.status !== 'concluida';
  const urg = String(op.prioridade || op.priority || '').toLowerCase().includes('urg');
  return (
    <Draggable draggableId={String(op.id)} index={index}>
      {(drag, snapshot) => (
        <div
          ref={drag.innerRef}
          {...drag.draggableProps}
          {...drag.dragHandleProps}
          className={`bg-white border rounded-lg p-3 cursor-grab active:cursor-grabbing select-none transition-shadow ${
            snapshot.isDragging
              ? 'shadow-2xl border-primary scale-[1.02] rotate-1'
              : urg
                ? 'border-2 border-pink-400 shadow-sm shadow-pink-100/80 hover:border-pink-500'
                : 'border-border hover:shadow-md hover:border-primary/40'
          }`}
        >
          <div className="flex items-start justify-between mb-2 gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <IndustrialCategoryBadge code={op.categoria_codigo} />
              <Link
                to={`/producao/ordens/${op.id}`}
                onClick={e => e.stopPropagation()}
                className="text-xs font-bold text-primary hover:underline truncate"
              >
                {op.numero}
              </Link>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${PRIORIDADE_COR[op.prioridade] || PRIORIDADE_COR[op.priority] || 'bg-gray-100 text-gray-600'}`}>
              {op.prioridade || op.priority || '—'}
            </span>
          </div>

          <div className="text-xs font-medium text-foreground mb-1 leading-tight line-clamp-2">
            {op.produtoDescricao}
          </div>
          <div className="text-[11px] text-muted-foreground mb-2 truncate">{op.clienteNome}</div>

          <div className="flex items-center gap-2 text-[11px] flex-wrap">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Package size={10}/> {op.quantidade} {op.unidade}
            </span>
            <span className={`flex items-center gap-1 font-medium ml-auto ${atrasada ? 'text-red-600' : 'text-muted-foreground'}`}>
              {atrasada && <AlertTriangle size={10}/>}
              <Clock size={10}/> {fmt(op.prazo)}
            </span>
          </div>

          {op.responsavel && (
            <div className="mt-2 pt-2 border-t border-border flex items-center gap-1 text-[10px] text-muted-foreground">
              <User size={10}/> {op.responsavel}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

function HistoricoPanel({ historico, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <History size={15} className="text-primary"/>
            <h2 className="text-sm font-semibold">Histórico de Movimentações</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X size={15}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {historico.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Nenhuma movimentação registrada</p>
          ) : (
            <div className="space-y-2">
              {historico.map(h => (
                <div key={h.id} className="flex items-start gap-3 p-2.5 border border-border rounded-lg text-xs">
                  <div className="mt-0.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{h.opNumero}</div>
                    <div className="text-muted-foreground">
                      <span className="text-orange-600">{STATUS_LABEL[h.statusAnterior] || h.statusAnterior}</span>
                      {' → '}
                      <span className="text-green-600">{STATUS_LABEL[h.statusNovo] || h.statusNovo}</span>
                    </div>
                    {h.obs && <div className="text-muted-foreground italic mt-0.5">{h.obs}</div>}
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {h.usuario} · {new Date(h.data).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KanbanProducao() {
  const [ops, setOps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistorico, setShowHistorico] = useState(false);
  const { usuarioAtual } = usePermissao();

  const [historico, setHistorico] = useState([]);

  async function load() {
    setLoading(true);
    try {
      const [opsRes, hist] = await Promise.all([opService.getAll(), historicoOPServiceApi.getAll()]);
      setOps(opsRes.data || []);
      setHistorico(hist || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const onDragEnd = useCallback((result) => {
    const { source, destination, draggableId } = result;
    if (!destination || source.droppableId === destination.droppableId) return;

    const opId = String(draggableId);
    const op = ops.find(o => String(o.id) === opId);
    if (!op) return;

    const statusAnterior = op.status;
    const statusNovo = destination.droppableId;

    // Atualiza estado local imediatamente
    setOps(prev => prev.map(o => String(o.id) === opId ? { ...o, status: statusNovo } : o));

    // Persiste no serviço
    opService.update(opId, { status: statusNovo });

    // Registra histórico
    historicoOPServiceApi.registrar({
      opId,
      opNumero: op.numero,
      statusAnterior,
      statusNovo,
      usuario: usuarioAtual?.nome || 'Sistema',
      obs: `Movido via Kanban: ${STATUS_LABEL[statusAnterior]} → ${STATUS_LABEL[statusNovo]}`,
    });

    // Atualiza painel de histórico em background
    historicoOPServiceApi.getAll().then(setHistorico).catch(() => {});
  }, [ops, usuarioAtual]);

  const counts = useMemo(() => {
    return COLUNAS.reduce((acc, col) => {
      acc[col.key] = ops.filter(o => o.status === col.key).length;
      return acc;
    }, {});
  }, [ops]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <PageHeader
        title="Kanban de Produção"
        breadcrumbs={['Início', 'Produção', 'Kanban']}
        subtitle="Arraste as OPs entre as colunas para atualizar o status"
        actions={
          <button
            onClick={() => setShowHistorico(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"
          >
            <History size={13}/> Histórico ({historico.length})
          </button>
        }
      />
      <FluxoProducao />

      <DragDropContext onDragEnd={onDragEnd}>
        {/* Scroll horizontal em mobile, grid em desktop */}
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1 min-h-0 md:grid md:grid-cols-4 md:overflow-x-visible md:overflow-y-auto">
          {COLUNAS.map(col => {
            const items = ops.filter(o => o.status === col.key);
            return (
              <div
                key={col.key}
                className="flex flex-col min-w-[240px] md:min-w-0 flex-shrink-0 md:flex-shrink md:overflow-hidden"
              >
                {/* Header */}
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-lg border-t-2 ${col.cor} ${col.header} mb-2 shrink-0`}>
                  <span className="text-xs font-semibold text-foreground">{col.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>{counts[col.key]}</span>
                </div>

                {/* Drop zone */}
                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex flex-col gap-2 flex-1 rounded-lg p-2 transition-colors min-h-[120px] md:overflow-y-auto ${
                        snapshot.isDraggingOver
                          ? 'bg-primary/8 border-2 border-dashed border-primary'
                          : 'bg-muted/40 border-2 border-transparent'
                      }`}
                    >
                      {items.length === 0 && !snapshot.isDraggingOver && (
                        <div className="text-center py-8 text-[11px] text-muted-foreground">
                          {loading ? 'Carregando...' : 'Nenhuma OP'}
                        </div>
                      )}
                      {items.map((op, index) => (
                        <OPCard key={op.id} op={op} index={index} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {showHistorico && (
        <HistoricoPanel historico={historico} onClose={() => setShowHistorico(false)} />
      )}
    </div>
  );
}