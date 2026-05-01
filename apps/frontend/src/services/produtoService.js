import { api } from '@/services/api';

export const produtoService = {
  async getAll(params = {}) {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.tipo) qs.set('tipo', params.tipo);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    const res = await api.get(`/api/estoque${suffix}`);
    return res?.data || [];
  },

  async getById(id) {
    const res = await api.get(`/api/estoque/${id}`);
    return res?.data || null;
  },

  async create(produto) {
    const res = await api.post('/api/estoque', produto);
    return res?.data;
  },

  async update(id, data) {
    const res = await api.put(`/api/estoque/${id}`, data);
    return res?.data;
  },

  async delete(id) {
    await api.delete(`/api/estoque/${id}`);
  },

  async search(termo) {
    const items = await this.getAll({ search: termo });
    const s = String(termo || '').toLowerCase();
    return items.filter((p) =>
      String(p.descricao || '').toLowerCase().includes(s) ||
      String(p.codigo || '').toLowerCase().includes(s)
    );
  },

  async getEstoqueBaixo() {
    const items = await this.getAll();
    return items.filter((p) => Number(p.estoque_atual) < Number(p.estoque_minimo));
  },

  onProdutosChange() {
    return () => {};
  },
};
