import { api } from './api';

function extractArray(res) {
  const body = res?.data;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.items)) return body.items;
  return [];
}

function toUiFornecedor(row) {
  if (!row) return row;
  return {
    id: row.id,
    codigo: row.codigo || row.code || row.numero || row.id?.slice?.(0, 8),
    razao_social: row.razao_social || row.nome || '',
    nome_fantasia: row.nome_fantasia || row.fantasia || '',
    tipo: row.tipo || 'PJ',
    cnpj_cpf: row.cnpj_cpf || row.cnpj || '',
    email: row.email || '',
    telefone: row.telefone || '',
    contato: row.contato || row.contatoPrincipal || '',
    cep: row.cep || '',
    endereco: row.endereco || '',
    cidade: row.cidade || '',
    estado: row.estado || 'SP',
    prazo_entrega: Number(row.prazo_entrega ?? row.prazoEntrega ?? 0) || 0,
    status: row.status || (row.ativo === false ? 'Inativo' : 'Ativo'),
    observacoes: row.observacoes || '',
  };
}

function toApiFornecedorData(form) {
  // O backend usa $.nome e $.cnpj para search/sort, então garantimos esses campos.
  return {
    ...form,
    nome: form.razao_social || form.nome || '',
    cnpj: form.cnpj_cpf || form.cnpj || '',
  };
}

export const fornecedoresService = {
  async getAll({ page = 1, limit = 200, search = '' } = {}) {
    const res = await api.get(`/api/compras/fornecedores?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
    return extractArray(res).map(toUiFornecedor);
  },

  async getById(id) {
    const all = await this.getAll({ limit: 200 });
    return all.find(f => f.id === id) || null;
  },

  async create(fornecedor) {
    const payload = toApiFornecedorData(fornecedor);
    const res = await api.post('/api/compras/fornecedores', payload);
    const body = res?.data;
    return toUiFornecedor(body?.data || body || res);
  },

  async update(id, data) {
    const payload = toApiFornecedorData(data);
    const res = await api.put(`/api/compras/fornecedores/${id}`, payload);
    const body = res?.data;
    return toUiFornecedor(body?.data || body || res);
  },

  async delete(id) {
    await api.delete(`/api/compras/fornecedores/${id}`);
  },
};
