import { api } from './api';

function extractArray(res) {
  const body = res?.data;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.items)) return body.items;
  return [];
}

export const tabelaPrecosServiceApi = {
  async getAll({ search = '', grupo = '' } = {}) {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (grupo) qs.set('grupo', grupo);
    const res = await api.get(`/api/vendas/tabela-precos${qs.toString() ? `?${qs}` : ''}`);
    return extractArray(res);
  },

  async create(form) {
    const res = await api.post('/api/vendas/tabela-precos', form);
    const body = res?.data;
    return body?.data || body || res;
  },

  async update(id, form) {
    const res = await api.put(`/api/vendas/tabela-precos/${id}`, form);
    const body = res?.data;
    return body?.data || body || res;
  },

  async delete(id) {
    await api.delete(`/api/vendas/tabela-precos/${id}`);
  },
};

