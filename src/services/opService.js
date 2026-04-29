import { storage } from './storage';

const ETAPAS_FLUXO = [
  'Programação','Engenharia','Corte a Laser','Retirada','Rebarbação',
  'Dobra','Solda','Montagem','Acabamento','Qualidade','Embalagem','Expedição'
];

const MOCK_INICIAL = [
  { id: 1, numero: 'OP-00542', pedidoId: 10, clienteId: 5, clienteNome: 'Metalúrgica ABC Ltda', codigoProduto: 'EIX-025', produtoDescricao: 'Eixo Transmissão 25mm', quantidade: 50, unidade: 'UN', dataEmissao: '2026-04-17T00:00:00Z', prazo: '2026-04-25T00:00:00Z', status: 'em_andamento', prioridade: 'Alta', responsavel: 'João M.', observacao: 'Acabamento polido', informacaoComplementar: 'ITEM 01 do PV-00541', createdAt: '2026-04-17T08:00:00Z', updatedAt: '2026-04-17T08:00:00Z' },
  { id: 2, numero: 'OP-00541', pedidoId: 9, clienteId: 3, clienteNome: 'SiderTech S/A', codigoProduto: 'ROL-ESP-01', produtoDescricao: 'Conjunto Rolamento Especial', quantidade: 20, unidade: 'UN', dataEmissao: '2026-04-16T00:00:00Z', prazo: '2026-04-28T00:00:00Z', status: 'aberta', prioridade: 'Normal', responsavel: 'Pedro A.', observacao: '', informacaoComplementar: '', createdAt: '2026-04-16T09:00:00Z', updatedAt: '2026-04-16T09:00:00Z' },
  { id: 3, numero: 'OP-00540', pedidoId: 8, clienteId: 2, clienteNome: 'TechParts Ltda', codigoProduto: 'FLA-INOX-3', produtoDescricao: 'Flange Aço Inox 3"', quantidade: 100, unidade: 'UN', dataEmissao: '2026-04-15T00:00:00Z', prazo: '2026-04-22T00:00:00Z', status: 'em_andamento', prioridade: 'Urgente', responsavel: 'João M.', observacao: 'Urgente - cliente aguardando', informacaoComplementar: '', createdAt: '2026-04-15T07:30:00Z', updatedAt: '2026-04-15T07:30:00Z' },
  { id: 4, numero: 'OP-00539', pedidoId: 7, clienteId: 4, clienteNome: 'Grupo Delta', codigoProduto: 'RED-MOD5', produtoDescricao: 'Caixa Redutora Mod.5', quantidade: 5, unidade: 'UN', dataEmissao: '2026-04-14T00:00:00Z', prazo: '2026-05-02T00:00:00Z', status: 'pausada', prioridade: 'Normal', responsavel: 'Maria L.', observacao: 'Aguardando componente importado', informacaoComplementar: '', createdAt: '2026-04-14T10:00:00Z', updatedAt: '2026-04-14T10:00:00Z' },
  { id: 5, numero: 'OP-00538', pedidoId: 6, clienteId: 1, clienteNome: 'Ind. XYZ S/A', codigoProduto: 'PAR-M12-ESP', produtoDescricao: 'Parafuso Especial M12', quantidade: 500, unidade: 'UN', dataEmissao: '2026-04-12T00:00:00Z', prazo: '2026-04-18T00:00:00Z', status: 'concluida', prioridade: 'Baixa', responsavel: 'Pedro A.', observacao: '', informacaoComplementar: '', createdAt: '2026-04-12T08:00:00Z', updatedAt: '2026-04-18T16:00:00Z' },
  { id: 6, numero: 'OP-00537', pedidoId: 5, clienteId: 5, clienteNome: 'Metalúrgica ABC Ltda', codigoProduto: 'BUC-BRZ-3040', produtoDescricao: 'Bucha Bronze 30x40', quantidade: 200, unidade: 'UN', dataEmissao: '2026-04-10T00:00:00Z', prazo: '2026-04-17T00:00:00Z', status: 'concluida', prioridade: 'Normal', responsavel: 'Carlos S.', observacao: '', informacaoComplementar: '', createdAt: '2026-04-10T08:00:00Z', updatedAt: '2026-04-17T15:00:00Z' },
];

// Inicializa localStorage com dados mock apenas se ainda não existir
if (!localStorage.getItem('nomus_erp_ops')) {
  storage.set('ops', MOCK_INICIAL);
  storage.set('ops_next_id', 7);
}

const getAll = () => storage.get('ops', MOCK_INICIAL);
const getNextId = () => storage.get('ops_next_id', 7);
const save = (ops) => storage.set('ops', ops);
const saveNextId = (id) => storage.set('ops_next_id', id);

// Verifica se todas as etapas foram concluídas → atualiza OP para concluída
export const checkAndFinalizarOP = (opId) => {
  const apontamentos = storage.get('apontamentos', []).filter(a => a.opId === Number(opId));
  const concluidas = new Set(apontamentos.filter(a => a.status === 'Finalizado').map(a => a.etapa));
  const todasConcluidas = ETAPAS_FLUXO.every(e => concluidas.has(e));

  if (todasConcluidas) {
    const ops = getAll();
    const updated = ops.map(o =>
      o.id === Number(opId) ? { ...o, status: 'concluida', updatedAt: new Date().toISOString() } : o
    );
    save(updated);
    return true;
  }
  // Se tem algum apontamento ativo, marca como em_andamento
  const temAtivo = apontamentos.some(a => a.status === 'Em Andamento');
  if (temAtivo) {
    const ops = getAll();
    const op = ops.find(o => o.id === Number(opId));
    if (op && op.status === 'aberta') {
      save(ops.map(o => o.id === Number(opId) ? { ...o, status: 'em_andamento', updatedAt: new Date().toISOString() } : o));
    }
  }
  return false;
};

export const opService = {
  getAll: async () => ({ success: true, data: getAll() }),

  getById: async (id) => {
    const op = getAll().find(o => o.id === Number(id));
    return { success: true, data: op };
  },

  create: async (data) => {
    const ops = getAll();
    const nextId = getNextId();
    const numero = `OP-${String(nextId + 535).padStart(5, '0')}`;
    const nova = { ...data, id: nextId, numero, status: 'aberta', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    save([nova, ...ops]);
    saveNextId(nextId + 1);
    return { success: true, data: nova };
  },

  update: async (id, data) => {
    const ops = getAll().map(o => o.id === Number(id) ? { ...o, ...data, updatedAt: new Date().toISOString() } : o);
    save(ops);
    return { success: true, data };
  },

  delete: async (id) => {
    save(getAll().filter(o => o.id !== Number(id)));
    return { success: true };
  },

  getData: () => getAll(),
};