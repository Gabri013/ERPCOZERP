/**
 * seed-demo.ts — Dados de demonstração completos
 * Fluxo: CRM → Orçamento → Pedido de Venda → OP → Qualidade → Expedição → Financeiro
 * Execute: npx tsx prisma/seed-demo.ts
 */
import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uuid = () => randomUUID();
const d = (iso: string) => new Date(iso);
const dec = (v: number) => new Prisma.Decimal(v);

function daysAgo(n: number) {
  const dt = new Date();
  dt.setDate(dt.getDate() - n);
  return dt;
}
function daysFrom(n: number) {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt;
}

// ─── Master user ──────────────────────────────────────────────────────────────
async function getMaster() {
  const u = await prisma.user.findFirst({ where: { email: { contains: 'master' } } });
  if (!u) throw new Error('Master user not found — run seed.ts first');
  return u;
}

// ─── 1. Clientes (15) ─────────────────────────────────────────────────────────
const CUSTOMERS_DATA = [
  { code: 'CLI-D01', name: 'Metalúrgica São Paulo Ltda',     document: '12.345.678/0001-01', city: 'São Paulo',        state: 'SP', contact: 'Marco Ferreira',    phone: '(11) 3001-0001', email: 'compras@metsp.com.br',    segment: 'Metalurgia' },
  { code: 'CLI-D02', name: 'SiderTech Indústria S/A',        document: '23.456.789/0001-02', city: 'Campinas',         state: 'SP', contact: 'Ana Ramos',         phone: '(19) 3002-0002', email: 'suprimentos@sidertech.com', segment: 'Siderurgia' },
  { code: 'CLI-D03', name: 'AutoPeças Norte Ltda',           document: '34.567.890/0001-03', city: 'Manaus',           state: 'AM', contact: 'João Pereira',      phone: '(92) 3003-0003', email: 'compras@autopnorte.com.br', segment: 'Autopeças' },
  { code: 'CLI-D04', name: 'TechParts Brasil S/A',           document: '45.678.901/0001-04', city: 'Belo Horizonte',   state: 'MG', contact: 'Carla Souza',       phone: '(31) 3004-0004', email: 'procurement@techpartsbr.com', segment: 'Tecnologia' },
  { code: 'CLI-D05', name: 'Ind. Alimentícia Bela Vista',    document: '56.789.012/0001-05', city: 'Ribeirão Preto',   state: 'SP', contact: 'Roberto Lima',      phone: '(16) 3005-0005', email: 'manutencao@belavista.ind.br', segment: 'Alimentos' },
  { code: 'CLI-D06', name: 'Petroquímica Sul S/A',           document: '67.890.123/0001-06', city: 'Porto Alegre',     state: 'RS', contact: 'Fernanda Costa',    phone: '(51) 3006-0006', email: 'engenharia@petroquimicasul.com', segment: 'Petroquímica' },
  { code: 'CLI-D07', name: 'MaquinBras Equipamentos',        document: '78.901.234/0001-07', city: 'Sorocaba',         state: 'SP', contact: 'Paulo Martins',     phone: '(15) 3007-0007', email: 'compras@maquinbras.com.br', segment: 'Equipamentos' },
  { code: 'CLI-D08', name: 'Agroindustrial Cerrado Ltda',    document: '89.012.345/0001-08', city: 'Uberlândia',       state: 'MG', contact: 'Silvia Braga',      phone: '(34) 3008-0008', email: 'manutencao@cerradoagro.com.br', segment: 'Agronegócio' },
  { code: 'CLI-D09', name: 'Naval Systems do Brasil',        document: '90.123.456/0001-09', city: 'Santos',           state: 'SP', contact: 'Eduardo Fonseca',   phone: '(13) 3009-0009', email: 'projetos@navalsystems.com.br', segment: 'Naval' },
  { code: 'CLI-D10', name: 'Construção Pesada Omega',        document: '01.234.567/0001-10', city: 'Goiânia',          state: 'GO', contact: 'Beatriz Alves',     phone: '(62) 3010-0010', email: 'suprimentos@omegacivil.com.br', segment: 'Construção' },
  { code: 'CLI-D11', name: 'Frigorífico Nobre S/A',          document: '11.222.333/0001-11', city: 'Cascavel',         state: 'PR', contact: 'Marcos Prado',      phone: '(45) 3011-0011', email: 'engenharia@frignobre.com.br', segment: 'Frigorífico' },
  { code: 'CLI-D12', name: 'Madeireira Amazônia Ltda',       document: '22.333.444/0001-12', city: 'Belém',            state: 'PA', contact: 'Yasmin Torres',     phone: '(91) 3012-0012', email: 'compras@madamazonia.com.br', segment: 'Madeira' },
  { code: 'CLI-D13', name: 'Cervejaria Horizonte',           document: '33.444.555/0001-13', city: 'Belo Horizonte',   state: 'MG', contact: 'Lucas Mendes',      phone: '(31) 3013-0013', email: 'manutencao@cervejariah.com.br', segment: 'Bebidas' },
  { code: 'CLI-D14', name: 'Textil Catarinense Ltda',        document: '44.555.666/0001-14', city: 'Blumenau',         state: 'SC', contact: 'Tatiane Ritter',    phone: '(47) 3014-0014', email: 'engenharia@textilcat.com.br', segment: 'Têxtil' },
  { code: 'CLI-D15', name: 'Energia Renovável do Norte',     document: '55.666.777/0001-15', city: 'Fortaleza',        state: 'CE', contact: 'Alexandre Nobre',   phone: '(85) 3015-0015', email: 'projetos@energiarenovavelnorte.com.br', segment: 'Energia' },
];

// ─── 2. Fornecedores (8) ──────────────────────────────────────────────────────
const SUPPLIERS_DATA = [
  { code: 'FOR-D01', name: 'AçoNacional Distribuidora',     document: '11.111.111/0001-01', city: 'São Paulo',     state: 'SP', leadDays: 5  },
  { code: 'FOR-D02', name: 'Rolamentos Premium Ltda',        document: '22.222.222/0001-02', city: 'Campinas',     state: 'SP', leadDays: 7  },
  { code: 'FOR-D03', name: 'TuboPerfil Indústria',           document: '33.333.333/0001-03', city: 'São Paulo',    state: 'SP', leadDays: 10 },
  { code: 'FOR-D04', name: 'Motores & Cia Ltda',             document: '44.444.444/0001-04', city: 'Joinville',    state: 'SC', leadDays: 14 },
  { code: 'FOR-D05', name: 'Fixadores Industriais BR',       document: '55.555.555/0001-05', city: 'São Paulo',    state: 'SP', leadDays: 3  },
  { code: 'FOR-D06', name: 'Inox Especial Ltda',             document: '66.666.666/0001-06', city: 'Porto Alegre', state: 'RS', leadDays: 8  },
  { code: 'FOR-D07', name: 'Tintas e Acabamentos Pro',       document: '77.777.777/0001-07', city: 'São Paulo',    state: 'SP', leadDays: 4  },
  { code: 'FOR-D08', name: 'Eletrônica Industrial MG',       document: '88.888.888/0001-08', city: 'Contagem',     state: 'MG', leadDays: 12 },
];

