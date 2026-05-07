/**
 * seed-all-modules.ts — Popula TODOS os módulos do menu ERP COZINCA
 * Executa: npx tsx prisma/seed-all-modules.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const uuid = () => crypto.randomUUID();
const daysAgo = (n: number) => new Date(Date.now() - n * 864e5);
const daysFrom = (n: number) => new Date(Date.now() + n * 864e5);
const dateOnly = (d: Date) => { const r = new Date(d); r.setHours(0,0,0,0); return r; };

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function firstProduct() {
  return (await prisma.product.findFirst({ orderBy: { code: 'asc' } }))!;
}
async function allProducts() {
  return prisma.product.findMany({ orderBy: { code: 'asc' } });
}
async function allEmployees() {
  return prisma.employee.findMany({ orderBy: { code: 'asc' } });
}
async function allWorkOrders() {
  return prisma.workOrder.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
}

// ── Upsert por código único ───────────────────────────────────────────────────
async function upsertEntity(code: string) {
  return prisma.entity.upsert({
    where: { code },
    update: {},
    create: {
      id: uuid(), code, name: code,
      config: { is_system: true, showInMenu: false, fields: [] },
    },
  });
}

async function addRecord(entityCode: string, data: Record<string, unknown>) {
  const ent = await upsertEntity(entityCode);
  return prisma.entityRecord.create({
    data: { id: uuid(), entityId: ent.id, data: data as any },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Populando todos os módulos…\n');

  // ── 1. LOCALIZATIONS / ENDEREÇAMENTO ─────────────────────────────────────
  console.log('  📦 Endereçamento (locations)…');
  const locationDefs = [
    { code: 'ALM-A01-R1-P1', name: 'Almoxarifado A01 – Rua 1 – Prateleira 1', warehouse: 'Almoxarifado Principal', aisle: 'A01', rack: 'R1', bin: 'P1' },
    { code: 'ALM-A01-R1-P2', name: 'Almoxarifado A01 – Rua 1 – Prateleira 2', warehouse: 'Almoxarifado Principal', aisle: 'A01', rack: 'R1', bin: 'P2' },
    { code: 'ALM-A01-R2-P1', name: 'Almoxarifado A01 – Rua 2 – Prateleira 1', warehouse: 'Almoxarifado Principal', aisle: 'A01', rack: 'R2', bin: 'P1' },
    { code: 'ALM-B01-R1-P1', name: 'Almoxarifado B01 – Rua 1 – Prateleira 1', warehouse: 'Almoxarifado Secundário', aisle: 'B01', rack: 'R1', bin: 'P1' },
    { code: 'EXPEDICAO-01',   name: 'Área de Expedição 01',                    warehouse: 'Expedição', aisle: 'EXP', rack: 'R1', bin: 'P1' },
    { code: 'PRODUCAO-01',    name: 'Chão de Fábrica – Setor Corte',           warehouse: 'Produção', aisle: 'PRD', rack: 'R1', bin: 'P1' },
    { code: 'PRODUCAO-02',    name: 'Chão de Fábrica – Setor Solda',           warehouse: 'Produção', aisle: 'PRD', rack: 'R2', bin: 'P1' },
    { code: 'INSPECAO-01',    name: 'Área de Inspeção de Qualidade',           warehouse: 'Qualidade', aisle: 'QAL', rack: 'R1', bin: 'P1' },
  ];
  const locs: Record<string, string> = {};
  for (const l of locationDefs) {
    const loc = await prisma.location.upsert({
      where: { code: l.code }, update: {},
      create: { id: uuid(), ...l },
    });
    locs[l.code] = loc.id;
  }

  // Link some products to locations
  const products = await allProducts();
  for (let i = 0; i < Math.min(products.length, 6); i++) {
    const locCode = locationDefs[i % locationDefs.length].code;
    await prisma.productLocation.upsert({
      where: { productId_locationId: { productId: products[i].id, locationId: locs[locCode] } },
      update: { quantity: 50 + i * 10 },
      create: { id: uuid(), productId: products[i].id, locationId: locs[locCode], quantity: 50 + i * 10 },
    });
  }

  // ── 2. PRODUCTION APPOINTMENTS / APONTAMENTO ─────────────────────────────
  console.log('  🏭 Apontamentos de produção…');
  const wos = await allWorkOrders();
  const machines = await prisma.machine.findMany();
  const routingStages = await prisma.routingStage.findMany({ take: 10 });
  for (let i = 0; i < Math.min(wos.length, 8); i++) {
    const wo = wos[i];
    const machine = machines[i % Math.max(machines.length, 1)];
    const stage = routingStages[i % Math.max(routingStages.length, 1)];
    const start = daysAgo(10 - i);
    const end = new Date(start.getTime() + 4 * 3600000);
    const statuses = ['DONE','DONE','IN_PROGRESS','SCHEDULED','DONE','DONE','SCHEDULED','IN_PROGRESS'];
    await prisma.productionAppointment.create({
      data: {
        id: uuid(),
        workOrderId: wo.id,
        machineId: machine?.id,
        routingStageId: stage?.id,
        scheduledStart: start,
        scheduledEnd: end,
        actualStart: statuses[i] !== 'SCHEDULED' ? start : null,
        actualEnd: statuses[i] === 'DONE' ? end : null,
        status: statuses[i],
        notes: `Apontamento ${i + 1} – OP ${wo.number}`,
      },
    });
  }

  // ── 3. WORK ORDER STATUS HISTORY ─────────────────────────────────────────
  console.log('  📋 Histórico de status das OPs…');
  const gerenteUser = await prisma.user.findFirst({ where: { email: 'gerente@cozinha.com' } });
  const flows = [
    ['DRAFT','RELEASED'], ['RELEASED','IN_PROGRESS'], ['IN_PROGRESS','DONE'],
  ];
  for (let i = 0; i < Math.min(wos.length, 5); i++) {
    const wo = wos[i];
    for (const [from, to] of flows) {
      await prisma.workOrderStatusHistory.create({
        data: {
          id: uuid(), workOrderId: wo.id,
          fromStatus: from, toStatus: to,
          userId: gerenteUser?.id,
          note: `Transição ${from} → ${to}`,
          createdAt: daysAgo(15 - i * 2),
        },
      });
    }
  }

  // ── 4. BOM LINES (Lista de Materiais) ─────────────────────────────────────
  console.log('  🔩 Bill of Materials (BOM)…');
  // Busca entity records com linkedCoreProduct ou entity "produto"
  const prodEntity = await prisma.entity.findUnique({ where: { code: 'produto' } });
  let bomParentRecords = prodEntity
    ? await prisma.entityRecord.findMany({ where: { entityId: prodEntity.id }, take: 5 })
    : [];
  
  // Fallback: usa qualquer produto com entityRecordId
  if (bomParentRecords.length === 0) {
    const prodsWithER = await prisma.product.findMany({ where: { entityRecordId: { not: null } }, take: 5 });
    bomParentRecords = await prisma.entityRecord.findMany({
      where: { id: { in: prodsWithER.map(p => p.entityRecordId!).filter(Boolean) } },
    });
  }
  
  const bomTemplates = [
    [
      { componentCode: 'MP-CHA304-2MM', description: 'Chapa inox AISI 304 – 2mm',       process: 'ALMOXARIFADO', xMm: 1500, yMm: 1000, thicknessMm: 2.0, weightKg: 23.6, quantity: 2 },
      { componentCode: 'MP-CHA304-3MM', description: 'Chapa inox AISI 304 – 3mm',       process: 'LASER',        xMm: 1200, yMm: 600,  thicknessMm: 3.0, weightKg: 21.5, quantity: 1 },
      { componentCode: 'CM-PAR-M8X20',  description: 'Parafuso M8x20mm inox',           process: 'ALMOXARIFADO', quantity: 12 },
      { componentCode: 'SVC-SOLDA-TIG', description: 'Soldagem TIG – cordão contínuo',  process: 'SOLDADO',      quantity: 1 },
      { componentCode: 'SVC-DECAP',     description: 'Decapagem e passivação',           process: 'PINTURA',      quantity: 1 },
    ],
    [
      { componentCode: 'MP-TUB316-1P5', description: 'Tubo inox AISI 316L – 1.5"',      process: 'ALMOXARIFADO', weightKg: 3.2, quantity: 4 },
      { componentCode: 'CM-FLANGEDN50', description: 'Flange DIN DN50 inox',            process: 'ALMOXARIFADO', quantity: 2 },
      { componentCode: 'CM-JUNTA-VITON',description: 'Junta VITON – grau alimentício',  process: 'ALMOXARIFADO', quantity: 4 },
      { componentCode: 'SVC-SOLDA-TIG', description: 'Soldagem TIG orbital',            process: 'SOLDADO',      quantity: 1 },
      { componentCode: 'SVC-POLIMENT',  description: 'Polimento eletrolítico Ra<0.5µm', process: 'PINTURA',      quantity: 1 },
    ],
    [
      { componentCode: 'MP-CHA316-4MM', description: 'Chapa inox AISI 316 – 4mm',       process: 'LASER',        xMm: 2000, yMm: 1000, thicknessMm: 4.0, weightKg: 63.0, quantity: 3 },
      { componentCode: 'CM-PORCA-M10',  description: 'Porca M10 inox A2',               process: 'ALMOXARIFADO', quantity: 24 },
      { componentCode: 'SVC-DOBRA',     description: 'Dobramento CNC – 90°',            process: 'DOBRA',        quantity: 1 },
      { componentCode: 'SVC-SOLDA-MIG', description: 'Soldagem MIG/MAG estrutural',     process: 'SOLDADO',      quantity: 1 },
      { componentCode: 'SVC-PINTURA',   description: 'Pintura epoxi industrial',        process: 'PINTURA',      quantity: 1 },
    ],
  ];

  for (let i = 0; i < bomParentRecords.length; i++) {
    const rec = bomParentRecords[i];
    const existingLines = await prisma.billOfMaterialLine.count({ where: { productRecordId: rec.id } });
    if (existingLines > 0) continue;
    const template = bomTemplates[i % bomTemplates.length];
    for (let j = 0; j < template.length; j++) {
      await prisma.billOfMaterialLine.create({
        data: { id: uuid(), productRecordId: rec.id, lineOrder: j + 1, ...template[j] },
      });
    }
  }
  
  // Se não houver EntityRecords de produto, adiciona ao summary count via entity records genéricos
  const bomFinal = await prisma.billOfMaterialLine.count();
  console.log(`    → ${bomFinal} linhas BOM criadas`);
  
  // Cria entity records de produto acabado para mostrar na tela de Engenharia / BOM
  const prodEntForBom = await upsertEntity('produto');
  const bomProdDefs = [
    { codigo: 'PA-TAN-5000L', descricao: 'Tanque de Armazenamento Inox 5000L', tipo: 'Produto Acabado', bom_status: 'COMPLETE' },
    { codigo: 'PA-COL-250L',  descricao: 'Coluna de Destilação 250L',          tipo: 'Produto Acabado', bom_status: 'COMPLETE' },
    { codigo: 'PA-MIS-200L',  descricao: 'Misturador Industrial 200L',         tipo: 'Produto Acabado', bom_status: 'PARTIAL' },
    { codigo: 'PA-REA-10000', descricao: 'Reator Industrial 10.000L',          tipo: 'Produto Acabado', bom_status: 'EMPTY' },
    { codigo: 'PA-TUB-LINHA', descricao: 'Conjunto Tubulação Industrial DN50', tipo: 'Produto Acabado', bom_status: 'PARTIAL' },
  ];
  for (const bp of bomProdDefs) {
    const existingEr = await prisma.entityRecord.findFirst({
      where: { entityId: prodEntForBom.id, data: { path: ['codigo'], equals: bp.codigo } },
    });
    if (existingEr) continue;
    const er = await prisma.entityRecord.create({
      data: { id: uuid(), entityId: prodEntForBom.id, data: { ...bp, unidade: 'UN', preco_venda: 0, estoque_atual: 0 } },
    });
    // Cria ProductIndustrialMeta
    await prisma.productIndustrialMeta.create({
      data: { entityRecordId: er.id, bomStatus: bp.bom_status },
    });
    // Cria linhas BOM para os produtos com BOM_STATUS !== EMPTY
    if (bp.bom_status !== 'EMPTY') {
      const template = bomTemplates[bomProdDefs.indexOf(bp) % bomTemplates.length];
      for (let j = 0; j < template.length; j++) {
        await prisma.billOfMaterialLine.create({
          data: { id: uuid(), productRecordId: er.id, lineOrder: j + 1, ...template[j] },
        });
      }
    }
  }

  // ── 5. CRM LEADS / OPORTUNIDADES / ATIVIDADES (GESTÃO CRM) ───────────────
  console.log('  👥 CRM Gestão (leads, oportunidades, atividades)…');
  
  // Obtém as entities para CRM
  const leadEnt = await prisma.entity.findUnique({ where: { code: 'crm_lead' } });
  const oppEnt = await prisma.entity.findUnique({ where: { code: 'crm_oportunidade' } });
  
  if (!leadEnt || !oppEnt) {
    console.warn('  ⚠️ Entidades CRM não encontradas — pulando seed de dados CRM');
  } else {
    // Mapeia stages antigos para canônicos
    const stageMap: Record<string, string> = {
      'Prospecção': 'Novo',
      'Qualificação': 'Qualificado',
      'Proposta': 'Proposta enviada',
      'Negociação': 'Negociação',
      'Fechamento': 'Negociação',
      'Em Andamento': 'Em orçamento',
    };
    
    const crmLeads = [
      { type: 'lead', title: 'Lead – Petrobras Distribuidora', clientName: 'Petrobras Distribuidora S.A.', stage: 'Prospecção', value: 85000, probability: 15, priority: 'Alta', origin: 'Indicação' },
      { type: 'lead', title: 'Lead – JBS Alimentos', clientName: 'JBS S.A.', stage: 'Qualificação', value: 42000, probability: 25, priority: 'Normal', origin: 'Site' },
      { type: 'lead', title: 'Lead – Braskem SP', clientName: 'Braskem S.A.', stage: 'Prospecção', value: 120000, probability: 10, priority: 'Alta', origin: 'Feira' },
      { type: 'lead', title: 'Lead – Embraer Componentes', clientName: 'Embraer S.A.', stage: 'Qualificação', value: 320000, probability: 35, priority: 'Urgente', origin: 'Contato Direto' },
      { type: 'lead', title: 'Lead – Vale Logística', clientName: 'Vale S.A.', stage: 'Prospecção', value: 55000, probability: 20, priority: 'Normal', origin: 'LinkedIn' },
    ];
    const crmOpps = [
      { type: 'oportunidade', title: 'Oportunidade – Linha de tanques cervejeiros', clientName: 'Cervejaria Horizonte Ltda', stage: 'Proposta', value: 186000, probability: 60, priority: 'Alta', origin: 'Cliente Ativo' },
      { type: 'oportunidade', title: 'Oportunidade – Tubulações industriais GLP', clientName: 'Cosan Distribuidora', stage: 'Negociação', value: 245000, probability: 75, priority: 'Urgente', origin: 'Indicação' },
      { type: 'oportunidade', title: 'Oportunidade – Estrutura metálica cobertura', clientName: 'Construtora Andrade Silva', stage: 'Proposta', value: 98000, probability: 50, priority: 'Normal', origin: 'Licitação' },
      { type: 'oportunidade', title: 'Oportunidade – Rack inox farmacêutico', clientName: 'EMS Pharma', stage: 'Negociação', value: 67000, probability: 80, priority: 'Alta', origin: 'CRM' },
      { type: 'oportunidade', title: 'Oportunidade – Reator industrial 10000L', clientName: 'Química Nova S/A', stage: 'Fechamento', value: 410000, probability: 90, priority: 'Urgente', origin: 'Cliente Ativo' },
    ];
    
    // Cria leads como EntityRecords
    for (const lead of crmLeads) {
      const canonicalStage = stageMap[lead.stage] || lead.stage;
      await prisma.entityRecord.create({
        data: {
          id: uuid(),
          entityId: leadEnt.id,
          data: {
            title: lead.title,
            clientName: lead.clientName,
            estagio: canonicalStage,
            stage: canonicalStage,
            value: lead.value,
            probability: lead.probability,
            priority: lead.priority,
            origin: lead.origin,
          },
        },
      });
    }
    
    // Cria oportunidades como EntityRecords
    for (const opp of crmOpps) {
      const canonicalStage = stageMap[opp.stage] || opp.stage;
      await prisma.entityRecord.create({
        data: {
          id: uuid(),
          entityId: oppEnt.id,
          data: {
            title: opp.title,
            clientName: opp.clientName,
            estagio: canonicalStage,
            stage: canonicalStage,
            value: opp.value,
            probability: opp.probability,
            priority: opp.priority,
            origin: opp.origin,
          },
        },
      });
    }
  }

  // ── 6. PROJETOS ────────────────────────────────────────────────────────────
  console.log('  📐 Projetos…');
  const projectDefs = [
    { code: 'PRJ-2026-001', name: 'Planta de processamento inox – Petroquímica Sul', clientName: 'Petroquímica Sul S/A', status: 'em_andamento', progress: 65, revenue: 245000, budgetedCost: 180000, responsible: 'Ana Lima' },
    { code: 'PRJ-2026-002', name: 'Linha de envase cervejeiro – Cervejaria Horizonte', clientName: 'Cervejaria Horizonte Ltda', status: 'em_andamento', progress: 40, revenue: 186000, budgetedCost: 140000, responsible: 'Carlos Mendes' },
    { code: 'PRJ-2026-003', name: 'Reator industrial 10.000L – Química Nova', clientName: 'Química Nova S/A', status: 'planejamento', progress: 10, revenue: 410000, budgetedCost: 320000, responsible: 'Ana Lima' },
    { code: 'PRJ-2026-004', name: 'Estrutura modular laticínio', clientName: 'Laticínios Minas Gerais', status: 'concluido', progress: 100, revenue: 98000, budgetedCost: 72000, responsible: 'João Silva' },
    { code: 'PRJ-2026-005', name: 'Tubulação industrial – Frigorífico Central', clientName: 'Frigorífico Central Brasil', status: 'em_andamento', progress: 80, revenue: 155000, budgetedCost: 118000, responsible: 'Carlos Mendes' },
    { code: 'PRJ-ENG-001',  name: 'Engenharia – BOM Tanque 5000L', clientName: 'Petroquímica Sul S/A', status: 'em_andamento', progress: 55, revenue: 15000, budgetedCost: 8000, responsible: 'Ana Lima' },
    { code: 'PRJ-ENG-002',  name: 'Engenharia – Roteiro Eixo 32mm', clientName: 'Metalúrgica São Paulo Ltda', status: 'concluido', progress: 100, revenue: 6500, budgetedCost: 4000, responsible: 'João Silva' },
  ];
  for (const p of projectDefs) {
    const existing = await prisma.project.findUnique({ where: { code: p.code } });
    if (existing) continue;
    const proj = await prisma.project.create({
      data: {
        id: uuid(), ...p,
        startDate: daysAgo(90), dueDate: daysFrom(60),
        description: `Projeto industrial para ${p.clientName}. Inclui engenharia, fabricação e comissionamento.`,
        team: ['Ana Lima', 'Carlos Mendes', 'João Silva'],
      },
    });
    // Tasks
    const tasks = [
      { name: 'Levantamento de requisitos', durationDays: 5, startOffset: 0, progress: 100, level: 1 },
      { name: 'Projeto executivo', durationDays: 15, startOffset: 5, progress: p.progress > 50 ? 100 : 60, level: 1 },
      { name: 'Fabricação – Fase 1', durationDays: 20, startOffset: 20, progress: p.progress > 70 ? 100 : p.progress, level: 1 },
      { name: 'Fabricação – Fase 2', durationDays: 20, startOffset: 40, progress: p.progress > 90 ? 100 : 0, level: 1 },
      { name: 'Testes e inspeção', durationDays: 7, startOffset: 60, progress: p.status === 'concluido' ? 100 : 0, level: 1 },
      { name: 'Entrega e comissionamento', durationDays: 5, startOffset: 67, progress: p.status === 'concluido' ? 100 : 0, level: 1 },
    ];
    for (let i = 0; i < tasks.length; i++) {
      await prisma.projectTask.create({
        data: { id: uuid(), projectId: proj.id, ...tasks[i], hoursPlanned: tasks[i].durationDays * 8, sortOrder: i + 1 },
      });
    }
    // Time entries
    for (let d = 10; d >= 1; d--) {
      await prisma.projectTimeEntry.create({
        data: { id: uuid(), projectId: proj.id, personName: p.responsible, workDate: dateOnly(daysAgo(d)), hours: 8 },
      });
    }
    // Cost entries
    const costs = [
      { description: 'Matéria-prima – chapa inox 304', category: 'Material', amount: p.budgetedCost * 0.45 },
      { description: 'Mão de obra direta', category: 'MO Direta', amount: p.budgetedCost * 0.30 },
      { description: 'Terceirização – soldagem especial', category: 'Terceiros', amount: p.budgetedCost * 0.10 },
      { description: 'Frete e logística', category: 'Logística', amount: p.budgetedCost * 0.05 },
    ];
    for (const c of costs) {
      await prisma.projectCostEntry.create({
        data: { id: uuid(), projectId: proj.id, entryDate: dateOnly(daysAgo(20)), ...c },
      });
    }
    await prisma.projectNote.create({
      data: { id: uuid(), projectId: proj.id, userName: p.responsible, noteType: 'nota', content: `Andamento do projeto conforme cronograma. Próximo marco em ${daysFrom(14).toLocaleDateString('pt-BR')}.` },
    });
  }

  // ── 7. KNOWLEDGE BASE ─────────────────────────────────────────────────────
  console.log('  📚 Base de Conhecimento…');
  const kbCats = [
    { name: 'Vendas e Faturamento', icon: '🛒', color: '#0066cc', description: 'Processos de vendas, pedidos e faturamento' },
    { name: 'Produção Industrial', icon: '🏭', color: '#16a34a', description: 'OPs, roteiros, Kanban e chão de fábrica' },
    { name: 'Estoque e Almoxarifado', icon: '📦', color: '#d97706', description: 'Produtos, movimentações e inventário' },
    { name: 'Financeiro e Contábil', icon: '💰', color: '#dc2626', description: 'Contas, DRE e contabilidade' },
    { name: 'Qualidade (ISO 9001)', icon: '✅', color: '#7c3aed', description: 'Inspeções, NCs e documentos' },
    { name: 'RH e Folha', icon: '👥', color: '#0891b2', description: 'Funcionários, ponto e folha de pagamento' },
    { name: 'Compras e Fornecedores', icon: '🚚', color: '#6b7280', description: 'OCs, cotações e recebimentos' },
    { name: 'Como Funciona o ERP', icon: '⚙️', color: '#374151', description: 'Guias e tutoriais do sistema' },
  ];
  const catIds: Record<string, string> = {};
  for (const cat of kbCats) {
    const existing = await prisma.knowledgeCategory.findFirst({ where: { name: cat.name } });
    if (existing) { catIds[cat.name] = existing.id; continue; }
    const c = await prisma.knowledgeCategory.create({
      data: { id: uuid(), ...cat, sortOrder: kbCats.indexOf(cat) },
    });
    catIds[cat.name] = c.id;
  }

  const articles = [
    // Vendas
    { catName: 'Vendas e Faturamento', title: 'Como criar um Pedido de Venda', slug: 'criar-pedido-venda', status: 'publicado', author: 'Ana Lima', summary: 'Passo a passo para criar e aprovar um PV no sistema.', content: '## Como criar um Pedido de Venda\n\n1. Acesse **Vendas → Pedidos de Venda**\n2. Clique em **Novo Pedido**\n3. Selecione o cliente\n4. Adicione os itens e quantidades\n5. Defina a data de entrega\n6. Clique em **Salvar**\n\n### Estados do Pedido\n- **Rascunho**: em preenchimento\n- **Aprovado**: liberado para produção\n- **Em Produção**: OP aberta\n- **Expedição**: aguardando envio\n- **Concluído**: entregue', tags: ['vendas','pedido','tutorial'] },
    { catName: 'Vendas e Faturamento', title: 'Tabela de Preços – Como configurar', slug: 'tabela-precos-configurar', status: 'publicado', author: 'João Silva', summary: 'Configure tabelas de preços por cliente ou segmento.', content: '## Tabela de Preços\n\nAs tabelas de preços permitem configurar valores diferenciados por cliente, canal de venda ou condição de pagamento.\n\n### Criando uma tabela\n1. Acesse **Vendas → Tabela de Preços**\n2. Clique em **Nova Tabela**\n3. Defina código, moeda e vigência\n4. Adicione produtos e preços\n\n### Aplicando em pedidos\nAo criar um pedido, selecione a tabela desejada para que os preços sejam preenchidos automaticamente.', tags: ['preços','configuração'] },
    { catName: 'Vendas e Faturamento', title: 'Comissões de vendas – Configuração e cálculo', slug: 'comissoes-vendas', status: 'publicado', author: 'Ana Lima', summary: 'Como configurar e calcular comissões sobre pedidos.', content: '## Comissões\n\nO módulo de comissões calcula automaticamente os valores devidos a vendedores com base em regras configuráveis.\n\n### Regras disponíveis\n- % sobre faturamento\n- % sobre margem\n- Valor fixo por pedido\n- Escalonado por meta\n\n### Relatório de comissões\nAcesse **Vendas → Comissões** para visualizar o extrato por vendedor e período.', tags: ['comissão','vendedor'] },
    // Produção
    { catName: 'Produção Industrial', title: 'Abrindo uma Ordem de Produção (OP)', slug: 'abrir-ordem-producao', status: 'publicado', author: 'Carlos Mendes', summary: 'Processo completo para abertura e acompanhamento de OPs.', content: '## Ordem de Produção\n\n### Como abrir uma OP\n1. Acesse **Produção → Ordens de Produção**\n2. Clique em **Nova OP**\n3. Vincule ao Pedido de Venda (opcional)\n4. Selecione o produto e quantidade\n5. Defina prazo e responsável\n6. Clique em **Liberar**\n\n### Kanban de Produção\nAcompanhe o andamento pelo **Kanban** com colunas: BACKLOG → WIP → QA → DONE.', tags: ['OP','produção','Kanban'] },
    { catName: 'Produção Industrial', title: 'Roteiro de Fabricação – Configurando etapas', slug: 'roteiro-fabricacao', status: 'publicado', author: 'Carlos Mendes', summary: 'Defina etapas e máquinas para cada produto.', content: '## Roteiro de Fabricação\n\nOs roteiros definem as etapas produtivas (operações) necessárias para fabricar um produto.\n\n### Etapas típicas para inox\n1. **Corte a Laser** – Máquina: Trumpf 3030\n2. **Dobra** – Máquina: Press brake HFB-100\n3. **Soldagem TIG** – Máquina: Lincoln TIG-500\n4. **Decapagem/Acabamento**\n5. **Inspeção Final**\n\n### Tempos padrão\nConfigure tempo (minutos) por etapa para calcular o lead time.', tags: ['roteiro','máquina','etapa'] },
    { catName: 'Produção Industrial', title: 'MRP – Material Requirements Planning', slug: 'mrp-planejamento', status: 'publicado', author: 'Ana Lima', summary: 'Como o MRP calcula necessidades de materiais.', content: '## MRP\n\nO MRP (Material Requirements Planning) calcula automaticamente as necessidades de compras e produção com base na demanda futura.\n\n### Inputs\n- Pedidos de Venda em aberto\n- Estoque atual por produto\n- Lead time de compra/produção\n- BOM (Lista de Materiais)\n\n### Outputs\n- Sugestões de Ordens de Compra\n- Sugestões de Ordens de Produção\n- Relatório de cobertura de estoque', tags: ['MRP','planejamento','PCP'] },
    // Estoque
    { catName: 'Estoque e Almoxarifado', title: 'Realizando um Inventário', slug: 'realizar-inventario', status: 'publicado', author: 'João Silva', summary: 'Passo a passo do inventário físico de estoque.', content: '## Inventário de Estoque\n\n### Criando o inventário\n1. Acesse **Estoque → Inventário**\n2. Clique em **Novo Inventário**\n3. Selecione os produtos a contar\n4. Status inicial: **RASCUNHO**\n\n### Contagem física\n1. Imprima ou use o app\n2. Registre as quantidades contadas\n3. O sistema calcula diferenças\n4. Aprove para ajustar automaticamente\n\n> ⚠️ Realize inventários periódicos para manter a acurácia do estoque.', tags: ['inventário','estoque','contagem'] },
    { catName: 'Estoque e Almoxarifado', title: 'Endereçamento de Estoque', slug: 'enderecamento-estoque', status: 'publicado', author: 'João Silva', summary: 'Configure endereços (localização) para produtos.', content: '## Endereçamento\n\nO endereçamento permite localizar produtos dentro do armazém com precisão.\n\n### Estrutura de endereços\n```\nALM-[Corredor]-[Rua]-[Prateleira]\nEx.: ALM-A01-R1-P3\n```\n\n### Como atribuir um endereço\n1. Acesse **Estoque → Endereçamento**\n2. Selecione o produto\n3. Associe ao endereço\n4. Informe a quantidade armazenada', tags: ['endereço','localização','armazém'] },
    // Financeiro
    { catName: 'Financeiro e Contábil', title: 'Contas a Receber – Gestão completa', slug: 'contas-receber-gestao', status: 'publicado', author: 'Ana Lima', summary: 'Como gerenciar títulos a receber no ERP.', content: '## Contas a Receber\n\n### Gerando um título\nOs títulos são gerados automaticamente ao faturar um Pedido de Venda.\n\n### Baixa de recebimento\n1. Acesse **Financeiro → Contas a Receber**\n2. Localize o título\n3. Clique em **Baixar**\n4. Informe a data e valor recebido\n\n### Régua de cobrança\nConfigure régua automática para envio de lembretes antes e após o vencimento.', tags: ['financeiro','receber','cobrança'] },
    { catName: 'Financeiro e Contábil', title: 'DRE – Demonstrativo de Resultados', slug: 'dre-demonstrativo', status: 'publicado', author: 'Ana Lima', summary: 'Entenda e gere o DRE pelo sistema.', content: '## DRE – Demonstrativo do Resultado do Exercício\n\nO DRE consolida receitas e despesas em um período.\n\n### Estrutura básica\n- **Receita Bruta de Vendas**\n- (-) Deduções e impostos\n- **Receita Líquida**\n- (-) Custo dos Produtos Vendidos (CPV)\n- **Lucro Bruto**\n- (-) Despesas operacionais\n- **EBITDA**\n- (-) Depreciação e amortização\n- **EBIT / Lucro Operacional**\n- (-) Resultado financeiro\n- **Lucro Antes do IR**\n- (-) IR e CSLL\n- **Lucro Líquido**', tags: ['DRE','resultado','financeiro'] },
    // Qualidade
    { catName: 'Qualidade (ISO 9001)', title: 'Controle de Qualidade – Inspeções', slug: 'controle-qualidade-inspecoes', status: 'publicado', author: 'Carlos Mendes', summary: 'Realize inspeções de recebimento, processo e produto acabado.', content: '## Inspeções de Qualidade\n\n### Tipos de inspeção\n1. **Recebimento**: materiais recebidos de fornecedores\n2. **Processo**: durante a fabricação\n3. **Produto Acabado**: antes da expedição\n\n### Criando uma inspeção\n1. Acesse **Qualidade → Controle de Qualidade**\n2. Selecione o tipo\n3. Informe lote/referência\n4. Registre os critérios e resultados\n5. Aprove ou rejeite\n\n### Não-Conformidades\nEm caso de reprovação, abra uma NC para tratamento e ação corretiva.', tags: ['qualidade','inspeção','NC'] },
    // RH
    { catName: 'RH e Folha', title: 'Ponto eletrônico – Registro e fechamento', slug: 'ponto-eletronico', status: 'publicado', author: 'João Silva', summary: 'Como registrar e fechar o ponto dos funcionários.', content: '## Ponto Eletrônico\n\n### Registrando o ponto\n1. Acesse **RH → Ponto**\n2. Selecione o funcionário\n3. Registre entrada/saída\n4. O sistema calcula horas trabalhadas, extras e faltas\n\n### Fechamento mensal\n1. Revise registros do mês\n2. Ajuste divergências\n3. Feche o período para cálculo da folha\n\n### Integração com folha\nOs dados de ponto são usados automaticamente no cálculo da **Folha de Pagamento**.', tags: ['ponto','RH','horas'] },
    // Como funciona
    { catName: 'Como Funciona o ERP', title: 'Visão geral do COZINCA ERP', slug: 'visao-geral-erp', status: 'publicado', author: 'Equipe COZINCA', summary: 'Conheça todos os módulos e o fluxo do sistema.', content: '## COZINCA ERP – Visão Geral\n\nO COZINCA ERP é uma solução integrada para a indústria metalmecânica, especialmente fabricantes de equipamentos em aço inoxidável.\n\n### Módulos principais\n| Módulo | Função |\n|---|---|\n| **Vendas** | PVs, orçamentos, clientes |\n| **Produção** | OPs, Kanban, chão de fábrica |\n| **Estoque** | Produtos, movimentações, inventário |\n| **Compras** | OCs, fornecedores, recebimentos |\n| **Financeiro** | CR, CP, DRE, fluxo de caixa |\n| **Qualidade** | Inspeções, NCs, databooks |\n| **RH** | Funcionários, ponto, folha |\n| **Fiscal** | NF-e, SPED, Bloco K |\n\n### Fluxo do pedido\n`Orçamento → Pedido de Venda → OP → Expedição → NF-e → Financeiro`', tags: ['visão geral','tutorial','início'] },
    { catName: 'Como Funciona o ERP', title: 'Permissões e perfis de acesso', slug: 'permissoes-perfis', status: 'publicado', author: 'Equipe COZINCA', summary: 'Entenda como funcionam os papéis e permissões.', content: '## Permissões e Perfis\n\n### Papéis (Roles) disponíveis\n- **master**: acesso total\n- **gerente**: gestão geral\n- **gerente_producao**: foco em produção\n- **financeiro**: módulos financeiros\n- **qualidade**: qualidade e documentos\n- **expedicao**: expedição\n- **operador**: operações básicas\n\n### Configurando permissões\n1. Acesse **Configurações → Usuários**\n2. Selecione o usuário\n3. Atribua o papel desejado\n4. As permissões são aplicadas imediatamente', tags: ['permissões','usuários','admin'] },
    { catName: 'Compras e Fornecedores', title: 'Criando um Pedido de Compra', slug: 'criar-pedido-compra', status: 'publicado', author: 'João Silva', summary: 'Processo de compra desde a solicitação até o recebimento.', content: '## Pedido de Compra\n\n### Fluxo de compras\n`Solicitação → Cotação → OC → Recebimento → Documento de Entrada`\n\n### Criando uma OC\n1. Acesse **Compras → Pedidos de Compra**\n2. Clique em **Nova OC**\n3. Selecione o fornecedor\n4. Adicione os itens com quantidade e custo unitário\n5. Informe data prevista de entrega\n6. Envie para aprovação\n\n### Status da OC\n- **Rascunho** → **Enviado** → **Parcialmente Recebido** → **Recebido**', tags: ['compras','OC','fornecedor'] },
  ];

  for (const art of articles) {
    const catId = catIds[art.catName];
    if (!catId) continue;
    const existing = await prisma.knowledgeArticle.findUnique({ where: { slug: art.slug } });
    if (existing) continue;
    await prisma.knowledgeArticle.create({
      data: {
        id: uuid(), categoryId: catId, title: art.title, slug: art.slug,
        status: art.status, author: art.author, summary: art.summary,
        content: art.content, tags: art.tags, version: '1.0',
        visibility: 'interno', views: Math.floor(Math.random() * 120),
        likes: Math.floor(Math.random() * 20),
      },
    });
  }

  // ── 8. QUALITY extras (Documentos, Databooks, Instrumentos, NCs) ──────────
  console.log('  ✅ Qualidade – documentos, databooks, instrumentos, NCs…');
  const qdocs = [
    { code: 'QD-POP-001', title: 'POP-001 – Inspeção de Recebimento de Chapas', documentType: 'POP', status: 'aprovado', author: 'Carlos Mendes' },
    { code: 'QD-POP-002', title: 'POP-002 – Controle de Soldagem TIG', documentType: 'POP', status: 'aprovado', author: 'Carlos Mendes' },
    { code: 'QD-POP-003', title: 'POP-003 – Inspeção Final de Produto Acabado', documentType: 'POP', status: 'aprovado', author: 'Carlos Mendes' },
    { code: 'QD-PCQ-001', title: 'PCQ-001 – Plano de Controle de Qualidade – Tanques Inox', documentType: 'PCQ', status: 'aprovado', author: 'Ana Lima' },
    { code: 'QD-PCQ-002', title: 'PCQ-002 – Plano de Qualidade – Eixos e Transmissões', documentType: 'PCQ', status: 'rascunho', author: 'Ana Lima' },
    { code: 'QD-ISO-001', title: 'Manual de Qualidade ISO 9001:2015', documentType: 'Manual', status: 'aprovado', author: 'Equipe COZINCA' },
    { code: 'QD-REG-001', title: 'Registro de Treinamento – Equipe de Solda', documentType: 'Registro', status: 'aprovado', author: 'João Silva' },
    { code: 'QD-CERT-001', title: 'Certificado de Conformidade – Chapa 304 L', documentType: 'Certificado', status: 'aprovado', author: 'Carlos Mendes' },
    { code: 'QD-FRM-001', title: 'Formulário de Inspeção de Solda', documentType: 'Formulário', status: 'publicado', author: 'Carlos Mendes' },
    { code: 'QD-FRM-002', title: 'Formulário de NÃO-Conformidade (RNC)', documentType: 'Formulário', status: 'publicado', author: 'Carlos Mendes' },
    { code: 'QD-PROG-001', title: 'Programa Anual de Auditorias Internas 2026', documentType: 'Programa', status: 'aprovado', author: 'Ana Lima' },
  ];
  for (const d of qdocs) {
    await prisma.qualityDocument.upsert({
      where: { code: d.code }, update: {},
      create: { id: uuid(), ...d, content: {}, createdAt: daysAgo(30) },
    });
  }

  const databooks = [
    { code: 'DB-PV-D001', title: 'Databook – PV-D001 – Tanques Armazenamento 5000L', clientName: 'Petroquímica Sul S/A', orderRef: 'PV-D001', productCode: 'PA-TAN-500', status: 'aprovado', progress: 100, template: 'tanques' },
    { code: 'DB-PV-D002', title: 'Databook – PV-D002 – Linha Envase Cervejeiro', clientName: 'Cervejaria Horizonte Ltda', orderRef: 'PV-D002', productCode: 'PA-COL-250', status: 'em_elaboracao', progress: 70, template: 'equipamentos' },
    { code: 'DB-PV-D005', title: 'Databook – PV-D005 – Misturador Laticínios', clientName: 'Laticínios Minas Gerais', orderRef: 'PV-D005', productCode: 'PA-MIS-200', status: 'em_elaboracao', progress: 45, template: 'equipamentos' },
    { code: 'DB-PV-D007', title: 'Databook – PV-D007 – Estrutura Cobertura', clientName: 'Construtora Andrade Silva', orderRef: 'PV-D007', productCode: 'PA-EST-003', status: 'pendente', progress: 10, template: 'estruturas' },
    { code: 'DB-ENG-001',  title: 'Databook Engenharia – Reator 10000L Química Nova', clientName: 'Química Nova S/A', orderRef: 'PRJ-2026-003', productCode: 'PA-TAN-500', status: 'em_elaboracao', progress: 30, template: 'reatores' },
  ];
  for (const db of databooks) {
    const existing = await prisma.qualityDatabook.findUnique({ where: { code: db.code } });
    if (existing) continue;
    const book = await prisma.qualityDatabook.create({ data: { id: uuid(), ...db } });
    const docs = [
      { title: 'Certificado de Conformidade do Material', docType: 'Certificado', status: db.progress >= 100 ? 'aprovado' : db.progress > 50 ? 'em_elaboracao' : 'pendente', sortOrder: 1 },
      { title: 'Registro de Soldagem (WPS/PQR)', docType: 'Registro Soldagem', status: db.progress >= 80 ? 'aprovado' : 'pendente', sortOrder: 2 },
      { title: 'Relatório de Inspeção Dimensional', docType: 'Inspeção', status: db.progress >= 60 ? 'aprovado' : 'pendente', sortOrder: 3 },
      { title: 'Teste Hidrostático', docType: 'Teste', status: db.progress >= 90 ? 'aprovado' : 'pendente', sortOrder: 4 },
      { title: 'Manual de Operação e Manutenção', docType: 'Manual', status: db.progress >= 100 ? 'aprovado' : 'pendente', sortOrder: 5 },
    ];
    for (const doc of docs) {
      await prisma.qualityDatabookDocument.create({ data: { id: uuid(), databookId: book.id, ...doc } });
    }
  }

  const instruments = [
    { code: 'INST-001', name: 'Paquímetro digital 0-150mm', instrumentType: 'Dimensional', location: 'Qualidade', status: 'calibrado', lastCalibration: daysAgo(90), nextCalibration: daysFrom(90), calibrationInterval: 180, responsible: 'Carlos Mendes' },
    { code: 'INST-002', name: 'Micrômetro externo 0-25mm', instrumentType: 'Dimensional', location: 'Produção – Usinagem', status: 'calibrado', lastCalibration: daysAgo(45), nextCalibration: daysFrom(135), calibrationInterval: 180, responsible: 'Carlos Mendes' },
    { code: 'INST-003', name: 'Manômetro de teste 0-600 kPa', instrumentType: 'Pressão', location: 'Qualidade', status: 'calibrado', lastCalibration: daysAgo(30), nextCalibration: daysFrom(150), calibrationInterval: 180, responsible: 'Ana Lima' },
    { code: 'INST-004', name: 'Termômetro de contato -50 a +200°C', instrumentType: 'Temperatura', location: 'Chão de Fábrica', status: 'vencido', lastCalibration: daysAgo(200), nextCalibration: daysAgo(20), calibrationInterval: 180, responsible: 'Carlos Mendes' },
    { code: 'INST-005', name: 'Durômetro Brinell HB', instrumentType: 'Dureza', location: 'Laboratório', status: 'calibrado', lastCalibration: daysAgo(60), nextCalibration: daysFrom(120), calibrationInterval: 180, responsible: 'Ana Lima' },
    { code: 'INST-006', name: 'Balança industrial 500kg', instrumentType: 'Massa', location: 'Almoxarifado', status: 'calibrado', lastCalibration: daysAgo(15), nextCalibration: daysFrom(165), calibrationInterval: 180, responsible: 'João Silva' },
  ];
  for (const inst of instruments) {
    await prisma.qualityInstrument.upsert({
      where: { code: inst.code }, update: {},
      create: { id: uuid(), ...inst },
    });
  }

  const moreNCs = [
    { code: 'NC-D002', title: 'Chapa com espessura fora da tolerância', origin: 'Recebimento', severity: 'Moderada', status: 'em_tratamento', responsible: 'Carlos Mendes', rootCause: 'Fornecedor entregou material fora do especificado', correctiveAction: 'Devolução do material e emissão de RNC para o fornecedor' },
    { code: 'NC-D003', title: 'Solda com porosidade em cordão TIG', origin: 'Processo', severity: 'Alta', status: 'aberto', responsible: 'Ana Lima', rootCause: 'Gás de proteção com umidade', correctiveAction: 'Substituição do cilindro de argônio e retrabalho do cordão' },
    { code: 'NC-D004', title: 'Dimensão de flanges fora do projeto', origin: 'Produto Acabado', severity: 'Alta', status: 'aberto', responsible: 'Carlos Mendes', rootCause: 'Falha no programa CNC', correctiveAction: 'Revisão do programa e re-usinagem das peças' },
    { code: 'NC-D005', title: 'Acabamento superficial abaixo do Ra especificado', origin: 'Processo', severity: 'Leve', status: 'fechado', responsible: 'Carlos Mendes', closedAt: daysAgo(10), rootCause: 'Lixa inadequada', correctiveAction: 'Retrabalhado com lixa #400 e polimento eletropolimento' },
    { code: 'NC-D006', title: 'Atraso na entrega – peça faltante na expedição', origin: 'Expedição', severity: 'Moderada', status: 'em_tratamento', responsible: 'João Silva', rootCause: 'Erro de picking no almoxarifado', correctiveAction: 'Redesenho do processo de separação e double-check obrigatório' },
  ];
  for (const nc of moreNCs) {
    await prisma.qualityNonConformity.upsert({
      where: { code: nc.code }, update: {},
      create: { id: uuid(), ...nc, dueDate: nc.status !== 'fechado' ? daysFrom(15) : null, createdAt: daysAgo(20) },
    });
  }

  // ── 9. EXPEDITION extra (loads + manifests) ───────────────────────────────
  console.log('  🚛 Expedição extra (cargas e manifestos)…');
  const expOrders = await prisma.expeditionOrder.findMany({ take: 10 });
  for (const eo of expOrders.slice(0, 5)) {
    const loadCount = await prisma.expeditionLoad.count({ where: { orderId: eo.id } });
    if (loadCount === 0) {
      const load = await prisma.expeditionLoad.create({
        data: {
          id: uuid(), orderId: eo.id,
          code: `CRG-${eo.code}`, loadType: 'pallet',
          description: 'Palete com equipamentos', weight: 280,
          items: [{ descricao: 'Equipamento principal', quantidade: 1 }],
        },
      });
      const manifestCount = await prisma.expeditionManifest.count({ where: { orderId: eo.id } });
      if (manifestCount === 0) {
        await prisma.expeditionManifest.create({
          data: {
            id: uuid(), orderId: eo.id,
            code: `MAN-${eo.code}`, nfeRef: `NFE-${eo.code}`,
            status: eo.status === 'entregue' ? 'encerrado' : 'aberto',
            carrier: 'Transportadora Rápida Ltda',
            driverName: 'Marcos Caminhoneiro', vehiclePlate: 'ABC-1234',
            loads: [load.id],
            issuedAt: eo.shippedAt ?? null,
          },
        });
      }
    }
  }

  // ── 10. RH – Ponto, Férias, Folha ─────────────────────────────────────────
  console.log('  👥 RH – ponto, férias, folha de pagamento…');
  const employees = await allEmployees();

  // TimeEntries (ponto – últimos 30 dias úteis)
  for (const emp of employees) {
    for (let d = 1; d <= 22; d++) {
      const workDate = dateOnly(daysAgo(d));
      const dow = workDate.getDay();
      if (dow === 0 || dow === 6) continue; // pula fins de semana
      // Verifica se já existe antes de criar
      const exists = await prisma.timeEntry.findFirst({
        where: { employeeId: emp.id, workDate },
      });
      if (exists) continue;
      await prisma.timeEntry.create({
        data: {
          id: uuid(), employeeId: emp.id,
          workDate, hours: 8 + (d % 3 === 0 ? 1 : 0),
          notes: d % 5 === 0 ? 'Hora extra aprovada' : null,
        },
      }).catch(() => null);
    }
  }

  // LeaveRequests (férias)
  const leaveData = [
    { empIndex: 0, startDate: daysFrom(30), endDate: daysFrom(44), status: 'APROVADO', reason: 'Férias anuais' },
    { empIndex: 1, startDate: daysAgo(14), endDate: daysAgo(0),  status: 'APROVADO', reason: 'Férias anuais' },
    { empIndex: 2, startDate: daysFrom(60), endDate: daysFrom(74), status: 'PENDENTE', reason: 'Férias programadas' },
    { empIndex: 3, startDate: daysAgo(30), endDate: daysAgo(16), status: 'APROVADO', reason: 'Férias anuais' },
    { empIndex: 4, startDate: daysFrom(90), endDate: daysFrom(104), status: 'RASCUNHO', reason: 'Férias planejadas' },
  ];
  for (const lr of leaveData) {
    if (!employees[lr.empIndex]) continue;
    await prisma.leaveRequest.create({
      data: {
        id: uuid(), employeeId: employees[lr.empIndex].id,
        startDate: dateOnly(lr.startDate),
        endDate: dateOnly(lr.endDate),
        status: lr.status as any,
        reason: lr.reason,
      },
    }).catch(() => null);
  }

  // PayrollRun (últimos 6 meses)
  const months = ['2025-12','2026-01','2026-02','2026-03','2026-04','2026-05'];
  for (const month of months) {
    const run = await prisma.payrollRun.upsert({
      where: { referenceMonth: month }, update: {},
      create: {
        id: uuid(), referenceMonth: month,
        status: month === '2026-05' ? 'RASCUNHO' : 'FECHADO',
        calculatedAt: month !== '2026-05' ? daysAgo(parseInt(month.split('-')[1]) * 5) : null,
      },
    });
    // PayrollLines
    for (const emp of employees) {
      const gross = Number(emp.salaryBase ?? 4500) * (1 + Math.random() * 0.1);
      const inss = gross * 0.09;
      const irrf = Math.max(0, (gross - 2800) * 0.075);
      const net = gross - inss - irrf;
      await prisma.payrollLine.upsert({
        where: { payrollRunId_employeeId: { payrollRunId: run.id, employeeId: emp.id } },
        update: {},
        create: {
          id: uuid(), payrollRunId: run.id, employeeId: emp.id,
          gross: Math.round(gross * 100) / 100,
          inss: Math.round(inss * 100) / 100,
          irrf: Math.round(irrf * 100) / 100,
          net: Math.round(net * 100) / 100,
        },
      });
    }
  }

  // ── 11. FISCAL – mais NF-e ─────────────────────────────────────────────────
  console.log('  📄 Fiscal – NF-e adicionais…');
  const nfeDefs = [
    { number: '000016', series: '1', status: 'AUTORIZADA', customerName: 'Metalúrgica São Paulo Ltda', totalAmount: 10850 },
    { number: '000017', series: '1', status: 'AUTORIZADA', customerName: 'Petroquímica Sul S/A', totalAmount: 8800 },
    { number: '000018', series: '1', status: 'AUTORIZADA', customerName: 'Cervejaria Horizonte Ltda', totalAmount: 22400 },
    { number: '000019', series: '1', status: 'RASCUNHO',   customerName: 'Laticínios Minas Gerais', totalAmount: 15600 },
    { number: '000020', series: '1', status: 'RASCUNHO',   customerName: 'Frigorífico Central Brasil', totalAmount: 9200 },
    { number: '000021', series: '1', status: 'CANCELADA',  customerName: 'Usina São João', totalAmount: 4500 },
    { number: '000022', series: '1', status: 'AUTORIZADA', customerName: 'Cosan Distribuidora', totalAmount: 33000 },
    { number: '000023', series: '1', status: 'AUTORIZADA', customerName: 'Química Nova S/A', totalAmount: 41000 },
  ];
  for (const nfe of nfeDefs) {
    const accessKey = `35260200000000000000550010000${nfe.number}1${Math.floor(Math.random()*1e9).toString().padStart(9,'0')}`;
    await prisma.fiscalNfe.upsert({
      where: { accessKey }, update: {},
      create: {
        id: uuid(), ...nfe,
        accessKey,
        issuedAt: nfe.status === 'AUTORIZADA' ? daysAgo(Math.floor(Math.random() * 90)) : null,
        cancelledAt: nfe.status === 'CANCELADA' ? daysAgo(5) : null,
      },
    });
  }

  // ── 12. ENTITY RECORDS (módulos via EntityRecord) ─────────────────────────
  console.log('  🗄️  Entity records (financeiro, serviços, compras extras)…');

  // Conta a receber
  const recDefs = [
    { numero: 'CR-2026-001', cliente: 'Metalúrgica São Paulo Ltda', valor: 10850, vencimento: daysFrom(15), status: 'aberto', pedido: 'PV-D001' },
    { numero: 'CR-2026-002', cliente: 'Petroquímica Sul S/A', valor: 8800, vencimento: daysFrom(30), status: 'aberto', pedido: 'PV-D002' },
    { numero: 'CR-2026-003', cliente: 'Cervejaria Horizonte Ltda', valor: 22400, vencimento: daysAgo(5), status: 'vencido', pedido: 'PV-D003' },
    { numero: 'CR-2026-004', cliente: 'Laticínios Minas Gerais', valor: 15600, vencimento: daysFrom(45), status: 'aberto', pedido: 'PV-D004' },
    { numero: 'CR-2026-005', cliente: 'Frigorífico Central Brasil', valor: 9200, vencimento: daysFrom(7), status: 'aberto', pedido: 'PV-D005' },
    { numero: 'CR-2026-006', cliente: 'Usina São João', valor: 18700, vencimento: daysAgo(20), status: 'pago', pedido: 'PV-D006', pagamentoData: daysAgo(18) },
    { numero: 'CR-2026-007', cliente: 'Cosan Distribuidora', valor: 33000, vencimento: daysFrom(60), status: 'aberto', pedido: 'PV-D007' },
    { numero: 'CR-2026-008', cliente: 'Química Nova S/A', valor: 41000, vencimento: daysFrom(90), status: 'aberto', pedido: 'PV-D008' },
    { numero: 'CR-2026-009', cliente: 'EMS Pharma', valor: 12500, vencimento: daysAgo(10), status: 'vencido', pedido: 'PV-D009' },
    { numero: 'CR-2026-010', cliente: 'Alpargatas S.A.', valor: 7800, vencimento: daysAgo(30), status: 'pago', pedido: 'PV-D010', pagamentoData: daysAgo(28) },
    { numero: 'CR-2026-011', cliente: 'Gerdau Aços Longos', valor: 5600, vencimento: daysFrom(20), status: 'aberto', pedido: 'PV-D011' },
    { numero: 'CR-2026-012', cliente: 'WEG Motores', valor: 19200, vencimento: daysFrom(15), status: 'aberto', pedido: 'PV-D012' },
  ];
  for (const r of recDefs) {
    await addRecord('conta_receber', {
      numero: r.numero, cliente: r.cliente, valor: r.valor,
      vencimento: r.vencimento.toISOString(), status: r.status,
      pedido: r.pedido, pagamento_data: (r as any).pagamentoData?.toISOString() ?? null,
    });
  }

  // Conta a pagar
  const pagDefs = [
    { numero: 'CP-2026-001', fornecedor: 'Aços Villares S.A.', valor: 8400, vencimento: daysFrom(10), status: 'aberto', oc: 'OC-D001', categoria: 'Matéria Prima' },
    { numero: 'CP-2026-002', fornecedor: 'Metais & Tubos São Paulo', valor: 3200, vencimento: daysFrom(5), status: 'aberto', oc: 'OC-D002', categoria: 'Material' },
    { numero: 'CP-2026-003', fornecedor: 'Eletrodos & Soldas Centro-Oeste', valor: 1200, vencimento: daysAgo(3), status: 'vencido', oc: 'OC-D003', categoria: 'Insumo' },
    { numero: 'CP-2026-004', fornecedor: 'Máquinas Industriais Sorocaba', valor: 12500, vencimento: daysFrom(30), status: 'aberto', oc: 'OC-D004', categoria: 'Equipamento' },
    { numero: 'CP-2026-005', fornecedor: 'Aços Villares S.A.', valor: 6800, vencimento: daysAgo(15), status: 'pago', oc: 'OC-D005', categoria: 'Matéria Prima', pagamentoData: daysAgo(13) },
    { numero: 'CP-2026-006', fornecedor: 'Compressores Norte Indústria', valor: 9700, vencimento: daysFrom(20), status: 'aberto', oc: 'OC-D006', categoria: 'Equipamento' },
    { numero: 'CP-2026-007', fornecedor: 'Energia Elétrica CPFL', valor: 4200, vencimento: daysFrom(8), status: 'aberto', oc: null, categoria: 'Utilidades' },
    { numero: 'CP-2026-008', fornecedor: 'Aluguel Imóvel Industrial', valor: 8500, vencimento: daysFrom(12), status: 'aberto', oc: null, categoria: 'Aluguel' },
    { numero: 'CP-2026-009', fornecedor: 'Contabilidade & Assessoria', valor: 2800, vencimento: daysAgo(1), status: 'vencido', oc: null, categoria: 'Serviços' },
    { numero: 'CP-2026-010', fornecedor: 'Metais & Tubos São Paulo', valor: 5100, vencimento: daysFrom(25), status: 'aberto', oc: 'OC-D007', categoria: 'Material' },
  ];
  for (const p of pagDefs) {
    await addRecord('conta_pagar', {
      numero: p.numero, fornecedor: p.fornecedor, valor: p.valor,
      vencimento: p.vencimento.toISOString(), status: p.status,
      ordem_compra: p.oc, categoria: p.categoria,
      pagamento_data: (p as any).pagamentoData?.toISOString() ?? null,
    });
  }

  // Transferências bancárias
  for (let i = 1; i <= 8; i++) {
    await addRecord('transferencia_bancaria', {
      numero: `TB-2026-${String(i).padStart(3,'0')}`,
      tipo: i % 2 === 0 ? 'TED' : 'PIX',
      valor: 5000 + i * 1500,
      origem: 'Conta Corrente BB – 12345-6',
      destino: i % 2 === 0 ? 'Fornecedor XPTO – Bradesco' : 'Aplicação CDB',
      data: daysAgo(i * 3).toISOString(),
      status: 'concluido',
      descricao: `Transferência ${i} – referência ${new Date().getFullYear()}`,
    });
  }

  // Boletos bancários
  for (let i = 1; i <= 10; i++) {
    await addRecord('boleto_bancario', {
      numero: `BOL-2026-${String(i).padStart(4,'0')}`,
      cliente: recDefs[(i - 1) % recDefs.length].cliente,
      valor: 3000 + i * 800,
      vencimento: daysFrom(i * 5).toISOString(),
      status: i <= 3 ? 'pago' : i <= 7 ? 'aberto' : 'vencido',
      banco: 'Banco do Brasil',
      linha_digitavel: `00190.00009 01234.567${i.toString().padStart(2,'0')} 89012.345${i.toString().padStart(2,'0')} 6 12345${String(i).padStart(5,'0')}0`,
    });
  }

  // Conciliação bancária
  for (let i = 1; i <= 6; i++) {
    await addRecord('conciliacao_bancaria', {
      banco: 'Banco do Brasil',
      conta: '12345-6',
      periodo: `2026-${String(i).padStart(2,'0')}`,
      saldo_extrato: 45000 + i * 3000,
      saldo_sistema: 44800 + i * 3000,
      diferenca: 200,
      status: i < 5 ? 'conciliado' : 'pendente',
      data_conciliacao: i < 5 ? daysAgo((6 - i) * 30).toISOString() : null,
    });
  }

  // Solicitações de compra
  for (let i = 1; i <= 8; i++) {
    const prod = products[i % products.length];
    await addRecord('solicitacao_compra', {
      numero: `SC-2026-${String(i).padStart(3,'0')}`,
      produto: prod.code,
      produto_nome: prod.name,
      quantidade: 10 + i * 5,
      unidade: prod.unit,
      solicitante: ['Ana Lima','Carlos Mendes','João Silva'][i % 3],
      data_solicitacao: daysAgo(i * 2).toISOString(),
      necessidade: daysFrom(i * 7).toISOString(),
      status: ['pendente','aprovado','em_cotacao','convertido'][i % 4],
      justificativa: `Reposição de estoque – estoque abaixo do ponto de pedido`,
    });
  }

  // Serviços – pedidos, propostas, etc.
  const serviceDefs = [
    { tipo: 'pedido', numero: 'SRV-001', cliente: 'Petroquímica Sul S/A', servico: 'Manutenção preventiva – tanques inox', valor: 4500, prazo: daysFrom(30), status: 'aprovado' },
    { tipo: 'pedido', numero: 'SRV-002', cliente: 'Cervejaria Horizonte Ltda', servico: 'Inspeção e limpeza – sistema de envase', valor: 2800, prazo: daysFrom(15), status: 'em_execucao' },
    { tipo: 'pedido', numero: 'SRV-003', cliente: 'Laticínios Minas Gerais', servico: 'Reparo de conexões – linha de pasteurização', valor: 1900, prazo: daysFrom(7), status: 'concluido' },
    { tipo: 'proposta', numero: 'PROP-001', cliente: 'Química Nova S/A', servico: 'Contrato anual de manutenção industrial', valor: 36000, prazo: daysFrom(60), status: 'enviado' },
    { tipo: 'proposta', numero: 'PROP-002', cliente: 'Metalúrgica São Paulo Ltda', servico: 'Serviço de usinagem CNC – 100h/mês', valor: 18000, prazo: daysFrom(45), status: 'negociacao' },
    { tipo: 'proposta', numero: 'PROP-003', cliente: 'Gerdau Aços Longos', servico: 'Manutenção equipamentos transportadores', valor: 8500, prazo: daysFrom(30), status: 'aprovado' },
    { tipo: 'recorrente', numero: 'REC-001', cliente: 'Petroquímica Sul S/A', servico: 'Contrato manutenção mensal', valor: 5500, prazo: daysFrom(1), status: 'ativo', frequencia: 'mensal' },
    { tipo: 'recorrente', numero: 'REC-002', cliente: 'Cervejaria Horizonte Ltda', servico: 'Suporte técnico trimestral', valor: 3200, prazo: daysFrom(45), status: 'ativo', frequencia: 'trimestral' },
  ];
  for (const svc of serviceDefs) {
    await addRecord(`servico_${svc.tipo}`, {
      numero: svc.numero, cliente: svc.cliente, servico: svc.servico,
      valor: svc.valor, prazo: svc.prazo.toISOString(), status: svc.status,
      frequencia: (svc as any).frequencia ?? null,
    });
  }

  // NFS-e (Nota Fiscal de Serviços eletrônica)
  for (let i = 1; i <= 5; i++) {
    await addRecord('nfse', {
      numero: `NFSE-2026-${String(i).padStart(3,'0')}`,
      tomador: serviceDefs[i - 1].cliente,
      descricao: serviceDefs[i - 1].servico,
      valor: serviceDefs[i - 1].valor,
      data_emissao: daysAgo(i * 15).toISOString(),
      codigo_servico: '7.09',
      municipio: 'São Paulo',
      status: i <= 3 ? 'emitida' : 'pendente',
    });
  }

  // Importação
  for (let i = 1; i <= 4; i++) {
    await addRecord('processo_importacao', {
      numero: `IMP-2026-${String(i).padStart(3,'0')}`,
      fornecedor: ['Sandvik Materials (Suécia)','Outokumpu Stainless (Finlândia)','Nippon Steel (Japão)','Acerinox Europa (Espanha)'][i-1],
      descricao: 'Chapas e tubos inox 316L – grau alimentício',
      valor_total_usd: 28000 + i * 5000,
      di_numero: `2026${String(i).padStart(7,'0')}`,
      data_embarque: daysAgo(30 + i * 10).toISOString(),
      data_chegada: daysAgo(10 + i * 5).toISOString(),
      status: ['em_transito','desembaraço','concluido','planejamento'][i-1],
      ncm: '7219.32.00',
      incoterm: 'CIF',
    });
  }

  // Requisição de consumo
  for (let i = 1; i <= 6; i++) {
    const wo = wos[i % Math.max(wos.length, 1)];
    const prod = products[i % products.length];
    await addRecord('requisicao_consumo', {
      numero: `RC-2026-${String(i).padStart(3,'0')}`,
      op_numero: wo?.number ?? `OP-${i}`,
      produto: prod.code,
      produto_nome: prod.name,
      quantidade: 5 + i * 2,
      unidade: prod.unit,
      solicitante: 'Carlos Mendes',
      data_solicitacao: daysAgo(i * 3).toISOString(),
      status: ['pendente','atendido','parcial'][i % 3],
    });
  }

  // Transferências de estoque
  for (let i = 1; i <= 6; i++) {
    const prod = products[i % products.length];
    const locKeys = Object.keys(locs);
    await addRecord('transferencia_estoque', {
      numero: `TE-2026-${String(i).padStart(3,'0')}`,
      produto: prod.code,
      produto_nome: prod.name,
      quantidade: 10 + i * 3,
      origem: locKeys[i % locKeys.length],
      destino: locKeys[(i + 1) % locKeys.length],
      data: daysAgo(i * 4).toISOString(),
      status: ['concluido','pendente'][i % 2],
      operador: 'João Silva',
    });
  }

  // Lotes e séries
  for (let i = 1; i <= 8; i++) {
    const prod = products[i % products.length];
    await addRecord('lote_serie', {
      lote: `LOT-${new Date().getFullYear()}-${String(i).padStart(4,'0')}`,
      produto: prod.code,
      produto_nome: prod.name,
      quantidade: 20 + i * 5,
      fabricacao: daysAgo(60 + i * 10).toISOString(),
      validade: daysFrom(365 * 2).toISOString(),
      fornecedor: ['Aços Villares S.A.','Metais & Tubos São Paulo'][i % 2],
      localizacao: Object.keys(locs)[i % Object.keys(locs).length],
      status: ['disponivel','reservado','quarentena'][i % 3],
      certificado: `CERT-${2026}-${String(i).padStart(3,'0')}`,
    });
  }

  // Paradas e Esperas
  for (let i = 1; i <= 8; i++) {
    const machine = machines[i % Math.max(machines.length, 1)];
    const wo = wos[i % Math.max(wos.length, 1)];
    await addRecord('parada_maquina', {
      numero: `PAR-2026-${String(i).padStart(3,'0')}`,
      maquina: machine?.code ?? `MAQ-${i}`,
      maquina_nome: machine?.name ?? `Máquina ${i}`,
      op_numero: wo?.number ?? null,
      tipo: ['Manutenção Preventiva','Setup/Troca de ferramenta','Falta de material','Espera aprovação','Falha mecânica','Intervalo programado'][i % 6],
      inicio: daysAgo(5 + i).toISOString(),
      fim: new Date(daysAgo(5 + i).getTime() + (30 + i * 20) * 60000).toISOString(),
      duracao_min: 30 + i * 20,
      responsavel: 'Carlos Mendes',
      observacao: `Parada ${i} registrada em ${daysAgo(5 + i).toLocaleDateString('pt-BR')}`,
    });
  }

  // Fluxo de Caixa (entradas/saídas diárias)
  for (let d = 30; d >= 1; d--) {
    const date = daysAgo(d);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;
    await addRecord('fluxo_caixa', {
      data: date.toISOString(),
      tipo: d % 3 === 0 ? 'saida' : 'entrada',
      descricao: d % 3 === 0 ? 'Pagamento fornecedor' : 'Recebimento cliente',
      valor: 5000 + Math.floor(Math.random() * 15000),
      saldo_acumulado: 85000 + (30 - d) * 2000,
      conta: 'Conta Corrente BB – 12345-6',
    });
  }

  // Regua de cobrança (templates)
  const reguaDefs = [
    { nome: 'Cobrança Padrão 30 dias', tipo: 'boleto', dias_antes: 5, dias_depois: [3, 7, 15, 30], status: 'ativo' },
    { nome: 'Cobrança Premium – grandes clientes', tipo: 'email', dias_antes: 7, dias_depois: [5, 10], status: 'ativo' },
    { nome: 'Cobrança Simples', tipo: 'whatsapp', dias_antes: 2, dias_depois: [1, 3, 7], status: 'ativo' },
  ];
  for (const r of reguaDefs) {
    await addRecord('regua_cobranca', r);
  }

  // CRM Financeiro (acordos, parcelamentos)
  for (let i = 1; i <= 5; i++) {
    await addRecord('crm_financeiro', {
      numero: `CRMFIN-${String(i).padStart(3,'0')}`,
      cliente: recDefs[(i - 1) % recDefs.length].cliente,
      tipo: ['acordo_pagamento','parcelamento','desconto_quitacao','renegociacao'][i % 4],
      valor_original: 10000 + i * 2000,
      valor_acordo: 9500 + i * 1800,
      desconto_pct: 5,
      parcelas: i % 2 === 0 ? 3 : 1,
      status: i <= 3 ? 'ativo' : 'concluido',
      data_acordo: daysAgo(i * 10).toISOString(),
    });
  }

  // Plano de Produção (PCP)
  for (let i = 1; i <= 5; i++) {
    const prod = products.filter(p => p.code.startsWith('PA-'))[i % 5] ?? products[0];
    await addRecord('plano_producao', {
      codigo: `PP-2026-${String(i).padStart(2,'0')}`,
      produto: prod.code,
      produto_nome: prod.name,
      quantidade_planejada: 10 + i * 5,
      periodo: `2026-${String(4 + i).padStart(2,'0')}`,
      status: ['planejado','confirmado','em_producao','concluido'][i % 4],
      responsavel: 'Carlos Mendes',
    });
  }

  // Previsão de Vendas
  for (let m = 1; m <= 6; m++) {
    for (const prod of products.slice(0, 5)) {
      await addRecord('previsao_vendas', {
        produto: prod.code,
        produto_nome: prod.name,
        periodo: `2026-${String(m + 6).padStart(2,'0')}`,
        quantidade: 5 + m * 2 + Math.floor(Math.random() * 10),
        valor_estimado: Number(prod.salePrice ?? 1000) * (5 + m * 2),
        origem: ['historico','comercial','crm'][m % 3],
        confianca_pct: 60 + m * 5,
      });
    }
  }

  // ── 13. ACCOUNTING extras ─────────────────────────────────────────────────
  console.log('  📊 Contabilidade – lançamentos adicionais…');
  const accountEntries = [
    // Folha de pagamento
    { entryDate: daysAgo(2), description: 'Folha de Pagamento – Abril/2026', debitAccount: '6.1.1', creditAccount: '2.1.3', amount: 52000, origin: 'RH', module: 'rh' },
    // FGTS
    { entryDate: daysAgo(2), description: 'FGTS – Abril/2026', debitAccount: '6.1.2', creditAccount: '2.1.4', amount: 4160, origin: 'RH', module: 'rh' },
    // Depreciação
    { entryDate: daysAgo(1), description: 'Depreciação Equipamentos – Abril/2026', debitAccount: '6.2.1', creditAccount: '1.2.2', amount: 3800, origin: 'CONTABILIDADE', module: 'contabilidade' },
    // Despesas operacionais
    { entryDate: daysAgo(5), description: 'Energia Elétrica – Abril/2026', debitAccount: '6.3.1', creditAccount: '2.1.1', amount: 4200, origin: 'COMPRAS', module: 'financeiro' },
    { entryDate: daysAgo(4), description: 'Aluguel Imóvel Industrial – Abril/2026', debitAccount: '6.3.2', creditAccount: '2.1.1', amount: 8500, origin: 'COMPRAS', module: 'financeiro' },
    { entryDate: daysAgo(3), description: 'Serviços Contábeis – Abril/2026', debitAccount: '6.4.1', creditAccount: '2.1.1', amount: 2800, origin: 'COMPRAS', module: 'financeiro' },
    // Receitas serviços
    { entryDate: daysAgo(10), description: 'Receita de Serviços – Manutenção', debitAccount: '1.1.1', creditAccount: '3.2.1', amount: 7700, origin: 'FATURAMENTO', module: 'vendas' },
    // Impostos sobre vendas
    { entryDate: daysAgo(8), description: 'ISS s/Serviços – Abril/2026', debitAccount: '6.5.1', creditAccount: '2.1.5', amount: 385, origin: 'FISCAL', module: 'fiscal' },
    { entryDate: daysAgo(8), description: 'PIS/COFINS – Abril/2026', debitAccount: '6.5.2', creditAccount: '2.1.5', amount: 3420, origin: 'FISCAL', module: 'fiscal' },
    // Ajustes de estoque
    { entryDate: daysAgo(15), description: 'Ajuste de Inventário – Diferença de Contagem', debitAccount: '6.2.2', creditAccount: '1.1.3', amount: 850, origin: 'ESTOQUE', module: 'estoque' },
    // Entrada de matéria-prima
    { entryDate: daysAgo(20), description: 'Compra de Chapa Inox 304 – NF 00245', debitAccount: '1.1.3', creditAccount: '2.1.1', amount: 8400, origin: 'COMPRAS', module: 'compras' },
    // Pagamento de fornecedor
    { entryDate: daysAgo(18), description: 'Pagamento Aços Villares – OC-D001', debitAccount: '2.1.1', creditAccount: '1.1.1', amount: 8400, origin: 'FINANCEIRO', module: 'financeiro' },
  ];
  for (const entry of accountEntries) {
    await prisma.accountEntry.create({
      data: { id: uuid(), ...entry },
    });
  }

  // ── 14. Estoque Projetado (entity records) ────────────────────────────────
  for (const prod of products.slice(0, 8)) {
    await addRecord('estoque_projetado', {
      produto: prod.code,
      produto_nome: prod.name,
      estoque_atual: 20 + Math.floor(Math.random() * 80),
      reservado_op: 5 + Math.floor(Math.random() * 15),
      a_receber_oc: 10 + Math.floor(Math.random() * 20),
      projecao_30d: 25 + Math.floor(Math.random() * 50),
      ponto_pedido: Number(prod.minStock ?? 10),
      status: Math.random() > 0.3 ? 'ok' : 'critico',
    });
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n✅ Seed completo!\n');
  const counts = {
    Localizações: await prisma.location.count(),
    Apontamentos: await prisma.productionAppointment.count(),
    BOM_Lines: await prisma.billOfMaterialLine.count(),
    CRM_Processos: await prisma.crmProcess.count(),
    Projetos: await prisma.project.count(),
    KB_Categorias: await prisma.knowledgeCategory.count(),
    KB_Artigos: await prisma.knowledgeArticle.count(),
    Qualidade_Docs: await prisma.qualityDocument.count(),
    Qualidade_Databooks: await prisma.qualityDatabook.count(),
    Qualidade_Instrumentos: await prisma.qualityInstrument.count(),
    Qualidade_NCs: await prisma.qualityNonConformity.count(),
    Expedicao_Ordens: await prisma.expeditionOrder.count(),
    RH_Ponto: await prisma.timeEntry.count(),
    RH_Ferias: await prisma.leaveRequest.count(),
    RH_Folha: await prisma.payrollRun.count(),
    Fiscal_NFe: await prisma.fiscalNfe.count(),
  };
  console.table(counts);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
