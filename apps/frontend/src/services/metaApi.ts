import { api } from '@/services/api';

function extractItems(res) {
  const v = res?.data?.data?.items ?? res?.data?.items;
  return Array.isArray(v) ? v : [];
}

export const metaApi = {
  /**
   * Definição de campos dinâmicos por entidade.
   * @param {string} entityCode
   * @param {{ includeInactive?: boolean }} [opts] — includeInactive requer `editar_config` no backend
   */
  async listFields(entityCode, opts = {}) {
    const q = new URLSearchParams({ kind: 'field', entityCode: String(entityCode || '') });
    if (opts.includeInactive) q.set('includeInactive', '1');
    const res = await api.get(`/api/meta?${q}`, { silent403: true });
    return extractItems(res);
  },

  async list(kind, params = {}) {
    const q = new URLSearchParams({ kind: String(kind) });
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue;
      q.set(k, String(v));
    }
    const res = await api.get(`/api/meta?${q}`, { silent403: true });
    return extractItems(res);
  },

  async create(kind, payload) {
    const res = await api.post('/api/meta', { kind, payload });
    return res?.data?.data ?? res?.data;
  },

  async update(id, kind, payload) {
    const res = await api.put(`/api/meta/${encodeURIComponent(id)}?kind=${encodeURIComponent(kind)}`, payload);
    return res?.data?.data ?? res?.data;
  },

  async remove(id, kind) {
    await api.delete(`/api/meta/${encodeURIComponent(id)}?kind=${encodeURIComponent(kind)}`);
  },
};
