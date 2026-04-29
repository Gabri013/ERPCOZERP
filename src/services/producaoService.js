import { storage } from './storage';

const COLLECTION_NAME = 'ordens_producao';

const MOCK_OPS = [
  {
    id: '1',
    numero: 'OP-001',
    produto: { id: '1', nome: 'Eixo Transmissão 25mm' },
    quantidade: 50,
    dataInicio: new Date('2026-04-20').toISOString(),
    dataTermino: new Date('2026-04-25').toISOString(),
    status: 'Em Execução',
    responsavel: '2',
    maquina: 'MAQ-001',
    roteiro: 'ROT-001',
    apontamentos: 16,
    ciclos: [
      {
        etapa: 'Corte',
        status: 'Concluído',
        dataInicio: new Date('2026-04-20').toISOString(),
        dataTermino: new Date('2026-04-21').toISOString(),
        responsavel: '2',
      },
      {
        etapa: 'Usinagem',
        status: 'Em Execução',
        dataInicio: new Date('2026-04-21').toISOString(),
        dataTermino: null,
        responsavel: '2',
      },
    ],
    observacoes: '',
    criadoPor: '1',
  },
];

if (!localStorage.getItem('nomus_erp_ordens_producao')) {
  storage.set('ordens_producao', MOCK_OPS);
}

export const producaoService = {
  async getAll() {
    return storage.get('ordens_producao', MOCK_OPS);
  },

  async getById(id) {
    const ops = storage.get('ordens_producao', MOCK_OPS);
    return ops.find(o => o.id === id) || null;
  },

  async create(op) {
    const ops = storage.get('ordens_producao', MOCK_OPS);
    const nova = {
      ...op,
      id: Date.now().toString(),
    };
    storage.set('ordens_producao', [...ops, nova]);
    return nova;
  },

  async update(id, data) {
    const ops = storage.get('ordens_producao', MOCK_OPS);
    const updated = ops.map(o =>
      o.id === id ? { ...o, ...data } : o
    );
    storage.set('ordens_producao', updated);
    return { id, ...data };
  },

  async delete(id) {
    const ops = storage.get('ordens_producao', MOCK_OPS);
    storage.set('ordens_producao', ops.filter(o => o.id !== id));
  },

  async getByStatus(status) {
    const ops = await this.getAll();
    return ops.filter(o => o.status === status);
  },

  async getEmAndamento() {
    return this.getByStatus('Em Execução');
  },

  async getFinalizadas() {
    return this.getByStatus('Finalizada');
  },

  async getAtrasadas() {
    const ops = await this.getAll();
    const hoje = new Date();
    return ops.filter(o =>
      new Date(o.dataTermino) < hoje && 
      !['Finalizada', 'Cancelada'].includes(o.status)
    );
  },

  async getByResponsavel(responsavelId) {
    const ops = await this.getAll();
    return ops.filter(o => o.responsavel === responsavelId);
  },

  async getByMaquina(maquinaId) {
    const ops = await this.getAll();
    return ops.filter(o => o.maquina === maquinaId);
  },

  async getByProduto(produtoId) {
    const ops = await this.getAll();
    return ops.filter(o => o.produto.id === produtoId);
  },

  async getProgressoProducao(opId) {
    const op = await this.getById(opId);
    if (!op || !op.ciclos) return 0;

    const concluidas = op.ciclos.filter(c => c.status === 'Concluído').length;
    return Math.round((concluidas / op.ciclos.length) * 100);
  },

  async atualizarCiclo(opId, cicloIndex, dados) {
    const op = await this.getById(opId);
    if (!op) throw new Error('OP não encontrada');

    const ciclos = [...op.ciclos];
    ciclos[cicloIndex] = { ...ciclos[cicloIndex], ...dados };
    return this.update(opId, { ciclos });
  },

  async atualizarStatus(id, novoStatus) {
    const data = { status: novoStatus };
    if (novoStatus === 'Finalizada') {
      data.dataTermino = new Date().toISOString();
    }
    return this.update(id, data);
  },

  async count() {
    const ops = await this.getAll();
    return ops.length;
  },

  onOPsChange(callback) {
    return () => {};
  },

  async search(termo) {
    const ops = await this.getAll();
    const termo_lower = termo.toLowerCase();
    return ops.filter(o =>
      o.numero.toLowerCase().includes(termo_lower) ||
      o.produto.nome.toLowerCase().includes(termo_lower)
    );
  },

  async getStats() {
    const ops = await this.getAll();
    return {
      total: ops.length,
      planejadas: ops.filter(o => o.status === 'Planejada').length,
      emAndamento: ops.filter(o => o.status === 'Em Execução').length,
      paradas: ops.filter(o => o.status === 'Parada').length,
      finalizadas: ops.filter(o => o.status === 'Finalizada').length,
      canceladas: ops.filter(o => o.status === 'Cancelada').length,
      atrasadas: ops.filter(o =>
        new Date(o.dataTermino) < new Date() && 
        !['Finalizada', 'Cancelada'].includes(o.status)
      ).length,
    };
  },
};
