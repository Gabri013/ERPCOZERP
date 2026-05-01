import { api } from './api';

function extractArray(res) {
  const body = res?.data;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.items)) return body.items;
  return [];
}

export const pedidosVendaServiceApi = {
  async getAll({ search = '', status = '', vendedor = '' } = {}) {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (status) qs.set('status', status);
    if (vendedor) qs.set('vendedor', vendedor);
    const res = await api.get(`/api/vendas/pedidos-venda${qs.toString() ? `?${qs}` : ''}`);
    return extractArray(res);
  },

  async create(form) {
    const res = await api.post('/api/vendas/pedidos-venda', form);
    const body = res?.data;
    return body?.data || body || res;
  },

  async update(id, form) {
    const res = await api.put(`/api/vendas/pedidos-venda/${id}`, form);
    const body = res?.data;
    return body?.data || body || res;
  },

  async delete(id) {
    await api.delete(`/api/vendas/pedidos-venda/${id}`);
  },
};

