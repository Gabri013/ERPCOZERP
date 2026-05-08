/**
 * TESTE DE ISOLAMENTO DE DADOS POR EMPRESA
 * 
 * Verifica se usuários de diferentes empresas podem acessar dados uns dos outros
 * Exectar com: npx tsx apps/backend/test-company-isolation.ts
 */

import { prisma } from './apps/backend/src/infra/prisma.js';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_change_me';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(msg: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function createTestCompanies() {
  log('\n📋 [SETUP] Criando empresas de teste...', 'blue');

  const company1 = await prisma.company.create({
    data: {
      cnpj: '11.111.111/1111-11',
      razaoSocial: 'Empresa A Teste',
      fantasia: 'Empresa A',
      ativo: true,
    },
  });

  const company2 = await prisma.company.create({
    data: {
      cnpj: '22.222.222/2222-22',
      razaoSocial: 'Empresa B Teste',
      fantasia: 'Empresa B',
      ativo: true,
    },
  });

  log(`✅ Empresa A criada: ${company1.id}`, 'green');
  log(`✅ Empresa B criada: ${company2.id}`, 'green');

  return { company1, company2 };
}

async function createTestUsers(company1Id: string, company2Id: string) {
  log('\n👤 [SETUP] Criando usuários de teste...', 'blue');

  const bcrypt = (await import('bcryptjs')).default;
  const passwordHash = await bcrypt.hash('test123456', 12);

  const user1 = await prisma.user.create({
    data: {
      email: 'user.company.a@test.local',
      passwordHash,
      fullName: 'User Empresa A',
      companyId: company1Id,
      active: true,
      emailVerified: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user.company.b@test.local',
      passwordHash,
      fullName: 'User Empresa B',
      companyId: company2Id,
      active: true,
      emailVerified: true,
    },
  });

  log(`✅ Usuário Empresa A criado: ${user1.id}`, 'green');
  log(`✅ Usuário Empresa B criado: ${user2.id}`, 'green');

  return { user1, user2 };
}

