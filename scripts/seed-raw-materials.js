/**
 * Seed idempotente de matérias-primas / catálogo SolidWorks → tabela raw_materials (Prisma).
 * Uso: na raiz do repositório: `node scripts/seed-raw-materials.js`
 * Requer: apps/backend com @prisma/client gerado, DATABASE_URL em apps/backend/.env
 */
const path = require('node:path');
const fs = require('node:fs');

const repoRoot = path.resolve(__dirname, '..');
const backendRoot = path.join(repoRoot, 'apps', 'backend');
module.paths.unshift(path.join(backendRoot, 'node_modules'));
process.chdir(backendRoot);

require('dotenv').config({ path: path.join(backendRoot, '.env') });
const { PrismaClient } = require('@prisma/client');

const DEFAULT_SUPPLIER = process.env.SEED_MATERIALS_SUPPLIER || 'COZINCA INOX';
const TSV_PATH = path.join(__dirname, 'materials-catalog.tsv');

function parseThickness(cell) {
  if (cell == null || String(cell).trim() === '') return null;
  return parseFloat(String(cell).trim().replace(',', '.'));
}

function parseTsv(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = lines[0].split('\t').map((h) => h.trim());
  const idx = (name) => header.indexOf(name);
  const ic = idx('code');
  const iname = idx('name');
  const ith = idx('thickness');
  const iu = idx('unit');
  const it = idx('materialType');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    const code = String(cols[ic] || '').trim();
    if (!code) continue;
    rows.push({
      code,
      name: String(cols[iname] || code).trim() || code,
      thickness: parseThickness(cols[ith]),
      unit: String(cols[iu] || 'un').trim().toLowerCase() || 'un',
      materialType: String(cols[it] || '').trim() || null,
      materialCode: String(cols[iname] || '').trim() || null,
    });
  }
  return rows;
}

async function main() {
  const prisma = new PrismaClient();
  const report = {
    timestamp: new Date().toISOString(),
    supplierDefault: DEFAULT_SUPPLIER,
    tsvPath: TSV_PATH,
    totalRowsInFile: 0,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    errors: [],
  };

  let raw;
  try {
    raw = fs.readFileSync(TSV_PATH, 'utf8');
  } catch (e) {
    console.error('Falha ao ler', TSV_PATH, e.message);
    process.exit(1);
  }

  const materials = parseTsv(raw);
  report.totalRowsInFile = materials.length;

  for (const row of materials) {
    try {
      const existing = await prisma.rawMaterial.findUnique({ where: { code: row.code } });
      const payload = {
        name: row.name,
        materialCode: row.materialCode,
        materialType: row.materialType,
        unit: row.unit,
        thickness: row.thickness,
        supplierDefault: DEFAULT_SUPPLIER,
      };

      if (!existing) {
        await prisma.rawMaterial.create({
          data: {
            code: row.code,
            ...payload,
          },
        });
        report.inserted += 1;
        continue;
      }

      const same =
        existing.name === payload.name &&
        (existing.materialCode || '') === (payload.materialCode || '') &&
        (existing.materialType || '') === (payload.materialType || '') &&
        (existing.unit || 'un') === (payload.unit || 'un') &&
        (existing.thickness ?? null) === (payload.thickness ?? null) &&
        existing.supplierDefault === payload.supplierDefault;

      if (same) {
        report.unchanged += 1;
        continue;
      }

      await prisma.rawMaterial.update({
        where: { code: row.code },
        data: payload,
      });
      report.updated += 1;
    } catch (e) {
      report.errors.push({ code: row.code, message: e.message });
    }
  }

  const reportMd = `# SEED_MATERIALS_REPORT

Gerado em: **${report.timestamp}**

## Parâmetros

| Campo | Valor |
|-------|--------|
| Arquivo TSV | \`${report.tsvPath}\` |
| Linhas de dados (parseadas) | ${report.totalRowsInFile} |
| Fornecedor padrão | \`${report.supplierDefault}\` |

## Resultado

| Métrica | Quantidade |
|---------|------------|
| **Novos registros** (insert) | ${report.inserted} |
| **Atualizados** (dados diferentes) | ${report.updated} |
| **Sem alteração** (já igual) | ${report.unchanged} |
| **Erros** | ${report.errors.length} |

${
  report.errors.length
    ? `## Erros\n\n${report.errors.map((e) => `- **${e.code}**: ${e.message}`).join('\n')}\n`
    : ''
}

## Observações

- Script idempotente: reexecução não duplica linhas (\`code\` único).
- Campos preenchidos: \`code\`, \`name\`, \`material_code\`, \`material_type\`, \`unit\`, \`thickness\` (quando houver), \`supplier_default\`.
`;

  fs.writeFileSync(path.join(repoRoot, 'SEED_MATERIALS_REPORT.md'), reportMd, 'utf8');

  console.log('\n=== Seed matérias-primas (raw_materials) ===');
  console.log('Fonte:', TSV_PATH);
  console.log('Linhas processadas:', report.totalRowsInFile);
  console.log('Novos:', report.inserted, '| Atualizados:', report.updated, '| Sem mudança:', report.unchanged);
  console.log('Erros:', report.errors.length);
  console.log('Relatório:', path.join(repoRoot, 'SEED_MATERIALS_REPORT.md'));
  console.log('');

  await prisma.$disconnect();
  process.exit(report.errors.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
