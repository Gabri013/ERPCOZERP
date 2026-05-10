import { listProductionAppointments, createProductionAppointment, updateProductionAppointment } from '@/services/productionApi';

export const apontamentoService = {
  getByOpId: async (opId) => {
    const all = await listProductionAppointments();
    const data = all.filter((a) => String(a.workOrderId) === String(opId));
    return { success: true, data };
  },

  iniciar: async (opId, dados) => {
    const novo = {
      workOrderId: String(opId),
      startTime: new Date().toISOString(),
      status: dados.finalizar ? 'Finalizado' : 'Em Andamento',
      endTime: dados.finalizar ? new Date().toISOString() : undefined,
      quantityProduced: dados.quantidade || 0,
      scrapQuantity: dados.refugo || 0,
      notes: dados.observacao || '',
    };
    const created = await createProductionAppointment(novo);
    return { success: true, data: created };
  },

  finalizar: async (id, opId, dados) => {
    await updateProductionAppointment(id, {
      endTime: new Date().toISOString(),
      status: 'Finalizado',
      quantityProduced: dados.quantidade || 0,
      scrapQuantity: dados.refugo || 0,
      notes: dados.observacao || '',
    });
    return { success: true };
  },

  getData: () => [],
};