async function generateTestToken(userId: string, email: string, companyId: string) {
  const token = jwt.sign(
    {
      sub: userId,
      email,
      roles: ['user'],
      permissions: ['ver_pedidos'],
      companyId,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  return token;
}

async function createTestData(companyId: string, label: string) {
  log(`\n📝 [SETUP] Criando dados de teste para ${label}...`, 'blue');

  const entity = await prisma.entity.findUnique({ where: { code: 'pedido_venda' } });
  if (!entity) {
    log('⚠️  Entidade pedido_venda não encontrada', 'yellow');
    return null;
  }

  const record = await prisma.entityRecord.create({
    data: {
      entityId: entity.id,
      companyId,
      data: {
        numero: `PV-TEST-${label}`,
        cliente_nome: `Cliente ${label}`,
        status: 'aberta',
      },
      createdBy: 'test-setup',
    },
  });

  log(`✅ Pedido criado para ${label}: ${record.id}`, 'green');
  return record;
}

async function testIsolation() {
  log('\n🔒 [TESTE] Testando isolamento de dados...', 'blue');

  const { company1, company2 } = await createTestCompanies();
  const { user1, user2 } = await createTestUsers(company1.id, company2.id);
  const record1 = await createTestData(company1.id, 'A');
  const record2 = await createTestData(company2.id, 'B');

  if (!record1 || !record2) {
    log('❌ Falha ao criar dados de teste', 'red');
    return false;
  }

  const token1 = await generateTestToken(user1.id, user1.email, company1.id);
  const token2 = await generateTestToken(user2.id, user2.email, company2.id);

  log('\n🌐 [API] Testando acesso aos dados...', 'blue');

  // Teste 1: User 1 acessa dados da Empresa A
  try {
    const response = await fetch(`${API_URL}/api/records?entity=pedido_venda`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const data = (await response.json()) as { data?: unknown[] };
    const count = Array.isArray(data.data) ? data.data.length : 0;
    
    if (response.status === 200 && count > 0) {
      log(`✅ User1 (Empresa A) viu ${count} pedidos - ESPERADO`, 'green');
    } else {
      log(`❌ User1 (Empresa A) não conseguiu acessar dados - INESPERADO`, 'red');
    }
  } catch (e) {
    log(`❌ Erro ao testar User1: ${e instanceof Error ? e.message : e}`, 'red');
  }

  // Teste 2: User 2 acessa dados da Empresa B
  try {
    const response = await fetch(`${API_URL}/api/records?entity=pedido_venda`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    const data = (await response.json()) as { data?: unknown[] };
    const count = Array.isArray(data.data) ? data.data.length : 0;
    
    if (response.status === 200 && count > 0) {
      log(`✅ User2 (Empresa B) viu ${count} pedidos - ESPERADO`, 'green');
    } else {
      log(`❌ User2 (Empresa B) não conseguiu acessar dados - INESPERADO`, 'red');
    }
  } catch (e) {
    log(`❌ Erro ao testar User2: ${e instanceof Error ? e.message : e}`, 'red');
  }

  // Teste 3: Verificar isolamento
  log('\n🔍 [ISOLAMENTO] Verificando se dados estão isolados...', 'blue');
  
  try {
    const response1 = await fetch(`${API_URL}/api/records?entity=pedido_venda`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const response2 = await fetch(`${API_URL}/api/records?entity=pedido_venda`, {
      headers: { Authorization: `Bearer ${token2}` },
    });

    const data1 = (await response1.json()) as { data?: unknown[] };
    const data2 = (await response2.json()) as { data?: unknown[] };

    const count1 = Array.isArray(data1.data) ? data1.data.length : 0;
    const count2 = Array.isArray(data2.data) ? data2.data.length : 0;

    if (count1 === count2 && count1 > 0) {
      log(`⚠️  PROBLEMA: User1 e User2 viram ${count1} registros cada`, 'red');
      log('Ambas empresas vendo os mesmos dados! Isolamento NÃO funciona.', 'red');
      return false;
    } else if (count1 > 0 && count2 > 0) {
      log(`✅ SUCESSO: Isolamento funcionando!`, 'green');
      log(`   User1 (Empresa A): ${count1} registros`, 'green');
      log(`   User2 (Empresa B): ${count2} registros`, 'green');
      return true;
    }
  } catch (e) {
    log(`❌ Erro ao verificar isolamento: ${e instanceof Error ? e.message : e}`, 'red');
  }

  return false;
}

async function cleanup() {
  log('\n🧹 [CLEANUP] Removendo dados de teste...', 'blue');

  try {
    // Remover usuários
    await prisma.user.deleteMany({
      where: { email: { contains: '@test.local' } },
    });

    // Remover empresas
    await prisma.company.deleteMany({
      where: { cnpj: { in: ['11.111.111/1111-11', '22.222.222/2222-22'] } },
    });

    // Remover registros
    await prisma.entityRecord.deleteMany({
      where: { data: { path: ['numero'], contains: 'PV-TEST' } },
    });

    log('✅ Cleanup concluído', 'green');
  } catch (e) {
    log(`⚠️  Erro no cleanup: ${e instanceof Error ? e.message : e}`, 'yellow');
  }
}

async function main() {
  log('\n' + '='.repeat(60), 'blue');
  log('  TESTE DE ISOLAMENTO DE DADOS POR EMPRESA', 'blue');
  log('='.repeat(60), 'blue');

  try {
    const result = await testIsolation();

    log('\n' + '='.repeat(60), 'blue');
    if (result) {
      log('✅ ISOLAMENTO FUNCIONANDO CORRETAMENTE', 'green');
    } else {
      log('❌ ISOLAMENTO NÃO FUNCIONA - NECESSÁRIO CORRIGIR', 'red');
    }
    log('='.repeat(60), 'blue');
  } catch (e) {
    log(`\n❌ Erro fatal: ${e instanceof Error ? e.message : e}`, 'red');
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
