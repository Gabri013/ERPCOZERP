import { storage } from './storage';

const COLLECTION_NAME = 'movimentacoes_estoque';

const MOCK_MOVIMENTACOES = [
  {
    id: '1',
    tipo: 'Entrada',
    produto: { id: '1', nome: 'Eixo Transmissão 25mm' },
    quantidade: 100,
    documento: 'NF-001',
    documentoId: 'oc-1',
    motivo: 'Compra OC-001',
    localOrigem: 'Recebimento',
    localDestino: 'Estoque Geral',
    responsavel: '1',
    data: new Date('2026-04-20').toISOString(),
    observacoes: '',
    criadoPor: '1',
  },
];

if (!localStorage.getItem('nomus_erp_movimentacoes')) {
  storage.set('movimentacoes_estoque', MOCK_MOVIMENTACOES);
}

export const movimentacoesService = {
  async getAll() {
    return storage.get('movimentacoes_estoque', MOCK_MOVIMENTACOES);
  },

  async getById(id) {
    const movs = storage.get('movimentacoes_estoque', MOCK_MOVIMENTACOES);
    return movs.find(m => m.id === id) || null;
  },

  async create(movimentacao) {
    const movs = storage.get('movimentacoes_estoque', MOCK_MOVIMENTACOES);
    const novo = {
      ...movimentacao,
      id: Date.now().toString(),
    };
    storage.set('movimentacoes_estoque', [...movs, novo]);
    return novo;
  },

  async update(id, data) {
    const movs = storage.get('movimentacoes_estoque', MOCK_MOVIMENTACOES);
    const updated = movs.map(m =>
      m.id === id ? { ...m, ...data } : m
    );
    storage.set('movimentacoes_estoque', updated);
    return { id, ...data };
  },

  async delete(id) {
    const movs = storage.get('movimentacoes_estoque', MOCK_MOVIMENTACOES);
    storage.set('movimentacoes_estoque', movs.filter(m => m.id !== id));
  },

  async getByProduto(produtoId) {
    const movs = await this.getAll();
    return movs.filter(m => m.produto.id === produtoId);
  },

  async getByTipo(tipo) {
    const movs = await this.getAll();
    return movs.filter(m => m.tipo === tipo);
  },

  async getEntradas() {
    return this.getByTipo('Entrada');
  },

  async getSaidas() {
    return this.getByTipo('Saída');
  },

  async getDevolvidas() {
    return this.getByTipo('Devolução');
  },

  async getByDocumento(documentoId) {
    const movs = await this.getAll();
    return movs.filter(m => m.documentoId === documentoId);
  },

  async getTotalMovimentado(produtoId, tipo = null) {
    const movs = await this.getByProduto(produtoId);
    const filtradas = tipo ? movs.filter(m => m.tipo === tipo) : movs;
    return filtradas.reduce((sum, m) => sum + m.quantidade, 0);
  },

  async count() {
    const movs = await this.getAll();
    return movs.length;
  },

  onMovimentacoesChange(callback) {
    return () => {};
  },

  async search(termo) {
    const movs = await this.getAll();
    const termo_lower = termo.toLowerCase();
    return movs.filter(m =>
      m.produto.nome.toLowerCase().includes(termo_lower) ||
      m.documento.toLowerCase().includes(termo_lower) ||
      m.motivo.toLowerCase().includes(termo_lower)
    );
  },

  async getStats() {
    const movs = await this.getAll();
    return {
      total: movs.length,
      entradas: movs.filter(m => m.tipo === 'Entrada').length,
      saidas: movs.filter(m => m.tipo === 'Saída').length,
      devolucoes: movs.filter(m => m.tipo === 'Devolução').length,
      ajustes: movs.filter(m => m.tipo === 'Ajuste').length,
    };
  },
};
