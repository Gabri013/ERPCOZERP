import { storage } from './storage';

const COLLECTION_NAME = 'pedidos_vendas';

const MOCK_PEDIDOS = [
  {
    id: '1',
    numero: 'PV-001',
    cliente: { id: '1', nome: 'Ind. XYZ S/A' },
    itens: [
      {
        id: '1',
        produto: { id: '1', nome: 'Eixo Transmissão 25mm' },
        quantidade: 50,
        precoUnitario: 250.00,
        desconto: 0,
        total: 12500.00,
      },
    ],
    subtotal: 12500.00,
    desconto: 0,
    frete: 500.00,
    total: 13000.00,
    status: 'Aprovado',
    dataEmissao: new Date('2026-04-20').toISOString(),
    dataPrevistaEntrega: new Date('2026-04-27').toISOString(),
    dataEntrega: null,
    observacoes: 'Entrega urgente',
    criadoPor: '1',
    atualizadoPor: '1',
  },
];

if (!localStorage.getItem('nomus_erp_pedidos_vendas')) {
  storage.set('pedidos_vendas', MOCK_PEDIDOS);
}

export const pedidosService = {
  async getAll() {
    return storage.get('pedidos_vendas', MOCK_PEDIDOS);
  },

  async getById(id) {
    const pedidos = storage.get('pedidos_vendas', MOCK_PEDIDOS);
    return pedidos.find(p => p.id === id) || null;
  },

  async create(pedido) {
    const pedidos = storage.get('pedidos_vendas', MOCK_PEDIDOS);
    const novo = {
      ...pedido,
      id: Date.now().toString(),
    };
    storage.set('pedidos_vendas', [...pedidos, novo]);
    return novo;
  },

  async update(id, data) {
    const pedidos = storage.get('pedidos_vendas', MOCK_PEDIDOS);
    const updated = pedidos.map(p =>
      p.id === id ? { ...p, ...data } : p
    );
    storage.set('pedidos_vendas', updated);
    return { id, ...data };
  },

  async delete(id) {
    const pedidos = storage.get('pedidos_vendas', MOCK_PEDIDOS);
    storage.set('pedidos_vendas', pedidos.filter(p => p.id !== id));
  },

  async getByCliente(clienteId) {
    const pedidos = await this.getAll();
    return pedidos.filter(p => p.cliente.id === clienteId);
  },

  async getByStatus(status) {
    const pedidos = await this.getAll();
    return pedidos.filter(p => p.status === status);
  },

  async getPendentes() {
    const pedidos = await this.getAll();
    return pedidos.filter(p => !['Entregue', 'Cancelado'].includes(p.status));
  },

  async getAguardandoAprovacao() {
    const pedidos = await this.getAll();
    return pedidos.filter(p => p.status === 'Orçamento');
  },

  async calcularTotal(itens) {
    let subtotal = 0;
    itens.forEach(item => {
      subtotal += (item.quantidade * item.precoUnitario) - (item.desconto || 0);
    });
    return subtotal;
  },

  async search(termo) {
    const pedidos = await this.getAll();
    const termo_lower = termo.toLowerCase();
    return pedidos.filter(p =>
      p.numero.toLowerCase().includes(termo_lower) ||
      p.cliente.nome.toLowerCase().includes(termo_lower)
    );
  },

  async count() {
    const pedidos = await this.getAll();
    return pedidos.length;
  },

  onPedidosChange(callback) {
    return () => {};
  },

  async getStats() {
    const pedidos = await this.getAll();
    return {
      total: pedidos.length,
      emAberto: pedidos.filter(p => !['Entregue', 'Cancelado'].includes(p.status)).length,
      entregues: pedidos.filter(p => p.status === 'Entregue').length,
      cancelados: pedidos.filter(p => p.status === 'Cancelado').length,
      faturamentoTotal: pedidos.reduce((sum, p) => sum + p.total, 0),
    };
  },

  async atualizarStatus(id, novoStatus) {
    return this.update(id, { status: novoStatus });
  },
};
