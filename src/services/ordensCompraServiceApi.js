import { api } from './api';

function extractArray(res) {
  const body = res?.data;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.items)) return body.items;
  return [];
}

function toUi(row) {
  return {
    id: row.id,
    numero: row.numero,
    fornecedor_nome: row.fornecedor_nome || '',
    data_emissao: row.data_emissao || '',
    data_entrega_prevista: row.data_entrega_prevista || '',
    valor_total: Number(row.valor_total || 0),
    status: row.status || 'Rascunho',
    itens: Array.isArray(row.itens) ? row.itens : [],
    observacoes: row.observacoes || '',
  };
}

export const ordensCompraServiceApi = {
  async getAll({ search = '', status = '' } = {}) {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (status) qs.set('status', status);
    const res = await api.get(`/api/compras/ordens-compra${qs.toString() ? `?${qs}` : ''}`);
    const rows = extractArray(res);
    return rows.map(toUi);
  },

  async create(form) {
    const res = await api.post('/api/compras/ordens-compra', form);
    const body = res?.data;
    return toUi(body?.data || body || res);
  },

  async update(id, form) {
    const res = await api.put(`/api/compras/ordens-compra/${id}`, form);
    const body = res?.data;
    return toUi(body?.data || body || res);
  },

  async delete(id) {
    await api.delete(`/api/compras/ordens-compra/${id}`);
  },
};