// ─── 3. Produtos (20) ─────────────────────────────────────────────────────────
const PRODUCTS_DATA = [
  // Produtos acabados
  { code: 'PA-EIX-032',  name: 'Eixo Transmissão 32mm Inox',     unit: 'UN', type: 'Produto',    group: 'Eixos',        cost: 220,  sale: 380,  min: 5,  qty: 28 },
  { code: 'PA-EIX-050',  name: 'Eixo Transmissão 50mm Inox',     unit: 'UN', type: 'Produto',    group: 'Eixos',        cost: 480,  sale: 820,  min: 3,  qty: 12 },
  { code: 'PA-FLA-2IN',  name: 'Flange Aço Inox 2"',             unit: 'UN', type: 'Produto',    group: 'Flanges',      cost: 35,   sale: 65,   min: 20, qty: 85 },
  { code: 'PA-FLA-4IN',  name: 'Flange Aço Inox 4"',             unit: 'UN', type: 'Produto',    group: 'Flanges',      cost: 68,   sale: 125,  min: 10, qty: 42 },
  { code: 'PA-TAN-500',  name: 'Tanque Inox 500L',               unit: 'UN', type: 'Produto',    group: 'Tanques',      cost: 2800, sale: 4900, min: 1,  qty: 4  },
  { code: 'PA-TAN-1000', name: 'Tanque Inox 1000L',              unit: 'UN', type: 'Produto',    group: 'Tanques',      cost: 5200, sale: 8800, min: 1,  qty: 2  },
  { code: 'PA-GUI-800',  name: 'Guia Linear 800mm Inox',         unit: 'UN', type: 'Produto',    group: 'Automação',    cost: 290,  sale: 520,  min: 4,  qty: 18 },
  { code: 'PA-CON-INOX', name: 'Conjunto Redutor Inox',          unit: 'UN', type: 'Produto',    group: 'Conjuntos',    cost: 1400, sale: 2400, min: 2,  qty: 6  },
  { code: 'PA-SUP-EST',  name: 'Suporte Estrutural Tubular',     unit: 'UN', type: 'Produto',    group: 'Estruturas',   cost: 180,  sale: 320,  min: 8,  qty: 35 },
  { code: 'PA-GDA-1200', name: 'Guarda Industrial 1200mm',       unit: 'UN', type: 'Produto',    group: 'Proteções',    cost: 420,  sale: 740,  min: 5,  qty: 20 },
  // Matérias-primas
  { code: 'MP-CHA-2MM',  name: 'Chapa Inox 304 - 2mm',          unit: 'PC', type: 'Insumo',     group: 'Chapas',       cost: 280,  sale: 0,    min: 8,  qty: 45 },
  { code: 'MP-CHA-4MM',  name: 'Chapa Inox 304 - 4mm',          unit: 'PC', type: 'Insumo',     group: 'Chapas',       cost: 560,  sale: 0,    min: 5,  qty: 22 },
  { code: 'MP-TUB-50',   name: 'Tubo Inox 50mm Sch40',          unit: 'M',  type: 'Insumo',     group: 'Tubos',        cost: 95,   sale: 0,    min: 20, qty: 80 },
  { code: 'MP-PER-40',   name: 'Perfil U Inox 40x40mm',         unit: 'M',  type: 'Insumo',     group: 'Perfis',       cost: 48,   sale: 0,    min: 30, qty: 120 },
  { code: 'MP-BAR-25',   name: 'Barra Redonda Inox 25mm',       unit: 'M',  type: 'Insumo',     group: 'Barras',       cost: 42,   sale: 0,    min: 15, qty: 60 },
  // Componentes
  { code: 'CP-ROL-6305', name: 'Rolamento 6305-ZZ',             unit: 'UN', type: 'Componente', group: 'Rolamentos',   cost: 12.5, sale: 28,   min: 50, qty: 180 },
  { code: 'CP-ROL-6410', name: 'Rolamento 6410',                unit: 'UN', type: 'Componente', group: 'Rolamentos',   cost: 35,   sale: 75,   min: 20, qty: 45  },
  { code: 'CP-MOT-075',  name: 'Motor Elétrico 0.75kW',        unit: 'UN', type: 'Componente', group: 'Motores',      cost: 650,  sale: 1100, min: 2,  qty: 8   },
  { code: 'CP-SEL-INOX', name: 'Selo Mecânico Inox',            unit: 'UN', type: 'Componente', group: 'Vedação',      cost: 85,   sale: 180,  min: 10, qty: 30  },
  { code: 'CP-PAR-M8',   name: 'Parafuso Inox M8x25',          unit: 'CX', type: 'Consumível',  group: 'Fixação',      cost: 18,   sale: 35,   min: 20, qty: 55  },
];

// ─── Employees (10) ────────────────────────────────────────────────────────────
const EMPLOYEES_DATA = [
  { code: 'EMP-D01', fullName: 'Adriana Freitas',   dept: 'Qualidade',  salary: 4800, hire: '2022-03-01' },
  { code: 'EMP-D02', fullName: 'Bruno Carvalho',    dept: 'Produção',   salary: 3400, hire: '2020-08-15' },
  { code: 'EMP-D03', fullName: 'Cristina Moura',    dept: 'Vendas',     salary: 5200, hire: '2019-11-20' },
  { code: 'EMP-D04', fullName: 'Diego Santana',     dept: 'Produção',   salary: 3100, hire: '2021-06-10' },
  { code: 'EMP-D05', fullName: 'Elisa Fernandes',   dept: 'Compras',    salary: 4100, hire: '2023-01-05' },
  { code: 'EMP-D06', fullName: 'Fábio Gomes',       dept: 'Expedição',  salary: 3300, hire: '2022-09-12' },
  { code: 'EMP-D07', fullName: 'Gabriela Rocha',    dept: 'Financeiro', salary: 5500, hire: '2018-04-22' },
  { code: 'EMP-D08', fullName: 'Henrique Lima',     dept: 'Produção',   salary: 3200, hire: '2021-12-01' },
  { code: 'EMP-D09', fullName: 'Isabela Nunes',     dept: 'RH',         salary: 4400, hire: '2020-07-08' },
  { code: 'EMP-D10', fullName: 'Julio Pires',       dept: 'Engenharia', salary: 6200, hire: '2017-10-30' },
];

