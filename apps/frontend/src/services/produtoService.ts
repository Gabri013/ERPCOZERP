import { api } from '@/services/api';

export const produtoService = {
  async getAll(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.tipo) query.set('tipo', params.tipo);
    const response = await api.get(`/products?${query}`);
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  async create(produto) {
    const response = await api.post('/products', produto);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  async delete(id) {
    await api.delete(`/products/${id}`);
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
