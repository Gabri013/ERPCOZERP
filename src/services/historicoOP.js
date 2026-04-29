import { storage } from './storage';

const KEY = 'nomus_erp_historico_op';

export const historicoOP = {
  getAll: () => storage.get('historico_op', []),

  registrar: ({ opId, opNumero, statusAnterior, statusNovo, usuario = 'Sistema', obs = '' }) => {
    const all = storage.get('historico_op', []);
    const evento = {
      id: Date.now(),
      opId,
      opNumero,
      statusAnterior,
      statusNovo,
      usuario,
      obs,
      data: new Date().toISOString(),
    };
    storage.set('historico_op', [evento, ...all]);
    return evento;
  },

  getPorOP: (opId) => storage.get('historico_op', []).filter(h => h.opId === opId),
};