async function main() {
  console.log('🌱 Iniciando seed de demonstração...\n');
  const master = await getMaster();

  // ═══════════════════════════════════════════════════════════════
  // 1. CLIENTES
  // ═══════════════════════════════════════════════════════════════
  console.log('📋 Criando clientes...');
  const customers: Record<string, string> = {}; // code → id
  for (const c of CUSTOMERS_DATA) {
    const existing = await prisma.customer.findFirst({ where: { code: c.code } });
    if (!existing) {
      const created = await prisma.customer.create({
        data: { id: uuid(), code: c.code, name: c.name, document: c.document, active: true },
      });
      customers[c.code] = created.id;
    } else {
      customers[c.code] = existing.id;
    }
  }
  console.log(`   ✓ ${Object.keys(customers).length} clientes`);

  // ═══════════════════════════════════════════════════════════════
  // 2. FORNECEDORES
  // ═══════════════════════════════════════════════════════════════
  console.log('🏭 Criando fornecedores...');
  const suppliers: Record<string, string> = {};
  for (const s of SUPPLIERS_DATA) {
    const existing = await prisma.supplier.findFirst({ where: { code: s.code } });
    if (!existing) {
      const created = await prisma.supplier.create({
        data: { id: uuid(), code: s.code, name: s.name, document: s.document, active: true },
      });
      suppliers[s.code] = created.id;
    } else {
      suppliers[s.code] = existing.id;
    }
  }
  console.log(`   ✓ ${Object.keys(suppliers).length} fornecedores`);

  // ═══════════════════════════════════════════════════════════════
  // 3. PRODUTOS (catálogo Prisma)
  // ═══════════════════════════════════════════════════════════════
  console.log('📦 Criando produtos...');
  const products: Record<string, string> = {}; // code → id
  const defaultLoc = await prisma.location.findFirst({ where: { code: 'DEFAULT' } });
  if (!defaultLoc) throw new Error('Location DEFAULT não encontrada — execute seed.ts primeiro');

  for (const p of PRODUCTS_DATA) {
    const existing = await prisma.product.findFirst({ where: { code: p.code } });
    if (!existing) {
      const created = await prisma.product.create({
        data: {
          id: uuid(), code: p.code, name: p.name, unit: p.unit,
          productType: p.type, group: p.group,
          costPrice: dec(p.cost), salePrice: dec(p.sale), minStock: dec(p.min),
          status: 'Ativo',
          locations: { create: { locationId: defaultLoc.id, quantity: dec(p.qty) } },
        },
      });
      products[p.code] = created.id;
    } else {
      products[p.code] = existing.id;
    }
  }
  // Inclui produtos já existentes
  const allProds = await prisma.product.findMany();
  for (const p of allProds) products[p.code] = p.id;
  console.log(`   ✓ ${Object.keys(products).length} produtos no catálogo`);

  // ═══════════════════════════════════════════════════════════════
  // 4. FUNCIONÁRIOS (RH Prisma)
  // ═══════════════════════════════════════════════════════════════
  console.log('👥 Criando funcionários...');
  const employees: Record<string, string> = {};
  for (const e of EMPLOYEES_DATA) {
    const existing = await prisma.employee.findFirst({ where: { code: e.code } });
    if (!existing) {
      const created = await prisma.employee.create({
        data: { id: uuid(), code: e.code, fullName: e.fullName, department: e.dept, salaryBase: dec(e.salary), hireDate: d(e.hire), active: true },
      });
      employees[e.code] = created.id;
    } else {
      employees[e.code] = existing.id;
    }
  }
  console.log(`   ✓ ${Object.keys(employees).length} funcionários`);

  // ═══════════════════════════════════════════════════════════════
  // 5. TABELA DE PREÇOS
  // ═══════════════════════════════════════════════════════════════
  let priceTable = await prisma.priceTable.findFirst({ where: { code: 'TAB-DEMO' } });
  if (!priceTable) {
    priceTable = await prisma.priceTable.create({
      data: { id: uuid(), code: 'TAB-DEMO', name: 'Lista Demo 2026', currency: 'BRL', active: true },
    });
    const ptItems = PRODUCTS_DATA.filter((p) => p.sale > 0).map((p) => ({
      priceTableId: priceTable!.id,
      productId: products[p.code],
      price: dec(p.sale),
      minQty: null,
    }));
    await prisma.priceTableItem.createMany({ data: ptItems, skipDuplicates: true });
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. ORÇAMENTOS + PEDIDOS DE VENDA (20 pedidos em fluxo completo)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n💰 Criando fluxo de vendas (orçamentos → pedidos → OPs → expedição)...');

  interface SaleFlow {
    quoteNum: string;
    orderNum: string;
    custCode: string;
    status: string;
    kanban: string;
    daysAgoCreated: number;
    daysDelivery: number;
    items: Array<{ prodCode: string; qty: number; price: number }>;
    // Para OPs linked
    ops?: Array<{ prodCode: string; qty: number; opStatus: string; kanbanCol: string }>;
    // Para expedição
    expStatus?: string;
    // Para NF-e
    nfeStatus?: string;
    invoiced?: boolean;
  }

  const SALE_FLOWS: SaleFlow[] = [
    // ── Concluídos / Faturados ─────────────────────────────────────────────
    {
      quoteNum: 'ORC-D001', orderNum: 'PV-D001',
      custCode: 'CLI-D01', status: 'APPROVED', kanban: 'CONCLUIDO',
      daysAgoCreated: 45, daysDelivery: -10,
      items: [{ prodCode: 'PA-EIX-032', qty: 20, price: 380 }, { prodCode: 'PA-FLA-2IN', qty: 50, price: 65 }],
      ops: [{ prodCode: 'PA-EIX-032', qty: 20, opStatus: 'DONE', kanbanCol: 'DONE' }],
      expStatus: 'entregue', nfeStatus: 'AUTORIZADA', invoiced: true,
    },
    {
      quoteNum: 'ORC-D002', orderNum: 'PV-D002',
      custCode: 'CLI-D02', status: 'APPROVED', kanban: 'CONCLUIDO',
      daysAgoCreated: 40, daysDelivery: -8,
      items: [{ prodCode: 'PA-TAN-500', qty: 2, price: 4900 }],
      ops: [{ prodCode: 'PA-TAN-500', qty: 2, opStatus: 'DONE', kanbanCol: 'DONE' }],
      expStatus: 'entregue', nfeStatus: 'AUTORIZADA', invoiced: true,
    },
    {
      quoteNum: 'ORC-D003', orderNum: 'PV-D003',
      custCode: 'CLI-D03', status: 'APPROVED', kanban: 'CONCLUIDO',
      daysAgoCreated: 38, daysDelivery: -5,
      items: [{ prodCode: 'PA-GDA-1200', qty: 8, price: 740 }],
      ops: [{ prodCode: 'PA-GDA-1200', qty: 8, opStatus: 'DONE', kanbanCol: 'DONE' }],
      expStatus: 'entregue', nfeStatus: 'AUTORIZADA', invoiced: true,
    },
    // ── Em expedição ──────────────────────────────────────────────────────
    {
      quoteNum: 'ORC-D004', orderNum: 'PV-D004',
      custCode: 'CLI-D04', status: 'APPROVED', kanban: 'EXPEDICAO',
      daysAgoCreated: 30, daysDelivery: 3,
      items: [{ prodCode: 'PA-GUI-800', qty: 10, price: 520 }, { prodCode: 'CP-SEL-INOX', qty: 20, price: 180 }],
      ops: [{ prodCode: 'PA-GUI-800', qty: 10, opStatus: 'DONE', kanbanCol: 'QA' }],
      expStatus: 'conferido', nfeStatus: 'Em Digitação',
    },
    {
      quoteNum: 'ORC-D005', orderNum: 'PV-D005',
      custCode: 'CLI-D05', status: 'APPROVED', kanban: 'EXPEDICAO',
      daysAgoCreated: 28, daysDelivery: 2,
      items: [{ prodCode: 'PA-CON-INOX', qty: 3, price: 2400 }],
      ops: [{ prodCode: 'PA-CON-INOX', qty: 3, opStatus: 'DONE', kanbanCol: 'QA' }],
      expStatus: 'separado',
    },
    // ── Em produção ───────────────────────────────────────────────────────
    {
      quoteNum: 'ORC-D006', orderNum: 'PV-D006',
      custCode: 'CLI-D06', status: 'APPROVED', kanban: 'PRODUCAO',
      daysAgoCreated: 20, daysDelivery: 10,
      items: [{ prodCode: 'PA-TAN-1000', qty: 1, price: 8800 }],
      ops: [{ prodCode: 'PA-TAN-1000', qty: 1, opStatus: 'IN_PROGRESS', kanbanCol: 'WIP' }],
    },
    {
      quoteNum: 'ORC-D007', orderNum: 'PV-D007',
      custCode: 'CLI-D07', status: 'APPROVED', kanban: 'PRODUCAO',
      daysAgoCreated: 18, daysDelivery: 12,
      items: [{ prodCode: 'PA-EIX-050', qty: 5, price: 820 }, { prodCode: 'CP-ROL-6410', qty: 10, price: 75 }],
      ops: [{ prodCode: 'PA-EIX-050', qty: 5, opStatus: 'IN_PROGRESS', kanbanCol: 'WIP' }],
    },
    {
      quoteNum: 'ORC-D008', orderNum: 'PV-D008',
      custCode: 'CLI-D08', status: 'APPROVED', kanban: 'PRODUCAO',
      daysAgoCreated: 15, daysDelivery: 15,
      items: [{ prodCode: 'PA-SUP-EST', qty: 15, price: 320 }],
      ops: [{ prodCode: 'PA-SUP-EST', qty: 15, opStatus: 'RELEASED', kanbanCol: 'WIP' }],
    },
    {
      quoteNum: 'ORC-D009', orderNum: 'PV-D009',
      custCode: 'CLI-D09', status: 'APPROVED', kanban: 'PRODUCAO',
      daysAgoCreated: 12, daysDelivery: 20,
      items: [{ prodCode: 'PA-FLA-4IN', qty: 30, price: 125 }],
      ops: [{ prodCode: 'PA-FLA-4IN', qty: 30, opStatus: 'RELEASED', kanbanCol: 'BACKLOG' }],
    },
    {
      quoteNum: 'ORC-D010', orderNum: 'PV-D010',
      custCode: 'CLI-D10', status: 'APPROVED', kanban: 'PRODUCAO',
      daysAgoCreated: 10, daysDelivery: 25,
      items: [{ prodCode: 'PA-GDA-1200', qty: 12, price: 740 }],
      ops: [{ prodCode: 'PA-GDA-1200', qty: 12, opStatus: 'DRAFT', kanbanCol: 'BACKLOG' }],
    },
    // ── Aprovados (aguardando início de produção) ─────────────────────────
    {
      quoteNum: 'ORC-D011', orderNum: 'PV-D011',
      custCode: 'CLI-D11', status: 'APPROVED', kanban: 'APROVACAO',
      daysAgoCreated: 8, daysDelivery: 30,
      items: [{ prodCode: 'PA-TAN-500', qty: 1, price: 4900 }, { prodCode: 'CP-MOT-075', qty: 2, price: 1100 }],
    },
    {
      quoteNum: 'ORC-D012', orderNum: 'PV-D012',
      custCode: 'CLI-D12', status: 'APPROVED', kanban: 'APROVACAO',
      daysAgoCreated: 6, daysDelivery: 35,
      items: [{ prodCode: 'PA-EIX-032', qty: 10, price: 380 }],
    },
    // ── Pedidos em rascunho / aguardando aprovação ──────────────────────
    {
      quoteNum: 'ORC-D013', orderNum: 'PV-D013',
      custCode: 'CLI-D13', status: 'DRAFT', kanban: 'PEDIDO',
      daysAgoCreated: 4, daysDelivery: 45,
      items: [{ prodCode: 'PA-CON-INOX', qty: 2, price: 2400 }, { prodCode: 'PA-FLA-2IN', qty: 20, price: 65 }],
    },
    {
      quoteNum: 'ORC-D014', orderNum: 'PV-D014',
      custCode: 'CLI-D14', status: 'DRAFT', kanban: 'PEDIDO',
      daysAgoCreated: 3, daysDelivery: 50,
      items: [{ prodCode: 'PA-GUI-800', qty: 6, price: 520 }],
    },
    {
      quoteNum: 'ORC-D015', orderNum: 'PV-D015',
      custCode: 'CLI-D15', status: 'DRAFT', kanban: 'PEDIDO',
      daysAgoCreated: 2, daysDelivery: 60,
      items: [{ prodCode: 'PA-EIX-050', qty: 3, price: 820 }],
    },
  ];

  const createdSaleOrders: Record<string, string> = {}; // orderNum → id

  for (const flow of SALE_FLOWS) {
    const custId = customers[flow.custCode];
    if (!custId) continue;

    const existingSO = await prisma.saleOrder.findFirst({ where: { number: flow.orderNum } });
    if (existingSO) { createdSaleOrders[flow.orderNum] = existingSO.id; continue; }

    let total = dec(0);
    const lines = flow.items.map((it) => {
      const lt = dec(it.qty * it.price);
      total = total.add(lt);
      return { productId: products[it.prodCode] ?? null, quantity: dec(it.qty), unitPrice: dec(it.price), discountPct: null, lineTotal: lt };
    }).filter((l) => l.productId !== null);

    // Cria orçamento vinculado
    const quote = await prisma.quote.findFirst({ where: { number: flow.quoteNum } });
    if (!quote) {
      await prisma.quote.create({
        data: {
          id: uuid(), number: flow.quoteNum, customerId: custId, status: 'CONVERTIDO', totalAmount: total,
          items: { create: lines.map((l) => ({ productId: l.productId!, quantity: l.quantity, unitPrice: l.unitPrice, discountPct: null })) },
        },
      });
    }

    // Cria pedido de venda
    const so = await prisma.saleOrder.create({
      data: {
        id: uuid(), number: flow.orderNum,
        customer: custId ? { connect: { id: custId } } : undefined,
        status: flow.status, kanbanColumn: flow.kanban, totalAmount: total,
        deliveryDate: daysFrom(flow.daysDelivery),
        items: { create: lines as any },
      },
    });
    createdSaleOrders[flow.orderNum] = so.id;

    // Cria OPs vinculadas
    if (flow.ops) {
      const routing = await prisma.routing.findFirst();
      for (let i = 0; i < flow.ops.length; i++) {
        const op = flow.ops[i];
        const prodId = products[op.prodCode];
        if (!prodId) continue;
        const opNum = `OP-D${flow.orderNum.replace('PV-D', '')}-${String(i + 1).padStart(2, '0')}`;
        const existingWO = await prisma.workOrder.findFirst({ where: { number: opNum } });
        if (!existingWO) {
          await prisma.workOrder.create({
            data: {
              id: uuid(), number: opNum, status: op.opStatus as any,
              saleOrderId: so.id, productId: prodId, routingId: routing?.id ?? null,
              quantityPlanned: dec(op.qty),
              kanbanColumn: op.kanbanCol, kanbanOrder: i,
              dueDate: daysFrom(flow.daysDelivery - 2),
              scheduledStart: daysAgo(flow.daysAgoCreated - 2),
              scheduledEnd: daysFrom(flow.daysDelivery - 2),
              finishedAt: op.opStatus === 'DONE' ? daysAgo(5) : null,
              items: { create: { id: uuid(), productId: prodId, quantity: dec(op.qty) } },
            },
          });
        }
      }
    }

    // Cria expedição vinculada
    if (flow.expStatus) {
      const expCode = `EXP-D${flow.orderNum.replace('PV-D', '')}`;
      const existingExp = await prisma.expeditionOrder.findFirst({ where: { code: expCode } });
      if (!existingExp) {
        await prisma.expeditionOrder.create({
          data: {
            id: uuid(), code: expCode, saleOrderId: so.id, clientName: CUSTOMERS_DATA.find((c) => c.code === flow.custCode)?.name ?? '',
            status: flow.expStatus,
            scheduledAt: daysFrom(flow.daysDelivery - 1),
            shippedAt: flow.expStatus === 'entregue' ? daysAgo(Math.abs(flow.daysDelivery)) : null,
            carrier: ['Transportadora Norte','Correios PAC','Transportadora Sul','Retirada pelo cliente'][Math.floor(Math.random() * 4)],
            items: flow.items.map((it) => ({ produtoCodigo: it.prodCode, descricao: it.prodCode, quantidade: it.qty, unidade: 'UN' })),
            updatedAt: new Date(),
          },
        });
      }
    }

    // Cria NF-e vinculada
    if (flow.nfeStatus === 'AUTORIZADA') {
      const nfeNum = `${2000 + SALE_FLOWS.indexOf(flow)}`;
      const existing = await prisma.fiscalNfe.findFirst({ where: { number: nfeNum } });
      if (!existing) {
        await prisma.fiscalNfe.create({
          data: {
            id: uuid(), number: nfeNum, series: '1',
            accessKey: `352604${Date.now().toString().slice(-26)}`,
            status: 'AUTORIZADA',
            customerName: CUSTOMERS_DATA.find((c) => c.code === flow.custCode)?.name ?? '',
            totalAmount: total,
            issuedAt: daysAgo(Math.abs(flow.daysDelivery) + 1),
          },
        });
      }
    }
  }
  console.log(`   ✓ ${SALE_FLOWS.length} pedidos de venda criados`);

  // ═══════════════════════════════════════════════════════════════
  // 7. ORDENS DE COMPRA (12) — linked to production needs
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🛒 Criando ordens de compra...');
  const POS = [
    { num: 'OC-D001', supCode: 'FOR-D01', status: 'RECEBIDO',    prods: [{ code: 'MP-CHA-2MM', qty: 20, cost: 280 }, { code: 'MP-CHA-4MM', qty: 10, cost: 560 }], daysAgoIssued: 40 },
    { num: 'OC-D002', supCode: 'FOR-D06', status: 'RECEBIDO',    prods: [{ code: 'MP-TUB-50', qty: 50, cost: 95 }], daysAgoIssued: 35 },
    { num: 'OC-D003', supCode: 'FOR-D02', status: 'RECEBIDO',    prods: [{ code: 'CP-ROL-6305', qty: 200, cost: 12.5 }], daysAgoIssued: 30 },
    { num: 'OC-D004', supCode: 'FOR-D04', status: 'RECEBIDO',    prods: [{ code: 'CP-MOT-075', qty: 5, cost: 650 }], daysAgoIssued: 28 },
    { num: 'OC-D005', supCode: 'FOR-D05', status: 'RECEBIDO',    prods: [{ code: 'CP-PAR-M8', qty: 50, cost: 18 }], daysAgoIssued: 25 },
    { num: 'OC-D006', supCode: 'FOR-D01', status: 'ENVIADO',     prods: [{ code: 'MP-BAR-25', qty: 30, cost: 42 }, { code: 'MP-PER-40', qty: 40, cost: 48 }], daysAgoIssued: 10 },
    { num: 'OC-D007', supCode: 'FOR-D06', status: 'ENVIADO',     prods: [{ code: 'MP-CHA-2MM', qty: 15, cost: 280 }], daysAgoIssued: 8 },
    { num: 'OC-D008', supCode: 'FOR-D02', status: 'ENVIADO',     prods: [{ code: 'CP-ROL-6410', qty: 30, cost: 35 }], daysAgoIssued: 7 },
    { num: 'OC-D009', supCode: 'FOR-D03', status: 'RASCUNHO',    prods: [{ code: 'MP-TUB-50', qty: 80, cost: 95 }], daysAgoIssued: 3 },
    { num: 'OC-D010', supCode: 'FOR-D07', status: 'RASCUNHO',    prods: [{ code: 'CP-SEL-INOX', qty: 20, cost: 85 }], daysAgoIssued: 2 },
    { num: 'OC-D011', supCode: 'FOR-D08', status: 'RASCUNHO',    prods: [{ code: 'CP-MOT-075', qty: 3, cost: 650 }], daysAgoIssued: 1 },
    { num: 'OC-D012', supCode: 'FOR-D01', status: 'PARCIALMENTE_RECEBIDO', prods: [{ code: 'MP-CHA-4MM', qty: 20, cost: 560 }], daysAgoIssued: 15 },
  ];

  for (const po of POS) {
    const supId = suppliers[po.supCode];
    if (!supId) continue;
    const existing = await prisma.purchaseOrder.findFirst({ where: { number: po.num } });
    if (existing) continue;
    await prisma.purchaseOrder.create({
      data: {
        id: uuid(), number: po.num, supplierId: supId, status: po.status as any,
        items: {
          create: po.prods.map((p) => ({
            productId: products[p.code] ?? null,
            quantity: dec(p.qty),
            unitCost: dec(p.cost),
            receivedQty: po.status === 'RECEBIDO' ? dec(p.qty) : po.status === 'PARCIALMENTE_RECEBIDO' ? dec(p.qty / 2) : dec(0),
          })).filter((x) => x.productId !== null) as any,
        },
      },
    });
  }
  console.log(`   ✓ ${POS.length} ordens de compra`);

  // ═══════════════════════════════════════════════════════════════
  // 8. MOVIMENTAÇÕES DE ESTOQUE (vinculadas às compras e OPs)
  // ═══════════════════════════════════════════════════════════════
  const smCount = await prisma.stockMovement.count();
  if (smCount < 10) {
    console.log('\n📊 Criando movimentações de estoque...');
    const movements = [
      { type: 'ENTRADA', prodCode: 'MP-CHA-2MM', qty: 20, ref: 'OC-D001', cost: 280, dAgo: 38 },
      { type: 'ENTRADA', prodCode: 'MP-CHA-4MM', qty: 10, ref: 'OC-D001', cost: 560, dAgo: 38 },
      { type: 'ENTRADA', prodCode: 'MP-TUB-50',  qty: 50, ref: 'OC-D002', cost: 95,  dAgo: 33 },
      { type: 'ENTRADA', prodCode: 'CP-ROL-6305',qty: 200,ref: 'OC-D003', cost: 12.5,dAgo: 28 },
      { type: 'ENTRADA', prodCode: 'CP-MOT-075', qty: 5,  ref: 'OC-D004', cost: 650, dAgo: 26 },
      { type: 'SAIDA',   prodCode: 'MP-CHA-2MM', qty: 5,  ref: 'OP-D001-01', cost: 280, dAgo: 20 },
      { type: 'SAIDA',   prodCode: 'MP-TUB-50',  qty: 10, ref: 'OP-D002-01', cost: 95,  dAgo: 18 },
      { type: 'SAIDA',   prodCode: 'CP-ROL-6305',qty: 40, ref: 'OP-D007-01', cost: 12.5,dAgo: 10 },
      { type: 'SAIDA',   prodCode: 'MP-CHA-4MM', qty: 3,  ref: 'OP-D006-01', cost: 560, dAgo: 8  },
      { type: 'AJUSTE',  prodCode: 'CP-SEL-INOX',qty: 2,  ref: 'INV-2026-01', cost: 85,  dAgo: 5  },
    ];
    for (const m of movements) {
      const prodId = products[m.prodCode];
      if (!prodId) continue;
      await prisma.stockMovement.create({
        data: {
          id: uuid(), productId: prodId, locationId: defaultLoc.id,
          type: m.type as any, quantity: dec(m.qty),
          notes: `Custo unit.: R$${m.cost}`,
          reference: m.ref, userId: master.id,
          createdAt: daysAgo(m.dAgo),
        },
      });
    }
    console.log(`   ✓ ${movements.length} movimentações de estoque`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 9. CRM PROCESSOS (5 novos além dos já existentes)
  // ═══════════════════════════════════════════════════════════════
  const existingCrm = await prisma.crmProcess.count();
  if (existingCrm < 12) {
    console.log('\n🤝 Criando processos CRM adicionais...');
    const newCrms = [
      { type: 'negociacao', title: 'Contrato fornecimento anual — Tanques 2026', clientName: 'Ind. Alimentícia Bela Vista', responsible: 'Cristina Moura', stage: 'Negociação', value: dec(58800), probability: 80, priority: 'Alta', origin: 'Indicação', forecastAt: daysFrom(15) },
      { type: 'negociacao', title: 'Proposta flanges especiais offshore', clientName: 'Naval Systems do Brasil', responsible: 'Cristina Moura', stage: 'Proposta', value: dec(120000), probability: 55, priority: 'Alta', origin: 'Evento', forecastAt: daysFrom(45) },
      { type: 'suporte', title: 'Revisão técnica — tanque 500L com vazamento', clientName: 'Agroindustrial Cerrado Ltda', responsible: 'Julio Pires', stage: 'Em atendimento', value: null, probability: null, priority: 'Urgente', origin: 'Telefone', forecastAt: daysFrom(2) },
      { type: 'assistencia', title: 'Reposição de selos mecânicos — Lote 12', clientName: 'Petroquímica Sul S/A', responsible: 'Julio Pires', stage: 'Análise', value: dec(3600), probability: null, priority: 'Alta', origin: 'E-mail', forecastAt: daysFrom(7) },
      { type: 'negociacao', title: 'Expansão linha de eixos — 2027', clientName: 'TechParts Brasil S/A', responsible: 'Cristina Moura', stage: 'Lead', value: dec(250000), probability: 25, priority: 'Normal', origin: 'Site', forecastAt: daysFrom(90) },
    ];
    for (const c of newCrms) {
      await prisma.crmProcess.create({ data: { id: uuid(), ...c, customFields: null, linkedOrderId: null } });
    }
    console.log(`   ✓ 5 processos CRM adicionais`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 10. INSPEÇÕES DE QUALIDADE (vinculadas às OPs)
  // ═══════════════════════════════════════════════════════════════
  const existingInsp = await prisma.qualityInspection.count();
  if (existingInsp < 12) {
    console.log('\n🔍 Criando inspeções de qualidade adicionais...');
    const plans = await prisma.qualityInspectionPlan.findMany({ take: 4 });
    const inspections = [
      { planIdx: 2, code: 'INS-D001', type: 'acabado', prodCode: 'PA-EIX-032', prodName: 'Eixo 32mm', refDoc: 'OP-D001-01', status: 'aprovado', inspector: 'Adriana Freitas', dAgo: 12 },
      { planIdx: 2, code: 'INS-D002', type: 'acabado', prodCode: 'PA-TAN-500', prodName: 'Tanque 500L', refDoc: 'OP-D002-01', status: 'aprovado', inspector: 'Adriana Freitas', dAgo: 10 },
      { planIdx: 2, code: 'INS-D003', type: 'acabado', prodCode: 'PA-GDA-1200', prodName: 'Guarda 1200mm', refDoc: 'OP-D003-01', status: 'aprovado', inspector: 'Adriana Freitas', dAgo: 7 },
      { planIdx: 1, code: 'INS-D004', type: 'processo', prodCode: 'PA-GUI-800', prodName: 'Guia 800mm', refDoc: 'OP-D004-01', status: 'aprovado', inspector: 'Adriana Freitas', dAgo: 5 },
      { planIdx: 1, code: 'INS-D005', type: 'processo', prodCode: 'PA-CON-INOX', prodName: 'Conjunto Redutor', refDoc: 'OP-D005-01', status: 'aprovado_restricao', inspector: 'Adriana Freitas', dAgo: 4 },
      { planIdx: 0, code: 'INS-D006', type: 'recebimento', prodCode: 'MP-CHA-2MM', prodName: 'Chapa Inox 2mm', refDoc: 'OC-D001', status: 'aprovado', inspector: 'Adriana Freitas', dAgo: 38 },
      { planIdx: 0, code: 'INS-D007', type: 'recebimento', prodCode: 'MP-TUB-50', prodName: 'Tubo Inox 50mm', refDoc: 'OC-D002', status: 'aprovado', inspector: 'Adriana Freitas', dAgo: 33 },
      { planIdx: 0, code: 'INS-D008', type: 'recebimento', prodCode: 'CP-MOT-075', prodName: 'Motor 0.75kW', refDoc: 'OC-D004', status: 'reprovado', inspector: 'Adriana Freitas', dAgo: 26 },
    ];
    for (const ins of inspections) {
      const existing = await prisma.qualityInspection.findFirst({ where: { code: ins.code } });
      if (existing) continue;
      await prisma.qualityInspection.create({
        data: {
          id: uuid(), planId: plans[ins.planIdx]?.id ?? null, code: ins.code,
          type: ins.type, productCode: ins.prodCode, productName: ins.prodName,
          referenceDoc: ins.refDoc, status: ins.status, inspector: ins.inspector,
          inspectedAt: daysAgo(ins.dAgo),
          results: { items: [{ item: 'Visual', resultado: ins.status === 'aprovado' ? 'Aprovado' : 'Reprovado', conforme: ins.status !== 'reprovado' }] },
          notes: ins.status === 'reprovado' ? 'Motor com ruído anormal — devolvido ao fornecedor.' : '',
          updatedAt: new Date(),
        },
      });
    }

    // Não-conformidade vinculada à inspeção reprovada
    const existingNC = await prisma.qualityNonConformity.findFirst({ where: { code: 'NC-D001' } });
    if (!existingNC) {
      await prisma.qualityNonConformity.create({
        data: {
          id: uuid(), code: 'NC-D001',
          title: 'Motor 0.75kW com ruído anormal — OC-D004',
          description: 'Motor entregue pela FOR-D04 apresentou ruído anormal durante teste de recebimento. Não aprovado na inspeção INS-D008.',
          origin: 'Recebimento', severity: 'Crítica', status: 'em_tratamento',
          responsible: 'Elisa Fernandes', dueDate: daysFrom(5),
          correctiveAction: 'Devolver ao fornecedor e acionar garantia. Solicitar laudo técnico.',
          rootCause: 'Falha de fabricação — rolamento interno danificado.',
          updatedAt: new Date(),
        },
      });
    }
    console.log(`   ✓ 8 inspeções + 1 NC adicionais`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 11. LANÇAMENTOS CONTÁBEIS ADICIONAIS
  // ═══════════════════════════════════════════════════════════════
  const acCount = await prisma.accountEntry.count();
  if (acCount < 30) {
    console.log('\n📒 Criando lançamentos contábeis adicionais...');
    const entries = [
      // Receitas dos pedidos faturados
      { date: daysAgo(44), desc: 'Venda — PV-D001 Metalúrgica SP', deb: '1.1.2.1', cre: '4.1.1', amt: dec(10850), ref: 'PV-D001' },
      { date: daysAgo(39), desc: 'Venda — PV-D002 SiderTech',       deb: '1.1.2.1', cre: '4.1.1', amt: dec(9800),  ref: 'PV-D002' },
      { date: daysAgo(37), desc: 'Venda — PV-D003 AutoPeças Norte', deb: '1.1.2.1', cre: '4.1.1', amt: dec(5920),  ref: 'PV-D003' },
      // Recebimentos
      { date: daysAgo(38), desc: 'Recebimento PV-D001',  deb: '1.1.1.2', cre: '1.1.2.1', amt: dec(10850), ref: 'PV-D001' },
      { date: daysAgo(32), desc: 'Recebimento PV-D002',  deb: '1.1.1.2', cre: '1.1.2.1', amt: dec(9800),  ref: 'PV-D002' },
      { date: daysAgo(30), desc: 'Recebimento PV-D003',  deb: '1.1.1.2', cre: '1.1.2.1', amt: dec(5920),  ref: 'PV-D003' },
      // Compras
      { date: daysAgo(38), desc: 'Compra matéria-prima OC-D001', deb: '1.1.3.1', cre: '2.1.1.1', amt: dec(8200),  ref: 'OC-D001' },
      { date: daysAgo(33), desc: 'Compra tubos OC-D002',          deb: '1.1.3.1', cre: '2.1.1.1', amt: dec(4750),  ref: 'OC-D002' },
      { date: daysAgo(28), desc: 'Compra rolamentos OC-D003',     deb: '1.1.3.1', cre: '2.1.1.1', amt: dec(2500),  ref: 'OC-D003' },
      // Custos produção
      { date: daysAgo(20), desc: 'CPV — MP consumida OP-D001', deb: '5.1.1', cre: '1.1.3.1', amt: dec(2800), ref: 'OP-D001-01' },
      { date: daysAgo(20), desc: 'CPV — MOD OP-D001',          deb: '5.1.2', cre: '2.1.2.1', amt: dec(660),  ref: 'OP-D001-01' },
      { date: daysAgo(18), desc: 'CPV — MP consumida OP-D002', deb: '5.1.1', cre: '1.1.3.1', amt: dec(6100), ref: 'OP-D002-01' },
      { date: daysAgo(18), desc: 'CPV — MOD OP-D002',          deb: '5.1.2', cre: '2.1.2.1', amt: dec(1200), ref: 'OP-D002-01' },
      // Despesas do mês corrente
      { date: daysAgo(1),  desc: 'Salários — Maio/2026',         deb: '5.2.1', cre: '2.1.2.1', amt: dec(52000), ref: 'FP-2026-05' },
      { date: daysAgo(1),  desc: 'INSS patronal — Maio/2026',    deb: '5.2.1', cre: '2.1.3.2', amt: dec(10400), ref: 'GPS-05/26' },
    ];
    for (const e of entries) {
      await prisma.accountEntry.create({
        data: { id: uuid(), entryDate: e.date, description: e.desc, debitAccount: e.deb, creditAccount: e.cre, amount: e.amt, origin: 'AUTO', module: 'demo', referenceId: e.ref, history: e.desc },
      });
    }
    console.log(`   ✓ ${entries.length} lançamentos contábeis adicionais`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 12. CUSTEIO PADRÃO para novos produtos
  // ═══════════════════════════════════════════════════════════════
  const stdCostCount = await prisma.productStandardCost.count();
  if (stdCostCount < 20) {
    console.log('\n💲 Criando custeio padrão para novos produtos...');
    const costMap: Record<string, { mat: number; labor: number; overhead: number }> = {
      'PA-EIX-032': { mat: 110, labor: 65, overhead: 45 },
      'PA-EIX-050': { mat: 240, labor: 145, overhead: 95 },
      'PA-FLA-2IN': { mat: 18,  labor: 10,  overhead: 7  },
      'PA-FLA-4IN': { mat: 36,  labor: 20,  overhead: 12 },
      'PA-TAN-500': { mat: 1400, labor: 840, overhead: 560 },
      'PA-TAN-1000':{ mat: 2600, labor: 1560, overhead: 1040 },
      'PA-GUI-800': { mat: 145,  labor: 87,  overhead: 58 },
      'PA-CON-INOX':{ mat: 700,  labor: 420, overhead: 280 },
      'PA-SUP-EST': { mat: 90,   labor: 54,  overhead: 36 },
      'PA-GDA-1200':{ mat: 210,  labor: 126, overhead: 84 },
    };
    for (const [code, c] of Object.entries(costMap)) {
      const prodId = products[code];
      if (!prodId) continue;
      const existing = await prisma.productStandardCost.findFirst({ where: { productId: prodId } });
      if (existing) continue;
      const total = c.mat + c.labor + c.overhead;
      const prod = PRODUCTS_DATA.find((p) => p.code === code);
      const saleP = prod?.sale ?? 0;
      const margin = saleP > 0 ? ((saleP - total) / saleP) * 100 : null;
      await prisma.productStandardCost.create({
        data: {
          id: uuid(), productId: prodId,
          materialCost: dec(c.mat), laborCost: dec(c.labor), overheadCost: dec(c.overhead),
          totalCost: dec(total), salePrice: saleP > 0 ? dec(saleP) : null,
          marginPct: margin !== null ? dec(parseFloat(margin.toFixed(2))) : null,
        },
      });
    }
    console.log(`   ✓ Custeio padrão para produtos acabados`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 13. ENTITY RECORDS — contas a receber/pagar adicionais
  // ═══════════════════════════════════════════════════════════════
  const crEnt = await prisma.entity.findUnique({ where: { code: 'conta_receber' } });
  const cpEnt = await prisma.entity.findUnique({ where: { code: 'conta_pagar' } });
  const existingCR = crEnt ? await prisma.entityRecord.count({ where: { entityId: crEnt.id, deletedAt: null } }) : 0;

  if (existingCR < 15 && crEnt && cpEnt) {
    console.log('\n💳 Criando contas a receber/pagar adicionais...');
    const crRecords = [
      { descricao: 'PV-D001 — Metalúrgica SP', cliente_fornecedor: 'Metalúrgica São Paulo Ltda', categoria: 'Venda', valor: 10850, data_emissao: daysAgo(45).toISOString().slice(0,10), data_vencimento: daysAgo(15).toISOString().slice(0,10), status: 'pago', documento: 'NF-2000' },
      { descricao: 'PV-D002 — SiderTech', cliente_fornecedor: 'SiderTech Indústria S/A', categoria: 'Venda', valor: 9800, data_emissao: daysAgo(40).toISOString().slice(0,10), data_vencimento: daysAgo(10).toISOString().slice(0,10), status: 'pago', documento: 'NF-2001' },
      { descricao: 'PV-D003 — AutoPeças', cliente_fornecedor: 'AutoPeças Norte Ltda', categoria: 'Venda', valor: 5920, data_emissao: daysAgo(38).toISOString().slice(0,10), data_vencimento: daysAgo(8).toISOString().slice(0,10), status: 'pago', documento: 'NF-2002' },
      { descricao: 'PV-D004 — TechParts', cliente_fornecedor: 'TechParts Brasil S/A', categoria: 'Venda', valor: 8800, data_emissao: daysAgo(30).toISOString().slice(0,10), data_vencimento: daysFrom(0).toISOString().slice(0,10), status: 'aberto', documento: 'NF-2003' },
      { descricao: 'PV-D005 — Bela Vista', cliente_fornecedor: 'Ind. Alimentícia Bela Vista', categoria: 'Venda', valor: 7200, data_emissao: daysAgo(28).toISOString().slice(0,10), data_vencimento: daysFrom(2).toISOString().slice(0,10), status: 'aberto', documento: 'NF-2004' },
      { descricao: 'PV-D006 — Petroquímica Sul', cliente_fornecedor: 'Petroquímica Sul S/A', categoria: 'Venda', valor: 8800, data_emissao: daysAgo(20).toISOString().slice(0,10), data_vencimento: daysFrom(10).toISOString().slice(0,10), status: 'aberto', documento: 'Pré-faturamento' },
      { descricao: 'Serviço AT — Agroindustrial', cliente_fornecedor: 'Agroindustrial Cerrado Ltda', categoria: 'Serviço', valor: 1800, data_emissao: daysAgo(10).toISOString().slice(0,10), data_vencimento: daysAgo(3).toISOString().slice(0,10), status: 'vencido', documento: 'OS-2026-012' },
    ];
    for (const r of crRecords) {
      await prisma.entityRecord.create({ data: { entityId: crEnt.id, data: r, createdBy: master.id, updatedBy: master.id } });
    }

    const cpRecords = [
      { descricao: 'OC-D001 — AçoNacional', cliente_fornecedor: 'AçoNacional Distribuidora', categoria: 'Compra', valor: 8200, data_emissao: daysAgo(40).toISOString().slice(0,10), data_vencimento: daysAgo(10).toISOString().slice(0,10), status: 'pago', documento: 'NF-FON-1001' },
      { descricao: 'OC-D002 — TuboPerfil', cliente_fornecedor: 'TuboPerfil Indústria', categoria: 'Compra', valor: 4750, data_emissao: daysAgo(35).toISOString().slice(0,10), data_vencimento: daysAgo(5).toISOString().slice(0,10), status: 'pago', documento: 'NF-FON-1002' },
      { descricao: 'OC-D003 — Rolamentos Premium', cliente_fornecedor: 'Rolamentos Premium Ltda', categoria: 'Compra', valor: 2500, data_emissao: daysAgo(30).toISOString().slice(0,10), data_vencimento: daysFrom(0).toISOString().slice(0,10), status: 'aberto', documento: 'NF-FON-1003' },
      { descricao: 'OC-D004 — Motores & Cia', cliente_fornecedor: 'Motores & Cia Ltda', categoria: 'Compra', valor: 3250, data_emissao: daysAgo(28).toISOString().slice(0,10), data_vencimento: daysFrom(2).toISOString().slice(0,10), status: 'aberto', documento: 'NF-FON-1004' },
      { descricao: 'OC-D006 — AçoNacional barras/perfis', cliente_fornecedor: 'AçoNacional Distribuidora', categoria: 'Compra', valor: 3180, data_emissao: daysAgo(10).toISOString().slice(0,10), data_vencimento: daysFrom(20).toISOString().slice(0,10), status: 'aberto', documento: 'NF-FON-1006' },
      { descricao: 'Salários — Maio/2026', cliente_fornecedor: 'Folha de Pagamento', categoria: 'Serviço', valor: 52000, data_emissao: daysAgo(1).toISOString().slice(0,10), data_vencimento: daysFrom(0).toISOString().slice(0,10), status: 'aberto', documento: 'FP-2026-05' },
    ];
    for (const r of cpRecords) {
      await prisma.entityRecord.create({ data: { entityId: cpEnt.id, data: r, createdBy: master.id, updatedBy: master.id } });
    }
    console.log(`   ✓ ${crRecords.length} contas a receber + ${cpRecords.length} contas a pagar`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 14. APONTAMENTOS DE PRODUÇÃO (para OPs em andamento)
  // ═══════════════════════════════════════════════════════════════
  const apEnt = await prisma.entity.findUnique({ where: { code: 'apontamento_producao' } });
  if (apEnt) {
    const apCount = await prisma.entityRecord.count({ where: { entityId: apEnt.id, deletedAt: null } });
    if (apCount < 8) {
      console.log('\n⚙️  Criando apontamentos de produção...');
      const apontamentos = [
        { opId: 'OP-D001-01', etapa: 'Corte Laser',  operador: 'Bruno Carvalho',  setor: 'Corte Laser',  horaInicio: daysAgo(35).toISOString(), horaFim: daysAgo(35).toISOString(), quantidade: 20, refugo: 0, status: 'Finalizado', observacao: '' },
        { opId: 'OP-D001-01', etapa: 'Dobra CNC',    operador: 'Diego Santana',   setor: 'Dobra',        horaInicio: daysAgo(34).toISOString(), horaFim: daysAgo(34).toISOString(), quantidade: 20, refugo: 0, status: 'Finalizado', observacao: '' },
        { opId: 'OP-D001-01', etapa: 'Solda TIG',    operador: 'Henrique Lima',   setor: 'Solda',        horaInicio: daysAgo(33).toISOString(), horaFim: daysAgo(33).toISOString(), quantidade: 20, refugo: 1, status: 'Finalizado', observacao: '1 peça refugada por trinca' },
        { opId: 'OP-D002-01', etapa: 'Corte Laser',  operador: 'Bruno Carvalho',  setor: 'Corte Laser',  horaInicio: daysAgo(30).toISOString(), horaFim: daysAgo(30).toISOString(), quantidade: 2, refugo: 0, status: 'Finalizado', observacao: '' },
        { opId: 'OP-D002-01', etapa: 'Solda TIG',    operador: 'Henrique Lima',   setor: 'Solda',        horaInicio: daysAgo(28).toISOString(), horaFim: daysAgo(28).toISOString(), quantidade: 2, refugo: 0, status: 'Finalizado', observacao: '' },
        { opId: 'OP-D006-01', etapa: 'Corte Laser',  operador: 'Bruno Carvalho',  setor: 'Corte Laser',  horaInicio: daysAgo(15).toISOString(), horaFim: null, quantidade: null, refugo: null, status: 'Em Andamento', observacao: '' },
        { opId: 'OP-D007-01', etapa: 'Torneamento',  operador: 'Diego Santana',   setor: 'Usinagem',     horaInicio: daysAgo(12).toISOString(), horaFim: null, quantidade: null, refugo: null, status: 'Em Andamento', observacao: '' },
        { opId: 'OP-D008-01', etapa: 'Corte Laser',  operador: 'Bruno Carvalho',  setor: 'Corte Laser',  horaInicio: daysAgo(10).toISOString(), horaFim: daysAgo(10).toISOString(), quantidade: 15, refugo: 0, status: 'Finalizado', observacao: '' },
      ];
      for (const ap of apontamentos) {
        await prisma.entityRecord.create({ data: { entityId: apEnt.id, data: ap, createdBy: master.id, updatedBy: master.id } });
      }
      console.log(`   ✓ ${apontamentos.length} apontamentos de produção`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 15. NOTIFICAÇÕES para usuários dos setores
  // ═══════════════════════════════════════════════════════════════
  const users = await prisma.user.findMany({ where: { active: true } });
  const notifCount = await prisma.userNotification.count();
  if (notifCount < 20) {
    console.log('\n🔔 Criando notificações...');
    const notifTemplates = [
      { sector: 'Vendas',    type: 'info',    text: 'Novo pedido PV-D013 aguardando aprovação' },
      { sector: 'Vendas',    type: 'success', text: 'Orçamento ORC-D011 aprovado — iniciar OP' },
      { sector: 'Produção',  type: 'warning', text: 'OP-D007-01 — prazo em 12 dias' },
      { sector: 'Produção',  type: 'danger',  text: 'OP-D009-01 — material insuficiente (CHA-4MM)' },
      { sector: 'Estoque',   type: 'danger',  text: 'Estoque crítico: CP-ROL-6305 abaixo do mínimo' },
      { sector: 'Estoque',   type: 'warning', text: 'MP-BAR-25 com ressuprimento pendente — OC-D006 enviada' },
      { sector: 'Compras',   type: 'info',    text: 'OC-D006 confirmada — previsão entrega 8 dias' },
      { sector: 'Compras',   type: 'warning', text: 'OC-D012 parcialmente recebida — aguardando saldo' },
      { sector: 'Qualidade', type: 'danger',  text: 'NC-D001 aberta — Motor com defeito aguarda tratamento' },
      { sector: 'Qualidade', type: 'success', text: 'Inspeção INS-D004 aprovada — Guia 800mm liberada' },
      { sector: 'Expedição', type: 'info',    text: 'EXP-D004 — 3 pedidos aguardando emissão de NF' },
      { sector: 'Financeiro',type: 'warning', text: 'Conta a receber vencendo hoje — PV-D004 (R$8.800)' },
      { sector: 'Financeiro',type: 'danger',  text: 'OS-2026-012 vencida há 3 dias — Agroindustrial Cerrado' },
      { sector: 'RH',        type: 'info',    text: 'Férias de Gabriela Rocha aprovadas — Jul/2026' },
    ];
    for (const u of users.slice(0, 6)) {
      for (const n of notifTemplates.slice(0, 4)) {
        await prisma.userNotification.create({
          data: { userId: u.id, sector: n.sector, type: n.type, text: n.text },
        });
      }
    }
    console.log(`   ✓ Notificações criadas para ${Math.min(users.length, 6)} usuários`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 16. RESUMO FINAL
  // ═══════════════════════════════════════════════════════════════
  const [totalCust, totalProd, totalSup, totalSO, totalWO, totalPO, totalCRM, totalExp, totalInsp, totalAE, totalSC, totalER] = await Promise.all([
    prisma.customer.count(), prisma.product.count(), prisma.supplier.count(),
    prisma.saleOrder.count(), prisma.workOrder.count(), prisma.purchaseOrder.count(),
    prisma.crmProcess.count(), prisma.expeditionOrder.count(),
    prisma.qualityInspection.count(), prisma.accountEntry.count(),
    prisma.productStandardCost.count(), prisma.entityRecord.count(),
  ]);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('✅ SEED DE DEMONSTRAÇÃO CONCLUÍDO');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Clientes:             ${totalCust}`);
  console.log(`  Produtos (catálogo):  ${totalProd}`);
  console.log(`  Fornecedores:         ${totalSup}`);
  console.log(`  Pedidos de Venda:     ${totalSO}`);
  console.log(`  Ordens de Produção:   ${totalWO}`);
  console.log(`  Ordens de Compra:     ${totalPO}`);
  console.log(`  Processos CRM:        ${totalCRM}`);
  console.log(`  Ordens Expedição:     ${totalExp}`);
  console.log(`  Inspeções Qualidade:  ${totalInsp}`);
  console.log(`  Lançamentos Contáb.:  ${totalAE}`);
  console.log(`  Custeio Padrão:       ${totalSC}`);
  console.log(`  Entity Records:       ${totalER}`);
  console.log('═══════════════════════════════════════════════════\n');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('❌ Erro no seed:', e.message);
    await prisma.$disconnect();
    process.exit(1);
  });
