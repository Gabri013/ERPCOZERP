import { storage } from './storage';

const COLLECTION_NAME = 'fornecedores';

const MOCK_FORNECEDORES = [
  {
    id: '1',
    nome: 'Aço Brasil Ltda',
    email: 'vendas@acobrasil.com.br',
    telefone: '(11) 3500-1111',
    cnpj: '34.567.890/0001-12',
    endereco: 'Av. Industrial',
    numero: '500',
    complemento: '',
    bairro: 'Distrito Industrial',
    cidade: 'São Caetano do Sul',
    estado: 'SP',
    cep: '09520-000',
    contatoPrincipal: 'Roberto Silva',
    prazoEntrega: 7,
    condicaoPagamento: '30 dias',
    ativo: true,
  },
  {
    id: '2',
    nome: 'Importados Premium SA',
    email: 'comercial@importadospremium.com.br',
    telefone: '(11) 3600-2222',
    cnpj: '45.678.901/0001-23',
    endereco: 'Rua do Porto',
    numero: '1200',
    complemento: 'Bloco A',
    bairro: 'Saúde',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '04015-000',
    contatoPrincipal: 'Fernanda Costa',
    prazoEntrega: 14,
    condicaoPagamento: '45 dias',
    ativo: true,
  },
];

if (!localStorage.getItem('nomus_erp_fornecedores')) {
  storage.set('fornecedores', MOCK_FORNECEDORES);
}

export const fornecedoresService = {
  async getAll() {
    return storage.get('fornecedores', MOCK_FORNECEDORES);
  },

  async getById(id) {
    const fornecedores = storage.get('fornecedores', MOCK_FORNECEDORES);
    return fornecedores.find(f => f.id === id) || null;
  },

  async create(fornecedor) {
    const fornecedores = storage.get('fornecedores', MOCK_FORNECEDORES);
    const novo = {
      ...fornecedor,
      id: Date.now().toString(),
      ativo: true,
    };
    storage.set('fornecedores', [...fornecedores, novo]);
    return novo;
  },

  async update(id, data) {
    const fornecedores = storage.get('fornecedores', MOCK_FORNECEDORES);
    const updated = fornecedores.map(f =>
      f.id === id ? { ...f, ...data } : f
    );
    storage.set('fornecedores', updated);
    return { id, ...data };
  },

  async delete(id) {
    const fornecedores = storage.get('fornecedores', MOCK_FORNECEDORES);
    storage.set('fornecedores', fornecedores.filter(f => f.id !== id));
  },

  async getByCNPJ(cnpj) {
    const fornecedores = await this.getAll();
    return fornecedores.find(f => f.cnpj === cnpj) || null;
  },

  async getAtivos() {
    const fornecedores = await this.getAll();
    return fornecedores.filter(f => f.ativo);
  },

  async search(termo) {
    const fornecedores = await this.getAll();
    const termo_lower = termo.toLowerCase();
    return fornecedores.filter(f =>
      f.nome.toLowerCase().includes(termo_lower) ||
      f.email.toLowerCase().includes(termo_lower) ||
      f.telefone.includes(termo)
    );
  },

  async getByPrazoEntrega(dias) {
    const fornecedores = await this.getAll();
    return fornecedores.filter(f => f.prazoEntrega <= dias);
  },

  async count() {
    const fornecedores = await this.getAll();
    return fornecedores.length;
  },

  onFornecedoresChange(callback) {
    return () => {};
  },

  async getStats() {
    const fornecedores = await this.getAll();
    return {
      total: fornecedores.length,
      ativos: fornecedores.filter(f => f.ativo).length,
      inativos: fornecedores.filter(f => !f.ativo).length,
      prazioMedioEntrega: Math.round(
        fornecedores.reduce((sum, f) => sum + f.prazoEntrega, 0) / fornecedores.length
      ),
    };
  },
};
