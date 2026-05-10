import { api } from './api';

function extractArray(res) {
  const body = res?.data;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.items)) return body.items;
  return [];
}

const STATUS_UI_TO_API = {
  Aberto: 'aberto',
  Pago: 'pago',
  Vencido: 'vencido',
  Cancelado: 'cancelado',
};

function toUiStatus(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'pago' || s === 'recebido') return 'Pago';
  if (s === 'vencido') return 'Vencido';
  if (s === 'cancelado') return 'Cancelado';
  return 'Aberto';
}

function toApiStatus(status) {
  return STATUS_UI_TO_API[status] || String(status || 'aberto').toLowerCase();
}

function toUiConta(row, prefix) {
  return {
    id: row.id,
    numero: `${prefix}-${String(row.id || '').slice(0, 6).toUpperCase()}`,
    descricao: row.descricao || '',
    cliente_fornecedor: row.cliente_fornecedor || '',
    categoria: row.categoria || '',
    valor: Number(row.valor || 0),
    data_emissao: row.data_emissao || (row.created_at ? String(row.created_at).slice(0, 10) : ''),
    data_vencimento: row.data_vencimento || '',
    status: toUiStatus(row.status),
    documento: row.documento || '',
    observacoes: row.observacoes || '',
    created_at: row.created_at,
  };
}

function toApiContaPayload(form, kind) {
  const base = {
    descricao: form.descricao ?? null,
    valor: Number(form.valor || 0),
    data_vencimento: form.data_vencimento,
    status: toApiStatus(form.status),
    cost_center_id: form.cost_center_id ?? null,
  };

  // Tabelas atuais suportam apenas *_id + campos básicos
  if (kind === 'receber') {
    return { ...base, cliente_id: form.cliente_id ?? null };
  }
  return { ...base, fornecedor_id: form.fornecedor_id ?? null };
}

export const contasReceberService = {
  async getAll({ status } = {}) {
    const qs = status ? `?status=${encodeURIComponent(toApiStatus(status))}` : '';
    const res = await api.get(`/api/financeiro/contas-receber${qs}`);
    return extractArray(res).map(r => toUiConta(r, 'REC'));
  },

  async create(form) {
    const res = await api.post('/api/financeiro/contas-receber', toApiContaPayload(form, 'receber'));
    return toUiConta(res?.data || res, 'REC');
  },

  async update(id, form) {
    const res = await api.put(`/api/financeiro/contas-receber/${id}`, toApiContaPayload(form, 'receber'));
    return toUiConta(res?.data || res, 'REC');
  },

  async delete(id) {
    await api.delete(`/api/financeiro/contas-receber/${id}`);
  },
};

export const contasPagarService = {
  async getAll({ status } = {}) {
    const qs = status ? `?status=${encodeURIComponent(toApiStatus(status))}` : '';
    const res = await api.get(`/api/financeiro/contas-pagar${qs}`);
    return extractArray(res).map(r => toUiConta(r, 'PAG'));
  },

  async create(form) {
    const res = await api.post('/api/financeiro/contas-pagar', toApiContaPayload(form, 'pagar'));
    return toUiConta(res?.data || res, 'PAG');
  },

  async update(id, form) {
    const res = await api.put(`/api/financeiro/contas-pagar/${id}`, toApiContaPayload(form, 'pagar'));
    return toUiConta(res?.data || res, 'PAG');
  },

  async delete(id) {
    await api.delete(`/api/financeiro/contas-pagar/${id}`);
  },
};

export const costCenterService = {
  async getAll() {
    const res = await api.get('/api/financial/cost-centers');
    return extractArray(res);
  },

  async create(data) {
    const res = await api.post('/api/financial/cost-centers', data);
    return res?.data;
  },
};
