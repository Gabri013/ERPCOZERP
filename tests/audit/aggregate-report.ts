/**
 * Lê artifacts/audit/<run>/events.ndjson e gera RELATORIO_AUDITORIA.md + findings.json
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.env.AUDIT_LOG_DIR;
if (!dir) {
  console.error('AUDIT_LOG_DIR não definido');
  process.exit(1);
}
mkdirSync(dir, { recursive: true });

const eventsPath = join(dir, 'events.ndjson');
const lines = existsSync(eventsPath) ? readFileSync(eventsPath, 'utf8').trim().split('\n').filter(Boolean) : [];

const bySev = { CRITICO: [], ALTO: [], MEDIO: [], BAIXO: [], INFO: [] };
for (const line of lines) {
  let o;
  try {
    o = JSON.parse(line);
  } catch {
    continue;
  }
  const sev = o.severity || 'INFO';
  const bucket = bySev[sev] ?? bySev.INFO;
  bucket.push(o);
}

function section(title, emoji, items) {
  let s = `\n## ${emoji} ${title} (${items.length})\n\n`;
  if (!items.length) return s + '_Nenhum registo nesta categoria._\n';
  for (const it of items.slice(0, 200)) {
    s += `- **${it.source || '—'}** | ${it.module || it.modulo || '—'} | user: ${it.user || it.persona || '—'} | ${it.action || it.path || it.route || '—'}\n`;
    if (it.error || it.note) s += `  - ${String(it.error || it.note).slice(0, 500)}\n`;
    if (it.screenshot) s += `  - print: \`${it.screenshot}\`\n`;
  }
  if (items.length > 200) s += `\n_… e mais ${items.length - 200} ocorrências._\n`;
  return s;
}

const md =
  `# Relatório de auditoria (automático)\n\n` +
  `Gerado: ${new Date().toISOString()}\n\n` +
  `Pasta: \`${dir.replace(/\\/g, '/')}\`\n` +
  `Total de eventos: ${lines.length}\n` +
  section('CRÍTICO', '🔴', bySev.CRITICO) +
  section('ALTO', '🟠', bySev.ALTO) +
  section('MÉDIO', '🟡', bySev.MEDIO) +
  section('BAIXO', '🔵', bySev.BAIXO) +
  `\n## Cobertura\n\n` +
  `- Este relatório agrega apenas o que foi registado em \`events.ndjson\` nesta corrida.\n` +
  `- Fluxos E2E completos (CRM→OP, compras→estoque, etc.) exigem specs dedicadas ou execução manual; a varredura de rotas cobre carregamento + consola + permissão UI.\n`;

writeFileSync(join(dir, 'RELATORIO_AUDITORIA.md'), md, 'utf8');
writeFileSync(
  join(dir, 'findings.json'),
  JSON.stringify(
    {
      at: new Date().toISOString(),
      counts: {
        CRITICO: bySev.CRITICO.length,
        ALTO: bySev.ALTO.length,
        MEDIO: bySev.MEDIO.length,
        BAIXO: bySev.BAIXO.length,
        INFO: bySev.INFO.length,
      },
      samples: {
        CRITICO: bySev.CRITICO.slice(0, 50),
        ALTO: bySev.ALTO.slice(0, 50),
        MEDIO: bySev.MEDIO.slice(0, 30),
        BAIXO: bySev.BAIXO.slice(0, 30),
      },
    },
    null,
    2
  ),
  'utf8'
);

console.log('Relatório:', join(dir, 'RELATORIO_AUDITORIA.md'));
