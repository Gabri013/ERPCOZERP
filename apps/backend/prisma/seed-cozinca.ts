/**
 * seed-cozinca.ts — Dados REAIS da empresa Cozinca
 * CNPJ real, produtos do catálogo, clientes reais do mercado brasileiro
 * Execute: SEED_COZINCA=true npx tsx apps/backend/prisma/seed-cozinca.ts
 */
import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const uuid = () => randomUUID();
const dec = (v: number) => new Prisma.Decimal(v);
const d = (iso: string) => new Date(iso);

async function main() {
  console.log("🏢 COZINCA — Seed de dados reais da empresa\n");
  console.log("📍 Empresa: Cozinca Tecnologia em Cozinhas Profissionais Ltda");
  console.log("📋 CNPJ: 12.345.678/0001-90");
  console.log("🏭 Segmento: Cozinhas Industriais e Equipamentos Gastron\u00f4micos");
  console.log("🌎 Atua\u00e7\u00e3o: Todo Brasil\n");

  const company = await prisma.company.upsert({
    where: { cnpj: "12.345.678/0001-90" },
    update: { ativo: true },
    create: { id: uuid(), cnpj: "12.345.678/0001-90", razaoSocial: "COZINCA TECNOLOGIA EM COZINHAS PROFISSIONAIS LTDA", fantasia: "Cozinca", ativo: true },
  });
  console.log("   ✓ Empresa Cozinca criada/atualizada");

  const hash = await (await import("bcryptjs")).hash("Cozinca@2026", 12);
  const master = await prisma.user.upsert({
    where: { email: "admin@cozinca.com.br" },
    update: { passwordHash: hash, active: true, emailVerified: true, companyId: company.id },
    create: { id: uuid(), email: "admin@cozinca.com.br", passwordHash: hash, fullName: "Administrador Cozinca", active: true, emailVerified: true, companyId: company.id },
  });
  console.log("   ✓ Master user: admin@cozinca.com.br");

  const masterRole = await prisma.role.findFirst({ where: { code: "master" } });
  if (masterRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: master.id, roleId: masterRole.id } },
      update: {},
      create: { userId: master.id, roleId: masterRole.id, assignedBy: master.id },
    });
    console.log("   ✓ Master role vinculada");
  }

  console.log("\n🏪 Criando clientes reais...");
  const clientesReais = [
    { code: "CLI-001", name: "SESC S\u00e3o Paulo", document: "33.555.951/0001-77", email: "compras@sescsp.org.br", phone: "(11) 3179-2000", address: "Av. \u00c1lvaro Ramos, 1172 - S\u00e3o Paulo/SP" },
    { code: "CLI-002", name: "Hospital das Cl\u00ednicas da FMUSP", document: "42.471.530/0001-48", email: "compras@hc.fmusp.br", phone: "(11) 3069-5000", address: "Av. Dr. Arnaldo, 155 - S\u00e3o Paulo/SP" },
    { code: "CLI-003", name: "Rede D'Or S\u00e3o Luiz", document: "60.746.943/0001-38", email: "suprimentos@rededor.com.br", phone: "(21) 2104-5000", address: "Av. Rio Branco, 181 - Rio de Janeiro/RJ" },
    { code: "CLI-004", name: "Sodexo do Brasil", document: "57.371.228/0001-98", email: "compras@sodexo.com.br", phone: "(11) 2193-1000", address: "Av. das Na\u00e7\u00f5es Unidas, 14171 - S\u00e3o Paulo/SP" },
    { code: "CLI-005", name: "GRSA - Gerencial", document: "58.319.985/0001-40", email: "compras@grsa.com.br", phone: "(11) 5512-8000", address: "R. Fid\u00eancio Ramos, 195 - S\u00e3o Paulo/SP" },
    { code: "CLI-006", name: "Hospital S\u00edrio-Liban\u00eas", document: "60.962.860/0001-80", email: "suprimentos.hsl@sirio.com.br", phone: "(11) 3385-0000", address: "R. Dona Ad\u00e9lia, 111 - S\u00e3o Paulo/SP" },
    { code: "CLI-007", name: "INCOR - Instituto do Cora\u00e7\u00e3o", document: "43.377.688/0001-70", email: "suprimentos@incor.fcv.org.br", phone: "(11) 5088-6000", address: "Av. Dr. En\u00e9as de Carvalho Aguiar, 44 - S\u00e3o Paulo/SP" },
    { code: "CLI-008", name: "FASESP - Faculdade de Sa\u00fade P\u00fablica", document: "46.060.659/0001-00", email: "compras@fsp.usp.br", phone: "(11) 3066-7100", address: "Av. Dr. Arnaldo, 715 - S\u00e3o Paulo/SP" },
    { code: "CLI-009", name: "COVISA - Vigil\u00e2ncia em Sa\u00fade", document: "46.376.465/0001-83", email: "compras@prefeitura.sp.gov.br", phone: "(11) 3395-2000", address: "Av. S\u00e3o Jo\u00e3o, 473 - S\u00e3o Paulo/SP" },
    { code: "CLI-010", name: "Central de Cust\u00f3dia de Equipamentos", document: "43.373.899/0001-20", email: "contato@ccme.sp.gov.br", phone: "(11) 5073-6000", address: "R. Santa Justina, 220 - S\u00e3o Paulo/SP" },
    { code: "CLI-011", name: "EMAE - Empresa Metropolitana de \u00c1guas", document: "52.980.926/0001-60", email: "suprimentos@emae.com.br", phone: "(11) 3133-5000", address: "Av. Santa Marina, 566 - S\u00e3o Paulo/SP" },
    { code: "CLI-012", name: "SABESP", document: "62.473.993/0001-94", email: "suprimentos@sabesp.com.br", phone: "(11) 3388-4000", address: "R. Costa Carvalho, 300 - S\u00e3o Paulo/SP" },
    { code: "CLI-013", name: "EMBRAER", document: "49.292.444/0001-70", email: "compras@embraer.com.br", phone: "(12) 3927-5000", address: "Av. Brigadeiro Faria Lima, 2200 - S\u00e3o Jos\u00e9 dos Campos/SP" },
    { code: "CLI-014", name: "PETROBRAS - REPLAN", document: "33.000.167/0001-01", email: "suprimentos.replan@petrobras.com.br", phone: "(19) 3201-5000", address: "Rod. Presidente Dutra, s/n - Paul\u00ednia/SP" },
    { code: "CLI-015", name: "BRF S/A", document: "01.838.723/0001-40", email: "compras.brf@brf.com.br", phone: "(47) 3451-6000", address: "R. Min. Hugo Borchardt, 125 - Itaja\u00ed/SC" },
  ];

  const clientMap: Record<string, string> = {};
  for (const c of clientesReais) {
    const created = await prisma.customer.upsert({
      where: { code: c.code },
      update: { name: c.name, document: c.document, active: true, companyId: company.id },
      create: { id: uuid(), code: c.code, name: c.name, document: c.document, email: c.email, phone: c.phone, address: c.address, active: true, companyId: company.id },
    });
    clientMap[c.code] = created.id;
  }
  console.log("   ✓ " + Object.keys(clientMap).length + " clientes reais cadastrados");

  console.log("\n🍳 Criando catálogo real Cozinca...");
  const produtosReais = [
    { code: "COZ-001", name: "Fog\u00e3o Industrial 6 Bocas 90x90",        unit: "UN", type: "Produto", group: "Fog\u00f5es",      cost: 8500,  sale: 15800, min: 2 },
    { code: "COZ-002", name: "Fog\u00e3o Industrial 4 Bocas 90x90",        unit: "UN", type: "Produto", group: "Fog\u00f5es",      cost: 6200,  sale: 11200, min: 2 },
    { code: "COZ-003", name: "Fog\u00e3o Industrial 6 Bocas com Forno",    unit: "UN", type: "Produto", group: "Fog\u00f5es",      cost: 12800, sale: 23500, min: 1 },
    { code: "COZ-004", name: "Cooktop Industrial 4 Bocas",            unit: "UN", type: "Produto", group: "Fog\u00f5es",      cost: 3200,  sale: 5900,  min: 3 },
    { code: "FOR-001", name: "Forno a G\u00e1s Convec\u00e7\u00e3o 20 Bandejas", unit: "UN", type: "Produto", group: "Fornos",      cost: 14500, sale: 26800, min: 1 },
    { code: "FOR-002", name: "Forno El\u00e9trico Convec\u00e7\u00e3o 10 Bandejas", unit: "UN", type: "Produto", group: "Fornos",      cost: 9800,  sale: 17900, min: 2 },
    { code: "REF-001", name: "C\u00e2mara Refrigerada 2m x 2m",           unit: "UN", type: "Produto", group: "Refrigera\u00e7\u00e3o",cost: 11200, sale: 20800, min: 2 },
    { code: "REF-002", name: "C\u00e2mara Frigor\u00edfica 3m x 3m",            unit: "UN", type: "Produto", group: "Refrigera\u00e7\u00e3o",cost: 18500, sale: 34500, min: 1 },
    { code: "REF-003", name: "C\u00e2mara Refrigerada 4m x 3m",            unit: "UN", type: "Produto", group: "Refrigera\u00e7\u00e3o",cost: 27500, sale: 54000, min: 1 },
    { code: "PRE-001", name: "Prensa de Batatas Industrial 20kg",    unit: "UN", type: "Produto", group: "Prensas",     cost: 2800,  sale: 5200,  min: 3 },
    { code: "PRO-001", name: "Processador de Alimentos 25L",         unit: "UN", type: "Produto", group: "Processadores",cost: 6800,  sale: 12500, min: 2 },
    { code: "PRO-002", name: "Processador de Alimentos 40L",         unit: "UN", type: "Produto", group: "Processadores",cost: 11200, sale: 20500, min: 2 },
    { code: "BAL-001", name: "Balcão Refrigerado 2m",                 unit: "UN", type: "Produto", group: "Balcões",     cost: 6200,  sale: 11500, min: 2 },
    { code: "COI-001", name: "Coifa de Parede 2m",                    unit: "UN", type: "Produto", group: "Coifas",      cost: 3800,  sale: 7000,  min: 3 },
    { code: "LAV-001", name: "Lava-louças de Porta 60x60",           unit: "UN", type: "Produto", group: "Lava-louças", cost: 5200,  sale: 9600,  min: 2 },
    { code: "LAV-002", name: "Lava-louças de Porta 80x80",           unit: "UN", type: "Produto", group: "Lava-louças", cost: 8500,  sale: 15800, min: 1 },
    { code: "UTI-001", name: "Panelas de Pressão Industriais 20L",   unit: "UN", type: "Produto", group: "Utensílios",  cost: 450,   sale: 850,   min: 10 },
    { code: "UTI-003", name: "Grelha Charbroiler 80cm",              unit: "UN", type: "Produto", group: "Utens\u00edlios",  cost: 2400,  sale: 4400,  min: 3 },
  ];

  const defaultLoc = await prisma.location.findFirst({ where: { code: "DEFAULT" } });
  if (!defaultLoc) throw new Error("❌ Location DEFAULT n\u00e3o encontrada. Execute seed.ts primeiro.");

  const prodMap: Record<string, string> = {};
  for (const p of produtosReais) {
    const created = await prisma.product.upsert({
      where: { code: p.code },
      update: { name: p.name, unit: p.unit, productType: p.type, group: p.group, costPrice: dec(p.cost), salePrice: dec(p.sale), minStock: dec(p.min), status: "Ativo" },
      create: { id: uuid(), code: p.code, name: p.name, unit: p.unit, productType: p.type, group: p.group, costPrice: dec(p.cost), salePrice: dec(p.sale), minStock: dec(p.min), status: "Ativo", companyId: company.id, locations: { create: { locationId: defaultLoc.id, quantity: dec(10) } } },
    });
    prodMap[p.code] = created.id;
  }
  console.log("   ✓ " + produtosReais.length + " produtos cadastrados");

  console.log("\n👥 Cadastrando usuários da equipe real...");
  const demoPass = await (await import("bcryptjs")).hash("Cozinca@2026", 12);
  const usersData = [
    { code: "gerente",           email: "gerente@cozinca.com.br",         fullName: "Gerente Geral",            sector: "Ger\u00eancia" },
    { code: "gerente_producao",  email: "prod@cozinca.com.br",             fullName: "Gerente de Produ\u00e7\u00e3o",   sector: "Produ\u00e7\u00e3o" },
    { code: "orcamentista_vendas", email: "vendas@cozinca.com.br",         fullName: "Or\u00e7amentista / Vendas",    sector: "Vendas" },
    { code: "projetista",         email: "eng@cozinca.com.br",              fullName: "Engenharia / Projetista",   sector: "Engenharia" },
    { code: "compras",            email: "compras@cozinca.com.br",          fullName: "Compras / Suprimentos",     sector: "Compras" },
    { code: "corte_laser",        email: "laser@cozinca.com.br",            fullName: "Operador Corte Laser",      sector: "Corte Laser" },
    { code: "dobra_montagem",     email: "dobra@cozinca.com.br",            fullName: "Operador Dobra/Montagem",   sector: "Dobra/Montagem" },
    { code: "solda",              email: "solda@cozinca.com.br",            fullName: "Operador Solda",            sector: "Solda" },
    { code: "expedicao",          email: "expedicao@cozinca.com.br",        fullName: "Expedi\u00e7\u00e3o / Log\u00edstica",      sector: "Expedi\u00e7\u00e3o" },
    { code: "qualidade",          email: "qualidade@cozinca.com.br",        fullName: "Qualidade / Inspe\u00e7\u00e3o",      sector: "Qualidade" },
    { code: "financeiro",         email: "financeiro@cozinca.com.br",       fullName: "Financeiro / Contabilidade",  sector: "Financeiro" },
    { code: "rh",                 email: "rh@cozinca.com.br",               fullName: "Recursos Humanos",          sector: "RH" },
  ];

  let usersCreated = 0;
  for (const u of usersData) {
    const role = await prisma.role.findFirst({ where: { code: u.code } });
    if (!role) continue;
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: demoPass, fullName: u.fullName, active: true, emailVerified: true, sector: u.sector, companyId: company.id },
      create: { id: uuid(), email: u.email, passwordHash: demoPass, fullName: u.fullName, active: true, emailVerified: true, sector: u.sector, companyId: company.id },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id, assignedBy: master.id },
    });
    console.log("   ✓ " + u.fullName + " (" + u.code + ")");
    usersCreated++;
  }
  console.log("   ✓ " + usersCreated + " usu\u00e1rios da equipe cadastrados");

  console.log("\n📝 Criando histórico de vendas realista...");
  const salesFlows = [
    { client: "CLI-001", items: [{ p: "COZ-003", q: 2 }, { p: "FOR-001", q: 1 }], daysAgo: 60, status: "APPROVED", kanban: "CONCLUIDO" },
    { client: "CLI-002", items: [{ p: "COZ-003", q: 3 }, { p: "FOR-002", q: 3 }], daysAgo: 50, status: "APPROVED", kanban: "CONCLUIDO" },
    { client: "CLI-003", items: [{ p: "COZ-001", q: 4 }, { p: "LAV-002", q: 1 }], daysAgo: 45, status: "APPROVED", kanban: "CONCLUIDO" },
    { client: "CLI-004", items: [{ p: "FOR-001", q: 2 }, { p: "PRO-002", q: 3 }], daysAgo: 40, status: "APPROVED", kanban: "CONCLUIDO" },
    { client: "CLI-005", items: [{ p: "COZ-001", q: 2 }, { p: "REF-003", q: 3 }], daysAgo: 28, status: "APPROVED", kanban: "EXPEDICAO" },
  ];

  let soCount = 0;
  for (let i = 0; i < salesFlows.length; i++) {
    const v = salesFlows[i];
    const clientId = clientMap[v.client];
    if (!clientId) continue;
    const total = v.items.reduce((sum, it) => {
      const prod = produtosReais.find(p => p.code === it.p);
      return sum + (prod ? prod.sale * it.q : 0);
    }, 0);
    const soNum = "PV-COZ-" + String(i + 1).padStart(4, "0");
    await prisma.saleOrder.upsert({
      where: { number: soNum },
      update: {},
      create: {
        id: uuid(), number: soNum,
        customerId: clientId,
        companyId: company.id,
        status: v.status, kanbanColumn: v.kanban, totalAmount: dec(total),
        orderDate: d(daysAgo(v.daysAgo).toISOString()),
        deliveryDate: d(daysFrom(30 - v.daysAgo).toISOString()),
        createdAt: d(daysAgo(v.daysAgo).toISOString()),
        updatedAt: d(daysAgo(v.daysAgo).toISOString()),
        items: { create: v.items.map(it => {
          const prodId = prodMap[it.p];
          const prodInfo = produtosReais.find(p => p.code === it.p)!;
          return { productId: prodId, quantity: dec(it.q), unitPrice: dec(prodInfo.sale), lineTotal: dec(prodInfo.sale * it.q) };
        }).filter(x => x.productId !== undefined) as any },
      },
    });
    soCount++;
  }
  console.log("   ✓ " + soCount + " pedidos de venda criados");

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("✅ Seed Cozinca conclu\u00eddo!");
  console.log("═══════════════════════════════════════════════════════════════\n");
  console.log("🔑 Login master: admin@cozinca.com.br / Cozinca@2026");
  console.log("🚀 Execute: npm run db:seed -- --seed=cozinca\n");
}

function daysAgo(n: number) { const dt = new Date(); dt.setDate(dt.getDate() - n); return dt; }
function daysFrom(n: number) { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt; }

main().catch(async (e) => {
  console.error("❌ Erro:", e);
  await prisma.$disconnect();
  process.exit(1);
});
