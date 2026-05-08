#!/usr/bin/env node

/**
 * Script de Migração: EntityRecords → Prisma Models
 * Executa migração de dados do sistema legado para Prisma
 *
 * Uso: node scripts/migrate-entities-to-prisma.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapeamento entity code → Prisma model
const ENTITY_TO_MODEL = {
  cliente: 'Customer',
  fornecedor: 'Supplier',
  produto: 'Product',
  movimentacao_estoque: 'StockMovement',
  pedido_venda: 'SaleOrder',
  orcamento: 'Quote',
  ordem_compra: 'PurchaseOrder',
  tabela_preco: 'PriceTable',
  conta_receber: 'AccountEntry',
  conta_pagar: 'AccountEntry',
  ordem_producao: 'WorkOrder',
  apontamento_producao: 'ProductionAppointment',
  rh_funcionario: 'Employee',
  fiscal_nfe: 'FiscalNfe',
  crm_lead: 'SalesOpportunity',
  crm_oportunidade: 'SalesOpportunity',
  crm_atividade: 'SalesActivity',
  crm_rules: 'CrmProcess',
  cotacao_compra: 'Quote',
  historico_op: 'WorkOrderStatusHistory',
  workflow: 'CrmProcess',
};

type LegacyRecord = {
  id: string;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

// Função para migrar uma entity específica
async function migrateEntity(entityCode: string, modelName: string) {
  console.log(`\n🔄 Migrando ${entityCode} → ${modelName}`);

  try {
    // Buscar EntityRecords
    const entity = await prisma.entity.findUnique({
      where: { code: entityCode },
    });

    if (!entity) {
      console.log(`⚠️  Entity ${entityCode} não encontrada, pulando`);
      return;
    }

    const records = (await prisma.entityRecord.findMany({
      where: { entityId: entity.id, deletedAt: null },
    })) as LegacyRecord[];

    console.log(`📊 Encontrados ${records.length} registros`);

    if (records.length === 0) return;

    // Migrar baseado no tipo
    switch (entityCode) {
      case 'cliente':
        await migrateCustomers(records);
        break;
      case 'fornecedor':
        await migrateSuppliers(records);
        break;
      case 'produto':
        await migrateProducts(records);
        break;
      case 'movimentacao_estoque':
        await migrateStockMovements(records);
        break;
      case 'pedido_venda':
        await migrateSaleOrders(records);
        break;
      case 'orcamento':
        await migrateQuotes(records);
        break;
      case 'ordem_compra':
        await migratePurchaseOrders(records);
        break;
      case 'ordem_producao':
        await migrateWorkOrders(records);
        break;
      case 'crm_lead':
      case 'crm_oportunidade':
        await migrateSalesOpportunities(records, entityCode);
        break;
      case 'crm_atividade':
        await migrateSalesActivities(records);
        break;
      default:
        console.log(`⚠️  Migração para ${entityCode} não implementada ainda`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Erro migrando ${entityCode}:`, message);
  }
}

// Implementações específicas de migração
async function migrateCustomers(records: LegacyRecord[]) {
  for (const record of records) {
    const data = record.data;
    await prisma.customer.create({
      data: {
        legacyId: Number(record.id),
        code: String(data.codigo || `C${record.id}`),
        name: String(data.razaoSocial || data.nome || 'Cliente'),
        document: (data.cnpj as string | undefined) || (data.cpf as string | undefined),
        email: data.email as string | undefined,
        phone: data.telefone as string | undefined,
        address: data.endereco as string | undefined,
        city: data.cidade as string | undefined,
        state: data.estado as string | undefined,
        zipCode: data.cep as string | undefined,
        active: data.ativo !== false,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  }
}

async function migrateSuppliers(records: LegacyRecord[]) {
  for (const record of records) {
    const data = record.data;
    await prisma.supplier.create({
      data: {
        legacyId: Number(record.id),
        code: String(data.codigo || `F${record.id}`),
        name: String(data.razaoSocial || data.nome || 'Fornecedor'),
        document: data.cnpj as string | undefined,
        email: data.email as string | undefined,
        phone: data.telefone as string | undefined,
        address: data.endereco as string | undefined,
        city: data.cidade as string | undefined,
        state: data.estado as string | undefined,
        zipCode: data.cep as string | undefined,
        active: data.ativo !== false,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  }
}

async function migrateProducts(records: LegacyRecord[]) {
  for (const record of records) {
    const data = record.data;
    await prisma.product.create({
      data: {
        legacyId: Number(record.id),
        code: String(data.codigo || `P${record.id}`),
        name: String(data.nome || 'Produto'),
        description: data.descricao as string | undefined,
        unit: String(data.unidade || 'UN'),
        price: data.preco ? parseFloat(String(data.preco)) : 0,
        cost: data.custo ? parseFloat(String(data.custo)) : 0,
        stock: data.estoqueAtual ? parseFloat(String(data.estoqueAtual)) : 0,
        minStock: data.estoqueMinimo ? parseFloat(String(data.estoqueMinimo)) : 0,
        active: data.ativo !== false,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  }
}

async function migrateStockMovements(records: LegacyRecord[]) {
  for (const record of records) {
    const data = record.data;
    const product = await prisma.product.findFirst({
      where: { legacyId: Number(data.produtoId) },
    });
    if (!product) continue;

    await prisma.stockMovement.create({
      data: {
        legacyId: Number(record.id),
        productId: product.id,
        type: String(data.tipo) === 'entrada' ? 'ENTRADA' : 'SAIDA',
        quantity: parseFloat(String(data.quantidade || 0)),
        notes: String(data.motivo || 'Migrado do legado'),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  }
}

async function migrateSaleOrders(records: LegacyRecord[]) {
  for (const record of records) {
    const data = record.data;
    const customer = await prisma.customer.findFirst({
      where: { legacyId: Number(data.clienteId) },
    });
    if (!customer) continue;

    await prisma.saleOrder.create({
      data: {
        legacyId: Number(record.id),
        number: String(data.numero || `PV${record.id}`),
        customerId: customer.id,
        total: parseFloat(String(data.total || 0)),
        status: String(data.status) === 'aprovado' ? 'APPROVED' : 'PENDING',
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  }
}

async function migrateQuotes(records: LegacyRecord[]) {
  for (const record of records) {
    const data = record.data;
    const customer = data.clienteId
      ? await prisma.customer.findFirst({
          where: { legacyId: Number(data.clienteId) },
        })
      : null;

    await prisma.quote.create({
      data: {
        legacyId: Number(record.id),
        number: String(data.numero || `Q${record.id}`),
        customerId: customer?.id,
        total: parseFloat(String(data.total || 0)),
        validUntil: data.validade ? new Date(String(data.validade)) : null,
        status: String(data.status) === 'aprovado' ? 'APPROVED' : 'DRAFT',
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  }
}

async function migratePurchaseOrders(records: LegacyRecord[]) {
  for (const record of records) {
    const data = record.data;
    const supplier = await prisma.supplier.findFirst({
      where: { legacyId: Number(data.fornecedorId) },
    });
    if (!supplier) continue;

    await prisma.purchaseOrder.create({
      data: {
        legacyId: Number(record.id),
        number: String(data.numero || `OC${record.id}`),
        supplierId: supplier.id,
        total: parseFloat(String(data.total || 0)),
        status: String(data.status) === 'recebido' ? 'RECEIVED' : 'PENDING',
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  }
}

async function migrateWorkOrders(records: LegacyRecord[]) {
  for (const record of records) {
    const data = record.data;
    const product = await prisma.product.findFirst({
      where: { legacyId: Number(data.produtoId) },
    });
    if (!product) continue;

    await prisma.workOrder.create({
      data: {
        legacyId: Number(record.id),
        number: String(data.numero || `OP${record.id}`),
        productId: product.id,
        quantityPlanned: parseFloat(String(data.quantidade || 1)),
        status: String(data.status) === 'concluida' ? 'DONE' : 'PLANNED',
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  }
}

async function migrateSalesOpportunities(records: LegacyRecord[], entityCode: string) {
  for (const record of records) {
    const data = record.data;
    const customer = data.clienteId
      ? await prisma.customer.findFirst({
          where: { legacyId: Number(data.clienteId) },
        })
      : null;

    await prisma.salesOpportunity.create({
      data: {
        legacyId: Number(record.id),
        title: String(data.titulo || 'Oportunidade'),
        customerId: customer?.id,
        value: parseFloat(String(data.valor || 0)),
        status: entityCode === 'crm_lead' ? 'LEAD' : 'QUALIFIED',
        stage: String(data.stage || 'Novo'),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  }
}

async function migrateSalesActivities(records: LegacyRecord[]) {
  for (const record of records) {
    const data = record.data;
    const opportunity = data.oportunidadeId
      ? await prisma.salesOpportunity.findFirst({
          where: { legacyId: Number(data.oportunidadeId) },
        })
      : null;

    await prisma.salesActivity.create({
      data: {
        legacyId: Number(record.id),
        opportunityId: opportunity?.id,
        type: String(data.tipo || 'chamada'),
        description: String(data.descricao || 'Atividade migrada'),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando migração EntityRecords → Prisma Models\n');

  try {
    // Executar migração para cada entity
    for (const [entityCode, modelName] of Object.entries(ENTITY_TO_MODEL)) {
      await migrateEntity(entityCode, modelName);
    }

    console.log('\n✅ Migração concluída com sucesso!');
    console.log('📝 Verifique os dados migrados antes de remover EntityRecords');
  } catch (error) {
    console.error('\n❌ Erro durante migração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}

export { migrateEntity };