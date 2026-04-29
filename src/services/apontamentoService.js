import { storage } from './storage';
import { checkAndFinalizarOP } from './opService';

const MOCK_INICIAL = [
  { id: 1, opId: 1, etapa: 'Corte a Laser', operador: 'José Pereira', setor: 'Laser', horaInicio: '2026-04-17T08:00:00Z', horaFim: '2026-04-17T10:30:00Z', quantidade: 30, refugo: 0, status: 'Finalizado', observacao: '' },
  { id: 2, opId: 1, etapa: 'Rebarbação', operador: 'Marcos Lima', setor: 'Rebarbação', horaInicio: '2026-04-17T11:00:00Z', horaFim: '2026-04-17T13:00:00Z', quantidade: 30, refugo: 1, status: 'Finalizado', observacao: '1 peça com rebarbação excessiva' },
  { id: 3, opId: 1, etapa: 'Dobra', operador: 'Carlos Silva', setor: 'Dobra', horaInicio: '2026-04-18T08:00:00Z', horaFim: null, quantidade: null, refugo: null, status: 'Em Andamento', observacao: '' },
  { id: 4, opId: 3, etapa: 'Corte a Laser', operador: 'José Pereira', setor: 'Laser', horaInicio: '2026-04-15T09:00:00Z', horaFim: '2026-04-15T12:00:00Z', quantidade: 100, refugo: 0, status: 'Finalizado', observacao: '' },
];

if (!localStorage.getItem('nomus_erp_apontamentos')) {
  storage.set('apontamentos', MOCK_INICIAL);
  storage.set('apontamentos_next_id', 5);
}

const getAll = () => storage.get('apontamentos', MOCK_INICIAL);
const getNextId = () => storage.get('apontamentos_next_id', 5);
const save = (data) => storage.set('apontamentos', data);
const saveNextId = (id) => storage.set('apontamentos_next_id', id);

export const apontamentoService = {
  getByOpId: async (opId) => {
    const data = getAll().filter(a => a.opId === Number(opId));
    return { success: true, data };
  },

  iniciar: async (opId, dados) => {
    const nextId = getNextId();
    const novo = {
      ...dados,
      id: nextId,
      opId: Number(opId),
      horaInicio: new Date().toISOString(),
      horaFim: null,
      status: dados.finalizar ? 'Finalizado' : 'Em Andamento',
      horaFim: dados.finalizar ? new Date().toISOString() : null,
    };
    save([...getAll(), novo]);
    saveNextId(nextId + 1);

    // Verifica se a OP deve ser finalizada
    if (novo.status === 'Finalizado') {
      checkAndFinalizarOP(opId);
    } else {
      // Garante que a OP vai para "em_andamento" se estava "aberta"
      const { opService } = await import('./opService');
      const res = await opService.getById(opId);
      if (res.data?.status === 'aberta') {
        await opService.update(opId, { status: 'em_andamento' });
      }
    }

    return { success: true, data: novo };
  },

  finalizar: async (id, opId, dados) => {
    const all = getAll().map(a =>
      a.id === Number(id) ? { ...a, ...dados, horaFim: new Date().toISOString(), status: 'Finalizado' } : a
    );
    save(all);
    // Verifica se todas as etapas da OP foram concluídas
    checkAndFinalizarOP(opId);
    return { success: true };
  },

  getData: () => getAll(),
};