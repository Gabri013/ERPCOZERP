import { api } from '@/services/api';

async function resolveProductIdByCode(code) {
  const c = String(code || '').trim();
  if (!c) return null;
  try {
    const { data: body } = await api.get(`/api/stock/products?search=${encodeURIComponent(c)}`);
    const rows = body?.data ?? body;
    if (!Array.isArray(rows)) return null;
    const exact = rows.find((p) => p.code === c);
    return exact?.id ?? rows[0]?.id ?? null;
  } catch {
    return null;
  }
}

export const opService = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    if (params.sector) query.set('sector', String(params.sector));
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const { data: body } = await api.get(`/api/work-orders${queryString}`);
    const rows = body?.data ?? [];
    return { success: true, data: rows };
  },

  getById: async (id) => {
    const { data: body } = await api.get(`/api/work-orders/${id}`);
    return { success: true, data: body?.data };
  },

  create: async (data) => {
    let productId = data.productId;
    if (!productId && data.codigoProduto) {
      productId = await resolveProductIdByCode(data.codigoProduto);
    }
    if (!productId) {
      throw new Error('Não foi possível localizar o produto no catálogo. Use um código existente (ex.: CAT-EIX-025).');
    }
    const qty = Number(data.quantidade || data.quantityPlanned || 1);
    const due = data.prazo ? new Date(data.prazo).toISOString() : undefined;
    const { data: body } = await api.post('/api/work-orders', {
      productId,
      quantityPlanned: qty,
      dueDate: due,
      notes: data.observacao ? String(data.observacao) : undefined,
      priority: typeof data.prioridade === 'string' ? data.prioridade.toLowerCase() : 'normal',
    });
    return { success: true, data: body?.data };
  },

  update: async (id, data) => {
    const patch = {};
    if (data.status != null) patch.status = data.status;
    if (data.quantidade != null) patch.quantityPlanned = Number(data.quantidade);
    if (data.prazo != null) patch.dueDate = new Date(data.prazo).toISOString();
    if (data.prioridade != null) patch.priority = String(data.prioridade).toLowerCase();
    if (data.observacao != null) patch.notes = data.observacao;
    const { data: body } = await api.patch(`/api/work-orders/${id}`, patch);
    return { success: true, data: body?.data };
  },

  delete: async () => {
    return { success: true };
  },

  finish: async (id, completionData = null) => {
    const body = completionData ? { itens: completionData } : {};
    const { data: responseBody } = await api.post(`/api/work-orders/${id}/finish`, body);
    return { success: true, data: responseBody?.data };
  },

  getData: () => [],

  getStatusHistoryAll: async () => {
    const { data: body } = await api.get('/api/work-orders/status-history/all');
    const rows = body?.data ?? [];
    return { success: true, data: rows };
  },

  createStatusHistory: async (data) => {
    const { data: body } = await api.post('/api/work-orders/status-history', data);
    return { success: true, data: body?.data };
  },
};
