import { storage } from './storage';

const COLLECTION_NAME = 'clientes';

// Dados mock
const MOCK_CLIENTES = [
  {
    id: '1',
    nome: 'Ind. XYZ S/A',
    email: 'contato@xyz.com.br',
    telefone: '(11) 3000-1111',
    celular: '(11) 99999-1111',
    cnpj: '12.345.678/0001-90',
    endereco: 'Rua das Flores',
    numero: '123',
    complemento: 'Sala 10',
    bairro: 'Vila Mariana',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '04015-050',
    contato: 'João Silva',
    limiteCredito: 50000.00,
    condicaoPagamento: '30 dias',
    ativo: true,
  },
  {
    id: '2',
    nome: 'TechParts Ltda',
    email: 'vendas@techparts.com.br',
    telefone: '(11) 3000-2222',
    celular: '(11) 99999-2222',
    cnpj: '23.456.789/0001-01',
    endereco: 'Av. Paulista',
    numero: '1500',
    complemento: '',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01311-100',
    contato: 'Maria Costa',
    limiteCredito: 75000.00,
    condicaoPagamento: '45 dias',
    ativo: true,
  },
];

if (!localStorage.getItem('nomus_erp_clientes')) {
  storage.set('clientes', MOCK_CLIENTES);
}

export const clientesService = {
  // Listar todos
  async getAll() {
    return storage.get('clientes', MOCK_CLIENTES);
  },

  // Obter por ID
  async getById(id) {
    const clientes = storage.get('clientes', MOCK_CLIENTES);
    return clientes.find(c => c.id === id) || null;
  },

  // Criar novo
  async create(cliente) {
    const clientes = storage.get('clientes', MOCK_CLIENTES);
    const novo = {
      ...cliente,
      id: Date.now().toString(),
      ativo: true,
    };
    storage.set('clientes', [...clientes, novo]);
    return novo;
  },

  // Atualizar
  async update(id, data) {
    const clientes = storage.get('clientes', MOCK_CLIENTES);
    const updated = clientes.map(c =>
      c.id === id ? { ...c, ...data } : c
    );
    storage.set('clientes', updated);
    return { id, ...data };
  },

  // Deletar
  async delete(id) {
    const clientes = storage.get('clientes', MOCK_CLIENTES);
    storage.set('clientes', clientes.filter(c => c.id !== id));
  },

  // Buscar por CNPJ
  async getByCNPJ(cnpj) {
    const clientes = await this.getAll();
    return clientes.find(c => c.cnpj === cnpj) || null;
  },

  // Listar clientes ativos
  async getAtivos() {
    const clientes = await this.getAll();
    return clientes.filter(c => c.ativo);
  },

  // Busca por nome/email/telefone
  async search(termo) {
    const clientes = await this.getAll();
    const termo_lower = termo.toLowerCase();
    return clientes.filter(c =>
      c.nome.toLowerCase().includes(termo_lower) ||
      c.email.toLowerCase().includes(termo_lower) ||
      c.telefone.includes(termo) ||
      c.celular.includes(termo)
    );
  },

  // Obter clientes com crédito disponível
  async getComCredito() {
    const clientes = await this.getAll();
    return clientes.filter(c => c.ativo && c.limiteCredito > 0);
  },

  // Contar clientes
  async count() {
    const clientes = await this.getAll();
    return clientes.length;
  },

  // Listener em tempo real
  onClientesChange(callback) {
    return () => {};
  },

  // Atualizações em lote
  async updateMultiple(updates) {
    const clientes = storage.get('clientes', MOCK_CLIENTES);
    const updated = clientes.map(c => {
      const upd = updates.find(u => u.id === c.id);
      return upd ? { ...c, ...upd.data } : c;
    });
    storage.set('clientes', updated);
  },

  // Obter estatísticas
  async getStats() {
    const clientes = await this.getAll();
    return {
      total: clientes.length,
      ativos: clientes.filter(c => c.ativo).length,
      inativos: clientes.filter(c => !c.ativo).length,
      creditoTotal: clientes.reduce((sum, c) => sum + c.limiteCredito, 0),
    };
  },
};
