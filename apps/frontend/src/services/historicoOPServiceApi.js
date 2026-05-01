import { recordsServiceApi } from '@/services/recordsServiceApi';

export const historicoOPServiceApi = {
  async getAll() {
    const rows = await recordsServiceApi.list('historico_op');
    // mais recente primeiro
    return rows.sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')));
  },

  async registrar({ opId, opNumero, statusAnterior, statusNovo, usuario = 'Sistema', obs = '' }) {
    return recordsServiceApi.create('historico_op', {
      opId,
      opNumero,
      statusAnterior,
      statusNovo,
      usuario,
      obs,
      data: new Date().toISOString(),
    });
  },

  async getPorOP(opId) {
    const rows = await recordsServiceApi.list('historico_op');
    return rows.filter((h) => String(h.opId) === String(opId));
  },
};

