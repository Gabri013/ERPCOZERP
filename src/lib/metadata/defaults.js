export const DEFAULT_METADATA_VERSION = '1.0.0';

export const ENTITY_TYPES = {
  MASTER: 'master',
  TRANSACTION: 'transaction',
  CONFIG: 'config',
};

export const FIELD_TYPES = {
  text: { label: 'Texto' },
  number: { label: 'Número' },
  boolean: { label: 'Sim/Não' },
  date: { label: 'Data' },
  select: { label: 'Seleção' },
  multiselect: { label: 'Seleção múltipla' },
  reference: { label: 'Referência' },
  textarea: { label: 'Área de texto' },
  currency: { label: 'Moeda' },
};

export const DEFAULT_ENTITIES = [
  {
    id: 'produto',
    name: 'Produto',
    code: 'PROD',
    type: ENTITY_TYPES.MASTER,
    description: 'Cadastro mestre de produtos, matérias-primas e serviços.',
    icon: 'Package',
    permissions: { read: ['ver_estoque'], write: ['editar_produtos'], delete: ['editar_produtos'] },
    fields: [
      { key: 'codigo', label: 'Código', type: 'text', required: true, unique: true },
      { key: 'descricao', label: 'Descrição', type: 'text', required: true },
      { key: 'tipo', label: 'Tipo', type: 'select', required: true, options: ['Produto', 'Serviço', 'Matéria-Prima', 'Semi-Acabado'] },
      { key: 'grupo', label: 'Grupo', type: 'text' },
      { key: 'unidade', label: 'Unidade', type: 'select', options: ['UN', 'PC', 'CX', 'KG', 'M', 'H'] },
      { key: 'preco_custo', label: 'Preço de Custo', type: 'currency' },
      { key: 'preco_venda', label: 'Preço de Venda', type: 'currency' },
      { key: 'estoque_minimo', label: 'Estoque Mínimo', type: 'number' },
      { key: 'lead_time_compra', label: 'Lead Time de Compra (dias)', type: 'number' },
      { key: 'lead_time_producao', label: 'Lead Time de Produção (dias)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Ativo', 'Inativo'] },
    ],
  },
  {
    id: 'op',
    name: 'Ordem de Produção',
    code: 'OP',
    type: ENTITY_TYPES.TRANSACTION,
    description: 'Controle de ordens de produção com apontamento e status.',
    icon: 'Factory',
    permissions: { read: ['ver_op'], write: ['criar_op', 'editar_op'], delete: ['editar_op'] },
    fields: [
      { key: 'numero', label: 'Número', type: 'text', required: true, unique: true, readOnly: true },
      { key: 'pedidoId', label: 'Pedido de Venda', type: 'reference', reference: 'pedido_venda' },
      { key: 'clienteNome', label: 'Cliente', type: 'text', required: true },
      { key: 'produtoId', label: 'Produto', type: 'reference', reference: 'produto', required: true },
      { key: 'quantidade', label: 'Quantidade', type: 'number', required: true },
      { key: 'unidade', label: 'Unidade', type: 'select', options: ['UN', 'PC', 'KG', 'M', 'H'] },
      { key: 'status', label: 'Status', type: 'select', required: true, options: ['aberta', 'em_andamento', 'pausada', 'concluida', 'cancelada'] },
      { key: 'prioridade', label: 'Prioridade', type: 'select', options: ['Baixa', 'Normal', 'Alta', 'Urgente'] },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'prazo', label: 'Prazo', type: 'date' },
    ],
  },
  {
    id: 'cliente',
    name: 'Cliente',
    code: 'CLI',
    type: ENTITY_TYPES.MASTER,
    description: 'Cadastro comercial de clientes e limites de crédito.',
    icon: 'Users',
    permissions: { read: ['ver_clientes'], write: ['editar_clientes'], delete: ['editar_clientes'] },
    fields: [
      { key: 'codigo', label: 'Código', type: 'text', required: true, unique: true },
      { key: 'razao_social', label: 'Razão Social', type: 'text', required: true },
      { key: 'nome_fantasia', label: 'Nome Fantasia', type: 'text' },
      { key: 'cnpj_cpf', label: 'CNPJ/CPF', type: 'text' },
      { key: 'limite_credito', label: 'Limite de Crédito', type: 'currency' },
      { key: 'status', label: 'Status', type: 'select', options: ['Ativo', 'Inativo', 'Bloqueado'] },
    ],
  },
  {
    id: 'workflow_producao',
    name: 'Workflow de Produção',
    code: 'WFP',
    type: ENTITY_TYPES.CONFIG,
    description: 'Fluxo configurável de aprovação e execução da OP.',
    icon: 'Workflow',
    permissions: { read: ['ver_op'], write: ['editar_config'], delete: ['editar_config'] },
    fields: [
      { key: 'name', label: 'Nome', type: 'text', required: true },
      { key: 'enabled', label: 'Ativo', type: 'boolean' },
      { key: 'initialStatus', label: 'Status Inicial', type: 'text', required: true },
    ],
  },
];

export const DEFAULT_RULES = [
  {
    id: 'rule_approve_purchase_over_limit',
    name: 'Aprovação de pedido acima do limite',
    entityId: 'pedido_venda',
    active: true,
    conditions: [
      { field: 'valor_total', operator: '>', value: 20000 },
    ],
    actions: [
      { type: 'set_status', value: 'Aguardando Aprovação' },
      { type: 'notify_role', value: 'gerente_geral' },
    ],
  },
  {
    id: 'rule_finish_op_when_all_steps_done',
    name: 'Finalizar OP quando etapas concluídas',
    entityId: 'op',
    active: true,
    conditions: [
      { field: 'apontamentos_finalizados', operator: '==', value: true },
    ],
    actions: [
      { type: 'set_status', value: 'concluida' },
      { type: 'emit_event', value: 'op.finalizada' },
    ],
  },
];

export const DEFAULT_WORKFLOWS = [
  {
    id: 'workflow_op',
    name: 'Fluxo de Ordem de Produção',
    entityId: 'op',
    active: true,
    steps: [
      { key: 'aberta', label: 'Aberta', approverRoles: ['pcp', 'gerente_producao'], editable: true },
      { key: 'em_andamento', label: 'Em Produção', approverRoles: ['producao', 'gerente_producao'], editable: false },
      { key: 'pausada', label: 'Pausada', approverRoles: ['producao', 'gerente_producao'], editable: true },
      { key: 'concluida', label: 'Concluída', approverRoles: ['gerente_producao'], editable: false },
      { key: 'cancelada', label: 'Cancelada', approverRoles: ['gerente_geral'], editable: false },
    ],
  },
];
