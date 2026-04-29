import { storage } from './storage';

const COLLECTION_NAME = 'funcionarios';

const MOCK_FUNCIONARIOS = [
  {
    id: '1',
    nome: 'João Silva',
    email: 'joao.silva@nomus.com.br',
    cpf: '123.456.789-00',
    dataNascimento: '1990-05-15',
    telefone: '(11) 98765-4321',
    endereco: 'Rua A',
    numero: '100',
    complemento: 'Apt 101',
    bairro: 'Vila Mariana',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '04015-050',
    cargo: 'Operador de Produção',
    departamento: 'Produção',
    dataAdmissao: '2020-03-15',
    salario: 3500.00,
    status: 'Ativo',
    ativo: true,
  },
  {
    id: '2',
    nome: 'Maria Santos',
    email: 'maria.santos@nomus.com.br',
    cpf: '234.567.890-11',
    dataNascimento: '1988-08-22',
    telefone: '(11) 98765-4322',
    endereco: 'Av. B',
    numero: '200',
    complemento: '',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01311-100',
    cargo: 'Técnico de Qualidade',
    departamento: 'Qualidade',
    dataAdmissao: '2021-06-10',
    salario: 4200.00,
    status: 'Ativo',
    ativo: true,
  },
];

if (!localStorage.getItem('nomus_erp_funcionarios')) {
  storage.set('funcionarios', MOCK_FUNCIONARIOS);
}

export const rhService = {
  async getAll() {
    return storage.get('funcionarios', MOCK_FUNCIONARIOS);
  },

  async getById(id) {
    const funcionarios = storage.get('funcionarios', MOCK_FUNCIONARIOS);
    return funcionarios.find(f => f.id === id) || null;
  },

  async create(funcionario) {
    const funcionarios = storage.get('funcionarios', MOCK_FUNCIONARIOS);
    const novo = {
      ...funcionario,
      id: Date.now().toString(),
      ativo: true,
    };
    storage.set('funcionarios', [...funcionarios, novo]);
    return novo;
  },

  async update(id, data) {
    const funcionarios = storage.get('funcionarios', MOCK_FUNCIONARIOS);
    const updated = funcionarios.map(f =>
      f.id === id ? { ...f, ...data } : f
    );
    storage.set('funcionarios', updated);
    return { id, ...data };
  },

  async delete(id) {
    const funcionarios = storage.get('funcionarios', MOCK_FUNCIONARIOS);
    storage.set('funcionarios', funcionarios.filter(f => f.id !== id));
  },

  async getAtivos() {
    const funcionarios = await this.getAll();
    return funcionarios.filter(f => f.ativo && f.status === 'Ativo');
  },

  async getInativos() {
    const funcionarios = await this.getAll();
    return funcionarios.filter(f => !f.ativo || f.status !== 'Ativo');
  },

  async getByDepartamento(departamento) {
    const funcionarios = await this.getAll();
    return funcionarios.filter(f => f.departamento === departamento);
  },

  async getByCargo(cargo) {
    const funcionarios = await this.getAll();
    return funcionarios.filter(f => f.cargo === cargo);
  },

  async getByCPF(cpf) {
    const funcionarios = await this.getAll();
    return funcionarios.find(f => f.cpf === cpf) || null;
  },

  async getDepartamentos() {
    const funcionarios = await this.getAll();
    const depts = new Set(funcionarios.map(f => f.departamento));
    return Array.from(depts);
  },

  async getCargos() {
    const funcionarios = await this.getAll();
    const cargos = new Set(funcionarios.map(f => f.cargo));
    return Array.from(cargos);
  },

  async getTotalFolhaPagamento() {
    const funcionarios = await this.getAtivos();
    return funcionarios.reduce((sum, f) => sum + f.salario, 0);
  },

  async search(termo) {
    const funcionarios = await this.getAll();
    const termo_lower = termo.toLowerCase();
    return funcionarios.filter(f =>
      f.nome.toLowerCase().includes(termo_lower) ||
      f.email.toLowerCase().includes(termo_lower) ||
      f.telefone.includes(termo) ||
      f.cpf.includes(termo)
    );
  },

  async count() {
    const funcionarios = await this.getAll();
    return funcionarios.length;
  },

  onFuncionariosChange(callback) {
    return () => {};
  },

  async getStats() {
    const funcionarios = await this.getAll();
    const ativos = funcionarios.filter(f => f.ativo);
    return {
      total: funcionarios.length,
      ativos: ativos.length,
      inativos: funcionarios.length - ativos.length,
      folhaPagamento: ativos.reduce((sum, f) => sum + f.salario, 0),
      departamentos: new Set(funcionarios.map(f => f.departamento)).size,
    };
  },

  async desativar(id) {
    return this.update(id, { ativo: false, status: 'Inativo' });
  },

  async ativar(id) {
    return this.update(id, { ativo: true, status: 'Ativo' });
  },
};
