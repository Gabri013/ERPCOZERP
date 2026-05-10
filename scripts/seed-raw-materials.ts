/**
 * Seed de matérias-primas e componentes industriais — COZINCA INOX
 *
 * Execução:  node scripts/seed-raw-materials.js
 * NPM:       npm run seed:materials  (raiz do monorepo)
 *
 * Idempotente: usa upsert por `code` — nunca duplica.
 * DATABASE_URL: lido de apps/backend/.env → .env → variável de ambiente → default docker.
 */

'use strict';

const path = require('path');
const fs   = require('fs');

// Carrega .env (tenta backend primeiro, depois raiz)
function loadEnv() {
  const candidates = [
    path.resolve(__dirname, '../apps/backend/.env'),
    path.resolve(__dirname, '../.env'),
  ];
  for (const f of candidates) {
    if (fs.existsSync(f)) {
      const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
      for (const line of lines) {
        const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (m && !process.env[m[1]]) {
          process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
        }
      }
      break;
    }
  }
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL =
      'postgresql://erpcoz:erpcozpass@127.0.0.1:5432/erpcoz';
  }
}

loadEnv();

// Prisma Client gerado em apps/backend
const { PrismaClient } = require(
  path.resolve(__dirname, '../apps/backend/node_modules/.prisma/client')
);

// ─── Catálogo completo ────────────────────────────────────────────────────────

const SUPPLIER_DEFAULT = 'COZINCA INOX';

/**
 * @type {Array<{
 *   code: string,
 *   name: string,
 *   materialType: string,
 *   thickness?: number,
 *   unit: string,
 *   supplierDefault: string,
 * }>}
 */
