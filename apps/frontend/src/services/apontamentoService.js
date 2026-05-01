import { recordsServiceApi } from '@/services/recordsServiceApi';

export const apontamentoService = {
  getByOpId: async (opId) => {
    const all = await recordsServiceApi.list('apontamento_producao');
    const data = all.filter((a) => String(a.opId) === String(opId) || String(a.opNumero) === String(opId));
    return { success: true, data };
  },

  iniciar: async (opId, dados) => {
    const novo = {
      ...dados,
      opId: String(opId),
      horaInicio: new Date().toISOString(),
      status: dados.finalizar ? 'Finalizado' : 'Em Andamento',
      horaFim: dados.finalizar ? new Date().toISOString() : null,
    };
    const created = await recordsServiceApi.create('apontamento_producao', novo);
    return { success: true, data: created };
  },

  finalizar: async (id, opId, dados) => {
    await recordsServiceApi.update(id, { ...dados, horaFim: new Date().toISOString(), status: 'Finalizado' });
    return { success: true };
  },

  getData: () => [],
};