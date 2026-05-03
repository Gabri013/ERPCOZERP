/**
 * Logger NDJSON para corridas de auditoria (E2E + backend).
 * Define AUDIT_LOG_DIR no arranque; cada linha é um objeto JSON (uma ocorrência).
 */
import { mkdirSync, appendFileSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const EVENTS = 'events.ndjson';

export function getAuditDir() {
  const dir = process.env.AUDIT_LOG_DIR;
  if (!dir) return null;
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function auditLog(entry) {
  const dir = getAuditDir();
  if (!dir) return;
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
  appendFileSync(join(dir, EVENTS), line, 'utf8');
}

export function writeAuditSummary(extra = {}) {
  const dir = getAuditDir();
  if (!dir) return;
  const path = join(dir, 'summary.json');
  const counts = { CRITICO: 0, ALTO: 0, MEDIO: 0, BAIXO: 0, INFO: 0 };
  const eventsPath = join(dir, EVENTS);
  if (existsSync(eventsPath)) {
    const raw = readFileSync(eventsPath, 'utf8').trim();
    if (raw) {
      for (const line of raw.split('\n')) {
        try {
          const o = JSON.parse(line);
          const s = o.severity || o.Severity;
          if (s && counts[s] !== undefined) counts[s]++;
          else counts.INFO++;
        } catch {
          counts.INFO++;
        }
      }
    }
  }
  writeFileSync(
    path,
    JSON.stringify({ generatedAt: new Date().toISOString(), counts, ...extra }, null, 2),
    'utf8'
  );
}