const MATERIALS = [
  // ─── INOX ────────────────────────────────────────────────────────────────
  { code: '1000087', name: 'Chapa Inox #304 – 0,5 mm', materialType: 'INOX', thickness: 0.5,  unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1000075', name: 'Chapa Inox #304 – 0,8 mm', materialType: 'INOX', thickness: 0.8,  unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1000012', name: 'Chapa Inox #304 – 1,0 mm', materialType: 'INOX', thickness: 1.0,  unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1000103', name: 'Chapa Inox #304 – 1,2 mm', materialType: 'INOX', thickness: 1.2,  unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1000073', name: 'Chapa Inox #304 – 1,5 mm', materialType: 'INOX', thickness: 1.5,  unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1000108', name: 'Chapa Inox #304 – 2,0 mm', materialType: 'INOX', thickness: 2.0,  unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1000088', name: 'Chapa Inox #304 – 3,0 mm', materialType: 'INOX', thickness: 3.0,  unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1000018', name: 'Chapa Inox #430 – 0,5 mm', materialType: 'INOX', thickness: 0.5,  unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1000043', name: 'Chapa Inox #430 – 0,8 mm', materialType: 'INOX', thickness: 0.8,  unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1000030', name: 'Chapa Inox #430 – 0,7 mm', materialType: 'INOX', thickness: 0.7,  unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1000046', name: 'Chapa Inox #430 – 1,0 mm', materialType: 'INOX', thickness: 1.0,  unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1000057', name: 'Chapa Inox #430 – 1,2 mm', materialType: 'INOX', thickness: 1.2,  unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1000127', name: 'Chapa Inox #430 – 1,5 mm', materialType: 'INOX', thickness: 1.5,  unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1000068', name: 'Chapa Inox #430 – 2,0 mm', materialType: 'INOX', thickness: 2.0,  unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1000140', name: 'Chapa Inox #200 – 0,5 mm', materialType: 'INOX', thickness: 0.5,  unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1000001', name: 'Chapa Inox #200 – 0,8 mm', materialType: 'INOX', thickness: 0.8,  unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1000181', name: 'Chapa Inox #430 2B – 0,5 mm', materialType: 'INOX', thickness: 0.5, unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1000188', name: 'Chapa Inox #430 2B – 0,8 mm', materialType: 'INOX', thickness: 0.8, unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1000003', name: 'Chapa Inox #200 – 1,0 mm', materialType: 'INOX', thickness: 1.0,  unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1000095', name: 'Chapa Inox #304 Perfurada – 0,6 mm', materialType: 'INOX', thickness: 0.6, unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },

  // ─── ALUMÍNIO ─────────────────────────────────────────────────────────────
  { code: '1050048', name: 'Chapa Alumínio – 0,5 mm', materialType: 'ALUMINIO', thickness: 0.5, unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1050025', name: 'Chapa Alumínio – 0,8 mm', materialType: 'ALUMINIO', thickness: 0.8, unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1050057', name: 'Chapa Alumínio – 3,0 mm', materialType: 'ALUMINIO', thickness: 3.0, unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1050108', name: 'Chapa Alumínio – 1,0 mm', materialType: 'ALUMINIO', thickness: 1.0, unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1050149', name: 'Chapa Alumínio – 2,0 mm', materialType: 'ALUMINIO', thickness: 2.0, unit: 'kg', supplierDefault: SUPPLIER_DEFAULT },

  // ─── PLÁSTICOS / DIVERSOS ─────────────────────────────────────────────────
  { code: '1007921', name: 'Perfil Borracha Vedação – PERF-R-V-P', materialType: 'PLASTICO', unit: 'un', supplierDefault: 'A definir' },
  { code: '1007711', name: 'Perfil Fêmea-Macho Cinza 1007711',     materialType: 'PLASTICO', unit: 'un', supplierDefault: 'A definir' },
  { code: '1007712', name: 'Perfil Fêmea-Macho Cinza 1007712',     materialType: 'PLASTICO', unit: 'un', supplierDefault: 'A definir' },
  { code: '1007834', name: 'Porta-Etiqueta Mod. SERAL – Preto',    materialType: 'PLASTICO', unit: 'un', supplierDefault: 'A definir' },
  { code: '1008036', name: 'PF União CH 20mm',                     materialType: 'PLASTICO', unit: 'un', supplierDefault: 'A definir' },
  { code: '1012043', name: 'Placa Fibra Cerâmica (1012043)',        materialType: 'CERAMICA', unit: 'un', supplierDefault: 'A definir' },
  { code: '1012293', name: 'Manta Cerâmica',                       materialType: 'CERAMICA', unit: 'un', supplierDefault: 'A definir' },
  { code: '1012005', name: 'Lã de Rocha (1012005)',                materialType: 'ISOLANTE', unit: 'un', supplierDefault: 'A definir' },
  { code: '1050060', name: 'Tela Fibra Preta',                     materialType: 'TECIDO',   unit: 'un', supplierDefault: 'A definir' },
  { code: '1006887', name: 'Fuso Trapezoidal TR8x8mm',             materialType: 'METAL',    unit: 'un', supplierDefault: 'A definir' },
  { code: '1006886', name: 'Eixo Linear 8mm Inox',                 materialType: 'METAL',    unit: 'un', supplierDefault: 'A definir' },
  { code: '1006897', name: 'Correia GT2 6mm',                      materialType: 'BORRACHA', unit: 'un', supplierDefault: 'A definir' },
  { code: '1007700', name: 'Gaxeta Silicone Tipo E 16x20mm',       materialType: 'BORRACHA', unit: 'un', supplierDefault: 'A definir' },

  // ─── TUBOS INOX ───────────────────────────────────────────────────────────
  { code: '1003004', name: 'Tubo Inox Ø1.1/2" x 1mm',             materialType: 'TUBO_INOX', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003008', name: 'Tubo Inox Ø3/4" x 1mm',               materialType: 'TUBO_INOX', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003005', name: 'Tubo Inox Ø1.1/4" x 1mm',             materialType: 'TUBO_INOX', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003012', name: 'Tubo Inox Ø1" x 1mm',                 materialType: 'TUBO_INOX', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003046', name: 'Tubo Inox Quadrado 40x40x1mm',         materialType: 'TUBO_INOX', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003009', name: 'Tubo Inox Retangular 30x20x1mm',       materialType: 'TUBO_INOX', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003051', name: 'Tubo Inox Ø1/2" x 1mm',               materialType: 'TUBO_INOX', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003023', name: 'Tubo Inox Ø1" x 1,5mm',               materialType: 'TUBO_INOX', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1004582', name: 'Tubo Inox Quadrado 40x40x1,2mm',       materialType: 'TUBO_INOX', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003056', name: 'Tubo Inox Quadrado 30x30x1,2mm',       materialType: 'TUBO_INOX', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003054', name: 'Tubo Inox Quadrado 25x25x1mm',         materialType: 'TUBO_INOX', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003028', name: 'Tubo Inox Ø2" x 1,2mm',               materialType: 'TUBO_INOX', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003025', name: 'Tubo Inox Ø1.1/4" x 1,5mm',           materialType: 'TUBO_INOX', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003042', name: 'Tubo Inox Ø1.1/2" x 1mm Escovado',    materialType: 'TUBO_INOX', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1004601', name: 'Tubo Inox Quadrado 25x25x3mm',         materialType: 'TUBO_INOX', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003024', name: 'Tubo Inox Ø1/2" x 1,5mm',             materialType: 'TUBO_INOX', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003053', name: 'Tubo Inox Retangular 40x20x1mm',       materialType: 'TUBO_INOX', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003061', name: 'Tubo Inox Ø3/4" x 1,5mm',             materialType: 'TUBO_INOX', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1007151', name: 'Tubo Inox Ø4" x 1,5mm',               materialType: 'TUBO_INOX', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },

  // ─── AÇO CARBONO / GALVANIZADO ────────────────────────────────────────────
  { code: '1004513', name: 'Cantoneira 1.1/4" x 3/16" – Carbono', materialType: 'ACO_CARBONO',    unit: 'm', supplierDefault: 'A definir' },
  { code: '1001503', name: 'Chapa Galvanizada – 0,9 mm',           materialType: 'ACO_GALVANIZADO', unit: 'kg', supplierDefault: 'A definir' },
  { code: '1001502', name: 'Chapa Galvanizada – 0,5 mm',           materialType: 'ACO_GALVANIZADO', unit: 'kg', supplierDefault: 'A definir' },
  { code: '1001504', name: 'Chapa Galvanizada – 1,2 mm',           materialType: 'ACO_GALVANIZADO', unit: 'kg', supplierDefault: 'A definir' },
  { code: '1001550', name: 'Chapa Galvanizada – 1,5 mm',           materialType: 'ACO_GALVANIZADO', unit: 'kg', supplierDefault: 'A definir' },
  { code: '1001512', name: 'Chapa Aço 1020 – 4,75 mm',            materialType: 'ACO_CARBONO',    unit: 'kg', supplierDefault: 'A definir' },
  { code: '1001528', name: 'Chapa Aço 1020 – 3/8" (526x448mm)',   materialType: 'ACO_CARBONO',    unit: 'kg', supplierDefault: 'A definir' },
  { code: '1001529', name: 'Chapa Aço 1020 – 3/8" (900x650mm)',   materialType: 'ACO_CARBONO',    unit: 'kg', supplierDefault: 'A definir' },
  { code: '1001511', name: 'Chapa Aço 1020 – 2,0 mm',             materialType: 'ACO_CARBONO',    unit: 'kg', supplierDefault: 'A definir' },
  { code: '1004579', name: 'Chapa Aço 1020 – 5/8"',               materialType: 'ACO_CARBONO',    unit: 'kg', supplierDefault: 'A definir' },

  // ─── TUBOS AÇO CARBONO ────────────────────────────────────────────────────
  { code: '1004552', name: 'Tubo Aço SCH Ø33,4x3,38mm',           materialType: 'TUBO_ACO', unit: 'm', supplierDefault: 'A definir' },
  { code: '1004588', name: 'Tubo Galvanizado Quadrado 20x20x0,8mm',materialType: 'TUBO_ACO', unit: 'm', supplierDefault: 'A definir' },
  { code: '1004530', name: 'Tubo Carbono Quadrado 25x25x3,0mm',    materialType: 'TUBO_ACO', unit: 'm', supplierDefault: 'A definir' },
  { code: '1004567', name: 'Tubo Aço SCH-80 Ø3/4"',               materialType: 'TUBO_ACO', unit: 'm', supplierDefault: 'A definir' },
  { code: '1004525', name: 'Tubo Carbono Ø1" x 2,1mm',            materialType: 'TUBO_ACO', unit: 'm', supplierDefault: 'A definir' },
  { code: '1004587', name: 'Tubo Aço SCH 3/4 Ø26,7x2,83mm',      materialType: 'TUBO_ACO', unit: 'm', supplierDefault: 'A definir' },

  // ─── BARRAS REDONDAS INOX ─────────────────────────────────────────────────
  { code: '1003027', name: 'Barra Inox Redonda Ø5/16"',            materialType: 'BARRA_REDONDA', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003026', name: 'Barra Inox Redonda Ø1/4"',             materialType: 'BARRA_REDONDA', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003036', name: 'Barra Inox Redonda Ø3/8"',             materialType: 'BARRA_REDONDA', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003022', name: 'Barra Inox Redonda Ø1/2"',             materialType: 'BARRA_REDONDA', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1006523', name: 'Barra Redonda Ø5/16"',                 materialType: 'BARRA_REDONDA', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003044', name: 'Barra Inox Redonda Ø3/16"',            materialType: 'BARRA_REDONDA', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1006364', name: 'Barra Redonda Ø3/4"',                  materialType: 'BARRA_REDONDA', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },

  // ─── TUBOS COBRE ──────────────────────────────────────────────────────────
  { code: '1007599', name: 'Tubo Cobre Ø1/4"',                     materialType: 'TUBO_COBRE', unit: 'm', supplierDefault: 'A definir' },
  { code: '1004507', name: 'Tubo Cobre Ø5/16"',                    materialType: 'TUBO_COBRE', unit: 'm', supplierDefault: 'A definir' },
  { code: '1007600', name: 'Tubo Cobre Ø3/8"',                     materialType: 'TUBO_COBRE', unit: 'm', supplierDefault: 'A definir' },
  { code: '1007944', name: 'Tubo Cobre Ø5/8"',                     materialType: 'TUBO_COBRE', unit: 'm', supplierDefault: 'A definir' },

  // ─── TUBOS INOX SCHEDULE ──────────────────────────────────────────────────
  { code: '1003015', name: 'Tubo Inox SCH-40 Ø3/4"',              materialType: 'TUBO_INOX_SCH', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003016', name: 'Tubo Inox SCH-40 Ø1"',                materialType: 'TUBO_INOX_SCH', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003055', name: 'Tubo Inox SCH-40 Ø1/2"',              materialType: 'TUBO_INOX_SCH', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003037', name: "Tubo Inox SCH-5 Ø1.1/2\"",            materialType: 'TUBO_INOX_SCH', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003062', name: 'Tubo Inox SCH-10 Ø2"',                materialType: 'TUBO_INOX_SCH', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003029', name: "Tubo Inox SCH-10 Ø1.1/2\"",           materialType: 'TUBO_INOX_SCH', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },
  { code: '1003041', name: 'Tubo Inox SCH-40 Ø3/8"',              materialType: 'TUBO_INOX_SCH', unit: 'm', supplierDefault: SUPPLIER_DEFAULT },

  // ─── PERFIS ALUMÍNIO ──────────────────────────────────────────────────────
  { code: '1006788', name: 'Perfil Alumínio Canaleta Fêmea LED',   materialType: 'PERFIL_ALUMINIO', unit: 'm', supplierDefault: 'A definir' },
  { code: '1006837', name: 'Perfil Alumínio Sobrepor LED',          materialType: 'PERFIL_ALUMINIO', unit: 'm', supplierDefault: 'A definir' },
  { code: '1006789', name: 'Perfil Alumínio Sobrepor Fosco LED',    materialType: 'PERFIL_ALUMINIO', unit: 'm', supplierDefault: 'A definir' },
  { code: '1004606', name: 'Perfil Puxador SP-0116',                materialType: 'PERFIL_ALUMINIO', unit: 'm', supplierDefault: 'A definir' },
  { code: '1007167', name: 'Trilho Alumínio',                       materialType: 'PERFIL_ALUMINIO', unit: 'm', supplierDefault: 'A definir' },

  // ─── PERFIS PLÁSTICO ──────────────────────────────────────────────────────
  { code: '1007713', name: 'Perfil Engaste Gaxeta Cinza',           materialType: 'PERFIL_PLASTICO', unit: 'un', supplierDefault: 'A definir' },
  { code: '1007998', name: 'Perfil Porta Corrediça Vidro',          materialType: 'PERFIL_PLASTICO', unit: 'un', supplierDefault: 'A definir' },
  { code: '1006844', name: 'Perfil Tampa Lateral Porta D',          materialType: 'PERFIL_PLASTICO', unit: 'un', supplierDefault: 'A definir' },
  { code: '1050080', name: 'Perfil ME30P',                          materialType: 'PERFIL_PLASTICO', unit: 'un', supplierDefault: 'A definir' },

  // ─── TUBOS ALUMÍNIO ───────────────────────────────────────────────────────
  { code: '1004506', name: 'Tubo Alumínio Ø33,4x3,38mm',           materialType: 'TUBO_ALUMINIO', unit: 'm', supplierDefault: 'A definir' },
  { code: '1004505', name: 'Tubo Alumínio Ø3/8" x 1,00mm',         materialType: 'TUBO_ALUMINIO', unit: 'm', supplierDefault: 'A definir' },

  // ─── TUBOS PVC ────────────────────────────────────────────────────────────
  { code: '1004548', name: 'Tubo PVC Ø3/4"',                       materialType: 'TUBO_PVC', unit: 'm', supplierDefault: 'A definir' },
  { code: '1004532', name: 'Tubo PVC Ø25mm',                       materialType: 'TUBO_PVC', unit: 'm', supplierDefault: 'A definir' },

  // ─── ELÉTRICO / MANGUEIRA ─────────────────────────────────────────────────
  { code: '1006506',  name: 'Fita LED 12V',                        materialType: 'ELETRICO',  unit: 'm', supplierDefault: 'A definir' },
  { code: '10050262', name: 'Mangueira Corrugada 1.1/2"',          materialType: 'MANGUEIRA', unit: 'm', supplierDefault: 'A definir' },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

async function main() {
  const prisma = new PrismaClient();
  const report = { inserted: 0, updated: 0, skipped: 0, errors: [] };
  const startTime = Date.now();

  try {
    for (const mat of MATERIALS) {
      try {
        const existing = await prisma.rawMaterial.findUnique({
          where: { code: mat.code },
        });

        const data = {
          name:            mat.name,
          materialType:    mat.materialType,
          unit:            mat.unit,
          supplierDefault: mat.supplierDefault,
          ...(mat.thickness != null ? { thickness: mat.thickness } : {}),
        };

        if (!existing) {
          await prisma.rawMaterial.create({
            data: { code: mat.code, ...data },
          });
          report.inserted++;
          process.stdout.write(`  ✓ CRIADO  [${mat.code}] ${mat.name}\n`);
        } else {
          // Atualiza apenas campos faltantes
          const needsUpdate =
            !existing.materialType ||
            !existing.unit ||
            (mat.thickness != null && existing.thickness == null);

          if (needsUpdate) {
            await prisma.rawMaterial.update({
              where: { code: mat.code },
              data,
            });
            report.updated++;
            process.stdout.write(`  ~ ATUALIZ [${mat.code}] ${mat.name}\n`);
          } else {
            report.skipped++;
            process.stdout.write(`  - PULADO  [${mat.code}] ${mat.name}\n`);
          }
        }
      } catch (err) {
        report.errors.push({ code: mat.code, error: err.message });
        process.stderr.write(`  ✗ ERRO    [${mat.code}] ${err.message}\n`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n══════════════════════════════════════════════════════');
  console.log(`  SEED MATERIAIS — concluído em ${elapsed}s`);
  console.log('──────────────────────────────────────────────────────');
  console.log(`  Total na lista : ${MATERIALS.length}`);
  console.log(`  Inseridos      : ${report.inserted}`);
  console.log(`  Atualizados    : ${report.updated}`);
  console.log(`  Pulados        : ${report.skipped}`);
  console.log(`  Erros          : ${report.errors.length}`);
  if (report.errors.length) {
    console.log('\n  Erros detalhados:');
    report.errors.forEach(e => console.log(`    [${e.code}] ${e.error}`));
  }
  console.log('══════════════════════════════════════════════════════\n');

  // Persiste relatório
  const reportPath = require('path').resolve(__dirname, '../SEED_MATERIALS_REPORT.md');
  const now = new Date().toISOString().slice(0, 10);
  const md = [
    '# SEED_MATERIALS_REPORT',
    '',
    `**Data:** ${now}`,
    `**Duração:** ${elapsed}s`,
    '',
    '## Resumo',
    '',
    `| Métrica | Valor |`,
    `|---------|-------|`,
    `| Total na lista | ${MATERIALS.length} |`,
    `| Inseridos | ${report.inserted} |`,
    `| Atualizados | ${report.updated} |`,
    `| Pulados (já existiam) | ${report.skipped} |`,
    `| Erros | ${report.errors.length} |`,
    '',
    '## Materiais processados',
    '',
    '| Código | Nome | Tipo | Espessura | Unidade | Fornecedor | Resultado |',
    '|--------|------|------|-----------|---------|------------|-----------|',
    ...MATERIALS.map(m => {
      const err = report.errors.find(e => e.code === m.code);
      const res = err ? '❌ Erro' : '✅';
      return `| ${m.code} | ${m.name} | ${m.materialType} | ${m.thickness ?? '—'} | ${m.unit} | ${m.supplierDefault} | ${res} |`;
    }),
    '',
    report.errors.length
      ? ['## Erros', '', ...report.errors.map(e => `- \`${e.code}\`: ${e.error}`), ''].join('\n')
      : '',
  ].join('\n');

  require('fs').writeFileSync(reportPath, md, 'utf8');
  console.log(`  Relatório gravado em SEED_MATERIALS_REPORT.md\n`);

  if (report.errors.length) process.exit(1);
}

main().catch(err => {
  console.error('Falha fatal no seed:', err.message);
  process.exit(1);
});
