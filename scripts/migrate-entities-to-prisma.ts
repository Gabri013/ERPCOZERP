#!/usr/bin/env node

/**
 * Script de Migração: EntityRecords → Prisma Models
 * Executa migração de dados do sistema legado para Prisma
 *
 * Uso: node scripts/migrate-entities-to-prisma.js
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const prisma = new PrismaClient();

// Mapeamento entity code → Prisma model
const ENTITY_TO_MODEL = {
  'cliente': 'Customer',
  'fornecedor': 'Supplier',
  'produto': 'Product',
  'movimentacao_estoque': 'StockMovement',
  'pedido_venda': 'SaleOrder',
  'orcamento': 'Quote',
  'ordem_compra': 'PurchaseOrder',
  'tabela_preco': 'PriceTable',
  'conta_receber': 'AccountEntry',
  'conta_pagar': 'AccountEntry',
  'ordem_producao': 'WorkOrder',
  'apontamento_producao': 'ProductionAppointment',
  'rh_funcionario': 'Employee',
  'fiscal_nfe': 'FiscalNfe',
  'crm_lead': 'SalesOpportunity',
  'crm_oportunidade': 'SalesOpportunity',
  'crm_atividade': 'SalesActivity',
  'crm_rules': 'CrmProcess',
  'cotacao_compra': 'Quote',
  'historico_op': 'WorkOrderStatusHistory',
  'workflow': 'CrmProcess'
};

// Função para migrar uma entity específica
async function migrateEntity(entityCode, modelName) {
  console.log(`\n🔄 Migrando ${entityCode} → ${modelName}`);

  try {
    // Buscar EntityRecords
    const entity = await prisma.entity.findUnique({
      where: { code: entityCode }
    });

    if (!entity) {
      console.log(`⚠️  Entity ${entityCode} não encontrada, pulando`);
      return;
    }

    const records = await prisma.entityRecord.findMany({
      where: { entityId: entity.id, deletedAt: null }
    });

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
    console.error(`❌ Erro migrando ${entityCode}:`, error.message);
  }
}

// Implementações específicas de migração
async function migrateCustomers(records) {
  for (const record of records) {
    const data = record.data;
    await prisma.customer.create({
      data: {
        legacyId: record.id,
        code: data.codigo || `C${record.id}`,
        name: data.razaoSocial || data.nome || 'Cliente',
        document: data.cnpj || data.cpf,
        email: data.email,
        phone: data.telefone,
        address: data.endereco,
        city: data.cidade,
        state: data.estado,
        zipCode: data.cep,
        active: data.ativo !== false,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }
    });
  }
}

async function migrateSuppliers(records) {
  for (const record of records) {
    const data = record.data;
    await prisma.supplier.create({
      data: {
        legacyId: record.id,
        code: data.codigo || `F${record.id}`,
        name: data.razaoSocial || data.nome || 'Fornecedor',
        document: data.cnpj,
        email: data.email,
        phone: data.telefone,
        address: data.endereco,
        city: data.cidade,
        state: data.estado,
        zipCode: data.cep,
        active: data.ativo !== false,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }
    });
  }
}

async function migrateProducts(records) {
  for (const record of records) {
    const data = record.data;
    await prisma.product.create({
      data: {
        legacyId: record.id,
        code: data.codigo || `P${record.id}`,
        name: data.nome || 'Produto',
        description: data.descricao,
        unit: data.unidade || 'UN',
        price: data.preco ? parseFloat(data.preco) : 0,
        cost: data.custo ? parseFloat(data.custo) : 0,
        stock: data.estoqueAtual ? parseFloat(data.estoqueAtual) : 0,
        minStock: data.estoqueMinimo ? parseFloat(data.estoqueMinimo) : 0,
        active: data.ativo !== false,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }
    });
  }
}

async function migrateStockMovements(records) {
  for (const record of records) {
    const data = record.data;
    const product = await prisma.product.findFirst({
      where: { legacyId: data.produtoId }
    });
    if (!product) continue;

    await prisma.stockMovement.create({
      data: {
        legacyId: record.id,
        productId: product.id,
        type: data.tipo === 'entrada' ? 'ENTRADA' : 'SAIDA',
        quantity: parseFloat(data.quantidade || 0),
        notes: data.motivo || 'Migrado do legado',
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }
    });
  }
}

async function migrateSaleOrders(records) {
  for (const record of records) {
    const data = record.data;
    const customer = await prisma.customer.findFirst({
      where: { legacyId: data.clienteId }
    });
    if (!customer) continue;

    await prisma.saleOrder.create({
      data: {
        legacyId: record.id,
        number: data.numero || `PV${record.id}`,
        customerId: customer.id,
        total: parseFloat(data.total || 0),
        status: data.status === 'aprovado' ? 'APPROVED' : 'PENDING',
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }
    });
  }
}

async function migrateQuotes(records) {
  for (const record of records) {
    const data = record.data;
    const customer = data.clienteId ? await prisma.customer.findFirst({
      where: { legacyId: data.clienteId }
    }) : null;

    await prisma.quote.create({
      data: {
        legacyId: record.id,
        number: data.numero || `Q${record.id}`,
        customerId: customer?.id,
        total: parseFloat(data.total || 0),
        validUntil: data.validade ? new Date(data.validade) : null,
        status: data.status === 'aprovado' ? 'APPROVED' : 'DRAFT',
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }
    });
  }
}

async function migratePurchaseOrders(records) {
  for (const record of records) {
    const data = record.data;
    const supplier = await prisma.supplier.findFirst({
      where: { legacyId: data.fornecedorId }
    });
    if (!supplier) continue;

    await prisma.purchaseOrder.create({
      data: {
        legacyId: record.id,
        number: data.numero || `OC${record.id}`,
        supplierId: supplier.id,
        total: parseFloat(data.total || 0),
        status: data.status === 'recebido' ? 'RECEIVED' : 'PENDING',
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }
    });
  }
}

async function migrateWorkOrders(records) {
  for (const record of records) {
    const data = record.data;
    const product = await prisma.product.findFirst({
      where: { legacyId: data.produtoId }
    });
    if (!product) continue;

    await prisma.workOrder.create({
      data: {
        legacyId: record.id,
        number: data.numero || `OP${record.id}`,
        productId: product.id,
        quantityPlanned: parseFloat(data.quantidade || 1),
        status: data.status === 'concluida' ? 'DONE' : 'PLANNED',
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }
    });
  }
}

async function migrateSalesOpportunities(records, entityCode) {
  for (const record of records) {
    const data = record.data;
    const customer = data.clienteId ? await prisma.customer.findFirst({
      where: { legacyId: data.clienteId }
    }) : null;

    await prisma.salesOpportunity.create({
      data: {
        legacyId: record.id,
        title: data.titulo || 'Oportunidade',
        customerId: customer?.id,
        value: parseFloat(data.valor || 0),
        status: entityCode === 'crm_lead' ? 'LEAD' : 'QUALIFIED',
        stage: data.stage || 'Novo',
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }
    });
  }
}

async function migrateSalesActivities(records) {
  for (const record of records) {
    const data = record.data;
    const opportunity = data.oportunidadeId ? await prisma.salesOpportunity.findFirst({
      where: { legacyId: data.oportunidadeId }
    }) : null;

    await prisma.salesActivity.create({
      data: {
        legacyId: record.id,
        opportunityId: opportunity?.id,
        type: data.tipo || 'chamada',
        description: data.descricao || 'Atividade migrada',
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }
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
  main();
}

export { migrateEntity };