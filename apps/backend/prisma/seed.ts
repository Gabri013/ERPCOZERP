import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const masterEmail = process.env.DEFAULT_MASTER_EMAIL || 'master@Cozinha.com';
  const masterPassword = process.env.DEFAULT_MASTER_PASSWORD || 'master123_dev';
  const seedEnabled = process.env.SEED_ENABLED === 'true';
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (nodeEnv === 'production' && !seedEnabled) {
    return;
  }

  // === ROLES ===
  // Obs: o frontend usa "perfis" e permissões legadas (ex: ver_op, apontar).
  // Aqui garantimos que as roles existam e que tenham um conjunto padrão de permissões.
  const rolesToEnsure = [
    { code: 'master', name: 'Dono', description: 'Acesso total ao sistema' },
    { code: 'gerente', name: 'Gerente', description: 'Gerência geral do sistema' },
    { code: 'gerente_producao', name: 'Gerente de Produção', description: 'Gerência do chão de fábrica/PCP' },
    { code: 'orcamentista_vendas', name: 'Orçamentista e Vendas', description: 'Comercial e orçamento' },
    { code: 'projetista', name: 'Projetista', description: 'Engenharia/Projetos' },
    { code: 'corte_laser', name: 'Corte a Laser', description: 'Operação de corte a laser' },
    { code: 'dobra_montagem', name: 'Dobra e Montagem', description: 'Operação de dobra e montagem' },
    { code: 'solda', name: 'Solda', description: 'Operação de solda' },
    { code: 'expedicao', name: 'Expedição', description: 'Expedição e logística' },
    { code: 'qualidade', name: 'Qualidade', description: 'Qualidade e inspeção' },
    { code: 'user', name: 'Usuário', description: 'Usuário operacional (genérico)' },
  ];

  const rolesByCode = new Map<string, { id: string; code: string }>();
  for (const r of rolesToEnsure) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description, active: true },
      create: { code: r.code, name: r.name, description: r.description, active: true },
    });
    rolesByCode.set(role.code, role);
  }

  const masterRole = rolesByCode.get('master')!;

  // === PERMISSIONS (legado do frontend) ===
  const perms = [
    // Core engine / no-code
    { code: 'entity.manage', name: 'Gerenciar Entidades', category: 'core' },
    { code: 'record.manage', name: 'Gerenciar Registros (CRUD)', category: 'core' },
    { code: 'relatorios:view', name: 'Ver Relatórios', category: 'relatorios' },
    { code: 'ver_crm', name: 'Ver CRM', category: 'crm' },
    { code: 'ver_fiscal', name: 'Ver Fiscal', category: 'fiscal' },
    { code: 'ver_folha', name: 'Ver Folha', category: 'rh' },
    // Vendas
    { code: 'ver_pedidos', name: 'Ver Pedidos de Venda', category: 'vendas' },
    { code: 'criar_pedidos', name: 'Criar Pedidos', category: 'vendas' },
    { code: 'editar_pedidos', name: 'Editar Pedidos', category: 'vendas' },
    { code: 'aprovar_pedidos', name: 'Aprovar Pedidos', category: 'vendas' },
    { code: 'ver_clientes', name: 'Ver Clientes', category: 'vendas' },
    { code: 'editar_clientes', name: 'Criar/Editar Clientes', category: 'vendas' },
    { code: 'ver_orcamentos', name: 'Ver Orçamentos', category: 'vendas' },
    { code: 'criar_orcamentos', name: 'Criar Orçamentos', category: 'vendas' },
    // Estoque
    { code: 'ver_estoque', name: 'Ver Estoque', category: 'estoque' },
    { code: 'movimentar_estoque', name: 'Movimentar Estoque', category: 'estoque' },
    { code: 'editar_produtos', name: 'Criar/Editar Produtos', category: 'estoque' },
    // Compras
    { code: 'ver_compras', name: 'Ver Compras', category: 'compras' },
    { code: 'criar_oc', name: 'Criar Ordens de Compra', category: 'compras' },
    { code: 'editar_fornecedores', name: 'Editar Fornecedores', category: 'compras' },
    // Produção
    { code: 'ver_op', name: 'Ver Ordens de Produção', category: 'producao' },
    { code: 'criar_op', name: 'Criar OPs', category: 'producao' },
    { code: 'editar_op', name: 'Editar OPs', category: 'producao' },
    { code: 'apontar', name: 'Apontar Produção', category: 'producao' },
    { code: 'ver_kanban', name: 'Ver Kanban', category: 'producao' },
    { code: 'ver_pcp', name: 'Ver PCP', category: 'producao' },
    { code: 'ver_roteiros', name: 'Ver Roteiros', category: 'producao' },
    { code: 'ver_maquinas', name: 'Ver Máquinas', category: 'producao' },
    { code: 'ver_chao_fabrica', name: 'Ver Chão de Fábrica', category: 'producao' },
    // Financeiro
    { code: 'ver_financeiro', name: 'Ver Financeiro', category: 'financeiro' },
    { code: 'editar_financeiro', name: 'Criar/Editar Lançamentos', category: 'financeiro' },
    { code: 'aprovar_financeiro', name: 'Aprovar (Gerencial)', category: 'financeiro' },
    { code: 'ver_relatorio_financeiro', name: 'Relatório Financeiro', category: 'financeiro' },
    // RH
    { code: 'ver_rh', name: 'Ver RH', category: 'rh' },
    { code: 'editar_funcionarios', name: 'Criar/Editar Funcionários', category: 'rh' },
    // Relatórios / Config
    { code: 'ver_relatorios', name: 'Ver Relatórios (legado)', category: 'relatorios' },
    { code: 'editar_config', name: 'Configurações do Sistema', category: 'config' },
    { code: 'gerenciar_usuarios', name: 'Gerenciar Usuários', category: 'config' },
    { code: 'impersonate', name: 'Ver como outro usuário', category: 'config' },
    // Backend modules
    { code: 'user.manage', name: 'Gerenciar usuários (API)', category: 'config' },
  ];

  for (const p of perms) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { name: p.name, category: p.category, active: true },
      create: { code: p.code, name: p.name, category: p.category, active: true, type: 'action' },
    });
  }

  // master recebe todas permissões
  const allPerms = await prisma.permission.findMany({ where: { active: true } });
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: masterRole.id, permissionId: perm.id } },
      update: { granted: true },
      create: { roleId: masterRole.id, permissionId: perm.id, granted: true },
    });
  }

  // === Permissões padrão por role ===
  const permsByRoleCode: Record<string, string[]> = {
    // gerente: quase tudo operacional (sem gerenciar usuários)
    gerente: [
      'record.manage','entity.manage',
      'ver_pedidos','criar_pedidos','editar_pedidos','aprovar_pedidos','ver_clientes','editar_clientes','ver_orcamentos','criar_orcamentos',
      'ver_estoque','movimentar_estoque','editar_produtos',
      'ver_compras','criar_oc','editar_fornecedores',
      'ver_op','criar_op','editar_op','apontar','ver_kanban','ver_pcp','ver_roteiros','ver_maquinas','ver_chao_fabrica',
      'ver_financeiro','editar_financeiro','aprovar_financeiro','ver_relatorio_financeiro',
      'ver_rh','editar_funcionarios','ver_folha',
      'ver_relatorios','relatorios:view','editar_config',
      'ver_crm','ver_fiscal',
    ],
    gerente_producao: ['record.manage','entity.manage','ver_op','criar_op','editar_op','apontar','ver_kanban','ver_pcp','ver_roteiros','ver_maquinas','ver_chao_fabrica','ver_estoque','ver_relatorios','relatorios:view'],
    orcamentista_vendas: ['record.manage','entity.manage','ver_pedidos','criar_pedidos','editar_pedidos','ver_clientes','editar_clientes','ver_orcamentos','criar_orcamentos','ver_relatorios','relatorios:view','ver_crm'],
    projetista: ['record.manage','entity.manage','ver_op','ver_pcp','ver_roteiros','ver_relatorios','relatorios:view'],
    // Operadores (chão): sem acesso ao "no-code" (record.manage/entity.manage)
    corte_laser: ['ver_op', 'apontar', 'ver_chao_fabrica'],
    dobra_montagem: ['ver_op', 'apontar', 'ver_chao_fabrica'],
    solda: ['ver_op', 'apontar', 'ver_chao_fabrica'],
    expedicao: ['ver_op', 'apontar', 'ver_chao_fabrica'],
    qualidade: ['ver_op', 'apontar', 'ver_chao_fabrica', 'ver_relatorios', 'relatorios:view'],
    // Usuário básico (visualização): sem CRUD genérico
    user: ['ver_relatorios', 'relatorios:view'],
  };

  const permRecords = await prisma.permission.findMany({ where: { active: true } });
  const permIdByCode = new Map(permRecords.map((p) => [p.code, p.id]));

  for (const [roleCode, permCodes] of Object.entries(permsByRoleCode)) {
    const role = rolesByCode.get(roleCode);
    if (!role) continue;

    // Mantém master com "tudo"; para as demais roles sincroniza permissões
    if (roleCode !== 'master') {
      await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    }

    for (const code of permCodes) {
      const permId = permIdByCode.get(code);
      if (!permId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permId } },
        update: { granted: true },
        create: { roleId: role.id, permissionId: permId, granted: true },
      });
    }
  }

  const hash = await bcrypt.hash(masterPassword, 12);
  const master = await prisma.user.upsert({
    where: { email: masterEmail },
    update: { passwordHash: hash, fullName: 'Master / Owner', active: true, emailVerified: true },
    create: { email: masterEmail, passwordHash: hash, fullName: 'Master / Owner', active: true, emailVerified: true },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: master.id, roleId: masterRole.id } },
    update: {},
    create: { userId: master.id, roleId: masterRole.id, assignedBy: master.id },
  });

  // === Usuários demo por setor/role (para validação de RBAC e "Ver como") ===
  const demoPassword = process.env.DEFAULT_DEMO_PASSWORD || 'demo123_dev';
  const demoHash = await bcrypt.hash(demoPassword, 12);
  async function ensureDemoUser(email: string, fullName: string, roleCode: string) {
    const role = rolesByCode.get(roleCode);
    if (!role) return null;

    const created = await prisma.user.upsert({
      where: { email },
      update: { passwordHash: demoHash, fullName, active: true, emailVerified: true },
      create: { email, passwordHash: demoHash, fullName, active: true, emailVerified: true },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: created.id, roleId: role.id } },
      update: {},
      create: { userId: created.id, roleId: role.id, assignedBy: master.id },
    });

    return created;
  }

  await ensureDemoUser('gerente@cozinha.com', 'Gerente Geral', 'gerente');
  await ensureDemoUser('gerente.producao@cozinha.com', 'Gerente Produção', 'gerente_producao');
  await ensureDemoUser('vendas@cozinha.com', 'Vendas / Orçamento', 'orcamentista_vendas');
  await ensureDemoUser('engenharia@cozinha.com', 'Engenharia / Projetos', 'projetista');
  await ensureDemoUser('laser@cozinha.com', 'Operador Laser', 'corte_laser');
  await ensureDemoUser('dobra@cozinha.com', 'Operador Dobra/Montagem', 'dobra_montagem');
  await ensureDemoUser('solda@cozinha.com', 'Operador Solda', 'solda');
  await ensureDemoUser('qualidade@cozinha.com', 'Qualidade', 'qualidade');
  await ensureDemoUser('expedicao@cozinha.com', 'Expedição', 'expedicao');

  // Notificações iniciais (somente se não existir nenhuma ainda)
  const notifCount = await prisma.userNotification.count({ where: { userId: master.id } });
  if (notifCount === 0) {
    await prisma.userNotification.createMany({
      data: [
        { userId: master.id, sector: 'Vendas', type: 'warning', text: '3 pedidos aguardando aprovação' },
        { userId: master.id, sector: 'Estoque', type: 'danger', text: 'Estoque baixo: Rolamento 6205-ZZ' },
        { userId: master.id, sector: 'Produção', type: 'success', text: 'OP #0542 concluída com sucesso' },
        { userId: master.id, sector: 'Financeiro', type: 'warning', text: 'Conta a pagar vencendo amanhã: R$ 3.840' },
      ],
    });
  }

  // === ENTITIES + RECORDS (dados base de operação) ===
  // Objetivo: evitar telas vazias e eliminar dependência de mocks do frontend.
  type SeedField = {
    id: string;
    code: string;
    label: string;
    data_type: 'text' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect' | 'reference' | 'textarea' | 'currency';
    required?: boolean;
    unique?: boolean;
    hidden?: boolean;
    readOnly?: boolean;
    width?: string;
    data_type_params?: Record<string, any>;
  };

  async function ensureEntity(code: string, name: string, config?: { fields?: SeedField[]; [k: string]: any }) {
    return prisma.entity.upsert({
      where: { code },
      update: { name, config: config ?? undefined },
      create: { code, name, config: config ?? undefined },
    });
  }

  async function seedEntityRecordsIfEmpty(entityCode: string, entityName: string, records: Record<string, any>[]) {
    const entity = await ensureEntity(entityCode, entityName, CORE_ENTITY_CONFIGS[entityCode]);
    const count = await prisma.entityRecord.count({ where: { entityId: entity.id, deletedAt: null } });
    if (count > 0) return;

    for (const r of records) {
      await prisma.entityRecord.create({
        data: {
          entityId: entity.id,
          data: r,
          createdBy: master.id,
          updatedBy: master.id,
        },
      });
    }
  }

  const CORE_ENTITY_CONFIGS: Record<string, { fields: SeedField[] }> = {
    cliente: {
      fields: [
        { id: 'cliente.codigo', code: 'codigo', label: 'Código', data_type: 'text', required: true, unique: true },
        { id: 'cliente.razao_social', code: 'razao_social', label: 'Razão Social', data_type: 'text', required: true },
        { id: 'cliente.nome_fantasia', code: 'nome_fantasia', label: 'Nome Fantasia', data_type: 'text' },
        { id: 'cliente.cnpj_cpf', code: 'cnpj_cpf', label: 'CNPJ/CPF', data_type: 'text' },
        { id: 'cliente.email', code: 'email', label: 'E-mail', data_type: 'text' },
        { id: 'cliente.telefone', code: 'telefone', label: 'Telefone', data_type: 'text' },
        { id: 'cliente.cidade', code: 'cidade', label: 'Cidade', data_type: 'text' },
        { id: 'cliente.estado', code: 'estado', label: 'Estado', data_type: 'text' },
        { id: 'cliente.status', code: 'status', label: 'Status', data_type: 'select', data_type_params: { options: ['Ativo', 'Inativo', 'Bloqueado'] } },
      ],
    },
    fornecedor: {
      fields: [
        { id: 'fornecedor.codigo', code: 'codigo', label: 'Código', data_type: 'text', required: true, unique: true },
        { id: 'fornecedor.nome', code: 'nome', label: 'Nome', data_type: 'text', required: true },
        { id: 'fornecedor.razao_social', code: 'razao_social', label: 'Razão Social', data_type: 'text' },
        { id: 'fornecedor.cnpj_cpf', code: 'cnpj_cpf', label: 'CNPJ/CPF', data_type: 'text' },
        { id: 'fornecedor.telefone', code: 'telefone', label: 'Telefone', data_type: 'text' },
        { id: 'fornecedor.cidade', code: 'cidade', label: 'Cidade', data_type: 'text' },
        { id: 'fornecedor.estado', code: 'estado', label: 'Estado', data_type: 'text' },
        { id: 'fornecedor.prazo_entrega', code: 'prazo_entrega', label: 'Prazo de Entrega (dias)', data_type: 'number' },
        { id: 'fornecedor.status', code: 'status', label: 'Status', data_type: 'select', data_type_params: { options: ['Ativo', 'Inativo'] } },
      ],
    },
    produto: {
      fields: [
        { id: 'produto.codigo', code: 'codigo', label: 'Código', data_type: 'text', required: true, unique: true },
        { id: 'produto.descricao', code: 'descricao', label: 'Descrição', data_type: 'text', required: true },
        { id: 'produto.tipo', code: 'tipo', label: 'Tipo', data_type: 'select', required: true, data_type_params: { options: ['Produto', 'Serviço', 'Matéria-Prima', 'Semi-Acabado', 'Insumo'] } },
        { id: 'produto.grupo', code: 'grupo', label: 'Grupo', data_type: 'text' },
        { id: 'produto.unidade', code: 'unidade', label: 'Unidade', data_type: 'select', data_type_params: { options: ['UN', 'PC', 'CX', 'KG', 'M', 'H'] } },
        { id: 'produto.preco_custo', code: 'preco_custo', label: 'Preço de Custo', data_type: 'currency' },
        { id: 'produto.preco_venda', code: 'preco_venda', label: 'Preço de Venda', data_type: 'currency' },
        { id: 'produto.estoque_atual', code: 'estoque_atual', label: 'Estoque Atual', data_type: 'number' },
        { id: 'produto.estoque_minimo', code: 'estoque_minimo', label: 'Estoque Mínimo', data_type: 'number' },
        { id: 'produto.status', code: 'status', label: 'Status', data_type: 'select', data_type_params: { options: ['Ativo', 'Inativo'] } },
      ],
    },
    movimentacao_estoque: {
      fields: [
        { id: 'mov.numero', code: 'numero', label: 'Número', data_type: 'text', required: true, unique: true },
        { id: 'mov.tipo', code: 'tipo', label: 'Tipo', data_type: 'select', required: true, data_type_params: { options: ['Entrada', 'Saída', 'Ajuste'] } },
        { id: 'mov.produto_descricao', code: 'produto_descricao', label: 'Produto', data_type: 'text', required: true },
        { id: 'mov.quantidade', code: 'quantidade', label: 'Quantidade', data_type: 'number', required: true },
        { id: 'mov.unidade', code: 'unidade', label: 'Unidade', data_type: 'select', data_type_params: { options: ['UN', 'PC', 'KG', 'M', 'H'] } },
        { id: 'mov.custo_unitario', code: 'custo_unitario', label: 'Custo Unitário', data_type: 'currency' },
        { id: 'mov.custo_total', code: 'custo_total', label: 'Custo Total', data_type: 'currency' },
        { id: 'mov.data', code: 'data', label: 'Data', data_type: 'date' },
        { id: 'mov.origem', code: 'origem', label: 'Origem', data_type: 'text' },
        { id: 'mov.responsavel', code: 'responsavel', label: 'Responsável', data_type: 'text' },
      ],
    },
    pedido_venda: {
      fields: [
        { id: 'pv.numero', code: 'numero', label: 'Número', data_type: 'text', required: true, unique: true },
        { id: 'pv.cliente_nome', code: 'cliente_nome', label: 'Cliente', data_type: 'text', required: true },
        { id: 'pv.data_emissao', code: 'data_emissao', label: 'Data Emissão', data_type: 'date' },
        { id: 'pv.data_entrega', code: 'data_entrega', label: 'Data Entrega', data_type: 'date' },
        { id: 'pv.vendedor', code: 'vendedor', label: 'Vendedor', data_type: 'text' },
        { id: 'pv.valor_total', code: 'valor_total', label: 'Valor Total', data_type: 'currency' },
        { id: 'pv.status', code: 'status', label: 'Status', data_type: 'select', data_type_params: { options: ['Orçamento', 'Aguardando Aprovação', 'Aprovado', 'Cancelado'] } },
        { id: 'pv.forma_pagamento', code: 'forma_pagamento', label: 'Forma Pagamento', data_type: 'text' },
        { id: 'pv.observacoes', code: 'observacoes', label: 'Observações', data_type: 'textarea' },
      ],
    },
    orcamento: {
      fields: [
        { id: 'orc.numero', code: 'numero', label: 'Número', data_type: 'text', required: true, unique: true },
        { id: 'orc.cliente_nome', code: 'cliente_nome', label: 'Cliente', data_type: 'text', required: true },
        { id: 'orc.data_emissao', code: 'data_emissao', label: 'Data Emissão', data_type: 'date' },
        { id: 'orc.validade', code: 'validade', label: 'Validade', data_type: 'date' },
        { id: 'orc.vendedor', code: 'vendedor', label: 'Vendedor', data_type: 'text' },
        { id: 'orc.valor_total', code: 'valor_total', label: 'Valor Total', data_type: 'currency' },
        { id: 'orc.status', code: 'status', label: 'Status', data_type: 'select', data_type_params: { options: ['Orçamento', 'Aprovado', 'Cancelado'] } },
        { id: 'orc.observacoes', code: 'observacoes', label: 'Observações', data_type: 'textarea' },
      ],
    },
    ordem_compra: {
      fields: [
        { id: 'oc.numero', code: 'numero', label: 'Número', data_type: 'text', required: true, unique: true },
        { id: 'oc.fornecedor_nome', code: 'fornecedor_nome', label: 'Fornecedor', data_type: 'text', required: true },
        { id: 'oc.data_emissao', code: 'data_emissao', label: 'Data Emissão', data_type: 'date' },
        { id: 'oc.data_entrega_prevista', code: 'data_entrega_prevista', label: 'Entrega Prevista', data_type: 'date' },
        { id: 'oc.valor_total', code: 'valor_total', label: 'Valor Total', data_type: 'currency' },
        { id: 'oc.status', code: 'status', label: 'Status', data_type: 'select', data_type_params: { options: ['Rascunho', 'Enviado', 'Recebido', 'Cancelado'] } },
        { id: 'oc.observacoes', code: 'observacoes', label: 'Observações', data_type: 'textarea' },
      ],
    },
  };

  await seedEntityRecordsIfEmpty('cliente', 'Clientes', [
    { codigo: 'CLI-0001', razao_social: 'Metalúrgica ABC Ltda', nome_fantasia: 'Metal ABC', tipo: 'PJ', cnpj_cpf: '12.345.678/0001-90', email: 'contato@metalabc.com.br', telefone: '(11) 3000-1111', cidade: 'São Paulo', estado: 'SP', status: 'Ativo' },
    { codigo: 'CLI-0002', razao_social: 'TechParts Ltda', nome_fantasia: 'TechParts', tipo: 'PJ', cnpj_cpf: '23.456.789/0001-01', email: 'vendas@techparts.com.br', telefone: '(11) 3000-2222', cidade: 'São Paulo', estado: 'SP', status: 'Ativo' },
  ]);

  await seedEntityRecordsIfEmpty('fornecedor', 'Fornecedores', [
    { codigo: 'FOR-0001', nome: 'Distribuidora Sul Ltda', razao_social: 'Distribuidora Sul Ltda', cnpj: '11.222.333/0001-44', cnpj_cpf: '11.222.333/0001-44', telefone: '(11) 3111-0000', cidade: 'São Paulo', estado: 'SP', prazo_entrega: 7, status: 'Ativo' },
    { codigo: 'FOR-0002', nome: 'Fixadores do Brasil', razao_social: 'Fixadores do Brasil', cnpj: '55.666.777/0001-88', cnpj_cpf: '55.666.777/0001-88', telefone: '(11) 3222-0000', cidade: 'São Paulo', estado: 'SP', prazo_entrega: 3, status: 'Ativo' },
  ]);

  await seedEntityRecordsIfEmpty('produto', 'Produtos', [
    { codigo: 'EIX-025', descricao: 'Eixo Transmissão 25mm', unidade: 'UN', tipo: 'Produto', preco_custo: 185.0, preco_venda: 310.0, estoque_atual: 40, estoque_minimo: 20 },
    { codigo: 'ROL-6205', descricao: 'Rolamento 6205-ZZ', unidade: 'UN', tipo: 'Produto', preco_custo: 8.2, preco_venda: 18.9, estoque_atual: 12, estoque_minimo: 30 },
    { codigo: 'CHA-003', descricao: 'Chapa Aço 3mm', unidade: 'PC', tipo: 'Insumo', preco_custo: 320.0, preco_venda: 0, estoque_atual: 20, estoque_minimo: 10 },
  ]);

  await seedEntityRecordsIfEmpty('movimentacao_estoque', 'Movimentações de Estoque', [
    { numero:'MOV-001', tipo:'Entrada', produto_descricao:'Rolamento 6205-ZZ', quantidade:100, unidade:'UN', custo_unitario:8.20, custo_total:820.00, data:'2026-04-18', origem:'OC-00231', responsavel:'João M.' },
    { numero:'MOV-002', tipo:'Saída', produto_descricao:'Eixo Transmissão 25mm', quantidade:10, unidade:'UN', custo_unitario:45.50, custo_total:455.00, data:'2026-04-17', origem:'OP-00542', responsavel:'Pedro A.' },
    { numero:'MOV-003', tipo:'Entrada', produto_descricao:'Chapa Aço 3mm', quantidade:20, unidade:'PC', custo_unitario:320.00, custo_total:6400.00, data:'2026-04-16', origem:'OC-00230', responsavel:'João M.' },
  ]);

  await seedEntityRecordsIfEmpty('tabela_preco', 'Tabela de Preços', [
    { codigo: 'A-001', descricao: 'Eixo Transmissão 25mm', grupo: 'Eixos', unidade: 'UN', preco_custo: 185.0, preco_venda: 310.0 },
    { codigo: 'A-002', descricao: 'Rolamento 6205-ZZ', grupo: 'Rolamentos', unidade: 'UN', preco_custo: 8.2, preco_venda: 18.9 },
  ]);

  await seedEntityRecordsIfEmpty('pedido_venda', 'Pedidos de Venda', [
    { numero: 'PV-00542', cliente_nome: 'Metalúrgica ABC Ltda', data_emissao: '2026-04-18', data_entrega: '2026-04-30', vendedor: 'Carlos Silva', valor_total: 45200, status: 'Orçamento', forma_pagamento: 'Boleto 30 dias', itens: [], observacoes: '' },
    { numero: 'PV-00541', cliente_nome: 'TechParts Ltda', data_emissao: '2026-04-17', data_entrega: '2026-04-28', vendedor: 'Ana Paula', valor_total: 12800, status: 'Aprovado', forma_pagamento: 'À Vista', itens: [], observacoes: '' },
  ]);

  await seedEntityRecordsIfEmpty('orcamento', 'Orçamentos', [
    { numero: 'ORC-00120', cliente_nome: 'Metalúrgica ABC Ltda', data_emissao: '2026-04-18', validade: '2026-05-18', vendedor: 'Carlos Silva', valor_total: 45200, status: 'Orçamento', itens: [], observacoes: '' },
  ]);

  await seedEntityRecordsIfEmpty('ordem_compra', 'Ordens de Compra', [
    { numero: 'OC-00231', fornecedor_nome: 'Distribuidora Sul Ltda', data_emissao: '2026-04-18', data_entrega_prevista: '2026-04-25', valor_total: 820, status: 'Rascunho', itens: [], observacoes: '' },
  ]);

  await seedEntityRecordsIfEmpty('conta_receber', 'Contas a Receber', [
    { descricao: 'PV-00541', cliente_fornecedor: 'TechParts Ltda', categoria: 'Venda', valor: 12800, data_emissao: '2026-04-17', data_vencimento: '2026-05-17', status: 'aberto', documento: 'PV-00541', observacoes: '' },
  ]);

  await seedEntityRecordsIfEmpty('conta_pagar', 'Contas a Pagar', [
    { descricao: 'OC-00231', cliente_fornecedor: 'Distribuidora Sul Ltda', categoria: 'Compra', valor: 820, data_emissao: '2026-04-18', data_vencimento: '2026-05-18', status: 'aberto', documento: 'OC-00231', observacoes: '' },
  ]);

  await seedEntityRecordsIfEmpty('workflow', 'Workflows', [
    { entity_id: '', code: 'aprovacao_pedido_venda', name: 'Aprovação de Pedido de Venda', description: 'Fluxo simples de aprovação', is_active: true, trigger_type: 'manual', config: { requireApproval: true }, steps: [{ id: 'st1', code: 'orcamento', label: 'Orçamento', sort_order: 1 }, { id: 'st2', code: 'aprovado', label: 'Aprovado', sort_order: 2 }] },
  ]);

  await seedEntityRecordsIfEmpty('crm_lead', 'CRM Leads', [
    { nome:'Fabricio Nunes', empresa:'Mec. Nunes Ltda', cargo:'Diretor', email:'fabricio@nunes.com', telefone:'(11) 9 8765-4321', origem:'Site', qualificacao:'Quente', responsavel:'Carlos Silva' },
    { nome:'Lúcia Barros', empresa:'Ind. Barros', cargo:'Gerente Compras', email:'lucia@barros.com', telefone:'(13) 9 7654-3210', origem:'Indicação', qualificacao:'Morno', responsavel:'Ana Paula' },
  ]);

  await seedEntityRecordsIfEmpty('crm_oportunidade', 'CRM Oportunidades', [
    { titulo:'Fornecimento anual rolamentos', empresa:'Metalúrgica ABC', contato:'Márcio Lima', valor:180000, estagio:'Proposta', probabilidade:70, fechamento:'2026-05-30', responsavel:'Carlos Silva' },
    { titulo:'Projeto eixos transmissão lote', empresa:'SiderTech S/A', contato:'Ana Ramos', valor:95000, estagio:'Negociação', probabilidade:85, fechamento:'2026-04-30', responsavel:'Rafael Costa' },
  ]);

  await seedEntityRecordsIfEmpty('cotacao_compra', 'Cotações de Compra', [
    { numero:'COT-0041', descricao:'Rolamentos diversos', fornecedor:'Rolamentos Nacionais Ltda', data_envio:'2026-04-10', validade:'2026-04-25', valor:4100, status:'Recebida' },
    { numero:'COT-0040', descricao:'Rolamentos diversos', fornecedor:'Distribuidora Sul Ltda', data_envio:'2026-04-10', validade:'2026-04-25', valor:4380, status:'Recebida' },
  ]);

  await seedEntityRecordsIfEmpty('rh_funcionario', 'RH Funcionários', [
    { matricula:'MAT-001', nome:'João Melo', cargo:'Operador CNC', departamento:'Produção', tipo_contrato:'CLT', salario:3200, data_admissao:'2021-03-15', status:'Ativo', email:'joao@empresa.com', telefone:'(11) 99999-0001' },
    { matricula:'MAT-002', nome:'Pedro Alves', cargo:'Torneiro Mecânico', departamento:'Produção', tipo_contrato:'CLT', salario:3800, data_admissao:'2019-07-22', status:'Ativo', email:'pedro@empresa.com', telefone:'(11) 99999-0002' },
    { matricula:'MAT-003', nome:'Maria Lima', cargo:'Analista de Qualidade', departamento:'Qualidade', tipo_contrato:'CLT', salario:4500, data_admissao:'2020-11-05', status:'Ativo', email:'maria@empresa.com', telefone:'(11) 99999-0003' },
    { matricula:'MAT-004', nome:'Carlos Santos', cargo:'Gerente de Vendas', departamento:'Vendas', tipo_contrato:'CLT', salario:7200, data_admissao:'2018-01-10', status:'Ativo', email:'carlos@empresa.com', telefone:'(11) 99999-0004' },
    { matricula:'MAT-005', nome:'Ana Paula', cargo:'Analista Financeiro', departamento:'Financeiro', tipo_contrato:'CLT', salario:5100, data_admissao:'2022-06-18', status:'Ativo', email:'ana@empresa.com', telefone:'(11) 99999-0005' },
    { matricula:'MAT-006', nome:'Rafael Costa', cargo:'Vendedor Externo', departamento:'Vendas', tipo_contrato:'CLT', salario:3000, data_admissao:'2023-02-01', status:'Ativo', email:'rafael@empresa.com', telefone:'(11) 99999-0006' },
    { matricula:'MAT-007', nome:'Fernanda Souza', cargo:'Analista de RH', departamento:'RH', tipo_contrato:'CLT', salario:4200, data_admissao:'2021-09-12', status:'Férias', email:'fernanda@empresa.com', telefone:'(11) 99999-0007' },
  ]);

  await seedEntityRecordsIfEmpty('rh_ferias', 'RH Férias', [
    { nome:'João Melo', matricula:'MAT-001', cargo:'Operador CNC', data_inicio:'2026-07-01', data_fim:'2026-07-30', dias:30, status:'Aprovadas', observacoes:'' },
    { nome:'Pedro Alves', matricula:'MAT-002', cargo:'Torneiro Mecânico', data_inicio:'2026-08-01', data_fim:'2026-08-14', dias:14, status:'Aprovadas', observacoes:'' },
    { nome:'Fernanda Souza', matricula:'MAT-007', cargo:'Analista de RH', data_inicio:'2026-04-15', data_fim:'2026-05-14', dias:30, status:'Em Gozo', observacoes:'' },
    { nome:'Carlos Santos', matricula:'MAT-004', cargo:'Gerente de Vendas', data_inicio:'2026-06-01', data_fim:'2026-06-30', dias:30, status:'Pendente', observacoes:'' },
    { nome:'Ana Paula', matricula:'MAT-005', cargo:'Analista Financeiro', data_inicio:'2026-09-01', data_fim:'2026-09-30', dias:30, status:'Solicitada', observacoes:'' },
  ]);

  // Registros de ponto (um record por marcação)
  await seedEntityRecordsIfEmpty('rh_ponto', 'RH Ponto', [
    { nome:'João Melo', matricula:'MAT-001', data:'2026-04-21', entrada:'07:58', saida_almoco:'12:01', retorno:'13:02', saida:'17:05', horas:'8:04', status:'Normal' },
    { nome:'João Melo', matricula:'MAT-001', data:'2026-04-20', entrada:'08:02', saida_almoco:'12:00', retorno:'13:00', saida:'17:10', horas:'8:08', status:'Normal' },
    { nome:'Pedro Alves', matricula:'MAT-002', data:'2026-04-21', entrada:'07:45', saida_almoco:'12:00', retorno:'13:00', saida:'17:00', horas:'8:15', status:'Normal' },
    { nome:'Pedro Alves', matricula:'MAT-002', data:'2026-04-20', entrada:null, saida_almoco:null, retorno:null, saida:null, horas:'0:00', status:'Falta' },
    { nome:'Maria Lima', matricula:'MAT-003', data:'2026-04-21', entrada:'08:05', saida_almoco:'12:00', retorno:'13:00', saida:'18:30', horas:'9:25', status:'Hora Extra' },
    { nome:'Maria Lima', matricula:'MAT-003', data:'2026-04-20', entrada:'08:00', saida_almoco:'12:05', retorno:'13:10', saida:'17:00', horas:'7:45', status:'Normal' },
  ]);

  await seedEntityRecordsIfEmpty('rh_folha_pagamento', 'RH Folha de Pagamento', [
    { nome:'João Melo', matricula:'MAT-001', cargo:'Operador CNC', salario_base:3200, horas_extras:320, descontos:580, liquido:2940, competencia:'2026-04' },
    { nome:'Pedro Alves', matricula:'MAT-002', cargo:'Torneiro Mecânico', salario_base:3800, horas_extras:0, descontos:684, liquido:3116, competencia:'2026-04' },
    { nome:'Maria Lima', matricula:'MAT-003', cargo:'Analista de Qualidade', salario_base:4500, horas_extras:675, descontos:940, liquido:4235, competencia:'2026-04' },
    { nome:'Carlos Santos', matricula:'MAT-004', cargo:'Gerente de Vendas', salario_base:7200, horas_extras:0, descontos:1728, liquido:5472, competencia:'2026-04' },
    { nome:'Ana Paula', matricula:'MAT-005', cargo:'Analista Financeiro', salario_base:5100, horas_extras:0, descontos:1122, liquido:3978, competencia:'2026-04' },
    { nome:'Rafael Costa', matricula:'MAT-006', cargo:'Vendedor Externo', salario_base:3000, horas_extras:0, descontos:540, liquido:2460, competencia:'2026-04' },
  ]);

  await seedEntityRecordsIfEmpty('fiscal_nfe', 'Fiscal NF-e', [
    { numero:'000.001.245', serie:'1', destinatario:'Metalúrgica ABC Ltda', cnpj:'11.222.333/0001-44', data_emissao:'2026-04-18', valor:45200, chave:'35260412345678901234550010002450011', status:'Autorizada' },
    { numero:'000.001.244', serie:'1', destinatario:'Ind. XYZ S/A', cnpj:'22.333.444/0001-55', data_emissao:'2026-04-16', valor:12800, chave:'35260412345678901234550010002440012', status:'Autorizada' },
    { numero:'000.001.243', serie:'1', destinatario:'Comércio Beta', cnpj:'33.444.555/0001-66', data_emissao:'2026-04-14', valor:8900, chave:'35260412345678901234550010002430013', status:'Cancelada' },
    { numero:'000.001.246', serie:'1', destinatario:'SiderTech S/A', cnpj:'44.555.666/0001-77', data_emissao:'2026-04-20', valor:18700, chave:null, status:'Em Digitação' },
  ]);

  await seedEntityRecordsIfEmpty('producao_maquina', 'Produção Máquinas', [
    { codigo:'TNC-01', descricao:'Torno CNC 1', tipo:'Torno CNC', fabricante:'Romi', modelo:'Sprint 32', ano:2019, setor:'Usinagem', status:'Ativo', ultima_manutencao:'2026-03-10', proxima_manutencao:'2026-06-10' },
    { codigo:'TNC-02', descricao:'Torno CNC 2', tipo:'Torno CNC', fabricante:'Romi', modelo:'Sprint 32', ano:2020, setor:'Usinagem', status:'Ativo', ultima_manutencao:'2026-03-12', proxima_manutencao:'2026-06-12' },
    { codigo:'CUS-01', descricao:'Centro de Usinagem', tipo:'Fresadora CNC', fabricante:'Mazak', modelo:'Variaxis 500', ano:2021, setor:'Usinagem', status:'Manutenção', ultima_manutencao:'2026-04-18', proxima_manutencao:'2026-04-25' },
  ]);

  await seedEntityRecordsIfEmpty('compras_recebimento', 'Compras Recebimentos', [
    { numero:'REC-001', ordem_compra:'OC-00231', fornecedor:'Rolamentos Nacionais Ltda', data_recebimento:'2026-04-15', nf:'12345', valor:4100, conferente:'Pedro A.', status:'Conferido' },
    { numero:'REC-002', ordem_compra:'OC-00228', fornecedor:'Motores Elite S/A', data_recebimento:'2026-04-12', nf:'67890', valor:12760, conferente:'João M.', status:'Conferido' },
    { numero:'REC-003', ordem_compra:'OC-00230', fornecedor:'AçoFlex Distribuidora', data_recebimento:'2026-04-18', nf:'11223', valor:8200, conferente:'Maria L.', status:'Divergência' },
    { numero:'REC-004', ordem_compra:'OC-00232', fornecedor:'Fixadores do Brasil', data_recebimento:'2026-04-20', nf:null, valor:1540, conferente:null, status:'Aguardando NF' },
  ]);

  await seedEntityRecordsIfEmpty('estoque_inventario', 'Estoque Inventário', [
    { codigo:'A-001', descricao:'Eixo Transmissão 25mm', localizacao:'A-01-01', estoque_sistema:120, estoque_contado:118, diferenca:-2, status:'Divergente' },
    { codigo:'A-002', descricao:'Rolamento 6205 2RS', localizacao:'A-01-02', estoque_sistema:350, estoque_contado:350, diferenca:0, status:'Conferido' },
    { codigo:'B-001', descricao:'Flange Aço Inox 3\"', localizacao:'B-02-01', estoque_sistema:45, estoque_contado:48, diferenca:3, status:'Divergente' },
    { codigo:'C-001', descricao:'Caixa Redutora Mod.5', localizacao:'C-03-01', estoque_sistema:8, estoque_contado:null, diferenca:null, status:'Pendente' },
  ]);

  await seedEntityRecordsIfEmpty('ordem_producao', 'Ordens de Produção', [
    { numero:'OP-00542', pedidoId: 10, clienteId: 5, clienteNome: 'Metalúrgica ABC Ltda', codigoProduto: 'EIX-025', produtoDescricao: 'Eixo Transmissão 25mm', quantidade: 50, unidade: 'UN', dataEmissao: '2026-04-17T00:00:00Z', prazo: '2026-04-25T00:00:00Z', status: 'em_andamento', prioridade: 'Alta', responsavel: 'João M.', observacao: 'Acabamento polido', informacaoComplementar: 'ITEM 01 do PV-00541' },
    { numero:'OP-00541', pedidoId: 9, clienteId: 3, clienteNome: 'SiderTech S/A', codigoProduto: 'ROL-ESP-01', produtoDescricao: 'Conjunto Rolamento Especial', quantidade: 20, unidade: 'UN', dataEmissao: '2026-04-16T00:00:00Z', prazo: '2026-04-28T00:00:00Z', status: 'aberta', prioridade: 'Normal', responsavel: 'Pedro A.', observacao: '', informacaoComplementar: '' },
    { numero:'OP-00540', pedidoId: 8, clienteId: 2, clienteNome: 'TechParts Ltda', codigoProduto: 'FLA-INOX-3', produtoDescricao: 'Flange Aço Inox 3\"', quantidade: 100, unidade: 'UN', dataEmissao: '2026-04-15T00:00:00Z', prazo: '2026-04-22T00:00:00Z', status: 'em_andamento', prioridade: 'Urgente', responsavel: 'João M.', observacao: 'Urgente - cliente aguardando', informacaoComplementar: '' },
  ]);

  await seedEntityRecordsIfEmpty('apontamento_producao', 'Apontamentos de Produção', [
    { opId: 'OP-00542', etapa: 'Corte a Laser', operador: 'José Pereira', setor: 'Laser', horaInicio: '2026-04-17T08:00:00Z', horaFim: '2026-04-17T10:30:00Z', quantidade: 30, refugo: 0, status: 'Finalizado', observacao: '' },
    { opId: 'OP-00542', etapa: 'Rebarbação', operador: 'Marcos Lima', setor: 'Rebarbação', horaInicio: '2026-04-17T11:00:00Z', horaFim: '2026-04-17T13:00:00Z', quantidade: 30, refugo: 1, status: 'Finalizado', observacao: '1 peça com rebarbação excessiva' },
    { opId: 'OP-00542', etapa: 'Dobra', operador: 'Carlos Silva', setor: 'Dobra', horaInicio: '2026-04-18T08:00:00Z', horaFim: null, quantidade: null, refugo: null, status: 'Em Andamento', observacao: '' },
    { opId: 'OP-00540', etapa: 'Corte a Laser', operador: 'José Pereira', setor: 'Laser', horaInicio: '2026-04-15T09:00:00Z', horaFim: '2026-04-15T12:00:00Z', quantidade: 100, refugo: 0, status: 'Finalizado', observacao: '' },
  ]);

  await seedEntityRecordsIfEmpty('historico_op', 'Histórico OP (Kanban)', []);

  // garante roles existirem (sem atribuir)
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

