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
    codigo: row.codigo || row.id?.slice?.(0, 8),
    razao_social: row.razao_social || '',
    nome_fantasia: row.nome_fantasia || '',
    tipo: row.tipo || 'PJ',
    cnpj_cpf: row.cnpj_cpf || '',
    email: row.email || '',
    telefone: row.telefone || '',
    celular: row.celular || '',
    cep: row.cep || '',
    endereco: row.endereco || '',
    numero: row.numero || '',
    bairro: row.bairro || '',
    cidade: row.cidade || '',
    estado: row.estado || 'SP',
    contato: row.contato || '',
    limite_credito: row.limite_credito ?? '',
    status: row.status || 'Ativo',
    observacoes: row.observacoes || '',
  };
}

export const clientesServiceApi = {
  async getAll({ search = '', status = '' } = {}) {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (status) qs.set('status', status);
    const res = await api.get(`/api/vendas/clientes${qs.toString() ? `?${qs}` : ''}`);
    const rows = extractArray(res);
    return rows.map(toUi);
  },

  async create(form) {
    const res = await api.post('/api/vendas/clientes', form);
    const body = res?.data;
    return toUi(body?.data || body || res);
  },

  async update(id, form) {
    const res = await api.put(`/api/vendas/clientes/${id}`, form);
    const body = res?.data;
    return toUi(body?.data || body || res);
  },

  async delete(id) {
    await api.delete(`/api/vendas/clientes/${id}`);
  },
};

