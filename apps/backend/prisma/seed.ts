import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';

/** Lista de entidades com permissões `entidade.view|create|edit|delete` — manter em sync com `src/infra/entity-permissions.ts`. */
const GRANULAR_ENTITY_CODES = [
  'cliente',
  'fornecedor',
  'produto',
  'movimentacao_estoque',
  'pedido_venda',
  'orcamento',
  'ordem_compra',
  'tabela_preco',
  'conta_receber',
  'conta_pagar',
  'ordem_producao',
  'apontamento_producao',
  'rh_funcionario',
  'fiscal_nfe',
  'crm_lead',
  'crm_oportunidade',
  'crm_atividade',
  'crm_rules',
  'cotacao_compra',
  'historico_op',
  'workflow',
] as const;

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
    { code: 'master',            name: 'Dono',                  description: 'Acesso total ao sistema' },
    { code: 'gerente',           name: 'Gerente',               description: 'Gerência geral do sistema' },
    { code: 'gerente_producao',  name: 'Gerente de Produção',   description: 'Gerência do chão de fábrica/PCP' },
    { code: 'orcamentista_vendas', name: 'Orçamentista e Vendas', description: 'Comercial e orçamento' },
    { code: 'projetista',        name: 'Projetista',            description: 'Engenharia/Projetos/BOM' },
    { code: 'compras',           name: 'Compras',               description: 'Suprimentos e ordens de compra' },
    { code: 'corte_laser',       name: 'Corte a Laser',         description: 'Operação de corte a laser' },
    { code: 'dobra_montagem',    name: 'Dobra e Montagem',      description: 'Operação de dobra e montagem' },
    { code: 'solda',             name: 'Solda',                 description: 'Operação de solda' },
    { code: 'expedicao',         name: 'Expedição',             description: 'Expedição e logística' },
    { code: 'qualidade',         name: 'Qualidade',             description: 'Qualidade e inspeção' },
    { code: 'financeiro',        name: 'Financeiro',            description: 'Contas, tesouraria e fiscal' },
    { code: 'rh',                name: 'RH',                    description: 'Recursos humanos' },
    { code: 'user',              name: 'Usuário',               description: 'Usuário operacional (genérico)' },
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

  // === COMPANY DEFAULT ===
  let defaultCompany = await prisma.company.findFirst();
  if (!defaultCompany) {
    defaultCompany = await prisma.company.create({
      data: {
        cnpj: '12.345.678/0001-90',
        razaoSocial: 'Cozinca Inox Equipamentos LTDA',
        fantasia: 'Cozinca Inox',
        ativo: true,
      },
    });
  }

  // === PERMISSIONS (legado do frontend) ===
  const perms = [
    // Core engine / no-code
    { code: 'entity.manage', name: 'Gerenciar Entidades', category: 'core' },
    { code: 'record.manage', name: 'Gerenciar Registros (CRUD)', category: 'core' },
    { code: 'relatorios:view', name: 'Ver Relatórios', category: 'relatorios' },
    { code: 'ver_crm', name: 'Ver CRM', category: 'crm' },
    { code: 'crm.view', name: 'CRM — API visualização', category: 'crm' },
    { code: 'crm.pipeline', name: 'CRM — pipeline', category: 'crm' },
    { code: 'crm.dashboard', name: 'CRM — dashboard', category: 'crm' },
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
    // Catálogo Prisma / estoque (módulo 1)
    { code: 'produto.view', name: 'Catálogo — visualizar produtos', category: 'estoque' },
    { code: 'produto.create', name: 'Catálogo — criar produto', category: 'estoque' },
    { code: 'produto.update', name: 'Catálogo — editar produto', category: 'estoque' },
    { code: 'produto.delete', name: 'Catálogo — inativar produto', category: 'estoque' },
    { code: 'movimentacao.view', name: 'Movimentações — visualizar', category: 'estoque' },
    { code: 'movimentacao.create', name: 'Movimentações — lançar', category: 'estoque' },
    { code: 'inventario.view', name: 'Inventário — visualizar', category: 'estoque' },
    { code: 'inventario.create', name: 'Inventário — criar contagem', category: 'estoque' },
    { code: 'inventario.approve', name: 'Inventário — aprovar ajustes', category: 'estoque' },
    { code: 'enderecamento.view', name: 'Endereços — visualizar', category: 'estoque' },
    { code: 'enderecamento.manage', name: 'Endereços — gerenciar', category: 'estoque' },
    // CRM Processos
    { code: 'ver_crm_processos', name: 'Ver Processos CRM', category: 'crm' },
    { code: 'editar_crm_processos', name: 'Criar/Editar Processos CRM', category: 'crm' },
    // Projetos
    { code: 'ver_projetos', name: 'Ver Projetos', category: 'projetos' },
    { code: 'editar_projetos', name: 'Criar/Editar Projetos', category: 'projetos' },
    // Qualidade
    { code: 'ver_qualidade', name: 'Ver Qualidade', category: 'qualidade' },
    { code: 'editar_qualidade', name: 'Criar/Editar Inspeções e NCs', category: 'qualidade' },
    { code: 'aprovar_qualidade', name: 'Aprovar Documentos de Qualidade', category: 'qualidade' },
    // Expedição
    { code: 'ver_expedicao', name: 'Ver Expedição', category: 'expedicao' },
    { code: 'editar_expedicao', name: 'Criar/Editar Ordens de Expedição', category: 'expedicao' },
    // Base de Conhecimento
    { code: 'ver_conhecimento', name: 'Ver Base de Conhecimento', category: 'conhecimento' },
    { code: 'editar_conhecimento', name: 'Criar/Editar Artigos', category: 'conhecimento' },
    // Contabilidade
    { code: 'ver_contabilidade', name: 'Ver Contabilidade', category: 'contabilidade' },
    { code: 'editar_contabilidade', name: 'Criar/Editar Lançamentos Contábeis', category: 'contabilidade' },
    // Serviços
    { code: 'ver_servicos', name: 'Ver Serviços', category: 'servicos' },
    { code: 'editar_servicos', name: 'Criar/Editar Serviços', category: 'servicos' },
    // Importação
    { code: 'ver_importacao', name: 'Ver Importação', category: 'importacao' },
    { code: 'editar_importacao', name: 'Criar/Editar Processos de Importação', category: 'importacao' },
  ];

  for (const p of perms) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { name: p.name, category: p.category, active: true },
      create: { code: p.code, name: p.name, category: p.category, active: true, type: 'action' },
    });
  }

  for (const ent of GRANULAR_ENTITY_CODES) {
    const labels = {
      view: `Ver registros (${ent})`,
      create: `Incluir registro (${ent})`,
      edit: `Editar registro (${ent})`,
      delete: `Excluir registro (${ent})`,
    } as const;
    for (const suf of ['view', 'create', 'edit', 'delete'] as const) {
      const code = `${ent}.${suf}`;
      await prisma.permission.upsert({
        where: { code },
        update: { name: labels[suf], category: `entity.${ent}`, active: true },
        create: { code, name: labels[suf], category: `entity.${ent}`, active: true, type: 'action' },
      });
    }
  }

  const allGranularCodes = [...GRANULAR_ENTITY_CODES].flatMap((e) => [
    `${e}.view`,
    `${e}.create`,
    `${e}.edit`,
    `${e}.delete`,
  ]);

  const vendasGranularCodes = [
    'cliente',
    'pedido_venda',
    'orcamento',
    'tabela_preco',
    'crm_lead',
    'crm_oportunidade',
    'crm_atividade',
  ].flatMap((e) => [`${e}.view`, `${e}.create`, `${e}.edit`, `${e}.delete`]);

  /** Granular comercial sem CRM (perfil vendedor não gerencia pipeline/leads no seed). */
  const vendasGranularCodesComercial = ['cliente', 'pedido_venda', 'orcamento', 'tabela_preco'].flatMap((e) =>
    [`${e}.view`, `${e}.create`, `${e}.edit`, `${e}.delete`],
  );

  const producaoGranularCodes = ['ordem_producao', 'apontamento_producao', 'historico_op', 'produto', 'movimentacao_estoque'].flatMap((e) =>
    [`${e}.view`, `${e}.create`, `${e}.edit`, `${e}.delete`],
  );

  // master recebe todas permissões
  const allPerms = await prisma.permission.findMany({ where: { active: true } });
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: masterRole.id, permissionId: perm.id } },
      update: { granted: true },
      create: { roleId: masterRole.id, permissionId: perm.id, granted: true },
    });
  }

  // === Permissões padrão por role (Fluxo: Orçamento → Pedido → Engenharia → Compras → Produção → Qualidade → Expedição → Fiscal → Financeiro) ===
  const permsByRoleCode: Record<string, string[]> = {

    // ── Gerente: visão completa operacional + aprovações ─────────────────────
    gerente: [
      'record.manage','entity.manage',
      'ver_pedidos','criar_pedidos','editar_pedidos','aprovar_pedidos',
      'ver_clientes','editar_clientes','ver_orcamentos','criar_orcamentos',
      'ver_estoque','movimentar_estoque','editar_produtos',
      'produto.view','produto.create','produto.update','produto.delete',
      'movimentacao.view','movimentacao.create',
      'inventario.view','inventario.create','inventario.approve',
      'enderecamento.view','enderecamento.manage',
      'ver_compras','criar_oc','editar_fornecedores',
      'ver_op','criar_op','editar_op','apontar',
      'ver_kanban','ver_pcp','ver_roteiros','ver_maquinas','ver_chao_fabrica',
      'ver_financeiro','editar_financeiro','aprovar_financeiro','ver_relatorio_financeiro',
      'ver_rh','editar_funcionarios','ver_folha',
      'ver_relatorios','relatorios:view','editar_config',
      'ver_crm','crm.view','crm.pipeline','crm.dashboard',
      'ver_crm_processos','editar_crm_processos',
      'ver_projetos','editar_projetos',
      'ver_qualidade','editar_qualidade','aprovar_qualidade',
      'ver_expedicao','editar_expedicao',
      'ver_conhecimento','editar_conhecimento',
      'ver_contabilidade','editar_contabilidade',
      'ver_servicos','editar_servicos',
      'ver_importacao','editar_importacao',
      'ver_fiscal','impersonate',
      ...allGranularCodes,
    ],

    // ── Gerente de Produção: PCP + chão de fábrica + estoque + compras de material ──
    gerente_producao: [
      'record.manage','entity.manage',
      'ver_op','criar_op','editar_op','apontar',
      'ver_kanban','ver_pcp','ver_roteiros','ver_maquinas','ver_chao_fabrica',
      'ver_estoque','movimentar_estoque','editar_produtos',
      'produto.view','produto.create','produto.update',
      'movimentacao.view','movimentacao.create',
      'inventario.view','inventario.create','inventario.approve',
      'enderecamento.view','enderecamento.manage',
      'ver_compras','criar_oc',
      'ver_pedidos',
      'ver_qualidade',
      'ver_projetos',
      'ver_conhecimento',
      'ver_relatorios','relatorios:view',
      ...producaoGranularCodes,
    ],

    // ── Vendas / Orçamentista: CRM + pedidos, clientes, orçamentos, catálogo + cadastro de produto para pronta entrega ──
    orcamentista_vendas: [
      'ver_pedidos',
      'criar_pedidos',
      'editar_pedidos',
      'ver_clientes',
      'editar_clientes',
      'ver_orcamentos',
      'criar_orcamentos',
      'ver_crm',
      'produto.view',
      'produto.create',
      'produto.update',
      'ver_relatorios',
      'relatorios:view',
      ...vendasGranularCodesComercial,
    ],

    // ── Projetista / Engenharia: BOM, roteiros, produtos ─────────────────────
    projetista: [
      'record.manage','entity.manage',
      'ver_op','criar_op','editar_op',      // Criar OPs de engenharia / protótipo
      'ver_pcp','ver_roteiros','ver_kanban','ver_chao_fabrica',
      'ver_estoque','editar_produtos',
      'produto.view','produto.create','produto.update',
      'movimentacao.view',
      'inventario.view','enderecamento.view',
      'ver_compras',                         // Ver o que foi pedido para o projeto
      'ver_pedidos',                         // Contexto do pedido
      'ver_relatorios','relatorios:view',
      ...producaoGranularCodes.filter((c) => c.startsWith('produto.') || c.startsWith('ordem_producao.')),
    ],

    // ── Compras / Suprimentos: OCs, fornecedores, recebimento ────────────────
    compras: [
      'record.manage','entity.manage',
      'ver_compras','criar_oc','editar_fornecedores',
      'ver_estoque','produto.view',
      'movimentacao.view','movimentacao.create', // Recebimento de materiais
      'inventario.view','enderecamento.view',
      'ver_pedidos',                             // Para saber o que comprar
      'ver_op',                                  // Contexto das OPs (necessidade de material)
      'ver_relatorios','relatorios:view',
    ],

    // ── Operadores de chão de fábrica ─────────────────────────────────────────
    corte_laser: [
      'ver_op','apontar','ver_chao_fabrica','ver_roteiros','ver_kanban',
      'ver_estoque','produto.view',              // Ver disponibilidade de matéria-prima
    ],
    dobra_montagem: [
      'ver_op','apontar','ver_chao_fabrica','ver_roteiros','ver_kanban',
      'ver_estoque','produto.view',
    ],
    solda: [
      'ver_op','apontar','ver_chao_fabrica','ver_roteiros','ver_kanban',
      'ver_estoque','produto.view',
    ],

    // ── Qualidade: inspeção + apontamento + relatórios ───────────────────────
    qualidade: [
      'ver_op','apontar','ver_chao_fabrica','ver_kanban',
      'ver_estoque','produto.view',
      'ver_pedidos',
      'ver_qualidade','editar_qualidade','aprovar_qualidade',
      'ver_conhecimento','editar_conhecimento',
      'ver_relatorios','relatorios:view',
    ],

    // ── Expedição: envio + baixa de estoque + pedido ─────────────────────────
    expedicao: [
      'ver_op','apontar','ver_chao_fabrica',
      'ver_pedidos',
      'ver_estoque','movimentar_estoque',
      'movimentacao.view','movimentacao.create',
      'produto.view',
      'ver_expedicao','editar_expedicao',
      'ver_relatorios','relatorios:view',
    ],

    // ── Financeiro: contas + fiscal + faturamento ────────────────────────────
    financeiro: [
      'ver_financeiro','editar_financeiro',
      'aprovar_financeiro','ver_relatorio_financeiro',
      'ver_fiscal',
      'ver_pedidos',
      'ver_contabilidade','editar_contabilidade',
      'ver_importacao','editar_importacao',
      'ver_relatorios','relatorios:view',
    ],

    // ── RH: gestão de pessoas ────────────────────────────────────────────────
    rh: [
      'ver_rh','editar_funcionarios','ver_folha',
      'ver_projetos',
      'ver_conhecimento',
      'ver_relatorios','relatorios:view',
    ],

    // ── Usuário básico ────────────────────────────────────────────────────────
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
    update: { passwordHash: hash, fullName: 'Master / Owner', active: true, emailVerified: true, companyId: defaultCompany.id },
    create: { email: masterEmail, passwordHash: hash, fullName: 'Master / Owner', active: true, emailVerified: true, companyId: defaultCompany.id },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: master.id, roleId: masterRole.id } },
    update: {},
    create: { userId: master.id, roleId: masterRole.id, assignedBy: master.id },
  });

  // === Usuários demo por setor/role (para validação de RBAC e "Ver como") ===
  const demoPassword = process.env.DEFAULT_DEMO_PASSWORD || 'demo123_dev';
  const demoHash = await bcrypt.hash(demoPassword, 12);
  async function ensureDemoUser(email: string, fullName: string, roleCode: string, sector?: string) {
    const role = rolesByCode.get(roleCode);
    if (!role) return null;

    const created = await prisma.user.upsert({
      where: { email },
        update: { passwordHash: demoHash, fullName, active: true, emailVerified: true, sector: sector ?? null, companyId: defaultCompany.id },
        create: { email, passwordHash: demoHash, fullName, active: true, emailVerified: true, sector: sector ?? null, companyId: defaultCompany.id },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: created.id, roleId: role.id } },
      update: {},
      create: { userId: created.id, roleId: role.id, assignedBy: master.id },
    });

    return created;
  }

  await ensureDemoUser('gerente@cozinha.com',          'Gerente Geral',          'gerente',            'Ger\u00eancia');
  await ensureDemoUser('gerente.producao@cozinha.com', 'Gerente Produ\u00e7\u00e3o', 'gerente_producao', 'Produ\u00e7\u00e3o');
  await ensureDemoUser('vendas@cozinha.com',           'Vendas / Or\u00e7amento', 'orcamentista_vendas', 'Vendas');
  await ensureDemoUser('engenharia@cozinha.com',       'Engenharia / Projetos',   'projetista',         'Engenharia');
  await ensureDemoUser('compras@cozinha.com',          'Compras / Suprimentos',   'compras',            'Compras');
  await ensureDemoUser('laser@cozinha.com',            'Operador Laser',          'corte_laser',        'Corte Laser');
  await ensureDemoUser('dobra@cozinha.com',            'Operador Dobra/Montagem', 'dobra_montagem',     'Dobra e Montagem');
  await ensureDemoUser('solda@cozinha.com',            'Operador Solda',          'solda',              'Solda');
  await ensureDemoUser('qualidade@cozinha.com',        'Qualidade',               'qualidade',          'Qualidade');
  await ensureDemoUser('expedicao@cozinha.com',        'Expedi\u00e7\u00e3o',     'expedicao',          'Expedi\u00e7\u00e3o');
  await ensureDemoUser('financeiro@cozinha.com',       'Financeiro',              'financeiro',         'Financeiro');
  await ensureDemoUser('rh@cozinha.com',               'RH Departamento',         'rh',                 'RH');

  // ═══════════════════════════════════════════
  // EQUIPE COZINCA INOX — Usuários do sistema
  // Senha inicial: Cozinca@2026
  // ═══════════════════════════════════════════

  const equipePassword = process.env.DEFAULT_EQUIPE_PASSWORD || 'Cozinca@2026'
  const equipeHash = await bcrypt.hash(equipePassword, 12)

  async function ensureEquipeUser(
    email: string,
    fullName: string,
    roleCode: string,
    sector?: string
  ) {
    const role = rolesByCode.get(roleCode)
    if (!role) {
      console.warn(`⚠️  Role não encontrada: ${roleCode}`)
      return null
    }
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash: equipeHash,
        fullName,
        active: true,
        emailVerified: true,
        sector: sector ?? null,
        companyId: defaultCompany.id,
      },
      create: {
        email,
        passwordHash: equipeHash,
        fullName,
        active: true,
        emailVerified: true,
        sector: sector ?? null,
        companyId: defaultCompany.id,
      },
    })
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
        assignedBy: master.id,
      },
    })
    console.log(`✅ Usuário: ${fullName} (${roleCode}) — ${email}`)
    return user
  }

  // ─── ADMINISTRAÇÃO ─────────────────────────
  await ensureEquipeUser(
    'gabriel.costa@cozinca.com.br',
    'Gabriel Costa',
    'master',
    'Administração'
  )

  // ─── GERÊNCIA DE PRODUÇÃO ──────────────────
  await ensureEquipeUser(
    'roberto.mendes@cozinca.com.br',
    'Roberto Mendes',
    'gerente_producao',
    'Produção'
  )

  // ─── ENGENHARIA / PROJETOS ─────────────────
  await ensureEquipeUser(
    'lucas.ferreira@cozinca.com.br',
    'Lucas Ferreira',
    'projetista',
    'Engenharia'
  )

  await ensureEquipeUser(
    'ana.rodrigues@cozinca.com.br',
    'Ana Rodrigues',
    'projetista',
    'Engenharia'
  )

  // ─── OPERADORES DE PRODUÇÃO ────────────────
  await ensureEquipeUser(
    'marcos.oliveira@cozinca.com.br',
    'Marcos Oliveira',
    'corte_laser',
    'Produção - Corte Laser'
  )

  await ensureEquipeUser(
    'diego.santos@cozinca.com.br',
    'Diego Santos',
    'dobra_montagem',
    'Produção - Dobra e Montagem'
  )

  await ensureEquipeUser(
    'felipe.lima@cozinca.com.br',
    'Felipe Lima',
    'solda',
    'Produção - Solda e Acabamento'
  )

  // ─── QUALIDADE ─────────────────────────────
  await ensureEquipeUser(
    'patricia.souza@cozinca.com.br',
    'Patrícia Souza',
    'qualidade',
    'Qualidade'
  )

  // ─── EXPEDIÇÃO ─────────────────────────────
  await ensureEquipeUser(
    'carlos.alves@cozinca.com.br',
    'Carlos Alves',
    'expedicao',
    'Expedição'
  )

  // ─── VENDAS / COMERCIAL ────────────────────
  await ensureEquipeUser(
    'juliana.martins@cozinca.com.br',
    'Juliana Martins',
    'orcamentista_vendas',
    'Comercial'
  )

  await ensureEquipeUser(
    'thiago.pereira@cozinca.com.br',
    'Thiago Pereira',
    'orcamentista_vendas',
    'Comercial'
  )

  // ─── COMPRAS ───────────────────────────────
  await ensureEquipeUser(
    'fernanda.nascimento@cozinca.com.br',
    'Fernanda Nascimento',
    'compras',
    'Compras'
  )

  // ─── FINANCEIRO ────────────────────────────
  await ensureEquipeUser(
    'marcelo.ribeiro@cozinca.com.br',
    'Marcelo Ribeiro',
    'financeiro',
    'Financeiro'
  )

  // ─── RH ────────────────────────────────────
  await ensureEquipeUser(
    'camila.barbosa@cozinca.com.br',
    'Camila Barbosa',
    'rh',
    'Recursos Humanos'
  )

  console.log(`
╔══════════════════════════════════════════════╗
║   EQUIPE COZINCA INOX — 14 usuários criados  ║
╠══════════════════════════════════════════════╣
║  Senha inicial: Cozinca@2026                 ║
║  ⚠️  Oriente cada usuário a trocar a senha   ║
║     no primeiro acesso em /perfil            ║
╠══════════════════════════════════════════════╣
║  USUÁRIOS CRIADOS:                           ║
║  gabriel.costa        → Master/Admin         ║
║  roberto.mendes       → Gerente Produção     ║
║  lucas.ferreira       → Projetista           ║
║  ana.rodrigues        → Projetista           ║
║  marcos.oliveira      → Operador Laser       ║
║  diego.santos         → Operador Dobra       ║
║  felipe.lima          → Operador Solda       ║
║  patricia.souza       → Qualidade            ║
║  carlos.alves         → Expedição            ║
║  juliana.martins      → Vendas               ║
║  thiago.pereira       → Vendas               ║
║  fernanda.nascimento  → Compras              ║
║  marcelo.ribeiro      → Financeiro           ║
║  camila.barbosa       → RH                   ║
╚══════════════════════════════════════════════╝
`)

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
    data_type:
      | 'text'
      | 'number'
      | 'boolean'
      | 'date'
      | 'select'
      | 'multiselect'
      | 'reference'
      | 'textarea'
      | 'currency'
      | 'json';
    required?: boolean;
    unique?: boolean;
    hidden?: boolean;
    readOnly?: boolean;
    width?: string;
    data_type_params?: Record<string, any>;
  };

  async function ensureEntity(code: string, name: string, config?: { fields?: SeedField[]; [k: string]: any }) {
    if (config) {
      return prisma.entity.upsert({
        where: { code },
        update: { name, config },
        create: { code, name, config },
      });
    }
    return prisma.entity.upsert({
      where: { code },
      update: { name },
      create: { code, name },
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
        { id: 'produto.bom_json', code: 'bom_json', label: 'BOM (JSON)', data_type: 'json' },
        { id: 'produto.roteiro_json', code: 'roteiro_json', label: 'Roteiro (JSON)', data_type: 'json' },
        { id: 'produto.ficha_tecnica_json', code: 'ficha_tecnica_json', label: 'Ficha técnica (JSON)', data_type: 'json' },
        { id: 'produto.custo_mao_obra', code: 'custo_mao_obra', label: 'Custo mão de obra (R$)', data_type: 'currency' },
        { id: 'produto.bom_status', code: 'bom_status', label: 'Status BOM (engenharia)', data_type: 'text', readonly: true },
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
        { id: 'pv.status', code: 'status', label: 'Status', data_type: 'select', data_type_params: { options: ['Orçamento', 'Aguardando Aprovação', 'Em aprovação', 'Aprovado', 'Produção', 'Expedição', 'Entregue', 'Faturado', 'Cancelado'] } },
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
    tabela_preco: {
      fields: [
        { id: 'tp.codigo', code: 'codigo', label: 'Código', data_type: 'text', required: true, unique: true },
        { id: 'tp.descricao', code: 'descricao', label: 'Descrição', data_type: 'text', required: true },
        { id: 'tp.grupo', code: 'grupo', label: 'Grupo', data_type: 'text' },
        { id: 'tp.unidade', code: 'unidade', label: 'Unidade', data_type: 'select', data_type_params: { options: ['UN', 'PC', 'CX', 'KG', 'M', 'H'] } },
        { id: 'tp.preco_custo', code: 'preco_custo', label: 'Preço de Custo', data_type: 'currency' },
        { id: 'tp.preco_venda', code: 'preco_venda', label: 'Preço de Venda', data_type: 'currency' },
      ],
    },
    ordem_producao: {
      fields: [
        { id: 'op.numero', code: 'numero', label: 'Número', data_type: 'text', required: true, unique: true },
        { id: 'op.pedidoId', code: 'pedidoId', label: 'Pedido (ID)', data_type: 'number' },
        { id: 'op.clienteId', code: 'clienteId', label: 'Cliente (ID)', data_type: 'number' },
        { id: 'op.clienteNome', code: 'clienteNome', label: 'Cliente', data_type: 'text', required: true },
        { id: 'op.codigoProduto', code: 'codigoProduto', label: 'Código produto', data_type: 'text' },
        { id: 'op.produtoDescricao', code: 'produtoDescricao', label: 'Produto', data_type: 'text', required: true },
        { id: 'op.quantidade', code: 'quantidade', label: 'Quantidade', data_type: 'number', required: true },
        { id: 'op.unidade', code: 'unidade', label: 'Unidade', data_type: 'select', required: true, data_type_params: { options: ['UN', 'PC', 'CX', 'KG', 'M', 'H'] } },
        { id: 'op.dataEmissao', code: 'dataEmissao', label: 'Data emissão', data_type: 'date' },
        { id: 'op.prazo', code: 'prazo', label: 'Prazo', data_type: 'date' },
        {
          id: 'op.status',
          code: 'status',
          label: 'Status',
          data_type: 'select',
          required: true,
          data_type_params: { options: ['aberta', 'em_andamento', 'pausada', 'concluida', 'cancelada'] },
        },
        {
          id: 'op.prioridade',
          code: 'prioridade',
          label: 'Prioridade',
          data_type: 'select',
          data_type_params: { options: ['Baixa', 'Normal', 'Alta', 'Urgente'] },
        },
        { id: 'op.responsavel', code: 'responsavel', label: 'Responsável', data_type: 'text' },
        { id: 'op.observacao', code: 'observacao', label: 'Observação', data_type: 'textarea' },
        { id: 'op.informacaoComplementar', code: 'informacaoComplementar', label: 'Informação complementar', data_type: 'textarea' },
        {
          id: 'op.etapaKanban',
          code: 'etapaKanban',
          label: 'Etapa Kanban',
          data_type: 'select',
          data_type_params: {
            options: ['a_fazer', 'corte', 'dobra', 'solda', 'acabamento', 'qc', 'concluido'],
          },
        },
      ],
    },
    conta_receber: {
      fields: [
        { id: 'cr.descricao', code: 'descricao', label: 'Descrição', data_type: 'text', required: true },
        { id: 'cr.cliente_fornecedor', code: 'cliente_fornecedor', label: 'Cliente', data_type: 'text', required: true },
        { id: 'cr.categoria', code: 'categoria', label: 'Categoria', data_type: 'select', data_type_params: { options: ['Venda', 'Serviço', 'Outros'] } },
        { id: 'cr.valor', code: 'valor', label: 'Valor', data_type: 'currency', required: true },
        { id: 'cr.data_emissao', code: 'data_emissao', label: 'Data emissão', data_type: 'date' },
        { id: 'cr.data_vencimento', code: 'data_vencimento', label: 'Data vencimento', data_type: 'date' },
        {
          id: 'cr.status',
          code: 'status',
          label: 'Status',
          data_type: 'select',
          required: true,
          data_type_params: { options: ['aberto', 'parcial', 'pago', 'vencido', 'cancelado'] },
        },
        { id: 'cr.documento', code: 'documento', label: 'Documento', data_type: 'text' },
        { id: 'cr.observacoes', code: 'observacoes', label: 'Observações', data_type: 'textarea' },
      ],
    },
    conta_pagar: {
      fields: [
        { id: 'cp.descricao', code: 'descricao', label: 'Descrição', data_type: 'text', required: true },
        { id: 'cp.cliente_fornecedor', code: 'cliente_fornecedor', label: 'Fornecedor', data_type: 'text', required: true },
        { id: 'cp.categoria', code: 'categoria', label: 'Categoria', data_type: 'select', data_type_params: { options: ['Compra', 'Serviço', 'Imposto', 'Outros'] } },
        { id: 'cp.valor', code: 'valor', label: 'Valor', data_type: 'currency', required: true },
        { id: 'cp.data_emissao', code: 'data_emissao', label: 'Data emissão', data_type: 'date' },
        { id: 'cp.data_vencimento', code: 'data_vencimento', label: 'Data vencimento', data_type: 'date' },
        {
          id: 'cp.status',
          code: 'status',
          label: 'Status',
          data_type: 'select',
          required: true,
          data_type_params: { options: ['aberto', 'parcial', 'pago', 'vencido', 'cancelado'] },
        },
        { id: 'cp.documento', code: 'documento', label: 'Documento', data_type: 'text' },
        { id: 'cp.observacoes', code: 'observacoes', label: 'Observações', data_type: 'textarea' },
      ],
    },
    workflow: {
      fields: [
        { id: 'wf.entity_id', code: 'entity_id', label: 'Entidade alvo', data_type: 'text' },
        { id: 'wf.code', code: 'code', label: 'Código', data_type: 'text', required: true, unique: true },
        { id: 'wf.name', code: 'name', label: 'Nome', data_type: 'text', required: true },
        { id: 'wf.description', code: 'description', label: 'Descrição', data_type: 'textarea' },
        { id: 'wf.is_active', code: 'is_active', label: 'Ativo', data_type: 'boolean' },
        {
          id: 'wf.trigger_type',
          code: 'trigger_type',
          label: 'Gatilho',
          data_type: 'select',
          required: true,
          data_type_params: { options: ['manual', 'on_create', 'on_update', 'schedule'] },
        },
        { id: 'wf.config', code: 'config', label: 'Config (JSON)', data_type: 'json' },
        { id: 'wf.steps', code: 'steps', label: 'Etapas (JSON array)', data_type: 'json' },
      ],
    },
    crm_lead: {
      fields: [
        { id: 'ld.nome', code: 'nome', label: 'Nome', data_type: 'text', required: true },
        { id: 'ld.empresa', code: 'empresa', label: 'Empresa', data_type: 'text' },
        { id: 'ld.cargo', code: 'cargo', label: 'Cargo', data_type: 'text' },
        { id: 'ld.email', code: 'email', label: 'E-mail', data_type: 'text' },
        { id: 'ld.telefone', code: 'telefone', label: 'Telefone', data_type: 'text' },
        {
          id: 'ld.origem',
          code: 'origem',
          label: 'Origem',
          data_type: 'select',
          data_type_params: {
            options: ['WhatsApp', 'Instagram', 'Site', 'Telefone', 'Indicação', 'Evento', 'Outros'],
          },
        },
        {
          id: 'ld.qualificacao',
          code: 'qualificacao',
          label: 'Qualificação',
          data_type: 'select',
          data_type_params: { options: ['Frio', 'Morno', 'Quente'] },
        },
        { id: 'ld.responsavel', code: 'responsavel', label: 'Responsável', data_type: 'text' },
        { id: 'ld.responsavelId', code: 'responsavelId', label: 'Responsável (usuário)', data_type: 'text' },
        {
          id: 'ld.tipo_projeto',
          code: 'tipo_projeto',
          label: 'Tipo de projeto',
          data_type: 'select',
          data_type_params: { options: ['padrão', 'sob medida'] },
        },
      ],
    },
    crm_rules: {
      fields: [
        { id: 'cr.code', code: 'code', label: 'Código', data_type: 'text', required: true },
        { id: 'cr.name', code: 'name', label: 'Nome', data_type: 'text', required: true },
        {
          id: 'cr.tipo',
          code: 'tipo',
          label: 'Tipo de regra',
          data_type: 'select',
          required: true,
          data_type_params: { options: ['assignment', 'alert', 'validation'] },
        },
        { id: 'cr.config', code: 'config', label: 'Config (JSON)', data_type: 'json', required: true },
        { id: 'cr.ativo', code: 'ativo', label: 'Ativo', data_type: 'boolean' },
      ],
    },
    crm_oportunidade: {
      fields: [
        { id: 'op2.titulo', code: 'titulo', label: 'Título', data_type: 'text', required: true },
        { id: 'op2.empresa', code: 'empresa', label: 'Empresa', data_type: 'text', required: true },
        { id: 'op2.contato', code: 'contato', label: 'Contato', data_type: 'text' },
        { id: 'op2.valor', code: 'valor', label: 'Valor', data_type: 'currency' },
        {
          id: 'op2.estagio',
          code: 'estagio',
          label: 'Estágio',
          data_type: 'select',
          data_type_params: {
            options: [
              'Novo',
              'Qualificado',
              'Em orçamento',
              'Proposta enviada',
              'Negociação',
              'Aguardando cliente',
              'Fechado ganho',
              'Fechado perdido',
            ],
          },
        },
        { id: 'op2.responsavelId', code: 'responsavelId', label: 'Responsável (usuário)', data_type: 'text' },
        { id: 'op2.probabilidade', code: 'probabilidade', label: 'Probabilidade (%)', data_type: 'number' },
        { id: 'op2.fechamento', code: 'fechamento', label: 'Data prev. fechamento', data_type: 'date' },
        { id: 'op2.responsavel', code: 'responsavel', label: 'Responsável', data_type: 'text' },
        { id: 'op2.lead_id', code: 'lead_id', label: 'Lead (ID)', data_type: 'text' },
        {
          id: 'op2.origem',
          code: 'origem',
          label: 'Origem',
          data_type: 'select',
          data_type_params: {
            options: ['WhatsApp', 'Instagram', 'Site', 'Telefone', 'Indicação', 'Evento', 'Outros'],
          },
        },
        { id: 'op2.motivo_perda', code: 'motivo_perda', label: 'Motivo da perda', data_type: 'textarea' },
        { id: 'op2.orcamento_id', code: 'orcamento_id', label: 'Orçamento (ID)', data_type: 'text' },
        { id: 'op2.pedido_id', code: 'pedido_id', label: 'Pedido (ID)', data_type: 'text' },
      ],
    },
    crm_atividade: {
      fields: [
        { id: 'ca.titulo', code: 'titulo', label: 'Título', data_type: 'text', required: true },
        {
          id: 'ca.tipo',
          code: 'tipo',
          label: 'Tipo',
          data_type: 'select',
          required: true,
          data_type_params: {
            options: [
              'Ligação',
              'WhatsApp',
              'Reunião',
              'Follow-up',
              'E-mail',
              'Visita',
              'Tarefa',
              'Acompanhamento pós-venda',
              'Outro',
            ],
          },
        },
        { id: 'ca.data_atividade', code: 'data_atividade', label: 'Data/Hora', data_type: 'text' },
        { id: 'ca.data', code: 'data', label: 'Data/Hora (legado)', data_type: 'text' },
        { id: 'ca.responsavel', code: 'responsavel', label: 'Responsável', data_type: 'text' },
        { id: 'ca.relacionamento', code: 'relacionamento', label: 'Lead/Oportunidade', data_type: 'text' },
        { id: 'ca.oportunidade_id', code: 'oportunidade_id', label: 'Oportunidade (ID)', data_type: 'text' },
        { id: 'ca.observacao', code: 'observacao', label: 'Observação', data_type: 'textarea' },
        {
          id: 'ca.status',
          code: 'status',
          label: 'Status',
          data_type: 'select',
          data_type_params: { options: ['Pendente', 'Concluída', 'Cancelada'] },
        },
      ],
    },
    cotacao_compra: {
      fields: [
        { id: 'cc.numero', code: 'numero', label: 'Número', data_type: 'text', required: true, unique: true },
        { id: 'cc.descricao', code: 'descricao', label: 'Descrição', data_type: 'text', required: true },
        { id: 'cc.fornecedor', code: 'fornecedor', label: 'Fornecedor', data_type: 'text', required: true },
        { id: 'cc.data_envio', code: 'data_envio', label: 'Data envio', data_type: 'date' },
        { id: 'cc.validade', code: 'validade', label: 'Validade', data_type: 'date' },
        { id: 'cc.valor', code: 'valor', label: 'Valor', data_type: 'currency' },
        {
          id: 'cc.status',
          code: 'status',
          label: 'Status',
          data_type: 'select',
          data_type_params: { options: ['Enviada', 'Recebida', 'Aceita', 'Recusada', 'Cancelada'] },
        },
      ],
    },
    rh_funcionario: {
      fields: [
        { id: 'rh.matricula', code: 'matricula', label: 'Matrícula', data_type: 'text', required: true, unique: true },
        { id: 'rh.nome', code: 'nome', label: 'Nome', data_type: 'text', required: true },
        { id: 'rh.cargo', code: 'cargo', label: 'Cargo', data_type: 'text' },
        { id: 'rh.departamento', code: 'departamento', label: 'Departamento', data_type: 'text' },
        {
          id: 'rh.tipo_contrato',
          code: 'tipo_contrato',
          label: 'Contrato',
          data_type: 'select',
          data_type_params: { options: ['CLT', 'PJ', 'Estágio', 'Temporário'] },
        },
        { id: 'rh.salario', code: 'salario', label: 'Salário', data_type: 'currency' },
        { id: 'rh.data_admissao', code: 'data_admissao', label: 'Data admissão', data_type: 'date' },
        {
          id: 'rh.status',
          code: 'status',
          label: 'Status',
          data_type: 'select',
          data_type_params: { options: ['Ativo', 'Afastado', 'Férias', 'Desligado'] },
        },
        { id: 'rh.email', code: 'email', label: 'E-mail', data_type: 'text' },
        { id: 'rh.telefone', code: 'telefone', label: 'Telefone', data_type: 'text' },
      ],
    },
    rh_ferias: {
      fields: [
        { id: 'rf.nome', code: 'nome', label: 'Colaborador', data_type: 'text', required: true },
        { id: 'rf.matricula', code: 'matricula', label: 'Matrícula', data_type: 'text', required: true },
        { id: 'rf.cargo', code: 'cargo', label: 'Cargo', data_type: 'text' },
        { id: 'rf.data_inicio', code: 'data_inicio', label: 'Início', data_type: 'date', required: true },
        { id: 'rf.data_fim', code: 'data_fim', label: 'Fim', data_type: 'date', required: true },
        { id: 'rf.dias', code: 'dias', label: 'Dias', data_type: 'number', required: true },
        {
          id: 'rf.status',
          code: 'status',
          label: 'Status',
          data_type: 'select',
          data_type_params: { options: ['Solicitada', 'Pendente', 'Aprovadas', 'Em Gozo', 'Concluídas', 'Canceladas'] },
        },
        { id: 'rf.observacoes', code: 'observacoes', label: 'Observações', data_type: 'textarea' },
      ],
    },
    rh_ponto: {
      fields: [
        { id: 'rp.nome', code: 'nome', label: 'Colaborador', data_type: 'text', required: true },
        { id: 'rp.matricula', code: 'matricula', label: 'Matrícula', data_type: 'text', required: true },
        { id: 'rp.data', code: 'data', label: 'Data', data_type: 'date', required: true },
        { id: 'rp.entrada', code: 'entrada', label: 'Entrada', data_type: 'text' },
        { id: 'rp.saida_almoco', code: 'saida_almoco', label: 'Saída almoço', data_type: 'text' },
        { id: 'rp.retorno', code: 'retorno', label: 'Retorno', data_type: 'text' },
        { id: 'rp.saida', code: 'saida', label: 'Saída', data_type: 'text' },
        { id: 'rp.horas', code: 'horas', label: 'Horas', data_type: 'text' },
        {
          id: 'rp.status',
          code: 'status',
          label: 'Status',
          data_type: 'select',
          data_type_params: { options: ['Normal', 'Falta', 'Atraso', 'Hora Extra', 'Férias', 'Licença'] },
        },
      ],
    },
    rh_folha_pagamento: {
      fields: [
        { id: 'fl.nome', code: 'nome', label: 'Colaborador', data_type: 'text', required: true },
        { id: 'fl.matricula', code: 'matricula', label: 'Matrícula', data_type: 'text', required: true },
        { id: 'fl.cargo', code: 'cargo', label: 'Cargo', data_type: 'text' },
        { id: 'fl.salario_base', code: 'salario_base', label: 'Salário base', data_type: 'currency' },
        { id: 'fl.horas_extras', code: 'horas_extras', label: 'Horas extras (R$)', data_type: 'currency' },
        { id: 'fl.descontos', code: 'descontos', label: 'Descontos', data_type: 'currency' },
        { id: 'fl.liquido', code: 'liquido', label: 'Líquido', data_type: 'currency' },
        { id: 'fl.competencia', code: 'competencia', label: 'Competência (AAAA-MM)', data_type: 'text', required: true },
      ],
    },
    fiscal_nfe: {
      fields: [
        { id: 'fn.numero', code: 'numero', label: 'Número', data_type: 'text', required: true },
        { id: 'fn.serie', code: 'serie', label: 'Série', data_type: 'text' },
        { id: 'fn.destinatario', code: 'destinatario', label: 'Destinatário', data_type: 'text', required: true },
        { id: 'fn.cnpj', code: 'cnpj', label: 'CNPJ', data_type: 'text' },
        { id: 'fn.data_emissao', code: 'data_emissao', label: 'Data emissão', data_type: 'date' },
        { id: 'fn.valor', code: 'valor', label: 'Valor', data_type: 'currency' },
        { id: 'fn.chave', code: 'chave', label: 'Chave NF-e', data_type: 'textarea' },
        {
          id: 'fn.status',
          code: 'status',
          label: 'Status',
          data_type: 'select',
          data_type_params: { options: ['Em Digitação', 'Autorizada', 'Denegada', 'Cancelada', 'Contingência'] },
        },
      ],
    },
    producao_maquina: {
      fields: [
        { id: 'pm.codigo', code: 'codigo', label: 'Código', data_type: 'text', required: true, unique: true },
        { id: 'pm.descricao', code: 'descricao', label: 'Descrição', data_type: 'text', required: true },
        { id: 'pm.tipo', code: 'tipo', label: 'Tipo', data_type: 'text' },
        { id: 'pm.fabricante', code: 'fabricante', label: 'Fabricante', data_type: 'text' },
        { id: 'pm.modelo', code: 'modelo', label: 'Modelo', data_type: 'text' },
        { id: 'pm.ano', code: 'ano', label: 'Ano', data_type: 'number' },
        { id: 'pm.setor', code: 'setor', label: 'Setor', data_type: 'text' },
        {
          id: 'pm.status',
          code: 'status',
          label: 'Status',
          data_type: 'select',
          data_type_params: { options: ['Ativo', 'Inativo', 'Manutenção', 'Desativada'] },
        },
        { id: 'pm.ultima_manutencao', code: 'ultima_manutencao', label: 'Última manutenção', data_type: 'date' },
        { id: 'pm.proxima_manutencao', code: 'proxima_manutencao', label: 'Próxima manutenção', data_type: 'date' },
      ],
    },
    compras_recebimento: {
      fields: [
        { id: 'rc.numero', code: 'numero', label: 'Número', data_type: 'text', required: true, unique: true },
        { id: 'rc.ordem_compra', code: 'ordem_compra', label: 'Ordem de compra', data_type: 'text' },
        { id: 'rc.fornecedor', code: 'fornecedor', label: 'Fornecedor', data_type: 'text', required: true },
        { id: 'rc.data_recebimento', code: 'data_recebimento', label: 'Data recebimento', data_type: 'date' },
        { id: 'rc.nf', code: 'nf', label: 'NF', data_type: 'text' },
        { id: 'rc.valor', code: 'valor', label: 'Valor', data_type: 'currency' },
        { id: 'rc.conferente', code: 'conferente', label: 'Conferente', data_type: 'text' },
        {
          id: 'rc.status',
          code: 'status',
          label: 'Status',
          data_type: 'select',
          data_type_params: { options: ['Aguardando NF', 'Conferido', 'Divergência', 'Cancelado'] },
        },
      ],
    },
    estoque_inventario: {
      fields: [
        { id: 'ei.codigo', code: 'codigo', label: 'Código item', data_type: 'text', required: true },
        { id: 'ei.descricao', code: 'descricao', label: 'Descrição', data_type: 'text', required: true },
        { id: 'ei.localizacao', code: 'localizacao', label: 'Localização', data_type: 'text' },
        { id: 'ei.estoque_sistema', code: 'estoque_sistema', label: 'Qtd sistema', data_type: 'number' },
        { id: 'ei.estoque_contado', code: 'estoque_contado', label: 'Qtd contada', data_type: 'number' },
        { id: 'ei.diferenca', code: 'diferenca', label: 'Diferença', data_type: 'number' },
        {
          id: 'ei.status',
          code: 'status',
          label: 'Status',
          data_type: 'select',
          data_type_params: { options: ['Pendente', 'Conferido', 'Divergente', 'Ajustado'] },
        },
      ],
    },
    apontamento_producao: {
      fields: [
        { id: 'ap.opId', code: 'opId', label: 'OP (ref.)', data_type: 'text', required: true },
        { id: 'ap.etapa', code: 'etapa', label: 'Etapa', data_type: 'text', required: true },
        { id: 'ap.operador', code: 'operador', label: 'Operador', data_type: 'text' },
        { id: 'ap.setor', code: 'setor', label: 'Setor', data_type: 'text' },
        { id: 'ap.horaInicio', code: 'horaInicio', label: 'Início', data_type: 'text' },
        { id: 'ap.horaFim', code: 'horaFim', label: 'Fim', data_type: 'text' },
        { id: 'ap.quantidade', code: 'quantidade', label: 'Quantidade', data_type: 'number' },
        { id: 'ap.refugo', code: 'refugo', label: 'Refugo', data_type: 'number' },
        {
          id: 'ap.status',
          code: 'status',
          label: 'Status',
          data_type: 'select',
          required: true,
          data_type_params: { options: ['Em Andamento', 'Finalizado', 'Cancelado'] },
        },
        { id: 'ap.observacao', code: 'observacao', label: 'Observação', data_type: 'textarea' },
      ],
    },
    historico_op: {
      fields: [
        { id: 'ho.opId', code: 'opId', label: 'OP (id interno)', data_type: 'text', required: true },
        { id: 'ho.opNumero', code: 'opNumero', label: 'Nº OP', data_type: 'text' },
        { id: 'ho.statusAnterior', code: 'statusAnterior', label: 'Status anterior', data_type: 'text' },
        { id: 'ho.statusNovo', code: 'statusNovo', label: 'Status novo', data_type: 'text', required: true },
        { id: 'ho.usuario', code: 'usuario', label: 'Usuário', data_type: 'text' },
        { id: 'ho.obs', code: 'obs', label: 'Observações', data_type: 'textarea' },
        { id: 'ho.data', code: 'data', label: 'Data/hora', data_type: 'text' },
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
    {
      codigo: 'EIX-025',
      descricao: 'Eixo Transmissão 25mm',
      unidade: 'UN',
      tipo: 'Produto',
      preco_custo: 185.0,
      preco_venda: 310.0,
      estoque_atual: 40,
      estoque_minimo: 20,
      custo_mao_obra: 42.0,
      bom_json: [
        { codigo: 'CHA-003', qtd: 0.02, perda_pct: 8 },
        { codigo: 'ROL-6205', qtd: 2, perda_pct: 0 },
      ],
    },
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
    { numero: 'PV-00541', cliente_nome: 'TechParts Ltda', data_emissao: '2026-04-17', data_entrega: '2026-04-28', vendedor: 'Ana Paula', valor_total: 12800, status: 'Aprovado', forma_pagamento: 'À Vista', itens: [{ codigo: 'EIX-025', quantidade: 8 }], observacoes: '' },
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

  await seedEntityRecordsIfEmpty('crm_rules', 'CRM — Regras de automação', [
    {
      code: 'rr_leads_default',
      name: 'Distribuição leads (round-robin exemplo)',
      tipo: 'assignment',
      ativo: true,
      config: { type: 'round_robin', usuarios: [] },
    },
  ]);

  await seedEntityRecordsIfEmpty('crm_lead', 'CRM Leads', [
    { nome:'Fabricio Nunes', empresa:'Mec. Nunes Ltda', cargo:'Diretor', email:'fabricio@nunes.com', telefone:'(11) 9 8765-4321', origem:'Site', qualificacao:'Quente', responsavel:'Carlos Silva' },
    { nome:'Lúcia Barros', empresa:'Ind. Barros', cargo:'Gerente Compras', email:'lucia@barros.com', telefone:'(13) 9 7654-3210', origem:'Indicação', qualificacao:'Morno', responsavel:'Ana Paula' },
  ]);

  await seedEntityRecordsIfEmpty('crm_oportunidade', 'CRM Oportunidades', [
    {
      titulo: 'Fornecimento anual rolamentos',
      empresa: 'Metalúrgica ABC',
      contato: 'Márcio Lima',
      valor: 180000,
      estagio: 'Novo',
      probabilidade: 20,
      fechamento: '2026-05-30',
      responsavel: 'Carlos Silva',
      origem: 'Site',
      lead_id: '',
      motivo_perda: '',
      orcamento_id: '',
    },
    {
      titulo: 'Projeto eixos transmissão lote',
      empresa: 'SiderTech S/A',
      contato: 'Ana Ramos',
      valor: 95000,
      estagio: 'Novo',
      probabilidade: 20,
      fechamento: '2026-04-30',
      responsavel: 'Rafael Costa',
      origem: 'WhatsApp',
      lead_id: '',
      motivo_perda: '',
      orcamento_id: '',
    },
  ]);

  try {
    const leadEnt = await prisma.entity.findUnique({ where: { code: 'crm_lead' } });
    const oppEnt = await prisma.entity.findUnique({ where: { code: 'crm_oportunidade' } });
    if (leadEnt && oppEnt) {
      const lr = await prisma.entityRecord.findFirst({
        where: { entityId: leadEnt.id, deletedAt: null },
        orderBy: { createdAt: 'asc' },
      });
      const or = await prisma.entityRecord.findFirst({
        where: { entityId: oppEnt.id, deletedAt: null },
        orderBy: { createdAt: 'asc' },
      });
      if (lr && or && or.data && typeof or.data === 'object' && !Array.isArray(or.data)) {
        const d = or.data as Record<string, unknown>;
        if (!String(d.lead_id ?? d.leadId ?? '').trim()) {
          await prisma.entityRecord.update({
            where: { id: or.id },
            data: {
              data: {
                ...d,
                lead_id: lr.id,
                origem: String(d.origem || 'Site'),
              } as object,
              updatedBy: master.id,
            },
          });
        }
      }
    }
  } catch {
    /* demo link opcional */
  }

  await seedEntityRecordsIfEmpty('crm_atividade', 'CRM Atividades', [
    {
      titulo: 'Retornar lead Metal ABC',
      tipo: 'Ligação',
      data_atividade: '2026-05-02T10:00:00.000Z',
      data: '2026-05-02T10:00:00.000Z',
      responsavel: 'Carlos Silva',
      relacionamento: 'Lead Fabricio',
      observacao: '',
      status: 'Pendente',
    },
    {
      titulo: 'Enviar proposta revisada',
      tipo: 'E-mail',
      data_atividade: '2026-05-03T14:00:00.000Z',
      data: '2026-05-03T14:00:00.000Z',
      responsavel: 'Ana Paula',
      relacionamento: 'Opp. SiderTech',
      observacao: '',
      status: 'Pendente',
    },
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
    { numero:'OP-00542', pedidoId: 10, clienteId: 5, clienteNome: 'Metalúrgica ABC Ltda', codigoProduto: 'EIX-025', produtoDescricao: 'Eixo Transmissão 25mm', quantidade: 50, unidade: 'UN', dataEmissao: '2026-04-17T00:00:00Z', prazo: '2026-04-25T00:00:00Z', status: 'em_andamento', prioridade: 'Alta', responsavel: 'João M.', observacao: 'Acabamento polido', informacaoComplementar: 'ITEM 01 do PV-00541', etapaKanban: 'dobra' },
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

  const catalogCount = await prisma.product.count();
  if (catalogCount === 0) {
    // Cria ou obtém a Company padrão
    let defaultCompany = await prisma.company.findFirst();
    if (!defaultCompany) {
      defaultCompany = await prisma.company.create({
        data: {
          cnpj: '12.345.678/0001-90',
          razaoSocial: 'Cozinca Inox Equipamentos LTDA',
          fantasia: 'Cozinca Inox',
          ativo: true,
        },
      });
    }
    
    // Cria ou obtém a Location padrão
    let defaultLoc = await prisma.location.findFirst({ where: { code: 'DEFAULT' } });
    if (!defaultLoc) {
      defaultLoc = await prisma.location.create({
        data: {
          code: 'DEFAULT',
          name: 'Depósito principal',
          warehouse: 'Principal',
          active: true,
        },
      });
    }

    const samples: Array<{
      code: string;
      name: string;
      unit: string;
      productType: string;
      group: string;
      cost: number;
      sale: number;
      min: number;
      qty: number;
    }> = [
      { code: 'CAT-EIX-025', name: 'Eixo Transmissão 25mm', unit: 'UN', productType: 'Produto', group: 'Eixos', cost: 185, sale: 310, min: 5, qty: 40 },
      { code: 'CAT-ROL-6205', name: 'Rolamento 6205-ZZ', unit: 'UN', productType: 'Componente', group: 'Rolamentos', cost: 8.2, sale: 18.9, min: 10, qty: 120 },
      { code: 'CAT-CHA-003', name: 'Chapa Aço 3mm', unit: 'PC', productType: 'Insumo', group: 'Chapas', cost: 320, sale: 450, min: 4, qty: 20 },
      { code: 'CAT-PAR-M10', name: 'Parafuso métrico M10', unit: 'UN', productType: 'Consumível', group: 'Fixação', cost: 0.45, sale: 0.9, min: 200, qty: 500 },
      { code: 'CAT-FLA-3IN', name: 'Flange aço inox 3"', unit: 'UN', productType: 'Produto', group: 'Flanges', cost: 42, sale: 78, min: 8, qty: 35 },
      { code: 'CAT-BUCH-12', name: 'Bucha redução 12mm', unit: 'UN', productType: 'Componente', group: 'Buchas', cost: 3.1, sale: 6.5, min: 50, qty: 80 },
      { code: 'CAT-POR-M12', name: 'Porca autotravante M12', unit: 'UN', productType: 'Consumível', group: 'Fixação', cost: 0.32, sale: 0.65, min: 300, qty: 800 },
      { code: 'CAT-ARR-10', name: 'Arruela lisa 10mm', unit: 'UN', productType: 'Consumível', group: 'Fixação', cost: 0.08, sale: 0.15, min: 500, qty: 2000 },
      { code: 'CAT-GUI-LINEAR', name: 'Guia linear 500mm', unit: 'UN', productType: 'Componente', group: 'Automação', cost: 210, sale: 390, min: 2, qty: 6 },
      { code: 'CAT-MOTOR-05', name: 'Motor brushless 0,5kW', unit: 'UN', productType: 'Componente', group: 'Automação', cost: 890, sale: 1320, min: 1, qty: 3 },
    ];

    const produtoEntity = await prisma.entity.findUnique({ where: { code: 'produto' } });
    const legacyCodigoByCatalogCode: Record<string, string> = {
      'CAT-EIX-025': 'EIX-025',
      'CAT-ROL-6205': 'ROL-6205',
      'CAT-CHA-003': 'CHA-003',
    };

    for (const s of samples) {
      let entityRecordId: string | undefined;
      const legacyCodigo = legacyCodigoByCatalogCode[s.code];
      if (produtoEntity && legacyCodigo) {
        const match = await prisma.entityRecord.findFirst({
          where: {
            entityId: produtoEntity.id,
            deletedAt: null,
            data: { path: ['codigo'], equals: legacyCodigo },
          },
        });
        if (match) entityRecordId = match.id;
      }

      await prisma.product.create({
        data: {
          code: s.code,
          name: s.name,
          unit: s.unit,
          productType: s.productType,
          group: s.group,
          costPrice: new Prisma.Decimal(s.cost),
          salePrice: new Prisma.Decimal(s.sale),
          minStock: new Prisma.Decimal(s.min),
          status: 'Ativo',
          entityRecordId,
          companyId: defaultCompany.id,
          locations: {
            create: {
              locationId: defaultLoc.id,
              quantity: new Prisma.Decimal(s.qty),
            },
          },
        },
      });
    }
  }

   // --- Vendas (Customer / Quote / SaleOrder Prisma) — 5 pedidos, 3 orçamentos quando vazio ---
   if ((await prisma.customer.count()) === 0 && (await prisma.product.count()) > 0) {
     const vendasSeedOwner = await prisma.user.findUnique({ where: { email: 'vendas@cozinha.com' } });
     const products = await prisma.product.findMany({ orderBy: { code: 'asc' }, take: 8 });
     const defaultCompany = await prisma.company.findFirst();
     const c1 = await prisma.customer.create({
       data: {
         code: 'CLI-V01',
         name: 'Metalúrgica ABC Ltda',
         document: '12.345.678/0001-90',
         active: true,
         companyId: defaultCompany?.id,
       },
     });
      const c2 = await prisma.customer.create({
        data: {
          code: 'CLI-V02',
          name: 'TechParts Ltda',
          document: '23.456.789/0001-01',
          active: true,
          companyId: defaultCompany?.id,
        },
      });
     const year = new Date().getFullYear();
    const pt = await prisma.priceTable.create({
      data: {
        code: `TAB-${year}`,
        name: 'Lista principal',
        currency: 'BRL',
        active: true,
      },
    });
    await prisma.priceTableItem.createMany({
      data: [
        {
          priceTableId: pt.id,
          productId: products[0].id,
          price: products[0].salePrice ?? new Prisma.Decimal(0),
          minQty: null,
        },
        {
          priceTableId: pt.id,
          productId: products[1]?.id ?? products[0].id,
          price: products[1]?.salePrice ?? new Prisma.Decimal(0),
          minQty: new Prisma.Decimal(10),
        },
      ].filter((x, i, a) => a.findIndex((y) => y.productId === x.productId) === i),
    });

    const qItem = (prodIdx: number, qtd: number, price: number) => ({
      productId: products[prodIdx % products.length].id,
      quantity: new Prisma.Decimal(qtd),
      unitPrice: new Prisma.Decimal(price),
      discountPct: null,
    });

    const quotesSeed = [
      { num: `${year}-00001`, cust: c1.id, items: [qItem(0, 4, 310), qItem(1, 10, 18.9)] },
      { num: `${year}-00002`, cust: c2.id, items: [qItem(0, 2, 310)] },
      { num: `${year}-00003`, cust: c1.id, items: [qItem(2, 5, 450), qItem(0, 1, 310)] },
    ];

    for (const qs of quotesSeed) {
      let total = new Prisma.Decimal(0);
      const creates = qs.items.map((it) => {
        const lt = it.quantity.mul(it.unitPrice);
        total = total.add(lt);
        return {
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discountPct: it.discountPct,
        };
      });
      const qid = randomUUID();
      await prisma.quote.create({
        data: {
          id: qid,
          familyId: qid,
          versionNumber: 1,
          number: `ORC-${qs.num}`,
          customerId: qs.cust,
          status: 'ENVIADO',
          totalAmount: total,
          items: { create: creates },
        },
      });
    }

    const ordersSeed = [
      { num: `${year}-00001`, cust: c1.id, col: 'PEDIDO', st: 'DRAFT', items: [qItem(0, 10, 310)] },
      { num: `${year}-00002`, cust: c2.id, col: 'PRODUCAO', st: 'APPROVED', items: [qItem(1, 50, 18.9)] },
      { num: `${year}-00003`, cust: c1.id, col: 'APROVACAO', st: 'DRAFT', items: [qItem(0, 5, 310)] },
      { num: `${year}-00004`, cust: c2.id, col: 'EXPEDICAO', st: 'APPROVED', items: [qItem(2, 3, 450)] },
      { num: `${year}-00005`, cust: c1.id, col: 'CONCLUIDO', st: 'APPROVED', items: [qItem(0, 2, 310)] },
    ];

    for (const os of ordersSeed) {
      let total = new Prisma.Decimal(0);
      const lines = os.items.map((it) => {
        const lt = it.quantity.mul(it.unitPrice);
        total = total.add(lt);
        return {
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discountPct: it.discountPct,
          lineTotal: lt,
        };
      });
       await prisma.saleOrder.create({
         data: {
           number: `PV-${os.num}`,
           customerId: os.cust,
           status: os.st,
           kanbanColumn: os.col,
           totalAmount: total,
           ownerUserId: vendasSeedOwner?.id ?? null,
           companyId: defaultCompany?.id,
           items: { create: lines },
         },
       });
    }
  }

  // PVs sem responsável: associa ao usuário demo de vendas (escopo “minhas vendas” no dashboard)
  try {
    const vendasOwner = await prisma.user.findUnique({ where: { email: 'vendas@cozinha.com' } });
    if (vendasOwner) {
      await prisma.saleOrder.updateMany({
        where: { ownerUserId: null },
        data: { ownerUserId: vendasOwner.id },
      });
    }
  } catch {
    /* schema antigo sem owner_user_id */
  }

   // --- Compras (Supplier / PurchaseOrder) quando vazio ---
   if ((await prisma.supplier.count()) === 0 && (await prisma.product.count()) > 0) {
     const products = await prisma.product.findMany({ orderBy: { code: 'asc' }, take: 4 });
     const defaultCompany = await prisma.company.findFirst();
     const s1 = await prisma.supplier.create({
       data: { code: 'FOR-P01', name: 'Distribuidora Sul Ltda', document: '11.222.333/0001-44', active: true, companyId: defaultCompany?.id },
     });
     const s2 = await prisma.supplier.create({
       data: { code: 'FOR-P02', name: 'Fixadores do Brasil', document: '55.666.777/0001-88', active: true, companyId: defaultCompany?.id },
     });
    const year = new Date().getFullYear();
     await prisma.purchaseOrder.create({
       data: {
         number: `OC-${year}-00001`,
         supplierId: s1.id,
         status: 'ENVIADO',
         companyId: defaultCompany?.id,
         items: {
          create: [
            {
              productId: products[0].id,
              quantity: new Prisma.Decimal(20),
              unitCost: products[0].costPrice,
              receivedQty: new Prisma.Decimal(0),
            },
            {
              productId: products[1]?.id ?? products[0].id,
              quantity: new Prisma.Decimal(100),
              unitCost: products[1]?.costPrice,
              receivedQty: new Prisma.Decimal(0),
            },
          ].filter((x, i, a) => a.findIndex((y) => y.productId === x.productId) === i),
        },
      },
    });
     await prisma.purchaseOrder.create({
       data: {
         number: `OC-${year}-00002`,
         supplierId: s2.id,
         status: 'RASCUNHO',
         companyId: defaultCompany?.id,
         items: {
          create: {
            productId: products[0].id,
            quantity: new Prisma.Decimal(5),
            unitCost: products[0].costPrice,
            receivedQty: new Prisma.Decimal(0),
          },
        },
      },
    });
  }

  // --- Catálogo Prisma: máquinas, roteiros, OPs, RH, NF-e (após produtos existirem) ---
  if ((await prisma.product.count()) > 0) {
    const products = await prisma.product.findMany({ orderBy: { code: 'asc' }, take: 8 });
    const firstProduct = products[0];
    const flangeProduct = products.find((p) => p.code.includes('FLA')) ?? firstProduct;

    if ((await prisma.machine.count()) === 0) {
      const m1 = await prisma.machine.create({
        data: { id: randomUUID(), code: 'LASER-01', name: 'Laser 6kW', sector: 'Corte', active: true },
      });
      const m2 = await prisma.machine.create({
        data: { id: randomUUID(), code: 'DOB-01', name: 'Dobradeira CNC', sector: 'Dobra', active: true },
      });
      const m3 = await prisma.machine.create({
        data: { id: randomUUID(), code: 'SOLDA-01', name: 'Estação solda TIG', sector: 'Solda', active: true },
      });

      const routingA = await prisma.routing.create({
        data: {
          id: randomUUID(),
          code: 'ROT-EIXO',
          name: 'Roteiro padrão — eixo',
          productId: firstProduct.id,
          active: true,
          stages: {
            create: [
              { id: randomUUID(), sortOrder: 0, name: 'Corte laser', machineId: m1.id, durationMinutes: 60 },
              { id: randomUUID(), sortOrder: 1, name: 'Dobra', machineId: m2.id, durationMinutes: 45 },
              { id: randomUUID(), sortOrder: 2, name: 'Solda', machineId: m3.id, durationMinutes: 30 },
            ],
          },
        },
      });

      await prisma.routing.create({
        data: {
          id: randomUUID(),
          code: 'ROT-FLANGE',
          name: 'Roteiro — flange / acabamento',
          productId: flangeProduct.id,
          active: true,
          stages: {
            create: [{ id: randomUUID(), sortOrder: 0, name: 'Acabamento', durationMinutes: 90 }],
          },
        },
      });

      const so = await prisma.saleOrder.findFirst({ orderBy: { createdAt: 'desc' } });
      const statuses = ['DRAFT', 'IN_PROGRESS', 'RELEASED', 'PAUSED', 'DONE'] as const;
      const cols = ['BACKLOG', 'WIP', 'WIP', 'QA', 'DONE'] as const;
       for (let i = 0; i < 5; i += 1) {
         await prisma.workOrder.create({
           data: {
             id: randomUUID(),
             number: `OP-PRD-${String(i + 1).padStart(5, '0')}`,
             status: statuses[i],
             saleOrderId: i < 4 ? so?.id : undefined,
             productId: products[i % products.length].id,
             routingId: routingA.id,
             quantityPlanned: new Prisma.Decimal(10 + i * 2),
             kanbanColumn: cols[i],
             kanbanOrder: i,
             dueDate: new Date(Date.now() + (5 + i) * 86400000),
             companyId: products[0]?.companyId,
             items: {
               create: {
                 id: randomUUID(),
                 productId: products[i % products.length].id,
                 quantity: new Prisma.Decimal(10 + i * 2),
               },
             },
           },
         });
       }

      const woApp = await prisma.workOrder.findFirst({ where: { number: 'OP-PRD-00001' } });
      const st = await prisma.routingStage.findFirst({
        where: { routingId: routingA.id },
        orderBy: { sortOrder: 'asc' },
      });
      if (woApp && st) {
        await prisma.productionAppointment.create({
          data: {
            id: randomUUID(),
            workOrderId: woApp.id,
            machineId: m1.id,
            routingStageId: st.id,
            scheduledStart: new Date(Date.now() + 86400000),
            scheduledEnd: new Date(Date.now() + 90000000),
            status: 'SCHEDULED',
          },
        });
      }
    }

    if ((await prisma.employee.count()) === 0) {
       const emps = [
         { code: 'EMP001', fullName: 'João Melo', department: 'Produção', salaryBase: 3200, hire: '2021-03-15' },
         { code: 'EMP002', fullName: 'Pedro Alves', department: 'Produção', salaryBase: 3800, hire: '2019-07-22' },
         { code: 'EMP003', fullName: 'Maria Lima', department: 'Qualidade', salaryBase: 4500, hire: '2020-11-05' },
         { code: 'EMP004', fullName: 'Carlos Santos', department: 'Vendas', salaryBase: 7200, hire: '2018-01-10' },
         { code: 'EMP005', fullName: 'Ana Paula', department: 'Financeiro', salaryBase: 5100, hire: '2022-06-18' },
       ];
       const defaultCompany = await prisma.company.findFirst();
       for (const e of emps) {
         await prisma.employee.create({
           data: {
             id: randomUUID(),
             code: e.code,
             fullName: e.fullName,
             department: e.department,
             salaryBase: new Prisma.Decimal(e.salaryBase),
             hireDate: new Date(e.hire),
             active: true,
             companyId: defaultCompany?.id,
           },
         });
       }
    }

     if ((await prisma.fiscalNfe.count()) === 0) {
       const defaultCompany = await prisma.company.findFirst();
       await prisma.fiscalNfe.createMany({
         data: [
           {
             id: randomUUID(),
             number: '1245',
             series: '1',
             accessKey: '35260412345678901234550010002450011010266123456789',
             status: 'AUTORIZADA',
             customerName: 'Metalúrgica ABC Ltda',
             totalAmount: new Prisma.Decimal(45200),
             issuedAt: new Date('2026-04-18'),
             companyId: defaultCompany?.id,
           },
           {
             id: randomUUID(),
             number: '1244',
             series: '1',
             accessKey: '35260412345678901234550010002440012010266123456790',
             status: 'AUTORIZADA',
             customerName: 'Ind. XYZ S/A',
             totalAmount: new Prisma.Decimal(12800),
             issuedAt: new Date('2026-04-16'),
             companyId: defaultCompany?.id,
           },
           {
             id: randomUUID(),
             number: '1243',
             series: '1',
             accessKey: null,
             status: 'CANCELADA',
             customerName: 'Comércio Beta',
             totalAmount: new Prisma.Decimal(8900),
             issuedAt: new Date('2026-04-14'),
             cancelledAt: new Date('2026-04-15'),
             companyId: defaultCompany?.id,
           },
         ],
       });
     }
  }

  // ── More conta_receber / conta_pagar (more realistic volume) ───────────────
  const crCount = await prisma.entityRecord.count({
    where: { entity: { code: 'conta_receber' }, deletedAt: null },
  });
  if (crCount <= 2) {
    const crEnt = await prisma.entity.findUnique({ where: { code: 'conta_receber' } });
    const cpEnt = await prisma.entity.findUnique({ where: { code: 'conta_pagar' } });
    if (crEnt) {
      const crRecords = [
        { descricao:'PV-2026-00001', cliente_fornecedor:'Metalúrgica ABC Ltda', categoria:'Venda', valor:3100, data_emissao:'2026-04-01', data_vencimento:'2026-05-01', status:'aberto', documento:'NF-1240' },
        { descricao:'PV-2026-00002', cliente_fornecedor:'TechParts Ltda', categoria:'Venda', valor:945, data_emissao:'2026-04-03', data_vencimento:'2026-05-03', status:'pago', documento:'NF-1241' },
        { descricao:'PV-2026-00003', cliente_fornecedor:'SiderTech S/A', categoria:'Venda', valor:8200, data_emissao:'2026-04-05', data_vencimento:'2026-05-05', status:'aberto', documento:'NF-1242' },
        { descricao:'Serviço manutenção', cliente_fornecedor:'Metalúrgica ABC Ltda', categoria:'Serviço', valor:1500, data_emissao:'2026-04-10', data_vencimento:'2026-04-25', status:'vencido', documento:'NF-1245' },
        { descricao:'PV-2026-00004', cliente_fornecedor:'Comércio Beta Ltda', categoria:'Venda', valor:4800, data_emissao:'2026-04-15', data_vencimento:'2026-05-15', status:'aberto', documento:'NF-1246' },
        { descricao:'PV-2026-00005', cliente_fornecedor:'Ind. Barros', categoria:'Venda', valor:12750, data_emissao:'2026-04-18', data_vencimento:'2026-05-18', status:'aberto', documento:'NF-1247' },
        { descricao:'Parcela 1/3 — PV-0041', cliente_fornecedor:'MetalBox Ind.', categoria:'Venda', valor:9600, data_emissao:'2026-04-20', data_vencimento:'2026-05-20', status:'aberto', documento:'NF-1248' },
        { descricao:'Parcela 2/3 — PV-0041', cliente_fornecedor:'MetalBox Ind.', categoria:'Venda', valor:9600, data_emissao:'2026-04-20', data_vencimento:'2026-06-20', status:'aberto', documento:'NF-1248' },
        { descricao:'Parcela 3/3 — PV-0041', cliente_fornecedor:'MetalBox Ind.', categoria:'Venda', valor:9600, data_emissao:'2026-04-20', data_vencimento:'2026-07-20', status:'aberto', documento:'NF-1248' },
      ];
      for (const r of crRecords) {
        await prisma.entityRecord.create({ data: { entityId: crEnt.id, data: r, createdBy: master.id, updatedBy: master.id } });
      }
    }
    if (cpEnt) {
      const cpRecords = [
        { descricao:'OC-2026-00001 — Rolamentos', cliente_fornecedor:'Distribuidora Sul Ltda', categoria:'Compra', valor:4100, data_emissao:'2026-04-02', data_vencimento:'2026-05-02', status:'aberto', documento:'NF-FON-5201' },
        { descricao:'Aluguel fábrica — Abril', cliente_fornecedor:'Imobiliária Central', categoria:'Serviço', valor:8500, data_emissao:'2026-04-01', data_vencimento:'2026-04-10', status:'pago', documento:'REC-0412' },
        { descricao:'Energia elétrica — Abril', cliente_fornecedor:'CPFL Energia', categoria:'Serviço', valor:3840, data_emissao:'2026-04-15', data_vencimento:'2026-04-30', status:'pago', documento:'FAT-EL-04' },
        { descricao:'OC-2026-00002 — Chapas aço', cliente_fornecedor:'AçoFlex Distribuidora', categoria:'Compra', valor:8200, data_emissao:'2026-04-10', data_vencimento:'2026-05-10', status:'aberto', documento:'NF-FON-5310' },
        { descricao:'Salários — Abril 2026', cliente_fornecedor:'Folha de Pagamento', categoria:'Serviço', valor:27540, data_emissao:'2026-04-30', data_vencimento:'2026-04-30', status:'pago', documento:'FP-2026-04' },
        { descricao:'INSS patronal — Abril', cliente_fornecedor:'Receita Federal', categoria:'Imposto', valor:5508, data_emissao:'2026-04-30', data_vencimento:'2026-05-20', status:'aberto', documento:'GPS-04/26' },
        { descricao:'FGTS — Abril', cliente_fornecedor:'Caixa Econômica Federal', categoria:'Imposto', valor:2203, data_emissao:'2026-04-30', data_vencimento:'2026-05-07', status:'aberto', documento:'GRF-04/26' },
        { descricao:'Internet / Telefonia', cliente_fornecedor:'Vivo Empresas', categoria:'Serviço', valor:680, data_emissao:'2026-04-05', data_vencimento:'2026-04-20', status:'pago', documento:'FAT-TEL-04' },
      ];
      for (const r of cpRecords) {
        await prisma.entityRecord.create({ data: { entityId: cpEnt.id, data: r, createdBy: master.id, updatedBy: master.id } });
      }
    }
  }

  // ── CRM Processes ─────────────────────────────────────────────────────────
  if ((await prisma.crmProcess.count()) === 0) {
    const crmProcesses = [
      { type: 'negociacao', title: 'Fornecimento anual de eixos — Metal ABC', clientName: 'Metalúrgica ABC Ltda', responsible: 'Carlos Santos', stage: 'Proposta', value: new Prisma.Decimal(180000), probability: 70, priority: 'Alta', origin: 'Site', forecastAt: new Date('2026-05-30') },
      { type: 'negociacao', title: 'Projeto eixos transmissão — lote trimestral', clientName: 'SiderTech S/A', responsible: 'Rafael Costa', stage: 'Negociação', value: new Prisma.Decimal(95000), probability: 85, priority: 'Alta', origin: 'Indicação', forecastAt: new Date('2026-04-30') },
      { type: 'negociacao', title: 'Flanges especiais — linha offshore', clientName: 'PetroEquip Ltda', responsible: 'Carlos Santos', stage: 'Qualificação', value: new Prisma.Decimal(320000), probability: 40, priority: 'Normal', origin: 'Evento', forecastAt: new Date('2026-07-15') },
      { type: 'suporte', title: 'Problema no lote ROL-6205 — devolução parcial', clientName: 'TechParts Ltda', responsible: 'Maria Lima', stage: 'Em atendimento', value: null, probability: null, priority: 'Alta', origin: 'Telefone', forecastAt: null },
      { type: 'suporte', title: 'Revisão de flange — especificação divergente', clientName: 'Ind. Barros', responsible: 'João Melo', stage: 'Aberto', value: null, probability: null, priority: 'Normal', origin: 'E-mail', forecastAt: null },
      { type: 'assistencia', title: 'Assistência técnica — Eixo quebrado em campo', clientName: 'Comércio Beta Ltda', responsible: 'Pedro Alves', stage: 'Análise', value: new Prisma.Decimal(1200), probability: null, priority: 'Urgente', origin: 'Telefone', forecastAt: new Date('2026-05-05') },
      { type: 'negociacao', title: 'Contrato de manutenção preventiva — 2026', clientName: 'MetalBox Ind.', responsible: 'Carlos Santos', stage: 'Lead', value: new Prisma.Decimal(48000), probability: 30, priority: 'Normal', origin: 'Indicação', forecastAt: new Date('2026-06-30') },
      { type: 'assistencia', title: 'Visita técnica — instalação guia linear', clientName: 'AutoPeças Norte', responsible: 'Pedro Alves', stage: 'Concluído', value: new Prisma.Decimal(800), probability: null, priority: 'Normal', origin: 'Site', forecastAt: null },
    ];
    for (const p of crmProcesses) {
      await prisma.crmProcess.create({ data: { id: randomUUID(), ...p } });
    }
  }

  // ── Projects ──────────────────────────────────────────────────────────────
  if ((await prisma.project.count()) === 0) {
    const projects = [
      {
        code: 'PRJ-2026-001', name: 'Desenvolvimento eixo transmissão customizado', clientName: 'SiderTech S/A',
        startDate: new Date('2026-03-01'), dueDate: new Date('2026-05-31'), status: 'em_andamento', progress: 55,
        revenue: new Prisma.Decimal(95000), budgetedCost: new Prisma.Decimal(60000), responsible: 'Engenharia / Projetos',
        description: 'Desenvolvimento e homologação de eixo de transmissão customizado para linha de produção do cliente.',
        team: [{ nome: 'Engenharia / Projetos', funcao: 'Coordenador' }, { nome: 'João Melo', funcao: 'Fabricação' }],
        tasks: [
          { level: 0, name: 'Levantamento de requisitos', durationDays: 10, startOffset: 0, progress: 100, responsible: 'Engenharia / Projetos', hoursPlanned: new Prisma.Decimal(20), hoursReal: new Prisma.Decimal(22) },
          { level: 0, name: 'Projeto e desenho 3D', durationDays: 20, startOffset: 10, progress: 100, responsible: 'Engenharia / Projetos', hoursPlanned: new Prisma.Decimal(60), hoursReal: new Prisma.Decimal(58) },
          { level: 0, name: 'Fabricação do protótipo', durationDays: 15, startOffset: 30, progress: 70, responsible: 'João Melo', hoursPlanned: new Prisma.Decimal(40), hoursReal: new Prisma.Decimal(28) },
          { level: 0, name: 'Testes e validação', durationDays: 10, startOffset: 45, progress: 0, responsible: 'Maria Lima', hoursPlanned: new Prisma.Decimal(20), hoursReal: new Prisma.Decimal(0) },
          { level: 0, name: 'Homologação e entrega', durationDays: 7, startOffset: 55, progress: 0, responsible: 'Carlos Santos', hoursPlanned: new Prisma.Decimal(10), hoursReal: new Prisma.Decimal(0) },
        ],
      },
      {
        code: 'PRJ-2026-002', name: 'Implantação linha de solda robotizada', clientName: 'Interno',
        startDate: new Date('2026-04-01'), dueDate: new Date('2026-08-31'), status: 'planejamento', progress: 10,
        revenue: null, budgetedCost: new Prisma.Decimal(250000), responsible: 'Gerente Produção',
        description: 'Projeto de modernização do setor de solda com instalação de célula robotizada.',
        team: [{ nome: 'Gerente Produção', funcao: 'Sponsor' }, { nome: 'Engenharia / Projetos', funcao: 'Coordenador' }],
        tasks: [
          { level: 0, name: 'Estudo de viabilidade', durationDays: 20, startOffset: 0, progress: 80, responsible: 'Engenharia / Projetos', hoursPlanned: new Prisma.Decimal(40), hoursReal: new Prisma.Decimal(32) },
          { level: 0, name: 'Cotação equipamentos', durationDays: 30, startOffset: 20, progress: 0, responsible: 'Compras / Suprimentos', hoursPlanned: new Prisma.Decimal(20), hoursReal: new Prisma.Decimal(0) },
          { level: 0, name: 'Instalação civil', durationDays: 25, startOffset: 60, progress: 0, responsible: 'Gerente Produção', hoursPlanned: new Prisma.Decimal(0), hoursReal: new Prisma.Decimal(0) },
          { level: 0, name: 'Instalação elétrica e automação', durationDays: 30, startOffset: 85, progress: 0, responsible: 'Engenharia / Projetos', hoursPlanned: new Prisma.Decimal(60), hoursReal: new Prisma.Decimal(0) },
          { level: 0, name: 'Treinamento operadores', durationDays: 10, startOffset: 115, progress: 0, responsible: 'Gerente Produção', hoursPlanned: new Prisma.Decimal(20), hoursReal: new Prisma.Decimal(0) },
        ],
      },
      {
        code: 'PRJ-2026-003', name: 'Certificação ISO 9001:2015', clientName: 'Interno',
        startDate: new Date('2026-01-15'), dueDate: new Date('2026-12-31'), status: 'em_andamento', progress: 35,
        revenue: null, budgetedCost: new Prisma.Decimal(45000), responsible: 'Qualidade',
        description: 'Processo de certificação e adequação do sistema de gestão da qualidade conforme ISO 9001:2015.',
        team: [{ nome: 'Qualidade', funcao: 'Coordenador' }, { nome: 'Gerente Geral', funcao: 'Sponsor' }],
        tasks: [
          { level: 0, name: 'Diagnóstico inicial', durationDays: 20, startOffset: 0, progress: 100, responsible: 'Qualidade', hoursPlanned: new Prisma.Decimal(30), hoursReal: new Prisma.Decimal(28) },
          { level: 0, name: 'Mapeamento de processos', durationDays: 45, startOffset: 20, progress: 80, responsible: 'Qualidade', hoursPlanned: new Prisma.Decimal(80), hoursReal: new Prisma.Decimal(64) },
          { level: 0, name: 'Elaboração de documentos', durationDays: 60, startOffset: 65, progress: 20, responsible: 'Qualidade', hoursPlanned: new Prisma.Decimal(120), hoursReal: new Prisma.Decimal(24) },
          { level: 0, name: 'Auditoria interna', durationDays: 10, startOffset: 180, progress: 0, responsible: 'Qualidade', hoursPlanned: new Prisma.Decimal(20), hoursReal: new Prisma.Decimal(0) },
          { level: 0, name: 'Auditoria de certificação', durationDays: 5, startOffset: 280, progress: 0, responsible: 'Qualidade', hoursPlanned: new Prisma.Decimal(10), hoursReal: new Prisma.Decimal(0) },
        ],
      },
      {
        code: 'PRJ-2026-004', name: 'Expansão capacidade produtiva — Laser', clientName: 'Interno',
        startDate: new Date('2026-05-01'), dueDate: new Date('2026-09-30'), status: 'planejamento', progress: 0,
        revenue: null, budgetedCost: new Prisma.Decimal(380000), responsible: 'Gerente Produção',
        description: 'Aquisição de segundo laser de 10kW para dobrar capacidade de corte.',
        team: [{ nome: 'Gerente Produção', funcao: 'Sponsor' }, { nome: 'Compras / Suprimentos', funcao: 'Compras' }],
        tasks: [
          { level: 0, name: 'Aprovação de budget', durationDays: 15, startOffset: 0, progress: 0, responsible: 'Gerente Geral', hoursPlanned: new Prisma.Decimal(10), hoursReal: new Prisma.Decimal(0) },
          { level: 0, name: 'Processo de compra', durationDays: 60, startOffset: 15, progress: 0, responsible: 'Compras / Suprimentos', hoursPlanned: new Prisma.Decimal(30), hoursReal: new Prisma.Decimal(0) },
          { level: 0, name: 'Adaptação infraestrutura', durationDays: 30, startOffset: 80, progress: 0, responsible: 'Gerente Produção', hoursPlanned: new Prisma.Decimal(0), hoursReal: new Prisma.Decimal(0) },
          { level: 0, name: 'Instalação e comissionamento', durationDays: 20, startOffset: 110, progress: 0, responsible: 'Engenharia / Projetos', hoursPlanned: new Prisma.Decimal(20), hoursReal: new Prisma.Decimal(0) },
        ],
      },
    ];

    for (const proj of projects) {
      const { tasks, ...projData } = proj;
      const created = await prisma.project.create({
        data: {
          id: randomUUID(),
          ...projData,
          tasks: {
            create: tasks.map((t, idx) => ({ id: randomUUID(), ...t, sortOrder: idx })),
          },
        },
      });
      // Cost entries for in-progress projects
      if (projData.status === 'em_andamento') {
        await prisma.projectCostEntry.createMany({
          data: [
            { id: randomUUID(), projectId: created.id, entryDate: new Date('2026-04-10'), description: 'Mão de obra interna', category: 'MOD', amount: new Prisma.Decimal(4800) },
            { id: randomUUID(), projectId: created.id, entryDate: new Date('2026-04-20'), description: 'Material — matéria prima', category: 'Material', amount: new Prisma.Decimal(3200) },
          ],
        });
        await prisma.projectNote.create({ data: { id: randomUUID(), projectId: created.id, userName: 'Gerente Geral', content: 'Projeto dentro do prazo. Protótipo previsto para semana que vem.', noteType: 'progresso' } });
      }
    }
  }

  // ── Knowledge Base ────────────────────────────────────────────────────────
  if ((await prisma.knowledgeCategory.count()) === 0) {
    const categories = [
      { id: randomUUID(), name: 'Processos de Fabricação', icon: '⚙️', color: '#3b82f6', description: 'Procedimentos e instruções para os processos produtivos', sortOrder: 0 },
      { id: randomUUID(), name: 'Qualidade e Inspeção', icon: '🔍', color: '#10b981', description: 'Planos de controle, critérios de inspeção e registros de qualidade', sortOrder: 1 },
      { id: randomUUID(), name: 'Normas e Certificações', icon: '📋', color: '#f59e0b', description: 'Normas técnicas, regulamentações e requisitos de certificação', sortOrder: 2 },
      { id: randomUUID(), name: 'Treinamento e Segurança', icon: '🛡️', color: '#ef4444', description: 'Procedimentos de segurança, EPI e capacitações', sortOrder: 3 },
      { id: randomUUID(), name: 'Manutenção', icon: '🔧', color: '#8b5cf6', description: 'Planos e procedimentos de manutenção preventiva e corretiva', sortOrder: 4 },
    ];
    for (const cat of categories) {
      const createdCat = await prisma.knowledgeCategory.create({ data: { ...cat, updatedAt: new Date() } });
      let arts: Array<{ slug: string; title: string; summary: string; content: string; subcategory?: string; author: string; views: number }> = [];
      if (cat.name === 'Processos de Fabricação') {
        arts = [
          { slug: 'proc-corte-laser-acos-inox', title: 'Procedimento: Corte a Laser — Aços Inoxidáveis', summary: 'Parâmetros de corte, configuração de potência e velocidade para aços inoxidáveis 304 e 316L.', content: '# Corte a Laser — Aços Inoxidáveis\n\n## Equipamento\nLaser CO₂ 6kW (LASER-01)\n\n## Parâmetros — AISI 304\n| Espessura | Potência | Velocidade | Pressão N₂ |\n|---|---|---|---|\n| 1mm | 3kW | 6 m/min | 12 bar |\n| 2mm | 4kW | 4 m/min | 14 bar |\n| 3mm | 5kW | 2.5 m/min | 16 bar |\n\n## Pontos de Atenção\n- Verificar bico confocal antes de cada produção.\n- Calibrar foco a cada troca de espessura.\n- Limpar ótica a cada 8h de uso.', subcategory: 'Corte', author: 'Engenharia / Projetos', views: 142 },
          { slug: 'proc-solda-tig-inox', title: 'Instrução de Trabalho: Solda TIG — Aço Inox', summary: 'Parâmetros e técnica para solda TIG em aço inoxidável austenítico.', content: '# Solda TIG — Aço Inox\n\n## Especificação\n- Material base: AISI 304 / 316L\n- Metal de adição: ER308L / ER316L\n- Gás de proteção: Argônio 99,9%\n\n## Parâmetros\n- Corrente: 80–120A (CC negativo)\n- Tensão: 12–14V\n- Vazão gás: 12–15 L/min\n\n## Controle de qualidade\n- Visual 100%\n- Líquido penetrante conforme ASME VIII (amostral 20%).', subcategory: 'Solda', author: 'João Melo', views: 98 },
          { slug: 'proc-dobra-chapas-cnc', title: 'Procedimento: Dobra de Chapas — Dobradeira CNC', summary: 'Configuração, sequência de operações e tolerâncias para dobra em dobradeira CNC.', content: '# Dobra de Chapas — Dobradeira CNC\n\n## Equipamento\nDobradeira CNC (DOB-01), capacidade 175T, comp. 3m\n\n## Configuração\n1. Selecionar ferramental conforme espessura.\n2. Programar ângulo com 1° de acréscimo (springback).\n3. Verificar prumo e esquadro na 1ª peça.\n\n## Tolerâncias\n- Ângulo: ±0,5°\n- Dimensão: ±0,3mm\n\n## Registro\nPreencher ficha de 1ª peça antes de iniciar série.', subcategory: 'Dobra', author: 'Pedro Alves', views: 75 },
        ];
      } else if (cat.name === 'Qualidade e Inspeção') {
        arts = [
          { slug: 'plano-controle-flanges-inox', title: 'Plano de Controle — Flanges Aço Inox', summary: 'Critérios de inspeção dimensional, superficial e de solda para flanges de aço inoxidável.', content: '# Plano de Controle — Flanges\n\n## Inspeção de Recebimento\n- Verificar certificado de material (EN 10204 3.1)\n- Dureza Brinell ≤ 217 HB\n- Composição química: C≤0,03%, Cr 16–18%, Ni 10–14%\n\n## Inspeção de Processo\n- Dimensional: tolerância ISO 2768 m\n- Rugosidade: Ra ≤ 3,2μm nas faces de vedação\n\n## Inspeção Final\n- 100% visual\n- Dimensional amostral AQL 1.0\n- Ensaio de líquido penetrante em soldas (100%)', subcategory: 'Plano de Controle', author: 'Maria Lima', views: 201 },
          { slug: 'criterios-aprovacao-eixos', title: 'Critérios de Aprovação — Eixos de Transmissão', summary: 'Limites de aceitação e rejeição para eixos de transmissão.', content: '# Critérios de Aprovação — Eixos\n\n## Dimensional\n- Diâmetro: h6 (ISO 286)\n- Cilindricidade: 0,01mm/100mm\n- Rugosidade assento rolamento: Ra ≤ 0,8μm\n\n## Balanceamento dinâmico\n- Qualidade G6.3 (ISO 1940)\n\n## Dureza superficial (quando aplicável)\n- 56–62 HRC após tratamento', subcategory: 'Aprovação', author: 'Maria Lima', views: 156 },
        ];
      } else if (cat.name === 'Treinamento e Segurança') {
        arts = [
          { slug: 'epi-soldador', title: 'EPIs Obrigatórios — Soldador', summary: 'Lista de EPIs obrigatórios e procedimento de uso para operadores de solda.', content: '# EPIs — Soldador\n\n## Obrigatórios\n- Máscara de solda com filtro DIN 11\n- Luva de raspa cano longo\n- Avental de raspa\n- Mangote de raspa\n- Bota de segurança com biqueira e solado anti-derrapante\n- Protetor auricular (NRR 26 dB)\n\n## Verificação\nInspecionar antes de cada turno. Substituir imediatamente em caso de dano.\n\n## Procedimento de uso\nNunca iniciar solda sem máscara e avental.\nVerificar ventilação local antes de iniciar operação.', author: 'RH Departamento', views: 312 },
          { slug: 'bloqueio-energia-loto', title: 'Procedimento LOTO — Bloqueio de Energia', summary: 'Procedimento de bloqueio e etiquetagem de energia (LOTO) para manutenção de equipamentos.', content: '# Bloqueio de Energia — LOTO\n\n## Objetivo\nGarantir segurança durante manutenção ou intervenção em equipamentos.\n\n## Passos\n1. Comunicar o desligamento ao operador.\n2. Desligar o equipamento pelo painel.\n3. Abrir o disjuntor / válvula de energia.\n4. Instalar cadeado LOTO (um por pessoa).\n5. Testar ausência de energia.\n6. Executar a manutenção.\n7. Remover bloqueio na ordem inversa.\n\n## Importante\nNunca remover bloqueio de outro funcionário.', author: 'RH Departamento', views: 189 },
        ];
      } else if (cat.name === 'Manutenção') {
        arts = [
          { slug: 'manutencao-preventiva-laser', title: 'Plano de Manutenção Preventiva — Laser LASER-01', summary: 'Cronograma e procedimentos de manutenção preventiva para o laser de corte 6kW.', content: '# Manutenção Preventiva — LASER-01\n\n## Diária\n- Limpar ótica de focalização\n- Verificar pressão do gás (N₂ e O₂)\n- Verificar nível de fluido de refrigeração\n\n## Semanal\n- Limpar trilhos e cremalheiras (eixo X e Y)\n- Verificar tensão das correias\n- Testar sistema de segurança (botão emergência)\n\n## Mensal\n- Troca de filtros de ar\n- Lubrificação de guias lineares\n- Verificar e trocar bicos de corte se desgastados\n\n## Trimestral\n- Verificar alinhamento do feixe\n- Calibração dos encoders', author: 'Gerente Produção', views: 87 },
        ];
      }
      for (const art of arts) {
        const artId = randomUUID();
        await prisma.knowledgeArticle.create({
          data: {
            id: artId, categoryId: createdCat.id, title: art.title, slug: art.slug,
            summary: art.summary, content: art.content, status: 'publicado',
            visibility: 'interno', subcategory: art.subcategory ?? null,
            author: art.author, views: art.views, likes: Math.floor(art.views * 0.15),
            version: '1.0', updatedAt: new Date(),
          },
        });
      }
    }
  }

  // ── Quality ───────────────────────────────────────────────────────────────
  if ((await prisma.qualityInspectionPlan.count()) === 0) {
    const plans = [
      {
        id: randomUUID(), code: 'PCI-RECEB-001', name: 'Inspeção de Recebimento — Chapas Aço Inox',
        productCode: 'CAT-CHA-003', stage: 'recebimento', active: true,
        criteria: [{ item: 'Certificado material EN 10204 3.1', metodo: 'Análise documental', freq: '100%', limite: 'Aprovado' }, { item: 'Espessura', metodo: 'Paquímetro', freq: '100%', limite: '3 ± 0.1 mm' }, { item: 'Dimensão', metodo: 'Trena', freq: '10%', limite: '±1mm' }],
      },
      {
        id: randomUUID(), code: 'PCI-PROC-001', name: 'Inspeção de Processo — Dobra CNC',
        productCode: null, stage: 'processo', active: true,
        criteria: [{ item: 'Ângulo de dobra', metodo: 'Transferidor', freq: '1ª peça + 10%', limite: '±0.5°' }, { item: 'Dimensão', metodo: 'Paquímetro', freq: '1ª peça + 10%', limite: '±0.3mm' }],
      },
      {
        id: randomUUID(), code: 'PCI-ACAB-001', name: 'Inspeção Final — Flanges Aço Inox',
        productCode: 'CAT-FLA-3IN', stage: 'acabado', active: true,
        criteria: [{ item: 'Visual — corrosão / riscos', metodo: 'Visual', freq: '100%', limite: 'Sem defeitos' }, { item: 'Dimensional', metodo: 'Paquímetro / Altura', freq: '100%', limite: 'ISO 2768 m' }, { item: 'Dureza superficial', metodo: 'Durômetro Brinell', freq: '5%', limite: '≤ 217 HB' }],
      },
      {
        id: randomUUID(), code: 'PCI-RECEB-002', name: 'Inspeção de Recebimento — Rolamentos',
        productCode: 'CAT-ROL-6205', stage: 'recebimento', active: true,
        criteria: [{ item: 'Nota fiscal e certificado', metodo: 'Análise documental', freq: '100%', limite: 'Conforme' }, { item: 'Rotação livre', metodo: 'Manual', freq: '100%', limite: 'Sem travamento' }, { item: 'Folga radial', metodo: 'Comparador', freq: '20%', limite: 'C3 ± 0.02mm' }],
      },
    ];
    const planIds: string[] = [];
    for (const plan of plans) {
      await prisma.qualityInspectionPlan.create({ data: { ...plan, updatedAt: new Date() } });
      planIds.push(plan.id);
    }

    // Inspections
    const inspData = [
      { id: randomUUID(), planId: planIds[0], code: 'INS-2026-0041', type: 'recebimento', productCode: 'CAT-CHA-003', productName: 'Chapa Aço 3mm', referenceDoc: 'OC-2026-00001', status: 'aprovado', inspector: 'Maria Lima', inspectedAt: new Date('2026-04-15'), results: { items: [{ item: 'Certificado material', resultado: 'Aprovado', conforme: true }, { item: 'Espessura', resultado: '3.01mm', conforme: true }] }, notes: 'Lote aprovado sem ressalvas.' },
      { id: randomUUID(), planId: planIds[0], code: 'INS-2026-0040', type: 'recebimento', productCode: 'CAT-CHA-003', productName: 'Chapa Aço 3mm', referenceDoc: 'OC-2026-00001', status: 'reprovado', inspector: 'Maria Lima', inspectedAt: new Date('2026-04-12'), results: { items: [{ item: 'Certificado material', resultado: 'Não apresentado', conforme: false }, { item: 'Espessura', resultado: '2.85mm', conforme: false }] }, notes: 'Lote reprovado — espessura fora de especificação. Aberta NC-2026-007.' },
      { id: randomUUID(), planId: planIds[1], code: 'INS-2026-0039', type: 'processo', productCode: 'CAT-EIX-025', productName: 'Eixo Transmissão 25mm', referenceDoc: 'OP-PRD-00001', status: 'aprovado', inspector: 'Maria Lima', inspectedAt: new Date('2026-04-17'), results: { items: [{ item: 'Ângulo de dobra', resultado: '89.8°', conforme: true }, { item: 'Dimensão', resultado: '+0.1mm', conforme: true }] }, notes: '' },
      { id: randomUUID(), planId: planIds[2], code: 'INS-2026-0038', type: 'acabado', productCode: 'CAT-FLA-3IN', productName: 'Flange Aço Inox 3"', referenceDoc: 'OP-PRD-00003', status: 'aprovado_restricao', inspector: 'Maria Lima', inspectedAt: new Date('2026-04-18'), results: { items: [{ item: 'Visual', resultado: 'Risco superficial 1 peça', conforme: false }, { item: 'Dimensional', resultado: 'Conforme', conforme: true }] }, notes: '1 peça com risco superficial — aprovada com ressalva para retrabalho.' },
      { id: randomUUID(), planId: planIds[3], code: 'INS-2026-0037', type: 'recebimento', productCode: 'CAT-ROL-6205', productName: 'Rolamento 6205-ZZ', referenceDoc: 'OC-2026-00001', status: 'aprovado', inspector: 'Maria Lima', inspectedAt: new Date('2026-04-08'), results: { items: [{ item: 'Nota fiscal e certificado', resultado: 'Conforme', conforme: true }, { item: 'Rotação livre', resultado: 'OK', conforme: true }, { item: 'Folga radial', resultado: '0.018mm', conforme: true }] }, notes: 'Lote aprovado.' },
    ];
    for (const insp of inspData) {
      await prisma.qualityInspection.create({ data: { ...insp, updatedAt: new Date() } });
    }

    // Non-conformities
    const ncData = [
      { id: randomUUID(), code: 'NC-2026-009', title: 'Peça com risco superficial — Flange 3"', description: 'Flange apresentou risco superficial na face de vedação detectado na inspeção final da OP-PRD-00003.', origin: 'Inspeção Final', severity: 'Moderada', status: 'em_analise', responsible: 'Maria Lima', dueDate: new Date('2026-05-10'), correctiveAction: null, rootCause: null },
      { id: randomUUID(), code: 'NC-2026-008', title: 'Espessura fora de especificação — Chapa 3mm', description: 'Lote de chapas recebido em 12/04 com espessura 2.85mm (spec 3 ± 0.1mm). Fornecedor: AçoFlex.', origin: 'Recebimento', severity: 'Crítica', status: 'aberto', responsible: 'Compras / Suprimentos', dueDate: new Date('2026-05-05'), correctiveAction: 'Devolver lote ao fornecedor e emitir não-conformidade de fornecedor.', rootCause: 'Lote fora de especificação de fabricação na usina.' },
      { id: randomUUID(), code: 'NC-2026-007', title: 'Solda com porosidade — OP-PRD-00002', description: 'Detecção de porosidade em solda TIG de conjunto rolamento especial. LP indicou 3 pontos.', origin: 'Inspeção Processo', severity: 'Moderada', status: 'em_tratamento', responsible: 'João Melo', dueDate: new Date('2026-04-28'), correctiveAction: 'Esmerilhar região afetada e repassar solda. Nova inspeção por LP.', rootCause: 'Argônio com vazamento no mangote de gás. Substituído.' },
      { id: randomUUID(), code: 'NC-2026-006', title: 'Ângulo de dobra fora do tolerado — lote Julho 2025', description: 'Dobra com ângulo 88° (spec 90° ±0.5°) no lote de julho.', origin: 'Inspeção Processo', severity: 'Baixa', status: 'fechado', responsible: 'Pedro Alves', dueDate: new Date('2025-08-10'), correctiveAction: 'Recalibração da máquina e treinamento do operador.', rootCause: 'Compensação de springback não atualizada após troca de ferramental.', closedAt: new Date('2025-08-08') },
    ];
    for (const nc of ncData) {
      await prisma.qualityNonConformity.create({ data: { ...nc, updatedAt: new Date() } });
    }

    // Instruments
    const instruments = [
      { id: randomUUID(), code: 'INST-001', name: 'Paquímetro Digital 150mm', instrumentType: 'Dimensional', location: 'Qualidade', status: 'calibrado', lastCalibration: new Date('2026-02-10'), nextCalibration: new Date('2026-08-10'), calibrationInterval: 180, responsible: 'Maria Lima', certificate: 'CAL-2026-012' },
      { id: randomUUID(), code: 'INST-002', name: 'Micrômetro Externo 0-25mm', instrumentType: 'Dimensional', location: 'Qualidade', status: 'calibrado', lastCalibration: new Date('2026-02-10'), nextCalibration: new Date('2026-08-10'), calibrationInterval: 180, responsible: 'Maria Lima', certificate: 'CAL-2026-013' },
      { id: randomUUID(), code: 'INST-003', name: 'Comparador 0.001mm', instrumentType: 'Dimensional', location: 'Qualidade', status: 'calibrado', lastCalibration: new Date('2026-03-05'), nextCalibration: new Date('2026-09-05'), calibrationInterval: 180, responsible: 'Maria Lima', certificate: 'CAL-2026-021' },
      { id: randomUUID(), code: 'INST-004', name: 'Durômetro Brinell', instrumentType: 'Dureza', location: 'Qualidade', status: 'calibrado', lastCalibration: new Date('2026-01-15'), nextCalibration: new Date('2026-07-15'), calibrationInterval: 180, responsible: 'Maria Lima', certificate: 'CAL-2026-005' },
      { id: randomUUID(), code: 'INST-005', name: 'Rugosímetro Ra/Rz', instrumentType: 'Rugosidade', location: 'Qualidade', status: 'vencido', lastCalibration: new Date('2025-10-20'), nextCalibration: new Date('2026-04-20'), calibrationInterval: 180, responsible: 'Maria Lima', certificate: 'CAL-2025-089' },
    ];
    for (const inst of instruments) {
      await prisma.qualityInstrument.create({ data: { ...inst, updatedAt: new Date() } });
    }

    // Documents
    const qDocs = [
      { id: randomUUID(), code: 'DOC-QUA-001', title: 'Política da Qualidade', documentType: 'Política', status: 'aprovado', author: 'Gerente Geral', content: { secoes: ['Objetivo', 'Escopo', 'Política'] }, signatures: [{ nome: 'Gerente Geral', data: '2026-01-15', cargo: 'Diretor' }] },
      { id: randomUUID(), code: 'DOC-QUA-002', title: 'Procedimento de Controle de Documentos', documentType: 'Procedimento', status: 'aprovado', author: 'Qualidade', content: null, signatures: [] },
      { id: randomUUID(), code: 'DOC-QUA-003', title: 'Instrução de Trabalho — Solda TIG Inox', documentType: 'IT', productCode: 'CAT-EIX-025', status: 'aprovado', author: 'João Melo', content: null, signatures: [] },
      { id: randomUUID(), code: 'DOC-QUA-004', title: 'Plano de Manutenção Preventiva 2026', documentType: 'Plano', status: 'em_revisao', author: 'Gerente Produção', content: null, signatures: [] },
      { id: randomUUID(), code: 'DOC-QUA-005', title: 'Relatório Auditoria Interna — Jan/2026', documentType: 'Relatório', status: 'aprovado', author: 'Qualidade', content: null, signatures: [] },
    ];
    for (const doc of qDocs) {
      await prisma.qualityDocument.create({ data: { ...doc, updatedAt: new Date() } });
    }

    // Databooks
    const db1Id = randomUUID();
    await prisma.qualityDatabook.create({
      data: {
        id: db1Id, code: 'DB-2026-001', title: 'Databook Flange Aço Inox 3" — PV-2026-00003',
        orderRef: 'PV-2026-00003', productCode: 'CAT-FLA-3IN', clientName: 'SiderTech S/A',
        template: 'padrão', status: 'em_elaboracao', progress: 60, updatedAt: new Date(),
        documents: {
          create: [
            { id: randomUUID(), title: 'Certificado de Material', docType: 'certificado_material', status: 'aprovado', required: true, sortOrder: 0 },
            { id: randomUUID(), title: 'Relatório Dimensional', docType: 'relatorio_dimensional', status: 'aprovado', required: true, sortOrder: 1 },
            { id: randomUUID(), title: 'Relatório LP — Solda', docType: 'ensaio_nao_destrutivo', status: 'aprovado', required: true, sortOrder: 2 },
            { id: randomUUID(), title: 'Foto do Produto', docType: 'fotografia', status: 'pendente', required: false, sortOrder: 3 },
            { id: randomUUID(), title: 'Nota Fiscal', docType: 'nota_fiscal', status: 'pendente', required: true, sortOrder: 4 },
          ],
        },
      },
    });
    const db2Id = randomUUID();
    await prisma.qualityDatabook.create({
      data: {
        id: db2Id, code: 'DB-2026-002', title: 'Databook Eixo Transmissão 25mm — PV-2026-00001',
        orderRef: 'PV-2026-00001', productCode: 'CAT-EIX-025', clientName: 'Metalúrgica ABC Ltda',
        template: 'padrão', status: 'concluido', progress: 100, updatedAt: new Date(),
        documents: {
          create: [
            { id: randomUUID(), title: 'Certificado de Material', docType: 'certificado_material', status: 'aprovado', required: true, sortOrder: 0 },
            { id: randomUUID(), title: 'Relatório Dimensional', docType: 'relatorio_dimensional', status: 'aprovado', required: true, sortOrder: 1 },
            { id: randomUUID(), title: 'Relatório de Balanceamento', docType: 'relatorio_teste', status: 'aprovado', required: true, sortOrder: 2 },
            { id: randomUUID(), title: 'Nota Fiscal', docType: 'nota_fiscal', status: 'aprovado', required: true, sortOrder: 3 },
          ],
        },
      },
    });
  }

  // ── Expedition ────────────────────────────────────────────────────────────
  if ((await prisma.expeditionOrder.count()) === 0) {
    const expOrders = [
      { id: randomUUID(), code: 'EXP-2026-001', clientName: 'Metalúrgica ABC Ltda', status: 'aguardando_separacao', scheduledAt: new Date('2026-04-30'), carrier: 'Transportadora Norte', notes: 'PV-2026-00001 — 50 eixos', items: [{ produtoCodigo: 'CAT-EIX-025', descricao: 'Eixo Transmissão 25mm', quantidade: 50, unidade: 'UN' }] },
      { id: randomUUID(), code: 'EXP-2026-002', clientName: 'SiderTech S/A', status: 'separado', scheduledAt: new Date('2026-05-02'), carrier: 'Correios — PAC', notes: 'PV-2026-00003', items: [{ produtoCodigo: 'CAT-FLA-3IN', descricao: 'Flange Aço Inox 3"', quantidade: 100, unidade: 'UN' }] },
      { id: randomUUID(), code: 'EXP-2026-003', clientName: 'TechParts Ltda', status: 'conferido', scheduledAt: new Date('2026-05-03'), carrier: 'Transportadora Sul', notes: 'PV-2026-00002', items: [{ produtoCodigo: 'CAT-ROL-6205', descricao: 'Rolamento 6205-ZZ', quantidade: 200, unidade: 'UN' }] },
      { id: randomUUID(), code: 'EXP-2026-004', clientName: 'Comércio Beta Ltda', status: 'embarcado', scheduledAt: new Date('2026-04-28'), shippedAt: new Date('2026-04-28'), carrier: 'Transportadora Centro', notes: 'PV-2025-00499', items: [{ produtoCodigo: 'CAT-BUCH-12', descricao: 'Bucha redução 12mm', quantidade: 300, unidade: 'UN' }] },
      { id: randomUUID(), code: 'EXP-2026-005', clientName: 'Ind. Barros', status: 'entregue', scheduledAt: new Date('2026-04-25'), shippedAt: new Date('2026-04-25'), carrier: 'Retirada pelo cliente', notes: 'Retirada no balcão — PV-2026-00004', items: [{ produtoCodigo: 'CAT-PAR-M10', descricao: 'Parafuso métrico M10', quantidade: 1000, unidade: 'UN' }] },
    ];
    for (const exp of expOrders) {
      await prisma.expeditionOrder.create({ data: { ...exp, updatedAt: new Date() } });
    }
  }

  // ── Account Plan (Plano de Contas) ────────────────────────────────────────
  if ((await prisma.accountPlan.count()) === 0) {
    const accounts = [
      // Ativo
      { code: '1', name: 'ATIVO', accountType: 'Ativo', level: 1, parentCode: null },
      { code: '1.1', name: 'ATIVO CIRCULANTE', accountType: 'Ativo', level: 2, parentCode: '1' },
      { code: '1.1.1', name: 'Disponível', accountType: 'Ativo', level: 3, parentCode: '1.1' },
      { code: '1.1.1.1', name: 'Caixa', accountType: 'Ativo', level: 4, parentCode: '1.1.1' },
      { code: '1.1.1.2', name: 'Banco Conta Movimento', accountType: 'Ativo', level: 4, parentCode: '1.1.1' },
      { code: '1.1.2', name: 'Créditos / Contas a Receber', accountType: 'Ativo', level: 3, parentCode: '1.1' },
      { code: '1.1.2.1', name: 'Clientes', accountType: 'Ativo', level: 4, parentCode: '1.1.2' },
      { code: '1.1.3', name: 'Estoques', accountType: 'Ativo', level: 3, parentCode: '1.1' },
      { code: '1.1.3.1', name: 'Estoque de Matéria-Prima', accountType: 'Ativo', level: 4, parentCode: '1.1.3' },
      { code: '1.1.3.2', name: 'Estoque de Produtos Acabados', accountType: 'Ativo', level: 4, parentCode: '1.1.3' },
      { code: '1.2', name: 'ATIVO NÃO CIRCULANTE', accountType: 'Ativo', level: 2, parentCode: '1' },
      { code: '1.2.1', name: 'Imobilizado', accountType: 'Ativo', level: 3, parentCode: '1.2' },
      { code: '1.2.1.1', name: 'Máquinas e Equipamentos', accountType: 'Ativo', level: 4, parentCode: '1.2.1' },
      // Passivo
      { code: '2', name: 'PASSIVO', accountType: 'Passivo', level: 1, parentCode: null },
      { code: '2.1', name: 'PASSIVO CIRCULANTE', accountType: 'Passivo', level: 2, parentCode: '2' },
      { code: '2.1.1', name: 'Fornecedores', accountType: 'Passivo', level: 3, parentCode: '2.1' },
      { code: '2.1.1.1', name: 'Contas a Pagar — Fornecedores', accountType: 'Passivo', level: 4, parentCode: '2.1.1' },
      { code: '2.1.2', name: 'Obrigações Trabalhistas', accountType: 'Passivo', level: 3, parentCode: '2.1' },
      { code: '2.1.2.1', name: 'Salários a Pagar', accountType: 'Passivo', level: 4, parentCode: '2.1.2' },
      { code: '2.1.3', name: 'Obrigações Fiscais', accountType: 'Passivo', level: 3, parentCode: '2.1' },
      { code: '2.1.3.1', name: 'ICMS a Recolher', accountType: 'Passivo', level: 4, parentCode: '2.1.3' },
      { code: '2.1.3.2', name: 'PIS/COFINS a Recolher', accountType: 'Passivo', level: 4, parentCode: '2.1.3' },
      // Patrimônio Líquido
      { code: '3', name: 'PATRIMÔNIO LÍQUIDO', accountType: 'PatrimonioLiquido', level: 1, parentCode: null },
      { code: '3.1', name: 'Capital Social', accountType: 'PatrimonioLiquido', level: 2, parentCode: '3' },
      { code: '3.1.1', name: 'Capital Integralizado', accountType: 'PatrimonioLiquido', level: 3, parentCode: '3.1' },
      { code: '3.2', name: 'Reservas e Lucros', accountType: 'PatrimonioLiquido', level: 2, parentCode: '3' },
      { code: '3.2.1', name: 'Lucros Acumulados', accountType: 'PatrimonioLiquido', level: 3, parentCode: '3.2' },
      // Receita
      { code: '4', name: 'RECEITA', accountType: 'Receita', level: 1, parentCode: null },
      { code: '4.1', name: 'Receita Operacional Bruta', accountType: 'Receita', level: 2, parentCode: '4' },
      { code: '4.1.1', name: 'Venda de Produtos Industriais', accountType: 'Receita', level: 3, parentCode: '4.1' },
      { code: '4.1.2', name: 'Prestação de Serviços', accountType: 'Receita', level: 3, parentCode: '4.1' },
      { code: '4.2', name: 'Deduções de Receita', accountType: 'Receita', level: 2, parentCode: '4' },
      { code: '4.2.1', name: 'Devoluções de Vendas', accountType: 'Receita', level: 3, parentCode: '4.2' },
      { code: '4.2.2', name: 'Impostos sobre Vendas', accountType: 'Receita', level: 3, parentCode: '4.2' },
      // Despesa / Custo
      { code: '5', name: 'CUSTOS E DESPESAS', accountType: 'Despesa', level: 1, parentCode: null },
      { code: '5.1', name: 'Custo dos Produtos Vendidos (CPV)', accountType: 'Despesa', level: 2, parentCode: '5' },
      { code: '5.1.1', name: 'Matéria-Prima Consumida', accountType: 'Despesa', level: 3, parentCode: '5.1' },
      { code: '5.1.2', name: 'Mão de Obra Direta', accountType: 'Despesa', level: 3, parentCode: '5.1' },
      { code: '5.1.3', name: 'Custos Indiretos de Fabricação', accountType: 'Despesa', level: 3, parentCode: '5.1' },
      { code: '5.2', name: 'Despesas Operacionais', accountType: 'Despesa', level: 2, parentCode: '5' },
      { code: '5.2.1', name: 'Despesas com Pessoal (Admin)', accountType: 'Despesa', level: 3, parentCode: '5.2' },
      { code: '5.2.2', name: 'Despesas Administrativas', accountType: 'Despesa', level: 3, parentCode: '5.2' },
      { code: '5.2.3', name: 'Despesas Financeiras', accountType: 'Despesa', level: 3, parentCode: '5.2' },
    ];
    for (const acc of accounts) {
      await prisma.accountPlan.create({ data: { id: randomUUID(), ...acc, active: true, updatedAt: new Date() } });
    }
  }

   // ── Account Entries (lançamentos contábeis) ───────────────────────────────
   if ((await prisma.accountEntry.count()) === 0) {
     const defaultCompany = await prisma.company.findFirst();
     const entries = [
       // Vendas — reconhecimento de receita
       { entryDate: new Date('2026-04-01'), description: 'Venda produtos — NF 1240', debitAccount: '1.1.2.1', creditAccount: '4.1.1', amount: new Prisma.Decimal(3100), origin: 'VENDAS', module: 'vendas', referenceId: 'NF-1240' },
       { entryDate: new Date('2026-04-03'), description: 'Venda produtos — NF 1241', debitAccount: '1.1.2.1', creditAccount: '4.1.1', amount: new Prisma.Decimal(945), origin: 'VENDAS', module: 'vendas', referenceId: 'NF-1241' },
       { entryDate: new Date('2026-04-05'), description: 'Venda produtos — NF 1242', debitAccount: '1.1.2.1', creditAccount: '4.1.1', amount: new Prisma.Decimal(8200), origin: 'VENDAS', module: 'vendas', referenceId: 'NF-1242' },
       { entryDate: new Date('2026-04-18'), description: 'Venda produtos — NF 1247', debitAccount: '1.1.2.1', creditAccount: '4.1.1', amount: new Prisma.Decimal(12750), origin: 'VENDAS', module: 'vendas', referenceId: 'NF-1247' },
       // Recebimentos
       { entryDate: new Date('2026-04-05'), description: 'Recebimento NF 1241 — TechParts', debitAccount: '1.1.1.2', creditAccount: '1.1.2.1', amount: new Prisma.Decimal(945), origin: 'FINANCEIRO', module: 'financeiro', referenceId: 'NF-1241' },
       // Compras e estoques
       { entryDate: new Date('2026-04-02'), description: 'Compra rolamentos — OC-2026-00001', debitAccount: '1.1.3.1', creditAccount: '2.1.1.1', amount: new Prisma.Decimal(4100), origin: 'COMPRAS', module: 'compras', referenceId: 'OC-2026-00001' },
       { entryDate: new Date('2026-04-10'), description: 'Compra chapas aço — OC-2026-00002', debitAccount: '1.1.3.1', creditAccount: '2.1.1.1', amount: new Prisma.Decimal(8200), origin: 'COMPRAS', module: 'compras', referenceId: 'OC-2026-00002' },
       // Custos de produção
       { entryDate: new Date('2026-04-17'), description: 'Consumo matéria-prima — OP-PRD-00001', debitAccount: '5.1.1', creditAccount: '1.1.3.1', amount: new Prisma.Decimal(3700), origin: 'PRODUCAO', module: 'producao', referenceId: 'OP-PRD-00001' },
       { entryDate: new Date('2026-04-17'), description: 'MOD apurada — OP-PRD-00001', debitAccount: '5.1.2', creditAccount: '2.1.2.1', amount: new Prisma.Decimal(960), origin: 'PRODUCAO', module: 'producao', referenceId: 'OP-PRD-00001' },
       { entryDate: new Date('2026-04-18'), description: 'CIF alocado — OP-PRD-00001', debitAccount: '5.1.3', creditAccount: '2.1.2.1', amount: new Prisma.Decimal(480), origin: 'PRODUCAO', module: 'producao', referenceId: 'OP-PRD-00001' },
       // Despesas
       { entryDate: new Date('2026-04-01'), description: 'Aluguel fábrica — Abril/2026', debitAccount: '5.2.2', creditAccount: '2.1.1.1', amount: new Prisma.Decimal(8500), origin: 'FINANCEIRO', module: 'financeiro', referenceId: 'REC-0412' },
       { entryDate: new Date('2026-04-15'), description: 'Energia elétrica — Abril/2026', debitAccount: '5.2.2', creditAccount: '2.1.3.1', amount: new Prisma.Decimal(3840), origin: 'FINANCEIRO', module: 'financeiro', referenceId: 'FAT-EL-04' },
       { entryDate: new Date('2026-04-30'), description: 'Salários — Abril/2026', debitAccount: '5.2.1', creditAccount: '2.1.2.1', amount: new Prisma.Decimal(27540), origin: 'RH', module: 'rh', referenceId: 'FP-2026-04' },
       { entryDate: new Date('2026-04-30'), description: 'INSS patronal — Abril/2026', debitAccount: '5.2.1', creditAccount: '2.1.3.2', amount: new Prisma.Decimal(5508), origin: 'RH', module: 'rh', referenceId: 'GPS-04/26' },
       { entryDate: new Date('2026-04-30'), description: 'FGTS — Abril/2026', debitAccount: '5.2.1', creditAccount: '2.1.3.2', amount: new Prisma.Decimal(2203), origin: 'RH', module: 'rh', referenceId: 'GRF-04/26' },
       // Impostos sobre vendas
       { entryDate: new Date('2026-04-18'), description: 'ICMS sobre vendas — NF 1247', debitAccount: '4.2.2', creditAccount: '2.1.3.1', amount: new Prisma.Decimal(1530), origin: 'FISCAL', module: 'fiscal', referenceId: 'NF-1247' },
       { entryDate: new Date('2026-04-18'), description: 'PIS/COFINS — NF 1247', debitAccount: '4.2.2', creditAccount: '2.1.3.2', amount: new Prisma.Decimal(510), origin: 'FISCAL', module: 'fiscal', referenceId: 'NF-1247' },
       // Pagamentos
       { entryDate: new Date('2026-04-10'), description: 'Pagamento aluguel', debitAccount: '2.1.1.1', creditAccount: '1.1.1.2', amount: new Prisma.Decimal(8500), origin: 'FINANCEIRO', module: 'financeiro', referenceId: 'REC-0412' },
       { entryDate: new Date('2026-04-20'), description: 'Pagamento energia elétrica', debitAccount: '2.1.3.1', creditAccount: '1.1.1.2', amount: new Prisma.Decimal(3840), origin: 'FINANCEIRO', module: 'financeiro', referenceId: 'FAT-EL-04' },
     ];
     for (const e of entries) {
       await prisma.accountEntry.create({ data: { id: randomUUID(), ...e, companyId: defaultCompany?.id, history: e.description } });
     }
   }

  // ── Product Standard Costs ────────────────────────────────────────────────
  if ((await prisma.productStandardCost.count()) === 0 && (await prisma.product.count()) > 0) {
    const products = await prisma.product.findMany({ orderBy: { code: 'asc' } });
    const costMap: Record<string, { mat: number; labor: number; overhead: number }> = {
      'CAT-EIX-025':    { mat: 95,  labor: 52,  overhead: 38 },
      'CAT-ROL-6205':   { mat: 6.2, labor: 0.5, overhead: 1.5 },
      'CAT-CHA-003':    { mat: 280, labor: 10,  overhead: 30 },
      'CAT-PAR-M10':    { mat: 0.3, labor: 0.05, overhead: 0.1 },
      'CAT-FLA-3IN':    { mat: 28,  labor: 8,   overhead: 6 },
      'CAT-BUCH-12':    { mat: 2.1, labor: 0.5, overhead: 0.5 },
      'CAT-POR-M12':    { mat: 0.2, labor: 0.04, overhead: 0.08 },
      'CAT-ARR-10':     { mat: 0.05, labor: 0.01, overhead: 0.02 },
      'CAT-GUI-LINEAR': { mat: 140, labor: 30,  overhead: 40 },
      'CAT-MOTOR-05':   { mat: 610, labor: 120, overhead: 160 },
    };
    for (const p of products) {
      const c = costMap[p.code] ?? { mat: Number(p.costPrice) * 0.6, labor: Number(p.costPrice) * 0.25, overhead: Number(p.costPrice) * 0.15 };
      const total = c.mat + c.labor + c.overhead;
      const saleP = Number(p.salePrice ?? 0);
      const margin = saleP > 0 ? ((saleP - total) / saleP) * 100 : null;
      await prisma.productStandardCost.create({
        data: {
          id: randomUUID(), productId: p.id,
          materialCost: new Prisma.Decimal(c.mat),
          laborCost: new Prisma.Decimal(c.labor),
          overheadCost: new Prisma.Decimal(c.overhead),
          totalCost: new Prisma.Decimal(total),
          salePrice: saleP > 0 ? new Prisma.Decimal(saleP) : null,
          marginPct: margin !== null ? new Prisma.Decimal(margin.toFixed(2)) : null,
        },
      });
    }
  }

  // ── HR Time Entries + Leave Requests (via Prisma HrLeaveRequest if exists, else entity) ──
  const leaveEnt = await prisma.entity.findUnique({ where: { code: 'rh_ferias' } });
  const pontosEnt = await prisma.entity.findUnique({ where: { code: 'rh_ponto' } });
  // Adicionar mais registros de ponto se poucos
  if (pontosEnt) {
    const pontoCount = await prisma.entityRecord.count({ where: { entityId: pontosEnt.id, deletedAt: null } });
    if (pontoCount < 10) {
      const extraPontos = [
        { nome:'Carlos Santos', matricula:'MAT-004', data:'2026-04-21', entrada:'08:00', saida_almoco:'12:00', retorno:'13:00', saida:'17:15', horas:'8:15', status:'Normal' },
        { nome:'Ana Paula', matricula:'MAT-005', data:'2026-04-21', entrada:'08:10', saida_almoco:'12:00', retorno:'13:00', saida:'17:00', horas:'7:50', status:'Atraso' },
        { nome:'Rafael Costa', matricula:'MAT-006', data:'2026-04-21', entrada:'08:00', saida_almoco:'12:00', retorno:'13:05', saida:'18:00', horas:'8:55', status:'Hora Extra' },
        { nome:'João Melo', matricula:'MAT-001', data:'2026-04-19', entrada:'08:00', saida_almoco:'12:00', retorno:'13:00', saida:'17:00', horas:'8:00', status:'Normal' },
        { nome:'Pedro Alves', matricula:'MAT-002', data:'2026-04-19', entrada:'08:00', saida_almoco:'12:00', retorno:'13:00', saida:'17:00', horas:'8:00', status:'Normal' },
        { nome:'Maria Lima', matricula:'MAT-003', data:'2026-04-19', entrada:'08:00', saida_almoco:'12:00', retorno:'13:00', saida:'17:00', horas:'8:00', status:'Normal' },
      ];
      for (const p of extraPontos) {
        await prisma.entityRecord.create({ data: { entityId: pontosEnt.id, data: p, createdBy: master.id, updatedBy: master.id } });
      }
    }
  }

  // ── No-code: exemplo de campo dinâmico em Lead (opcional; visível no Form Builder / CRM Leads) ──
  try {
    await prisma.ncMetaField.upsert({
      where: {
        entityCode_fieldCode: { entityCode: 'crm_lead', fieldCode: 'nc_demo_segmento' },
      },
      create: {
        id: randomUUID(),
        entityCode: 'crm_lead',
        fieldCode: 'nc_demo_segmento',
        label: 'Segmento (demo no-code)',
        dataType: 'select',
        sortOrder: 0,
        required: false,
        active: true,
        options: {
          choices: [
            { value: 'foodservice', label: 'Foodservice' },
            { value: 'industria', label: 'Indústria' },
            { value: 'varejo', label: 'Varejo' },
          ],
        },
      },
      update: {
        label: 'Segmento (demo no-code)',
        dataType: 'select',
        active: true,
        options: {
          choices: [
            { value: 'foodservice', label: 'Foodservice' },
            { value: 'industria', label: 'Indústria' },
            { value: 'varejo', label: 'Varejo' },
          ],
        },
      },
    });
  } catch {
    // tabela pode ainda não existir se migração não foi aplicada
  }

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

