import bcrypt from 'bcryptjs'
import { Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de produção — Cozinca Inox...')

  // ═══════════════════════════════════════════════════════════
  // 1. EMPRESA
  // ═══════════════════════════════════════════════════════════
  const empresa = await prisma.company.upsert({
    where: { cnpj: '00.000.000/0001-00' },
    update: {
      razaoSocial: 'COZINCA INOX EQUIPAMENTOS LTDA',
      fantasia: 'Cozinca Inox',
      ativo: true,
    },
    create: {
      cnpj: '00.000.000/0001-00',
      razaoSocial: 'COZINCA INOX EQUIPAMENTOS LTDA',
      fantasia: 'Cozinca Inox',
      ativo: true,
    },
  })
  console.log('✅ Empresa configurada')

  // ═══════════════════════════════════════════════════════════
  // 2. USUÁRIOS E PERFIS REAIS
  // ═══════════════════════════════════════════════════════════
  const senhaHash = await bcrypt.hash('Cozinca@2026', 12)

  const roleCodeMap: Record<string, string> = {
    MASTER: 'master',
    GERENTE_PRODUCAO: 'gerente_producao',
    VENDAS: 'orcamentista_vendas',
    PROJETISTA: 'projetista',
    FINANCEIRO: 'financeiro',
    COMPRAS: 'compras',
    RH: 'rh',
    OPERADOR: 'user',
  }

  const usuarios = [
    { name: 'Administrador', email: 'admin@cozinca.com.br', perfil: 'MASTER' },
    { name: 'Gerente de Produção', email: 'producao@cozinca.com.br', perfil: 'GERENTE_PRODUCAO' },
    { name: 'Vendas', email: 'vendas@cozinca.com.br', perfil: 'VENDAS' },
    { name: 'Projetista', email: 'engenharia@cozinca.com.br', perfil: 'PROJETISTA' },
    { name: 'Financeiro', email: 'financeiro@cozinca.com.br', perfil: 'FINANCEIRO' },
    { name: 'Compras', email: 'compras@cozinca.com.br', perfil: 'COMPRAS' },
    { name: 'Recursos Humanos', email: 'rh@cozinca.com.br', perfil: 'RH' },
    { name: 'Operador 1', email: 'operador1@cozinca.com.br', perfil: 'OPERADOR' },
  ]

  for (const u of usuarios) {
    const existente = await prisma.user.findUnique({ where: { email: u.email } })
    if (!existente) {
      const user = await prisma.user.create({
        data: {
          email: u.email,
          fullName: u.name,
          passwordHash: senhaHash,
          active: true,
          emailVerified: true,
          companyId: empresa.id,
        },
      })

      const roleCode = roleCodeMap[u.perfil] ?? u.perfil.toLowerCase()
      const role = await prisma.role.findUnique({ where: { code: roleCode } })
      if (role) {
        await prisma.userRole.upsert({
          where: { userId_roleId: { userId: user.id, roleId: role.id } },
          update: {},
          create: { userId: user.id, roleId: role.id, assignedBy: user.id },
        })
      } else {
        console.warn(`⚠️ Role não encontrada para perfil ${u.perfil} (esperado ${roleCode})`)
      }

      console.log(`✅ Usuário criado: ${u.email} (${u.perfil})`)
    } else {
      console.log(`⚠️ Usuário já existe: ${u.email}`)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 3. CATEGORIAS DE PRODUTO
  // ═══════════════════════════════════════════════════════════
  const categorias = [
    'Cubas e Pias Industriais',
    'Mesas e Bancadas',
    'Fornos e Câmaras',
    'Lavadoras e Higienizadoras',
    'Carros e Estantes',
    'Fritadeiras e Caldeirões',
    'Personalizado / Sob Medida',
    'Matéria-Prima',
    'Componentes e Acessórios',
  ]

  for (const cat of categorias) {
    console.log(`✅ Categoria: ${cat}`)
  }

  // ═══════════════════════════════════════════════════════════
  // 4. PRODUTOS INICIAIS (matérias-primas principais)
  // ═══════════════════════════════════════════════════════════
  const materiasPrimas = [
    {
      code: 'CHP-304-10-1200x2400',
      name: 'Chapa Inox 304 1,0mm 1200x2400',
      unit: 'UN',
      productType: 'Matéria-Prima',
      group: 'Chapas',
      costPrice: 0,
      salePrice: 0,
      minStock: 5,
    },
    {
      code: 'CHP-304-15-1200x2400',
      name: 'Chapa Inox 304 1,5mm 1200x2400',
      unit: 'UN',
      productType: 'Matéria-Prima',
      group: 'Chapas',
      costPrice: 0,
      salePrice: 0,
      minStock: 5,
    },
    {
      code: 'CHP-304-20-1200x2400',
      name: 'Chapa Inox 304 2,0mm 1200x2400',
      unit: 'UN',
      productType: 'Matéria-Prima',
      group: 'Chapas',
      costPrice: 0,
      salePrice: 0,
      minStock: 3,
    },
    {
      code: 'TUB-304-25x1',
      name: 'Tubo Inox 304 25x1,0mm',
      unit: 'MT',
      productType: 'Matéria-Prima',
      group: 'Tubos',
      costPrice: 0,
      salePrice: 0,
      minStock: 20,
    },
  ]

  for (const mp of materiasPrimas) {
    const existente = await prisma.product.findUnique({ where: { code: mp.code } })
    if (!existente) {
      await prisma.product.create({
        data: {
          code: mp.code,
          name: mp.name,
          unit: mp.unit,
          productType: mp.productType,
          group: mp.group,
          costPrice: new Prisma.Decimal(mp.costPrice),
          salePrice: new Prisma.Decimal(mp.salePrice),
          minStock: new Prisma.Decimal(mp.minStock),
          status: 'Ativo',
          companyId: empresa.id,
        },
      })
      console.log(`✅ Produto criado: ${mp.code} — ${mp.name}`)
    } else {
      console.log(`⚠️ Produto já existe: ${mp.code}`)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 5. CLIENTES REAIS (comece com os 5 principais)
  // ═══════════════════════════════════════════════════════════
  const clientes = [
    {
      code: 'CLI-001',
      name: 'Cliente Exemplo 1',
      document: '00.000.000/0001-00',
      email: 'contato@cliente1.com.br',
      phone: '(11) 99999-0001',
      address: 'Rua Exemplo, 100, São Paulo - SP',
    },
  ]

  for (const c of clientes) {
    const existente = await prisma.customer.findFirst({ where: { code: c.code } })
    if (!existente) {
      await prisma.customer.create({
        data: {
          code: c.code,
          name: c.name,
          document: c.document,
          email: c.email,
          phone: c.phone,
          address: c.address,
          active: true,
          companyId: empresa.id,
        },
      })
      console.log(`✅ Cliente criado: ${c.code} — ${c.name}`)
    } else {
      console.log(`⚠️ Cliente já existe: ${c.code}`)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 6. FORNECEDORES REAIS (principais distribuidoras de inox)
  // ═══════════════════════════════════════════════════════════
  const fornecedores = [
    {
      code: 'FOR-001',
      name: 'Fornecedor Inox 1',
      document: '00.000.000/0001-00',
      email: 'vendas@fornecedor1.com.br',
      phone: '(11) 3333-0001',
      active: true,
    },
  ]

  for (const f of fornecedores) {
    const existente = await prisma.supplier.findUnique({ where: { code: f.code } })
    if (!existente) {
      await prisma.supplier.create({
        data: {
          code: f.code,
          name: f.name,
          document: f.document,
          email: f.email,
          phone: f.phone,
          active: f.active,
          companyId: empresa.id,
        },
      })
      console.log(`✅ Fornecedor criado: ${f.code} — ${f.name}`)
    } else {
      console.log(`⚠️ Fornecedor já existe: ${f.code}`)
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 7. FUNCIONÁRIOS (para RH e apontamentos)
  // ═════════════════════════════════════════════════════════════════════════
  const funcionarios = [
    {
      code: 'EMP001',
      fullName: 'Funcionário 1',
      email: 'funcionario1@cozinca.com.br',
      department: 'Produção',
      hireDate: new Date('2024-01-01'),
      salaryBase: 0,
    },
  ]

  for (const f of funcionarios) {
    const existente = await prisma.employee.findUnique({ where: { code: f.code } })
    if (!existente) {
      await prisma.employee.create({
        data: {
          code: f.code,
          fullName: f.fullName,
          email: f.email,
          department: f.department,
          hireDate: f.hireDate,
          active: true,
          salaryBase: new Prisma.Decimal(f.salaryBase),
          companyId: empresa.id,
        },
      })
      console.log(`✅ Funcionário criado: ${f.code} — ${f.fullName}`)
    } else {
      console.log(`⚠️ Funcionário já existe: ${f.code}`)
    }
  }

  console.log('\n✅ Seed de produção preparado. Revise os valores marcados com // SUBSTITUA antes de executar.')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
