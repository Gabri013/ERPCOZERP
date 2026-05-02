import { recordsServiceApi } from '@/services/recordsServiceApi';

export const produtoService = {
  async getAll(params = {}) {
    return recordsServiceApi.list('produto', {
      search: params.search || '',
      tipo: params.tipo || '',
    });
  },

  async getById(id) {
    return recordsServiceApi.get(id);
  },

  async create(produto) {
    return recordsServiceApi.create('produto', produto);
  },

  async update(id, data) {
    return recordsServiceApi.update(id, data);
  },

  async delete(id) {
    await recordsServiceApi.remove(id);
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
