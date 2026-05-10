import { opService } from '@/services/opService';

export const historicoOPServiceApi = {
  async getAll() {
    const response = await opService.getStatusHistoryAll();
    const rows = response.data || [];
    // mais recente primeiro
    return rows.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  },

  async registrar({ opId, opNumero, statusAnterior, statusNovo, usuario = 'Sistema', obs = '' }) {
    const response = await opService.createStatusHistory({
      workOrderId: opId,
      previousStatus: statusAnterior,
      newStatus: statusNovo,
      notes: obs,
      // userId não definido, será null
    });
    return response.data;
  },

  async getPorOP(opId) {
    const response = await opService.getStatusHistoryAll();
    const rows = response.data || [];
    return rows.filter((h) => String(h.workOrderId) === String(opId));
  },
};

