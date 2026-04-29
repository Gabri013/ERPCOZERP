import { storage } from './storage';

const COLLECTION_RECEBER = 'contas_receber';
const COLLECTION_PAGAR = 'contas_pagar';

const MOCK_RECEBER = [
  {
    id: '1',
    numero: 'CR-001',
    cliente: { id: '1', nome: 'Ind. XYZ S/A' },
    pedido: '1',
    valor: 13000.00,
    dataEmissao: new Date('2026-04-20').toISOString(),
    dataVencimento: new Date('2026-05-20').toISOString(),
    dataPagamento: null,
    status: 'Aberta',
    juros: 0,
    multa: 0,
    desconto: 0,
    observacoes: '',
    criadoPor: '1',
  },
];

const MOCK_PAGAR = [
  {
    id: '1',
    numero: 'CP-001',
    fornecedor: { id: '1', nome: 'Aço Brasil Ltda' },
    ordemCompra: '1',
    valor: 5000.00,
    dataEmissao: new Date('2026-04-18').toISOString(),
    dataVencimento: new Date('2026-05-18').toISOString(),
    dataPagamento: null,
    status: 'Aberta',
    juros: 0,
    multa: 0,
    desconto: 0,
    observacoes: '',
    criadoPor: '1',
  },
];

if (!localStorage.getItem('nomus_erp_contas_receber')) {
  storage.set('contas_receber', MOCK_RECEBER);
}

if (!localStorage.getItem('nomus_erp_contas_pagar')) {
  storage.set('contas_pagar', MOCK_PAGAR);
}

// Serviço para Contas a Receber
export const contasReceberService = {
  async getAll() {
    return storage.get('contas_receber', MOCK_RECEBER);
  },

  async getById(id) {
    const contas = storage.get('contas_receber', MOCK_RECEBER);
    return contas.find(c => c.id === id) || null;
  },

  async create(conta) {
    const contas = storage.get('contas_receber', MOCK_RECEBER);
    const nova = {
      ...conta,
      id: Date.now().toString(),
    };
    storage.set('contas_receber', [...contas, nova]);
    return nova;
  },

  async update(id, data) {
    const contas = storage.get('contas_receber', MOCK_RECEBER);
    const updated = contas.map(c =>
      c.id === id ? { ...c, ...data } : c
    );
    storage.set('contas_receber', updated);
    return { id, ...data };
  },

  async delete(id) {
    const contas = storage.get('contas_receber', MOCK_RECEBER);
    storage.set('contas_receber', contas.filter(c => c.id !== id));
  },

  async getByStatus(status) {
    const contas = await this.getAll();
    return contas.filter(c => c.status === status);
  },

  async getAberta() {
    return this.getByStatus('Aberta');
  },

  async getPagas() {
    return this.getByStatus('Paga');
  },

  async getVencidas() {
    const contas = await this.getAll();
    const hoje = new Date();
    return contas.filter(c =>
      new Date(c.dataVencimento) < hoje && c.status !== 'Paga'
    );
  },

  async getTotalReceber() {
    const contas = await this.getAll();
    return contas.reduce((sum, c) => sum + c.valor, 0);
  },

  async atualizarStatus(id, novoStatus) {
    const data = { status: novoStatus };
    if (novoStatus === 'Paga') {
      data.dataPagamento = new Date().toISOString();
    }
    return this.update(id, data);
  },

  async getStats() {
    const contas = await this.getAll();
    return {
      total: contas.length,
      aberta: contas.filter(c => c.status === 'Aberta').length,
      paga: contas.filter(c => c.status === 'Paga').length,
      vencida: contas.filter(c =>
        new Date(c.dataVencimento) < new Date() && c.status !== 'Paga'
      ).length,
      totalReceber: contas.reduce((sum, c) => sum + c.valor, 0),
    };
  },
};

// Serviço para Contas a Pagar
export const contasPagarService = {
  async getAll() {
    return storage.get('contas_pagar', MOCK_PAGAR);
  },

  async getById(id) {
    const contas = storage.get('contas_pagar', MOCK_PAGAR);
    return contas.find(c => c.id === id) || null;
  },

  async create(conta) {
    const contas = storage.get('contas_pagar', MOCK_PAGAR);
    const nova = {
      ...conta,
      id: Date.now().toString(),
    };
    storage.set('contas_pagar', [...contas, nova]);
    return nova;
  },

  async update(id, data) {
    const contas = storage.get('contas_pagar', MOCK_PAGAR);
    const updated = contas.map(c =>
      c.id === id ? { ...c, ...data } : c
    );
    storage.set('contas_pagar', updated);
    return { id, ...data };
  },

  async delete(id) {
    const contas = storage.get('contas_pagar', MOCK_PAGAR);
    storage.set('contas_pagar', contas.filter(c => c.id !== id));
  },

  async getByStatus(status) {
    const contas = await this.getAll();
    return contas.filter(c => c.status === status);
  },

  async getAberta() {
    return this.getByStatus('Aberta');
  },

  async getPagas() {
    return this.getByStatus('Paga');
  },

  async getVencidas() {
    const contas = await this.getAll();
    const hoje = new Date();
    return contas.filter(c =>
      new Date(c.dataVencimento) < hoje && c.status !== 'Paga'
    );
  },

  async getTotalPagar() {
    const contas = await this.getAll();
    return contas.reduce((sum, c) => sum + c.valor, 0);
  },

  async atualizarStatus(id, novoStatus) {
    const data = { status: novoStatus };
    if (novoStatus === 'Paga') {
      data.dataPagamento = new Date().toISOString();
    }
    return this.update(id, data);
  },

  async getStats() {
    const contas = await this.getAll();
    return {
      total: contas.length,
      aberta: contas.filter(c => c.status === 'Aberta').length,
      paga: contas.filter(c => c.status === 'Paga').length,
      vencida: contas.filter(c =>
        new Date(c.dataVencimento) < new Date() && c.status !== 'Paga'
      ).length,
      totalPagar: contas.reduce((sum, c) => sum + c.valor, 0),
    };
  },
};
